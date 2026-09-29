#!/usr/bin/env python3
"""
app.py — local engagement-workspace app for the OSCP cheatsheet: serves the
frontend (templates/ + static/) AND the JSON API on the same Flask app.

!!! WARNING — THIS IS EFFECTIVELY REMOTE CODE EXECUTION BY DESIGN !!!
/api/run launches arbitrary shell commands (built from templates you control,
with your target's IP/domain filled in) in a new terminal window. That is the
whole point of the "click to run" feature. This process must NEVER be bound to
anything but 127.0.0.1, and must NEVER be exposed to a LAN/VPN/the internet
(no 0.0.0.0, no reverse proxy, no port-forward). Anyone who can reach this
port can execute anything on your machine.

Run with:
    python3 app.py
Requires:
    pip install flask
Then open http://127.0.0.1:5001 — this single process serves both the page
and the API (see static/js/app.js's API_BASE, which is relative/same-origin).

Routes stay thin here; the actual work lives in core/:
  core/projects.py    project folders, project.json, create/switch/list,
                       per-project checklist.json state
  core/runner.py       native terminal launch + command templating
  core/parsers.py       nmap XML + rustscan output -> JSON parsing
  core/checklists.py    service -> checklist mapping + playbook tool presets
  core/netinfo.py       local network interface IPs (Attacker IP dropdown)
"""

import os
import re
import shlex
import subprocess
import xml.etree.ElementTree as ET

from flask import Flask, jsonify, render_template, request, send_file

from core import checklists, netinfo, notes, outputs, parsers, projects, runner, settings, sysmon, vpn

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

HOST = "127.0.0.1"          # never change to 0.0.0.0 — see warning above
PORT = 5001

app = Flask(__name__)


# ---------------------------------------------------------------------------
# CORS (manual — no flask-cors dependency). The frontend is now served by
# this same app (same-origin), so this isn't load-bearing any more, but it's
# harmless to keep: the whole server only ever listens on 127.0.0.1, so
# nothing off-box can reach it to exploit a permissive CORS policy.
# ---------------------------------------------------------------------------

@app.after_request
def add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp


@app.route("/api/<path:_any>", methods=["OPTIONS"])
def cors_preflight(_any):
    return ("", 204)


# ---------------------------------------------------------------------------
# Routes — frontend
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


# ---------------------------------------------------------------------------
# Routes — projects
# ---------------------------------------------------------------------------

@app.route("/api/health")
def health():
    return jsonify({"ok": True})


@app.route("/api/local-ips")
def local_ips():
    return jsonify({"ips": netinfo.list_local_ips()})


@app.route("/api/settings", methods=["GET"])
def settings_get():
    return jsonify({"settings": settings.load_settings(), "path_keys": list(settings.PATH_KEYS)})


@app.route("/api/settings", methods=["POST"])
def settings_save():
    body = request.get_json(force=True) or {}
    return jsonify({"settings": settings.save_settings(body)})


@app.route("/api/verify-path", methods=["POST"])
def settings_verify_path():
    body = request.get_json(force=True) or {}
    return jsonify(settings.verify_path(body.get("path", "")))


# ---------------------------------------------------------------------------
# VPN — list OpenVPN configs, report tunnel status, connect/disconnect.
# connect/disconnect launch a terminal (openvpn needs sudo).
# ---------------------------------------------------------------------------

@app.route("/api/vpn/configs", methods=["GET"])
def vpn_configs():
    return jsonify({"configs": vpn.list_configs()})


@app.route("/api/vpn/status", methods=["GET"])
def vpn_status():
    return jsonify(vpn.status())


@app.route("/api/vpn/connect", methods=["POST"])
def vpn_connect():
    body = request.get_json(force=True) or {}
    full = vpn.resolve_config(body.get("config", ""))
    if not full:
        return jsonify({"error": "unknown config (not under the OpenVPN path)"}), 400
    st = vpn.status()
    if st.get("connected"):
        return jsonify({"error": "already connected ({}) — disconnect first".format(st.get("config") or st.get("iface"))}), 409
    # Launch in a terminal so the user can enter their sudo password and watch
    # the connection log; tee it to a logfile so the sidebar can mirror it.
    cmd = "sudo openvpn --config {} 2>&1 | tee {}".format(shlex.quote(full), shlex.quote(vpn.LOG_PATH))
    echo = "printf '\\033[1;32m$ sudo openvpn --config %s\\033[0m\\n' {}".format(shlex.quote(full))
    try:
        runner.launch_terminal("{}; {}; exec bash".format(echo, cmd), cwd=os.path.dirname(full))
    except FileNotFoundError as e:
        return jsonify({"error": "could not launch terminal: {}".format(e)}), 500
    vpn.note_connect(os.path.basename(full))
    return jsonify({"ok": True, "config": os.path.basename(full)})


@app.route("/api/vpn/disconnect", methods=["POST"])
def vpn_disconnect():
    cmd = "sudo pkill -SIGINT -x openvpn || sudo pkill -x openvpn"
    echo = "printf '\\033[1;33m$ %s\\033[0m\\n' {}".format(shlex.quote(cmd))
    try:
        runner.launch_terminal("{}; {}".format(echo, cmd), cwd=os.path.expanduser("~"))
    except FileNotFoundError as e:
        return jsonify({"error": "could not launch terminal: {}".format(e)}), 500
    vpn.note_disconnect()
    return jsonify({"ok": True})


@app.route("/api/vpn/log", methods=["GET"])
def vpn_log():
    return jsonify({"log": vpn.read_log()})


# ---------------------------------------------------------------------------
# Routes — notes (read straight from the vault's .md files, no build step)
# ---------------------------------------------------------------------------

@app.route("/api/notes/tree")
def notes_tree():
    return jsonify(notes.get_notes_tree())


@app.route("/api/notes/content")
def notes_content():
    category = request.args.get("category", "")
    relpath = request.args.get("path", "")
    content = notes.read_note_content(category, relpath)
    if content is None:
        return jsonify({"error": "note not found"}), 404
    return jsonify({"content": content})


@app.route("/api/notes/image")
def notes_image():
    """Serve a vault image referenced by an Obsidian ![[name.png]] embed."""
    name = request.args.get("name", "")
    full = notes.resolve_image(name)
    if not full:
        return jsonify({"error": "image not found"}), 404
    return send_file(full, max_age=3600)


@app.route("/api/notes/search")
def notes_search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"hits": [], "truncated": False})
    return jsonify(notes.search_notes(q))


@app.route("/api/projects", methods=["GET"])
def projects_list():
    return jsonify({"projects": projects.list_projects(), "active": projects.get_active_name()})


@app.route("/api/projects", methods=["POST"])
def projects_create():
    body = request.get_json(force=True) or {}
    name = (body.get("name") or "").strip()
    if not projects.valid_name(name):
        return jsonify({"error": "name must be non-empty and use only letters, numbers, - and _"}), 400
    if os.path.isdir(projects.project_dir(name)):
        return jsonify({"error": "a project with that name already exists"}), 409

    # Target IP is the one required field — it identifies the box. Domain and
    # DC IP are often unknown at creation and can be filled in later.
    target_ip = (body.get("target_ip") or "").strip()
    if not target_ip:
        return jsonify({"error": "target IP is required"}), 400

    data = projects.create_project(
        name,
        target_ip,
        (body.get("domain") or "").strip(),
        (body.get("dc_ip") or "").strip(),
    )
    projects.set_active_name(name)
    return jsonify({"project": projects.with_path(data)})


@app.route("/api/projects/<name>", methods=["PATCH"])
def projects_update(name):
    """Fill in / correct target_ip, domain, dc_ip after creation."""
    body = request.get_json(force=True) or {}
    data = projects.update_project(name, body)
    if data is None:
        return jsonify({"error": "no such project"}), 404
    return jsonify({"project": data})


@app.route("/api/active", methods=["GET"])
def active_get():
    return jsonify({"project": projects.get_active_project()})


@app.route("/api/active", methods=["POST"])
def active_set():
    body = request.get_json(force=True) or {}
    name = (body.get("name") or "").strip()
    if not projects.valid_name(name) or not os.path.isdir(projects.project_dir(name)):
        return jsonify({"error": "unknown project"}), 404
    projects.set_active_name(name)
    return jsonify({"project": projects.load_project(name)})


# ---------------------------------------------------------------------------
# Routes — run command in native terminal
# ---------------------------------------------------------------------------

@app.route("/api/run", methods=["POST"])
def run_command():
    body = request.get_json(force=True) or {}
    template = body.get("template") or body.get("command") or ""
    if not template.strip():
        return jsonify({"error": "no command given"}), 400

    project = projects.get_active_project()
    if not project:
        return jsonify({"error": "no active project — create/select one first"}), 400

    attacker_ip = (body.get("attacker_ip") or "").strip()
    attacker_port = (body.get("attacker_port") or "").strip()
    scheme = (body.get("scheme") or "http").strip()
    resolved = runner.resolve_template(template, project, attacker_ip, attacker_port, scheme)

    # Echo the resolved command into the terminal before running it (bash -c
    # doesn't print what it's about to run on its own) — shlex.quote makes
    # this safe even though `resolved` itself may contain quotes/$/backticks
    # (e.g. the rpcclient -U '' or ldapsearch templates).
    echo_cmd = "printf '\\033[1;32m$ %s\\033[0m\\n' {}".format(shlex.quote(resolved))
    full_cmd = "{}; {}; exec bash".format(echo_cmd, resolved)
    try:
        runner.launch_terminal(full_cmd, cwd=projects.project_dir(project["name"]))
    except FileNotFoundError as e:
        return jsonify({"error": "could not launch terminal: {}".format(e)}), 500

    return jsonify({"ok": True, "resolved": resolved})


@app.route("/api/presets", methods=["GET"])
def presets():
    return jsonify({
        "nmap": checklists.NMAP_PRESETS,
        "service_checklists": checklists.SERVICE_CHECKLISTS,
        "service_aliases": checklists.SERVICE_ALIASES,
        "port_fallback": checklists.PORT_FALLBACK,
    })


@app.route("/api/playbook", methods=["GET"])
def playbook():
    return jsonify({"groups": checklists.PLAYBOOK})


# ---------------------------------------------------------------------------
# Routes — module results (nmap, rustscan, nxc credential checks)
# ---------------------------------------------------------------------------

@app.route("/api/nmap", methods=["GET"])
def nmap_results():
    project = projects.get_active_project()
    if not project:
        return jsonify({"error": "no active project"}), 400

    scan = request.args.get("scan", "full")
    if not projects.NAME_RE.match(scan):
        return jsonify({"error": "invalid scan name"}), 400

    xml_path = os.path.join(projects.project_dir(project["name"]), "scans", "nmap", scan + ".xml")
    if not os.path.isfile(xml_path):
        return jsonify({"error": "no such scan file: scans/nmap/{}.xml".format(scan), "ports": []}), 404

    try:
        parsed = parsers.parse_nmap_xml(xml_path)
    except ET.ParseError as e:
        return jsonify({"error": "could not parse nmap XML (scan may still be running): {}".format(e)}), 422

    checklist_state = projects.load_checklist(project["name"])
    for p in parsed["ports"]:
        key = "{}/{}".format(p["port"], p["protocol"])
        p["checked"] = checklist_state.get(key, {})

    return jsonify(parsed)


@app.route("/api/rustscan", methods=["GET"])
def rustscan_results():
    project = projects.get_active_project()
    if not project:
        return jsonify({"error": "no active project"}), 400

    scan = request.args.get("scan", "quick")
    if not projects.NAME_RE.match(scan):
        return jsonify({"error": "invalid scan name"}), 400

    path = os.path.join(projects.project_dir(project["name"]), "scans", "rustscan", scan + ".txt")
    if not os.path.isfile(path):
        return jsonify({"error": "no such scan file: scans/rustscan/{}.txt".format(scan), "ports": []}), 404

    parsed = parsers.parse_rustscan_output(path)

    checklist_state = projects.load_checklist(project["name"])
    for p in parsed["ports"]:
        key = "{}/{}".format(p["port"], p["protocol"])
        p["checked"] = checklist_state.get(key, {})

    return jsonify(parsed)


@app.route("/api/creds", methods=["GET"])
def creds_results():
    project = projects.get_active_project()
    if not project:
        return jsonify({"error": "no active project"}), 400

    scan = request.args.get("scan", "")
    if not scan or not projects.NAME_RE.match(scan):
        return jsonify({"error": "invalid scan name"}), 400

    path = os.path.join(projects.project_dir(project["name"]), "scans", "creds", scan + ".txt")
    if not os.path.isfile(path):
        return jsonify({"error": "no such scan file: scans/creds/{}.txt".format(scan), "results": []}), 404

    return jsonify(parsers.parse_nxc_output(path))


@app.route("/api/verify-cred", methods=["POST"])
def verify_cred():
    """Re-check one credential live: run `nxc <service> <target_ip> -u ... -p ...`
    and return valid/failed/pwned by parsing the output. Synchronous (unlike
    /api/run which launches a terminal) so the UI gets an immediate result."""
    project = projects.get_active_project()
    if not project:
        return jsonify({"error": "no active project — create/select one first"}), 400
    ip = (project.get("target_ip") or "").strip()
    if not ip:
        return jsonify({"error": "active project has no target IP"}), 400

    body = request.get_json(force=True) or {}
    service = (body.get("service") or "").strip().lower()
    user = (body.get("user") or "").strip()
    secret = body.get("secret") or ""
    if not re.match(r"^[a-z0-9]+$", service):
        return jsonify({"error": "invalid service"}), 400
    if not user:
        return jsonify({"error": "username required"}), 400

    try:
        out = runner.run_nxc_capture(service, ip, user, secret)
    except FileNotFoundError:
        return jsonify({"error": "nxc not found on PATH"}), 500
    except subprocess.TimeoutExpired:
        return jsonify({"error": "verify timed out"}), 504

    parsed = parsers.parse_nxc_text(out)
    # Prefer the strongest signal: pwned > valid > failed.
    rank = {"pwned": 3, "valid": 2, "failed": 1}
    status = "failed"
    for r in parsed.get("results", []):
        if rank.get(r["status"], 0) > rank.get(status, 0):
            status = r["status"]
    return jsonify({"status": status, "raw": out.strip()[:2000]})


# ---------------------------------------------------------------------------
# Routes — playbook (Engagement sidebar) output files: "tool" here is either
# a Port Scanning tool id (nmap/rustscan) or any other category's id
# (directory_bruteforce, smb_enum, …) — find_output_spec() handles both.
# ---------------------------------------------------------------------------

@app.route("/api/playbook/outputs", methods=["GET"])
def playbook_outputs():
    project = projects.get_active_project()
    if not project:
        return jsonify({"error": "no active project"}), 400

    tool = request.args.get("tool", "")
    spec = checklists.find_output_spec(tool)
    if not spec:
        return jsonify({"error": "unknown tool: {}".format(tool)}), 404

    d = os.path.join(projects.project_dir(project["name"]), spec["dir"])
    if not os.path.isdir(d):
        return jsonify({"files": []})

    ext = spec["ext"]
    files = sorted(f[:-len(ext)] for f in os.listdir(d) if f.endswith(ext))
    return jsonify({"files": files})


@app.route("/api/playbook/raw", methods=["GET"])
def playbook_raw():
    project = projects.get_active_project()
    if not project:
        return jsonify({"error": "no active project"}), 400

    tool = request.args.get("tool", "")
    spec = checklists.find_output_spec(tool)
    if not spec:
        return jsonify({"error": "unknown tool: {}".format(tool)}), 404

    name = request.args.get("file", "")
    if not projects.NAME_RE.match(name):
        return jsonify({"error": "invalid file name"}), 400

    path = os.path.join(projects.project_dir(project["name"]), spec["dir"], name + spec["ext"])
    if not os.path.isfile(path):
        return jsonify({"error": "no such file: {}/{}{}".format(spec["dir"], name, spec["ext"])}), 404

    with open(path, "r", errors="replace") as f:
        content = f.read()
    return jsonify({"content": content})


# ---------------------------------------------------------------------------
# Routes — checklist state
# ---------------------------------------------------------------------------

@app.route("/api/checklist", methods=["GET"])
def checklist_get():
    project = projects.get_active_project()
    if not project:
        return jsonify({"error": "no active project"}), 400
    return jsonify({"checklist": projects.load_checklist(project["name"])})


@app.route("/api/checklist", methods=["POST"])
def checklist_set():
    project = projects.get_active_project()
    if not project:
        return jsonify({"error": "no active project"}), 400

    body = request.get_json(force=True) or {}
    port_key = body.get("port_key")   # e.g. "445/tcp"
    item_id = body.get("item_id")     # e.g. "smbmap"
    checked = bool(body.get("checked"))
    if not port_key or not item_id:
        return jsonify({"error": "port_key and item_id required"}), 400

    state = projects.load_checklist(project["name"])
    state.setdefault(port_key, {})[item_id] = checked
    projects.save_checklist(project["name"], state)
    return jsonify({"ok": True, "checklist": state})


# ---------------------------------------------------------------------------
# Routes — Results workspace: the saved command-output tree (from the "save
# output" tee toggle). Scoped to the active project, read-only, path-guarded.
# ---------------------------------------------------------------------------

@app.route("/api/outputs/tree", methods=["GET"])
def outputs_tree():
    project = projects.get_active_project()
    if not project:
        return jsonify({"error": "no active project"}), 400
    pdir = projects.project_dir(project["name"])
    return jsonify({"project": project["name"], "files": outputs.list_files(pdir)})


@app.route("/api/outputs/file", methods=["GET"])
def outputs_file():
    project = projects.get_active_project()
    if not project:
        return jsonify({"error": "no active project"}), 400
    rel = request.args.get("path", "")
    pdir = projects.project_dir(project["name"])
    full = outputs.resolve_in_project(pdir, rel)
    if not full:
        return jsonify({"error": "no such file"}), 404
    result = outputs.read_and_parse(full, rel)
    result["rel"] = rel
    return jsonify(result)


@app.route("/api/outputs/summary", methods=["GET"])
def outputs_summary():
    project = projects.get_active_project()
    if not project:
        return jsonify({"error": "no active project"}), 400
    pdir = projects.project_dir(project["name"])
    summary = outputs.summarize(pdir)
    summary["project"] = project["name"]
    return jsonify(summary)


# ---------------------------------------------------------------------------
# Routes — System monitor (Settings › System). Read-only stats + a local
# process kill. Like /api/run, these act on this machine and rely on the
# server being bound to 127.0.0.1 only.
# ---------------------------------------------------------------------------

@app.route("/api/system", methods=["GET"])
def system_snapshot():
    try:
        top = int(request.args.get("top", 15))
    except ValueError:
        top = 15
    sort = request.args.get("sort", "rss")
    return jsonify(sysmon.snapshot(top=top, sort=sort))


@app.route("/api/system/kill", methods=["POST"])
def system_kill():
    body = request.get_json(force=True) or {}
    force = bool(body.get("force"))
    # terminal=true → hand the privileged kill to a native terminal instead of
    # signalling directly (so the user can enter a sudo password).
    if body.get("terminal"):
        cmd = sysmon.kill_command(body.get("pid"), force)
        full = "printf '\\033[1;32m$ %s\\033[0m\\n' {}; {}; exec bash".format(
            shlex.quote(cmd), cmd)
        try:
            runner.launch_terminal(full, cwd=os.path.expanduser("~"))
        except FileNotFoundError as e:
            return jsonify({"ok": False, "error": "could not launch terminal: {}".format(e)}), 500
        return jsonify({"ok": True, "command": cmd})
    result = sysmon.kill_process(body.get("pid"), force)
    return jsonify(result), (200 if result.get("ok") else 400)


if __name__ == "__main__":
    os.makedirs(projects.PROJECTS_ROOT, exist_ok=True)
    print("Projects root: {}".format(projects.PROJECTS_ROOT))
    print("Binding to {}:{} (localhost only)".format(HOST, PORT))
    app.run(host=HOST, port=PORT, debug=False)

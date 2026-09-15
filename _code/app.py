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
import shlex
import xml.etree.ElementTree as ET

from flask import Flask, jsonify, render_template, request

from core import checklists, netinfo, notes, parsers, projects, runner

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

    data = projects.create_project(
        name,
        (body.get("target_ip") or "").strip(),
        (body.get("domain") or "").strip(),
        (body.get("dc_ip") or "").strip(),
    )
    projects.set_active_name(name)
    return jsonify({"project": projects.with_path(data)})


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


if __name__ == "__main__":
    os.makedirs(projects.PROJECTS_ROOT, exist_ok=True)
    print("Projects root: {}".format(projects.PROJECTS_ROOT))
    print("Binding to {}:{} (localhost only)".format(HOST, PORT))
    app.run(host=HOST, port=PORT, debug=False)

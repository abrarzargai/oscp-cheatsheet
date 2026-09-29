"""core/outputs.py — read the saved command-output tree for a project and
parse the ones we have parsers for.

The "save output" toggle (static/js/app.js teeify) rewrites scan/enum commands
to tee their output into a folder tree under the project dir, using the TOOL as
the file extension so outputs can be globbed + parsed per tool, e.g.:

    enumeration/scanning/nmap/all-ports.nmap
    enumeration/web/gobuster/directories.gobuster
    enumeration/ad/smb.nxc

Older/manual layouts (scans/nmap/quick.xml, scans/web/gobuster-medium.txt) are
handled too: classify() picks the tool from the extension, then the filename,
then the folder names.

This module walks that tree (relative to the active project dir), returns a flat
file listing for the "Results" workspace, parses one file into a structured
view on demand, and summarize() merges every parsed file for the overview.
Files with no parser are shown raw ("Others").

Everything is read-only and path-guarded to stay inside the project dir.
"""

import os
import re
import xml.etree.ElementTree as ET

from core import parsers

# Files/dirs that are project bookkeeping, not command output.
SKIP_NAMES = {"project.json", "checklist.json", "notes.md", ".active_project"}
# www/ holds files served to the target (payloads, shells), not tool output.
SKIP_DIRS = {"www", "__pycache__", "node_modules"}
# Don't try to render these as text; just list them.
BINARY_EXTS = {
    "png", "jpg", "jpeg", "gif", "bmp", "ico", "pdf", "zip", "gz", "tar",
    "7z", "exe", "dll", "so", "bin", "kdbx", "pcap", "pcapng", "ccache", "kirbi",
}
MAX_FILES = 2000             # safety cap for the walk
MAX_READ_BYTES = 1_000_000   # don't slurp huge captures into the browser
MAX_SUMMARY_BYTES = 20_000_000  # total bytes parsed for the overview dashboard

# Tool name (as it appears in an extension, filename or folder) -> canonical
# tool + the category it's grouped under in the Results tree.
TOOLS = {
    "nmap": ("nmap", "Port Scanning"),
    "gnmap": ("nmap", "Port Scanning"),
    "rustscan": ("rustscan", "Port Scanning"),
    "masscan": ("masscan", "Port Scanning"),
    "autorecon": ("autorecon", "Port Scanning"),
    "gobuster": ("gobuster", "Web"),
    "ffuf": ("ffuf", "Web"),
    "feroxbuster": ("feroxbuster", "Web"),
    "dirb": ("dirb", "Web"),
    "dirsearch": ("dirsearch", "Web"),
    "wfuzz": ("wfuzz", "Web"),
    "nikto": ("nikto", "Web"),
    "whatweb": ("whatweb", "Web"),
    "enum4linux": ("enum4linux", "SMB"),
    "smbmap": ("smbmap", "SMB"),
    "smbclient": ("smbclient", "SMB"),
    "nxc": ("nxc", "Active Directory"),
    "netexec": ("nxc", "Active Directory"),
    "crackmapexec": ("nxc", "Active Directory"),
    "cme": ("nxc", "Active Directory"),
    "certipy": ("certipy", "Active Directory"),
    "kerbrute": ("kerbrute", "Active Directory"),
    "kerberoast": ("kerberoast", "Active Directory"),
    "asreproast": ("asreproast", "Active Directory"),
    "ldapsearch": ("ldapsearch", "LDAP"),
    "dig": ("dig", "DNS"),
    "dnsrecon": ("dnsrecon", "DNS"),
    "dnsenum": ("dnsenum", "DNS"),
    "fierce": ("fierce", "DNS"),
    "snmpwalk": ("snmpwalk", "SNMP"),
    "onesixtyone": ("onesixtyone", "SNMP"),
    "odat": ("odat", "Databases"),
    "hydra": ("hydra", "Brute Force"),
}

# Folder name -> category. A folder match wins over the tool's default
# category, so e.g. scans/smb/crackmapexec-smb.txt stays under SMB.
DIR_CATEGORIES = {
    "scanning": "Port Scanning", "nmap": "Port Scanning", "rustscan": "Port Scanning",
    "masscan": "Port Scanning", "ports": "Port Scanning",
    "web": "Web", "http": "Web",
    "smb": "SMB",
    "ad": "Active Directory", "kerberos": "Active Directory",
    "ldap": "LDAP", "dns": "DNS", "snmp": "SNMP",
    "oracle": "Databases", "mssql": "Databases", "mysql": "Databases",
    "bruteforce": "Brute Force",
    "loot": "Loot",
}

_TOKEN_SPLIT = re.compile(r"[-_. ]+")
# Colour/cursor escapes (rustscan, nxc, feroxbuster colour even when piped to tee).
_ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b[()][A-Za-z0-9]|\r")


def _read_text(full):
    with open(full, "r", errors="replace") as f:
        return _ANSI_RE.sub("", f.read(MAX_READ_BYTES))


def _rel(base, path):
    return os.path.relpath(path, base).replace(os.sep, "/")


def _ext(name):
    return name.rsplit(".", 1)[-1].lower() if "." in name else ""


def classify(rel):
    """Work out {tool, category} for a project-relative path from its
    extension, then filename tokens, then folder names (deepest first)."""
    parts = rel.split("/")
    name, dirs = parts[-1], [d.lower() for d in parts[:-1]]
    ext = _ext(name)
    stem = name[: -(len(ext) + 1)] if ext else name

    tool = None
    if ext in TOOLS:
        tool = TOOLS[ext]
    else:
        for tok in _TOKEN_SPLIT.split(stem.lower()):
            if tok in TOOLS:
                tool = TOOLS[tok]
                break
    if tool is None:
        for d in reversed(dirs):
            if d in TOOLS:
                tool = TOOLS[d]
                break

    category = None
    for d in reversed(dirs):
        if d in DIR_CATEGORIES:
            category = DIR_CATEGORIES[d]
            break
    if category is None and tool:
        category = tool[1]
    return {"tool": tool[0] if tool else "", "category": category or ""}


def parser_key(rel, tool):
    """Which parser (if any) handles this file. nmap splits by output format."""
    ext = _ext(rel)
    if tool == "nmap":
        if ext == "xml":
            return "nmap-xml"
        if ext == "gnmap":
            return "nmap-gnmap"
        return "nmap"
    return tool if tool in PARSERS else ""


def list_files(project_dir):
    """Walk the project dir and return output files with metadata (no content).
    Each entry: {name, rel, dir, ext, size, mtime, tool, category, parser,
    parseable, binary}."""
    out = []
    if not os.path.isdir(project_dir):
        return out
    for root, dirs, files in os.walk(project_dir):
        # prune hidden / non-output dirs in place
        dirs[:] = sorted(d for d in dirs if not d.startswith(".") and d not in SKIP_DIRS)
        for fn in sorted(files):
            if fn.startswith(".") or fn in SKIP_NAMES:
                continue
            full = os.path.join(root, fn)
            if not os.path.isfile(full):
                continue
            rel = _rel(project_dir, full)
            ext = _ext(fn)
            try:
                st = os.stat(full)
            except OSError:
                continue
            binary = ext in BINARY_EXTS
            info = classify(rel)
            pkey = "" if binary else parser_key(rel, info["tool"])
            out.append({
                "name": fn,
                "rel": rel,
                "dir": os.path.dirname(rel),
                "ext": ext,
                "size": st.st_size,
                "mtime": int(st.st_mtime),
                "tool": info["tool"],
                "category": info["category"],
                "parser": pkey,
                "parseable": bool(pkey),
                "binary": binary,
            })
            if len(out) >= MAX_FILES:
                return out
    return out


def resolve_in_project(project_dir, rel):
    """Return the absolute path for a project-relative file, or None if it
    escapes the project dir (path-traversal guard)."""
    if not rel:
        return None
    base = os.path.realpath(project_dir)
    full = os.path.realpath(os.path.join(base, rel))
    if full != base and not full.startswith(base + os.sep):
        return None
    if not os.path.isfile(full):
        return None
    return full


def read_and_parse(full, rel):
    """Read a file and, if we have a parser for it, return a structured view.
    Always returns {raw, truncated, size, tool, category, parser, parsed?}."""
    ext = _ext(rel)
    info = classify(rel)
    binary = ext in BINARY_EXTS
    pkey = "" if binary else parser_key(rel, info["tool"])
    try:
        size = os.path.getsize(full)
    except OSError:
        size = 0
    raw = ""
    truncated = False
    if not binary:
        try:
            raw = _read_text(full)
            if size > MAX_READ_BYTES:
                truncated = True
        except OSError:
            raw = ""
    result = {"raw": raw, "truncated": truncated, "size": size, "binary": binary,
              "tool": info["tool"], "category": info["category"], "parser": pkey}
    parser = PARSERS.get(pkey)
    if parser and raw:
        try:
            result["parsed"] = parser(raw)
        except Exception as e:  # never let a parser bug break the view
            result["parse_error"] = str(e)
    return result


def summarize(project_dir):
    """Parse every parseable file and merge the results for the overview
    dashboard: unique open ports (with the files that saw them), web hits by
    status class, and valid/pwned creds."""
    files = list_files(project_dir)
    ports, hosts, web, creds = {}, set(), [], {}
    web_status = {"2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, "?": 0}
    seen_web = set()
    budget = MAX_SUMMARY_BYTES
    for f in files:
        if not f["parseable"] or f["size"] > budget:
            continue
        budget -= f["size"]
        full = os.path.join(project_dir, f["rel"])
        try:
            parsed = PARSERS[f["parser"]](_read_text(full))
        except Exception:
            continue
        kind = parsed.get("type")
        if kind == "ports":
            if parsed.get("host"):
                hosts.add(parsed["host"])
            for p in parsed.get("ports", []):
                if p.get("state") != "open":
                    continue
                key = (p["port"], p["protocol"])
                cur = ports.setdefault(key, {"port": p["port"], "protocol": p["protocol"],
                                             "service": "", "version": "", "sources": []})
                # keep the most descriptive service/version seen across scans
                if p.get("service") and (not cur["service"] or cur["service"].endswith("?")):
                    cur["service"] = p["service"]
                if len(p.get("version") or "") > len(cur["version"]):
                    cur["version"] = p["version"]
                if f["rel"] not in cur["sources"]:
                    cur["sources"].append(f["rel"])
        elif kind == "web":
            for r in parsed.get("rows", []):
                key = (r["path"], r.get("status", ""))
                if key in seen_web:
                    continue
                seen_web.add(key)
                s = str(r.get("status") or "")
                bucket = s[0] + "xx" if len(s) == 3 and s[0] in "2345" else "?"
                web_status[bucket] += 1
                web.append({"path": r["path"], "status": s, "size": r.get("size", ""), "source": f["rel"]})
        elif kind == "creds":
            for r in parsed.get("results", []):
                if r.get("status") not in ("valid", "pwned"):
                    continue
                key = (r.get("user", ""), r.get("secret", ""))
                if key not in creds or r["status"] == "pwned":
                    creds[key] = {"status": r["status"], "user": key[0], "secret": key[1], "source": f["rel"]}

    categories = {}
    for f in files:
        label = f["category"] if f["parseable"] and f["category"] else "Others"
        categories[label] = categories.get(label, 0) + 1

    return {
        "files": len(files),
        "parsed": sum(1 for f in files if f["parseable"]),
        "categories": categories,
        "hosts": sorted(hosts),
        "ports": sorted(ports.values(), key=lambda p: (p["protocol"], p["port"])),
        "web": web[:300],
        "web_total": len(web),
        "web_status": web_status,
        "creds": sorted(creds.values(), key=lambda c: (c["status"] != "pwned", c["user"])),
    }


# ---------------------------------------------------------------------------
# Per-tool (per-extension) parsers. Each returns {"type": <renderer key>, ...}.
# The frontend (static/js/outputs.js) switches on "type" to visualize.
# ---------------------------------------------------------------------------

# nmap normal (-oN / stdout) port table lines:
#   80/tcp   open   http    Apache httpd 2.4.41 ((Ubuntu))
_NMAP_PORT_RE = re.compile(
    r"^(\d+)/(tcp|udp)\s+(open|closed|filtered|open\|filtered|closed\|filtered)\s+(\S+)\s*(.*)$"
)
_NMAP_HOST_RE = re.compile(r"Nmap scan report for\s+(.+)")


def parse_nmap_text(text):
    ports, host = [], ""
    for line in text.splitlines():
        hm = _NMAP_HOST_RE.search(line)
        if hm:
            host = hm.group(1).strip()
            continue
        m = _NMAP_PORT_RE.match(line.strip())
        if m:
            ports.append({
                "port": int(m.group(1)),
                "protocol": m.group(2),
                "state": m.group(3),
                "service": m.group(4),
                "version": m.group(5).strip(),
            })
    ports.sort(key=lambda p: p["port"])
    return {"type": "ports", "host": host, "ports": ports}


# gobuster dir:   /admin (Status: 301) [Size: 312]
# gobuster vhost: Found: admin.corp.htb (Status: 200) [Size: 1234]
# gobuster dns:   Found: admin.corp.htb
_GOBUSTER_DIR_RE = re.compile(r"^(/\S*)\s+\(Status:\s*(\d+)\)(?:\s*\[Size:\s*(\d+)\])?")
_GOBUSTER_FOUND_RE = re.compile(r"^Found:\s+(\S+)(?:\s+\(Status:\s*(\d+)\))?(?:\s*\[Size:\s*(\d+)\])?")


def parse_gobuster(text):
    rows = []
    for line in text.splitlines():
        s = line.strip()
        m = _GOBUSTER_DIR_RE.match(s)
        if m:
            rows.append({"path": m.group(1), "status": m.group(2), "size": m.group(3) or ""})
            continue
        m = _GOBUSTER_FOUND_RE.match(s)
        if m:
            rows.append({"path": m.group(1), "status": m.group(2) or "", "size": m.group(3) or ""})
    return {"type": "web", "rows": rows}


# ffuf pretty stdout:
#   admin  [Status: 200, Size: 1234, Words: 10, Lines: 5, Duration: 12ms]
_FFUF_RE = re.compile(r"^(\S+)\s+\[Status:\s*(\d+),\s*Size:\s*(\d+)")


def parse_ffuf(text):
    rows = []
    for line in text.splitlines():
        m = _FFUF_RE.match(line.strip())
        if m:
            rows.append({"path": m.group(1), "status": m.group(2), "size": m.group(3)})
    return {"type": "web", "rows": rows}


# feroxbuster:  200      GET       12l      34w     560c http://host/admin
_FEROX_RE = re.compile(r"^(\d{3})\s+\w+\s+\d+l\s+\d+w\s+\d+c\s+(\S+)")


def parse_feroxbuster(text):
    rows = []
    for line in text.splitlines():
        m = _FEROX_RE.match(line.strip())
        if m:
            rows.append({"path": m.group(2), "status": m.group(1), "size": ""})
    return {"type": "web", "rows": rows}


# hydra:  [80][http-post-form] host: 10.10.10.5   login: admin   password: pass
_HYDRA_RE = re.compile(r"login:\s*(\S+)\s+password:\s*(\S+)")


def parse_hydra(text):
    results = []
    for line in text.splitlines():
        m = _HYDRA_RE.search(line)
        if m:
            results.append({"status": "valid", "user": m.group(1), "secret": m.group(2), "raw": line.strip()})
    return {"type": "creds", "results": results}


# nmap -oX. Reuses the Engagement tab's XML parser (adds per-service checklist).
def parse_nmap_xml(text):
    root = ET.fromstring(text)
    if root.tag != "nmaprun":
        raise ValueError("not an nmap XML file")
    ports, host = [], ""
    for h in root.findall("host"):
        addr = h.find("address")
        if addr is not None and not host:
            host = addr.get("addr", "")
        for port in h.findall("ports/port"):
            st = port.find("state")
            svc = port.find("service")
            g = (lambda k: (svc.get(k) or "") if svc is not None else "")
            version = " ".join(x for x in (g("product"), g("version"), g("extrainfo") and "(" + g("extrainfo") + ")") if x)
            ports.append({
                "port": int(port.get("portid")),
                "protocol": port.get("protocol", "tcp"),
                "state": st.get("state", "unknown") if st is not None else "unknown",
                "service": g("name"),
                "version": version,
                "scripts": [{"id": s.get("id", ""), "output": (s.get("output") or "").strip()}
                            for s in port.findall("script")],
            })
    ports.sort(key=lambda p: (p["protocol"], p["port"]))
    return {"type": "ports", "host": host, "ports": ports}


# nmap -oG:  Host: 10.10.10.5 ()	Ports: 22/open/tcp//ssh//OpenSSH 8.2p1/, 80/open/tcp//http///
_GNMAP_HOST_RE = re.compile(r"^Host:\s+(\S+).*?Ports:\s+(.*?)(?:\t|$)")


def parse_nmap_gnmap(text):
    ports, host = [], ""
    for line in text.splitlines():
        m = _GNMAP_HOST_RE.match(line)
        if not m:
            continue
        host = host or m.group(1)
        for entry in m.group(2).split(","):
            f = entry.strip().split("/")
            if len(f) < 5 or not f[0].isdigit():
                continue
            ports.append({
                "port": int(f[0]), "protocol": f[2], "state": f[1],
                "service": f[4], "version": f[6] if len(f) > 6 else "",
            })
    ports.sort(key=lambda p: (p["protocol"], p["port"]))
    return {"type": "ports", "host": host, "ports": ports}


# rustscan greppable (-g):  10.10.10.5 -> [22,80]
# rustscan normal stdout:   Open 10.10.10.5:22
_RUSTSCAN_OPEN_RE = re.compile(r"^Open\s+(\S+):(\d+)")


def parse_rustscan(text):
    found, host = {}, ""
    for line in text.splitlines():
        s = line.strip()
        m = parsers.RUSTSCAN_LINE_RE.match(s)
        if m:
            host = host or m.group("host")
            for raw in m.group("ports").split(","):
                if raw.strip().isdigit():
                    found[int(raw)] = True
            continue
        m = _RUSTSCAN_OPEN_RE.match(s)
        if m:
            host = host or m.group(1)
            found[int(m.group(2))] = True
    ports = [{"port": p, "protocol": "tcp", "state": "open", "service": "", "version": ""}
             for p in sorted(found)]
    # rustscan pipes into nmap: pick up nmap's service table too if present
    nm = parse_nmap_text(text)
    if nm["ports"]:
        return {"type": "ports", "host": nm["host"] or host, "ports": nm["ports"]}
    return {"type": "ports", "host": host, "ports": ports}


def parse_nxc(text):
    parsed = parsers.parse_nxc_text(text)
    parsed["type"] = "creds"
    return parsed


# Parser key (see parser_key) -> parser. Anything without an entry renders
# raw under "Others (no parser)".
PARSERS = {
    "nmap": parse_nmap_text,
    "nmap-xml": parse_nmap_xml,
    "nmap-gnmap": parse_nmap_gnmap,
    "rustscan": parse_rustscan,
    "gobuster": parse_gobuster,
    "ffuf": parse_ffuf,
    "feroxbuster": parse_feroxbuster,
    "nxc": parse_nxc,
    "hydra": parse_hydra,
}

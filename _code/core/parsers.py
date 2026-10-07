"""core/parsers.py — nmap XML, rustscan greppable-output, and nxc (nxc)
output -> JSON parsing."""

import re
import xml.etree.ElementTree as ET

from core.checklists import checklist_for_service


def parse_nmap_xml(path):
    tree = ET.parse(path)
    root = tree.getroot()
    ports_out = []
    host_ip = ""
    for host in root.findall("host"):
        addr = host.find("address")
        if addr is not None:
            host_ip = addr.get("addr", "")
        ports_el = host.find("ports")
        if ports_el is None:
            continue
        for port in ports_el.findall("port"):
            state_el = port.find("state")
            state = state_el.get("state") if state_el is not None else "unknown"
            svc_el = port.find("service")
            service = svc_el.get("name") if svc_el is not None else ""
            product = svc_el.get("product") if svc_el is not None else ""
            version = svc_el.get("version") if svc_el is not None else ""
            extrainfo = svc_el.get("extrainfo") if svc_el is not None else ""
            portid = int(port.get("portid"))
            protocol = port.get("protocol")
            scripts = [
                {"id": s.get("id", ""), "output": (s.get("output") or "").strip()}
                for s in port.findall("script")
            ]
            ports_out.append({
                "port": portid,
                "protocol": protocol,
                "state": state,
                "service": service or "",
                "product": product or "",
                "version": version or "",
                "extrainfo": extrainfo or "",
                "scripts": scripts,
                "checklist": checklist_for_service(service, portid),
            })
    ports_out.sort(key=lambda p: p["port"])
    return {"host": host_ip, "ports": ports_out}


# rustscan's -g/--greppable format is one line per host:
#   10.129.20.13 -> [22,80,443,8080]
# It only finds open TCP ports and doesn't fingerprint services, so unlike
# nmap's parse there's no state/service/version/scripts here — just the port
# number, plus whatever checklist_for_service can guess from the port number
# alone (PORT_FALLBACK).
RUSTSCAN_LINE_RE = re.compile(r"^(?P<host>\S+)\s*->\s*\[(?P<ports>[^\]]*)\]\s*$")


def parse_rustscan_output(path):
    ports_out = []
    host_ip = ""
    with open(path) as f:
        for line in f:
            m = RUSTSCAN_LINE_RE.match(line.strip())
            if not m:
                continue
            host_ip = m.group("host")
            for raw in m.group("ports").split(","):
                raw = raw.strip()
                if not raw:
                    continue
                try:
                    portid = int(raw)
                except ValueError:
                    continue
                ports_out.append({
                    "port": portid,
                    "protocol": "tcp",
                    "state": "open",
                    "checklist": checklist_for_service(None, portid),
                })
    ports_out.sort(key=lambda p: p["port"])
    return {"host": host_ip, "ports": ports_out}


# nxc (nxc, the nxc successor) prints one line per attempt:
#   SMB    10.10.10.5   445   TARGET  [*] Windows 10 Build 19041 (name:TARGET) ...
#   SMB    10.10.10.5   445   TARGET  [+] corp.local\jdoe:Password123
#   SMB    10.10.10.5   445   TARGET  [+] corp.local\admin:Passw0rd! (Pwn3d!)
#   SMB    10.10.10.5   445   TARGET  [-] corp.local\bob:wrongpass STATUS_LOGON_FAILURE
# This format (PROTO  HOST  PORT  NAME  [flag] message) is consistent across
# nxc's protocol modules, so one regex covers smb/ssh/winrm/rdp/ldap/etc.
# [*] lines are banner/info, not a credential attempt, and are skipped here.
NXC_LINE_RE = re.compile(r"^(?P<proto>\S+)\s+\S+\s+\S+\s+\S+\s+\[(?P<flag>[+\-*])\]\s+(?P<rest>.*)$")


def parse_nxc_text(text):
    """Parse nxc output already in memory (e.g. captured from a verify run)."""
    results = []
    for raw in (text or "").splitlines():
        line = raw.rstrip("\n")
        m = NXC_LINE_RE.match(line.strip())
        if not m or m.group("flag") == "*":
            continue
        rest = m.group("rest").strip()
        pwned = "Pwn3d!" in rest
        status = "pwned" if pwned else ("valid" if m.group("flag") == "+" else "failed")
        cred_part = rest.replace("(Pwn3d!)", "").strip()
        user, secret = "", ""
        if ":" in cred_part:
            user, secret = cred_part.split(":", 1)
            user, secret = user.strip(), secret.strip()
        else:
            user = cred_part
        # The first column is nxc's protocol module (SMB/WINRM/SSH/RDP/LDAP/…) —
        # keep it so the Findings view can offer the right connect commands.
        results.append({"status": status, "user": user, "secret": secret,
                        "service": (m.group("proto") or "").lower(), "raw": line})
    return {"results": results}


def parse_nxc_output(path):
    with open(path, errors="replace") as f:
        return parse_nxc_text(f.read())

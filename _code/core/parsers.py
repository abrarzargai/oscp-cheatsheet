"""core/parsers.py — nmap XML -> JSON parsing."""

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

"""core/vpn.py — list OpenVPN configs under the configured folder and report
tunnel status. Connecting/disconnecting launches a terminal (openvpn needs
sudo), handled in app.py via runner.launch_terminal."""

import os
import tempfile

from core import netinfo, settings

# Where the launched terminal tees openvpn output, so the panel can tail it.
LOG_PATH = os.path.join(tempfile.gettempdir(), "cs-openvpn.log")

# Remembered name of the config we last connected with (best-effort, in-process).
_last_config = ""


def note_connect(name):
    global _last_config
    _last_config = name or ""


def note_disconnect():
    global _last_config
    _last_config = ""


def read_log(max_bytes=8000):
    """Return the tail of the openvpn log (what the terminal is showing)."""
    try:
        with open(LOG_PATH, "rb") as f:
            f.seek(0, os.SEEK_END)
            size = f.tell()
            f.seek(max(0, size - max_bytes))
            data = f.read()
        text = data.decode("utf-8", "replace")
        if size > max_bytes:
            text = text.split("\n", 1)[-1]   # drop the partial first line
        return text
    except Exception:
        return ""


def list_configs():
    """Return [{name, path}] for *.ovpn / *.conf files under the configured
    openvpn_path (searched up to 2 levels deep). Best-effort — empty on any
    problem, since this is a convenience dropdown."""
    base = (settings.load_settings().get("openvpn_path") or "").strip()
    base = os.path.expanduser(base)
    out = []
    if not base or not os.path.isdir(base):
        return out
    try:
        for root, dirs, files in os.walk(base):
            depth = root[len(base):].count(os.sep)
            if depth >= 2:
                dirs[:] = []
                continue
            for fn in sorted(files):
                if fn.lower().endswith((".ovpn", ".conf")):
                    full = os.path.join(root, fn)
                    out.append({"name": os.path.relpath(full, base), "path": full})
    except Exception:
        return out
    return out


def resolve_config(name):
    """Resolve a config name (from list_configs) to an absolute path strictly
    inside openvpn_path, or None if it escapes / doesn't exist."""
    base = os.path.expanduser((settings.load_settings().get("openvpn_path") or "").strip())
    if not base or not os.path.isdir(base):
        return None
    base = os.path.realpath(base)
    full = os.path.realpath(os.path.join(base, name))
    if os.path.commonpath([full, base]) != base:
        return None
    if not os.path.isfile(full):
        return None
    return full


def status():
    """VPN status from local interfaces: connected if a tun/tap interface has
    an IP. Returns {connected, iface, ip, config}."""
    for e in netinfo.list_local_ips():
        if e["iface"].startswith(("tun", "tap")):
            return {"connected": True, "iface": e["iface"], "ip": e["ip"], "config": _last_config}
    note_disconnect()   # tunnel is down — forget the remembered config
    return {"connected": False, "iface": "", "ip": "", "config": ""}

"""core/netinfo.py — local network interface IPs, for the Attacker IP
field's dropdown (so you don't have to alt-tab to a terminal and run
`ip a` every time you connect/reconnect a VPN to grab your tun0 address).

Linux-only (parses `ip -o -4 addr show`), matching the rest of this app's
existing Linux/Kali/Parrot assumptions (see runner.py's launch_terminal()).
"""

import subprocess

LOOPBACK_PREFIXES = ("127.",)


def list_local_ips():
    """Return [{"iface": "tun0", "ip": "10.10.14.5"}, ...], excluding
    loopback. Best-effort: any failure (missing `ip` binary, timeout,
    unexpected output) just yields an empty list rather than raising, since
    this is a convenience dropdown, not something the rest of the app
    depends on."""
    try:
        out = subprocess.check_output(
            ["ip", "-o", "-4", "addr", "show"],
            text=True,
            timeout=2,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        return []

    ips = []
    seen = set()
    for line in out.splitlines():
        # e.g. "2: eth0    inet 192.168.1.5/24 brd 192.168.1.255 scope global eth0"
        parts = line.split()
        if len(parts) < 4:
            continue
        iface = parts[1]
        ip = parts[3].split("/")[0]
        if ip.startswith(LOOPBACK_PREFIXES):
            continue
        key = (iface, ip)
        if key in seen:
            continue
        seen.add(key)
        ips.append({"iface": iface, "ip": ip})
    return ips

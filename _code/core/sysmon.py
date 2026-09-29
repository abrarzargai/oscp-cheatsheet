"""core/sysmon.py — a small read-only system monitor for the Settings ›
System panel: memory, swap, CPU, disk and per-process usage, plus a
best-effort process kill.

Uses psutil when it's installed (nicer per-process CPU%), and otherwise
falls back to parsing /proc and the coreutils tools every pentest box has,
so it needs no extra dependency.

!!! Like the rest of this app, kill_process() acts on the local machine and
must only ever be reached from the 127.0.0.1-only Flask server (see app.py).
"""

import os
import shutil
import signal
import time

try:
    import psutil  # optional; nicer numbers when present
except Exception:  # pragma: no cover - psutil is optional
    psutil = None

PAGE = os.sysconf("SC_PAGE_SIZE") if hasattr(os, "sysconf") else 4096
CLK_TCK = os.sysconf("SC_CLK_TCK") if hasattr(os, "sysconf") else 100


# ---------------------------------------------------------------------------
# Memory / swap
# ---------------------------------------------------------------------------
def _meminfo():
    """Parse /proc/meminfo into a {key: bytes} dict."""
    out = {}
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                parts = line.split(":")
                if len(parts) != 2:
                    continue
                k = parts[0].strip()
                v = parts[1].strip().split()
                if v:
                    out[k] = int(v[0]) * 1024  # values are in kB
    except OSError:
        pass
    return out


def memory():
    m = _meminfo()
    total = m.get("MemTotal", 0)
    avail = m.get("MemAvailable", m.get("MemFree", 0))
    used = max(total - avail, 0)
    swt = m.get("SwapTotal", 0)
    swf = m.get("SwapFree", 0)
    swused = max(swt - swf, 0)
    return {
        "total": total, "used": used, "available": avail,
        "percent": round(used / total * 100, 1) if total else 0.0,
        "swap_total": swt, "swap_used": swused,
        "swap_percent": round(swused / swt * 100, 1) if swt else 0.0,
    }


# ---------------------------------------------------------------------------
# CPU / load / uptime
# ---------------------------------------------------------------------------
def _cpu_times():
    with open("/proc/stat") as f:
        for line in f:
            if line.startswith("cpu "):
                vals = [int(x) for x in line.split()[1:]]
                idle = vals[3] + (vals[4] if len(vals) > 4 else 0)
                return sum(vals), idle
    return 0, 0


def cpu():
    # Sample /proc/stat twice with a short gap for an instantaneous percent.
    t1, i1 = _cpu_times()
    time.sleep(0.12)
    t2, i2 = _cpu_times()
    dt, di = (t2 - t1), (i2 - i1)
    pct = round((1 - di / dt) * 100, 1) if dt > 0 else 0.0
    try:
        load = os.getloadavg()
    except (OSError, AttributeError):
        load = (0, 0, 0)
    try:
        with open("/proc/uptime") as f:
            uptime = float(f.read().split()[0])
    except OSError:
        uptime = 0.0
    return {
        "percent": pct,
        "cores": os.cpu_count() or 1,
        "load": [round(x, 2) for x in load],
        "uptime": int(uptime),
    }


# ---------------------------------------------------------------------------
# Disks
# ---------------------------------------------------------------------------
def disks():
    """Real filesystems (skip pseudo/loop mounts) with usage from statvfs."""
    out = []
    seen = set()
    try:
        with open("/proc/mounts") as f:
            mounts = f.readlines()
    except OSError:
        mounts = []
    for line in mounts:
        parts = line.split()
        if len(parts) < 3:
            continue
        dev, mnt, fstype = parts[0], parts[1], parts[2]
        if not dev.startswith("/dev/"):
            continue
        if fstype in ("squashfs",) or dev in seen:
            continue
        seen.add(dev)
        try:
            st = os.statvfs(mnt)
        except OSError:
            continue
        total = st.f_blocks * st.f_frsize
        free = st.f_bavail * st.f_frsize
        used = total - st.f_bfree * st.f_frsize
        if total == 0:
            continue
        out.append({
            "device": dev, "mount": mnt, "fstype": fstype,
            "total": total, "used": used, "free": free,
            "percent": round(used / total * 100, 1),
        })
    out.sort(key=lambda d: d["mount"])
    return out


# ---------------------------------------------------------------------------
# Processes
# ---------------------------------------------------------------------------
def _proc_list_psutil(limit, sort):
    procs = []
    for p in psutil.process_iter(["pid", "name", "username", "memory_info", "cmdline"]):
        try:
            info = p.info
            rss = info["memory_info"].rss if info["memory_info"] else 0
            procs.append({
                "pid": info["pid"],
                "name": info["name"] or "",
                "user": info["username"] or "",
                "rss": rss,
                "cpu": round(p.cpu_percent(None), 1),
                "cmd": " ".join(info["cmdline"] or []) or info["name"] or "",
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return procs


def _read_int(path):
    try:
        with open(path) as f:
            return int(f.read().strip())
    except (OSError, ValueError):
        return 0


def _proc_list_proc():
    total_mem = _meminfo().get("MemTotal", 0)
    procs = []
    for pid in os.listdir("/proc"):
        if not pid.isdigit():
            continue
        base = "/proc/" + pid
        try:
            with open(base + "/stat") as f:
                stat = f.read()
            # comm may contain spaces/parens — bracket-delimited.
            rp = stat.rfind(")")
            after = stat[rp + 2:].split()
            comm = stat[stat.find("(") + 1:rp]
            rss_pages = int(after[21]) if len(after) > 21 else 0
            rss = rss_pages * PAGE
        except (OSError, ValueError, IndexError):
            continue
        try:
            with open(base + "/cmdline", "rb") as f:
                cmd = f.read().replace(b"\x00", b" ").decode("utf-8", "replace").strip()
        except OSError:
            cmd = ""
        try:
            uid = os.stat(base).st_uid
        except OSError:
            uid = -1
        procs.append({
            "pid": int(pid), "name": comm, "user": _uid_name(uid),
            "rss": rss, "cpu": 0.0, "cmd": cmd or comm,
            "mem_percent": round(rss / total_mem * 100, 1) if total_mem else 0.0,
        })
    return procs


_UID_CACHE = {}


def _uid_name(uid):
    if uid < 0:
        return ""
    if uid in _UID_CACHE:
        return _UID_CACHE[uid]
    name = str(uid)
    try:
        import pwd
        name = pwd.getpwuid(uid).pw_name
    except (KeyError, ImportError):
        pass
    _UID_CACHE[uid] = name
    return name


def processes(limit=15, sort="rss"):
    """Top processes. sort in {"rss","cpu"}. Always includes mem_percent."""
    total_mem = _meminfo().get("MemTotal", 0)
    procs = _proc_list_psutil(limit, sort) if psutil else _proc_list_proc()
    for p in procs:
        if "mem_percent" not in p:
            p["mem_percent"] = round(p["rss"] / total_mem * 100, 1) if total_mem else 0.0
    key = "cpu" if sort == "cpu" else "rss"
    procs.sort(key=lambda p: p.get(key, 0), reverse=True)
    return procs[:max(1, min(limit, 100))]


# ---------------------------------------------------------------------------
# Snapshot + kill
# ---------------------------------------------------------------------------
def snapshot(top=15, sort="rss"):
    return {
        "memory": memory(),
        "cpu": cpu(),
        "disks": disks(),
        "processes": processes(top, sort),
        "has_psutil": bool(psutil),
        "hostname": os.uname().nodename if hasattr(os, "uname") else "",
    }


# PIDs we must never signal from here (0 = every process in our group, 1 = init).
_PROTECTED = {0, 1}


def kill_process(pid, force=False):
    """Send SIGTERM (or SIGKILL if force) to a PID. Returns {ok, error?}."""
    try:
        pid = int(pid)
    except (TypeError, ValueError):
        return {"ok": False, "error": "invalid pid"}
    if pid in _PROTECTED or pid == os.getpid():
        return {"ok": False, "error": "refusing to kill this pid"}
    if not os.path.isdir("/proc/" + str(pid)):
        return {"ok": False, "error": "no such process"}
    try:
        os.kill(pid, signal.SIGKILL if force else signal.SIGTERM)
    except PermissionError:
        return {"ok": False, "error": "permission denied (try sudo / [term] kill)"}
    except ProcessLookupError:
        return {"ok": False, "error": "no such process"}
    except OSError as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True}


def kill_command(pid, force=False):
    """The shell command the UI can drop into a terminal for a privileged kill."""
    return "sudo kill {}{}".format("-9 " if force else "", int(pid))

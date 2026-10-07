"""core/settings.py — app-wide settings (not per-project).

Stored at a FIXED location (~/.config/oscp-cheatsheet/settings.json) that does
NOT depend on the projects root, because the projects root is itself one of the
settings here (`projects_base_path`). If that file doesn't exist yet we fall
back to reading the legacy ~/htb/.settings.json so existing setups keep their
values until the next save. Also exposes a best-effort path verifier used by
the Settings panel's [verify] button.
"""

import json
import os

# Fixed config dir, overridable for tests via OSCP_CONFIG_DIR.
CONFIG_DIR = os.path.expanduser(os.environ.get("OSCP_CONFIG_DIR", "~/.config/oscp-cheatsheet"))
SETTINGS_FILE = os.path.join(CONFIG_DIR, "settings.json")

# Where projects used to keep settings (inside the old hardcoded ~/htb root) —
# read once as a fallback so upgrades don't lose wordlist paths etc.
_LEGACY_SETTINGS_FILE = os.path.join(
    os.path.expanduser(os.environ.get("HTB_ROOT", "~/htb")), ".settings.json")

DEFAULT_PROJECTS_BASE = "~/htb"

# Known settings. `wordlists_path` is the single base path notes reference as
# $WORDLIST_PATH. `projects_base_path` is where project/machine folders live.
# `hidden_modules` / `hidden_workspaces` hide Notes categories / Workspace
# dropdown options (empty = show all).
STRING_KEYS = ("wordlists_path", "openvpn_path", "projects_base_path")
LIST_KEYS = ("hidden_modules", "hidden_workspaces")

# Settings that name a directory on disk — the panel offers a [verify] for these.
PATH_KEYS = ("wordlists_path", "openvpn_path", "projects_base_path")


def _defaults():
    return {
        "wordlists_path": "/usr/share/wordlists",
        "openvpn_path": os.path.expanduser("~/vpn"),
        "projects_base_path": DEFAULT_PROJECTS_BASE,
        "hidden_modules": [],
        "hidden_workspaces": [],
    }


def _read_file(path, data):
    try:
        with open(path) as f:
            stored = json.load(f)
        for k in STRING_KEYS:
            if isinstance(stored.get(k), str) and stored[k].strip():
                data[k] = stored[k].strip()
        for k in LIST_KEYS:
            if isinstance(stored.get(k), list):
                data[k] = [str(x) for x in stored[k] if isinstance(x, str)]
    except Exception:
        pass
    return data


def load_settings():
    data = _defaults()
    if os.path.isfile(SETTINGS_FILE):
        _read_file(SETTINGS_FILE, data)
    elif os.path.isfile(_LEGACY_SETTINGS_FILE):
        _read_file(_LEGACY_SETTINGS_FILE, data)
    return data


def save_settings(fields):
    data = load_settings()
    for k in STRING_KEYS:
        if k in fields and isinstance(fields[k], str):
            data[k] = fields[k].strip()
    for k in LIST_KEYS:
        if k in fields and isinstance(fields[k], list):
            data[k] = [str(x) for x in fields[k] if isinstance(x, str)]
    os.makedirs(CONFIG_DIR, exist_ok=True)
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f, indent=2)
    return data


def resolve_projects_root():
    """The absolute projects-base directory to use right now. Precedence:
    HTB_ROOT env var (explicit override, used by tests) > the saved
    `projects_base_path` setting > the ~/htb default."""
    env = os.environ.get("HTB_ROOT")
    if env:
        return os.path.expanduser(env)
    saved = load_settings().get("projects_base_path") or DEFAULT_PROJECTS_BASE
    return os.path.expanduser(saved)


def verify_path(path):
    """Best-effort check of a filesystem path for the Settings [verify] button.
    Returns a dict the frontend can render directly."""
    path = (path or "").strip()
    if not path:
        return {"ok": False, "message": "no path given"}
    expanded = os.path.expanduser(path)
    if not os.path.exists(expanded):
        return {"ok": False, "message": "does not exist"}
    is_dir = os.path.isdir(expanded)
    readable = os.access(expanded, os.R_OK)
    if not readable:
        return {"ok": False, "is_dir": is_dir, "message": "exists but is not readable"}
    if is_dir:
        try:
            count = sum(1 for _ in os.scandir(expanded))
        except Exception:
            count = None
        msg = "directory ({} entries)".format(count) if count is not None else "directory"
        return {"ok": True, "is_dir": True, "count": count, "message": msg}
    return {"ok": True, "is_dir": False, "message": "file ({} bytes)".format(os.path.getsize(expanded))}

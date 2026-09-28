"""core/settings.py — app-wide settings (not per-project), persisted to
~/htb/.settings.json. Currently holds filesystem locations like the SecLists
path, which the app's wordlist-based commands reference. Also exposes a
best-effort path verifier used by the Settings panel's [verify] button."""

import json
import os

from core.projects import PROJECTS_ROOT

SETTINGS_FILE = os.path.join(PROJECTS_ROOT, ".settings.json")

# Known settings. `wordlists_path` is the single base path: notes reference it
# as $WORDLIST_PATH, and SecLists is resolved inside it ($WORDLIST_PATH/seclists/...).
# `hidden_modules` is a list of top-level category ids to hide from the Notes
# tree (empty = show all, so new modules appear by default).
STRING_KEYS = ("wordlists_path",)
LIST_KEYS = ("hidden_modules",)

# Settings that name a directory on disk — the panel offers a [verify] for these.
PATH_KEYS = ("wordlists_path",)


def _defaults():
    return {"wordlists_path": "/usr/share/wordlists", "hidden_modules": []}


def load_settings():
    data = _defaults()
    if os.path.isfile(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE) as f:
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


def save_settings(fields):
    data = load_settings()
    for k in STRING_KEYS:
        if k in fields and isinstance(fields[k], str):
            data[k] = fields[k].strip()
    for k in LIST_KEYS:
        if k in fields and isinstance(fields[k], list):
            data[k] = [str(x) for x in fields[k] if isinstance(x, str)]
    os.makedirs(PROJECTS_ROOT, exist_ok=True)
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f, indent=2)
    return data


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

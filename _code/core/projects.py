"""core/projects.py — project folders, project.json, create/switch/list,
and per-project checklist.json state."""

import json
import os
import re
import shutil
from datetime import datetime, timezone

from core import settings

# PROJECTS_ROOT / ACTIVE_FILE are resolved from settings (projects_base_path),
# so they can change at runtime when the user edits the base path in Settings.
# They stay module globals (functions read them late-bound) and are recomputed
# by refresh_root(), which the settings-save route calls after a change.
PROJECTS_ROOT = settings.resolve_projects_root()
ACTIVE_FILE = os.path.join(PROJECTS_ROOT, ".active_project")


def refresh_root():
    """Recompute PROJECTS_ROOT/ACTIVE_FILE from the current settings. Call after
    the projects base path changes so later calls use the new location."""
    global PROJECTS_ROOT, ACTIVE_FILE
    PROJECTS_ROOT = settings.resolve_projects_root()
    ACTIVE_FILE = os.path.join(PROJECTS_ROOT, ".active_project")
    return PROJECTS_ROOT


NAME_RE = re.compile(r"^[A-Za-z0-9_-]+$")


def project_dir(name):
    return os.path.join(PROJECTS_ROOT, name)


def project_json_path(name):
    return os.path.join(project_dir(name), "project.json")


def checklist_json_path(name):
    return os.path.join(project_dir(name), "checklist.json")


def valid_name(name):
    return bool(name) and bool(NAME_RE.match(name))


def with_path(data):
    """Attach the absolute on-disk folder path to a project dict for API
    responses only — not persisted into project.json, since that file may
    move between machines/users."""
    data = dict(data)
    data["path"] = project_dir(data["name"])
    return data


def list_projects():
    if not os.path.isdir(PROJECTS_ROOT):
        return []
    out = []
    for entry in sorted(os.listdir(PROJECTS_ROOT)):
        if entry.startswith("."):
            continue
        pj = project_json_path(entry)
        if os.path.isfile(pj):
            try:
                with open(pj) as f:
                    data = json.load(f)
                out.append(with_path(data))
            except Exception:
                continue
    return out


def load_project(name):
    pj = project_json_path(name)
    if not os.path.isfile(pj):
        return None
    with open(pj) as f:
        return with_path(json.load(f))


def get_active_name():
    if not os.path.isfile(ACTIVE_FILE):
        return None
    with open(ACTIVE_FILE) as f:
        name = f.read().strip()
    return name or None


def set_active_name(name):
    os.makedirs(PROJECTS_ROOT, exist_ok=True)
    with open(ACTIVE_FILE, "w") as f:
        f.write(name)


def get_active_project():
    name = get_active_name()
    if not name:
        return None
    return load_project(name)


def create_project(name, target_ip, domain, dc_ip):
    base = project_dir(name)
    for sub in ("scans/nmap", "scans/rustscan", "scans/smb", "scans/web",
                "scans/dns", "scans/webtech", "scans/vhost", "loot", "www"):
        os.makedirs(os.path.join(base, sub), exist_ok=True)

    data = {
        "name": name,
        "target_ip": target_ip or "",
        "domain": domain or "",
        "dc_ip": dc_ip or "",
        "created": datetime.now(timezone.utc).isoformat(),
    }
    with open(project_json_path(name), "w") as f:
        json.dump(data, f, indent=2)

    notes_path = os.path.join(base, "notes.md")
    if not os.path.isfile(notes_path):
        with open(notes_path, "w") as f:
            f.write("# {}\n\ntarget: {}\n".format(name, target_ip or ""))

    cl_path = checklist_json_path(name)
    if not os.path.isfile(cl_path):
        with open(cl_path, "w") as f:
            json.dump({}, f)

    return data


def delete_project(name):
    """Permanently delete a project's folder (everything under ~/htb/<name>).
    Path-guarded to stay inside PROJECTS_ROOT. Clears the active project if it
    was the one deleted. Returns True on success, False if it didn't exist."""
    if not valid_name(name):
        return False
    root = os.path.realpath(PROJECTS_ROOT)
    full = os.path.realpath(project_dir(name))
    # must be a direct child of the projects root — never the root itself or outside it
    if os.path.dirname(full) != root or full == root:
        return False
    if not os.path.isdir(full):
        return False
    shutil.rmtree(full)
    if get_active_name() == name:
        try:
            os.remove(ACTIVE_FILE)
        except OSError:
            pass
    return True


# Fields that may be edited after creation (target_ip may be corrected too,
# but it stays the project's identifying value that must never be blank).
UPDATABLE_FIELDS = ("target_ip", "domain", "dc_ip")


def update_project(name, fields):
    """Merge editable fields (target_ip/domain/dc_ip) into an existing
    project.json. Domain/DC IP are commonly unknown at creation and filled
    in later; target_ip may be corrected but must not be emptied. Returns the
    updated project dict, or None if the project doesn't exist."""
    pj = project_json_path(name)
    if not os.path.isfile(pj):
        return None
    with open(pj) as f:
        data = json.load(f)
    for key in UPDATABLE_FIELDS:
        if key not in fields:
            continue
        val = (fields[key] or "").strip()
        if key == "target_ip" and not val:
            continue  # never blank out the identifying IP
        data[key] = val
    with open(pj, "w") as f:
        json.dump(data, f, indent=2)
    return with_path(data)


# ---------------------------------------------------------------------------
# Per-project checklist.json state
# ---------------------------------------------------------------------------

def load_checklist(name):
    path = checklist_json_path(name)
    if not os.path.isfile(path):
        return {}
    with open(path) as f:
        try:
            return json.load(f)
        except Exception:
            return {}


def save_checklist(name, state):
    with open(checklist_json_path(name), "w") as f:
        json.dump(state, f, indent=2)

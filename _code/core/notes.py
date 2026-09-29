"""core/notes.py — reads the cheatsheet notes straight from the vault's
markdown files on every request instead of a prebuilt data.json, so a new or
edited .md file just shows up on refresh with no separate build step.

get_notes_tree() returns metadata only (folder/file names) — no file
content, so it stays cheap even as the vault grows. A file's actual text is
only read when a specific note is opened (read_note_content) or during a
search (search_notes)."""

import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))   # _code/core
CODE_DIR = os.path.dirname(SCRIPT_DIR)                     # _code
VAULT_ROOT = os.path.dirname(CODE_DIR)                     # vault root = parent of _code/

CATEGORIES = [
    ("ACTIVE_DIRECTORY", "Active Directory"),
    ("WEB_PENETESTING", "Web Pentesting"),
    ("MOBILE_PENETESTING", "Mobile Pentesting"),
    ("OTHERS", "Others"),
]
CATEGORY_IDS = set(c[0] for c in CATEGORIES)


def _label_from_name(name):
    base = name[:-3] if name.lower().endswith(".md") else name
    return base.replace("_", " ").strip()


def _build_tree(abs_dir, category_id, rel_prefix):
    try:
        entries = sorted(os.listdir(abs_dir))
    except OSError:
        return []
    children = []
    for entry in entries:
        if entry.startswith("."):
            continue
        full = os.path.join(abs_dir, entry)
        rel = rel_prefix + "/" + entry if rel_prefix else entry
        if os.path.isdir(full):
            sub = _build_tree(full, category_id, rel)
            if sub:
                children.append({"type": "folder", "name": _label_from_name(entry), "children": sub})
        elif entry.lower().endswith(".md"):
            children.append({
                "type": "file",
                "name": _label_from_name(entry),
                "category": category_id,
                "relpath": rel,
            })
    return children


def get_notes_tree():
    """Metadata-only tree for the sidebar — no file content."""
    categories = []
    for folder, label in CATEGORIES:
        full = os.path.join(VAULT_ROOT, folder)
        if not os.path.isdir(full):
            continue
        categories.append({"id": folder, "label": label, "children": _build_tree(full, folder, "")})
    return {"categories": categories}


def resolve_note_path(category_id, relpath):
    """Validate + resolve a (category, relpath) pair to an absolute file
    path strictly inside that category's folder, or None if invalid. This is
    the only thing standing between a client-supplied path and the
    filesystem, so it rejects anything suspicious outright rather than
    normalizing it."""
    if category_id not in CATEGORY_IDS:
        return None
    if not relpath or not relpath.lower().endswith(".md"):
        return None
    if relpath.startswith("/") or ".." in relpath.split("/"):
        return None
    category_root = os.path.realpath(os.path.join(VAULT_ROOT, category_id))
    full = os.path.realpath(os.path.join(category_root, relpath))
    if os.path.commonpath([full, category_root]) != category_root:
        return None
    if not os.path.isfile(full):
        return None
    return full


def read_note_content(category_id, relpath):
    full = resolve_note_path(category_id, relpath)
    if not full:
        return None
    with open(full, encoding="utf-8", errors="replace") as f:
        return f.read()


# ---------------------------------------------------------------------------
# Embedded images (Obsidian ![[name.png]] embeds). The vault stores images
# under OTHERS/ASSETS/IMAGES (and possibly elsewhere) and embeds reference them
# by BASENAME only, the way Obsidian resolves them across the vault. So we build
# a basename -> absolute-path index once and serve by basename, path-guarded to
# stay inside the vault.
# ---------------------------------------------------------------------------
IMAGE_EXTS = {"png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif"}
_IMAGE_INDEX = None


def _build_image_index():
    index = {}
    for dirpath, dirnames, filenames in os.walk(VAULT_ROOT):
        # don't descend into the app code or hidden dirs
        dirnames[:] = [d for d in dirnames if not d.startswith(".") and d != "_code"]
        for fn in filenames:
            ext = fn.rsplit(".", 1)[-1].lower() if "." in fn else ""
            if ext in IMAGE_EXTS:
                # first match wins; later duplicates of the same name are ignored
                index.setdefault(fn, os.path.join(dirpath, fn))
                index.setdefault(fn.lower(), os.path.join(dirpath, fn))
    return index


def resolve_image(name, refresh=False):
    """Return the absolute path of a vault image referenced by basename, or
    None. Rebuilds the index if the name isn't found (covers newly pasted
    images) so a missing image self-heals without a server restart."""
    global _IMAGE_INDEX
    if name is None:
        return None
    name = name.strip().split("/")[-1].split("\\")[-1]  # basename only
    if not name or ".." in name:
        return None
    if _IMAGE_INDEX is None or refresh:
        _IMAGE_INDEX = _build_image_index()
    full = _IMAGE_INDEX.get(name) or _IMAGE_INDEX.get(name.lower())
    if not full and not refresh:
        return resolve_image(name, refresh=True)  # one rebuild, then give up
    if not full:
        return None
    # path guard: must stay inside the vault and still exist
    full = os.path.realpath(full)
    if os.path.commonpath([full, os.path.realpath(VAULT_ROOT)]) != os.path.realpath(VAULT_ROOT):
        return None
    return full if os.path.isfile(full) else None


def _find_snippet(text, query_lower):
    for line in text.split("\n"):
        idx = line.lower().find(query_lower)
        if idx != -1:
            line = line.strip()
            if len(line) > 100:
                start = max(0, idx - 30)
                line = ("…" if start > 0 else "") + line[start:start + 100] + "…"
            return line
    return ""


def search_notes(query, limit=30):
    """Whole-vault content search (server-side, since content is no longer
    kept in the browser's memory) — walks every .md file under each category
    root and does a plain case-insensitive substring match, same as the
    old client-side search did. Returns {hits, truncated} — truncated means
    there may be more matches beyond `limit` that weren't even looked for."""
    query_lower = query.lower()
    hits = []
    for folder, label in CATEGORIES:
        root = os.path.join(VAULT_ROOT, folder)
        if not os.path.isdir(root):
            continue
        for dirpath, _dirnames, filenames in sorted(os.walk(root)):
            for fname in sorted(filenames):
                if not fname.lower().endswith(".md"):
                    continue
                full = os.path.join(dirpath, fname)
                try:
                    with open(full, encoding="utf-8", errors="replace") as f:
                        text = f.read()
                except OSError:
                    continue
                if query_lower not in text.lower():
                    continue
                rel = os.path.relpath(full, root).replace(os.sep, "/")
                parts = rel.split("/")
                hits.append({
                    "category": folder,
                    "relpath": rel,
                    "name": _label_from_name(parts[-1]),
                    "path": [label] + [_label_from_name(p) for p in parts[:-1]],
                    "snippet": _find_snippet(text, query_lower),
                })
                if len(hits) >= limit:
                    return {"hits": hits, "truncated": True}
    return {"hits": hits, "truncated": False}

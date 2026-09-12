#!/usr/bin/env python3
"""
Scans the vault's four cheatsheet categories and builds data.json,
the content bundle that index.html loads at runtime.

Run this from anywhere; it locates the vault root as the parent
directory of this script (_code/ is expected to sit at the vault root).

Usage:
    python3 build_data.py

Re-run this any time you add/edit/remove notes, then refresh the app
in your browser (or re-copy _code/ if you're serving a separate copy).
"""
import json, os, sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)  # vault root = parent of _code/

CATEGORIES = [
    ("ACTIVE_DIRECTORY", "Active Directory"),
    ("WEB_PENETESTING", "Web Pentesting"),
    ("MOBILE_PENETESTING", "Mobile Pentesting"),
    ("OTHERS", "Others"),
]


def label_from_name(name):
    base = name
    if base.lower().endswith(".md"):
        base = base[:-3]
    base = base.replace("_", " ").strip()
    return base


def build_tree(path):
    """Recursively build a tree of folders/files (.md only) for a directory."""
    entries = sorted(os.listdir(path))
    children = []
    for entry in entries:
        full = os.path.join(path, entry)
        if entry.startswith('.'):
            continue
        if os.path.isdir(full):
            sub = build_tree(full)
            if sub:  # only include non-empty folders
                children.append({
                    "type": "folder",
                    "name": label_from_name(entry),
                    "children": sub
                })
        elif entry.lower().endswith(".md"):
            try:
                with open(full, encoding="utf-8", errors="replace") as f:
                    content = f.read()
            except Exception as e:
                content = f"(error reading file: {e})"
            children.append({
                "type": "file",
                "name": label_from_name(entry),
                "content": content
            })
    return children


def main():
    categories = []
    for folder, label in CATEGORIES:
        full = os.path.join(ROOT, folder)
        if not os.path.isdir(full):
            print(f"warning: category folder not found, skipping: {full}", file=sys.stderr)
            continue
        children = build_tree(full)
        categories.append({
            "id": folder,
            "label": label,
            "children": children
        })

    data = {"categories": categories}
    out_path = os.path.join(SCRIPT_DIR, "data.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    def count(nodes):
        c = sum(1 for n in nodes if n["type"] == "file")
        for n in nodes:
            if n["type"] == "folder":
                c += count(n["children"])
        return c

    total_files = sum(count(c["children"]) for c in categories)
    print(f"wrote {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB, {total_files} notes)")


if __name__ == "__main__":
    main()

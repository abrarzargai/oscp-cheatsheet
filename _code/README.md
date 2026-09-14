# OSCP Cheatsheet — Local App

A browsable, searchable, terminal-styled version of this vault's notes, plus
an HTB/pentest **engagement workspace** (per-box projects, click-to-run
commands, nmap results, per-port checklists) layered on top.

Notes viewer:
- A collapsible sidebar tree (Active Directory / Web Pentesting / Mobile Pentesting / Others), filterable by note name
- A separate content search (top of the main pane) that greps every note's full text and lists every file that matches, with a preview snippet — click a result to open it
- A top config bar for **Attacker (IP + Port)** and **Victim (IP + Domain + DC IP)**
- Live substitution of `$ATTACKER_IP`, `$VICTIM_IP`, `$DC_IP`, `$DOMAIN`, `$PORT` inside every note as you type your target's details
- Multiple notes open at once as tabs, with per-tab close and a "close all" button
- A **[copy]** button on every code block that copies the *resolved* command (real values baked in, not the placeholder)
- Syntax-highlighted code blocks (bash, PowerShell, cmd/batch, SQL, XML, etc.)

Engagement workspace ([ Notes ] / [ Engagement ] toggle in the viewer):
- **Projects** — create a box (name + target IP/domain/DC IP), which auto-creates `~/htb/<name>/{scans/{nmap,smb,web},loot,www,notes.md,checklist.json,project.json}`. Switch between projects from the top bar; the active one drives every command template and syncs into the Victim/Domain/DC_IP fields above.
- **Click-to-run** — recon-scan presets and per-port checklist commands each have `[run]` (launches a native terminal with the resolved command) and `[copy]` (copies the resolved command without running it).
- **Nmap results** — parses the active project's saved `-oA` scan into a PORT/STATE/SERVICE/VERSION table, with NSE script output and a service-specific checklist expandable per port.
- Checkbox state persists per-project in `checklist.json`.

Your top-bar config values are saved in the browser's `localStorage` only.
Everything under `~/htb/` (or `$HTB_ROOT`) is local, plaintext, on-disk state.

> **`/api/run` launches arbitrary commands on your machine.** `app.py` binds
> to `127.0.0.1` only — never expose it to a LAN/VPN/the internet.

---

## Stack

| Piece | What it's for |
|---|---|
| `app.py` + `core/` (Python 3, Flask) | Serves the frontend (`templates/` + `static/`) *and* the JSON API on one process |
| `templates/index.html` + `templates/partials/*.html` | Thin Jinja shell + includes for the static page structure |
| `static/css/theme.css` | All styling — the green-on-black terminal theme, one file |
| `static/js/*.js` | Frontend logic, split by feature (see File overview below) |
| [marked.js](https://github.com/markedjs/marked) v12, [highlight.js](https://highlightjs.org/) v11.9 (CDN) | Markdown rendering + syntax highlighting |
| Google Fonts — JetBrains Mono | The single font used throughout |
| `static/data.json` | Pre-built snapshot of every note's content |
| `build_data.py` (stdlib only) | Regenerates `static/data.json` from the vault's `.md` files |

## Requirements

```bash
pip install flask
```
- `gnome-terminal` (or edit `core/runner.py`'s `launch_terminal()` for your terminal — konsole/xterm/kitty/alacritty examples are in a comment there).
- Internet access on first load, to fetch marked.js/highlight.js/the font from CDN.

---

## How to run it

```bash
cd _code
./run.sh
```
(`run.sh` just installs Flask if missing and runs `python3 app.py` — equivalent to running that directly.)
Then open **http://127.0.0.1:5001** — this one process serves the page, the
static assets, and the `/api/*` endpoints (same origin, no CORS needed).

To stop it, press `Ctrl+C`.

> Projects live under `~/htb/` by default; override with `HTB_ROOT=/some/path python3 app.py`.

---

## Regenerating the notes data

If you add/edit/delete notes anywhere under `ACTIVE_DIRECTORY/`, `WEB_PENETESTING/`, `MOBILE_PENETESTING/`, or `OTHERS/`:

```bash
cd _code
python3 build_data.py
```
This rewrites `static/data.json`. Refresh the browser tab — no restart needed.

---

## File overview

```
_code/
├── app.py                      Flask app + route definitions (thin — delegates to core/)
├── core/
│   ├── projects.py             project folders, project.json, create/switch/list, checklist.json state
│   ├── runner.py                native terminal launch + command templating (<IP>/<DOMAIN>/... placeholders)
│   ├── parsers.py                nmap XML -> JSON parsing
│   └── checklists.py             service -> checklist mapping + nmap scan presets
├── templates/
│   ├── index.html               thin page shell — pulls in the partials below
│   └── partials/
│       ├── _topbar.html         brand + Attacker/Victim/Project config bar
│       ├── _sidebar.html        note-tree sidebar (filter input + mount point for JS)
│       ├── _tabs.html           mode toggle + tab bar + breadcrumb + note/engagement content mount point
│       ├── _runner.html         (placeholder — see its header comment; presets/checklist run-buttons are pure JS)
│       ├── _nmap_table.html     (placeholder — nmap table is pure JS, data-driven)
│       └── _checklist.html      (placeholder — checklist items are pure JS, data-driven)
├── static/
│   ├── css/theme.css            all styling
│   ├── js/
│   │   ├── app.js               shared state/helpers, note viewer (tabs/search/markdown/highlighting), boot()
│   │   ├── projects.js           project create/switch/list UI + state
│   │   ├── runner.js             click-to-run + copy-resolved-command buttons
│   │   ├── nmap.js               nmap results table, NSE output, recon-scan presets
│   │   └── checklist.js          per-port checklist item rendering + checkbox persistence
│   └── data.json                 generated snapshot of all notes (regenerate via build_data.py, don't hand-edit)
├── build_data.py                regenerates static/data.json
└── README.md                    this file
```

Adding new stuff, at a glance:
- New engagement feature that talks to the OS/filesystem → `core/`, wired up via a thin route in `app.py`.
- New service → checklist mapping → `core/checklists.py` (see the docstring at its top).
- New frontend behavior → the matching `static/js/*.js` file by feature; shared helpers go in `app.js`.
- New static page structure → `templates/partials/`, included from `templates/index.html`.
- New look → `static/css/theme.css` (CSS variables at the top of the file).

---

## Notes / limitations

- **Screenshots aren't embedded.** Any `![[Pasted image ...]]` embed in a note renders as a small `[image: filename]` placeholder instead of the actual image, to keep `data.json` small and the app simple.
- **`$PORT` is wired up but unused so far** in notes (ports today are written as literal numbers). Add `$PORT` to a note's commands and it'll substitute automatically.
- The notes viewer is **read-only** — it doesn't write back to your `.md` files. Keep editing notes normally in Obsidian/your editor, then re-run `build_data.py`.
- The engagement workspace **does** write to disk: `~/htb/<project>/` (project.json, checklist.json, notes.md, scan output) is created/updated as you use it.

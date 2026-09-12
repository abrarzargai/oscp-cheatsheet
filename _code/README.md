# OSCP Cheatsheet — Local App

A browsable, searchable, terminal-styled version of this vault's notes with:
- A collapsible sidebar tree (Active Directory / Web Pentesting / Mobile Pentesting / Others), filterable by note name
- A separate content search (top of the main pane) that greps every note's full text and lists every file that matches, with a preview snippet — click a result to open it
- A top config bar for **Attacker (IP + Port)** and **Victim (IP + Domain + DC IP)**
- Live substitution of `$ATTACKER_IP`, `$VICTIM_IP`, `$DC_IP`, `$DOMAIN`, `$PORT` inside every note as you type your target's details
- Multiple notes open at once as tabs, with per-tab close and a "close all" button
- A **[copy]** button on every code block that copies the *resolved* command (real values baked in, not the placeholder)
- Syntax-highlighted code blocks (bash, PowerShell, cmd/batch, SQL, XML, etc.)

Your config values are saved in the browser's `localStorage` only — nothing is sent anywhere.

---

## Stack

Everything is a static site — no build step, no backend, no database.

| Piece | What it's for |
|---|---|
| Plain HTML/CSS/JS (`index.html`) | The whole app: sidebar tree, config bar, tabs, search, rendering |
| [marked.js](https://github.com/markedjs/marked) v12 (loaded from cdnjs) | Parses each note's Markdown into HTML |
| [highlight.js](https://highlightjs.org/) v11.9 + `powershell`/`dos` language packs (loaded from cdnjs) | Syntax-colors each code block (comments, strings, keywords, variables, etc.) |
| Google Fonts — JetBrains Mono | The single font used throughout, for the terminal look |
| `data.json` | A pre-built snapshot of every note's content, generated from the vault's `.md` files |
| `build_data.py` (Python 3, standard library only) | Regenerates `data.json` from the vault whenever notes change |

No `npm install`, no frameworks, no compiling. `index.html` fetches `data.json` at load time and renders everything client-side.

---

## Requirements

- A modern browser (Chrome, Firefox, Edge, Safari — anything from the last few years).
- Python 3 — only needed to (a) serve the files locally and (b) regenerate `data.json` after editing notes. Check with:
  ```bash
  python3 --version
  ```
- Internet access on first load, to fetch marked.js, highlight.js, and the font from their CDNs. (Once cached by the browser, it mostly keeps working offline too.)

---

## How to run it

Browsers block a page from `fetch()`-ing a local JSON file when opened directly as a `file://` URL, so you need a tiny local web server — Python's built-in one is enough.

```bash
cd _code
python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

To stop the server, press `Ctrl+C` in that terminal.

> Any static file server works instead of Python's, e.g. `npx serve .`, VS Code's "Live Server" extension, `php -S localhost:8000`, etc. — the app doesn't care how the files are served, only that they're served over `http://` rather than opened directly from disk.

---

## Regenerating the data after editing notes

`data.json` is a **snapshot**. If you add, edit, or delete notes anywhere under `ACTIVE_DIRECTORY/`, `WEB_PENETESTING/`, `MOBILE_PENETESTING/`, or `OTHERS/`, re-run the build script to refresh it:

```bash
cd _code
python3 build_data.py
```

This rescans those four folders (relative to the vault root, one level up from `_code/`) and rewrites `data.json`. Then just refresh the browser tab — no need to restart the server.

---

## File overview

```
_code/
├── index.html      the entire app (structure + styles + logic)
├── data.json        generated snapshot of all notes (do not hand-edit — regenerate it instead)
├── build_data.py    regenerates data.json from the four category folders
└── README.md        this file
```

---

## Notes / limitations

- **Screenshots aren't embedded.** Any `![[Pasted image ...]]` embed in a note renders as a small `[image: filename]` placeholder instead of the actual image, to keep `data.json` small and the app simple.
- **`$PORT` is wired up but unused so far.** The Attacker config cluster includes a Port field and the substitution engine supports `$PORT`, but no existing note currently contains that placeholder (ports today are written as literal numbers, e.g. `LPORT=4444`). Add `$PORT` to a note's commands and it'll substitute automatically.
- This is a **read-only viewer** — it doesn't write back to your `.md` files. Keep editing notes normally in Obsidian/your editor, then re-run `build_data.py` to refresh the app.

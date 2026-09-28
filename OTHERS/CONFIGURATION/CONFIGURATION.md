# Cheatsheet Styling Configuration

This file documents the formatting conventions used across this vault (originally established in `ACTIVE_DIRECTORY/` and applied to `MOBILE_PENETESTING/`, `OTHERS/`, and `WEB_PENETESTING/`) so future notes can stay consistent.

---

## 1. Heading Colors

Headings use inline `<span style="color:#HEX">` inside the normal Markdown heading syntax, so they render as colored text in Obsidian while still being real headings (foldable, shown in outline view, etc.).

| Markdown level | Color name   | Hex       | Used for                                      |
|-----------------|-------------|-----------|------------------------------------------------|
| `#`             | Red         | `#FF5555` | Top-level section title (e.g. attack name, main topic) |
| `##`            | Cyan        | `#8BE9FD` | Major sub-section (e.g. "Explanation", "Example", "Step X") |
| `###`           | Green       | `#50FA7B` | Sub-sub-section / individual step or concept   |
| `####` / `#####` | Orange     | `#FFB86C` | Smaller details, sub-steps, tool-specific notes |

**Syntax pattern:**
```markdown
# <span style="color:#FF5555">Section Title</span>
## <span style="color:#8BE9FD">Sub-section</span>
### <span style="color:#50FA7B">Step or detail</span>
#### <span style="color:#FFB86C">Minor detail</span>
```

Notes:
- The heading marker (`#`, `##`, ...) stays **outside** the `<span>` so Markdown still parses it as a real heading.
- `**bold**` text is sometimes nested inside the colored span for extra emphasis (e.g. `### <span style="color:#50FA7B">**1. Step Name**</span>`) — this is fine and intentional, not an error.
- Code fences (``` ``` ```), Obsidian tags (`#AD_...`), and wikilinks (`[[...]]`) are never colorized — only real Markdown headings.

---

## 2. Placeholder Variables

Instead of hardcoding IP addresses or domain names in commands, notes use these placeholder variables so a command can be copy-pasted and only the variable needs to change:

| Variable         | Meaning                                      |
|------------------|-----------------------------------------------|
| `$ATTACKER_IP`   | Your own machine's IP (listener, file server, payload callback, `LHOST`) |
| `$VICTIM_IP`     | The target/compromised host's IP (`RHOST`, connection target) |
| `$DC_IP`         | Domain Controller's IP specifically (AD contexts) |
| `$DOMAIN`        | Target domain name (e.g. used with Kerberos/LDAP/SMB tooling) |

**Rules applied when converting old notes:**
- A literal IP or generic placeholder (`<ip>`, `<target_ip>`, `<your_ip>`, `YOUR_IP`, `MACHINE_IP`, etc.) was replaced with the matching variable based on its role in the command (e.g. an `LHOST=` value → `$ATTACKER_IP`; an `nxc smb <ip>` target → `$VICTIM_IP`).
- Multi-host **pivoting/tunneling/port-forwarding** notes were left with their literal internal IPs (e.g. `172.16.5.19`) where multiple distinct hosts are being taught together — replacing them with a single `$VICTIM_IP` would have destroyed the network topology being demonstrated.
- Subnets/CIDR ranges, network addresses (`.0`), broadcast addresses (`.255`), loopback (`127.0.0.1`), and other non-host-role IPs (like a password value that happens to look like an IP) were left untouched.
- A pre-existing loop variable named `$ip` (a real Bash variable inside a `for` loop, not a placeholder) was left alone; only the placeholder-style `$ip`/`<ip>` usages meant as fill-in-the-blank were converted.

**Info callout convention (seen in AD notes, optional to add elsewhere):**
```markdown
```

---

## 3. Other Formatting Conventions

- **Callouts** (Obsidian syntax) are used for asides:
  - `> [!info]` — prerequisites, variable legends, general notes
  - `> [!tip]` — a helpful hint (e.g. "check if any are Domain Admins")
  - `> [!warning]` (where used elsewhere) — pitfalls or things that can break the attack
- **Images/screenshots** are embedded as Obsidian wikilinks: `![[Pasted image ....png]]`, stored under `OTHERS/ASSETS/IMAGES/`.
- **Code fences** always specify a language where known (`bash`, `powershell`, `cmd`, `xml`, `sh`) for syntax highlighting.
- Horizontal rules (`___` or `---`) are used to visually separate major phases within a note (e.g. "Attack Steps" vs "Troubleshooting").

---

## 4. Grammar / Content Cleanup

Alongside the color and variable pass, the following kinds of issues were fixed throughout `MOBILE_PENETESTING/`, `OTHERS/`, and `WEB_PENETESTING/`:
- Spelling typos (e.g. "Andriod" → "Android", "kernal" → "kernel", "Downlaod" → "Download", "Usefull" → "Useful").
- Run-together/garbled sentences rewritten for clarity (kept the original meaning and technical accuracy).
- Stray leftover Markdown artifacts from copy-paste (e.g. a literal `###` or `#` accidentally left inside a colored `<span>` heading, or a stray standalone `bash` line before a code fence) removed.
- Grammar fixes (missing articles, verb agreement, punctuation) applied only to prose — code blocks, tool syntax, and flags were never altered for "grammar."

`ACTIVE_DIRECTORY/` was left as-is per the request (it was the source of the convention, not a target of this pass).

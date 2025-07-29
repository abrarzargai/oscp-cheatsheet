### 1. Search Application Config Files for Passwords
Many applications store passwords in config files in plain text (bad practice)
```powershell
findstr /SIM /C:"password" *.txt *.ini *.cfg *.config *.xml
```

### 2. Check Chrome Custom Dictionary for Passwords
Users might save passwords or secrets as custom dictionary entries.
```powershell
Get-Content "C:\Users\<username>\AppData\Local\Google\Chrome\User Data\Default\Custom Dictionary.txt" | Select-String "password"
```
- Replace <username> with the actual Windows user.
- This reads the dictionary file and searches for the word "password".

### 3. Look for Unattended Installation Files (unattend.xml)
This file may contain auto-login passwords in plain text.
- Search for any unattend.xml files on the system:
```powershell
Get-ChildItem -Path C:\ -Filter unattend.xml -Recurse -ErrorAction SilentlyContinue
```
Once found, open it to look for <AutoLogon> section with password value:

```powershell
Get-Content <path-to-unattend.xml> | Select-String "Password"
```
### 4. Read PowerShell History for Commands with Passwords
Passwords may be typed on the command line and saved in PowerShell history.
- Check PowerShell History Path

```powershell
(Get-PSReadLineOption).HistorySavePath
```
- Read PowerShell History
```powershell
Get-Content (Get-PSReadLineOption).HistorySavePath

```
- Read All Users' PowerShell Histories (if you have permission):
```powershell
foreach($user in (Get-ChildItem C:\Users)) {
    $path = "$($user.FullName)\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt"
    if (Test-Path $path) {
        Write-Host "History for $($user.Name):"
        Get-Content $path
    }
}

```
### Decrypt PowerShell Encrypted Credentials (pass.xml)
PowerShell can store credentials encrypted but tied to the user and machine via DPAPI.
```powershell
$credential = Import-Clixml -Path 'C:\scripts\pass.xml'
$credential.GetNetworkCredential().UserName
$credential.GetNetworkCredential().Password

```

# <span style="color:#FF5555">Using Command Prompt (findstr)</span>
Search for the word "password" inside common text files:

```cmd
cd C:\Users\htb-student\Documents
findstr /SI /M "password" *.xml *.ini *.txt
```
Search for "password" recursively with line numbers and file names:
```cmd
findstr /spin "password" .
```
Search for "password" inside multiple file types:
```cmd
findstr /si password *.xml *.ini *.txt *.config
```

# <span style="color:#FF5555">Using PowerShell</span>
Search text files for "password":
```powershell
Select-String -Path C:\Users\htb-student\Documents*.txt -Pattern password
```
Search recursively for files with specific extensions:
```powershell
Get-ChildItem C:\ -Recurse -Include *.rdp, *.config, *.vnc, *.cred -ErrorAction Ignore
```
### <span style="color:#50FA7B">Search for Files by Extension or Name</span>
Find files with "pass" or "cred" in their name:
```cmd
dir /S /B pass.txt pass.xml pass.ini cred .config
```
Find all .config files recursively:
```cmd
where /R C:\ *.config
```

### <span style="color:#50FA7B">Sticky Notes Passwords (SQLite Database)</span>
Windows Sticky Notes saves data in a SQLite database file.
#### <span style="color:#FFB86C">Location:</span>
```
C:\Users\<user>\AppData\Local\Packages\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe\LocalState\
```
Files of interest:
- `plum.sqlite`
- `plum.sqlite-shm`
- `plum.sqlite-wal`

#### <span style="color:#FFB86C">How to Extract Sticky Notes Data</span>
1. Copy the plum.sqlite* files to your machine.
2. Open with DB Browser for SQLite.
```sql
SELECT Text FROM Note;
```

#### <span style="color:#FFB86C">Using PowerShell with PSSQLite Module</span>
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
Import-Module .\PSSQLite.psd1

$db = "C:\Users\htb-student\AppData\Local\Packages\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe\LocalState\plum.sqlite"
Invoke-SqliteQuery -Database $db -Query "SELECT Text FROM Note" | Format-Table -Wrap
```

You can also search these files with the Linux strings command after copying them:

```bash
strings plum.sqlite-wal
```

#### <span style="color:#FFB86C">Common Files and File Types to Look For</span>
- `.kdbx` — KeePass database files
- `.vmdk`, `.vdhx` — Virtual machine disk files
- `.ppk` — PuTTY private key files
- Password files saved in `.txt`, `.doc`, `.xls`, `.xlsx`, `.one` (OneNote) formats
- Classic files like `passwords.txt`
- Config files with extensions like `.config`, `.ini`, `.rdp`, `.vnc`, `.cred`
- Shared folders mapped to user IDs (e.g., user folders on network shares)



#### <span style="color:#FFB86C">Other Interesting Files to Check</span>
- `%SYSTEMDRIVE%\pagefile.sys`	Paging file may contain data fragments
- `%WINDIR%\debug\NetSetup.log`	Network setup logs
- `%WINDIR%\repair\sam`,` %WINDIR%\repair\security`, etc.	Backup registry hives
- `%WINDIR%\iis6.log`	IIS web server logs
- `%WINDIR%\system32\config\AppEvent.Evt` and other .Evt files	Event logs
- `%USERPROFILE%\ntuser.dat`	User registry hive
- `%USERPROFILE%\LocalS~1\Tempor~1\Content.IE5\index.dat`	Internet Explorer cache index
- `%WINDIR%\System32\drivers\etc\hosts`	Hosts file
- `C:\ProgramData\Configs\*`	Config files
- `C:\Program Files\Windows PowerShell\*`	PowerShell scripts or modules
- `C:\SQLServer\Logs\ERRORLOG.BAK`	MSSQL error log backup — can contain sensitive data / credentials
- `.pfx` / `.p12` files	Certificate + private key bundles — in AD these are high value (see [[PFX FILE]]); a `.pfx` prefix/extension is always worth grabbing

### Using Command Prompt (findstr)
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

### Using PowerShell
Search text files for "password":

```powershell
Select-String -Path C:\Users\htb-student\Documents*.txt -Pattern password
```

Search recursively for files with specific extensions:

```powershell
Get-ChildItem C:\ -Recurse -Include *.rdp, *.config, *.vnc, *.cred -ErrorAction Ignore
```

### Search for Files by Extension or Name
Find files with "pass" or "cred" in their name:

```cmd
dir /S /B pass.txt pass.xml pass.ini cred .config
```

Find all .config files recursively:

```cmd
where /R C:\ *.config
```

### Sticky Notes Passwords (SQLite Database)
Windows Sticky Notes saves data in a SQLite database file.

#### Location:
```
C:\Users\<user>\AppData\Local\Packages\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe\LocalState\
```
Files of interest:
- `plum.sqlite`
- `plum.sqlite-shm`
- `plum.sqlite-wal`

#### How to Extract Sticky Notes Data
1. Copy the plum.sqlite* files to your machine.
2. Open with DB Browser for SQLite.
```sql
SELECT Text FROM Note;
```

#### Using PowerShell with PSSQLite Module
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

#### Common Files and File Types to Look For
- `.kdbx` — KeePass database files
- `.vmdk`, `.vdhx` — Virtual machine disk files
- `.ppk` — PuTTY private key files
- Password files saved in `.txt`, `.doc`, `.xls`, `.xlsx`, `.one` (OneNote) formats
- Classic files like `passwords.txt`
- Config files with extensions like `.config`, `.ini`, `.rdp`, `.vnc`, `.cred`
- Shared folders mapped to user IDs (e.g., user folders on network shares)



#### Other Interesting Files to Check
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

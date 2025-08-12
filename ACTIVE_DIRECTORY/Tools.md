
### **Recon & Enumeration Tools**

|Tool|Purpose|Easy Explanation|
|---|---|---|
|**[PowerView](https://github.com/PowerShellMafia/PowerSploit/blob/master/Recon/PowerView.ps1)**|AD discovery|Like a "Google Maps" for Active Directory—shows users, groups, and their relationships.|
|**[BloodHound](https://github.com/BloodHoundAD/BloodHound)**|Attack path mapping|Draws a **hacker roadmap** showing how to move from a low-access user to admin.|
|**[SharpHound](https://github.com/BloodHoundAD/BloodHound/tree/master/Collectors)**|Data collector for BloodHound|Scans AD and saves info for BloodHound to analyze.|
|**[Kerbrute](https://github.com/ropnop/kerbrute)**|Brute-force accounts|Tests usernames/passwords silently (like checking which keys open a door).|
|**[enum4linux](https://github.com/CiscoCXSecurity/enum4linux)**|Samba/Windows info|Lists shared folders, users, and OS details on Windows machines.|
### **2. Credential Attacks**

| Tool                                                                                                 | Purpose              | Easy Explanation                                                          |
| ---------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------- |
| **[Mimikatz](https://github.com/ParrotSec/mimikatz)**                                                | Steal passwords      | Extracts **plaintext passwords** from memory (like a digital pickpocket). |
| **[Rubeus](https://github.com/GhostPack/Rubeus)**                                                    | Kerberos abuse       | Steals or forges AD "tickets" (like fake IDs to access restricted areas). |
| **[secretsdump.py](https://github.com/SecureAuthCorp/impacket/blob/master/examples/secretsdump.py)** | Dump password hashes | Grabs password hashes from AD (later cracked with Hashcat).               |
| **[DomainPasswordSpray](https://github.com/dafthack/DomainPasswordSpray)**                           | Password spraying    | Tests **one password** against many users (e.g., "Summer2024!").          |

### **3. Lateral Movement**

|Tool|Purpose|Easy Explanation|
|---|---|---|
|**[CrackMapExec (CME)](https://github.com/byt3bl33d3r/CrackMapExec)**|Swiss Army knife|Runs commands on **many Windows PCs at once** (like remote control).|
|**[psexec.py](https://github.com/SecureAuthCorp/impacket/blob/master/examples/psexec.py)**|Remote command execution|Gives a **command prompt** on a target PC (like SSH for Windows).|
|**[evil-winrm](https://github.com/Hackplayers/evil-winrm)**|WinRM shell|Gets a **PowerShell terminal** on a target over WinRM.|
### **4. Privilege Escalation**

|Tool|Purpose|Easy Explanation|
|---|---|---|
|**[noPac.py](https://github.com/Ridter/noPac)**|Domain admin exploit|Turns a **normal user** into a **domain admin** (critical bug).|
|**[PetitPotam](https://github.com/topotam/PetitPotam)**|Forces auth|Tricks PCs into sending passwords to **your machine**.|
|**[LAPSToolkit](https://github.com/leoloobeek/LAPSToolkit)**|LAPS attacks|Steals **local admin passwords** set by Microsoft LAPS.|
### **5. Misc. Tools**

|Tool|Purpose|Easy Explanation|
|---|---|---|
|**[Responder](https://github.com/lgandx/Responder)**|Poisoning attacks|Tricks PCs into sending you their **hashed passwords**.|
|**[Impacket](https://github.com/SecureAuthCorp/impacket)**|Python AD toolkit|Contains **many tools** for AD attacks (like a hacker’s toolbox).|
|**[Hashcat](https://hashcat.net/hashcat/)**|Password cracking|Turns hashes into **plaintext passwords** (like a digital lockpick).|
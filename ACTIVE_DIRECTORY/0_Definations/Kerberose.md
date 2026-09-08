**Kerberos** is a **network authentication protocol** used in Active Directory that verifies user identity securely using **tickets instead of passwords**.

- **Client** → user or computer
- **KDC (Key Distribution Center)** → authentication server (in AD, it’s the Domain Controller)
- **TGT (Ticket Granting Ticket)** → proof you are logged in
- **Service Ticket** → allows access to specific services
- **AS (Authentication Server)** → verifies user login and issues TGT 
- **TGS (Ticket Granting Server)** →Gives you a **Service Ticket** for the resource you want
- **Server (Application Server)** → actual system/resource that validates Service Ticket and grants access Example: file server, web server, database server

![[Pasted image 20260415113046.png]]

### Step 1: Authentication Service Request (AS-REQ)
 > Client → Authentication Server
- User tries to log in
- Sends username + proof of password (not the actual password)


### Step 2: Authentication Service Response (AS-REP):
> Domain Controller → Client
- Sends back a **TGT (Ticket Granting Ticket)**
-  This TGT is **signed & encrypted using KRBTGT account hash**
- This is like a **“login proof”**

### Step 3: Ticket Granting Service Request (TGS-REQ)
> Client → Ticket Granting Server
- User wants to access something (like file server)
- Sends:
    - TGT
    - Service name (SPN)

### Step 4: Ticket Granting Service Response (TGS-REP)
> Ticket Granting Server → Client

The TGS validates the TGT and issues a **TGS-REP** containing:
- **Service Ticket (ST)**: Encrypted with the **target service account's secret key**
- Service session key for client-server secure communication

### Step 5: Application Request (AP-REQ) (Access the service)
> Client → Hosting Server
- Client shows the **service ticket**
- Server verifies it and allows access

____
# KRBTGT 
is a service account whose hash is used to sign and encrypt Kerberos Ticket Granting Tickets (TGTs) which we are sending to client (user).

- If compromised → attackers can create **Golden Tickets**
- It **is a real account** (like a service account)

___

# SPN (Service Principal Name)

An **SPN** is a unique identifier that **links a service instance to a service account** in Active Directory. Think of it as a "service address" that tells Kerberos **“This is the exact service I want to access.”**
(e.g., SQL Server, web application)
### SPN Format:
```plain
serviceclass/hostname:port/servicename
```
Examples:
- `MSSQLSvc/sql01.corp.local:1433` — SQL Server on port 1433
- `HTTP/webapp.corp.local` — Web application
- `CIFS/fileserver.corp.local` — File share service

> **Only Service Accounts Have SPNs**.  Regular user accounts do NOT have SPNs by default.** SPNs are specifically designed for **services**, not people.
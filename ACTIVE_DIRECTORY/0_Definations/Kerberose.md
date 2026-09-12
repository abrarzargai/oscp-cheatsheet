#AD_DEFINATION_KERBEROSE

# <span style="color:#FF5555">Kerberos</span>

**Kerberos** is a **network authentication protocol** used in Active Directory that verifies user identity securely using **tickets instead of passwords**.

- **Client** → user or computer
- **KDC (Key Distribution Center)** → authentication server (in AD, it's the Domain Controller)
- **TGT (Ticket Granting Ticket)** → proof you are logged in
- **Service Ticket** → allows access to specific services
- **AS (Authentication Server)** → verifies user login and issues TGT
- **TGS (Ticket Granting Server)** → Gives you a **Service Ticket** for the resource you want
- **Server (Application Server)** → actual system/resource that validates Service Ticket and grants access Example: file server, web server, database server

![[Pasted image 20260415113046.png]]

### <span style="color:#50FA7B">Step 1: Authentication Service Request (AS-REQ)</span>

> [!info] Client → Authentication Server
> - User tries to log in
> - Sends username + proof of password (not the actual password)

### <span style="color:#50FA7B">Step 2: Authentication Service Response (AS-REP)</span>

> [!info] Domain Controller → Client
> - Sends back a **TGT (Ticket Granting Ticket)**
> - This TGT is **signed & encrypted using KRBTGT account hash**
> - This is like a **"login proof"**

### <span style="color:#50FA7B">Step 3: Ticket Granting Service Request (TGS-REQ)</span>

> [!info] Client → Ticket Granting Server
> - User wants to access something (like file server)
> - Sends:
>     - TGT
>     - Service name (SPN)

### <span style="color:#50FA7B">Step 4: Ticket Granting Service Response (TGS-REP)</span>

> [!info] Ticket Granting Server → Client

The TGS validates the TGT and issues a **TGS-REP** containing:
- **Service Ticket (ST)**: Encrypted with the **target service account's secret key**
- Service session key for client-server secure communication

### <span style="color:#50FA7B">Step 5: Application Request (AP-REQ) (Access the service)</span>

> [!info] Client → Hosting Server
> - Client shows the **service ticket**
> - Server verifies it and allows access



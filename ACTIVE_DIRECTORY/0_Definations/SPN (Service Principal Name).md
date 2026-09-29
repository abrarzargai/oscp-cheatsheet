#AD_DEFINATION_SPN

# <span style="color:#FF5555">What Is an SPN?</span>

Think of an **SPN (Service Principal Name)** as a **unique name, identifier for a specific service running on a network i.e MSSQL.

When a user wants to access a service, such as a **SQL Server**, Kerberos needs to know **which AD account is running that service** so it can issue the appropriate **Service Ticket (TGS)**.

### <span style="color:#50FA7B">SPN Format</span>
```plain
$DOMAIN/$USER:$PASS
```
Examples:
- `MSSQLSvc/sql01.corp.local:1433` — SQL Server on port 1433
- `HTTP/webapp.corp.local` — Web application
- `CIFS/fileserver.corp.local` — File share service

> [!info] Note
> Only **Service Accounts** have SPNs. Regular user accounts do NOT have SPNs by default — SPNs are specifically designed for **services**, not people.

# <span style="color:#FF5555">Flow for Understanding</span>

## <span style="color:#8BE9FD">Example</span>

- **`CORP\sql_svc`** → Service Account
- **`sql_svc`** → Account username
- **`servicePrincipalName`** → AD attribute
- **`MSSQLSvc/db01.corp.local:1433`** → SPN
- **SQL Server** → Service using that account
- 
```text
Active Directory User Object: "CORP\sql_svc"
└── Attributes:
    ├── sAMAccountName: sql_svc
    └── servicePrincipalName: MSSQLSvc/db01.$DOMAIN:1433
                                  ↑
                                  └── SPN belongs to CORP\sql_svc
```

## <span style="color:#8BE9FD">Flow</span>

- **User Requests a Service:** The client wants to access a service (e.g., a SQL Server) and sends a **TGS-REQ** to the KDC, including the **SPN** of the target service (e.g., `MSSQLSvc/db01.corp.local:1433`).
    
- **SPN Lookup:** The KDC reads the SPN and queries **Active Directory** to find which **AD account** owns that SPN (e.g., `CORP\sql_svc`).
    
- **Account Mapping Found:** AD returns the mapping — the SPN `MSSQLSvc/db01.corp.local:1433` belongs to the service account `CORP\sql_svc`.
    
- **Ticket Encryption:** The KDC issues a **Service Ticket (TGS)** and encrypts it using a **key derived from the `sql_svc` account's password**.
    
- **TGS-REP Returned:** The KDC sends the **Service Ticket** back to the client. The client cannot decrypt the ticket — only the **target service** can.
    
- **Client Presents Ticket:** The client sends the **Service Ticket** to the SQL Server via an **AP-REQ**.
    
- **Service Decrypts Ticket:** The SQL Server (running as `sql_svc`) **decrypts the ticket using its own key** (derived from `sql_svc`'s password).
    
- **Authentication Proven:**  Successful decryption **proves the client's identity** — access is granted.



```md
📂 OSCP_MASTER_NOTES/
|_____________________________________________________________________
├── 📂 ENUMERATION/ 
│   ├── Network_Scanning/     # fping, ping, hping3, rpcinfo, rpcclient, nmap
│   ├── Directory_Busting/               # gobuster, ffuf, dirb
│   ├── Subdomain_Enumeration.md    # amass, sublist3r, assetfinder
|_____________________________________________________________________
├── 📂 SERVICES/
│   ├── 📂 FILE_SHARING/
│   │   ├── SMB/              # 139, 445/tcp
│   │   ├── NFS/              # 2049/tcp
│   │   └── FTP/              # 21/tcp
│   ├── 📂 DATABASES/
│   │   ├── MySQL/            # 3306/tcp
│   │   ├── Redis/            # 6379/tcp
│   │   ├── MSSQL/            # 1433/tcp
│   │   ├── PostgreSQL/       # 5432/tcp
│   │   ├── OracleDB/         # 1521/tcp
│   │   └── MongoDB/          # 27017/tcp
│   ├── 📂 WEB/
│   │   ├── HTTP/             # 80, 443, 8080/tcp
│   │   └── 📂 CMS/
│   │       ├── WordPress/
│   │       ├── Joomla/
│   │       ├── Drupal/
│   │       ├── Magento/
│   │       ├── phpMyAdmin/
│   │       └── Jenkins/      # 8080/tcp
│   ├── 📂 REMOTE_ACCESS/
│   │   ├── SSH/              # 22/tcp
│   │   ├── RDP/              # 3389/tcp
│   │   ├── Telnet/           # 23/tcp
│   │   └── VNC/              # 5900/tcp
│   ├── 📂 EMAIL/
│   │   ├── SMTP/             # 25, 587, 465/tcp
│   │   ├── POP3/             # 110, 995/tcp
│   │   └── IMAP/             # 143, 993/tcp
|_____________________________________________________________________
├── 📂 PRIVESC/
│   ├── Linux/
│   │   ├── Kernel_Exploits/        # DirtyPipe, OverlayFS, DirtyCow
│   │   ├── SUID_Binaries/          # Finding and abusing SUID files
│   │   ├── Capabilities/           # Linux capabilities exploitation
│   │   ├── CronJobs/               # Exploiting writable cron scripts
│   │   ├── PATH_Hijacking/         # PATH variable misconfigurations
│   │   ├── Writable_Files/         # Writable configs and scripts
│   │   ├── Environmental_Variables/# Exploiting env vars
│   │   ├── Password_Files/         # Accessing /etc/passwd, shadow backups
│   │   ├── Exploiting_Docker/      # Docker socket abuse
│   │   └── Exploiting_Sudo/        # Sudo misconfigurations and CVEs
│   └── Windows/
│       ├── Token_Manipulation/     # JuicyPotato, RottenPotatoNG, token stealing
│       ├── Service_Abuse/          # Unquoted paths, DLL hijacking, weak service permissions
│       ├── AlwaysInstallElevated/  # Exploiting MSI installer privilege
│       ├── Registry_Exploits/      # Misconfigured registry keys for privilege gain
│       ├── Scheduled_Tasks/        # Abusing scheduled tasks and Windows Task Scheduler
│       ├── Password_Harvesting/    # Mimikatz, DPAPI extraction
│       ├── Windows_Update_Bypass/  # Exploiting update mechanisms
│       ├── Group_Policy/           # GPO exploitation for privilege escalation
│       ├── COM_Objects/            # COM interface abuse
│       └── Kernel_Exploits/        # PrintNightmare, Zerologon, CVE-based escalations
|_____________________________________________________________________
├── 📂 ACTIVE_DIRECTORY/             # OSCP / PEN-200 focused
│   ├── Enumeration/
│   │   ├── BloodHound.md           # Basic BloodHound usage & queries
│   │   ├── PowerView.md            # Enumeration with PowerView scripts
│   │   ├── LDAP_Queries.md         # Manual LDAP enumeration with ldapsearch
│   │   └── User_Enumeration.md     # Finding domain users & SPNs
│   ├── Attacks/
│   │   ├── Kerberoasting.md        # Extracting service tickets with Rubeus / kerberoast
│   │   ├── NTLM_Relay.md           # Responder + ntlmrelayx setup for relaying
│   │   ├── AS_REP_Roasting.md      # Attacking accounts without Kerberos preauth
│   │   └── ACL_Abuse.md            # Simple ACL abuse for privilege escalation
│   └── Lateral/
│       ├── Pass_the_Hash.md        # Using CrackMapExec / wmiexec for lateral movement
│       ├── Pass_the_Ticket.md      # Kerberos ticket reuse with Mimikatz / Rubeus
│       ├── DCSync.md               # Using secretsdump.py for syncing secrets
│       └── RDP_Access.md           # Basic RDP connection for lateral
|___________________________________________
├── 📁 Post_Exploitation/
│   ├── Stabilization/
│   │   ├── Linux_TTY_Upgrade.md         # python -c, script, socat, etc.
│   │   ├── Windows_TTY_Upgrade.md       # powershell, python, nc hacks
│   │   └── Persistence.md                # cronjobs, startup scripts, scheduled tasks
│   ├── Credential_Harvesting/
│   │   ├── Linux_Creds.md                # /etc/passwd, /etc/shadow, ssh keys
│   │   ├── Windows_Creds.md              # Mimikatz, lsass dump, DPAPI
│   ├── File_Transfers/
│   │   ├── Linux_Upload_Download.md     # wget, curl, python3 -m http.server, netcat
│   │   ├── Windows_Upload_Download.md   # certutil, bitsadmin, powershell web requests
```

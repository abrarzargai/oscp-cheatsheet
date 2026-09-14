
```bash
dirb http://$VICTIM_IP


ffuf -w /usr/share/wordlists/seclists/Discovery/Web-Content/raft-large-directories-lowercase.txt -u http://$VICTIM_IP/FUZZ


gobuster dir -u http://$VICTIM_IP/ -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt
```
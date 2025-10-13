
```bash
dirb http://192.168.80.1/


ffuf -w /usr/share/wordlists/seclists/Discovery/Web-Content/raft-large-directories-lowercase.txt -u http://$t/FUZZ


gobuster dir -u http://$t/ -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt
```
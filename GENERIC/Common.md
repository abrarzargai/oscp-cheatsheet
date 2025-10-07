### Subdomain enumeration

```bash
ffuf -u <http://$t> -H "Host: FUZZ.soccer.htb" -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-20000.txt -ac

gobuster dns -d sea.htb -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-20000.txt -t 50  
```

### Directory busting

```bash
ffuf -w /usr/share/wordlists/seclists/Discovery/Web-Content/raft-large-directories-lowercase.txt -u <http://sea.htb/FUZZ>

gobuster dir -u <http://$t> -w /usr/share/wordlists/dirb/big.txt
```


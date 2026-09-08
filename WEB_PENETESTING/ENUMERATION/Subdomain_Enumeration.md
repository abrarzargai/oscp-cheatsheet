

```bash
ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/namelist.txt -H "Host: FUZZ.boardlight.htb" -u http://$t -fs 33560
```

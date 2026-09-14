

```bash
ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/namelist.txt -H "Host: FUZZ.boardlight.htb" -u http://$VICTIM_IP -fs 33560
```

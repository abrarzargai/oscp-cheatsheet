
# <span style="color:#8BE9FD">NXC — host finding using smb</span>
```bash
# Add all target hostnames to /etc/hosts automatically
nxc smb $VICTIM_IP --generate-hosts-file hosts
```

# <span style="color:#8BE9FD">ffuf — vhost fuzzing</span>
```bash
dig axfr @$VICTIM_IP $DOMAIN

nslookup $DOMAIN $VICTIM_IP

dnsenum --dnsserver $VICTIM_IP -f $WORDLIST_PATH/seclists/Discovery/DNS/subdomains-top1million-5000.txt $DOMAIN

dnsrecon -n $VICTIM_IP -d $DOMAIN -t axfr
```

# <span style="color:#8BE9FD">ffuf — vhost fuzzing</span>
```bash
ffuf -w $WORDLIST_PATH/seclists/Discovery/DNS/namelist.txt -H "Host: FUZZ.$DOMAIN" -u http://$VICTIM_IP 
```

# <span style="color:#8BE9FD">gobuster — vhost + dns</span>
```bash
gobuster vhost -u http://$VICTIM_IP --append-domain -w $WORDLIST_PATH/seclists/Discovery/DNS/subdomains-top1million-5000.txt
gobuster dns   -d $DOMAIN -r $VICTIM_IP -w $WORDLIST_PATH/seclists/Discovery/DNS/subdomains-top1million-5000.txt
```

# <span style="color:#8BE9FD">Passive (internet-facing targets)</span>
```bash
subfinder -d $DOMAIN -silent
assetfinder --subs-only $DOMAIN
curl -s "https://crt.sh/?q=%25.$DOMAIN&output=json" | jq -r '.[].name_value' | sort -u
```

# <span style="color:#8BE9FD">ffuf</span>
Fastest and most flexible. `FUZZ` is the injection point — put it anywhere in the URL/headers.
```bash
# Directories
ffuf -w $WORDLIST_PATH/seclists/Discovery/Web-Content/raft-large-directories-lowercase.txt -u http://$VICTIM_IP/FUZZ

# Files with extensions + auto-calibration (strips bogus 200/soft-404 responses)
ffuf -w $WORDLIST_PATH/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -u http://$VICTIM_IP/FUZZ -e .php,.txt,.html,.bak -ac -c

# Match / filter responses
ffuf -w wordlist.txt -u http://$VICTIM_IP/FUZZ -mc 200,301,302,401,403   # match codes
ffuf -w wordlist.txt -u http://$VICTIM_IP/FUZZ -fc 404 -fs 4242 -fw 12    # filter code/size/words

# vhost fuzzing (needs /etc/hosts → $DOMAIN); -fs 0 hides the default page
ffuf -w $WORDLIST_PATH/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u http://$VICTIM_IP -H "Host: FUZZ.$DOMAIN" -fs 0

# GET parameter fuzzing
ffuf -w $WORDLIST_PATH/seclists/Discovery/Web-Content/burp-parameter-names.txt -u "http://$VICTIM_IP/index.php?FUZZ=test" -fs 0
```

# <span style="color:#8BE9FD">gobuster</span>
Fast, simple, single-purpose modes: `dir`, `dns`, `vhost`.
```bash
# Directories
gobuster dir -u http://$VICTIM_IP/ -w $WORDLIST_PATH/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt

# Extensions, threads, status/blacklist, ignore TLS errors on HTTPS, save
gobuster dir -u http://$VICTIM_IP/ -w $WORDLIST_PATH/seclists/Discovery/Web-Content/raft-medium-files.txt -x php,txt,html,bak -t 50 -b 404,403 -k -o gobuster.txt

# Follow redirects + expanded (full URL) output; add a cookie for authed areas
gobuster dir -u http://$VICTIM_IP/ -w wordlist.txt -r -e -c "PHPSESSID=abc123"

# DNS subdomain brute force
gobuster dns -d $DOMAIN -w $WORDLIST_PATH/seclists/Discovery/DNS/subdomains-top1million-5000.txt

# vhost enumeration (append the base domain to each word)
gobuster vhost -u http://$VICTIM_IP --append-domain -w $WORDLIST_PATH/seclists/Discovery/DNS/subdomains-top1million-5000.txt
```

## <span style="color:#8BE9FD">feroxbuster</span>
Recursive by default and fast — great first pass.
```bash
# Basic recursive scan
feroxbuster -u http://$VICTIM_IP -w $WORDLIST_PATH/seclists/Discovery/Web-Content/raft-medium-directories.txt

# With extensions, threads, and filter out 404-like sizes
feroxbuster -u http://$VICTIM_IP -w $WORDLIST_PATH/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -x php,txt,html,bak -t 50 -C 404,403 -o ferox.txt

# Limit recursion depth (0 = no recursion) and follow redirects
feroxbuster -u http://$VICTIM_IP -d 2 -r
```


# <span style="color:#FFB86C">Useful wordlists</span>
```bash
# ── Directories / files ──
$WORDLIST_PATH/seclists/Discovery/Web-Content/common.txt                       # quick first pass
$WORDLIST_PATH/seclists/Discovery/Web-Content/raft-medium-directories.txt
$WORDLIST_PATH/seclists/Discovery/Web-Content/raft-large-directories.txt
$WORDLIST_PATH/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt
$WORDLIST_PATH/dirb/common.txt
$WORDLIST_PATH/dirbuster/directory-list-2.3-medium.txt


# ── Files by extension / big lists ──
$WORDLIST_PATH/seclists/Discovery/Web-Content/raft-medium-files.txt
$WORDLIST_PATH/seclists/Discovery/Web-Content/big.txt


# ── App / tech specific ──
$WORDLIST_PATH/seclists/Discovery/Web-Content/CMS/wordpress.fuzz.txt
$WORDLIST_PATH/seclists/Discovery/Web-Content/Common-DB-Backups.txt
$WORDLIST_PATH/seclists/Discovery/Web-Content/api/api-endpoints.txt


# ── Backup / config files ──
$WORDLIST_PATH/seclists/Discovery/Web-Content/backup-files.txt


# ── Subdomains / vhosts (for ffuf -H "Host:") ──
$WORDLIST_PATH/seclists/Discovery/DNS/subdomains-top1million-5000.txt
$WORDLIST_PATH/seclists/Discovery/DNS/subdomains-top1million-110000.txt
$WORDLIST_PATH/seclists/Discovery/DNS/namelist.txt
```

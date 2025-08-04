
- **Short names** are **case-insensitive** (e.g., `TRANSF~1.ASP` = `transfer.aspx`).
- Access **hidden admin panels** (e.g., `/ADMINI~1/` → `/Administrator/`)
-  Leak **source code** (e.g., `WEB.CON~1` → `web.config`).
#### **Tools for Enumeration**

- **Manual Method** `curl -I http://<IP>/~a`, `curl -I http://<IP>/~b ` Look for HTTP 200 responses.
- **Automated Tool**:  `java -jar iis_shortname_scanner.jar 0 5 http://<IP>/`

#### **Finding Full Filenames**
- **Generate a Wordlist**: `egrep -r ^transf /usr/share/wordlists/* | sed 's/^[^:]*://' > /tmp/list.txt`
- **Brute-Force with Gobuster**: `gobuster dir -u http://<IP>/ -w /tmp/list.txt -x .aspx,.asp`


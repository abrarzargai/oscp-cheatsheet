

### 🔍 Basic Terms

|Term|Meaning|
|---|---|
|**Filtered**|No reply, firewall might be blocking.|
|**Open**|Port is accessible.|
|**Closed**|Port replied but no service is running.|
|**Dropped**|No response at all.|
|**Rejected**|Response with error (e.g., RST, ICMP error).|

### ⚙️ Common Scan Options

|Option|Description|
|---|---|
|`-p`|Specify ports (e.g., `-p 80,443`)|
|`-sS`|Stealth SYN scan|
|`-sA`|ACK scan (firewall detection)|
|`-sT`|TCP connect scan|
|`-Pn`|Skip ping (assume host is up)|
|`-n`|No DNS resolution|
|`--disable-arp-ping`|Don’t use ARP ping|
|`--packet-trace`|Show sent and received packets|

### 🚧 Firewall Evasion

|Technique|Command|Notes|
|---|---|---|
|**ACK Scan**|`nmap -sA -p <PORT> <IP>`|Detects if firewall is dropping packets|
|**Use Trusted Port**|`--source-port 53`|Pretend traffic is DNS (often allowed)|
|**Spoof Source IP**|`-S <IP> -e <interface>`|Tries to bypass IP-based blocks|
|**Random Decoys**|`-D RND:5`|Hides your real IP with 5 fake ones|
|**Custom Decoys**|`-D 1.2.3.4,5.6.7.8,ME`|Mix fake IPs and your real one|
|**Avoid Detection**|`--scan-delay 1s`|Slow scan to reduce noise|
|**OS Detection Quietly**|`nmap -O -Pn -n -T2`|Detect OS with lower speed (less suspicious)|


### 💾 **Output Formats**

|Option|Description|
|---|---|
|`-oN file`|Normal output|
|`-oG file`|Grepable output|
|`-oX file`|XML output|
|`-oA file`|All formats (file.nmap, .xml, .gnmap)|

### ⚙️ **Performance & Timing**

|Option|Description|
|---|---|
|`-T0-T5`|Timing template (0 = slow, 5 = fast)|
|`--min-rate 300`|Set minimum packet rate|
|`--max-retries 2`|Limit retries (faster scans)|
|`--stats-every=5s`|Show progress every 5 sec|

### 📡 **Host Discovery**

|Option|Description|
|---|---|
|`-sn`|Ping scan only (no port scan)|
|`-Pn`|Treat host as alive (skip ping)|
|`-n`|Skip DNS resolution (faster)|
|`-PE`|ICMP Echo Request ping|
|`--disable-arp-ping`|Disable ARP ping|

### 🔎 **Scan Types**

| Option     | Description                      |
| ---------- | -------------------------------- |
| `-sS`      | TCP SYN scan (stealth)           |
| `-sT`      | TCP Connect scan                 |
| `-sU`      | UDP scan                         |
| `-sV`      | Detect service versions          |
| `-sC`      | Run default scripts (safe NSE)   |
| `--script` | Run specific NSE scripts         |
| `-O`       | OS detection                     |
| `-A`       | Aggressive (OS, version, script) |

Firewall bypass
- `sudo nmap -O -D RND:10 10.129.31.2`
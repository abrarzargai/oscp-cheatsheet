

### <span style="color:#50FA7B">🔍 Basic Terms</span>

|Term|Meaning|
|---|---|
|**Filtered**|No reply, firewall might be blocking.|
|**Open**|Port is accessible.|
|**Closed**|Port replied but no service is running.|
|**Dropped**|No response at all.|
|**Rejected**|Response with error (e.g., RST, ICMP error).|

### <span style="color:#50FA7B">⚙️ Common Scan Options</span>

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

### <span style="color:#50FA7B">🚧 Firewall Evasion</span>

|Technique|Command|Notes|
|---|---|---|
|**ACK Scan**|`nmap -sA -p <PORT> $VICTIM_IP`|Detects if firewall is dropping packets|
|**Use Trusted Port**|`--source-port 53`|Pretend traffic is DNS (often allowed)|
|**Spoof Source IP**|`-S $VICTIM_IP -e <interface>`|Tries to bypass IP-based blocks|
|**Random Decoys**|`-D RND:5`|Hides your real IP with 5 fake ones|
|**Custom Decoys**|`-D 1.2.3.4,5.6.7.8,ME`|Mix fake IPs and your real one|
|**Avoid Detection**|`--scan-delay 1s`|Slow scan to reduce noise|
|**OS Detection Quietly**|`nmap -O -Pn -n -T2`|Detect OS with lower speed (less suspicious)|


### <span style="color:#50FA7B">💾 **Output Formats**</span>

|Option|Description|
|---|---|
|`-oN file`|Normal output|
|`-oG file`|Grepable output|
|`-oX file`|XML output|
|`-oA file`|All formats (file.nmap, .xml, .gnmap)|

### <span style="color:#50FA7B">⚙️ **Performance & Timing**</span>

|Option|Description|
|---|---|
|`-T0-T5`|Timing template (0 = slow, 5 = fast)|
|`--min-rate 300`|Set minimum packet rate|
|`--max-retries 2`|Limit retries (faster scans)|
|`--stats-every=5s`|Show progress every 5 sec|

### <span style="color:#50FA7B">📡 **Host Discovery**</span>

|Option|Description|
|---|---|
|`-sn`|Ping scan only (no port scan)|
|`-Pn`|Treat host as alive (skip ping)|
|`-n`|Skip DNS resolution (faster)|
|`-PE`|ICMP Echo Request ping|
|`--disable-arp-ping`|Disable ARP ping|

### <span style="color:#50FA7B">🔎 **Scan Types**</span>

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
- `sudo nmap -O -D RND:10 $VICTIM_IP`


# <span style="color:#FF5555">Firewall and IDS/IPS Evasion</span>

# <span style="color:#FF5555">Firewall and IDS/IPS Evasion</span>

## <span style="color:#8BE9FD">Scan by Using Decoys</span>
  
```
sudo nmap $VICTIM_IP -p 22,80,50000 -sV -sS -Pn -n --disable-arp-ping --packet-trace --source-port 53 -e tun0 -D RND:10
```
- `-p` 22,80,50000 → Scan ports 22 (SSH), 80 (HTTP), and 50000.
- `-sV` → Detect service versions (e.g., Apache 2.4.41).
- `-sS` → Stealthy SYN scan (less likely to trigger alarms).
- `-Pn` → Skip host discovery (assume host is up).
- `-n` → Don’t do DNS lookups (faster & stealthier).
- `--disable-arp-ping` → Don’t send ARP requests.
- `--packet-trace` → Show each packet being sent.
- `--source-port 53` → Make it look like the traffic is coming from DNS (port 53), which firewalls often allow.
- `-e tun0` → Use the VPN interface.
- `-D RND:10` → Use 10 random decoy IPs so the target won’t know which IP is yours.

**Purpose:** Makes it harder for the target to figure out where the scan came from.  

## <span style="color:#8BE9FD">Connect To The Filtered Port `50000` discovered, from a different source port of `53` to evade detection.</span>

```
ncat -nv --source-port 53 $VICTIM_IP 50000

# worked
sudo nc -nv -p53 $VICTIM_IP 50000
```  
- --source-port 53 → Pretend the traffic is coming from DNS port 53.
- 50000 → The target’s port we’re trying to reach.

**Purpose:** Some firewalls only block unknown ports but allow DNS (53), so we "sneak in" using 53.

## <span style="color:#8BE9FD">Testing Firewall Rule</span>

```
sudo nmap $VICTIM_IP -n -Pn -p445 -O
```
- p445 → Check SMB file-sharing port.

- O → Try to detect the OS.

**Purpose:** See if port 445 is open and allowed through the firewall.

## <span style="color:#8BE9FD">Scan by Using Different Source IP</span>

```
sudo nmap $VICTIM_IP -n -Pn -p 445 -O -S $VICTIM_IP -e tun0
```
- -S $VICTIM_IP → Pretend your IP is $VICTIM_IP.
- Needs special privileges and may only work in certain network setups.

**Purpose:** Hide your real IP from logs.  

## <span style="color:#8BE9FD">SYN-Scan From DNS Port</span>

```
sudo nmap $VICTIM_IP -p50000 -sS -Pn -n --disable-arp-ping --packet-trace --source-port 53
```  
Same trick as before: pretend traffic is from DNS so it’s more likely to bypass filters.


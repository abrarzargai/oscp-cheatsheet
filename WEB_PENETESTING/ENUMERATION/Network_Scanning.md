# <span style="color:#8BE9FD">Network Scanning</span>

## <span style="color:#50FA7B">Host discovery (ping sweep)</span>
Find live hosts on a subnet before scanning ports.
```bash
# -a alive, -s stats, -g generate range, -q quiet
fping -asgq 192.168.124.0/24

# -sn = ping scan, no port scan
nmap -sn 192.168.124.0/24

# no-tools fallback
for i in {1..254}; do ping -c 1 -W 1 192.168.1.$i | grep "64 bytes" & done
```

## <span style="color:#50FA7B">Port scanning (single host)</span>
```bash
# UDP scan (needs root)
sudo nmap -sU --min-rate 10000 $VICTIM_IP

# all 65535 TCP ports, skip host discovery
nmap -p- -T4 -v --min-rate 10000 -Pn $VICTIM_IP

# default scripts + service/version detection
nmap -sCV -T4 -v --min-rate 10000 -Pn $VICTIM_IP

# add known-vuln checks
nmap -sCV -T4 -v --min-rate 10000 -Pn $VICTIM_IP --script vuln
```
> [!note] flags
> `-p-` all ports · `-sCV` = `-sC` (default scripts) + `-sV` (versions) · `-Pn` skip ping (treat host as up) · `-T4` faster timing · `--min-rate 10000` packets/sec floor · `-v` verbose.

## <span style="color:#50FA7B">Rustscan</span>
Fast port sweep, then pipes open ports into nmap (`--` passes the rest to nmap).
```bash
# aggressive (-A): OS, versions, scripts, traceroute
rustscan -a $VICTIM_IP -- -A

# same as the nmap -sCV scan above: default scripts + service/version detection
rustscan -a $VICTIM_IP -- -sCV
```

## <span style="color:#50FA7B">Multiple targets</span>
```bash
# -iL = read targets from file
nmap -sCV -T4 -v --min-rate 10000 -Pn -iL ./ips.txt
```

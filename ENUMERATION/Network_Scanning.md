
### ping sweep
```bash
fping -asgq 192.168.124.0/24

nmap -sn 192.168.124.0/24

for i in {1..254}; do ping -c 1 -W 1 192.168.1.$i | grep "64 bytes" & done
```
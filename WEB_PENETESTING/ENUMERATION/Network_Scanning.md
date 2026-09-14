
### <span style="color:#50FA7B">ping sweep</span>
```bash
fping -asgq 192.168.124.0/24

nmap -sn 192.168.124.0/24

for i in {1..254}; do ping -c 1 -W 1 192.168.1.$i | grep "64 bytes" & done
```



```bash
sudo nmap -sU --min-rate 10000 $VICTIM_IP 

nmap -p- -T4 -v --min-rate 10000 -Pn $VICTIM_IP 

nmap -sCV -T4 -v --min-rate 10000 -Pn $VICTIM_IP

nmap -sCV -T4 -v --min-rate 10000 -Pn $VICTIM_IP --script vuln


## Rustscan
rustscan -a $VICTIM_IP -- -A
```


```bash
# list of ips
nmap -sCV -T4 -v --min-rate 10000 -Pn -iL ./ips.txt
```
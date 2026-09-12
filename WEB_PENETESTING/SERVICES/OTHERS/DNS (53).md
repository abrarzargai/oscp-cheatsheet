
# <span style="color:#FF5555">Information Gathering :</span>

> [Domain Name System - DNS](https://academy.hackthebox.com/module/112/section/1069) Footprinting and enumeration.

```bash
dig ns inlanefreight.htb @$VICTIM_IP
```

> Subdomain DNS Brute Forcing.

```bash
dnsenum --dnsserver $VICTIM_IP --enum -p 0 -s 0 -f /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt inlanefreight.htb

```
or
```bash
for sub in $(cat /usr/share/wordlist/seclist/Discovery/DNS/subdomains-top1million-110000.txt); do
  ip=$(dig +short $sub.inlanefreight.htb @$VICTIM_IP)
  if [[ "$ip" == "$VICTIM_IP" ]]; then
    echo "FOUND: $sub.inlanefreight.htb -> $ip"
    break
  else
    echo "NOT FOUND: $sub.inlanefreight.htb -> $ip"
  fi
done
```

> Find Hidden Zones or Internal Domains

```bash
dig axfr internal.inlanefreight.htb @$VICTIM_IP
```
>Reverse DNS Lookup

```bash
dig -x $VICTIM_IP @$VICTIM_IP

# example 
dig -x $VICTIM_IP @$VICTIM_IP
```
> Identify DNS Server
```bash
nmap -p 53 --script=dns-recursion,dns-service-discovery $VICTIM_IP

nmap -p53 -Pn -sV -sC $VICTIM_IP
```


|**Command**|**Description**|
|---|---|
|`dig AXFR @ns1.inlanefreight.htb inlanefreight.htb`|Perform an AXFR zone transfer attempt against a specific name server.|
|`subfinder -d inlanefreight.com -v`|Brute-forcing subdomains.|
|`host support.inlanefreight.com`|DNS lookup for the specified subdomain.|

## <span style="color:#8BE9FD">Find all available DNS records subdomains</span>
**Question:** Find all available DNS records for the “inlanefreight.htb” domain on the target name server and submit the flag found as a DNS record as the answer.

Tools: subbrute
```shell-session
git clone https://github.com/TheRook/subbrute.git
```

1. Add IP and domain in /etc/hosts
   ```bash
   $VICTIM_IP    inlanefreight.htb
```
   
2. Add IP to resolvers.txt in subbrute.
   ```bash
   echo "$VICTIM_IP" > resolvers.txt
```
   
3. run subbrute.py
   ```bash
   python3 subbrute.py -p inlanefreight.htb -s names.txt -r resolvers.txt
```
   
4. once you get another subdomain, try the to use dig axfr to extract information.
   ```bash
   dig axfr hr.inlanefreight.htb @$VICTIM_IP
```
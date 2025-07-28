
# Information Gathering :

> [Domain Name System - DNS](https://academy.hackthebox.com/module/112/section/1069) Footprinting and enumeration.

```bash
dig ns inlanefreight.htb @10.129.53.210
```

> Subdomain DNS Brute Forcing.

```bash
dnsenum --dnsserver 10.129.53.210 --enum -p 0 -s 0 -f /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt inlanefreight.htb

```
or
```bash
for sub in $(cat /usr/share/wordlist/seclist/Discovery/DNS/subdomains-top1million-110000.txt); do
  ip=$(dig +short $sub.inlanefreight.htb @10.129.42.195)
  if [[ "$ip" == "10.129.18.203" ]]; then
    echo "FOUND: $sub.inlanefreight.htb -> $ip"
    break
  else
    echo "NOT FOUND: $sub.inlanefreight.htb -> $ip"
  fi
done
```

> Find Hidden Zones or Internal Domains

```bash
dig axfr internal.inlanefreight.htb @10.129.42.195
```
>Reverse DNS Lookup

```bash
dig -x <ip> @<dns-server-ip>

# example 
dig -x 10.129.18.203 @10.129.42.195
```
> Identify DNS Server
```bash
nmap -p 53 --script=dns-recursion,dns-service-discovery <target-ip>

nmap -p53 -Pn -sV -sC <target-ip>
```


|**Command**|**Description**|
|---|---|
|`dig AXFR @ns1.inlanefreight.htb inlanefreight.htb`|Perform an AXFR zone transfer attempt against a specific name server.|
|`subfinder -d inlanefreight.com -v`|Brute-forcing subdomains.|
|`host support.inlanefreight.com`|DNS lookup for the specified subdomain.|

## Find all available DNS records subdomains
**Question:** Find all available DNS records for the “inlanefreight.htb” domain on the target name server and submit the flag found as a DNS record as the answer.

Tools: subbrute
```shell-session
git clone https://github.com/TheRook/subbrute.git
```

1. Add IP and domain in /etc/hosts
   ```bash
   10.129.203.6    inlanefreight.htb
```
   
2. Add IP to resolvers.txt in subbrute.
   ```bash
   echo "10.129.203.6" > resolvers.txt
```
   
3. run subbrute.py
   ```bash
   python3 subbrute.py -p inlanefreight.htb -s names.txt -r resolvers.txt
```
   
4. once you get another subdomain, try the to use dig axfr to extract information.
   ```bash
   dig axfr hr.inlanefreight.htb @$ip
```
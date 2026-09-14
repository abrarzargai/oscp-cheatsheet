"""
core/checklists.py — service -> checklist mapping + nmap scan presets.

To add a new service:
  1. Add a list entry to SERVICE_CHECKLISTS below — each item needs a
     stable "id" (used as the checkbox's persistence key, never rename it
     once you've used it on a real box or you'll orphan saved checkbox
     state), a human "label", and a "cmd" template.
  2. Point nmap's service names at that key in SERVICE_ALIASES (nmap's
     -sV service string, e.g. "microsoft-ds", "http", "ms-wbt-server").
  3. Optionally add a port-number fallback in PORT_FALLBACK, used when
     nmap didn't fingerprint a service name (e.g. filtered/unusual banner).

Command templates use <ANGLE_BRACKET> placeholders, resolved server-side
in core/runner.py's resolve_template() using the active project + the
attacker ip/port the frontend sends along (pulled from the top-bar config
fields):
  <IP>            active project's target_ip
  <DOMAIN>        active project's domain
  <DC_IP>         active project's dc_ip
  <ATTACKER_IP>   from the browser's Attacker IP field
  <PORT>          from the browser's Attacker Port field
  <PROJECT_DIR>   absolute path to the active project's folder
  <NAME>          active project's name
"""

SERVICE_CHECKLISTS = {
    "smb": [
        {"id": "smbmap", "label": "smbmap anonymous share listing",
         "cmd": "smbmap -H <IP>"},
        {"id": "enum4linux", "label": "enum4linux-ng full enumeration",
         "cmd": "enum4linux-ng -A <IP>"},
        {"id": "smbclient-list", "label": "smbclient -L (list shares)",
         "cmd": "smbclient -L //<IP>/ -N"},
        {"id": "null-session", "label": "null session check (rpcclient)",
         "cmd": "rpcclient -U '' -N <IP>"},
        {"id": "crackmapexec", "label": "crackmapexec smb enum shares/sessions",
         "cmd": "crackmapexec smb <IP> --shares --sessions"},
    ],
    "http": [
        {"id": "whatweb", "label": "whatweb fingerprint",
         "cmd": "whatweb -a 3 http://<IP>"},
        {"id": "gobuster-dir", "label": "gobuster dir busting",
         "cmd": "gobuster dir -u http://<IP> -w /usr/share/wordlists/dirb/common.txt -o <PROJECT_DIR>/scans/web/gobuster.txt"},
        {"id": "nikto", "label": "nikto scan",
         "cmd": "nikto -h http://<IP>"},
        {"id": "view-source", "label": "curl view source / headers",
         "cmd": "curl -sSik http://<IP>/"},
    ],
    "https": [
        {"id": "whatweb", "label": "whatweb fingerprint (https)",
         "cmd": "whatweb -a 3 https://<IP> --no-check-certificate"},
        {"id": "gobuster-dir", "label": "gobuster dir busting (https)",
         "cmd": "gobuster dir -u https://<IP> -k -w /usr/share/wordlists/dirb/common.txt -o <PROJECT_DIR>/scans/web/gobuster-ssl.txt"},
        {"id": "sslscan", "label": "sslscan / cert info",
         "cmd": "sslscan <IP>"},
    ],
    "ftp": [
        {"id": "anon-login", "label": "anonymous FTP login",
         "cmd": "ftp -inv <IP>"},
        {"id": "nmap-ftp-scripts", "label": "nmap ftp-* NSE scripts",
         "cmd": "nmap -p21 --script=ftp-anon,ftp-bounce,ftp-syst <IP>"},
    ],
    "ssh": [
        {"id": "ssh-audit", "label": "ssh-audit (algos/version)",
         "cmd": "ssh-audit <IP>"},
    ],
    "smtp": [
        {"id": "smtp-user-enum", "label": "smtp-user-enum VRFY",
         "cmd": "smtp-user-enum -M VRFY -U /usr/share/seclists/Usernames/Names/names.txt -t <IP>"},
        {"id": "nmap-smtp-scripts", "label": "nmap smtp-* NSE scripts",
         "cmd": "nmap -p25 --script=smtp-commands,smtp-open-relay <IP>"},
    ],
    "dns": [
        {"id": "dig-axfr", "label": "dig AXFR zone transfer attempt",
         "cmd": "dig axfr @<IP> <DOMAIN>"},
        {"id": "dnsrecon", "label": "dnsrecon against domain",
         "cmd": "dnsrecon -d <DOMAIN> -n <IP>"},
    ],
    "kerberos": [
        {"id": "kerbrute-userenum", "label": "kerbrute userenum",
         "cmd": "kerbrute userenum -d <DOMAIN> --dc <DC_IP> /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt"},
        {"id": "asrep-roast", "label": "AS-REP roast (no creds)",
         "cmd": "impacket-GetNPUsers <DOMAIN>/ -dc-ip <DC_IP> -usersfile users.txt -no-pass -format hashcat"},
    ],
    "ldap": [
        {"id": "ldapsearch-anon", "label": "ldapsearch anonymous bind",
         "cmd": "ldapsearch -x -H ldap://<IP> -b \"dc=$(echo <DOMAIN> | sed 's/\\./,dc=/g')\""},
        {"id": "windapsearch", "label": "windapsearch anonymous enum",
         "cmd": "windapsearch --dc-ip <IP> -u '' --da"},
    ],
    "rpc": [
        {"id": "rpcclient-enum", "label": "rpcclient enumdomusers",
         "cmd": "rpcclient -U '' -N <IP> -c 'enumdomusers'"},
        {"id": "rpcinfo", "label": "rpcinfo -p",
         "cmd": "rpcinfo -p <IP>"},
    ],
    "rdp": [
        {"id": "rdp-sec-check", "label": "rdp-sec-check (NLA / ciphers)",
         "cmd": "rdp-sec-check <IP>"},
        {"id": "xfreerdp", "label": "xfreerdp connect",
         "cmd": "xfreerdp /v:<IP> /u:guest"},
    ],
    "winrm": [
        {"id": "evil-winrm", "label": "evil-winrm connect",
         "cmd": "evil-winrm -i <IP> -u guest"},
    ],
    "mssql": [
        {"id": "mssql-login", "label": "impacket-mssqlclient windows auth",
         "cmd": "impacket-mssqlclient <DOMAIN>/guest@<IP> -windows-auth"},
    ],
    "mysql": [
        {"id": "mysql-login", "label": "mysql root/blank login attempt",
         "cmd": "mysql -h <IP> -u root -p"},
    ],
    "postgres": [
        {"id": "psql-login", "label": "psql postgres/blank login attempt",
         "cmd": "psql -h <IP> -U postgres"},
    ],
    "redis": [
        {"id": "redis-cli", "label": "redis-cli unauthenticated connect",
         "cmd": "redis-cli -h <IP>"},
    ],
    "nfs": [
        {"id": "showmount", "label": "showmount -e (list exports)",
         "cmd": "showmount -e <IP>"},
    ],
}

# nmap service-name string (lowercased, exact match on the token before any
# "/" nmap sometimes adds, e.g. "ssl/http") -> canonical SERVICE_CHECKLISTS key
SERVICE_ALIASES = {
    "microsoft-ds": "smb", "netbios-ssn": "smb",
    "http": "http", "http-proxy": "http", "http-alt": "http", "www": "http",
    "https": "https", "ssl/http": "https", "http-simple": "http",
    "ftp": "ftp",
    "ssh": "ssh",
    "smtp": "smtp", "smtps": "smtp",
    "domain": "dns",
    "kerberos-sec": "kerberos",
    "ldap": "ldap", "ldaps": "ldap", "globalcatldap": "ldap", "globalcatldapssl": "ldap",
    "msrpc": "rpc", "rpcbind": "rpc",
    "ms-wbt-server": "rdp", "rdp": "rdp",
    "ms-sql-s": "mssql", "ms-sql2000": "mssql",
    "mysql": "mysql",
    "postgresql": "postgres",
    "redis": "redis",
    "nfs": "nfs",
}

# port number fallback when nmap couldn't fingerprint a service name
PORT_FALLBACK = {
    21: "ftp", 22: "ssh", 25: "smtp", 53: "dns",
    80: "http", 443: "https", 8080: "http", 8443: "https",
    88: "kerberos", 464: "kerberos",
    111: "rpc", 135: "rpc",
    139: "smb", 445: "smb",
    389: "ldap", 636: "ldap", 3268: "ldap", 3269: "ldap",
    1433: "mssql", 3306: "mysql", 5432: "postgres", 6379: "redis",
    2049: "nfs",
    3389: "rdp",
    5985: "winrm", 5986: "winrm",
}

# Preset project-wide nmap scans, shown as "run" buttons before you've even
# parsed a single port. Written into scans/nmap/<name>.{xml,nmap,gnmap} via
# -oA (the .nmap file already has everything the terminal shows, script
# output included, so there's no separate tee'd .txt to keep in sync).
# -v / --stats-every surface live progress instead of going silent until
# the scan finishes.
NMAP_PRESETS = [
    {"id": "quick", "label": "Quick scan (top 1000, -sCV)",
     "cmd": "nmap -v -sCV -oA <PROJECT_DIR>/scans/nmap/quick <IP>"},
    {"id": "full", "label": "Full TCP scan (-p- -sCV)",
     "cmd": "nmap -v -p- -sCV --min-rate 3000 --stats-every 15s -oA <PROJECT_DIR>/scans/nmap/full <IP>"},
    {"id": "udp", "label": "Top 100 UDP scan",
     "cmd": "sudo nmap -v -sU --top-ports 100 --stats-every 15s -oA <PROJECT_DIR>/scans/nmap/udp <IP>"},
]


def checklist_for_service(service, port):
    key = None
    if service:
        svc = service.lower().strip()
        key = SERVICE_ALIASES.get(svc)
    if not key:
        key = PORT_FALLBACK.get(port)
    if not key:
        return []
    return SERVICE_CHECKLISTS.get(key, [])

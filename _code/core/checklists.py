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
  <SCHEME>        from the browser's Scheme selector (http/https), default http
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
        {"id": "nxc", "label": "nxc smb enum shares/sessions",
         "cmd": "nxc smb <IP> --shares --sessions"},
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
# the scan finishes. "mkdir -p" up front means this works even for a
# project created before its scans/<x> subfolder existed — every preset in
# this file follows the same pattern so its output always has somewhere to
# land, whether or not core/projects.py's create_project() scaffolded it.
NMAP_PRESETS = [
    {"id": "quick", "label": "Quick scan (top 1000, -sCV)",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/nmap && nmap -v -sCV -oA <PROJECT_DIR>/scans/nmap/quick <IP>"},
    {"id": "full", "label": "Full TCP scan (-p- -sCV)",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/nmap && nmap -v -p- -sCV --min-rate 3000 --stats-every 15s -oA <PROJECT_DIR>/scans/nmap/full <IP>"},
    {"id": "udp", "label": "Top 100 UDP scan",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/nmap && sudo nmap -v -sU --top-ports 100 --stats-every 15s -oA <PROJECT_DIR>/scans/nmap/udp <IP>"},
]

# Rustscan presets — fast raw port discovery. -g/--greppable is redirected
# (shell '>') into a file under scans/rustscan/ so the frontend can list it
# as a "saved scan" and parse it the same way -oA's .xml lets nmap's.
RUSTSCAN_PRESETS = [
    {"id": "quick", "label": "Quick scan (default top ports)",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/rustscan && rustscan -a <IP> -g > <PROJECT_DIR>/scans/rustscan/quick.txt"},
    {"id": "full", "label": "Full port range (1-65535)",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/rustscan && rustscan -a <IP> --range 1-65535 -g > <PROJECT_DIR>/scans/rustscan/full.txt"},
]

# Port Scanning's tools, each with:
#   quick_presets     fixed one-click commands (same shape as any other
#                     category's "presets" list)
#   builder.flags     checkboxes for the "build a command" bar — the
#                     frontend joins whichever are checked and substitutes
#                     them into builder.template's {FLAGS} placeholder.
#                     builder.template's {PORTS} placeholder becomes
#                     "-p <value>" from that same bar's free-text ports
#                     field (fed by the results view's [copy ports]
#                     button) or "" when left empty. The assembled string
#                     then runs through the normal <IP>/<PROJECT_DIR>
#                     template resolution like any preset.
#   output            where this tool's result files live, for the
#                     "saved scans" file tabs (see /api/playbook/outputs)
#   results_endpoint / results_kind   which API to call for a saved scan's
#                     parsed data, and which frontend renderer to feed it
#                     to — each tool's output format gets its own parser
#                     (parsers.py) and its own display, they're not forced
#                     into one shared shape
PORT_SCANNING_TOOLS = [
    {
        "id": "nmap",
        "label": "nmap",
        "quick_presets": NMAP_PRESETS,
        "builder": {
            "flags": [
                {"id": "sc", "flag": "-sC", "label": "-sC (default scripts)", "default": True},
                {"id": "sv", "flag": "-sV", "label": "-sV (version detection)", "default": True},
                {"id": "verbose", "flag": "-v", "label": "-v (verbose)", "default": True},
            ],
            "template": "mkdir -p <PROJECT_DIR>/scans/nmap && nmap {FLAGS} {PORTS} -oA <PROJECT_DIR>/scans/nmap/custom <IP>",
        },
        "output": {"dir": "scans/nmap", "ext": ".xml"},
        "results_endpoint": "/api/nmap",
        "results_kind": "port_table",
    },
    {
        "id": "rustscan",
        "label": "rustscan",
        "quick_presets": RUSTSCAN_PRESETS,
        "builder": {
            "flags": [
                {"id": "ulimit", "flag": "--ulimit 5000", "label": "--ulimit 5000", "default": True},
                {"id": "range", "flag": "--range 1-65535", "label": "--range 1-65535 (all ports)", "default": False},
                {"id": "verbose", "flag": "-v", "label": "-v (verbose)", "default": False},
            ],
            "template": "mkdir -p <PROJECT_DIR>/scans/rustscan && rustscan -a <IP> {FLAGS} {PORTS} -g > <PROJECT_DIR>/scans/rustscan/custom.txt",
        },
        "output": {"dir": "scans/rustscan", "ext": ".txt"},
        "results_endpoint": "/api/rustscan",
        "results_kind": "port_list",
    },
]


# Directory/vhost bruteforcing presets — Engagement sidebar's Enumeration >
# Directory Bruteforce category. <SCHEME> follows the topbar's http/https
# selector, so these presets target whichever protocol you've picked there.
# Every preset writes to scans/web/<preset id>.txt — the category's "output"
# spec (see PLAYBOOK below) points the "saved output" file tabs + raw
# viewer at that same folder, keyed by preset id.
DIR_BRUTEFORCE_PRESETS = [
    {"id": "gobuster-common", "label": "gobuster dir (common.txt)",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/web && gobuster dir -u <SCHEME>://<IP>/ -w /usr/share/wordlists/dirb/common.txt -o <PROJECT_DIR>/scans/web/gobuster-common.txt"},
    {"id": "gobuster-medium", "label": "gobuster dir (seclists medium)",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/web && gobuster dir -u <SCHEME>://<IP>/ -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -o <PROJECT_DIR>/scans/web/gobuster-medium.txt"},
    {"id": "feroxbuster", "label": "feroxbuster recursive",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/web && feroxbuster -u <SCHEME>://<IP>/ -w /usr/share/wordlists/dirb/common.txt -o <PROJECT_DIR>/scans/web/feroxbuster.txt"},
]

# SMB enumeration presets — Engagement sidebar's Enumeration > SMB Enum
# category. None of these tools have their own "-o file" flag, so each is
# piped through `tee` — that still shows live output in the terminal (tee's
# whole job) while also saving it to scans/smb/<preset id>.txt for the
# "saved output" viewer.
SMB_ENUM_PRESETS = [
    {"id": "smbmap", "label": "smbmap anonymous share listing",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/smb && smbmap -H <IP> | tee <PROJECT_DIR>/scans/smb/smbmap.txt"},
    {"id": "enum4linux-ng", "label": "enum4linux-ng full enumeration",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/smb && enum4linux-ng -A <IP> | tee <PROJECT_DIR>/scans/smb/enum4linux-ng.txt"},
    {"id": "smbclient-list", "label": "smbclient -L (list shares)",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/smb && smbclient -L //<IP>/ -N | tee <PROJECT_DIR>/scans/smb/smbclient-list.txt"},
    {"id": "nxc-smb", "label": "nxc smb shares/sessions",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/smb && nxc smb <IP> --shares --sessions | tee <PROJECT_DIR>/scans/smb/nxc-smb.txt"},
]

# DNS enumeration presets — Engagement sidebar's Enumeration > DNS Enum
# category. <DOMAIN> is the active project's domain field; output tee'd to
# scans/dns/<preset id>.txt.
DNS_ENUM_PRESETS = [
    {"id": "dnsenum", "label": "dnsenum subdomain brute force",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/dns && dnsenum --dnsserver <IP> --enum -p 0 -s 0 -f /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt <DOMAIN> | tee <PROJECT_DIR>/scans/dns/dnsenum.txt"},
    {"id": "dig-axfr", "label": "dig AXFR zone transfer",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/dns && dig axfr <DOMAIN> @<IP> | tee <PROJECT_DIR>/scans/dns/dig-axfr.txt"},
    {"id": "dnsrecon", "label": "dnsrecon standard enumeration",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/dns && dnsrecon -d <DOMAIN> -n <IP> | tee <PROJECT_DIR>/scans/dns/dnsrecon.txt"},
]

# Web tech fingerprinting presets — Engagement sidebar's Enumeration >
# Web Tech Fingerprint category. <SCHEME> follows the topbar's http/https
# selector; output tee'd to scans/webtech/<preset id>.txt.
WEB_TECH_FINGERPRINT_PRESETS = [
    {"id": "whatweb", "label": "whatweb fingerprint",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/webtech && whatweb -a 3 <SCHEME>://<IP> | tee <PROJECT_DIR>/scans/webtech/whatweb.txt"},
    {"id": "wafw00f", "label": "wafw00f WAF detection",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/webtech && wafw00f <SCHEME>://<IP> | tee <PROJECT_DIR>/scans/webtech/wafw00f.txt"},
    {"id": "nikto", "label": "nikto vulnerability scan",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/webtech && nikto -h <SCHEME>://<IP> | tee <PROJECT_DIR>/scans/webtech/nikto.txt"},
]

# Subdomain / vhost enumeration presets — Engagement sidebar's Enumeration >
# Subdomain / Vhost Enum category. <DOMAIN>/<SCHEME> come from the topbar;
# output tee'd to scans/vhost/<preset id>.txt.
SUBDOMAIN_VHOST_PRESETS = [
    {"id": "ffuf-vhost", "label": "ffuf vhost fuzzing (Host header)",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/vhost && ffuf -u <SCHEME>://<IP>/ -H 'Host: FUZZ.<DOMAIN>' -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -mc 200 | tee <PROJECT_DIR>/scans/vhost/ffuf-vhost.txt"},
    {"id": "gobuster-vhost", "label": "gobuster vhost enumeration",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/vhost && gobuster vhost -u <SCHEME>://<IP>/ --domain <DOMAIN> -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain | tee <PROJECT_DIR>/scans/vhost/gobuster-vhost.txt"},
    {"id": "host-header-fuzz", "label": "Host header fuzzing (curl loop)",
     "cmd": "mkdir -p <PROJECT_DIR>/scans/vhost && (for sub in $(cat /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt); do curl -s -o /dev/null -w \"%{http_code} $sub\\n\" -H \"Host: $sub.<DOMAIN>\" <SCHEME>://<IP>/; done) | tee <PROJECT_DIR>/scans/vhost/host-header-fuzz.txt"},
]

# Credential Checking — services nxc (nxc) can authenticate against.
# The frontend builds the whole nxc command client-side (service + mode +
# username/password fields -> a "mkdir -p ... && printf ... > users.txt &&
# nxc <service> <IP> -u ... -p ... | tee <output>" one-liner, same as any
# other module's command builder), so there's nothing to template here —
# just the service list plus where results land for the saved-runs viewer.
# /api/creds (app.py) + parse_nxc_output() (parsers.py) turn a saved run's
# output into the valid/failed/pwned rows the results view filters on.
CREDENTIAL_SERVICES = [
    {"id": "smb", "label": "SMB"},
    {"id": "ssh", "label": "SSH"},
    {"id": "winrm", "label": "WinRM"},
    {"id": "rdp", "label": "RDP"},
    {"id": "ldap", "label": "LDAP"},
    {"id": "mssql", "label": "MSSQL"},
    {"id": "ftp", "label": "FTP"},
    {"id": "vnc", "label": "VNC"},
    {"id": "wmi", "label": "WMI"},
    {"id": "nfs", "label": "NFS"},
]

# Looks up where a tool's (Port Scanning) or a flat category's (everything
# else) result files live, by walking PLAYBOOK itself rather than keeping a
# second list in sync — used by /api/playbook/outputs (list saved files)
# and /api/playbook/raw (read one) in app.py.
def find_output_spec(source_id):
    for group in PLAYBOOK:
        for cat in group.get("categories", []):
            if cat.get("id") == source_id and cat.get("output"):
                return cat["output"]
            for tool in (cat.get("tools") or []):
                if tool.get("id") == source_id and tool.get("output"):
                    return tool["output"]
    return None

# Engagement sidebar nav: top-level groups, each with categories that carry
# their own preset command list. Folder names under playbook/ (see repo root)
# mirror these category ids 1:1 — add a new category here + a matching
# playbook/<id>/ folder for reference notes on the technique.
PLAYBOOK = [
    {
        "id": "enumeration",
        "label": "Enumeration",
        "categories": [
            {"id": "port_scanning", "label": "Port Scanning", "tools": PORT_SCANNING_TOOLS},
            {"id": "directory_bruteforce", "label": "Directory Bruteforce", "presets": DIR_BRUTEFORCE_PRESETS,
             "output": {"dir": "scans/web", "ext": ".txt"}},
            {"id": "smb_enum", "label": "SMB Enum", "presets": SMB_ENUM_PRESETS,
             "output": {"dir": "scans/smb", "ext": ".txt"}},
            {"id": "dns_enum", "label": "DNS Enum", "presets": DNS_ENUM_PRESETS,
             "output": {"dir": "scans/dns", "ext": ".txt"}},
            {"id": "web_tech_fingerprint", "label": "Web Tech Fingerprint", "presets": WEB_TECH_FINGERPRINT_PRESETS,
             "output": {"dir": "scans/webtech", "ext": ".txt"}},
            {"id": "subdomain_vhost_enum", "label": "Subdomain / Vhost Enum", "presets": SUBDOMAIN_VHOST_PRESETS,
             "output": {"dir": "scans/vhost", "ext": ".txt"}},
        ],
    },
    {
        "id": "credential_access",
        "label": "Credential Access",
        "categories": [
            {
                "id": "credential_checking",
                "label": "Credential Checking",
                "cred_checker": {"tool": "nxc", "services": CREDENTIAL_SERVICES},
                "output": {"dir": "scans/creds", "ext": ".txt"},
                "results_endpoint": "/api/creds",
            },
        ],
    },
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

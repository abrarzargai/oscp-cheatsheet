
## Sensitive Files with Given Keywords

```bash
find / -name "*.txt" 2>/dev/null
find /opt -name "*.txt" 2>/dev/null
find / -name "passwd" 2>/dev/null
find / -name "authorized_keys" 2>/dev/null
find / -name "users" 2>/dev/null
find / -name "*user*" 2>/dev/null
find / -name "secret.key" -or -name "secret" 2>/dev/null
find / -name "credential*.txt" 2>/dev/null
find / -name "*secret*" -or -name "*credential*" 2>/dev/null
find / -name "*root*" -or -name "*password*" 2>/dev/null
find / -name "*.key" -or -name "*.db" 2>/dev/null
find / -name "*data*" 2>/dev/null
find / -name ".env" 2>/dev/null
find / -name "*flag*" 2>/dev/null

# SQL files
find / -name "*.sql" 2>/dev/null
strings example.sql

# Backup files may contain sensitive information
find / -name "*backup*" 2>/dev/null
find / -name "*.bak*" 2>/dev/null
find / -name "*.back*" 2>/dev/null
find / -name "*.old" 2>/dev/null

# Histories
find / -name "*history*" 2>/dev/null

# Backup files for /etc/shadow.
# ex. /var/shadow.bak
find / -name *shadow* 2>/dev/null

# Kerberos
find / -name "*.keytab" 2>/dev/null

# -user: Specify the file owner
find / -user www-data 2>/dev/null
# -group Specify the group
find / -group www-data 2>/dev/null

# Executable files
find / -type f -executable 2>/dev/null

# ----------------------------------------
# Find more faster than `find` command.
locate data
locate flag
locate flag*.txt
locate *flag*
locate password
locate *password*
locate *save*
locate *save.txt
locate user.txt
locate user*
locate *user*
locate root.txt
locate *root*
locate .db
locate .txt

```

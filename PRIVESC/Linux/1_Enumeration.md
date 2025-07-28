
## Sensitive Files with Given Keywords

- Check OPT folder for hints (some CTF have hints or creds there)

 ```bash
 ls -la /opt
```

# Environment Enumeration 

```bash
# finding the flag
grep -R "HTB{" / 2>/dev/null

# Operating System Version
cat /etc/os-release

# Kernel Version
uname -a

# Running Services
ps aux

#Current User & Permissions
whoami
id

# Network Info
ip a          # IP addresses
route         # Routing table
arp -a        # Devices in local network
cat /etc/resolv.conf  # DNS servers

# **Sudo Privileges**
sudo -l

# Environment Variables
env

# Drives and Mount Points
lsblk
cat /etc/fstab
df -h

# User Accounts
cat /etc/passwd

# Hidden Files and SSH Keys
find / -type f -name ".*"
find / -type d -name ".*"
ls /home

# Temporary Files
ls -l /tmp /var/tmp /dev/shm


```

## Linux Services & Internals Enumeration


```bash
# Network Info
ip a # Shows IP addresses and interfaces. 
cat /etc/hosts # Shows local hostnames.

# **Logged-in Users**
who # See who is online now.
lastlog # See past logins.
history  # Shows command history.

# Cron Jobs (Scheduled Tasks)
crontab -l
ls /etc/cron.*

# Running Processes
ps aux | grep root

# **Installed Programs**
apt list --installed
sudo -V

# Useful Files
find / -name "*.bash_history" 2>/dev/null
find / -name "*.conf" 2>/dev/null
find / -name "*.sh" 2>/dev/null

```

# Credential Hunting

```bash

# wordpress passsword
grep 'DB_USER\|DB_PASSWORD' wp-config.php
`find / -name "wp-config.php" 2>/dev/null -exec grep 'DB_USER\|DB_PASSWORD' {} \;`

# This command searches the whole system for any file with “config” in its name (except system process files):
find / ! -path "*/proc/*" -iname "*config*" -type f 2>/dev/null

# SSH Keys
ls ~/.ssh

```

# Extra

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

# Search for the keyword 'username' in all files recursively, showing line numbers
grep -nr "username" /

# Search for the keyword 'password' recursively
grep -nr "password" /
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

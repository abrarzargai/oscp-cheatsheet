
 Suppose we will use the following credentials: User=forend and password=Klmcargo2

```bash
# -------------------------------------------
# CRACKMAPEXEC (CME) - Swiss army knife for AD enumeration
# -------------------------------------------

# List all domain users
crackmapexec smb 172.16.5.5 -u forend -p Klmcargo2 --users

# List all domain groups
crackmapexec smb 172.16.5.5 -u forend -p Klmcargo2 --groups

# Find specific group (interns) - pipe to grep
crackmapexec smb 172.16.5.5 -u forend -p Klmcargo2 --groups | grep -i interns

# Show currently logged on users (great for finding targets)
crackmapexec smb 172.16.5.130 -u forend -p Klmcargo2 --loggedon-users

# Enumerate shares - what folders can forend access?
crackmapexec smb 172.16.5.5 -u forend -p Klmcargo2 --shares

# -------------------------------------------
# SMBMAP - Share enumeration with more details
# -------------------------------------------

# Quick check of access on all shares
smbmap -u forend -p Klmcargo2 -d INLANEFREIGHT.LOCAL -H 172.16.5.5

# Recursive directory listing (find sensitive files)
smbmap -u forend -p Klmcargo2 -d INLANEFREIGHT.LOCAL -H 172.16.5.5 -R 'Department Shares'

# -------------------------------------------
# RPCCLIENT - RID brute force enumeration
# -------------------------------------------

# Connect with RPC
rpcclient -U "forend%Klmcargo2" 172.16.5.5

# Inside rpcclient shell:
rpcclient $> enumdomusers        # List all users + their RIDs
rpcclient $> queryuser 1170      # Query specific user by RID (1170 is example)

# -------------------------------------------
# WINDAPSEARCH - LDAP query tool (Python)
# -------------------------------------------

# Find Domain Admins group members
python3 windapsearch.py --dc-ip 172.16.5.5 -u forend@inlanefreight.local -p Klmcargo2 --da

# Find ALL privileged users (includes nested group members)
python3 windapsearch.py --dc-ip 172.16.5.5 -u forend@inlanefreight.local -p Klmcargo2 -PU
```

Suppose we will use the following credentials: User=forend and password=Klmcargo2

```bash
# -------------------------------------------
# nxc (CME) - Swiss army knife for AD enumeration
# -------------------------------------------

# List all domain users
nxc smb $DC_IP -u $USER -p $PASS --users

# List all domain groups
nxc smb $DC_IP -u $USER -p $PASS --groups

# Find specific group (interns) - pipe to grep
nxc smb $DC_IP -u $USER -p $PASS --groups | grep -i interns

# Show currently logged on users (great for finding targets)
nxc smb $VICTIM_IP -u $USER -p $PASS --loggedon-users

# Enumerate shares - what folders can forend access?
nxc smb $DC_IP -u $USER -p $PASS --shares

# -------------------------------------------
# SMBMAP - Share enumeration with more details
# -------------------------------------------

# Quick check of access on all shares
smbmap -u $USER -p $PASS -d $DOMAIN -H $DC_IP

# Recursive directory listing (find sensitive files)
smbmap -u $USER -p $PASS -d $DOMAIN -H $DC_IP -R 'Department Shares'

# -------------------------------------------
# RPCCLIENT - RID brute force enumeration
# -------------------------------------------

# Connect with RPC
rpcclient -U "forend%Klmcargo2" $DC_IP

# Inside rpcclient shell:
rpcclient $> enumdomusers        # List all users + their RIDs
rpcclient $> queryuser 1170      # Query specific user by RID (1170 is example)

# -------------------------------------------
# WINDAPSEARCH - LDAP query tool (Python)
# -------------------------------------------

# Find Domain Admins group members
python3 windapsearch.py --dc-ip $DC_IP -u forend@$DOMAIN -p $PASS --da

# Find ALL privileged users (includes nested group members)
python3 windapsearch.py --dc-ip $DC_IP -u forend@$DOMAIN -p $PASS -PU
```

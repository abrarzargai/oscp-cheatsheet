 We will use the following credentials: User=forend and password=Klmcargo2

```bash
# Domain Users (## **CrackMapExec**)
crackmapexec smb 172.16.5.5 -u forend -p Klmcargo2 --users


# **Domain Group Enumeration**
crackmapexec smb 172.16.5.5 -u forend -p Klmcargo2 --groups
# details about interns group
crackmapexec smb 172.16.5.5 -u forend -p Klmcargo2 --groups | grep interns

# **Logged On Users:** Show what users are logged in currently
crackmapexec smb 172.16.5.130 -u forend -p Klmcargo2 --loggedon-users

# **Share Enumeration - Domain Controller:** Enumerate available shares on the remote host and the level of access our user account
crackmapexec smb 172.16.5.5 -u forend -p Klmcargo2 --shares


# **Check Access**
smbmap -u forend -p Klmcargo2 -d INLANEFREIGHT.LOCAL -H 172.16.5.5
#**Recursive List Of All Directories**
smbmap -u forend -p Klmcargo2 -d INLANEFREIGHT.LOCAL -H 172.16.5.5 -R 'Department Shares'


# find a user by rid
rpcclient -U "forend%Klmcargo2" 172.16.5.5
rpcclient $> enumdomusers # **Enumdomusers:** Print out all domain users by name and RID
rpcclient $> queryuser 1170 # **User Enumeration By RID:**



# **Domain Admins:** Enumerate users from the Domain Admins group.
python3 windapsearch.py --dc-ip 172.16.5.5 -u forend@inlanefreight.local -p Klmcargo2 --da

# **Privileged Users:** Enumerate All privileged AD Users. Performs recursive lookups for nested members
python3 windapsearch.py --dc-ip 172.16.5.5 -u forend@inlanefreight.local -p Klmcargo2 -PU

```
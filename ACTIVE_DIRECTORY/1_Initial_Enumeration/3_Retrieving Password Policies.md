#AD_retrieving_password_policies
# <span style="color:#FF5555">If we have a **valid username + password**</span>

```bash
# Checks password policy using valid credentials
nxc smb $VICTIM_IP -u $USER -p $PASS --pass-pol
```

# <span style="color:#FF5555">SMB NULL SESSION</span>

- ### <span style="color:#50FA7B">rpc Client</span>
```bash
# Connects to RPC anonymously (null session)
rpcclient -U "" -N $VICTIM_IP

# Or authenticate with the creds selected from the vault
rpcclient -U '$USER%$PASS' $VICTIM_IP

#Then Run
# Gets password policy via null session
getdompwinfo
```
- ### <span style="color:#50FA7B">enum4linux</span>
```bash
# Enumerates password policy anonymously (legacy tool)
enum4linux -P $VICTIM_IP
# with creds from the vault
enum4linux -u $USER -p '$PASS' -P $VICTIM_IP
```
- ### <span style="color:#50FA7B">enum4linux-ng</span>
```bash
# Enumerates password policy anonymously with file output
enum4linux-ng -P $VICTIM_IP -oA ilfreight
# with creds from the vault
enum4linux-ng -u $USER -p '$PASS' -P $VICTIM_IP -oA ilfreight
```
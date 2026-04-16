
# If we have a **valid username + password**

```bash
# Checks password policy using valid credentials
crackmapexec smb 172.16.5.5 -u avazquez -p Password123 --pass-pol
```

# SMB NULL SESSION

- ### rpc Client
```bash
# Connects to RPC anonymously (null session)
rpcclient -U "" -N 172.16.5.5

#Then Run
# Gets password policy via null session
getdompwinfo
```
- ### enum4linux
```bash
# Enumerates password policy anonymously (legacy tool)
enum4linux -P 172.16.5.5
```
- ### enum4linux-ng
```bash
# Enumerates password policy anonymously with file output
enum4linux-ng -P 172.16.5.5 -oA ilfreight
```
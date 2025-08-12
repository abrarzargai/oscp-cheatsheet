
### If we have a **valid username + passwo**d

```bash
crackmapexec smb 172.16.5.5 -u avazquez -p Password123 --pass-pol
```


### SMB NULL SESSION
- ### rpc Client
```bash
rpcclient -U "" -N 172.16.5.5

#Then Run
getdompwinfo
```
- ### enum4linux
```bash
enum4linux -P 172.16.5.5
```

- ### enum4linux-ng
```bash
enum4linux-ng -P 172.16.5.5 -oA ilfreight
```
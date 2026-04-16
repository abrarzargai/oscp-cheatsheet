## **User Enumeration (`crackmapexec --rid-brute`)**

It tells **CrackMapExec**:

> “Try RID numbers from 500 to 5500 and give me usernames if any match.”
> 

### Why This Works:

- In Active Directory, **each user and group has a unique ID** called a **RID** (Relative Identifier).
- These RIDs are just numbers (like 500 = Administrator, 501 = Guest, etc.)
- On many networks, **user RIDs start at 1000 and go up** — like 1001, 1002, etc.

So if you **try each RID**, you might "guess" real usernames even if enumeration is blocked.

```bash
# Tries to find usernames without any login (anonymous).
crackmapexec smb <target-ip> --rid-brute

# Tries to find usernames using the guest account (blank password).
crackmapexec smb <target-ip> -u guest -p  '' --rid-brute

# Show only actual user accounts (not computer names or groups).
crackmapexec smb <target-ip> -u guest -p  '' --rid-brute | grep SidTypeUser
```



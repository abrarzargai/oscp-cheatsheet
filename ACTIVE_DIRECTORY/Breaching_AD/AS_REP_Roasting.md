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

___

# **Post Exploitation**

## 1. AS-REP Roasting

AS-REP Roasting is a **Kerberos-based attack** in Active Directory that allows you to get **password hashes of users** **without needing any login access** — if certain conditions are met.

### 🔐 Why Does It Work?

Normally, when a user tries to log in with Kerberos, the Domain Controller (KDC) checks if they’re real **before** giving them a ticket (using a feature called **pre-authentication**).

But some user accounts might have **pre-authentication turned OFF** (a setting called `UF_DONT_REQUIRE_PREAUTH`).

That means **anyone on the network** can say:

"Hey, give me a ticket for that user!"

And the KDC replies with an **encrypted blob (AS-REP)** — which is **encrypted using the user's password hash**.

### Step:

when you uploaded the files to bloodhound GUI

Checking for AS-REP Roastable users,

<img width="1206" height="627" alt="image" src="https://github.com/user-attachments/assets/41aea20e-414a-4256-954b-9ea7d6ab7079" />

suppose in this case we have three users 

- ERNESTO_SILVA@THM.CORP
- TABATHA_BRITT@THM.CORP
- LEANN_LONG@THM.CORP

Using impacket’s `GetNPUsers.py` to request a tgt for the users.

```bash
$ GetNPUsers.py -request -format john -no-pass thm.corp/ERNESTO_SILVA
$ GetNPUsers.py -request -format john -no-pass thm.corp/TABATHA_BRITT
$ GetNPUsers.py -request -format john -no-pass thm.corp/LEANN_LONG
```

Using `john` to crack the hashes we got, we get a password for

**Example Command:** `hashcat -m 18200 hashes.txt wordlist.txt`

Here’s what this command does:

- `m 18200`: Specifies the AS-REP Kerberos hash cracking mode.
- `hashes.txt`: Contains collected hashes from vulnerable accounts.
- `wordlist.txt`: Your chosen dictionary of possible passwords

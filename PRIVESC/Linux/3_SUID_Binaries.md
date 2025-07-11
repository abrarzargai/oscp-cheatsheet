# Exploiting SUID Binaries

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

Once you find a suspicious binary with SUID, check it on https://gtfobins.github.io.

> GTFOBins provides ready-to-use commands to exploit known binaries for:
> 
> - File reads/writes
> - Spawning shells
> - Privilege escalation (SUID, sudo, etc.)

#AD_generic
# links

- [https://github.com/S1ckB0y1337/Active-Directory-Exploitation-Cheat-Sheet](https://github.com/S1ckB0y1337/Active-Directory-Exploitation-Cheat-Sheet)
- [https://github.com/MariamTariq404/OSCP-Checklist](https://github.com/MariamTariq404/OSCP-Checklist)
- [https://benheater.com/my-ctf-methodology/](https://benheater.com/my-ctf-methodology/)

____
# Adding target IP

```bash
export target="10.10.11.69"
```

___
# Verifying the DC machine
If you have the machine access and you want to check if its the Domain controller or normal machine you can check if this folder found then its DC

```bash
dir C:\\Windows\\NTDS
```

---
# Sync time with AD machine

```bash
while true; do ntpdate -s fluffy.htb; done
```

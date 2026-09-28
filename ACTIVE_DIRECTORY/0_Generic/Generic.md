#AD_generic

# <span style="color:#FF5555">Links</span>

- [https://github.com/S1ckB0y1337/Active-Directory-Exploitation-Cheat-Sheet](https://github.com/S1ckB0y1337/Active-Directory-Exploitation-Cheat-Sheet)
- [https://github.com/MariamTariq404/OSCP-Checklist](https://github.com/MariamTariq404/OSCP-Checklist)
- [https://benheater.com/my-ctf-methodology/](https://benheater.com/my-ctf-methodology/)

____
# <span style="color:#FF5555">Adding Target IP</span>

```bash
export target="$VICTIM_IP"
```

___
# <span style="color:#FF5555">Verifying the DC machine</span>
If you have the machine access and you want to check if its the Domain controller or normal machine you can check if this folder found then its DC

```bash
dir C:\\Windows\\NTDS
```

---
# <span style="color:#FF5555">Sync time with AD machine</span>

```bash
while true; do ntpdate -s $DC_IP; done
```

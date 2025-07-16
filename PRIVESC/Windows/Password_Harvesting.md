## 🔐 Password Hunting Techniques

Use the command mentioned here to find the clear text passwords and other commands mentioned for password hunting https://sushant747.gitbooks.io/total-oscp-guide/content/privilege_escalation_windows.html

### Common Locations:

- Plaintext credentials in:
    - Config files
    - Registry
    - SAM & SYSTEM files

### SAM + SYSTEM Hash Dump

If files are accessible, use tools like `pwdump`: https://github.com/CiscoCXSecurity/creddump7

```
./pwdump.py SYSTEM SAM
```

Use `john` or `hashcat` to crack hashes.

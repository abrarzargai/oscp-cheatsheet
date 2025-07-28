
## What is `$PATH`?

- `$PATH` is a special environment variable in Linux.
- It tells the system **where to look** when you type a command like `ls`, `cat`, or `python`.
- Instead of typing the full location of a program (`/bin/ls`), you can just type `ls`, and the system will **search each folder in `$PATH`** to find it.
```bash
echo $PATH
```
Example output:

```bash
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
```

This means: when you type a command, Linux looks in each of those folders (in order) to find it.

## What is **Path Abuse**?

**Path Abuse** means taking advantage of how `$PATH` works to run **malicious or unintended programs**.

### Imagine this:

If a folder (like `/usr/local/sbin`) is in the `$PATH`, and you put a script in it named `conncheck`, then anytime someone types `conncheck`, **your script** will run — even if they're in a totally different folder!

## Example 

1. A script named `conncheck` was placed in `/usr/local/sbin`
2. That folder is in the `$PATH`
3. Even from `/tmp`, the command `conncheck` works — because Linux finds it in `/usr/local/sbin`

On my Linux machine, mobile devices were not launching due to some error. This worked for me; I’ll check later what the issue was.

```bash
# tells Genymotion to use CPU/software rendering instead of your Intel GPU.
LIBGL_ALWAYS_SOFTWARE=1 ./genymotion
```
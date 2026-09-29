
### <span style="color:#50FA7B">1. Applications</span>

The apps users interact with, such as Chrome, WhatsApp, Camera, and Settings.

### <span style="color:#50FA7B">2. Android Framework</span>

Provides high-level APIs and system services that apps use, such as **Activity Manager, Package Manager, Window Manager, Power Manager, and Location Manager**.

### <span style="color:#50FA7B">3. Android Runtime + Native Libraries</span>

**ART** executes Android applications, while native libraries provide low-level functionality such as graphics, media, databases, and C/C++ functionality.

### <span style="color:#50FA7B">4. HAL — Hardware Abstraction Layer</span>

Provides a standard interface between the Android framework and hardware-specific implementations, such as the **camera, audio, sensors, and Bluetooth**.

### <span style="color:#50FA7B">5. Linux Kernel</span>

The lowest software layer. It manages **CPU, memory, processes, networking, power, security, drivers, and hardware communication**.

**In short:**

> **Apps → Framework → Runtime/Libraries → HAL → Linux Kernel → Hardware**

# <span style="color:#FF5555">Linux Kernel</span>

### <span style="color:#50FA7B">Binder</span>

### <span style="color:#50FA7B">Ashmem</span>

### <span style="color:#50FA7B">Logger (the kernel’s diary)</span>

### <span style="color:#50FA7B">Ram Console</span>

### <span style="color:#50FA7B">OOM (out of memory):</span>

When memory gets low, the OOM (Out-Of-Memory) killer decides which applications to shut down. Android made it smarter: it proactively kills background applications first, so the user interface (UI) stays smooth and responsive.

### <span style="color:#50FA7B">wakelocks</span>

When you turn the screen off, Android tries to put the device into a **low-power sleep state** to save battery. A **wakelock** allows an app or system service to tell Android, **“keep the CPU awake because I still have work to perform,”** such as downloading data, processing tasks, or handling scheduled operations.

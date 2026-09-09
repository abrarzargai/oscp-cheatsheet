
### 1. Applications

The apps users interact with, such as Chrome, WhatsApp, Camera, and Settings.

### 2. Android Framework

Provides high-level APIs and system services that apps use, such as **Activity Manager, Package Manager, Window Manager, Power Manager, and Location Manager**.

### 3. Android Runtime + Native Libraries

**ART** executes Android applications, while native libraries provide low-level functionality such as graphics, media, databases, and C/C++ functionality.

### 4. HAL — Hardware Abstraction Layer

Provides a standard interface between the Android framework and hardware-specific implementations, such as the **camera, audio, sensors, and Bluetooth**.

### 5. Linux Kernel

The lowest software layer. It manages **CPU, memory, processes, networking, power, security, drivers, and hardware communication**.

**In short:**

> **Apps → Framework → Runtime/Libraries → HAL → Linux Kernel → Hardware**

# Linux Kernal

### Binder

### Ashmem

### Logger (The kernal’s diary)

### Ram Console

### OOM (out of memory):

when memory gets low OOM the killer decides which applications to shutdown, andriod made it [smarter.now](http://smarter.now) it proactively kills backlkground applications first so the user interace UI stays smooths and responseve

### wakelocks

When you turn the screen off, Android tries to put the device into a **low-power sleep state** to save battery. A **wakelock** allows an app or system service to tell Android, **“keep the CPU awake because I still have work to perform,”** such as downloading data, processing tasks, or handling scheduled operations.

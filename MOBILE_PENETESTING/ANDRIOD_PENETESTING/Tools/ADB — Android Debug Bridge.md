
### **1. Device Basics**

**Purpose:** Verify connectivity and retrieve device information.

**Common Commands:**

bash

```bash
# List all connected devices and their status
adb devices

# Expected output:
# List of devices attached
# 1234567890ABCDEF    device

# Get detailed device information (model, build, SDK version)
adb shell getprop ro.product.model
adb shell getprop ro.build.version.sdk

# Reconnect a device that is not responding
adb reconnect

# Kill and restart the ADB server (fixes connection issues)
adb kill-server
adb start-server
```

### **2. Logcat — System Log Viewer**

**Purpose:** Capture and filter real-time system and application logs for debugging, crash analysis, and performance monitoring.

**Common Commands:**

bash

```bash
# Stream all logs in real-time
adb logcat

# Clear log buffer before capturing fresh logs
adb logcat -c

# Filter logs by priority level (V=Verbose, D=Debug, I=Info, W=Warning, E=Error, F=Fatal)
adb logcat *:E          # Show only errors
adb logcat *:W          # Show warnings and above

# Filter logs by a specific tag (e.g., app package name)
adb logcat -s TAG_NAME

# Save logs to a file for offline analysis
adb logcat > logcat_output.txt

# Save logs with a timestamp in the filename
adb logcat > "logcat_$(date +%Y%m%d_%H%M%S).txt"
```

### **3. File Management — Push & Pull**

**Purpose:** Transfer files between the workstation and the Android device.

#### **Push — Copy Files TO the Device**

bash

```bash
# Syntax: adb push <local_file> <remote_destination>
adb push ./myfile.txt /sdcard/Download/

# Push an image to the device's Pictures folder
adb push ./screenshot.png /sdcard/Pictures/

# Push an entire directory recursively
adb push ./assets_folder/ /sdcard/MyApp/assets/
```

#### **Pull — Copy Files FROM the Device**

bash

```bash
# Syntax: adb pull <remote_file> <local_destination>
adb pull /sdcard/Download/myfile.txt ./

# Pull an APK from system partition (requires appropriate permissions)
adb pull /system/app/Youtube/Youtube.apk ./youtube.apk

# Pull an APK from user-installed app (use pm path to find location)
# First: adb shell pm path com.spotify.music
# Then: adb pull /data/app/com.spotify.music-xxx==/base.apk ./spotify.apk

# Pull multiple files from a directory
adb pull /sdcard/DCIM/Camera/ ./camera_photos/
```

### **4. Remote Shell — Execute Commands on Device**

**Purpose:** Open an interactive Unix shell on the Android device or execute single commands directly from the workstation.

#### **Interactive Shell Session**

bash

```bash
# Connect to device Use the -s option followed by the device ID:
adb -s R58M123ABC shell

# Open an interactive shell on the device
adb shell

# Once inside the shell, you can run standard Linux commands:
# ls, cd, cat, echo, grep, ps, top, netstat, etc.

# Exit the shell
exit
```

#### **Execute Single Commands (Non-Interactive)**

bash

```bash
# List all installed packages
adb shell pm list packages

# List only third-party (user-installed) packages
adb shell pm list packages -3

# List all system packages
adb shell pm list packages -s

# Search for a specific package
adb shell pm list packages | grep spotify

# Get the APK path of a package
adb shell pm path com.spotify.music

# Output: package:/data/app/com.spotify.music-xyz123==/base.apk

# Get battery information
adb shell dumpsys battery

# Get device memory usage
adb shell dumpsys meminfo

# Get currently running processes
adb shell ps -A

# Take a screenshot and pull it automatically
adb shell screencap /sdcard/screen.png && adb pull /sdcard/screen.png ./
```

#### **Package Manager (`pm`) Command Reference**

bash

```bash
# List all packages
adb shell pm list packages

# List third-party only
adb shell pm list packages -3

# List system only
adb shell pm list packages -s

# List enabled packages
adb shell pm list packages -e

# List disabled packages
adb shell pm list packages -d

# Get APK path for a package
adb shell pm path <package_name>

# Clear app data (reset to factory state)
adb shell pm clear <package_name>

# Disable a package (hide from launcher)
adb shell pm disable <package_name>

# Enable a package
adb shell pm enable <package_name>

# Uninstall a package
adb shell pm uninstall <package_name>
```
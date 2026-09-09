• **Purpose:** Pull the APK file(s) of a target application from a connected Android device or emulator onto your workstation for offline analysis, reverse engineering, or archival purposes. This method works for both Play Store and third-party (sideloaded) applications.

First connect with the device

```bash
# List devices
adb devices

# Connect to device Use the -s option followed by the device ID:
adb -s R58M123ABC shell
```

### Method 1 — Pull Installed APK from Android Device

First find the package name:

```
adb shell pm list packages
```

Find the APK path:

```
adb shell pm path <package_name>
```

Example:

```
adb shell pm path com.example.app
```

Then pull the APK:

```
adb pull <apk_path> /output_path
```

Example:

```
adb pull /data/app/.../base.apk ./app.apk
```

### Method 2 — APK Already Available

If you already have the APK file:

```
cp /path/app.apk /output_path/
```

You can then analyze it directly with **Apktool** or **JADX**.

### Method 3 — Pull Installed APK from Android Device (**multiple APKs/splits**)

Apps installed from Google Play can sometimes consist of **multiple APKs/splits** rather than a single APK. If you're analyzing an app installed on your own device, the most reliable approach is to identify all installed APK paths:

```
adb shell pm path <package_name>
```

You may see:

```
package:/data/app/.../base.apk
package:/data/app/.../split_config.arm64_v8a.apk
package:/data/app/.../split_config.xxhdpi.apk
```

Pull the required APK files:

```
adb pull <apk_path> ./apk/
```

> **Note:** For complete analysis of a split-installed app, you may need the **base APK plus relevant split APKs**, not just `base.apk`.
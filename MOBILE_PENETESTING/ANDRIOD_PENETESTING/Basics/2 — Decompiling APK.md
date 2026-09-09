
**Apktool** decodes an APK into **Smali code, resources, and the Android Manifest** for reverse engineering and analysis.

### Step 1 — Decode the APK

```bash
# Decompile the apk
apktool d /path/uber.apk -o /ouput_path

# -r : not to include resources
```

### Step 2 — Open with JADX GUI

```bash
jadx-gui
```

Then open the **original APK file**:
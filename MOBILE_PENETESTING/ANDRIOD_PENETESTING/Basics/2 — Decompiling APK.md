
**Apktool** decodes an APK into **Smali code, resources, and the Android Manifest** for reverse engineering and analysis.

### <span style="color:#50FA7B">Step 1 — Decode the APK</span>

```bash
# Decompile the apk
apktool d /path/uber.apk -o /output_path

# -r : not to include resources
```

### <span style="color:#50FA7B">Step 2 — Open with JADX GUI</span>

```bash
jadx-gui
```

Then open the **original APK file**:

# **Method 1: The Native Zip/XAPK Approach (Recommended)**

```bash

zip app_bundle.zip base.apk split_config.*.apk

apk-mitm app_bundle.zip

mkdir patched_splits

unzip app_bundle-patched.zip -d patched_splits/

adb install-multiple patched_splits/*.apk

# ############################# 
# check the application name from the output
frida-ps -Uai

# Starts an Objection exploration session
# -n : tells Objection which running Frida target/process to attach to
objection -n com.myreport.ai start
# OR use command "objection explore"
# OR use command "objection --gadget gadget explore"
# 

# Disable pinning
android sslpinning disable
```

> _"SSL Pinning means the app only trusts one specific certificate that is hardcoded into your app, and it will close the connection if the server shows any other certificate—even if your phone has the genuine certificate, but that certificate doesn't match the hardcoded fingerprint inside the app. The phone's opinion doesn't matter at all; the app's hardcoded rule is the only thing that counts."_

**Difference between Normal and Pinned:**

- **Normally (without pinning):** When an app tries to connect to a server, it grabs the server's certificate and checks it against the **big list of trusted certificates stored in your phone's operating system**. If your phone says "yes, this is a genuine certificate," the app trusts it.
- **With SSL Pinning:** The app completely **ignores** the big list stored in your phone. Even if your phone has a perfectly valid, 100% genuine certificate for `api.web.com`, the app doesn't care. It will **only** trust the one specific fingerprint that is hardcoded inside itself.

### <span style="color:#50FA7B">Simple Example</span>

Assume we have an app called **App1** that communicates with `api.web.com`.

**Without SSL Pinning:**

1. App1 connects to `api.web.com`.
2. The server sends its TLS certificate.
3. The phone verifies that certificate using its **trusted CA certificate store**.
4. If the certificate is valid and trusted → ✅ connection is allowed.

**With SSL Pinning:**

1. App1 connects to `api.web.com`.
2. The server sends its TLS certificate.
3. App1 checks the server's certificate or public key.
4. App1 compares it with a **pinned certificate/public-key fingerprint stored inside the app**.
5. If they match → ✅ connection is allowed.
6. If they don't match → ❌ connection is rejected.

---

We can bypass SSL pinning.

# <span style="color:#FF5555">1 — Bypassing Automatically using Objection :</span>

[https://github.com/sensepost/objection](https://github.com/sensepost/objection)

`objection` is a runtime mobile exploration toolkit, powered by [Frida](https://www.frida.re/), built to help you to bypass the ssl pinning and do other things for your mobile applications, without needing a jailbreak.

```bash
# make sure your phone (virtual or real) is connected to your system and the app is open
objection patchapk --source injured-android-patched.apk

# patchapk : for Android APKs
# patchios : for iOS apps

___

# 
objection patchapk --source etea.apk  --architecture arm64

```

Installing the app into phone using adb

```bash
adb -s 11318153CM001155 install islam360.objection.apk
```

### <span style="color:#50FA7B">Multiple split apks</span>

Sometimes when we check, there are multiple APKs. In that case we fetch all of them from the phone, bypass SSL pinning, and install all of them.

```bash
# multiple ssl pinning bypassing
objection patchapk --source apk1.apk
objection patchapk --source apk2.apk
objection patchapk --source apk3.apk

# multiple installing
adb install-multiple apk1.apk apk2.apk apk3.apk
```

---

# <span style="color:#FF5555">2 — Bypassing Manually :</span>

This method provides a deeper understanding by manually injecting the Frida gadget into the APK's native libraries.

**Reference:** [Using Frida on Android without root](https://koz.io/using-frida-on-android-without-root/)

## <span style="color:#8BE9FD">**Step — Decode the APK**</span>

Use `apktool` to decode the APK file into a directory structure.

```bash
# Decode the APK without decoding its resources
apktool d -r <your-app.apk>
```

> **💬 Explanation:** The `d` flag stands for "decode". The `-r` flag prevents the decoding of resources (like images and XML layouts), which speeds up the process and avoids certain errors.

## <span style="color:#8BE9FD">Step — Check the Native Libraries</span>

Navigate to the decompiled directory and check the `lib/` folder. Identify the architecture(s) supported by the application (e.g., `x86`, `arm64-v8a`, `armeabi-v7a`). Choose the one that matches your testing device/emulator.

## <span style="color:#8BE9FD">Step — Download the Matching Frida Gadget</span>

Download the correct Frida Gadget shared library for the identified architecture from the [Frida Releases](https://github.com/frida/frida/releases) page.

```bash
# Example: Downloading for x86_64 architecture
wget <https://github.com/frida/frida/releases/download/><version>/frida-gadget-<version>-android-x86_64.so.xz

# Extract the downloaded .xz file
unxz frida-gadget-<version>-android-x86_64.so.xz
```

## <span style="color:#8BE9FD">Step — Copy the Gadget into the APK</span>

Copy the extracted Frida Gadget library into the appropriate `lib/<architecture>/` folder inside the decompiled application directory. Rename it to follow the naming convention (usually prefixed with `lib`).

If other `.so` files are using the `lib` prefix in their names, such as `libapp.so` or `libencrypt.so`, follow the same naming convention. Since Android uses `lib` as the standard prefix for native libraries, name the Frida Gadget `libfrida-gadget.so`.

```bash
# Copy the Frida gadget to the decompiled app's lib folder
# The new name follows Android's native-library naming convention
cp frida-gadget-<version>-android-x86_64.so /path/to/decompiled-app/lib/x86_64/libfrida-gadget.so
```

> **💬 Explanation:** The `cp` command copies the file. The destination filename should be `libfrida-gadget.so` to be loaded correctly as a standard native library. This name is crucial for the next step.

## <span style="color:#8BE9FD">Step — Load Frida Gadget</span>

Modify the application's main Activity to load the Frida gadget library on startup. Navigate to the `smali/` directory and find the main Activity file (e.g., `MainActivity.smali`).

> **🔍 How to find the main Activity?** Check the `AndroidManifest.xml` file for the activity with the `android.intent.action.MAIN` and `android.intent.category.LAUNCHER` intent filters.

Open the `MainActivity.smali` file and insert the following code inside the `public constructor` method, **before** the `return` statement.

> smali > b3nac > injuredandriod > MainActivity.smali # example

```bash
const-string v0, "frida-gadget"
invoke-static {v0}, Ljava/lang/System;->loadLibrary(Ljava/lang/String;)V
```

This smali code calls `System.loadLibrary("frida-gadget")`, which loads the `libfrida-gadget.so` file we injected. This ensures the Frida gadget is active as soon as the app starts.

![[Pasted image 20260909055353.png]]

## <span style="color:#8BE9FD">Step — Internet Permission</span>

Ensure the application has the `INTERNET` permission in its `AndroidManifest.xml`. This allows the Frida gadget to open a socket for communication.

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

This line grants the app permission to access the internet. This is required for the Frida gadget to communicate with the `objection` or `frida` command-line tools.

## <span style="color:#8BE9FD">Step — Rebuild the APK</span>

After modifying the decoded application:

```bash
# Recompile the decoded app folder into a new APK
apktool b <decompiled-app-folder> -o <repackaged-app.apk>
```

## <span style="color:#8BE9FD">Step — Sign the APK</span>

The newly created APK is unsigned. You must sign it with your own developer key and zipalign it for optimal performance.

```bash
# if you dont have a keystore already, here's how to create one
$ keytool -genkey -v -keystore custom.keystore -alias mykeyaliasname -keyalg RSA -keysize 2048 -validity 10000

# sign the APK
$ jarsigner -sigalg SHA1withRSA -digestalg SHA1 -keystore mycustom.keystore -storepass mystorepass repackaged.apk mykeyaliasname

# verify the signature you just created
$ jarsigner -verify repackaged.apk

# zipalign the APK
$ zipalign 4 repackaged.apk repackaged-final.apk
```

## <span style="color:#8BE9FD">Step — Install the Instrumented APK</span>

Now install it on the phone using drag-and-drop or ADB:

```bash
# Install the final APK
adb -s <device-serial-number> install <repackaged-app-final.apk>
```

## <span style="color:#8BE9FD">Step — Connect with Frida/Objection</span>

When you next start the application you are going to see an empty screen: The injected `libfrida-gadget.so` library has opened a TCP socket and waits for a connection from Frida.

```bash
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

![[Pasted image 20260909055405.png]]

Now that SSL pinning has been bypassed, you can use **Burp Suite** to intercept and inspect the application's HTTP/HTTPS traffic. if you have already set up the proxy.

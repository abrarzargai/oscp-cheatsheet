
Use Android's manual proxy

**Option 2 — If Android completely hides the proxy setting**

In scenario IDK where to find the proxy setting in my phone so i use adb to do that

```bash
# add proxy
adb -s 11318153CM001155 shell settings put global http_proxy 192.168.100.10:8080

# verify proxy
adb -s 11318153CM001155 shell settings get global http_proxy

# remove the proxy 
adb -s 11318153CM001155 shell settings put global http_proxy :0
```

### Export Burp's CA certificate

In Burp Suite:

**Proxy → Proxy settings → Import / export CA certificate**

Choose:

**Certificate in DER format**

Save it as:

```
burp.der
```

### 2. Transfer it to your phone

For example:

```
adb-s 11318153CM001155 push burp.der /sdcard/Download/
```

### 3. Install it on Android

On the phone, open:

**Settings → Security / Security & privacy → More security settings → Encryption & credentials → Install a certificate → CA certificate**

Then select:

```
Download/burp.der
```

The exact menu names vary by Android version.

You may need to enter your phone's PIN/password to confirm.
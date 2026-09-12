
Use Android's manual proxy

**Option 2 — If Android completely hides the proxy setting**

In some cases you may not know where to find the proxy setting on the phone, so you can use ADB to do it:

```bash
# add proxy
adb -s 11318153CM001155 shell settings put global http_proxy $ATTACKER_IP:8080

# verify proxy
adb -s 11318153CM001155 shell settings get global http_proxy

# remove the proxy 
adb -s 11318153CM001155 shell settings put global http_proxy :0
```

### <span style="color:#50FA7B">Export Burp's CA certificate</span>

In Burp Suite:

**Proxy → Proxy settings → Import / export CA certificate**

Choose:

**Certificate in DER format**

Save it as:

```
burp.der
```

### <span style="color:#50FA7B">2. Transfer it to your phone</span>

For example:

```
adb -s 11318153CM001155 push burp.der /sdcard/Download/
```

### <span style="color:#50FA7B">3. Install it on Android</span>

On the phone, open:

**Settings → Security / Security & privacy → More security settings → Encryption & credentials → Install a certificate → CA certificate**

Then select:

```
Download/burp.der
```

The exact menu names vary by Android version.

You may need to enter your phone's PIN/password to confirm.
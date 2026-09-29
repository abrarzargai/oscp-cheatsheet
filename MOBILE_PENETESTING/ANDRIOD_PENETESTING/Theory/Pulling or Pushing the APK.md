## <span style="color:#8BE9FD">Getting the APK of the application from the app store</span>

Download the application from the Play Store to your Android device.

Connect ADB to your Android device.

> pm lists packages  
> pm lists packages | grep -i "uber"  
> pm path package  
> pm path com.ubercab  
> adb pull <remote_file> <localfile>  
> adb -s <device_name> pull <remote_file> <localfile> (if we have multiple emulator connected)

### <span style="color:#50FA7B">Pushing the .apk to your Android device (for testing, in case it is not available on the Play Store)</span>

We have injured.apk, which we downloaded from the internet.

> adb push <localfile> <remote_file>

# <span style="color:#FF5555">Unzipping the APK</span>

> unzip injured.apk
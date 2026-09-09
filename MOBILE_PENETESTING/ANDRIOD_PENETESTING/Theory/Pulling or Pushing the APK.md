## Geting the apk of the aplication from appstore

download the application from play store to your andriod device

connect your adb to andriod device

> pm lists packages  
> pm lists packages | grep -i "uber"  
> pm path package  
> pm path com.ubercab  
> adb pull <remote_file> <localfile>  
> adb -s <device_name> pull <remote_file> <localfile> (if we have multiple emulator connected)

### Pushing the .apk to your andriod devices (for testing in case if its not avilable on playstore)

we have injured.apk we donwloaded from internet

> adb push <localfile> <remote_file>

# unziping the apk

> unzip injured.apk
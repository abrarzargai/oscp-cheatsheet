
# <span style="color:#FF5555">Activity Component Exploiting</span>

An **Activity** is an Android application component that provides a user interface or screen. (Think of it like different web views/pages.)

An exported=True activity can be accessed from outside the application

![[Pasted image 20260909054224.png]]

First identify exported Activities from the application's `AndroidManifest.xml`.

```xml
android:exported="true"
```

## <span style="color:#8BE9FD">Security Testing</span>

```bash
# Open a shell on the Android device
adb shell                           

# Start the specified Activity           
am start -n <package_name>/<activity_name>    
```


# <span style="color:#FF5555">Intent Exploitation</span>

`more work need on this`

**Content Provider:** used to serve data from your application to other applications. It is sometimes used for sharing data between a group of related apps — think of it as a share button that offers options like WhatsApp, Messenger, email, etc.

If a Content Provider is exported, this can be very dangerous and can expose data to any user or app on the device.

**What is an Intent?**

It is simply a messaging object — think of it as a message that one component of an Android application sends to another component, either within the same application or even across different applications.

This means we can interact with other components of an application based on Intents.

When we say "messaging", we mean that this object carries some information, such as an action to be performed and data to be acted upon.

**Types of Intents:**

- Implicit Intents
- Explicit Intents

![[Pasted image 20260909054155.png]]

intent-filters in manifest.xml

```bash
# Open a shell on the Android device
adb shell                           

# Start the specified Activity           
am start -a <action_name> -c <category_name>    

# Start the specified Activity           
am start -a <action_name> -c <category_name> --es <key> value
```
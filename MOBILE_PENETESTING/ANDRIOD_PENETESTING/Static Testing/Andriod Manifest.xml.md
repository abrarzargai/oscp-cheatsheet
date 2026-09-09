
# Activity Component Exploiting

An **Activity** is an Android application component that provides a user interface or screen. (Think of like a different web views/pages)

An exported=True activity can be accessed from outside the application

![[Pasted image 20260909054224.png]]

First identify exported Activities from the application's `AndroidManifest.xml`.

```xml
android:exported="true"
```

## Security Testing

```bash
# Open a shell on the Android device
adb shell                           

# Start the specified Activity           
am start -n <package_name>/<activity_name>    
```


# Intent Exploitation

`more work need on this`

Content Provider: it is used to serve data from your application to other applications sometimes used for sharing data between a bunch of realted apps think of it as share button that have opton of whatsapp messager ,email etc

if content provder is exported this can be very dangours and exposes data to anyt user or app on the devices

what is intent

its simply the message object, think of it as a messsage that one comopnent of an andriod application sends to another component - either within the same application or even accross dufferent applicatinos

means we cabnb interect wih other componnets of an applications based on intents

when we say messageing we mean that this object carries some information such as an action to be perfromed data to be acted upaon

types of inten

implicit intents

explicit intents

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
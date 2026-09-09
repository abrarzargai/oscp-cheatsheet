
# **The Hardware Foundation (ARM vs. x86)**

_PCs use a powerful, thirsty engine (x86) designed for raw speed; smartphones use an efficient, fuel-sipping engine (ARM) designed to run all day on a single charge._

PCs and smartphones use different hardware and operating environments. Smartphones commonly use **ARM-based CPUs**, which are designed to provide good performance while using less power and battery. Because Android is designed for mobile devices, it uses **DEX (Dalvik Executable)** as its application bytecode format. Java/Kotlin code is converted into DEX bytecode, which is then executed or compiled by Android's runtime, **ART**.

> **In simple words: DEX is Android's way of packaging application code so it can be efficiently executed on mobile devices**

# **The Virtual Machine Evolution (JVM → DVM → ART)**

Android applications do not run directly on the hardware—they run inside a virtual machine. This provides **isolation** (each app runs in its own sandboxed environment) and **portability.**This process isolation helps prevent one application from directly accessing another application's private  
memory.

## JVM vs DVM vs ART

- **JVM** = **Java Virtual Machine**
- **DVM** = **Dalvik Virtual Machine (Android's old virtual machine)**
- **ART** = **Android Runtime (Android's modern runtime)**

JVM runs Java bytecode (`.class`), while DVM was Android's runtime that ran Android's DEX bytecode (`.dex`).

#### Why did Android use DVM?

Android needed a runtime suitable for **mobile devices with limited CPU, RAM, storage, and battery**.

So instead of using the standard JVM directly, Android created **Dalvik** and the **DEX** format.

#### What happened later?

Android replaced DVM with **ART (Android Runtime)**:
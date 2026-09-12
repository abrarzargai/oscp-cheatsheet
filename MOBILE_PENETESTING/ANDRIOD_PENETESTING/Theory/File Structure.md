## <span style="color:#8BE9FD">1. `AndroidManifest.xml`</span>

**Definition:**

A configuration file that tells Android **about the application and its components**.

**Purpose:**

It tells Android things like:

- What is the app's package name?
- What permissions does it need?
- What activities/screens does it have?
- Does it have services or receivers?
- Which activity should start first?

**Simple idea:**

> **"This file introduces the app to Android."**

**React comparison:** `package.json` + application configuration.

---

## <span style="color:#8BE9FD">2. `classes.dex`</span>

**Definition:**

A file containing the application's **compiled Java/Kotlin code** in Android's DEX format.

`This file contains the Java source code of this application, compiled into the Dalvik Executable (DEX) format`

**Purpose:**

Android loads and executes this code when the application runs.

**Simple idea:**

> **"This is the main brain/code of the Android app."**

**React comparison:** Production JavaScript bundle.

This is the _logic_ of the app. Without it, the app is just an empty shell. (Note: Big apps may have multiple `classes2.dex`, `classes3.dex` files).

---

## <span style="color:#8BE9FD">3. `res/`</span>

**Definition:**

A directory containing the application's **resources**.

**Purpose:**

Stores things the application uses but that aren't its main program code.

This is the structured, organized folder for your UI. It holds layouts (XML files that define screens), images (`drawable`), app icons (`mipmap`), and text/colors (`values`). Android gives every file in here a unique numeric ID (e.g., `R.id.button`).

Examples:

```
res/
├── drawable/    → Images
├── layout/      → Screen/UI layouts
├── mipmap/      → App icons
├── values/      → Strings, colors, themes
└── xml/         → XML configuration
```

**Simple idea:**

> **"This contains the app's UI and visual resources."**

**React comparison:** `src/assets/` + UI-related files.

This is what you _see_ and _touch_. If you want to change a button's color or a screen's layout, you change it here.

---

## <span style="color:#8BE9FD">4. `assets/`</span>

**Definition:**

A directory containing **raw files packaged with the application**.

**Purpose:**

Allows developers to bundle files that the app needs and read them at runtime.

This holds raw, unstructured files (like custom fonts, offline webpages, or large JSON data files). Unlike `res/`, these files **do not** get assigned numeric IDs. You have to read them by their exact filename.

Examples:

```
assets/
├── config.json
├── data.json
├── fonts/
└── website/
```

**React comparison:** `public/`

---

## <span style="color:#8BE9FD">5. `lib/`</span>

**Definition:**

A directory containing **native compiled libraries**, usually `.so` files.

**Purpose:**

Sometimes, developers write code in C or C++ for heavy tasks (like video processing or gaming physics). This folder holds those pre-compiled machine-code libraries (`.so` files), split by your phone's processor type (e.g., ARM, Intel).

Example:

```
lib/
└── arm64-v8a/
    └── libexample.so
```

Different folders can contain libraries for different CPU architectures.

**Simple idea:**

> **"Low-level/native code used by the app."**

**React comparison:** Native modules.

This makes the app _fast_ for specific heavy jobs. If your phone's processor doesn't match the `lib` folder, the app might crash or run poorly.

---

## <span style="color:#8BE9FD">6. `resources.arsc`</span>

**Definition:**

A **compiled resource table** used by Android.

**Purpose:**

It helps Android map resource IDs to the actual resources used by the application.

This is a compiled lookup table. It maps the numeric IDs from `res/` to the actual files on disk. When your code says `R.string.app_name`, it runs through this table to find the actual string "My App."

For example:

```
R.string.app_name
        ↓
resources.arsc
        ↓
"My Application"
```

**Simple idea:**

> **"A map that helps Android find the app's resources."**

---

## <span style="color:#8BE9FD">7. `META-INF/`</span>

**Definition:**

**The "Authenticity Seal" and "Shipper's Signature."**

**Purpose:**

This folder holds the digital signature and cryptographic checksums of all the other files.This ensures the app hasn't been tampered with or infected by malware since the developer built it. If this is broken, Android won't install it.

You may see files such as:

```
META-INF/
├── MANIFEST.MF
├── CERT.SF
└── CERT.RSA
```

**Simple idea:**

> **"Information used to verify the APK's signature/integrity."**

### <span style="color:#50FA7B">8. `com/`</span>

**Definition:**

A directory that represents the **Java/Kotlin package structure** of the Android application or its libraries.

**Purpose:**

This has zero effect on how the app runs. it is used by developers to **organize application code into packages** and prevent naming conflicts between different applications and libraries.
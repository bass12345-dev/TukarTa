# Local Development & Android Studio Setup

This guide covers how to set up your local environment for native Android development and how to build APKs locally for the TukarTa application.

## 1. Native Setup & Android Studio

To open the project in Android Studio, you first need to generate the native Android project files (the `android` folder).

### Step A: Generate the Android Folder
Run the following command in your terminal:

```powershell
npx expo prebuild
```
This will create a `android/` directory in your project containing the Gradle files and native code.

### Step B: Open in Android Studio
1. Launch **Android Studio**.
2. Select **Open** (or **File > Open**).
3. Navigate to your project directory and select the **`android`** folder (not the root project folder).
4. Wait for Gradle to sync and download dependencies.

### Step C: Build Local APK
If you want to build the APK locally without using EAS:
1. In Android Studio: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. The APK will be located in:
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 2. Running on Emulator or Physical Device

### Fast Method (Expo Go)
Useful for rapid UI/UX changes and logic testing without native changes.
```powershell
npx expo start --android
```

### Native Method (Development Build)
Necessary if you've added new native modules or want to test the app in its full native context.
```powershell
npx expo run:android
```
> [!NOTE]
> The first time you run this, it will take several minutes to compile the native code projects and Gradle dependencies.

---

## 3. Summary of Build Commands

| Goal | Command / Action |
| :--- | :--- |
| **Get APK from Cloud** | `eas build --profile preview --platform android` |
| **Open in Android Studio** | Run `npx expo prebuild`, then open `android/` folder in Studio |
| **Local Debug APK** | Run `npx expo run:android` |
| **Production Bundle** | `eas build --profile production --platform android` |

---

## Troubleshooting: "No Android connected device found"

If you see this error when running `npx expo start --android`, it means Expo cannot find a destination to launch the app.

### A. Set up an Emulator (AVD)
1. Open **Android Studio**.
2. Navigate to **Device Manager** (Toolbar icon or `View > Tool Windows > Device Manager`).
3. Click **Create Device** and follow the wizard (select a device like Pixel 8 and a system image like API 34).
4. **Launch the emulator** by clicking the "Play" icon in the Device Manager.
5. Once the emulator is fully booted, run the command again.

### B. Use a Physical Device (USB)
1. Connect your device via USB.
2. Enable **Developer Options** (Tap 'Build Number' 7 times in About Phone).
3. Enable **USB Debugging** in Developer Options.
4. Run `adb devices` in your terminal to ensure your device is listed.

### C. Use Expo Go (QR Code)
If you don't want to use an emulator or USB:
1. Run `npx expo start` (omit `--android`).
2. Scan the QR code using the **Expo Go** app on your phone.

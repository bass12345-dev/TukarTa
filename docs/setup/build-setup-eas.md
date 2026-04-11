# 🚀 EAS Build Setup Guide (Android APK)

This guide provides a step-by-step walkthrough for setting up **Expo Application Services (EAS)** to build and generate an Android APK for **TukarTa**.

---

## 📋 Prerequisites

Before starting, ensure you have the following:

1.  **Expo Account**: Create one at [expo.dev](https://expo.dev/) if you haven't already.
2.  **EAS CLI Installed**:
    ```bash
    npm install -g eas-cli
    ```
3.  **Logged In**:
    ```bash
    eas login
    ```

---

## ⚙️ 1. Project Configuration

Your project is already configured with a `projectId` in `app.json` and build profiles in `eas.json`.

### Build Profiles (`eas.json`)
The following relevant profile is configured:
- **`preview`**: Optimized for generating a shareable **APK** for testing.

```json
"preview": {
  "android": {
    "buildType": "apk"
  }
}
```

---

## 🔐 2. Setting Up Environment Secrets (Terminal Only)

Since we use Supabase, the build needs access to your API keys. EAS does **not** read your local `.env` file during cloud builds. You must push these to EAS.

### Option A: Bulk Push from `.env` (Fastest)
If you already have a `.env` file with the required variables, you can push them all at once:

```bash
eas secret:push --scope project --env-file .env
```
*This command parses your local `.env` and creates secrets for everything inside it.*

### Option B: Individual Secrets
To create or update secrets one by one:

```bash
# Add Supabase URL
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://atowgxluqogdsxxeavna.supabase.co" --scope project

# Add Supabase Key
eas secret:create --name EXPO_PUBLIC_SUPABASE_KEY --value "your_supabase_key_here" --scope project
```

### Option C: Modern Environment Variables (New)
Expo recently introduced **Environment Variables** (as an alternative to Secrets) which offers better visibility management:

```bash
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://atowgxluqogdsxxeavna.supabase.co" --environment preview --visibility plaintext
```

---

> [!IMPORTANT]
> **Why `EXPO_PUBLIC_`?**
> In Expo, only variables prefixed with `EXPO_PUBLIC_` are bundled into the client-side code. If you name a secret `SUPABASE_KEY` without the prefix, it will be available during the build process but `process.env.SUPABASE_KEY` will be `undefined` inside your app.

---

## 🛠️ 3. Building the APK

To start the build process for Android, run:

```bash
eas build -p android --profile preview
```

### What happens next?
1. **Credentials**: EAS will ask to manage your Android credentials. If you don't have a keystore, let EAS generate one for you (select `Yes`).
2. **Upload**: Your project code is bundled and uploaded to Expo's build servers.
3. **Build**: The cloud server installs dependencies and compiles the APK.
4. **Log**: You can follow the progress via the URL provided in the terminal.

---

## 📥 4. Downloading and Installing

Once the build is complete:

1.  **Terminal Link**: EAS will provide a direct download link.
2.  **QR Code**: In the Expo Dashboard, a QR code will be generated. Scan this with your Android phone to download the APK directly.
3.  **Installation**: Open the `.apk` file on your device. You may need to "Allow installation from unknown sources" in your Android settings.

---

## 🔄 Updating the Build

Whenever you make changes to the code and want a new APK:
1. Commit your changes.
2. Run the build command again:
   ```bash
   eas build -p android --profile preview
   ```

---

> [!TIP]
> To build for the Google Play Store (App Bundle), use the `production` profile:
> `eas build -p android --profile production`

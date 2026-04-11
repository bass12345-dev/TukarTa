# Supabase Authentication Setup (Google OAuth)

This guide explains how to set up Google Authentication using Supabase for the TukarTa application.

## 1. Google Cloud Console Setup
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a **New Project** (e.g., `TukarTa-Auth`).
3.  **Configure OAuth Consent Screen**:
    - Select **External**.
    - Provide App Name (`TukarTa`), User Support Email, and Developer Contact Info.
4.  **Create OAuth Client (IMPORTANT)**:
    - Go to **APIs & Services > Credentials**.
    - Click **+ Create Credentials > OAuth client ID**.
    - **Application Type**: Select `Web application`. (Even for Android/iOS, Supabase needs this for the server-side handshake).
    - **Name**: `TukarTa Supabase Backend`.
    - **Authorized redirect URIs**: Add your Supabase Callback URI from **Authentication > Providers > Google** (e.g., `https://atowgxluqogdsxxeavna.supabase.co/auth/v1/callback`).
5.  **Copy your Client ID and Client Secret**. (Android-type credentials do not provide a secret, which is why Web-type is required here).

## 2. Supabase Dashboard Setup
1.  Go to your project's **Authentication > Providers**.
2.  Enable **Google**.
3.  Paste the **Client ID** and **Client Secret** from Google.
4.  **Important**: Go to **Authentication > URL Configuration**.
    - **Site URL**: `https://atowgxluqogdsxxeavna.supabase.co` (or your web URL).
    - **Redirect URLs**: Add `tukarta://` to allow the mobile app to handle the redirect.

## 3. App Implementation
The app uses `expo-auth-session` to handle the OAuth flow securely.
- **Provider**: Wrapped in `app/_layout.tsx` using the `AuthProvider` component.
- **Logic**: Handled in `app/login.tsx` using `supabase.auth.signInWithOAuth`.
- **Session Persistence**: Managed by `expo-secure-store` (see `utils/supabase.ts`).

## 4. Verification
1.  Run the app: `npm start`.
2.  Click **Continue with Google** on the Login screen.
3.  Complete the sign-in in the browser.
4.  The app should automatically redirect back and land on the Home tab.

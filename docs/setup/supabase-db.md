# Supabase Database & Migration Guide

This guide covers the end-to-end process of setting up your Supabase project, connecting your local development environment, and pushing your database schema.

## 1. Supabase Project Initialization
1.  Go to [supabase.com](https://supabase.com) and create a new project.
2.  **Project Name**: `TukarTa`
3.  **Database Password**: Create an alphanumeric password and **save it in a secure place**. (You will need this for the CLI link step).
4.  Wait for the project to finish provisioning.

## 2. Authentication Configuration (Google)
1.  In your Google Cloud Console, create an **OAuth Web Client ID**.
2.  Copy the **Client ID** and **Client Secret**.
3.  In the Supabase Dashboard, go to **Authentication > Providers > Google**.
4.  Enable the provider and paste the ID and Secret.
5.  **Copy the Redirect URI** provided by Supabase and add it to your Google Cloud Console's "Authorized redirect URIs".
6.  Go to **URL Configuration** in Supabase and add `tukarta://` to the **Redirect URLs**.

## 3. Local Environment Setup
Update your `.env` file in the root directory:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://atowgxluqogdsxxeavna.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your_anon_key_here
```

## 4. Supabase CLI Migrations
Follow these commands to push the schema from `./supabase/migrations/0000_initial_schema.sql` to your live database.

### Step A: Login to CLI
```bash
npx supabase login
```
*Follow the browser prompts to authenticate.*

### Step B: Link to Project
```bash
npx supabase link --project-ref atowgxluqogdsxxeavna
```
*Enter your **Database Password** when prompted.*

### Step C: Push Migrations
```bash
npx supabase db push
```
*Confirm with `y` when asked to apply the migration.*

## 5. Verification
- Open the [Supabase Table Editor](https://supabase.com/dashboard/project/atowgxluqogdsxxeavna/editor).
- You should see the following tables: `users`, `songs`, `bands`, `gigs`, `setlists`, etc.
- If you see any tables with a "locked" icon, ensure your RLS policies are correctly applied.

---
*Note: This documentation was generated automatically during the initial project setup.*
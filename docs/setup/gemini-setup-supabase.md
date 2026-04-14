# Gemini AI + Supabase Edge Functions Setup Guide

This guide outlines how to set up the AI-powered song extraction feature using Google Gemini and Supabase Edge Functions.

## 1. Get a Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key**.
3. Create a new API key in a new project.
4. Copy the key (it starts with `AIzaSy...`).

## 2. Configure Supabase Secrets
You need to make the API key available to your Edge Functions. 

Run the following command in your project root:
```powershell
npx supabase secrets set GEMINI_API_KEY=your_actual_key_here
```

## 3. Storage Bucket Setup
The Edge Function needs to read images from Supabase Storage.
1. Ensure the `song-screenshots` bucket exists.
2. Run the migration to add correct RLS policies for user-scoped access.

## 4. Deploying the Edge Function
The function is located at `supabase/functions/extract-songs/index.ts`.

### Deployment Command
Run this command to deploy the function to the cloud:
```powershell
npx supabase functions deploy extract-songs --no-verify-jwt
```

> [!IMPORTANT]
> **Why `--no-verify-jwt`?**
> We use this flag during development because Expo/React Native clients sometimes have issues with valid JWT transmission to the Supabase gateway. This allows the request to reach the function, where we then handle security via internal RLS and Service Role keys.

## 5. Frontend Integration
The frontend calls the function using the Supabase client:

```typescript
const { data, error } = await supabase.functions.invoke('extract-songs', {
  body: { filePath: 'path/to/image.jpg' },
});
```

## 6. Troubleshooting
- **401 Invalid JWT**: Ensure you deployed with `--no-verify-jwt` or that the user is properly logged in.
- **404 Model Not Found**: Ensure you are using a supported model (e.g., `gemini-2.5-flash`) and the correct API version (`v1` or `v1beta`).
- **403 Forbidden**: Ensure your `GEMINI_API_KEY` is set correctly in Supabase Secrets, not just in your local `.env`.

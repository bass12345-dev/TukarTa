# TukarTa (Setlist AI)

**TukarTa** is a premium mobile application designed for Filipino musicians and bands. It leverages AI to transform how musicians manage their song libraries, generate setlists, and connect with other players.

---

## 🚀 Key Features

### ✦ AI Song Extraction
Upload screenshots from your Notes app, photos of handwritten lists, or old setlists. Our AI extracts song titles and artists instantly, building your searchable musician profile in seconds.

### ✦ Smart Setlist Generation
Generate high-energy setlists tailored to your gig's duration and mood. The AI ensures every song on the list is one that **all band members know**.

### ✦ Musician Marketplace
Find the perfect session musician or replacement player. Filter by instrument, city, and genre—and see exactly which songs they already know from your setlist.

### 🌗 Premium Design System
- **Glassmorphic UI**: A high-fidelity "glass" aesthetic with real-time blur and glowing orbs.
- **Multi-Theme Support**: Seamlessly switch between Light and Dark modes.
- **Stage Mode**: Optimized live view for lyrics and chords, built for performance.

---

## 🛠️ Tech Stack

- **Frontend**: React Native + Expo (SDK 54)
- **Styling**: NativeWind (Tailwind CSS)
- **Database**: Supabase (PostgreSQL + RLS)
- **AI**: Google Gemini 1.5 Flash (Edge Functions)
- **ORM**: Drizzle ORM (with expo-sqlite for offline caching)
- **State**: Zustand & TanStack Query

---

## 📦 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/)
- [Expo Go](https://expo.dev/go) app on your mobile device.

### 2. Installation
```bash
git clone https://github.com/bass12345-dev/TukarTa.git
cd TukarTa
npm install
```

### 3. Configuration
Create a `.env` file in the root directory and add your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
```

### 4. Running the App
```bash
npx expo start
```

---

## 📂 Project Structure

- `app/`: Expo Router file-based navigation.
- `components/ui/`: Reusable Design System components (GlassCard, Button, Orb, etc.).
- `docs/`: Product requirements, database schema, and technical architecture.
- `supabase/`: Database migrations and Edge Functions logic.
- `utils/`: Reusable utilities (Supabase client, class merging, etc.).

---

## 📄 License
Internal use only. Part of the GEC Personal Projects collection.

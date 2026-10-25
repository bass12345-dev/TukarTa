# TukarTa — Audit & Fix Plan

Scope: issues reported from real-phone testing of the standalone APK, plus a UI audit.
Status: **audit only, no code changed yet.** Items marked *(verify)* could not be confirmed from the repo alone.

---

## 1. Findings

### 1.1 Cross-cutting root cause: no safe-area handling on Android
`app.json` sets `edgeToEdge: true`, so the app draws under the system navigation bar. Only the tab bar and `ai-agent.tsx` use `useSafeAreaInsets`. Everything else uses hard-coded padding.

| Screen | Evidence | Effect on phone |
|---|---|---|
| `signup.tsx`, `login.tsx` | `paddingBottom: 48`, no insets, `KeyboardAvoidingView behavior={undefined}` on Android | Create Account / Confirm field sit under the nav bar; keyboard covers inputs |
| `stage-mode.tsx` | `footerControls` has no inset padding; `topStatusBar paddingTop: 36` hard-coded | RESET / COUNT IN / MINUS 1 / QUEUE are under the system buttons and can't be tapped |
| Tab screens | fixed `paddingBottom` 90/100/110 | Works by luck; breaks on 3-button nav or large insets |

### 1.2 Auth
| Issue | Finding |
|---|---|
| Forgot password | **Does not exist.** No link on login, no `resetPasswordForEmail`, no reset screen, no `PASSWORD_RECOVERY` handling. |
| Confirm password | **Does not exist** on signup. Only one password field, no rules, no show/hide toggle. |
| Google "site can't be reached / null is unreachable" | The app side is plausible (`tukarta://login` redirect, `skipBrowserRedirect`, `openAuthSessionAsync`). Ranked hypotheses: **(a)** `tukarta://login` is not in Supabase → Auth → URL Configuration → Redirect URLs, so Supabase falls back to a bad Site URL *(verify in dashboard)*; **(b)** Google Cloud OAuth client lacks `https://atowgxluqogdsxxeavna.supabase.co/auth/v1/callback` *(verify)*; **(c)** the `login` route is both the redirect target and an auth-guarded screen, so the deep link races with `RootLayoutNav` redirects. Nothing logs `data.url` / `returnUrl`, so we're blind. |
| Offline Gig Mode button | Creates a fake `offline_xxx` user and jumps to `/(tabs)`. Every tab then runs Supabase queries with a non-UUID user id → empty/errored screens. No offline home, no list of downloaded packages (`offlineManager` can only load a package *by setlistId*, nothing enumerates them). |

### 1.3 Offline mode (beyond the guest button)
- No connectivity detection: `@react-native-community/netinfo` is not installed; `hybridSyncEngine` uses `navigator.onLine`, which is unreliable in React Native.
- React Query cache is memory-only (no persister), so a cold start offline shows nothing even for a signed-in user.
- Stage Mode only reads a cached package when it receives a `setlistId`, which the offline guest has no way to reach.
- Dashboard/Setlists/Profile have no offline banner and no "last synced" state.

### 1.4 Pull-to-refresh
Zero `RefreshControl` usages in the app. Compounded by `staleTime: 3 min`, `refetchOnMount: false`, so data can look stale with no way to force it.

### 1.5 Stage Mode (`app/stage-mode.tsx`, 3,265 lines)
| Issue | Finding |
|---|---|
| Dark mode ignored | The screen never calls `useAppTheme`. `StyleSheet.create` has ~63 hard-coded light hex backgrounds (`#FFFFFF`, `#ECFDF5`, …). Toggling theme can't affect it. |
| Controls unreachable | See 1.1 — footer has no bottom inset. Also footer duplicates QUEUE (up-next bar and sub-actions). |
| No rotation | Two locks: `app.json` `"orientation": "portrait"` and `<Stack.Screen options={{ orientation: 'portrait' }}>`. `expo-screen-orientation` isn't installed. Layout is also portrait-only (fixed footer heights). |
| YouTube embed fails | Android WebView loads `https://www.youtube.com/embed/<id>` directly with no `baseUrl`/Referer. YouTube now rejects such embeds (player config error 153 / "video unavailable"). Also: the injected `document.querySelector('video')` sync can't see into the player when it's wrapped in a cross-origin iframe, and the edge function falls back to *unverified* ids when oEmbed filters everything out (and oEmbed success ≠ embeddable in-app). |

### 1.6 General UI audit
- **Identity**: all-mint/green, light-mode default (`themeMode` defaults to `'light'`, not system); light text is `#166534` on white; reads as a generic dashboard rather than a music tool.
- **Navigation**: 5 generic tabs (Dashboard, Setlists, Bands, Discover, Profile) — no Library/Songs tab even though songs are the core object; a floating "ASK AI" mascot sits on top of content on every tab.
- **Consistency**: NativeWind is installed but screens use `StyleSheet` + literal hex; theme tokens exist (`context/theme.tsx`) but many components bypass them.
- **Maintainability**: `stage-mode.tsx` (3.2k), `ai-agent.tsx` (1.2k), `bands.tsx` (1k) are monoliths — the cause of most regressions above.
- **Forms**: no password visibility toggle, no inline validation, `Alert.alert` for all errors.

---

## 2. Plan

### Phase 0 — Make it usable on a real phone (blocking)
1. Add a small `ScreenContainer`/`useBottomInset()` helper; apply to login, signup, stage-mode footer + top bar, and replace fixed tab paddings.
2. Fix keyboard handling on auth screens (Android `behavior="height"` or `KeyboardAwareScrollView`, `keyboardShouldPersistTaps="handled"`).
3. **Signup**: add Confirm Password (match check, min length, show/hide, inline error, button disabled until valid).
4. **Google**: add temporary logging of `redirectTo` and the returned URL; move redirect to a neutral `tukarta://auth-callback` route that is not auth-guarded; you add that URL (and `tukarta://**`) to Supabase Redirect URLs. Confirm Google console callback.

### Phase 1 — Features that are broken or missing
5. **Forgot password**: link on login → `resetPasswordForEmail(email, { redirectTo: 'tukarta://reset-password' })` → new `reset-password` screen (handles recovery deep link, new + confirm password, `updateUser`). Needs the redirect URL allow-listed.
6. **Stage Mode theme + rotation**: build a `stageColors(isDark)` token set and a `makeStyles(colors)` factory; default Stage to dark but follow the toggle. Unlock orientation (`app.json` → `default`, install `expo-screen-orientation`, remove per-screen lock), and add a landscape layout (lyrics left/right, controls in a side rail).
7. **YouTube**: render via `WebView source={{ html, baseUrl: 'https://www.youtube.com' }}` using the IFrame Player API (`enablejsapi`, `origin`) with `postMessage` for time/state (replaces the `<video>` poll); filter candidates by real embeddability; keep "Open in YouTube" as fallback.
8. **Offline**: install NetInfo + a connectivity context; persist React Query (`@tanstack/react-query-persist-client` + AsyncStorage); add `listOfflineGigPackages()`; give the offline guest a dedicated **Offline Gigs** home (downloaded setlists → Stage Mode), an offline banner, and graceful empty states; make signed-in users fall back to cached data.
9. **Pull-to-refresh**: shared `useRefresh(queryKeys)` hook + `RefreshControl` on Dashboard, Setlists, Bands, Discover, Profile; skip with a toast when offline.

### Phase 2 — UI redesign ("music hub")
10. Direction (recommended): **"Backstage"** — dark-first near-black surfaces, one warm stage accent plus the existing mint for success/live states, large chord-friendly mono type, album-art-style song tiles. Tabs: **Home** (next gig, resume song, quick actions) · **Library** (songs, chords, dictionary) · **Setlists/Gigs** · **Bands** (jam rooms, sessions) · **Discover**. AI becomes a header action instead of a floating mascot.
11. Move colors to theme tokens everywhere, split `stage-mode.tsx` into components (Header, Lyrics, Transport, QueueSheet, MinusOnePlayer).

### Suggested order
Phase 0 → 5 → 6 → 7 → 9 → 8 → Phase 2. Phases 0–1 are roughly one focused build cycle; each ships as its own APK.

### What I need from you
- Supabase dashboard access to add redirect URLs (or confirm they're set) — only you can do this.
- The reference UI images you mentioned: they did not come through in my session, so please re-attach them.
- Choice on Phase 2 direction (Backstage dark-first vs. keeping mint light-first).

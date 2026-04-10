# DESIGN_SYSTEM.md
# Design System — Setlist AI MVP

## Design Principles

1. **Stage-first** — Every screen must be readable on a phone screen in a dark, noisy venue. High contrast, large touch targets, minimal cognitive load.
2. **Speed over polish** — A musician checking the next song mid-gig has 3 seconds. Information hierarchy matters more than aesthetics.
3. **Dark is default** — Dark mode is the primary theme. Light mode is secondary.
4. **Confidence over cleverness** — Clear labels, direct actions. No hidden gestures musicians won't discover mid-gig.

---

## Color Palette

### Dark Theme (Primary)

| Token | Hex | Usage |
|---|---|---|
| `background` | `#0F0F14` | App background |
| `surface` | `#1A1A24` | Cards, modals |
| `surface-elevated` | `#242435` | Input fields, selected items |
| `border` | `#2E2E42` | Dividers, card borders |
| `primary` | `#7C6AF7` | Primary actions, active states |
| `primary-dim` | `#3D3578` | Primary button pressed, subtle highlights |
| `accent` | `#F0A500` | Confidence stars, energy indicator |
| `success` | `#2DD4A1` | Approved, confirmed, ready |
| `danger` | `#F05D5D` | Destructive actions, errors |
| `text-primary` | `#F0EFF8` | Main text |
| `text-secondary` | `#9B9AB0` | Subtitles, metadata |
| `text-disabled` | `#4E4D63` | Disabled states |

### Light Theme (Secondary)

| Token | Hex | Usage |
|---|---|---|
| `background` | `#F6F5FF` | App background |
| `surface` | `#FFFFFF` | Cards |
| `surface-elevated` | `#EEEDF8` | Input fields |
| `border` | `#D9D8F0` | Dividers |
| `primary` | `#6B5CE7` | Primary actions |
| `text-primary` | `#1A1830` | Main text |
| `text-secondary` | `#6B6A80` | Subtitles |

---

## Typography

**Primary Font:** `DM Sans` (Google Fonts)
**Mono / Code:** `JetBrains Mono` (for chord sheets, key labels)

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `display` | 28px | 700 | 1.2 | Screen titles |
| `heading-1` | 22px | 600 | 1.3 | Section headers |
| `heading-2` | 18px | 600 | 1.3 | Card titles |
| `body-lg` | 16px | 400 | 1.6 | Primary content |
| `body` | 14px | 400 | 1.5 | Standard text |
| `caption` | 12px | 400 | 1.4 | Metadata, timestamps |
| `label` | 12px | 600 | 1.2 | Badges, tags, pill labels |
| `stage-lyric` | 22px | 400 | 1.8 | Stage mode lyrics |
| `stage-chord` | 18px | 700 | 1.4 | Stage mode chords (mono) |

---

## Spacing System

Base unit: 4px

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Tight gaps, icon padding |
| `space-2` | 8px | Inner component gaps |
| `space-3` | 12px | Standard padding |
| `space-4` | 16px | Card padding, section gaps |
| `space-5` | 20px | Screen horizontal padding |
| `space-6` | 24px | Between sections |
| `space-8` | 32px | Major section breaks |
| `space-10` | 40px | Screen top padding |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 6px | Badges, chips |
| `radius-md` | 12px | Buttons, input fields |
| `radius-lg` | 16px | Cards |
| `radius-xl` | 24px | Bottom sheets, modals |
| `radius-full` | 999px | Avatars, pills |

---

## Components

### Button

Three variants: `primary`, `secondary`, `ghost`

```
Primary:   bg=primary, text=white, height=52px, radius=radius-md
Secondary: bg=surface-elevated, text=text-primary, border=border
Ghost:     bg=transparent, text=primary
```

Minimum touch target: 48px height. Full-width on mobile by default.

States: default → pressed (scale 0.97, opacity 0.85) → loading (spinner) → disabled (opacity 0.4)

---

### SongCard

Used in musician profile and band song overlap view.

```
┌────────────────────────────────────┐
│ ● Song Title            ★★★★☆     │
│   Artist Name           🎸 Live    │
└────────────────────────────────────┘
```

- Left dot: genre color indicator
- Right: confidence stars (1–5)
- "Live" badge: shows only when `can_perform_live = true`
- Height: 64px
- Background: `surface`
- Tap → opens song detail / edit

---

### MusicianCard

Used in marketplace browse screen.

```
┌─────────────────────────────────────────┐
│ [Avatar]  Display Name      ★ 4.8 (12) │
│           Singer • Guitarist            │
│           Cebu City                     │
│           12 songs match your setlist   │
└─────────────────────────────────────────┘
```

- Avatar: 48px circle
- Rating displayed with count
- "N songs match" shown only during setlist search
- Height: 88px

---

### SetlistRow

Used inside Setlist view and Stage Mode.

```
┌───────────────────────────────────────────┐
│  01  Song Title                      4:23 │
│      Artist Name       [C]  [120bpm]      │
└───────────────────────────────────────────┘
```

- Number: 2-digit position, `text-secondary`, mono
- Duration: right-aligned
- Key and BPM badges: optional, shown when available
- Drag handle on left in edit mode
- Height: 72px

---

### ConfidenceBadge

Used on song cards.

```
★★★★☆  = confidence 4/5
```

Stars filled with `accent` (#F0A500), empty with `border`.

Alternative compact form: `4/5` numeric label.

---

### ApprovalChip

```
[✓ Approved]  bg=success-dim, text=success
[→ Suggested] bg=accent-dim, text=accent
[○ Pending]   bg=surface-elevated, text=text-secondary
```

---

### StageView (Full Screen)

Enters when user taps "Start Stage Mode" from a finalized setlist.

```
┌─────────────────────────────────┐  ← StatusBar hidden
│                                 │
│  2 of 12         Next: ───────► │  ← Top bar: position + next song
│─────────────────────────────────│
│                                 │
│  Song Title                     │  ← 22px, bold
│  Artist                         │  ← 14px, secondary
│                                 │
│─────────────────────────────────│
│                                 │
│  [G]     [C]     [Em]    [D]    │  ← Chord row (mono, 18px bold)
│  When I find my-self in times   │  ← Lyric line (22px)
│                                 │
│  [G]     [C]     [Em]    [D]    │
│  of trou-ble, Mo-ther Ma-ry...  │
│                                 │
│           [CHORUS]              │  ← Section label
│                                 │
└─────────────────────────────────┘
│  ◄◄  Prev       ▶▶  Next  [+/-] │  ← Bottom controls
└─────────────────────────────────┘
```

- Background: pure `#000000` in stage mode (maximum contrast)
- Swipe left = next song, swipe right = previous song
- Tap bottom right = transpose controls (+1 / -1 half step)
- Works 100% offline

---

## Navigation Structure

```
Tab 1: Home
  → My Profile
  → My Songs
  → My Bands

Tab 2: Setlists
  → Active Gigs
  → Setlist Detail
    → AI Agent Chat
    → Stage Mode

Tab 3: Discover (Marketplace)
  → Browse Musicians
  → Musician Profile

Tab 4: Notifications
  → Invites
  → Approvals
  → Band Updates
```

Bottom tab bar. Icons from Ionicons. Active tab uses `primary` color.

---

## Iconography

Using `@expo/vector-icons` with the Ionicons set.

| Action | Icon |
|---|---|
| Song | `musical-note` |
| Band | `people` |
| Setlist | `list` |
| Stage mode | `mic` |
| Add | `add-circle` |
| Screenshot upload | `camera` |
| Marketplace | `search` |
| Approve | `checkmark-circle` |
| Suggest | `chatbubble` |
| Rating | `star` |
| Location | `location` |

---

## Animation Guidelines

- Screen transitions: slide (horizontal, 300ms ease-in-out)
- Bottom sheets: slide up (250ms ease-out)
- Card press: scale 0.97 (100ms)
- AI loading: pulsing dots animation
- Setlist approval: checkmark scale-in (200ms, spring)
- Stage mode enter: fade to black (400ms)

Keep all animations under 400ms. No loops except loading states.

---

## Accessibility

- Minimum touch target: 48×48px on all interactive elements
- Color is never the only way to communicate information (always add label or icon)
- All images have `accessibilityLabel`
- Stage mode font minimum: 20px
- Dynamic font size: respect system font scale up to 1.3×
- Dark mode: always supported (dark is default)

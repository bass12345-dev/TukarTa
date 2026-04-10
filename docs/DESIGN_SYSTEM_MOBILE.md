# TukarTa Mobile Design System

This document outlines the design patterns and reusable UI components implemented in the TukarTa mobile application, based on the high-fidelity glassmorphic prototype.

---

## 🎨 Color Palette

We use a dark, premium color palette with vibrant accents and glassmorphic transparency.

### Core Colors
| Color | Hex / RGBA | Tailwind Class | Description |
|---|---|---|---|
| **Background** | `#071420` | `bg-brand-bg` | Main application background |
| **Secondary BG** | `#0b1e30` | `bg-brand-bg2` | Alternate backgrounds and sub-sections |
| **Glass** | `rgba(255,255,255,0.06)` | `bg-brand-glass` | Translucent background for cards |
| **Glass Border** | `rgba(255,255,255,0.10)` | `border-brand-glass-border` | Subtle borders for glass elements |

### Accent Colors
| Intent | Hex | Tailwind Class |
|---|---|---|
| **Primary (Cyan)** | `#00D4FF` | `text-brand-cyan` / `bg-brand-cyan` |
| **Secondary (Purple)** | `#8B5CF6` | `text-brand-purple` / `bg-brand-purple` |
| **Success (Green)** | `#10B981` | `text-brand-green` / `bg-brand-green` |
| **Warning (Gold)** | `#F59E0B` | `text-brand-gold` / `bg-brand-gold` |
| **Accent (Pink)** | `#EC4899` | `text-brand-pink` / `bg-brand-pink` |

---

## 🔡 Typography

We use **DM Sans** for all UI text and **JetBrains Mono** for musical data (keys, BPM, etc.).

| Style | Component | Size | Font |
|---|---|---|---|
| **H1 Heading** | `<Heading />` | 24px | Bold |
| **H2 Subheading** | `<Subheading />` | 18px | Semibold |
| **Body** | `<Paragraph />` | 14px | Regular |
| **Label** | `<Label />` | 11px | Bold, Uppercase |
| **Technical** | `<Mono />` | 12px | Mono |

---

## 🧩 Core Components

### `GlassCard`
The foundational container for the app, using `expo-blur` for a true glass effect.
```tsx
<GlassCard>
  <Subheading>Card Title</Subheading>
  <Paragraph>Content goes here...</Paragraph>
</GlassCard>
```

### `Button`
Supports gradients and glass styles.
```tsx
<Button title="Save Setlist" variant="primary" />
<Button title="Cancel" variant="glass" />
<Button title="Edit" variant="ghost" />
```

### `Orb`
Circular icon container with a glowing background pulse.
```tsx
<Orb variant="purple">
  <Music color="#8B5CF6" />
</Orb>
```

### `Pill`
Small badges for tags and status indicators.
```tsx
<Pill label="LIVE READY" variant="green" />
```

---

## 🛠️ Implementation Details

### Class Merging
Use the `cn()` utility in `utils/cn.ts` to merge Tailwind classes efficiently.
```ts
import { cn } from '@/utils/cn';

const dynamicClasses = cn("bg-brand-bg", isHero && "p-10");
```

### Glassmorphism Tips
1. Always use `border-brand-glass-border` on glass cards to ensure they separate from the background.
2. Pair glass cards with `Orb` components to add visual depth and color.
3. Use `brand-text-sec` for secondary information to maintain visual hierarchy.

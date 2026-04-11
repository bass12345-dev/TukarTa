# Standard Card Design Reference

This document defines the standard design and layout for selection cards used throughout the TukarTa onboarding flow and marketplace. Consistency in these components is critical for maintaining a premium feel.

## Visual Specifications

### Dimensions & Shape
- **Height**: Fixed `70px` (or `70pt` in React Native).
- **Border Radius**: `24px` for a modern, rounded pill-look.
- **Border Width**: `1.2px` (Standard) / `1.5px` (Active).
- **Overflow**: `hidden` (to contain Glassmorphism effects).

### Colors & Materials
- **Background**: `GlassCard` (with `intensity: 12` for inactive, `intensity: 30` for active).
- **Border Color (Inactive)**: `rgba(255, 255, 255, 0.08)`.
- **Border Color (Active)**: `#00D4FF` (Cyan Primary).
- **Active Tint**: `rgba(0, 212, 255, 0.06)` background overlay.

## Layout Structure

Cards should use the `noPadding` prop on `GlassCard` and use a `contentContainerStyle` to ensure vertical centering.

### Header/Main Content
- **Flex Direction**: `row`.
- **Alignment**: `center` (vertical).
- **Horizontal Padding**: `20px`.
- **Left Element**: Icon or Avatar (standard size `42x42`).
- **Center Element**: Text container with `flex: 1` and `marginLeft: 16`.
- **Right Element**: Selection indicator (Checkbox) or Action icon (Chevron).

## Selection Indicator (Checkbox)

The selection indicator is a custom circular checkmark.

- **Size**: `24x24`.
- **Border Radius**: `12px`.
- **Border Width**: `1.5px`.
- **Border Color (Inactive)**: `rgba(255, 255, 255, 0.2)`.
- **Active State**: `backgroundColor: '#00D4FF'`, `borderColor: '#00D4FF'`.

## Implementation Example (React Native)

```tsx
<GlassCard
  style={[styles.card, isActive && styles.cardActive]}
  contentContainerStyle={styles.cardContent}
  intensity={isActive ? 30 : 12}
  noPadding
>
  <View style={styles.iconBox}>
    {/* Icon here */}
  </View>
  <View style={styles.textContainer}>
    <Text style={styles.title}>{label}</Text>
    {sub && <Text style={styles.subtitle}>{sub}</Text>}
  </View>
  <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
    {isActive && <Check size={14} color="#FFF" strokeWidth={3} />}
  </View>
</GlassCard>
```

## Styling Tokens

```typescript
const styles = StyleSheet.create({
  card: {
    height: 70,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: '#00D4FF',
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'DM Sans Bold',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

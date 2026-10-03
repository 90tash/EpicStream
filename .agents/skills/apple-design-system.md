
## 🧭 Design Philosophy: The Aesthetic Fusion

Undertone’s visual identity is a deliberate marriage of two premier mobile design traditions:
1. **Apple Music (Spatial Precision & Heavy Typography)**:
   - Deep pitch-black OLED backdrops (`#000000`).
   - Heavy, tightly-tracked SF Pro typography with negative letter-spacing.
   - Dynamic artwork wash adaptation: every page surface, text tier, and hairline is algorithmically derived from the release sleeve.
   - Playful physical interactions (sleeve breathes on play/pause, velocity stretching on tab pills).
2. **Telegram (Kinetic Glass & Modern Line Iconography)**:
   - Edge-to-edge optical frosted glass (`Haze` / `backdrop-filter`).
   - 2.2px thick-stroke, round-capped geometric iconography.
   - Floating pill navigation bars and docked media controls that hover above scrolling content.

---

## 🎨 1. Color System & Dynamic Palette Architecture

### Base Theme Palettes

Undertone strictly differentiates between deep dark mode and crisp high-contrast light mode:

| Semantic Role | Dark Mode (`DarkColors`) | Light Mode (`LightColors`) | Description |
| :--- | :--- | :--- | :--- |
| **Primary** | `#FFFFFF` | `#000000` | High-contrast actions, active icons |
| **Background** | `#000000` | `#FFFFFF` | True OLED black / Pure paper white |
| **Surface** | `#0D0D0F` | `#F7F7F9` | Elevated cards, list headers |
| **Surface Variant** | `#1C1C1E` | `#F2F2F7` | Secondary interactive containers, buttons |
| **On Surface Variant**| `#8E8E93` | `#6E6E73` | Subtitles, metadata, inactive icons |
| **Outline / Hairline** | `#2C2C2E` | `#E5E5EA` | 0.5dp / 1px structural dividing lines |
| **Accent Red** | `#FA2D48` | `#FA2D48` | Signature Apple Music accent (Replay, badges) |

---

### Dynamic Artwork Color Extraction (`ArtworkPalette`)

Rather than tinting a page with a raw dominant color, Undertone computes a 6-channel semantic palette for any album, playlist, or artist:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. wash                Upper backdrop directly under artwork │
├─────────────────────────────────────────────────────────────┤
│ 2. background          Lower page tone settling down the feed│
├─────────────────────────────────────────────────────────────┤
│ 3. elevated            Glass pill buttons & chip containers  │
├─────────────────────────────────────────────────────────────┤
│ 4. accent              Contrast-checked title & Play button  │
├─────────────────────────────────────────────────────────────┤
│ 5. onBackground        Primary title text (White/Black)      │
├─────────────────────────────────────────────────────────────┤
│ 6. onBackgroundVariant Subtitle text (contrast-safe grey)    │
├─────────────────────────────────────────────────────────────┤
│ 7. divider             Hairline border tinted by sleeve wash │
└─────────────────────────────────────────────────────────────┘
```

#### Color Derivation Rules:
- **`wash`**: The mean color sampled at the artwork’s bottom edge. It seamlessly blends the sleeve into the page without a visible edge.
- **`background`**: Darkened (dark mode, luminance $\le 0.08$) or lightened (light mode, luminance $\ge 0.92$) version of the wash, grounding the list rows.
- **`accent`**: Contrast-ratio verified against `background` ($\ge 4.5:1$). If contrast fails, saturation is boosted and lightness clamped.
- **Smooth Interpolation**: When switching songs or pages, all 6 colors interpolate simultaneously via `animateColorAsState(tween(400, easing = FastOutSlowInEasing))`.

---

## 🔤 2. Typography Hierarchy & Metrics

Undertone uses **SF Pro Display** with tight negative letter tracking:

```
Weight Distribution:
- W400 (Regular)   → Body text, track subtitles, metadata
- W500 (Medium)    → Song titles, menu items
- W600 (SemiBold)  → Top bar titles, button labels, chips
- W700 (Bold)      → Section shelf headers, modal titles
- W800 (Heavy)     → Hero page headlines, Replay metrics
```

### Type Scale Specification

| Role | Font Size | Weight | Tracking (Letter Spacing) | Usage Example |
| :--- | :--- | :--- | :--- | :--- |
| **Display Large** | `34.sp` | `W800` (Heavy) | `-0.8.sp` | Replay year hero, large section titles |
| **Headline Large**| `30.sp` | `W800` (Heavy) | `-0.7.sp` | Artist / Album hero headlines |
| **Headline Medium**| `22.sp` | `W700` (Bold) | `-0.4.sp` | Shelf headers ("Listen Now", "New Releases") |
| **Title Large** | `20.sp` | `W700` (Bold) | `-0.3.sp` | Dialog headings, NowPlaying song title |
| **Title Medium** | `16.sp` | `W600` (SemiBold) | `-0.2.sp` | Frosted top bar title, row titles |
| **Body Large** | `16.sp` | `W400` (Regular) | `0.0.sp` | Notification toasts, lyric lines |
| **Body Medium** | `14.sp` | `W400` (Regular) | `0.0.sp` | Song artist/album subtitle, description |
| **Label Medium** | `12.sp` | `W600` (SemiBold) | `+0.1.sp` | Period chips, badge labels, duration |
| **Label Small** | `11.sp` | `W600` (SemiBold) | `+0.2.sp` | Audio codec badges (FLAC, 320k, OPUS) |

---

## 📐 3. Spatial Geometry & Inset Architecture

```
0dp  ┌────────────────────────────────────────────────────────┐ Top of Window
     │ [ Status Bar Inset: calculateTopPadding() ]            │
     ├────────────────────────────────────────────────────────┤
     │ FrostedTopBar (52dp height) + 0.5dp Hairline Divider   │ = topBarHeight()
     ├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┤
     │ TopBarContentGap (20dp)                                │ = topBarContentPadding()
     │                                                        │
     │ PAGE CONTENT (LazyColumn / Feed)                       │
     │ - Horizontal Padding: PAGE_GUTTER = 10.dp              │
     │ - Bottom Padding: Clears MiniPlayer + BottomBar        │
     │                                                        │
     ├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┤
     │ QueueActionNotice (Floating Toast)                     │
     ├────────────────────────────────────────────────────────┤
     │ MiniPlayer (56dp height pill, 28dp radius)             │
     ├────────────────────────────────────────────────────────┤
     │ 2dp Gap                                                │
     ├────────────────────────────────────────────────────────┤
     │ FloatingBottomBar (54dp height pill)                   │
     ├────────────────────────────────────────────────────────┤
     │ [ Navigation Bar Inset: calculateBottomPadding() ]     │
     └────────────────────────────────────────────────────────┘ Bottom of Window
```

### Core Spatial Constants:
- **`PAGE_GUTTER = 10.dp`**: The left and right margin aligning feeds, cards, headers, floating mini player, and bottom tab bar.
- **`TopBarContentHeight = 52.dp`**: Pinned status bar content height.
- **`topBarHeight()`**: `statusBarsPadding() + 52.dp`.
- **`topBarContentPadding()`**: `topBarHeight() + 20.dp` breathing room.
- **`Thumbnail Border`**: `1.dp` solid border with `0.15f` alpha (`Color.White.copy(0.15f)` dark, `Color.Black.copy(0.15f)` light) applied to all album covers, playlist art, and avatars to prevent visual bleed against glass.

---

## 🖊️ 4. Iconography Design Language (`UndertoneIcons`)

Undertone utilizes a custom line icon family inspired by Telegram:
- **Geometry**: Drawn as strokes (no solid vector fills) with uniform **`2.2px` stroke weight**.
- **Terminals & Joins**: Strict `StrokeCap.Round` and `StrokeJoin.Round`.
- **Viewport**: Normalized `24 × 24` vector coordinate grid.
- **Optical Balance**:
  - Touch targets: standard `48.dp` or `40.dp`.
  - Icon glyph sizes: `20.dp` to `24.dp` for navigation; `32.dp` for primary playback transport; `18.dp` for metadata glyphs.

### Icon Catalog & Coordinates

| Icon | Purpose | Key Path Geometry & Rules |
| :--- | :--- | :--- |
| **`Play`** | Primary media trigger | Triangle with rounded corners: `(6.8, 4.8) -> (19.2, 12) -> (6.8, 19.2)` |
| **`Pause`** | Playback pause | Two vertical 2.2px rounded bars at `x = 7.5` and `x = 14.5` |
| **`Queue`** | Track queue list | 3 horizontal lines (`y = 6, 12, 18`) with circular bullet points (`radius = 1.25`) |
| **`LyricsQuote`** | Synchronized lyrics | Speech bubble with inner double quotation marks |
| **`Next` / `Prev`**| Track navigation | Forward/backward triangle leading into a vertical stop line |
| **`Shuffle`** | Queue randomization | Intersecting rounded diagonal tracks with directional arrows |
| **`Repeat`** | Loop mode | Circular loop arrows with optional inner `"1"` badge for single loop |
| **`Cast`** | Remote speaker | Radio wave arcs emerging from a screen rectangle with rounded bottom-left dot |
| **`Heart`** | Library favorite | Smooth dual-arc heart outline, animating fill on activation |
| **`Speed`** | Playback tempo | Speedometer dial arc with 45° angled indicator needle |

---

## 🧩 5. Core Component Anatomy & Specifications

### A. Frosted Top Bar (`FrostedTopBar.kt`)

```
┌────────────────────────────────────────────────────────┐
│ [← Back / Logo]           Title Text          [Avatar] │
└────────────────────────────────────────────────────────┘
  ─────────────────────────────────────────────────────── 0.5dp Hairline Divider
```
- **Backdrop**: Haze glass shader (`HazeMaterials.thin(resolvedBgColor)`), `blurRadius = 24.dp`, `inputScale = None`, `noiseFactor = 0f`.
- **Title Behavior**:
  - Main Feeds (Home, Explore, Library): Title starts hidden at rest (`alpha = 0f`), fading in (`tween(220)`) when the feed scrolls.
  - Sub-pages (Settings, History, Replay, Discord, Equalizer): Title is permanently visible (`scrolled = true`) centered in the bar.
- **Divider**: Hairline border (`0.5.dp`), resting at `alpha = 0.30f`, illuminating to `alpha = 0.55f` when content passes beneath.
- **Padding Balance**: Perfectly symmetric `56.dp` start and end padding to guarantee dead-center alignment for text.

---

### B. Floating Bottom Bar (`FloatingBottomBar.kt`)

```
  ╭────────────────────────────────────────────────────╮
  │   [Home]     [Explore]     ([Library])    [Search] │
  ╰────────────────────────────────────────────────────╯
```
- **Container**: Floating pill (`RoundedCornerShape(percent = 50)`), `PAGE_GUTTER` horizontal margin, `border = 0.5.dp`.
- **Liquid Stretching Indicator**:
  - As tabs switch, the indicator pill animates with a spring (`dampingRatio = 0.82f`, `stiffness = 420f`).
  - Measures velocity lag: `lag = abs(target - current) / step`.
  - Stretches along motion axis: `scaleX = 1f + lag * 0.28f`.
  - Icon scales up to `1.12f` when selected.

---

### C. Floating Mini Player (`MiniPlayer.kt`)

```
  ╭───┬───────────────────────────────────┬─────┬──────╮
  │Art│ Title Text                        │ ▶/⏸ │  ⏭️  │
  │40 │ Artist Subtitle                   │ 32  │  32  │
  ╰───┴───────────────────────────────────┴─────┴──────╯
  ═══════════════════ Progress Line (2dp) ══════════════
```
- **Dimensions**: `56.dp` height pill, `28.dp` corner radius.
- **Artwork**: `40.dp × 40.dp` thumbnail with `1.dp` thumbnail border.
- **Transport Controls**:
  - `40.dp` touch slot, `32.dp` icon glyph.
  - `8.dp` clearance between Play and Skip to eliminate miss-taps.
- **Gestures**: Horizontal drag gesture to skip track forward/backward with haptic notch feedback.
- **Progress Track**: Crisp `2.dp` track line along the bottom edge showing real-time song completion.

---

### D. Full-Screen Player (`NowPlayingScreen.kt`)

- **Backdrop**: Dynamic multi-point GPU mesh gradient (`MeshGradient.kt`) interpolating 4 active palette colors in real time.
- **Artwork Sleeve Bounce**:
  - `1.0f` scale with `32.dp` elevation shadow when playing.
  - Springs to `0.86f` scale with `12.dp` shadow when paused (`dampingRatio = 0.75f`, `stiffness = 200f`).
- **Turntable / Vinyl Mode**:
  - Continuous 33⅓ RPM rotating vinyl disc with center label art.
  - Stylus tone-arm pivots smoothly onto the vinyl on play, lifting on pause.
- **Karaoke Lyrics Engine**:
  - Auto-scrolling synchronized lines.
  - Vertical bidirectional slide transitions (`FastOutSlowInEasing`, `340ms`).
  - Active line expands in font size and brightens to 100% white while inactive lines dim to 40% white.

---

### E. Song Row (`Common.kt` / `SongRow`)

```
┌────┬──────────────────────────────────────────┬──────┬───┐
│Art │ Song Title (TitleMedium, W500)           │ 3:42 │ ⋮ │
│48dp│ Artist Name · Album (BodyMedium, 55% a)  │      │   │
└────┴──────────────────────────────────────────┴──────┴───┘
```
- **Artwork**: `48.dp × 48.dp`, rounded `8.dp`, with `1.dp` thumbnail border.
- **Interactive Gestures**:
  - Tap: Play track and set queue.
  - Long Press: Open track context sheet.
  - Swipe: Quick queue action with haptic trigger.

---

## 🌐 6. Web & Cross-Platform Translation Guide

How to implement this design system in **Next.js 15, React 19 & Tailwind CSS**:

### Tailwind CSS Tokens (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        surfaceVariant: "var(--surface-variant)",
        accent: "var(--accent)",
        accentRed: "#FA2D48",
        border: "var(--border)",
        onSurface: "var(--on-surface)",
        onSurfaceVariant: "var(--on-surface-variant)",
      },
      fontFamily: {
        display: ["var(--font-sf-pro)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      letterSpacing: {
        tighter: "-0.05em",
        tight: "-0.025em",
        normal: "0em",
      },
    },
  },
};
export default config;
```

### CSS Variables (`globals.css`)

```css
:root {
  --background: #ffffff;
  --surface: #f7f7f9;
  --surface-variant: #f2f2f7;
  --on-surface: #000000;
  --on-surface-variant: #6e6e73;
  --border: rgba(0, 0, 0, 0.12);
  --accent: #fa2d48;
}

.dark {
  --background: #000000;
  --surface: #0d0d0f;
  --surface-variant: #1c1c1e;
  --on-surface: #ffffff;
  --on-surface-variant: #8e8e93;
  --border: rgba(255, 255, 255, 0.12);
  --accent: #fa2d48;
}

/* Glassmorphism Classes */
.glass-nav {
  background: rgba(var(--background), 0.72);
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  border-bottom: 0.5px solid var(--border);
}

.glass-pill {
  background: rgba(var(--surface), 0.75);
  backdrop-filter: blur(20px) saturate(1.7);
  -webkit-backdrop-filter: blur(20px) saturate(1.7);
  border: 0.5px solid var(--border);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.28), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15);
}
```

---

## 🎯 Summary Checklist for New Apps
- [ ] Set background to pure pitch-black (`#000000`) in dark mode.
- [ ] Use `SF Pro Display` with tight negative tracking (`-0.02em` to `-0.05em`).
- [ ] Apply `1.dp` semi-transparent thumbnail borders (`alpha = 0.15f`) on all artwork.
- [ ] Clamp top bar content height to `52.dp` plus status bar inset.
- [ ] Finish top bars with an edge-to-edge `0.5.dp` bottom hairline divider.
- [ ] Float navigation and mini player bars as rounded pills with `10.dp` page gutters.
- [ ] Use spring physics (`dampingRatio = 0.82f`, `stiffness = 420f`) and velocity stretch for sliding indicators.
- [ ] Draw custom line icons with `2.2px` stroke weight, round caps, and round joins.

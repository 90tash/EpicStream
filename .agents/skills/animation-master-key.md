---
name: animation-master-key
description: Universal master key for production-grade, 60-120 FPS animations, fluid spring physics, tactile gestures, and optical glassmorphism across any platform (Web, Android Jetpack Compose, iOS SwiftUI, Flutter). Use whenever designing, creating, or polishing UI animations, micro-interactions, liquid navigation, or glassmorphic surfaces.
---

# Animation Master Key: The Universal Motion, Glass & Gesture Blueprint

A platform-agnostic, production-grade master specification and implementation engine for 60–120 FPS fluid interfaces. Designed to be dropped into **any project, framework, or AI coding environment** (Antigravity, Claude, ChatGPT, Cursor, Windsurf) to immediately unlock award-winning motion craft.

---

## ⚡ The Universal Master Prompt

Copy and paste this instruction block into any AI assistant, custom instruction, or project prompt:

```markdown
You are a Principal Motion Design & UI Systems Engineer. 

Whenever implementing or refining animations, components, gestures, or visual surfaces, you must strictly abide by the **Universal Animation Master Key**:

1. **Optical Glassmorphism Standards**:
   - Never render flat semi-transparent boxes. Use true physical diffusion:
     - Real-time optical blur (`blurRadius = 20-24dp` / `backdrop-filter: blur(24px) saturate(1.8)`).
     - 1:1 native screen resolution (zero downsampling, flickering, or noise).
     - Dynamic 0.5dp / 0.5px specular hairline border that illuminates from `0.30` at rest to `0.55` when content passes beneath.
     - Ambient background tint derived from page wash or artwork colors.
     - Graceful, solid-color fallback when reduced motion or low-power mode is enabled.

2. **Spring Physics & Kinetic Velocity**:
   - Interactive Settle Spring: `damping = 0.82`, `stiffness = 420` (or `[0.16, 1, 0.3, 1]` ease curve) for responsive feedback without rubbery oscillation.
   - Playful Media Spring: `damping = 0.65 - 0.75`, `stiffness = 200 - 300` for physical sleeve scales and disc ejects.
   - Deformable Physics (Liquid Stretch): Travel indicators stretch along the vector of motion based on velocity lag (`scaleX = 1f + lag * stretchFactor`).

3. **Performance Commandments (120 FPS Guarantee)**:
   - Strictly transform GPU-composited layers only (`translation`, `scale`, `rotation`, `opacity`). Never animate layout dimensions (`width`, `height`, `top`, `margin`).
   - Draw loop isolation: Read high-frequency animation states (phases, continuous rotations, drag offsets) inside render lambdas / GPU display lists to bypass layout and composition cycles.
```

---

# 🔑 The 7 Universal Master Keys

---

## 🔑 KEY 1: The Optical Glass & Translucency Key

True physical glass is defined by **four physical layers**: background optical blur, saturation boost, ambient color wash, and a specular hairline boundary.

### Universal Physics & Specs:
- **Diffusion Blur**: `20dp` to `24dp` (or `24px` on Web).
- **Color Saturation**: Boost background saturation by `1.4×` to `1.8×` (`saturate(1.8)`) so text over blurred imagery stays vibrant and readable.
- **Specular Hairline Border**: Pinned at the outer boundary. Exactly `0.5dp` / `0.5px` thickness. Tinted with `outlineVariant` / `rgba(255,255,255,0.15)`.
  - **Dynamic Scroll Illumination**: At rest `alpha = 0.30`; when content scrolls underneath, animate to `alpha = 0.55` (`tween(220)`).
- **Reduced Motion Fallback**: Render a solid, opaque container matching `MaterialTheme.colorScheme.surface` or `--surface`.

```
┌────────────────────────────────────────────────────────┐
│ Glass Surface (HazeMaterials.thin / backdrop-filter)  │
└────────────────────────────────────────────────────────┘
  ─────────────────────────────────────────────────────── 0.5px / 0.5dp Hairline Border
```

#### Multi-Platform Code Recipes:

<details>
<summary><b>Android (Jetpack Compose + Haze)</b></summary>

```kotlin
// Hairline alpha driven by scroll state
val dividerAlpha by animateFloatAsState(if (scrolled) 0.55f else 0.30f, tween(220))
val glassStyle = HazeMaterials.thin(pageColor)

Box(
    modifier = modifier
        .fillMaxWidth()
        .then(
            if (reduceDynamicBlur) Modifier.background(pageColor)
            else Modifier.hazeEffect(state = hazeState, style = glassStyle) {
                inputScale = HazeInputScale.None // 1:1 screen resolution
                blurRadius = 24.dp
                noiseFactor = 0f
            }
        )
) {
    // Content ...
    HorizontalDivider(
        thickness = 0.5.dp,
        color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = dividerAlpha),
        modifier = Modifier.align(Alignment.BottomCenter)
    )
}
```
</details>

<details>
<summary><b>Web (CSS / Tailwind / React)</b></summary>

```css
.glass-surface {
  background: rgba(var(--surface-rgb), 0.72);
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  border-bottom: 0.5px solid rgba(255, 255, 255, var(--divider-alpha, 0.3));
  transition: border-color 220ms ease;
}

.glass-pill {
  background: rgba(var(--surface-rgb), 0.75);
  backdrop-filter: blur(20px) saturate(1.7);
  -webkit-backdrop-filter: blur(20px) saturate(1.7);
  border: 0.5px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.28), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15);
}
```
</details>

<details>
<summary><b>iOS (SwiftUI)</b></summary>

```swift
ZStack(alignment: .bottom) {
    VisualEffectBlur(blurStyle: .systemUltraThinMaterial)
    
    Rectangle()
        .fill(Color.white.opacity(isScrolled ? 0.55 : 0.30))
        .frame(height: 0.5)
        .animation(.easeInOut(duration: 0.22), value: isScrolled)
}
```
</details>

---

## 🔑 KEY 2: The Organic Spring & Velocity-Deformation Key

Static movement reads as mechanical. Physical motion responds to **mass, stiffness, and kinetic velocity lag**.

### Universal Spring Presets:

| Animation Preset | Damping Ratio ($\zeta$) | Stiffness / Duration | Purpose |
| :--- | :--- | :--- | :--- |
| **Tactile Settle** | `0.82` (Lightly damped) | `420f` (Medium) | Segmented pill selectors, tab switches |
| **Media Bounce** | `0.65 - 0.75` (Bouncy) | `200 - 300f` (Soft) | Sleeve scaling on play/pause, like buttons |
| **Deceleration Curve** | Cubic Bezier `[0.16, 1, 0.3, 1]` | `300 - 450ms` | Page pushes, bottom sheet entrances |
| **Linear Progression** | `1.0` (Critically damped) | Duration-based | Orbital rings, marquees, story timers |

### The Liquid Velocity-Stretch Formula:
When an active indicator moves between tabs, calculate its lag and stretch it dynamically along its velocity vector:
$$\text{lag} = \text{clamp}\left(\frac{|\text{targetPosition} - \text{currentAnimatedPosition}|}{\text{stepDistance}}, 0, 1\right)$$
$$\text{scaleX} = 1.0 + (\text{lag} \times \text{STRETCH\_FACTOR}) \quad (\text{where } \text{STRETCH\_FACTOR} \approx 0.28)$$

#### Multi-Platform Code Recipes:

<details>
<summary><b>Android (Jetpack Compose)</b></summary>

```kotlin
val pillOffset by animateFloatAsState(
    targetValue = selectedIndex * stepPx,
    animationSpec = spring(dampingRatio = 0.82f, stiffness = 420f),
    label = "pillOffset"
)
val lag = if (stepPx > 0f) (abs(targetPx - pillOffset) / stepPx).coerceIn(0f, 1f) else 0f

Box(
    modifier = Modifier
        .graphicsLayer {
            translationX = pillOffset
            scaleX = 1f + lag * 0.28f // Symmetrical elongation during travel
        }
)
```
</details>

<details>
<summary><b>Web (Framer Motion)</b></summary>

```tsx
// Using Framer Motion layoutId with organic spring parameters
<motion.div
  layoutId="activeIndicator"
  className="absolute inset-0 rounded-full bg-primary/20 border border-primary/40"
  transition={{
    type: "spring",
    stiffness: 420,
    damping: 32,
    mass: 0.8,
  }}
/>
```
</details>

---

## 🔑 KEY 3: The Kinetic Typography & Mask Key

High-craft text animations deconstruct words into individual characters or lines, utilizing **staggered overflow clipping** and **negative letter tracking**.

### Universal Rules:
- **Container**: Pinned with `overflow: hidden` (`clipRect`).
- **Initial State**: Shifted `110%` to `115%` along Y axis with `opacity: 0`.
- **Target State**: `y: 0`, `opacity: 1`.
- **Stagger Timing**: `delay = index * 0.05s` (or `0.06s`).
- **Easing Curve**: Apple signature cubic bezier `[0.16, 1, 0.3, 1]`.

#### Multi-Platform Code Recipes:

<details>
<summary><b>Web (React & Framer Motion)</b></summary>

```tsx
export function KineticWordmark({ text }: { text: string }) {
  return (
    <h1 className="flex overflow-hidden font-display text-6xl font-extrabold tracking-tight">
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ y: "115%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.75,
            delay: index * 0.05,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block will-change-transform"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </h1>
  );
}
```
</details>

<details>
<summary><b>Android (Jetpack Compose AnimatedContent)</b></summary>

```kotlin
AnimatedContent(
    targetState = headingText,
    transitionSpec = {
        (fadeIn(tween(260)) + slideInVertically(tween(280, easing = FastOutSlowInEasing)) { it / 2 })
            .togetherWith(
                fadeOut(tween(180)) + slideOutVertically(tween(180, easing = FastOutSlowInEasing)) { -it / 2 }
            )
    },
    label = "headerTransition"
) { text ->
    Text(
        text = text,
        style = MaterialTheme.typography.displayLarge.copy(letterSpacing = (-0.8).sp),
        fontWeight = FontWeight.W800,
    )
}
```
</details>

---

## 🔑 KEY 4: The Shared Geometry & Layout Navigation Key

Eliminates abrupt visual cuts when moving between tabs or pages by sharing layout containers.

### Universal Rules:
- **Directional Switching**: Track change direction:
  $$\text{direction} = \begin{cases} +1 & \text{if } \text{newIndex} > \text{oldIndex} \\ -1 & \text{if } \text{newIndex} < \text{oldIndex} \end{cases}$$
- **Entry / Exit**: Enter from `x = direction * 40px`, exit toward `x = -(direction * 40px)`.
- **Crossfade Easing**: FastOutSlowIn (`300ms`) with simultaneous subtle scale (`0.98 -> 1.0`).

---

## 🔑 KEY 5: The Continuous Ambient & Harmonic Motion Key

Living interfaces feature continuous background movement (artwork mesh gradients, orbital rings, and infinite marquees) that execute with **zero recomposition or re-render overhead**.

### Universal Rules:
- **Isolate the Draw Loop**: Never update component props or trigger React/Compose state on every frame. Pass an `Animatable` or `requestAnimationFrame` value directly into a `Canvas` / `webgl` / `graphicsLayer` draw block.
- **Irrational Frequencies**: When generating organic blobs or waves, drive individual coordinate sine/cosine waves with non-harmonic prime multipliers ($0.7, 1.1, 1.3$) so the animation never repeats.
- **Infinite Marquee Edge Masks**: Always soften marquee container edges with an alpha gradient mask:
  `mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent)`

#### Multi-Platform Code Recipes:

<details>
<summary><b>Android (Isolated GPU Canvas Mesh)</b></summary>

```kotlin
val phase = remember { Animatable(0f) }
LaunchedEffect(Unit) {
    while (isActive) {
        phase.animateTo(phase.value + 6.28318f, tween(18000, easing = LinearEasing))
    }
}

Canvas(modifier = Modifier.fillMaxSize()) {
    val p = phase.value // Read INSIDE draw scope only: zero recomposition!
    val x1 = size.width * 0.3f + kotlin.math.sin(p) * size.width * 0.15f
    val y1 = size.height * 0.3f + kotlin.math.cos(p * 0.8f) * size.height * 0.15f
    drawCircle(brush = Brush.radialGradient(listOf(color1, Color.Transparent), center = Offset(x1, y1), radius = size.width * 0.75f))
}
```
</details>

<details>
<summary><b>Web (Seamless CSS/Framer Marquee)</b></summary>

```tsx
export function InfiniteMarquee({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        className="flex shrink-0 gap-4"
      >
        {[...items, ...items].map((item, idx) => (
          <div key={idx} className="glass-pill px-6 py-2 text-sm">
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
```
</details>

---

## 🔑 KEY 6: The Tactile Gesture & Recoil Key

Touches should feel physical, elastic, and rubber-banded.

### Universal Rules:
- **Elastic Resistance**: During manual touch drags, apply a dampening factor of `0.35×` so dragging feels anchored:
  $$\text{effectiveDrag} = \text{rawDrag} \times 0.35$$
- **Spring Snap-Back**: On release before activation threshold, launch an overshoot spring (`damping = 0.65`, `stiffness = 400`) back to `0`.
- **Media Sleeve Bounce**:
  - Play State: Scale = `1.0f`, Shadow Elevation = `32dp`.
  - Pause State: Scale = `0.86f`, Shadow Elevation = `12dp`.
  - Spring Spec: `dampingRatio = 0.75f`, `stiffness = 200f`.

---

## 🔑 KEY 7: The Micro-Interaction & Haptic Polish Key

Small details that elevate an interface into an award-winning experience:
- **Button Press Depress**: Scale down to `0.94f - 0.96f` on touch down; spring release to `1.0f`.
- **Haptic Notches**: Fire a light mechanical haptic click on:
  - Tab selection crossing.
  - Pull-to-refresh threshold trigger.
  - Media skip forward / backward gesture snap.
- **Floating Notice Toasts**: Slide in vertically from bottom (`y = height / 2 -> 0`) paired with fade; auto-dismiss with polite screen-reader accessibility announcements.

---

## 🏆 Checklist for Verifying Any Animated UI
- [ ] Are all animations running at a stable 60–120 FPS on real hardware?
- [ ] Are layout properties (`width`, `height`, `margin`) completely avoided during motion in favor of `transform` and `opacity`?
- [ ] Is high-frequency animation state kept out of main component re-render loops?
- [ ] Does the glass effect have an optical blur, a saturation boost, and an animated `0.5px` specular hairline border?
- [ ] Do tab pills stretch along their travel vector using velocity lag?
- [ ] Does media artwork scale smoothly between active and paused states?
- [ ] Is there an instantaneous fallback for users with "Reduce Motion" enabled?

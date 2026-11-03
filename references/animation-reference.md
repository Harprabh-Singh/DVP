# Ohana — Animation Reference Guide

> A complete, code-level breakdown of every animation in the Ohana Kitchen & Café project.
> Written for reuse in other projects. Every technique includes the exact code pattern used.

---

## Table of Contents

1. [Core Libraries & Toolchain](#1-core-libraries--toolchain)
2. [Universal Principles](#2-universal-principles)
3. [Hero Section — Scroll-Driven Cinematic Reveal](#3-hero-section--scroll-driven-cinematic-reveal)
4. [Character / Text Reveal (SplitType + GSAP)](#4-character--text-reveal-splittype--gsap)
5. [Scroll-Lit Words (About Manifesto)](#5-scroll-lit-words-about-manifesto)
6. [Sticky Scroll — House Favourites Dish Carousel](#6-sticky-scroll--house-favourites-dish-carousel)
7. [Mouse Parallax on Image](#7-mouse-parallax-on-image)
8. [Animated Price Counter (rAF Lerp)](#8-animated-price-counter-raf-lerp)
9. [3D CSS Carousel (PalateShowcase)](#9-3d-css-carousel-palate-showcase)
10. [Gallery — Horizontal Pan Chapters (Scroll-Scrubbed)](#10-gallery--horizontal-pan-chapters-scroll-scrubbed)
11. [Gallery — Focus-Pull (Nearest-Centre Frame)](#11-gallery--focus-pull-nearest-centre-frame)
12. [Gallery — Scroll-Dot Hint (CSS Keyframe Loop)](#12-gallery--scroll-dot-hint-css-keyframe-loop)
13. [Lenis — Smooth Scroll Setup](#13-lenis--smooth-scroll-setup)
14. [Infinite Marquee Reviews (CSS + JS drag)](#14-infinite-marquee-reviews-css--js-drag)
15. [3D Tilt Card on Mouse Move](#15-3d-tilt-card-on-mouse-move)
16. [Scroll Entrance (ScrollTrigger stagger)](#16-scroll-entrance-scrolltrigger-stagger)
17. [Image Wipe Transition (clipPath)](#17-image-wipe-transition-clippath)
18. [About — Pinned Journey Chapters (Cross-Fade)](#18-about--pinned-journey-chapters-cross-fade)
19. [Cursor-Trailing Dish Preview (rAF Lerp)](#19-cursor-trailing-dish-preview-raf-lerp)
20. [DishTab Indicator (Spring Underline)](#20-dishtab-indicator-spring-underline)
21. [CTA Button Hover (Spring Lift)](#21-cta-button-hover-spring-lift)
22. [Navbar — Animated Mobile Menu (max-height transition)](#22-navbar--animated-mobile-menu-max-height-transition)
23. [Progress Bar (scaleX transform)](#23-progress-bar-scalex-transform)
24. [OhanaExperience — Panel Switch with Wipe](#24-ohanaexperience--panel-switch-with-wipe)
25. [AnimatedCounter (GSAP + ScrollTrigger)](#25-animatedcounter-gsap--scrolltrigger)
26. [Hero Entrance Stagger (page load)](#26-hero-entrance-stagger-page-load)
27. [Background Parallax on Scroll (bgRef zoom-out)](#27-background-parallax-on-scroll-bgref-zoom-out)
28. [Mobile Dish Stage (native scroll-snap)](#28-mobile-dish-stage-native-scroll-snap)
29. [Ghost Word Parallax (mobile)](#29-ghost-word-parallax-mobile)
30. [Ambient Glow Pulse (hfPulse keyframe)](#30-ambient-glow-pulse-hfpulse-keyframe)
31. [Performance Rules — What NOT to Animate](#31-performance-rules--what-not-to-animate)

---

## 1. Core Libraries & Toolchain

| Library | Version | Role |
|---|---|---|
| **GSAP** | 3.x | Timeline, ScrollTrigger, quickSetter, scrub animations |
| **ScrollTrigger** (GSAP plugin) | bundled with GSAP | All scroll-driven animations, pinning |
| **ScrollToPlugin** (GSAP plugin) | bundled with GSAP | Programmatic smooth scroll |
| **SplitType** | standalone | Splits text into `.chars` / `.words` for per-character animation |
| **Lenis** | standalone | Smooth scroll inertia (Gallery + About pages only) |
| **requestAnimationFrame** | native | Low-level lerp loops (mouse parallax, price counter, carousel) |

**Registration pattern** (used in every file that needs ScrollTrigger):

```js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
```

---

## 2. Universal Principles

These rules are applied project-wide and are the primary reason the animations feel smooth:

### GPU-only properties
Only animate properties that the browser can composite on the GPU without causing layout or paint:
- ✅ `transform` (translate, rotate, scale)
- ✅ `opacity`
- ✅ `clipPath`
- ❌ Never animate `filter: blur()` — use `radial-gradient` or `box-shadow` instead
- ❌ Never animate `width`, `height`, `top`, `left`, `margin`

### GSAP context + cleanup
Every `useEffect` that registers a GSAP animation uses `gsap.context()` and returns a cleanup:

```js
useEffect(() => {
  const ctx = gsap.context(() => {
    // all GSAP calls live here
  }, sectionRef); // scope to the section element
  return () => ctx.revert(); // kills all animations on unmount
}, []);
```

### `willChange` on performance-critical elements
Applied to elements that animate every frame (scroll scrubs, mouse parallax):

```jsx
style={{ willChange: 'transform, opacity' }}
```

### Ease vocabulary
| Ease | When used |
|---|---|
| `expo.out` | All reveal animations — fast start, crisp stop |
| `power3.inOut` | Image wipes (OhanaExperience) |
| `power2.out` | Progress bars, counters |
| `cubic-bezier(0.34,1.56,0.64,1)` | Spring effects (DishTab underline, CTA lift) |
| `none` | Scrub animations (scroll is the driver, not easing) |

---

## 3. Hero Section — Scroll-Driven Cinematic Reveal

**File:** [`Hero.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/Hero/Hero.jsx)

The hero is pinned for a multi-viewport scroll range. As the user scrolls, different layers animate in/out based on `progress` (0→1).

### Setup

```js
const st = ScrollTrigger.create({
  trigger: root,
  start: 'top top',
  end: () => window.innerWidth > 700 ? '+=400%' : '+=160%',
  pin: true,
  pinSpacing: true,
  scrub: isMobile ? 0.4 : 1,  // smaller scrub = tighter, more responsive
  anticipatePin: 1,            // prevents flash/jump on pin
  onUpdate: (self) => {
    const p = self.progress; // 0 → 1
    // ... per-frame updates below
  },
});
```

### Key: `scrub` values
- `scrub: 1` — 1 second of lag between scroll and animation (desktop, smooth)
- `scrub: 0.4` — 0.4 second lag (mobile, more responsive)
- `scrub: true` — no lag at all (instant 1:1 with scroll)

### GSAP quickSetter for per-frame updates
Instead of calling `gsap.set()` on every `onUpdate` (expensive), use `quickSetter`:

```js
const setTextOpacity = gsap.quickSetter(textLayer, 'opacity');
const setPanelX = gsap.quickSetter(panel, 'x', 'px');

// Then inside onUpdate (runs every scroll frame):
setTextOpacity(textOpacity);  // zero overhead
setPanelX(40 * (1 - panelT));
```

### Scroll timing bands (constants)

```js
const TEXT_FADE_END  = 0.32; // text fades from 0% to 32% scroll
const PANEL_IN_START = 0.30; // menu panel starts sliding in at 30%
const PANEL_IN_END   = 0.62; // menu panel fully in at 62%
const TITLE_IN_START = 0.38;
const TITLE_IN_END   = 0.72;
const CARDS_IN_START = 0.50;
const CARDS_IN_END   = 0.80;
```

### remap utility

```js
const remap = (p, start, end) =>
  Math.max(0, Math.min((p - start) / (end - start), 1));
// Usage: const t = remap(p, 0.30, 0.62); // 0→1 within the 30–62% window
```

### easing helpers (hand-rolled, no GSAP needed in onUpdate)

```js
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutQuad  = (t) => 1 - Math.pow(1 - t, 2);
```

### Auto-snap (forbidden zone)
If the user is in the "middle" of the pin range (5%–95%), snap them to the nearest stable state:

```js
if (!isSnappingRef.current && p > 0.05 && p < 0.95) {
  if (self.direction === 1) {
    smoothScrollTo(scrollStart + totalRange * 0.95); // snap to menu
  } else {
    smoothScrollTo(scrollStart); // snap back to hero top
  }
}
```

---

## 4. Character / Text Reveal (SplitType + GSAP)

**Files:** [`Gallery.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/Gallery.jsx), [`About.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/About.jsx)

Each headline line is wrapped in an `overflow: hidden` container. Characters are split by SplitType and animate from below the clip.

```jsx
// JSX — the overflow clip is critical:
const lineWrap = { display: 'block', overflow: 'hidden', paddingBottom: '0.1em', marginBottom: '-0.1em' };

<h1>
  <span style={lineWrap}>
    <span ref={el => { lineRefs.current[0] = el; }} style={{ display: 'inline-block' }}>
      Moments,
    </span>
  </span>
</h1>
```

```js
// Animation — runs on mount, once
useEffect(() => {
  const splits = [];
  const ctx = gsap.context(() => {
    lineRefs.current.forEach((lineEl, li) => {
      const split = new SplitType(lineEl, { types: 'chars' });
      splits.push(split);

      // Start: below the clip (yPercent 115%) + slight 3D tilt
      gsap.set(split.chars, {
        yPercent: 115,
        rotateX: -45,
        transformPerspective: 600,
      });

      // Animate in: stagger per character, delay per line
      gsap.to(split.chars, {
        yPercent: 0,
        rotateX: 0,
        duration: 1.15,
        ease: 'expo.out',
        stagger: 0.024,         // 24ms between each character
        delay: 0.25 + li * 0.15, // each line starts 150ms after the last
      });
    });
  }, sectionRef);

  return () => { ctx.revert(); splits.forEach(s => s.revert()); };
}, []);
```

**Why `overflow: hidden` on the parent?** The characters start at `yPercent: 115` (below the baseline). The hidden overflow clips them so they "emerge" from the line, not float in from below the visible area.

---

## 5. Scroll-Lit Words (About Manifesto)

**File:** [`About.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/About.jsx)

Words animate from `opacity: 0.12` to `opacity: 1` as the section scrolls, creating a "reading by torch" effect. The section is `230vh` tall with the content stuck at `position: sticky`.

```js
// Split words (not chars — one opacity change per word)
split = new SplitType(paraRef.current, { types: 'words' });
gsap.set(split.words, { opacity: 0.12 }); // barely visible, not invisible

const anim = gsap.to(split.words, {
  opacity: 1,
  ease: 'none',       // linear — scroll is the easing
  duration: 1,
  stagger: 0.6,       // large stagger = words light up sequentially
});

ScrollTrigger.create({
  trigger: sectionRef.current,
  start: 'top top',
  end: 'bottom bottom',
  scrub: 1,
  animation: anim,    // scrub drives the entire timeline
});
```

```jsx
// JSX — the sticky wrapper
<section style={{ position: 'relative', height: '230vh' }}>
  <div style={{ position: 'sticky', top: 0, height: '100svh',
    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <p ref={paraRef}>...</p>
  </div>
</section>
```

---

## 6. Sticky Scroll — House Favourites Dish Carousel

**File:** [`Housefavourites.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/Housefavourites.jsx)

One of the most complex animations. The outer `wrapRef` is `N * 100vh` tall (N = number of dishes). The inner `stickyRef` is `position: sticky; top: 0; height: 100vh`. As the user scrolls through the outer height, `ScrollTrigger.progress` (0→1) is snapped to the nearest dish index.

```js
// Setup
wrap.style.height = `${TOTAL * 100}vh`; // e.g., 500vh for 5 dishes

const resolveSnap = (progress) => {
  const inner = Math.max(0, Math.min(1, (progress - 0.03) / 0.94));
  // 3% deadzone at start/end for clean entry/exit
  return Math.max(0, Math.min(TOTAL - 1, Math.round(inner * (TOTAL - 1))));
};

ScrollTrigger.create({
  trigger: wrap,
  start: 'top top',
  end: 'bottom bottom',
  pin: sticky,
  pinSpacing: false,  // no extra space — the wrap's own height is the spacer
  anticipatePin: 1,
  onUpdate: self => {
    const snap = resolveSnap(self.progress);
    triggerDishTransition(snap); // swap content
  },
});
```

### Dish Transition (no out-animation approach)

The key design decision: **instantly zero the old content, then animate in the new content.** This avoids "reverse exit" ugliness.

```js
const triggerDishTransition = useCallback((idx) => {
  if (idx === activeRef.current) return;
  activeRef.current = idx;

  const tl = gsap.timeline();
  tlRef.current = tl;

  // 1. Instantly hide everything (no out animation)
  tl.set([imgRef.current, bgWordRef.current, ...allTextEls], { opacity: 0 });
  tl.set([...allTextEls], { y: 16 });
  tl.set(bgWordRef.current, { x: 20 });

  // 2. React re-renders at time 0 (image src swap)
  tl.call(() => { setActive(idx); }, [], 0);

  // 3. Small pause for React to commit the new src
  tl.set({}, {}, '+=0.055');

  // 4. Image slides in from slight offset
  tl.set(imgRef.current, { x: '-28px', scale: 0.97 });
  tl.to(imgRef.current, { opacity: 1, x: 0, scale: 1, duration: 0.82, ease: 'expo.out' });

  // 5. Text cascade in (each element starts slightly after the previous)
  tl.to(bgWordRef.current,  { opacity: 1, x: 0, duration: 0.78, ease: 'expo.out' }, '<0.04');
  tl.to(nameRef.current,    { opacity: 1, y: 0, duration: 0.68, ease: 'expo.out' }, '<0.06');
  tl.to(tagRef.current,     { opacity: 1, y: 0, duration: 0.52, ease: 'expo.out' }, '<0.04');
  tl.to(taglineRef.current, { opacity: 1, y: 0, duration: 0.60, ease: 'expo.out' }, '<0.04');
  tl.to(subRef.current,     { opacity: 1, y: 0, duration: 0.52, ease: 'expo.out' }, '<0.04');
  tl.to(priceEl,            { opacity: 1, y: 0, duration: 0.58, ease: 'expo.out' }, '<0.05');
  tl.to(ctaRef.current,     { opacity: 1, y: 0, duration: 0.52, ease: 'expo.out' }, '<0.04');
}, []);
```

**`'<0.04'`** means "start 40ms after the previous animation began" (relative position label in GSAP timelines).

---

## 7. Mouse Parallax on Image

**File:** [`Housefavourites.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/Housefavourites.jsx)

The dish image tilts in 3D and the background ghost word moves opposite to the cursor, creating depth.

```js
const LERP = 0.055; // Interpolation factor — lower = more lag = more "floating"
const mouseRef = useRef({ tx: 0, ty: 0, cx: 0, cy: 0 });
// tx/ty = target (cursor position), cx/cy = current (lerped)

const onMove = e => {
  const r = sticky.getBoundingClientRect();
  mouseRef.current.tx = ((e.clientX - r.left) / r.width  - 0.5) * 2; // -1 to 1
  mouseRef.current.ty = ((e.clientY - r.top)  / r.height - 0.5) * 2; // -1 to 1
};

const tick = () => {
  const m = mouseRef.current;
  // Lerp: current eases toward target each frame
  m.cx += (m.tx - m.cx) * LERP;
  m.cy += (m.ty - m.cy) * LERP;

  // Apply to image — perspective tilt + translate
  imgRef.current.style.transform =
    `perspective(1800px) rotateX(${-m.cy * 5}deg) rotateY(${m.cx * 8}deg) ` +
    `translateX(${m.cx * 10}px) translateY(${m.cy * 6}px)`;

  // Apply to bg word — opposite direction for parallax depth
  bgWordRef.current.style.transform =
    `translateX(${m.cx * -18}px) translateY(${m.cy * -8}px)`;

  rafRef.current = requestAnimationFrame(tick);
};

rafRef.current = requestAnimationFrame(tick);
```

**Key:** Write transforms directly to `element.style.transform` in the rAF loop — never use `gsap.set()` in a tight rAF loop (scheduling overhead). Use GSAP only for one-shot or timeline animations.

---

## 8. Animated Price Counter (rAF Lerp)

**File:** [`Housefavourites.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/Housefavourites.jsx)

Counts up/down from the old price to the new price in ~420ms using an ease-in-out quad.

```js
function PriceCounter({ value, color }) {
  const ref = useRef(null);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) { prev.current = value; return; }
    const start = prev.current, end = value, dur = 420, t0 = performance.now();

    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      // Ease-in-out quad: smooth acceleration + deceleration
      const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      if (ref.current) ref.current.textContent = '₹' + Math.round(start + (end - start) * e);
      if (p < 1) requestAnimationFrame(tick);
      else { ref.current.textContent = '₹' + end; prev.current = end; }
    };

    requestAnimationFrame(tick);
    prev.current = value;
  }, [value]);

  return <span ref={ref}>₹{value}</span>;
}
```

---

## 9. 3D CSS Carousel (Palate Showcase)

**File:** [`PalateShowcase.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/PalateShowcase.jsx), [`PalateShowcase.css`](file:///e:/websites/ohana%20-%20Copy/src/components/PalateShowcase.css)

A true CSS 3D carousel: each card is placed at `rotateY(angle) translateZ(radius)` around a central hub. The hub is rotated via a rAF lerp loop.

### CSS setup

```css
.ps-root {
  perspective: 1700px;
  perspective-origin: 50% 42%;
}
.ps-stage {
  transform-style: preserve-3d;
}
.ps-carousel {
  transform-style: preserve-3d;
  will-change: transform;
}
.ps-card {
  /* Each card positioned in 3D space */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
```

### Card placement

```jsx
// N cards, evenly spaced around 360°
const CARD_ANGLE = 360 / N;

{categories.map((cat, i) => (
  <div
    style={{
      transform: `rotateY(${i * CARD_ANGLE}deg) translateZ(430px)`,
      // Each card pushed 430px along its own Z axis → forms a circle
    }}
  />
))}
```

### The animation loop

```js
const tick = () => {
  // 1. Auto-spin
  if (autoSpin.current && !isDragging.current) {
    targetAngle.current -= 0.018; // degrees per frame
  }

  // 2. Momentum after drag
  if (!isDragging.current && Math.abs(lastVelocity.current) > 0.01) {
    targetAngle.current += lastVelocity.current;
    lastVelocity.current *= 0.94; // decay
  }

  // 3. Lerp current toward target (0.07 = smooth but responsive)
  currentAngle.current += (targetAngle.current - currentAngle.current) * 0.07;

  // 4. Apply to DOM
  carouselRef.current.style.transform = `rotateY(${currentAngle.current}deg)`;

  rafRef.current = requestAnimationFrame(tick);
};
```

### Drag interaction

```js
const onPointerDown = (e) => {
  isDragging.current = true;
  autoSpin.current = false;
  dragStart.current = e.clientX;
  dragAngleStart.current = targetAngle.current;
  lastVelocity.current = 0;
  e.currentTarget.setPointerCapture(e.pointerId); // keeps tracking outside element
};

const onPointerMove = (e) => {
  if (!isDragging.current) return;
  const x = e.clientX;
  const delta = x - dragStart.current;
  targetAngle.current = dragAngleStart.current + delta * 0.28; // sensitivity
  lastVelocity.current = (x - lastDragX.current) * 0.28;
  lastDragX.current = x;
};
```

---

## 10. Gallery — Horizontal Pan Chapters (Scroll-Scrubbed)

**File:** [`Gallery.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/Gallery.jsx)

Each chapter (`PanChapter`) is a tall section (`N * 70 + 100 vh`). The inner content is sticky (`position: sticky; height: 100svh`). A horizontal track of images is translated on X by the scroll driver.

```js
const maxX = () => Math.max(0, track.scrollWidth - window.innerWidth);

const stBase = {
  trigger: containerRef.current,
  start: 'top top',
  end: 'bottom bottom',
  scrub: true,          // instant 1:1 scrub
  invalidateOnRefresh: true, // recalculates maxX on window resize
};

// Alternate direction per chapter (zigzag)
const reverse = ci % 2 === 1;

gsap.fromTo(track,
  { x: () => (reverse ? -maxX() : 0) },
  { x: () => (reverse ? 0 : -maxX()), ease: 'none', scrollTrigger: { ...stBase, onUpdate: updateFocus } }
);
```

### Inner image counter-parallax (depth illusion)

Each image container is slightly wider than the frame (`left: -10%; width: 120%`). The inner image moves in the opposite direction of the track, creating a parallax depth:

```js
frames.forEach((f) => {
  gsap.fromTo(f.querySelector('.gl-pan-par'),
    { xPercent: reverse ? -8 : 8 },
    { xPercent: reverse ? 8 : -8, ease: 'none', scrollTrigger: stBase }
  );
});
```

---

## 11. Gallery — Focus-Pull (Nearest-Centre Frame)

**File:** [`Gallery.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/Gallery.jsx)

As the track pans, the frame closest to the horizontal centre of the viewport gets full colour and scale 1.0. Other frames are desaturated and slightly scaled down.

```js
const updateFocus = () => {
  const mid = window.innerWidth / 2;
  frames.forEach((f, i) => {
    const r = f.getBoundingClientRect();
    const c = r.left + r.width / 2;
    // d = 0 at centre, 1 at 55% of viewport away from centre
    const d = Math.min(1, Math.abs(c - mid) / (window.innerWidth * 0.55));
    colors[i].style.opacity = String(1 - d);      // colour layer fades in when centred
    scales[i].style.transform = `scale(${1 - d * 0.06})`; // 6% scale difference
  });
};
// updateFocus is called in the scrollTrigger's onUpdate callback
```

### The two-image trick (desaturate + colour overlay)

```jsx
<div>
  {/* Base layer — always desaturated */}
  <img style={{ filter: 'saturate(0.35) brightness(0.85)' }} src={item.src} />
  {/* Colour layer — opacity controlled by focus */}
  <img className="gl-color" style={{ position: 'absolute', inset: 0, opacity: 0 }} src={item.src} />
</div>
```

> **Why not animate `filter: saturate`?** Animating `filter` triggers a repaint on every frame. Animating `opacity` on a second identical image is GPU composited — zero repaint cost.

---

## 12. Gallery — Scroll-Dot Hint (CSS Keyframe Loop)

**File:** [`Gallery.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/Gallery.jsx)

A 4px dot travels down a thin vertical line, fading in and out. Pure CSS — no JS.

```css
@keyframes glHintDot {
  0%   { transform: translateY(0);    opacity: 0; }
  18%  { opacity: 1; }
  82%  { opacity: 1; }
  100% { transform: translateY(52px); opacity: 0; }
}
.gl-hint-dot {
  animation: glHintDot 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}
```

```jsx
<div style={{ position: 'relative', width: '1px', height: '56px',
  background: 'rgba(182,145,46,0.28)', overflow: 'hidden' }}>
  <span className="gl-hint-dot" style={{
    position: 'absolute', top: 0, left: '-1.5px',
    width: '4px', height: '4px', borderRadius: '50%',
    background: '#96721F',
  }} />
</div>
```

---

## 13. Lenis — Smooth Scroll Setup

**File:** [`Gallery.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/Gallery.jsx), [`About.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/About.jsx)

Lenis is added **only on pages that need it** (Gallery, About). It's connected to GSAP's ticker so ScrollTrigger sees consistent scroll values.

```js
useEffect(() => {
  const instance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out easing
    smoothTouch: false,    // native on mobile
    touchMultiplier: 2,
  });

  // Bridge Lenis → ScrollTrigger
  instance.on('scroll', ScrollTrigger.update);
  const rafCb = (time) => instance.raf(time * 1000); // GSAP ticker gives seconds
  gsap.ticker.add(rafCb);
  gsap.ticker.lagSmoothing(0); // disable GSAP's own lag compensation — Lenis handles it

  return () => {
    gsap.ticker.remove(rafCb);
    instance.destroy();
  };
}, []);
```

---

## 14. Infinite Marquee Reviews (CSS + JS drag)

**File:** [`Home.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/Home.jsx)

Two rows of review cards scroll continuously in opposite directions using CSS animations. The array is **doubled** so it loops seamlessly.

```js
// Double the array — when the first half scrolls off, the second half is identical
const row1 = [...REVIEWS, ...REVIEWS];
const row2 = [...shifted, ...shifted];
```

```css
@keyframes tr-scroll-left {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); } /* -50% = first copy gone, second copy takes its place */
}
@keyframes tr-scroll-right {
  0%   { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}

/* Pause on hover */
.reviews-scroll-container:hover .tr-row {
  animation-play-state: paused !important;
}
```

```jsx
<div style={{ animation: 'tr-scroll-left 40s linear infinite' }}>
  {row1.map((r, i) => <ReviewCard key={i} review={r} />)}
</div>
```

### Drag to scroll

The container is `overflow-x: auto` with hidden scrollbar. Drag events shift `scrollLeft` directly:

```js
onMouseDown={(e) => {
  el.isDown = true;
  el.startX = e.pageX - el.offsetLeft;
  el.scrollLeftVal = el.scrollLeft;
}}
onMouseMove={(e) => {
  if (!el.isDown) return;
  e.preventDefault();
  const x = e.pageX - el.offsetLeft;
  el.scrollLeft = el.scrollLeftVal - (x - el.startX) * 1.5;
}}
```

---

## 15. 3D Tilt Card on Mouse Move

**File:** [`Home.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/Home.jsx) (`ReviewCard`)

On hover, review cards tilt in 3D space and cast a dynamic shadow based on cursor position.

```js
const handleMouseMove = (e) => {
  const rect = cardRef.current.getBoundingClientRect();
  // Normalised cursor position: -0.5 to 0.5
  const x = (e.clientX - rect.left) / rect.width  - 0.5;
  const y = (e.clientY - rect.top)  / rect.height - 0.5;

  cardRef.current.style.transform =
    `perspective(800px) rotateX(${-y * 14}deg) rotateY(${x * 14}deg) scale(1.04)`;
  cardRef.current.style.boxShadow =
    `${-x * 20}px ${-y * 20}px 60px rgba(22,59,131,0.16), 0 0 40px rgba(182,145,46,0.10)`;
};

const handleMouseLeave = () => {
  cardRef.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
  cardRef.current.style.boxShadow = '0 10px 30px rgba(22,59,131,0.10)';
};
```

```jsx
<div
  ref={cardRef}
  onMouseMove={handleMouseMove}
  onMouseLeave={handleMouseLeave}
  style={{
    transition: 'transform 0.15s ease, box-shadow 0.15s ease', // smooth return
    willChange: 'transform',
  }}
/>
```

---

## 16. Scroll Entrance (ScrollTrigger stagger)

**Files:** [`Home.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/Home.jsx), [`Gallery.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/Gallery.jsx), [`About.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/About.jsx)

The most commonly used animation pattern. Elements start hidden, animate in when the section scrolls into view. `once: true` means it never replays.

```js
useEffect(() => {
  const ctx = gsap.context(() => {
    // For multiple elements by class name:
    const els = sectionRef.current.querySelectorAll('.oe-reveal');
    gsap.set(els, { opacity: 0, y: 40 });

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 78%',  // fires when section top reaches 78% down the viewport
      once: true,
      onEnter: () => gsap.to(els, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.12,  // 120ms between each element
      }),
    });
  }, sectionRef);
  return () => ctx.revert();
}, []);
```

### Staggered timeline variant (Story Section)

When elements need different durations/eases:

```js
const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
tl.to(headRef.current,  { opacity: 1, y: 0, duration: 1.1 }, 0)
  .to(imgRef.current,   { opacity: 1, y: 0, duration: 1.0 }, 0.12)
  .to(bodyRef.current,  { opacity: 1, y: 0, duration: 0.9 }, 0.22)
  .to(pillsRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.34);
// Second parameter is start time (absolute seconds from timeline start)
```

---

## 17. Image Wipe Transition (clipPath)

**File:** [`OhanaExperience.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/OhanaExperience.jsx)

When switching experience panels, the new image wipes in from left to right using `clipPath: inset()`.

```js
// Setup: load new image into hidden layer
imgRevealRef.current.style.backgroundImage = `url(${next.image})`;
gsap.set(imgRevealRef.current, { clipPath: 'inset(0 100% 0 0)' }); // fully hidden (right side)

// Fade out text
gsap.to(textEls, { opacity: 0, y: -12, duration: 0.25, ease: 'power2.in', stagger: 0.03 });

// Wipe the new image in
gsap.to(imgRevealRef.current, {
  clipPath: 'inset(0 0% 0 0)', // fully visible
  duration: 0.9,
  ease: 'power3.inOut',
  delay: 0.12,
  onComplete: () => {
    // Swap: set current image to new, hide reveal layer
    imgCurrentRef.current.style.backgroundImage = `url(${next.image})`;
    gsap.set(imgRevealRef.current, { clipPath: 'inset(0 100% 0 0)' });

    // Fade text back in
    gsap.fromTo(textEls,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.04 }
    );
  },
});
```

```jsx
{/* Two stacked div layers for the wipe */}
<div ref={imgCurrentRef} style={{ position: 'absolute', inset: 0,
  backgroundImage: `url(${exp.image})`, backgroundSize: 'cover' }} />
<div ref={imgRevealRef} style={{ position: 'absolute', inset: 0,
  backgroundSize: 'cover', clipPath: 'inset(0 100% 0 0)' }} />
```

---

## 18. About — Pinned Journey Chapters (Cross-Fade)

**File:** [`About.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/About.jsx)

4 fullscreen chapters are stacked at `position: absolute; inset: 0`. The section is `N * 100vh + spacer`. A single GSAP timeline drives the cross-fade sequence, scrubbed by scroll.

```js
const tl = gsap.timeline({
  defaults: { ease: 'none' },
  scrollTrigger: {
    trigger: sectionRef.current,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
  },
});

chapters.forEach((_, i) => {
  // Background photo: slow zoom from 1.12x to 1.0x while active
  tl.fromTo(bgRefs.current[i], { scale: 1.12 }, { scale: 1, duration: 1 }, i);

  // Year numeral: parallax at its own speed (top to bottom)
  tl.fromTo(numRefs.current[i], { yPercent: 14 }, { yPercent: -14, duration: 1 }, i);

  // Incoming chapter: rises from below + fades in
  if (i > 0) tl.fromTo(layerRefs.current[i],
    { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45 }, i);

  // Outgoing chapter: drifts up + fades out
  if (i < N - 1) tl.to(layerRefs.current[i],
    { opacity: 0, y: -40, duration: 0.45 }, i + 1);
});
```

---

## 19. Cursor-Trailing Dish Preview (rAF Lerp)

**File:** [`Hero.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/Hero/Hero.jsx)

On the desktop menu panel, a floating dish image follows the cursor with lag, slight rotation based on velocity.

```js
const pos = { x: 0, y: 0, tx: 0, ty: 0, rot: 0 };

const tick = () => {
  const dx = pos.tx - pos.x;
  pos.x += dx * 0.12;                        // lerp X with lag
  pos.y += (pos.ty - pos.y) * 0.12;          // lerp Y with lag
  const targetRot = Math.max(-8, Math.min(8, dx * 0.12)); // rotation from velocity
  pos.rot += (targetRot - pos.rot) * 0.08;   // lerp rotation

  preview.style.transform =
    `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -62%) rotate(${pos.rot}deg)`;

  raf = requestAnimationFrame(tick);
};

const onMove = (e) => {
  const r = panel.getBoundingClientRect();
  pos.tx = e.clientX - r.left;
  pos.ty = e.clientY - r.top;
  if (!running) { pos.x = pos.tx; pos.y = pos.ty; running = true; raf = requestAnimationFrame(tick); }
};
```

### Show / hide with GSAP (separate from the rAF loop)

```js
// Show (expo.out = fast pop in)
gsap.to(inner, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out', overwrite: 'auto' });

// Hide
gsap.to(inner, { opacity: 0, scale: 0.85, duration: 0.3, ease: 'power2.in', overwrite: 'auto' });

// Image swap (flash → new src → fade in)
gsap.timeline()
  .to(img, { opacity: 0, scale: 0.9, duration: 0.14, ease: 'power2.in',
    onComplete: () => { img.src = src; } })
  .to(img, { opacity: 1, scale: 1, duration: 0.38, ease: 'expo.out' });
```

---

## 20. DishTab Indicator (Spring Underline)

**File:** [`Housefavourites.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/Housefavourites.jsx)

The active tab shows a coloured underline that stretches in with a spring overshoot effect.

```jsx
<span style={{
  position: 'absolute',
  bottom: '5px', left: '50%',
  transform: `translateX(-50%) scaleX(${isActive ? 1 : 0})`,
  width: '70%', height: '1px',
  background: accent,
  boxShadow: isActive ? `0 0 8px ${accent}` : 'none',
  transformOrigin: 'center',
  // cubic-bezier(0.34, 1.56, 0.64, 1) — spring with overshoot
  transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), background 0.5s, box-shadow 0.5s',
}} />
```

`cubic-bezier(0.34, 1.56, 0.64, 1)` is the spring curve: it goes past `1` (overshoot) and settles back — no library needed, pure CSS.

---

## 21. CTA Button Hover (Spring Lift)

**File:** [`Housefavourites.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/Housefavourites.jsx)

On hover, the button lifts up and a gradient overlay fades in.

```jsx
<button
  onMouseEnter={() => setHov(true)}
  onMouseLeave={() => setHov(false)}
  style={{
    transition: 'all 0.38s cubic-bezier(0.34,1.56,0.64,1)',
    transform: hov ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: hov ? '0 10px 30px rgba(22,59,131,0.18)' : 'none',
  }}
>
  {/* Inner gradient overlay that fades in */}
  <span style={{
    position: 'absolute', inset: 0,
    background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
    opacity: hov ? 1 : 0,
    transition: 'opacity 0.3s ease',
    borderRadius: '100px',
  }} />
  {/* Arrow that slides right on hover */}
  <span style={{
    transform: hov ? 'translateX(5px)' : 'translateX(0)',
    transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
  }}>→</span>
</button>
```

---

## 22. Navbar — Animated Mobile Menu (max-height transition)

**File:** [`Navbar.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/Navbar.jsx)

The dropdown uses `max-height` + `opacity` + `margin-top` transitions. `max-height` allows CSS to handle height animation without JS, at the cost of needing a high enough max value.

```jsx
<div className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
  ${menuOpen
    ? 'max-h-[600px] border-black/15 opacity-100 mt-2'
    : 'max-h-0 border-transparent opacity-0 mt-0'}`}
>
```

### Scroll-aware solid background

```js
useEffect(() => {
  let rafId = null;
  const handleScroll = () => {
    if (rafId) return; // throttle: one update per animation frame
    rafId = requestAnimationFrame(() => {
      setSolid(window.scrollY > 80 || location.pathname !== '/');
      rafId = null;
    });
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, [location.pathname]);
```

### Nav link hover underline

```jsx
<span className={`absolute left-0 -bottom-1 h-[2px] bg-[#E52C98]
  transition-all duration-300
  ${active ? 'w-full' : 'w-0 group-hover:w-full'}`}
/>
```

---

## 23. Progress Bar (scaleX transform)

**Files:** [`Housefavourites.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/Housefavourites.jsx), [`Gallery.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/Gallery.jsx)

A thin 2px line at the top/bottom of sections that fills as the user progresses. Always uses `scaleX` on a full-width element (not `width` animation — `scaleX` is GPU only).

```jsx
{/* Container */}
<div style={{ position: 'absolute', top: 0, left: 0, right: 0,
  height: '2px', background: 'rgba(22,59,131,0.08)' }}>
  {/* Fill bar */}
  <div ref={progressRef} style={{
    height: '100%',
    background: 'linear-gradient(90deg, #C42D78, #B6912E)',
    transform: 'scaleX(0)',
    transformOrigin: 'left', // grows from the left
    willChange: 'transform',
  }} />
</div>
```

```js
// Updated in onUpdate:
progressRef.current.style.transform = `scaleX(${self.progress})`;
// or for chapter progress in Gallery:
gsap.fromTo(fillRef.current, { scaleX: 0 }, {
  scaleX: 1, ease: 'none', transformOrigin: 'left center',
  scrollTrigger: stBase,
});
```

---

## 24. OhanaExperience — Panel Switch with Wipe

See [Section 17 — Image Wipe Transition](#17-image-wipe-transition-clippath) for the image wipe. Additionally, the nav items have CSS-only active states:

```jsx
{/* Sliding accent line on the left of active item */}
<div style={{
  position: 'absolute', left: '-28px', top: '50%',
  transform: 'translateY(-50%)',
  width: idx === active ? '18px' : '0px', // collapses when not active
  height: '2px',
  background: item.accent,
  transition: 'width 0.35s cubic-bezier(0.34,1.56,0.64,1)',
}} />

{/* Thumbnail preview that expands */}
<div style={{
  width: idx === active ? '50px' : '0px',
  transition: 'width 0.45s cubic-bezier(0.34,1.56,0.64,1)',
  backgroundImage: `url(${item.image})`,
}} />
```

---

## 25. AnimatedCounter (GSAP + ScrollTrigger)

**File:** [`About.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/About.jsx)

Stats count from 0 to their value when scrolled into view. Uses GSAP's `onUpdate` to write values to the DOM.

```js
function AnimatedCounter({ value, suffix = '', duration = 2 }) {
  const ref = useRef(null);
  const hasAnimated = useRef(false); // run once only

  useEffect(() => {
    const num = parseFloat(value);
    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;
        gsap.to(obj, {
          val: num,
          duration,
          ease: 'power2.out',
          onUpdate: () => { ref.current.textContent = Math.round(obj.val) + suffix; },
        });
      },
    });
  }, [value]);

  return <span ref={ref}>0{suffix}</span>;
}
```

---

## 26. Hero Entrance Stagger (page load)

**File:** [`Hero.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/Hero/Hero.jsx)

On page load, hero elements animate in from below in a carefully timed sequence. Each element has its own delay and duration, hand-tuned so the most important content (headline) arrives first.

```js
// Set all to invisible first
gsap.set([eyebrow, headlineL1, headlineL2, headlineL3, para, ctas, catBar,
  stamp, flourish, hint], { opacity: 0, y: 18 });
gsap.set(statsBar, { opacity: 0, y: 8 });

// Staggered timeline
gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 })
  .to(eyebrow,    { opacity: 1, y: 0, duration: 0.65 }, 0.00)
  .to(headlineL1, { opacity: 1, y: 0, duration: 0.85 }, 0.12)
  .to(headlineL2, { opacity: 1, y: 0, duration: 0.85 }, 0.22)
  .to(headlineL3, { opacity: 1, y: 0, duration: 0.85 }, 0.30)
  .to(stamp,      { opacity: 1, y: 0, duration: 0.75 }, 0.28)
  .to(flourish,   { opacity: 1, y: 0, duration: 0.75 }, 0.34)
  .to(para,       { opacity: 1, y: 0, duration: 0.65 }, 0.44)
  .to(ctas,       { opacity: 1, y: 0, duration: 0.65 }, 0.52)
  .to(catBar,     { opacity: 1, y: 0, duration: 0.60 }, 0.58)
  .to(statsBar,   { opacity: 1, y: 0, duration: 0.60 }, 0.62)
  .to(hint,       { opacity: 1, y: 0, duration: 0.50 }, 0.66);
```

---

## 27. Background Parallax on Scroll (bgRef zoom-out)

**Files:** [`Gallery.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/Gallery.jsx), [`About.jsx`](file:///e:/websites/ohana%20-%20Copy/src/pages/About.jsx)

Hero background images start slightly zoomed in and scale back to 1.0 as the user scrolls down, then drift upward.

```js
// bgRef wraps the <img> — it starts at scale 1.18 (zoomed in)
gsap.fromTo(bgRef.current,
  { scale: 1.18, yPercent: 0 },
  {
    scale: 1,
    yPercent: 7,  // drifts up by 7%
    ease: 'none',
    scrollTrigger: {
      trigger: sectionRef.current,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
    },
  }
);

// Content layer fades and drifts up too (parallax)
gsap.to(contentRef.current, {
  yPercent: -12,
  opacity: 0.25,
  ease: 'none',
  scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: 1 },
});
```

---

## 28. Mobile Dish Stage (native scroll-snap)

**File:** [`Hero.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/Hero/Hero.jsx)

On mobile, categories are swiped through using native browser scroll-snap (no JS velocity math needed).

```css
/* Scroller — the only moving part */
.oh4-mstage-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;   /* snap to each slide */
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

/* Each slide */
.oh4-mstage-slide {
  scroll-snap-align: center;       /* snaps to the centre of the viewport */
  width: 76%;
  flex-shrink: 0;
}
```

```js
// Reading the active index from scroll position (rAF-throttled)
const onStageScroll = () => {
  if (mScrollRaf.current) return;
  mScrollRaf.current = requestAnimationFrame(() => {
    mScrollRaf.current = 0;
    const step = mStageRef.current.clientWidth * 0.76; // slide width
    const idx = Math.round(mScrollerRef.current.scrollLeft / step);
    setMIdx(idx);
  });
};
```

---

## 29. Ghost Word Parallax (mobile)

**File:** [`Hero.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/Hero/Hero.jsx)

The large outlined category word behind the dish slides at 35% of the scroll offset, creating depth:

```js
// Inside the scroll listener (onStageScroll):
if (mGhostRef.current) {
  // Ghost trails at 35% of offset from active slide centre
  mGhostRef.current.style.transform =
    `translateX(${-(sc.scrollLeft - idx * step) * 0.35}px)`;
}
```

---

## 30. Ambient Glow Pulse (hfPulse keyframe)

**File:** [`Housefavourites.jsx`](file:///e:/websites/ohana%20-%20Copy/src/components/Housefavourites.jsx)

Subtle breathing animation on the scroll/swipe hint. Purely CSS.

```css
@keyframes hfPulse {
  0%, 100% { opacity: 0.3; transform: scaleY(0.8); }
  50%       { opacity: 1;   transform: scaleY(1);   }
}
```

```jsx
<div style={{
  width: '1px', height: '22px',
  background: 'linear-gradient(to bottom, rgba(22,59,131,0.25), transparent)',
  animation: 'hfPulse 2.2s ease-in-out infinite',
}} />
```

---

## 31. Performance Rules — What NOT to Animate

These are explicit decisions made in this codebase with comments explaining why:

### ❌ `filter: blur()` — never use for animated glows
```js
// BAD — triggers repaint every frame:
filter: blur(40px)

// GOOD — radial-gradient is GPU-composited:
background: 'radial-gradient(ellipse, rgba(182,145,46,0.14) 0%, transparent 60%)'
```

### ❌ `backdropFilter` — avoid where possible
```js
// BAD — forces a separate composite layer + repaint:
backdropFilter: 'blur(12px)'

// GOOD — solid semi-transparent background:
background: 'rgba(255,255,255,0.85)'
```

### ❌ Animating `width` / `height` for underlines/bars
```js
// BAD — causes layout recalculation:
width: isActive ? '100%' : '0%'

// GOOD — only transform is composited:
transform: `scaleX(${isActive ? 1 : 0})`
transformOrigin: 'left center'
```

### ❌ `gsap.set()` inside tight rAF loops
```js
// BAD — GSAP scheduling overhead on every frame:
rafRef.current = requestAnimationFrame(() => {
  gsap.set(el, { x: pos.x }); // ❌
});

// GOOD — write directly to style:
rafRef.current = requestAnimationFrame(() => {
  el.style.transform = `translateX(${pos.x}px)`; // ✅
});
```

### ✅ Use `gsap.quickSetter` for per-frame GSAP updates
```js
// Correct when you must use GSAP in onUpdate:
const setOpacity = gsap.quickSetter(element, 'opacity');
// Then in onUpdate:
setOpacity(value); // much lower overhead than gsap.set()
```

### ✅ `willChange: 'transform'` on scroll-driven elements
```jsx
// Add to elements animated on every scroll frame:
<div style={{ willChange: 'transform, opacity' }} />
```

### ✅ `{ passive: true }` on all scroll/touch listeners
```js
window.addEventListener('scroll', handler, { passive: true });
el.addEventListener('touchstart', handler, { passive: true });
```

---

## Quick Reference: Common Animation Patterns

| Pattern | Duration | Ease | Delay strategy |
|---|---|---|---|
| Section heading reveal | `1.1s` | `expo.out` | `once: true` ScrollTrigger |
| Char reveal per line | `1.15s` | `expo.out` | `stagger: 0.024`, `delay: 0.25 + li * 0.15` |
| Image swap (in) | `0.82s` | `expo.out` | After React re-render (~55ms) |
| Text cascade (in) | `0.52–0.78s` | `expo.out` | `'<0.04'` per element |
| Image wipe | `0.9s` | `power3.inOut` | `delay: 0.12` after text fades |
| Counter (scroll-lit) | `0.25–0.6s` | `power2.in/out` | On `onComplete` of wipe |
| Spring underline | `0.4s` | `cubic-bezier(0.34,1.56,0.64,1)` | CSS `transition` only |
| Button lift | `0.38s` | `cubic-bezier(0.34,1.56,0.64,1)` | CSS `transition` only |
| Background zoom-out | `scrub: 1` | `none` (scroll driver) | — |
| Infinite marquee | `40s / 48s` | `linear` | CSS `animation` |
| Mouse parallax lag | `LERP: 0.055` | rAF lerp | — |
| Cursor preview lag | `0.12` per axis | rAF lerp | — |

---

*Document generated from the Ohana Kitchen & Café codebase — September 2026.*

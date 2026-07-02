---
name: Makhzani
description: Multi-tenant inventory management for Arabic/English small businesses — a calm control room for stock, batches, and expiry.
colors:
  midnight-slate: "#0E2938"
  slate-deep: "#06141C"
  slate-light: "#183F54"
  steel-accent: "#2A6F97"
  live-cyan: "#06B6D4"
  cyan-ink: "#22D3EE"
  paper-bg: "#F4F7F9"
  surface-white: "#FFFFFF"
  surface-alt: "#F8FAFC"
  surface-strong: "#E2E8F0"
  ink: "#0F172A"
  ink-muted: "#64748B"
  night-bg: "#070B11"
  night-surface: "#0E1622"
  night-surface-alt: "#121C2B"
  night-ink: "#F1F5F9"
  night-ink-muted: "#94A3B8"
  success: "#10B981"
  warning: "#F59E0B"
  danger: "#F43F5E"
  info: "#0EA5E9"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Noto Kufi Arabic, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Plus Jakarta Sans, Noto Kufi Arabic, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Plus Jakarta Sans, Noto Kufi Arabic, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Plus Jakarta Sans, Noto Kufi Arabic, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Plus Jakarta Sans, Noto Kufi Arabic, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.01em"
  overline:
    fontFamily: "Plus Jakarta Sans, Noto Kufi Arabic, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  pill: "9999px"
spacing:
  "1": "8px"
  "2": "16px"
  "3": "24px"
  "4": "32px"
  "5": "48px"
  "6": "64px"
components:
  button-primary:
    backgroundColor: "{colors.midnight-slate}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.slate-light}"
    textColor: "{colors.surface-white}"
  button-secondary:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    height: "48px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    height: "48px"
  button-danger:
    backgroundColor: "#FEE9EC"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    height: "48px"
  card:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "14px 20px"
    height: "48px"
  table-header:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.overline}"
    padding: "16px 24px"
  nav-item-active:
    backgroundColor: "rgba(6,182,212,0.12)"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "14px 20px"
---

# Design System: Makhzani

## 1. Overview

**Creative North Star: "The Calm Control Room"**

Makhzani is the console a small business runs its stock from. The chassis is deep, quiet slate; the data is the light. A single Live Cyan carries every signal — the current view, the active row, the thing that needs attention — against dark surfaces that never compete with the numbers. Nothing glows at rest. When something changes, a controlled cyan telemetry pulse acknowledges it, then settles. The operator is always in command and never alarmed.

Density is moderate and honest: tables that hold real rows, panels with real labels, spacing that breathes without wasting a shop owner's time. The system is bilingual to the bone — every surface reads identically in Arabic (RTL) and English (LTR), using direction-neutral properties so nothing is ever bolted on. This is a paid tool that should feel like paid enterprise SaaS: crafted, deliberate, dependable.

It explicitly rejects two things. It is **not legacy ERP / spreadsheet UI** — no cramped gray data walls, no illegible 11px type, no 2005 warehouse software. And it is **not a generic AI-SaaS template** — no gradient hero-metric blocks, no identical icon-heading-text card grids, no tiny uppercase eyebrows over every section, no cream/sand background masquerading as warmth.

**Key Characteristics:**
- Dark slate chassis, data as the light source
- One accent (Live Cyan), rationed to signal — never decoration
- Ambient soft shadows; glow only as a response to state
- Crisp, instrument-grade components with complete interaction states
- Bilingual RTL/LTR as a first-class, direction-neutral default
- Dual light/paper and dark/night themes from one token set

## 2. Colors

A restrained clinical palette: cool slate and paper neutrals carrying the structure, one saturated cyan carrying the signal, and a rationed status set for stock health.

### Primary
- **Midnight Slate** (`#0E2938`): The brand chassis. Sidebar gradient, primary buttons, dark-theme headings. The calm, dependable ground everything sits on. Deepens to **Slate Deep** (`#06141C`) for gradient bottoms and shadow, lifts to **Slate Light** (`#183F54`) on primary-button hover.
- **Steel Accent** (`#2A6F97`): A muted mid-blue bridge between slate and cyan. Secondary emphasis, links, chart secondaries — used where full cyan would over-signal.

### Secondary
- **Live Cyan** (`#06B6D4`): The one voice. Active nav, current selection, focus rings, primary interactive affordance, state pulses. Its scarcity is the whole point. **Cyan Ink** (`#22D3EE`) is the brighter text-on-dark variant for cyan labels that must stay legible.

### Neutral
- **Paper BG** (`#F4F7F9`): Light-theme app background — a true cool off-white, not warm cream.
- **Surface White** (`#FFFFFF`) / **Surface Alt** (`#F8FAFC`) / **Surface Strong** (`#E2E8F0`): Content surfaces, subtle panel fills, and stronger dividers/inset fills.
- **Ink** (`#0F172A`): Primary text on light. **Ink Muted** (`#64748B`): Labels, secondary text, placeholders — dark enough to clear 4.5:1, never a decorative light gray.
- **Night BG** (`#070B11`) / **Night Surface** (`#0E1622`) / **Night Surface Alt** (`#121C2B`): Dark-theme background and layered surfaces. **Night Ink** (`#F1F5F9`) / **Night Ink Muted** (`#94A3B8`): dark-theme text pair.

### Tertiary (Status)
- **Success** (`#10B981`), **Warning** (`#F59E0B`), **Danger** (`#F43F5E`), **Info** (`#0EA5E9`): Stock health only — in stock, low stock / near expiry, out of stock / expired, informational. Always paired with an icon or label, never color alone.

### Named Rules
**The One Voice Rule.** Live Cyan appears on ≤10% of any screen. It marks exactly one kind of thing: interactive or active state. If cyan is decorating a surface, it is wrong.

**The Cool-Not-Cream Rule.** Neutrals tint cool toward slate, never warm toward cream/sand/paper. A warm-tinted near-white background is the AI tell we refuse.

**The Rationed Status Rule.** Status color is meaningful and paired with a glyph. A screen full of red and amber is noise; alarm is earned, not ambient.

## 3. Typography

**Display / Body Font:** Plus Jakarta Sans (Latin) with Noto Kufi Arabic for Arabic script; fallback `system-ui, sans-serif`.
**Label / Data Font:** Same family, heavier weights and tracking — no separate mono.

**Character:** One humanist-geometric sans in multiple weights carries the entire UI — headings, labels, data, buttons. Product UI doesn't need a display/body pairing; a single well-tuned family is the point. The Arabic and Latin faces are weight-matched so a bilingual screen never feels like two typefaces stitched together.

### Hierarchy
- **Display** (800, 2rem/32px, 1.2): Page-level titles. Fixed rem, never fluid clamp — a sidebar-width heading must not shrink.
- **Headline** (700, 1.5rem/24px, 1.35): Section headers, card group titles.
- **Title** (700, 1.125rem/18px, 1.35): Modal titles, panel headers.
- **Body** (400, 1rem/16px, 1.6): Default text, descriptions. Prose capped 65–75ch; data/table text may run denser.
- **Label** (600, 0.875rem/14px, +0.01em): Form labels, button text, secondary UI. Muted ink by default.
- **Overline** (700, 0.75rem/12px, +0.08em, uppercase): Table headers only. The single sanctioned uppercase-tracked role.

### Named Rules
**The Fixed-Scale Rule.** Type sizes are fixed rem on a ~1.2 ratio. Fluid clamp headings are forbidden in product UI — users view at consistent DPI and a shrinking h1 looks broken, not responsive.

**The One-Eyebrow Rule.** Uppercase tracked text is permitted in exactly one place: table column headers. It is never scaffolding above page sections.

## 4. Elevation

Ambient and restrained. Depth is conveyed by soft, diffuse shadows that signal surface hierarchy — never hard drop shadows, never 2014-app dark blur. Surfaces carry a quiet resting shadow; the cyan **glow** is a state material, not a resting decoration. It appears on hover, focus, and active — the control room lighting up in response to a hand — then settles.

### Shadow Vocabulary
- **Soft** (`box-shadow: 0 10px 30px -10px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.02)`): Buttons and small raised elements at rest.
- **Card** (`box-shadow: 0 10px 25px -5px rgba(15,23,42,0.03), 0 0 0 1px rgba(15,23,42,0.04)`): Default surface — cards, tables, panels. Doubles as a hairline ring.
- **Medium** (`box-shadow: 0 20px 50px -12px rgba(15,23,42,0.09), 0 1px 4px rgba(15,23,42,0.03)`): Modals, popovers, hover-lifted cards.
- **Glow** (`box-shadow: 0 0 25px rgba(6,182,212,0.15)`): State only — hover/active on interactive surfaces. Never at rest.

### Named Rules
**The Glow-Is-A-State Rule.** Cyan glow answers an interaction. If an element glows while idle, remove it. Rest is calm; response is lit.

**The Ambient-Only Rule.** Shadows are soft and diffuse to lift surfaces off the background. A dark, tight shadow reads as a 2014 app — forbidden.

## 5. Components

Components are **crisp and precise** — instrument-grade. Tight 150–250ms transitions, deliberate complete states, no bounce or elastic. Every interactive element ships default, hover, focus-visible, active, and disabled. Consistency screen-to-screen is a virtue; the same button is the same button everywhere.

### Buttons
- **Shape:** Gently rounded (`rounded-md` 0.75rem; large/hero `rounded-lg` 1rem). Fixed 48px height (`sm`/`md`/`lg`), 56px for `xl`.
- **Primary:** Midnight Slate fill, white text, soft shadow. Hover lifts to Slate Light, gains cyan glow and a −2px translate. Padding 12px 24px.
- **Secondary / Outline:** Surface fill or transparent, hairline border, ink text; hover borders toward cyan.
- **Ghost:** No fill; muted ink → cyan on hover with a cyan-dim wash.
- **Danger:** Danger-tinted fill (10%), danger text and border — never a solid red button for routine actions.
- **Hover / Focus / Active:** −0.5px to −2px translate on hover, `scale(0.97)` tap, `focus-visible` = 2px cyan ring at 50% + offset. All ~160–200ms.

### Cards / Containers
- **Corner Style:** `rounded-lg` (1rem), generous.
- **Background:** Surface White on Paper BG (light) / Night Surface on Night BG (dark).
- **Shadow Strategy:** Card shadow at rest; interactive cards lift to Medium + cyan glow on hover (see Elevation).
- **Border:** Single hairline (`border` token, `rgba(15,23,42,0.06)`). Full borders only — never a thick colored side stripe.
- **Internal Padding:** 24px (mobile) → 32px (sm+). Header/content split at 20–24px / 32–40px.

### Inputs / Fields
- **Style:** Surface fill, 1.5px slate-tinted border, `rounded-md`, 48px tall, 14px 20px padding. Leading-icon and trailing-slot aware; RTL-mirrored via logical properties.
- **Focus:** Border shifts to cyan at 50%, 4px cyan-dim ring (`0 0 0 4px rgba(6,182,212,0.10)`). No layout shift.
- **Label:** Muted-ink label above, 600 weight, 12px gap.
- **Disabled:** 55% opacity, inset fill, `not-allowed` cursor.

### Navigation (Sidebar)
- **Style:** Floating rounded card on the slate gradient, hairline white border, 276px expanded / 80px collapsed with spring animation.
- **Items:** Label rows, muted white at rest → full white on hover with a `white/5` wash.
- **Active:** Cyan-dim fill (`highlight/12`), hairline cyan border, soft cyan glow, plus a 4px cyan indicator bar on the leading edge (`start-0`, logical — mirrors in RTL). Icon turns cyan.
- **Collapsed:** Icon-only with hover tooltips escaping via the label; mobile becomes a spring-in drawer with backdrop.

### Tables
- **Shell:** `rounded-lg` surface with card shadow, horizontal scroll below 720px min-width.
- **Header:** Sticky, Surface Alt at 95% with backdrop blur, Overline type (uppercase 12px tracked) in muted ink.
- **Rows:** Hairline bottom borders, 24px x-padding, 20px y-padding, ink text; align-middle.

### Modals
- **Structure:** Sticky header → scrollable body → sticky footer, so actions never clip. `rounded-lg`, Medium shadow, `black/60` + backdrop-blur scrim.
- **Motion:** Spring in (opacity + `scale 0.95→1` + 20px rise); close button turns danger-tinted on hover.
- **Doctrine:** Modals are a last resort, not a first thought — exhaust inline / progressive alternatives first.

## 6. Do's and Don'ts

### Do:
- **Do** keep Live Cyan (`#06B6D4`) rationed to interactive and active state — ≤10% of any screen (The One Voice Rule).
- **Do** use cool, slate-tinted neutrals; keep the light background a true cool off-white (`#F4F7F9`).
- **Do** keep body and muted text at or above 4.5:1 in **both** themes — muted ink is `#64748B`/`#94A3B8`, never a lighter decorative gray.
- **Do** pair every status color with an icon or label so stock health survives color blindness.
- **Do** use fixed rem type on a ~1.2 ratio; ship every interactive component with default/hover/focus-visible/active/disabled.
- **Do** build with logical properties (`start`/`end`, `ms`/`me`) so every screen mirrors cleanly in Arabic RTL.
- **Do** reserve the cyan glow for interaction response; let surfaces rest calm.
- **Do** honor `prefers-reduced-motion` with a crossfade or instant fallback for every animation.

### Don't:
- **Don't** ship legacy-ERP density — no cramped gray data walls, no sub-12px type, no 2005 warehouse look.
- **Don't** produce generic AI-SaaS slop: no gradient hero-metric blocks, no identical icon-heading-text card grids, no cream/sand background.
- **Don't** use `background-clip: text` gradient text (the `.text-gradient` utility is prohibited) — emphasis comes from weight and size.
- **Don't** use a `border-left`/`border-right` colored stripe >1px as an accent on cards, rows, or alerts — full borders or background tints only.
- **Don't** let cyan glow or full-saturation accents sit on idle/inactive elements.
- **Don't** put uppercase tracked eyebrows above sections — table headers are the only sanctioned uppercase role.
- **Don't** default to glassmorphism; blur/glass is rare and purposeful (scrims, sticky headers), never decorative filler.
- **Don't** reach for a modal first — exhaust inline and progressive alternatives.

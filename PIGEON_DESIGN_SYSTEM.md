# PIGEON Design System Specification

> **SOURCE OF TRUTH & AI GOVERNANCE DOCUMENT**  
> **Target Audience:** Developers, Designers, and AI Coding Agents working on PIGEON.  
> **Primary Rule:** Do NOT redesign, do NOT "modernize" into generic SaaS, do NOT rewrite styling into conventional templates. This document specifies the exact visual identity of PIGEON as currently implemented and locks it against unintentional drift.

---

## 1. Brand Personality

PIGEON is a no-login, no-install, temporary file-sharing utility built specifically for college students and everyday device-to-device handoffs. It solves the everyday _"it’s on my phone and I need it on my laptop/board right now"_ problem.

### Pigeon MUST Feel:

- **Clever:** Zero-friction mechanics (Open → Drop → Scan → Done) that make users feel smart for skipping email/WhatsApp.
- **Playful:** Expressive visual energy, subtle absurd humor, and deadpan mascot expressions.
- **Fast:** Instant feedback, lightweight feel, urgent countdowns, zero login hurdles.
- **Slightly Weird:** Analog risograph aesthetic, asymmetric compositions, oversized numbers, smug bird character.
- **Youthful & Student-Focused:** Relatable campus situations (lab computers, classroom digital boards, group presentations).
- **Useful:** High-utility tool disguised as a creative poster brand; function is front and center.
- **Memorable:** Distinctive palette and editorial layout that stands out completely from boring utility apps.

### Pigeon MUST NOT Feel:

- ❌ **Corporate:** No business jargon, no "enterprise file security", no compliance badges.
- ❌ **Enterprise SaaS:** No floating glassmorphic cards, no purple gradients, no soft pill-shaped buttons.
- ❌ **Generic Productivity Tool:** Must never look like Dropbox, Google Drive, Box, or OneDrive.
- ❌ **Trendy Minimalist Dashboard:** Must never look like Linear, Notion, or Raycast.
- ❌ **WeTransfer Clone:** Not a fullscreen wallpaper advertising canvas.
- ❌ **Childish / Overly Cartoonish:** The pigeon is geometric, stoic, and stylized—NOT a Disney or Pixar cartoon bird.

---

## 2. Color System

Pigeon uses an intentional, high-contrast, poster-print palette built on **OKLCH** color values. The warm paper base prevents visual fatigue, deep navy provides authoritative contrast, and high-voltage accents (Cobalt, Acid, Coral) direct user attention.

### Official Brand Palette

| Token Name      | OKLCH Value            | sRGB Hex Equivalent   | Role & Purpose                                                                          | Where Used in Codebase                                                                                              |
| :-------------- | :--------------------- | :-------------------- | :-------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **`--paper`**   | `oklch(0.96 0.018 83)` | `#F8F1E5` _(#F7F2E8)_ | **Canvas Background.** Warm, tactile cream/off-white base. Replaces stark `#FFFFFF`.    | Page background (`body`, `bg-paper`), header, footer, dropzone resting state, contrast badges.                      |
| **`--ink`**     | `oklch(0.25 0.06 264)` | `#13203E` _(#17233D)_ | **Typography & Heavy Strokes.** Deep, midnight navy/almost-black. Never pure `#000000`. | Primary body text, headings, `border-2 border-ink` on all cards/buttons, dropzone text, dark cards.                 |
| **`--cobalt`**  | `oklch(0.58 0.24 263)` | `#246AFF` _(#1E5BFF)_ | **Primary Electric Accent.** Energetic, hyper-saturated royal/cobalt blue.              | Hero pigeon character, main action buttons, ticker banner background, upload box accent.                            |
| **`--acid`**    | `oklch(0.89 0.23 123)` | `#BFF100` _(#B9F227)_ | **High-Voltage Highlight.** Electric lime/acid-green. Sparks urgency and completion.    | "off" headline highlight, pigeon beak, active status indicators, progress bar fill, QR border, dropzone drag state. |
| **`--coral`**   | `oklch(0.72 0.16 32)`  | `#F87962` _(#FF6347)_ | **Tertiary Warm Accent.** Bold salmon/coral. Signifies receiver, alerts, and time.      | Large watermark `01`, "POINT CAMERA HERE" banner, receiver card background, countdown timer text, pigeon parcel.    |
| **`--surface`** | `oklch(1 0 0)`         | `#FFFFFF`             | **Pure White Surface.** High-contrast background for interactive card interiors.        | Main dispatch card (`bg-surface`), textarea interior, modal containers.                                             |

### Color Hierarchy Rules:

1. **Paper (`#F8F1E5`) and Ink (`#13203E`) form 80% of the visual space.**
2. **Cobalt (`#246AFF`) is the primary driver of forward action** (primary buttons, hero pigeon, ticker).
3. **Acid Lime (`#BFF100`) is used for highlights and successful states** (pigeon beak, drag-hover background, progress bar).
4. **Coral (`#F87962`) marks destinations and physical handoffs** (laptop receiver card, QR callout banner, carrying parcel).
5. **Never use color gradients.** All fills are solid, posterized, and flat.

---

## 3. Typography

The typographic hierarchy combines an oversized display sans-serif with an approachable geometric body face, drawing inspiration from modern Swiss poster design.

### Font Families

- **Display Typography:** `Outfit`, system-ui, sans-serif
  - Injected via Google Fonts: `family=Outfit:wght@500;600;700;800`
  - Used for: Brand logo, hero headlines, section headers, giant watermark numbers, step badges, and action buttons.
- **Body & Interface Typography:** `Figtree`, system-ui, sans-serif
  - Injected via Google Fonts: `family=Figtree:wght@400;500;600;700`
  - Used for: Explanatory copy, file names, helper descriptions, modal text, footer notes.
- **Monospace Typography:** System monospace
  - Used for: Room codes (`Room 4K9X`), room URLs (`pigeon.app/r/4K9X`), numerical countdowns (`09:42`), file size metadata.

### Typography Scale & Specs

| Role                         | Font    | Size (Tailwind)                              | Leading           | Tracking             | Weight          | Case / Transform                           |
| :--------------------------- | :------ | :------------------------------------------- | :---------------- | :------------------- | :-------------- | :----------------------------------------- |
| **Giant Watermark**          | Outfit  | `text-[16rem] sm:text-[26rem]`               | `leading-none`    | `tracking-normal`    | 800 (Extrabold) | Uppercase (`01`)                           |
| **Hero Headline**            | Outfit  | `text-[3.4rem] sm:text-8xl lg:text-[8.5rem]` | `leading-[0.86]`  | `tracking-[-0.03em]` | 800 (Extrabold) | Mixed ("Get it off your phone.")           |
| **Poster Section Head**      | Outfit  | `text-5xl sm:text-7xl`                       | `leading-[0.85]`  | `tracking-[-0.02em]` | 800 (Extrabold) | Uppercase ("YOUR PIGEON IS READY.")        |
| **Section Header**           | Outfit  | `text-4xl sm:text-5xl`                       | `leading-none`    | `tracking-[-0.02em]` | 800 (Extrabold) | Sentence Case                              |
| **Card Header**              | Outfit  | `text-3xl sm:text-4xl`                       | `leading-none`    | `tracking-tight`     | 800 (Extrabold) | Sentence Case                              |
| **Ticker Banner**            | Outfit  | `text-sm`                                    | `leading-normal`  | `tracking-[0.24em]`  | 800 (Extrabold) | Uppercase                                  |
| **Pill Step Badge**          | Outfit  | `text-sm`                                    | `leading-normal`  | `tracking-[0.14em]`  | 800 (Extrabold) | Uppercase (`OPEN`, `DROP`, `SCAN`, `DONE`) |
| **Eyebrow Label (`.label`)** | Figtree | `text-[11px]` (`0.6875rem`)                  | `leading-normal`  | `tracking-[0.12em]`  | 700 (Bold)      | Uppercase (`DISPATCH · 01`, `PAYLOAD`)     |
| **Body Large**               | Figtree | `text-lg` (`1.125rem`)                       | `leading-relaxed` | `tracking-normal`    | 400 (Regular)   | Sentence Case                              |
| **Body Regular**             | Figtree | `text-sm` (`0.875rem`)                       | `leading-normal`  | `tracking-normal`    | 500 / 600       | Sentence Case                              |
| **Code / Room Token**        | Mono    | `text-sm` / `text-xs`                        | `leading-none`    | `tracking-normal`    | 700 (Bold)      | Uppercase                                  |

### Strict Typographic Rules:

- **Tight Headings:** All display titles MUST use `leading-[0.85]` or `leading-[0.86]` with negative tracking (`tracking-[-0.03em]`). Lines must sit close together like stacked woodblock type.
- **Wide Eyebrows:** All subheaders and meta labels MUST use uppercase with wide tracking (`0.12em` to `0.24em`).
- **No Floating Generic Subtitles:** Do not add standard SaaS paragraph text underneath headings unless it is concise, witty, and punchy.

---

## 4. Layout Architecture

Pigeon’s layout relies on an **asymmetrical editorial grid** with sharp rectangular boundaries, intentional rotation, and overlapping layers.

### Grid & Containers

- **Max Canvas Width:** `max-w-[1440px]` centered (`mx-auto`).
- **Horizontal Viewport Padding:** `px-4` on mobile, expanding to `sm:px-7` on desktop.
- **Desktop Multi-Column Grid:** 12-column grid (`lg:grid-cols-12`) with asymmetric splits:
  - Hero Section: 7 columns (headline) + 5 columns (badges / mascot bleed).
  - Dispatch Section: 8 columns (upload/dropzone) + 4 columns (transfer visual & payload summary).
  - Receiver Section: 7 columns (file pouch) + 5 columns (receiver callout card).
  - Manifesto Section: 3 equal columns (`lg:grid-cols-3`).

### Borders & Corners (The Anti-Pill Rule)

- **Standard Border:** `border-2 border-ink` (`#13203E` solid 2px). Applied to almost every card, button, badge, input, and divider.
- **Accent Border:** `border-4 border-acid` (used exclusively for framing the QR code card).
- **Corner Radii:**
  - **`rounded-none` (0px):** Default for all buttons, cards, dropzones, modals, and badges.
  - **`rounded-sm` (2px):** Used solely on small icon badges (e.g. header logo square).
  - **`rounded-full` (Circle):** Used exclusively for round icon buttons, indicator dots, or round avatar glyphs.
  - ❌ **NEVER USE:** `rounded-lg`, `rounded-xl`, `rounded-2xl`, or rounded pills on structural elements.

### Intentional Asymmetries & Offsets

- **Rotation Accents:**
  - Header mark: `-rotate-3`
  - Headline "off" badge: `-rotate-1`
  - Hero mascot: `rotate-[-8deg]`
  - Peeking pigeon over dispatch card: `rotate-6`
  - QR Code poster: `rotate-1`
  - "POINT CAMERA HERE" banner: `-rotate-6`
- **Grid Overlaps & Bleeds:** Elements intentionally break bounding boxes (e.g. the giant hero pigeon sits partially behind the headline and extends past the right grid line; the mascot peeks `-top-14` above the dispatch card).
- **Poster Shadow:** Custom utility `@utility shadow-poster` producing an ink-tinted offset:
  `box-shadow: 0 16px 40px -28px color-mix(in oklab, var(--ink) 42%, transparent);`

---

## 5. UI Language & Components

### 1. Action Buttons

Buttons are sharp, tactile blocks with immediate visual feedback.

- **Primary Button:** `rounded-none border-2 border-ink bg-cobalt text-paper shadow-none hover:bg-ink hover:text-paper`
- **High-Voltage Action (Header / Send):** `rounded-none border-2 border-ink bg-acid text-ink hover:bg-ink hover:text-paper`
- **Secondary / Outline Button:** `rounded-none border-2 border-ink bg-paper text-ink hover:bg-ink hover:text-paper`
- **Destructive / Reset:** `border-2 border-ink bg-ink text-paper hover:bg-cobalt`
- **Rule:** Never use drop-shadows on buttons (`shadow-none`). Buttons invert their color state on hover.

### 2. Cards & Containers

- Built with `border-2 border-ink bg-surface p-4 sm:p-6 shadow-poster`.
- Headers inside cards feature an uppercase label on the left (`.label`) and a status dot on the right (`h-2.5 w-2.5 rounded-full bg-acid`).

### 3. Upload & Dropzone Area

- **Resting State:** `border-2 border-dashed border-ink/35 bg-paper p-7 text-center`.
- **Drag-Over Active State:** `border-2 border-dashed border-ink bg-acid p-7 text-center` (flips entire area to high-voltage lime).
- **Contents:** Centered pigeon illustration (elevates on hover), bold display prompt ("Drop it on the bird." or "Give it here."), secondary metadata ("PDF · PPT · image · video · text"), action buttons, and animated traveling dot (`.dispatch-dot`).

### 4. Ticker / Marquee Banner

- **Container:** Full-width strip with top and bottom borders: `border-y-2 border-ink bg-cobalt py-2.5 text-paper`.
- **Typography:** `font-display text-sm font-extrabold uppercase tracking-[0.24em]`.
- **Separator:** Acid-green bullet points (`<span className="text-acid">·</span>`) and diamond sparkles (`✦`).

### 5. Tone of Voice & Copywriting

Pigeon speaks with direct, confident, and slightly humorous student brevity:

- **Hero Title:** _"Get it off your phone."_
- **Hero Subtitle:** _"Drop it. Scan it from your laptop. Done. No email, no WhatsApp, no account."_
- **Dropzone Resting:** _"Drop it on the bird."_
- **Dropzone Dragging:** _"Give it here."_
- **Dropzone Footer:** _"No account · Temporary"_
- **File Selected:** _"Ready to fly."_
- **File Too Large Error:** _"That one’s too heavy. This demo carries files up to 250 MB. Nothing was uploaded."_
- **Upload In-Progress:** _"Pigeon in flight"_
- **QR Ready Screen:** _"Your pigeon is ready. Scan from your laptop."_
- **Receiver Standby:** _"Waiting on the other side. Scan the code and this side lights up."_
- **Receiver Connected:** _"Laptop connected"_
- **Delivery Completed:** _"Delivered. Nice."_
- **Expired State:** _"This Pigeon flew home. The temporary room expired. Start a fresh one."_
- **Campaign Question:** _"Why are you emailing yourself?"_

---

## 6. The Pigeon Mascot Specification

The Pigeon mascot is an original geometric vector character implemented directly in code in `src/components/pigeon/PigeonCharacter.tsx`.

```
                  ┌─────┐
                  │ (•) ├─►  Head & Eye + Beak
               ┌──┴─────┴──┐
       Tail ◄──┤   BODY    ├──► Neck Bridge
               └──┬─────┬──┘
                  │  ▼  │    Wing (Signature Chevron)
                 ┌┴─────┴┐
                 │       │   Feet / Carrying Parcel
```

### Geometric Anatomy & Proportions

The character is rendered inside a `viewBox="0 0 130 112"` SVG coordinate space:

1. **Tail Wedge:** A crisp angular wedge: `<path d="M6 40 L44 50 L42 78 Z" />` (opacity 90%).
2. **Body:** A tilted horizontal ellipse: `<ellipse cx="62" cy="58" rx="32" ry="24" transform="rotate(-8 62 58)" />`.
3. **Head:** A perfect geometric circle: `<circle cx="92" cy="33" r="16" />`.
4. **Neck Bridge:** An anchoring polygon joining head and body: `<path d="M74 40 L100 44 L86 62 Z" />`.
5. **Beak:** A sharp acute triangular wedge: `<path d="M106 30 L128 36 L106 42 Z" />`. Defaults to Acid Lime or Coral.
6. **Eye:** A single unblinking circle: `<circle cx="96" cy="29" r="3.6" />`. Pure paper fill, no pupil. Gives the pigeon a deadpan, slightly smug expression.
7. **Signature Wing:** An asymmetric chevron polygon: `<path d="M40 50 L88 60 L54 80 Z" />` placed inside a group with `style={{ transformOrigin: "52px 54px" }}` for rotation.
8. **Legs & Feet:** Minimalist 4px thick line strokes:
   - Front leg: `M60 80 L58 96 M58 96 L50 100 M58 96 L66 100` (100% opacity).
   - Back leg: `M76 78 L76 94 M76 94 L68 98 M76 94 L84 98` (60% opacity).
9. **Carrying Parcel (Active state):** A coral gift box clamped in its feet: `<rect x="46" y="92" width="30" height="24" rx="3" />` with white ribbon lines.
10. **Done Checkmark (Completed state):** A thick acid checkmark emerging from its chest: `<path d="M104 66 l8 9 l16 -20" strokeWidth="8" strokeLinecap="round" />`.

### Supported Mascot Moods (`mood` prop):

- `idle`: Default standing pose, wing resting.
- `flying`: Triggers rhythmic bobbing motion (`pigeon-bob`) and rapid wing flapping (`pigeon-wing`).
- `carrying`: Displays the coral parcel held in its claws.
- `waiting`: Slow, patient wing flap (`pigeon-wing-slow`).
- `done`: Displays the bold acid completion checkmark.

### Mascot Rules:

- ❌ **Do NOT add feathers, pupils, smile, eyelashes, or expressive cartoon eyebrows.**
- ❌ **Do NOT replace with an AI-generated image or PNG graphic.**
- ❌ **Do NOT soften the sharp angular beak or tail.**

---

## 7. Motion & Animation Principles

Pigeon’s motion feels **physical, snappy, purposeful, and analog**. It should never feel sluggish, floaty, or overly bouncy.

### Motion Profiles

1. **Snappy & Decisive (0.15s – 0.3s):** Button hover inversions, drag-enter color flips, dialog reveals.
2. **Mechanical & Rhythmic (1.4s – 2.6s):**
   - `.dispatch-dot`: `2.6s ease-in-out infinite` (A coral dot travels 124px across the dropzone floor).
   - `.animate-pigeon`: `1.4s ease-in-out infinite` (Bobbing and slight rotation `rotate(-5deg)` to `rotate(3deg)` simulating carrying weight).
3. **Pop-in Entrance (0.45s):**
   - `.qr-reveal`: `0.45s ease-out both` (Scales from `0.92` to `1.0` with a subtle `-2deg` rotation snap).
4. **Infinite Marquee:** Continuous steady linear scroll across the viewport without pausing or stuttering.

### Accessibility Requirement:

All animations MUST be wrapped or paired with:

```css
@media (prefers-reduced-motion: reduce) {
  .dispatch-dot,
  .animate-pigeon,
  .qr-reveal {
    animation: none;
  }
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
  }
}
```

---

## 8. LOCKED ELEMENTS (What AI Agents MUST NOT Change)

> ⚠️ **CRITICAL DIRECTIVE FOR ALL FUTURE CODE EDITS**  
> Any AI agent proposing changes to this codebase MUST verify compliance against this locked list.

### 🔒 1. Base Canvas & Color Palette

- **NEVER** replace the warm paper background (`--paper: oklch(0.96 0.018 83)`) with `#FFFFFF`, `#000000`, or a cool slate gray.
- **NEVER** introduce purple/violet gradients, "AI glow" effects, or glassmorphic blur filters (`backdrop-blur`).
- **NEVER** soften the ink navy typography (`--ink`) to washed-out gray (`#6B7280`).

### 🔒 2. Corner Radius & Borders

- **NEVER** change `rounded-none` or `rounded-sm` buttons/cards to `rounded-xl`, `rounded-2xl`, or pill shapes.
- **NEVER** remove the signature `border-2 border-ink` from components.
- **NEVER** add soft, diffuse SaaS box shadows. Only the defined `@utility shadow-poster` is permitted.

### 🔒 3. Typography & Voice

- **NEVER** replace `Outfit` or `Figtree` with standard system fonts (Inter, Roboto, Arial).
- **NEVER** increase display headline line-height above `leading-[0.9]`. The compressed, stacked appearance is intentional.
- **NEVER** rewrite UI copy to sound like enterprise software (e.g. changing _"Drop it on the bird"_ to _"Select files to begin upload"_ is strictly forbidden).

### 🔒 4. Geometric Mascot Integrity

- **NEVER** replace `PigeonCharacter.tsx` with a raster image, Lottie file, or external icon.
- **NEVER** alter the geometry or add cartoonish facial features to the SVG bird.
- **NEVER** remove the geometric pigeon mark from the header or footer.

### 🔒 5. Layout & Composition

- **NEVER** convert the homepage into a standard 3-tier SaaS pricing / feature-card template.
- **NEVER** remove the rotating ticker marquee (`Open · Drop · Scan · Done`).
- **NEVER** straighten out the intentional rotational offsets (`-rotate-1`, `rotate-6`, etc.).

---

_This document constitutes the official Design System specification for PIGEON. Adherence is mandatory for all ongoing development._

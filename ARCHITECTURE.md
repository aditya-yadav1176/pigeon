# Pigeon Architecture

## Executive Summary

Pigeon is a no-login, no-install, student-focused temporary file sharing web application built around the core paradigm:
**OPEN → DROP → CODE / QR → SCAN → DONE**

- **Primary use case:** Phone → Laptop / PC / Classroom Digital Board
- **Secondary use case:** Laptop / PC → Phone
- **Origin:** Scaffolded and designed in Lovable as a high-fidelity frontend prototype with an original brand identity (editorial poster aesthetic, warm paper base, electric cobalt, lime acid, coral, oversized typography, geometric pigeon mascot).
- **Current State:** Pure frontend mock simulation. The visual system, component hierarchy, responsive layouts, and state transitions are fully articulated, but file transfer, QR scanning, room generation, and receiver routing operate on local simulated state.

---

## 1. Stack

| Layer                     | Technology                                                                          | Version                    | Purpose / Role                                                        |
| :------------------------ | :---------------------------------------------------------------------------------- | :------------------------- | :-------------------------------------------------------------------- |
| **Framework**             | [TanStack Start](https://tanstack.com/start)                                        | `1.168.32`                 | Full-stack React SSR & streaming framework built on Vite & Nitro      |
| **Routing**               | [TanStack Router](https://tanstack.com/router)                                      | `1.170.18`                 | Type-safe file-based client/server routing                            |
| **Server Engine**         | [Nitro](https://nitro.unjs.io/) / [h3](https://h3.unjs.io/)                         | `3.0.260603-beta`          | Lightweight server engine, Vercel/Node deployment target              |
| **UI Library**            | [React](https://react.dev/)                                                         | `19.2.0`                   | View layer with React Server Components readiness                     |
| **Styling**               | [Tailwind CSS v4](https://tailwindcss.com/)                                         | `4.2.1`                    | Modern engine using CSS `@theme inline` and OKLCH color space         |
| **Animations**            | [tw-animate-css](https://github.com/lucide-icons/tw-animate-css) + Custom Keyframes | `1.3.4`                    | CSS animations with reduced-motion fallbacks                          |
| **Component Primitives**  | [Radix UI](https://www.radix-ui.com/) (shadcn/ui "new-york")                        | Various                    | Accessible headless UI primitives (Dialog, Tooltip, Progress, Button) |
| **Icons**                 | [Lucide React](https://lucide.dev/)                                                 | `0.575.0`                  | Cohesive line icons                                                   |
| **Data Fetching / Cache** | [TanStack React Query](https://tanstack.com/query)                                  | `5.101.1`                  | Configured in root context (currently idle)                           |
| **Runtime & Build**       | [Vite](https://vitejs.dev/) & [Bun](https://bun.sh/)                                | Vite `8.1.5`, Bun lockfile | Fast bundling, HMR, and package management                            |
| **Language**              | [TypeScript](https://www.typescriptlang.org/)                                       | `5.8.3`                    | End-to-end type safety                                                |

---

## 2. Folder Structure

```
d:/Projects/pigeon/
├── public/                        # Static assets served at root
│   ├── favicon.svg                # Custom geometric Pigeon SVG favicon matching brand
│   └── robots.txt                 # Search engine crawler directives
├── src/
│   ├── components/
│   │   ├── pigeon/                # Core Pigeon brand and domain components
│   │   │   ├── Pigeon.tsx         # Responsive animated Pigeon SVG component & branding
│   │   │   ├── PigeonCharacter.tsx # Export interface for backwards compatibility
│   │   │   ├── PigeonExperience.tsx# Complete transfer experience (Send/Receive, QR, polling)
│   │   │   ├── pigeon.css         # Keyframes and flight animation transitions
│   │   │   ├── pigeon.motion.ts   # Animation presets, timings, and reduced-motion config
│   │   │   └── pigeon.types.ts    # Character moods, transfer states, and mascot props
│   │   └── ui/                    # Lean, pruned Radix UI primitives
│   │       ├── button.tsx         # [USED] Styled action buttons
│   │       ├── dialog.tsx         # [USED] Modal dialog for text pasting
│   │       ├── progress.tsx       # [USED] Upload progress bar
│   │       ├── ScrollReveal.tsx   # [USED] Scroll-based reveal micro-interactions
│   │       └── tooltip.tsx        # [USED] Action tooltips
│   ├── lib/
│   │   ├── error-capture.ts       # SSR error stack preservation for h3/Nitro
│   │   ├── error-page.ts          # Catastrophic SSR 500 HTML template
│   │   └── utils.ts               # cn() class merging utility (clsx + tailwind-merge)
│   ├── routes/                    # TanStack Start file-based route definitions
│   │   ├── README.md              # Route naming convention reference
│   │   ├── __root.tsx             # Root layout: HTML shell, fonts, meta tags, QueryClientProvider
│   │   └── index.tsx              # Index route (/): mounts <PigeonExperience />
│   ├── services/
│   │   └── transfer/              # Transfer service abstraction & FastAPI client
│   │       ├── fastApiTransferService.ts # Real HTTP REST transfer client
│   │       ├── mockTransferService.ts    # Fallback in-memory transfer service
│   │       ├── transferService.ts        # Service interface & TypeScript types
│   │       └── index.ts                  # Active transfer service export
│   ├── routeTree.gen.ts           # Auto-generated TanStack Router route tree
│   ├── router.tsx                 # Router instance factory with QueryClient
│   ├── server.ts                  # Server entry wrapper for SSR error normalization
│   ├── start.ts                   # TanStack Start instance with error & CSRF middleware
│   └── styles.css                 # Tailwind v4 theme, OKLCH palette, custom utilities, keyframes
├── backend/                       # Production FastAPI backend
│   ├── app/                       # Application logic (routes, storage, security, cleanup)
│   ├── storage/                   # Temporary file storage directory (.gitkeep)
│   ├── requirements.txt           # Lean Python dependencies
│   ├── test_api.py                # Backend integration test suite
│   └── test_qa_suite.py           # 34-test comprehensive backend QA suite
├── components.json                # shadcn/ui configuration (new-york style, slate base)
├── package.json                   # Dependency definitions and npm scripts
├── tsconfig.json                  # Path aliases (@/* -> src/*) and TS compiler options
└── vite.config.ts                 # @lovable.dev/vite-tanstack-config with Nitro SSR entry
```

---

## 3. Application Flow

### Intended Conceptual Flow

```
SENDER (Phone or PC)                  PIGEON CLOUD / P2P                  RECEIVER (Laptop or PC)
┌───────────────────────┐             ┌────────────────────────┐         ┌───────────────────────┐
│ 1. Open pigeon.app    │             │                        │         │                       │
│ 2. Drop files / text  │             │                        │         │                       │
│ 3. Click "Send"       │ ──Upload──> │ 4. Create Ephemeral    │         │                       │
│ 4. Display QR & Code  │             │    Room (e.g. "4K9X")  │         │                       │
│    (e.g., "4K9X")     │             │    TTL: 10-15 mins     │         │                       │
│                       │             │                        │ <──Scan │ 5. Scan QR with Cam   │
│                       │             │                        │         │    OR enter 4K9X      │
│                       │ <─Signal──  │ 6. Pairing Signal      │ ──Join─>│ 6. Connects to Room   │
│ 7. "Laptop connected" │             │                        │         │                       │
│ 8. Transfer Complete  │ ──Deliver─> │ 7. Stream / Serve File │ ─Fetch─>│ 7. View file list     │
│ 9. Auto-expire & wipe │             │ 8. Secure Data Purge   │         │ 8. Download files     │
└───────────────────────┘             └────────────────────────┘         └───────────────────────┘
```

### Current Prototype State Machine Flow

The current app runs inside a single client state machine inside `src/components/pigeon/PigeonExperience.tsx`:

1. **`empty` stage:**
   - User sees Hero ("Get it off your phone."), Pigeon illustration, and dispatch dropzone.
   - User drops files, chooses files via file picker, or clicks "Paste text" to enter a note/URL.
2. **`selected` stage:**
   - File metadata (name, size, type) is displayed in `FileList`.
   - User can remove files or click "Send across".
3. **`uploading` stage:**
   - `setInterval` increments simulated `progress` state by 4% every 90ms.
   - Animated carrying pigeon moves between phone and laptop icons.
   - When progress reaches 100%, transitions to `ready` after 350ms.
4. **`ready` stage (`isRoom = true`):**
   - Displays `QrMoment` view with hardcoded Room Code `4K9X`, URL `pigeon.app/r/4K9X`, pseudorandom decorative QR matrix, and 10-minute countdown (starts at 582s).
   - "Waiting for your laptop..." status badge.
   - User can click simulated debug button: "Preview receiver".
5. **`connected` stage:**
   - Changes status label to "Laptop connected" with Wifi icon.
   - Receiver panel opens in the lower section.
   - User can click simulated debug button: "Complete transfer".
6. **`received` stage:**
   - Changes status label to "Delivered. Nice." with checkmark.
   - Receiver panel provides active "Download" and "Download all" buttons (toggles local ID state).
7. **`expired` stage:**
   - Triggered when countdown timer hits 0. Shows "This Pigeon flew home." and a reset button.
8. **`error` stage:**
   - Triggered if any file exceeds 250 MB (`incoming.some(file => file.size > 250 * 1024 * 1024)`). Shows "That one’s too heavy."

---

## 4. Page/Route Map

### Existing Routes

| Route Path | File Location           | Status | Description                                                                                                                                                                                                 |
| :--------- | :---------------------- | :----- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `__root`   | `src/routes/__root.tsx` | Active | Root layout. Injects Google Fonts (`Outfit`, `Figtree`), stylesheet URL, HTML `<head>` metadata, `QueryClientProvider`, and TanStack `<Outlet />`. Includes `NotFoundComponent` (404) and `ErrorComponent`. |
| `/`        | `src/routes/index.tsx`  | Active | Single page route. Defines SEO meta tags and mounts `<PigeonExperience />`.                                                                                                                                 |

### Missing Routes Required for Production

| Missing Route       | Proposed File Location          | Purpose                                                                                                                                                                                                                                                                        |
| :------------------ | :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/r/$code`          | `src/routes/r/$code.tsx`        | **Dedicated Receiver Page.** When a student points their laptop camera at the phone's QR code or enters the URL `pigeon.app/r/4K9X`, this route loads directly on the laptop, joins room `4K9X`, and presents the download interface without showing the sender upload screen. |
| `/api/rooms`        | Server Function / API           | Room creation, metadata lookup, and heartbeat polling/signaling.                                                                                                                                                                                                               |
| `/api/upload`       | Server Function / S3 Pre-signed | Secure temporary binary storage upload endpoint.                                                                                                                                                                                                                               |
| `/api/download/$id` | Server Function / S3 Pre-signed | Secure temporary binary storage download endpoint.                                                                                                                                                                                                                             |

---

## 5. Component Map

### Pigeon Brand & Domain Components

#### 1. `<Pigeon />`

- **Location:** `src/components/pigeon/PigeonCharacter.tsx` (Lines 10–64)
- **Role:** Pure SVG brand mascot. Built from geometric vector primitives (wedges, ellipses, circles, chevrons, rounded rectangles) that scale from a 24px icon up to a 600px hero poster element.
- **Props:** `className`, `mood` (`"idle" | "flying" | "carrying" | "waiting" | "done"`), `bodyClass`, `wingClass`, `beakClass`, `eyeClass`, `parcelClass`.
- **Dependencies:** `cn()` from `@/lib/utils`.
- **Used by:** `<PigeonMark />`, `<PigeonExperience />` (Hero section, Dropzone, Upload card, QR Art, Expired screen, Campaign section).
- **Audit Verdict:** **REUSE AS-IS.** Perfectly crafted, zero external dependencies, highly responsive.

#### 2. `<PigeonMark />`

- **Location:** `src/components/pigeon/PigeonCharacter.tsx` (Lines 67–73)
- **Role:** Compact brand lockup (36px wide badge) used in the sticky header, footer, and small chips.
- **Props:** `className`, `mood`.
- **Dependencies:** `<Pigeon />`, `cn()`.
- **Used by:** Sticky header and footer in `<PigeonExperience />`.
- **Audit Verdict:** **REUSE AS-IS.** Essential for brand consistency.

#### 3. `<PigeonExperience />`

- **Location:** `src/components/pigeon/PigeonExperience.tsx` (Lines 140–427)
- **Role:** Main page container orchestrating the state machine, sticky header, hero poster, dropzone, upload progress, QR view, campaign marketing sections, text modal, and footer.
- **Dependencies:** Lucide icons, shadcn `Button`, `Dialog`, `Progress`, `Tooltip`, `<Pigeon>`, `<PigeonMark>`, `<QrMoment>`, `<FileList>`, `<TransferVisual>`, `<PayloadPanel>`, `<CampaignSections>`.
- **Audit Verdict:** **MODIFY.** Needs to be decomposed. Currently contains 700 lines of mixed concerns: state management, layout, fake simulation timers, marketing sections, and sub-components. Should be refactored into focused sub-components while maintaining 100% of its existing visual layout and styles.

#### 4. `<QrArt />` & `useQrMatrix()`

- **Location:** `src/components/pigeon/PigeonExperience.tsx` (Lines 58–125)
- **Role:** Renders a 21x21 grid that looks visually like a stylized QR code with corner finders and a center pigeon icon.
- **Audit Verdict:** **REPLACE IN LOGIC / PRESERVE IN STYLING.**
  - **Critical Flaw:** The current QR is **not a real scannable QR code**. It generates pseudorandom decorative squares from the seed `"4K9X"`. Scanning it with a phone or laptop camera does nothing.
  - **Action:** Replace the random matrix generator with an actual ISO/IEC 18004 compliant QR code generator (e.g. `qrcode` or `qr-code-styling`), while retaining the bold navy border, acid/coral finder eyes, and centered geometric pigeon.

#### 5. `<FileList />` & `<FileGlyph />`

- **Location:** `src/components/pigeon/PigeonExperience.tsx` (Lines 84–88, 429–450)
- **Role:** Renders selected items with contextual icons (PDF, image, text, generic file), human-readable byte formatting (`formatSize`), and a delete/trash button.
- **Dependencies:** `FileGlyph`, `IconButton`, Lucide icons.
- **Audit Verdict:** **REUSE & ENHANCE.** Retain the exact visual presentation (`border-2 border-ink bg-paper p-3`); wire delete action to real state and real file storage abort controllers.

#### 6. `<QrMoment />`

- **Location:** `src/components/pigeon/PigeonExperience.tsx` (Lines 452–577)
- **Role:** The centerpiece poster screen shown when files are ready to be picked up. Displays the room code (`Room 4K9X`), share link, copy button, countdown timer, large QR card with "POINT CAMERA HERE" banner, receiver status badge, and receiver download panel.
- **Dependencies:** `<QrArt />`, `<Pigeon />`, `<IconButton />`, Lucide icons.
- **Audit Verdict:** **MODIFY.** Keep the entire visual composition, but decouple the receiver controls. In real usage, the sender waits for the receiver, while the receiver sees the download view upon scanning the code or navigating to `/r/$code`.

#### 7. `<TransferVisual />`

- **Location:** `src/components/pigeon/PigeonExperience.tsx` (Lines 579–602)
- **Role:** Side panel widget visualizing the transfer pipeline: `Phone ──[Pigeon]──> Laptop` with step indicators ("Tagged on phone", "In flight", "Landed on laptop").
- **Audit Verdict:** **REUSE AS-IS.** Clean, informative, and visually striking. Wire `stage` to real upload/transfer events.

#### 8. `<PayloadPanel />`

- **Location:** `src/components/pigeon/PigeonExperience.tsx` (Lines 604–625)
- **Role:** Acid-green summary card listing file count, up to 3 filenames, total payload size, and status ("Ready" / "Delivered").
- **Audit Verdict:** **REUSE AS-IS.** Excellent visual anchor.

#### 9. `<CampaignSections />`

- **Location:** `src/components/pigeon/PigeonExperience.tsx` (Lines 627–699)
- **Role:** Three editorial marketing poster sections below the fold:
  1. _"Why are you emailing yourself?"_ (Comparison of 7-step Gmail flow vs. Pigeon 3-step flow).
  2. _"Anything you send to yourself, you can Pigeon."_ (Coral background, phone-to-laptop illustration, bidirectional mention).
  3. _"01 Open / 02 Drop / 03 Scan"_ (Three-beat manifesto cards).
- **Audit Verdict:** **REUSE AS-IS.** Perfectly reinforces the brand identity, typography, and student-focused narrative.

---

### UI Primitives (`src/components/ui/`)

| Component      | File                             | Role & Purpose                                                                                                                                                         |
| :------------- | :------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`       | `src/components/ui/button.tsx`   | Primary button component with variants. Styled with sharp corners (`rounded-none`), heavy navy borders (`border-2 border-ink`), and bold hover transitions.             |
| `Dialog`       | `src/components/ui/dialog.tsx`   | Accessible Radix Dialog wrapper used for the text-pasting and note modal.                                                                                              |
| `Progress`     | `src/components/ui/progress.tsx` | Progress bar used during live file upload tracking, styled with electric acid-green fill.                                                                              |
| `Tooltip`      | `src/components/ui/tooltip.tsx`  | Accessible Radix Tooltip wrapper for action buttons and copy icons.                                                                                                    |
| `ScrollReveal` | `src/components/ui/ScrollReveal.tsx` | Viewport-triggered scroll reveal container using IntersectionObserver for progressive editorial section display.                                                   |

---

## 6. Styling System

### Design Philosophy & Aesthetic

Pigeon explicitly rejects generic SaaS aesthetics (floating purple gradients, soft pill buttons, enterprise dashboard tables, tiny gray typography). Instead, it adopts a **bold editorial, high-contrast, risograph/poster design language** tailored to university students and casual users.

### Color Palette Tokens (OKLCH)

```css
/* Defined in src/styles.css */
:root {
  --paper: oklch(0.96 0.018 83); /* #F7F3EB Warm cream/off-white background */
  --ink: oklch(0.25 0.06 264); /* #141C2E Deep navy/almost-black typography & borders */
  --cobalt: oklch(0.58 0.24 263); /* #1E5BFF Electric blue primary accent */
  --acid: oklch(0.89 0.23 123); /* #B9F227 High-voltage lime/green accent */
  --coral: oklch(0.72 0.16 32); /* #FF6347 Energetic coral highlight */
  --surface: oklch(1 0 0); /* #FFFFFF Crisp white for card interiors */
}
```

### Typography System

Fonts are loaded via Google Fonts CDN in `src/routes/__root.tsx`:

- **Display Font:** `Outfit` (Weights: 500, 600, 700, 800) — Used for oversized poster headlines (`text-5xl` up to `text-[8.5rem]`), numbers, and badges.
- **Body Font:** `Figtree` (Weights: 400, 500, 600, 700) — Used for UI descriptions, labels, and file lists.
- **Monospace:** System monospace font for Room URLs, codes (`4K9X`), and countdown timers.

### Distinctive Visual Rules

- **Heavy Borders:** `border-2 border-ink` (and `border-4 border-acid` on the QR card).
- **Crisp Geometry:** Predominantly `rounded-none` or `rounded-sm` (no bubbly pill corners).
- **Asymmetry & Rotation:** Intentional slight rotational offsets (`-rotate-1`, `rotate-6`, `rotate-12`, `-rotate-3`) giving an analog, printed-matter vibe.
- **Poster Shadow:** `@utility shadow-poster` producing a saturated ink shadow: `box-shadow: 0 16px 40px -28px color-mix(in oklab, var(--ink) 42%, transparent)`.
- **Status Eyebrow:** `@utility label` applying `text-[11px] font-bold uppercase tracking-[0.12em]`.

---

## 7. Animation System

All animations are configured in `src/styles.css` with accessibility fallbacks (`prefers-reduced-motion: reduce`).

### 1. `dispatch-dot`

- **Class:** `.dispatch-dot`
- **Keyframe:** `0%, 100% { transform: translateX(-62px); opacity: 0; } 20%, 80% { opacity: 1; } 50% { transform: translateX(62px); }`
- **Duration:** `2.6s ease-in-out infinite`
- **Usage:** Animated coral dot pulsating across the dropzone floor.

### 2. `pigeon-flight`

- **Class:** `.animate-pigeon`
- **Keyframe:** `0%, 100% { transform: translate3d(-14px, 5px, 0) rotate(-5deg); } 50% { transform: translate3d(14px, -5px, 0) rotate(3deg); }`
- **Duration:** `1.4s ease-in-out infinite`
- **Usage:** In `<TransferVisual />` during active transfer.

### 3. `qr-reveal`

- **Class:** `.qr-reveal`
- **Keyframe:** `from { opacity: 0; transform: scale(0.92) rotate(-2deg); } to { opacity: 1; transform: scale(1) rotate(0); }`
- **Duration:** `0.45s ease-out both`
- **Usage:** Snappy pop-in entrance when the QR code card mounts.

### 4. Continuous Ticker / Marquee

- **Class:** `.marquee` with Flex layout and whitespace nowrap.
- **Usage:** Cobalt banner repeating `"Open · Drop · Scan · Done ✦"` across the screen.

### 5. Pigeon SVG Character Hooks

The SVG mascot embeds animation class hooks:

- `pigeon-bob`: Used when `mood === "flying"`.
- `pigeon-wing` & `pigeon-wing-slow`: Applied to the wing group with `transformOrigin: "52px 54px"`.
- `pigeon-parcel`: Groups the parcel rectangle and ribbon.

---

## 8. State Management

### Current Implementation

State is entirely local to `src/components/pigeon/PigeonExperience.tsx`:

```ts
type Stage =
  "empty" | "selected" | "uploading" | "ready" | "connected" | "received" | "expired" | "error";

type Payload = {
  id: string;
  name: string;
  size: number;
  type: string;
  text?: string;
};
```

| State Variable | Type        | Purpose                                                          |
| :------------- | :---------- | :--------------------------------------------------------------- |
| `stage`        | `Stage`     | Drives screen mode (dropzone vs upload vs QR poster vs receiver) |
| `files`        | `Payload[]` | Array of selected file metadata or pasted text snippets          |
| `progress`     | `number`    | 0–100 upload percentage                                          |
| `seconds`      | `number`    | Countdown timer in seconds (defaults to 582s)                    |
| `textOpen`     | `boolean`   | Dialog modal visibility for text paste                           |
| `textValue`    | `string`    | Text content entered by user                                     |
| `copied`       | `boolean`   | 1.8s visual confirmation for link copying                        |
| `dragging`     | `boolean`   | Drag-over highlight on dropzone                                  |
| `downloaded`   | `string[]`  | Array of file IDs that have been marked as downloaded            |

### Global State Infrastructure (Present but Unused)

- `@tanstack/react-query` is instantiated in `src/router.tsx` and supplied via `<QueryClientProvider>` in `src/routes/__root.tsx`.
- **Recommendation:** Leverage TanStack Query for room lifecycle polling/mutations and SSE/WebSocket subscriptions.

---

## 9. Current File Sharing Logic

### File Selection

- Native `<input type="file" multiple>` triggered by buttons or drag-and-drop.
- Max file size guard: checks if any file exceeds 250 MB (`250 * 1024 * 1024 bytes`). If exceeded, switches `stage` to `"error"`.
- File objects are mapped to plain metadata objects:
  ```ts
  { id: `${file.name}-${file.lastModified}-${index}`, name: file.name, size: file.size, type: file.type }
  ```
- **Crucial Note:** The actual `File` binary objects / Blobs are **discarded** after mapping; only metadata is retained in state.

### Upload Simulation

- Triggered by "Send across".
- Uses a `window.setInterval` adding `+4` to `progress` every 90ms (~2.2 seconds total).
- No network requests, FormData, or WebSocket messages are dispatched.

### QR Code & Room

- Room Code is hardcoded: `const ROOM_CODE = "4K9X";`
- Room URL is hardcoded: `const ROOM_URL = "pigeon.app/r/4K9X";`
- QR code is a simulated 21x21 matrix using a pseudorandom hash algorithm (`useQrMatrix`).

### Download Action

- Clicking "Download" or "Download all" appends file IDs to the `downloaded` string array.
- No binary stream, blob URL, or `<a>` download attribute is triggered.

---

## 10. Existing Pigeon Character Implementation

- **Location:** `src/components/pigeon/PigeonCharacter.tsx`
- **Vector Anatomy:**
  - **Tail wedge:** Polygon path `M6 40 L44 50 L42 78 Z`
  - **Body:** Rotated ellipse `ellipse cx="62" cy="58" rx="32" ry="24" transform="rotate(-8 62 58)"`
  - **Head:** Circle `circle cx="92" cy="33" r="16"`
  - **Neck bridge:** Wedge path joining head to body
  - **Beak:** Triangle path `M106 30 L128 36 L106 42 Z` (accented with Acid lime)
  - **Eye:** Small circle `r="3.6"`
  - **Signature Wing:** Chevron polygon `M40 50 L88 60 L54 80 Z` with customizable fill and transform origin
  - **Legs:** Minimal stroke lines with angled toes
  - **Carrying Parcel:** Rounded rectangle with cross-ribbon paths
  - **Done Indicator:** Thick checkmark path `strokeWidth="8"`
- **Mood Variations:**
  - `idle`: Standing pose
  - `flying`: Triggers `pigeon-bob` and active wing animation
  - `carrying`: Displays parcel beneath legs
  - `waiting`: Slower wing flap
  - `done`: Displays acid-green completion checkmark
- **Lockup Mark:** `<PigeonMark />` encapsulates `<Pigeon />` with cobalt wing, acid beak, and paper eye inside a 36px wrapper.
- **Favicon:** `public/favicon.svg` renders an identical geometric silhouette against a cobalt rounded tile.

---

## 11. Dependencies

### Runtime Dependencies

- `@tanstack/react-start` (`1.168.32`) & `@tanstack/react-router` (`1.170.18`): Framework core.
- `@tanstack/react-query` (`^5.101.1`): Server cache & data sync.
- `react` & `react-dom` (`^19.2.0`): React 19 view layer.
- `tailwindcss` (`^4.2.1`) & `@tailwindcss/vite` (`^4.2.1`): Next-gen styling engine.
- `clsx` (`^2.1.1`) & `tailwind-merge` (`^3.5.0`): Utility class merger (`cn()`).
- `lucide-react` (`^0.575.0`): Icon set.
- `input-otp` (`^1.4.2`): Accessible OTP/code input (ideal for 4-letter room code entry on receiver).
- `@radix-ui/*`: 25 headless UI primitives powering the `components/ui/` library.
- `zod` (`^3.25.76`): Schema validation.
- `sonner` (`^2.0.7`): Toast notifications.
- `date-fns` (`^4.1.0`): Date manipulation.

### Dev Dependencies

- `@lovable.dev/vite-tanstack-config` (`^2.20.0`): Vite plugin bundle with Nitro SSR configuration.
- `nitro` (`3.0.260603-beta`): Bundled server runtime for TanStack Start.
- `typescript` (`^5.8.3`), `eslint` (`^9.32.0`), `prettier` (`^3.7.3`).

---

## 12. What Is Real vs Mock

| Feature / System            |    Real    |    Mock    | Notes                                                                                                                |
| :-------------------------- | :--------: | :--------: | :------------------------------------------------------------------------------------------------------------------- |
| **Brand Identity & Theme**  | **✓ Real** |            | Colors (OKLCH), typography (Outfit/Figtree), layouts, badges, and poster shadows are 100% real and production-ready. |
| **Pigeon Character**        | **✓ Real** |            | Pure SVG code with mood states, zero external imagery required.                                                      |
| **Dropzone & File Input**   | **✓ Real** |            | Native HTML file picker and drag-and-drop events work and parse file lists correctly.                                |
| **250 MB Size Limit Guard** | **✓ Real** |            | Correctly calculates bytes and triggers error state.                                                                 |
| **Text Sharing Dialog**     | **✓ Real** |            | Dialog pops up, accepts textarea input, creates a synthetic text payload.                                            |
| **Clipboard Copying**       | **✓ Real** |            | `navigator.clipboard.writeText` successfully copies room URL.                                                        |
| **Mobile Responsiveness**   | **✓ Real** |            | Single-column stacking, touch-friendly tap targets, readable type scales.                                            |
| **File Binary Upload**      |            | **✗ Mock** | No binary data is transferred; simulated via a JavaScript `setInterval` timer.                                       |
| **QR Code**                 |            | **✗ Mock** | Non-scannable decorative art generated with random boolean matrices.                                                 |
| **Room Code & URL**         |            | **✗ Mock** | Hardcoded to `"4K9X"` and `"pigeon.app/r/4K9X"`.                                                                     |
| **Countdown Timer**         |            | **✗ Mock** | Local client-side state decremented each second; does not reflect server TTL.                                        |
| **Receiver Connection**     |            | **✗ Mock** | Triggered by a manual "Preview receiver" button; no real peer/device pairing.                                        |
| **File Download**           |            | **✗ Mock** | Clicking download checks off the item in local state without serving bytes.                                          |
| **Backend & Storage**       |            | **✗ Mock** | Zero database, zero object storage (S3/R2), zero API routes.                                                         |

---

## 13. What Needs To Be Built

To evolve Pigeon from a visual prototype into a working utility while preserving 100% of the existing design:

1. **Scannable QR Code Generation:**
   - Integrate an ISO-compliant QR engine (`qrcode` or lightweight canvas renderer).
   - Encode the real window origin and active room path: `https://<domain>/r/<ROOM_CODE>`.
   - Embed the geometric Pigeon character in the center without obscuring error-correction data (Level H error correction).
2. **Dynamic 4-Character Room Codes:**
   - Server-side generator creating memorable, non-ambiguous 4-character codes (e.g. avoiding `0/O`, `1/I/L`).
   - Ephemeral room lifecycle: 10–15 minute time-to-live (TTL) with automatic expiry.
3. **Dedicated Receiver Route (`/r/$code`):**
   - Create route file `src/routes/r/$code.tsx`.
   - When opened via QR scan on a laptop or by entering the code, it immediately displays the active file list and download actions.
4. **Code Entry Input on Homepage:**
   - Add a subtle "Have a code? Enter it here" option on the homepage using the existing `input-otp` dependency to let laptop users without cameras type `4K9X`.
5. **Temporary Storage & Transfer Architecture:**
   - _Option A (Ephemeral Object Storage - Recommended for Reliability):_ Upload directly to S3 / Cloudflare R2 via pre-signed URLs with auto-deletion lifecycle (15-min TTL).
   - _Option B (Direct WebRTC P2P):_ Browser-to-browser WebRTC data channel with Pigeon server acting only as signaling relay.
6. **Real-Time Signaling / Status Sync:**
   - WebSockets, Server-Sent Events (SSE), or lightweight polling to update the sender screen when the receiver joins.
7. **Real File Download Handler:**
   - Stream actual file binaries with correct MIME types and `Content-Disposition: attachment; filename="..."`.

---

## 14. Recommended Implementation Order

### Phase 1: Real Scannable QR & Dynamic Room Codes (Zero Backend Required)

- Replace `useQrMatrix` with real scannable QR generation encoding `window.location.origin + "/r/" + roomCode`.
- Implement dynamic random 4-character room code generation.
- Ensure the center Pigeon logo is preserved while maintaining QR readability.

### Phase 2: Receiver Route & Navigation (`/r/$code`)

- Create `src/routes/r/$code.tsx` reusing the exact visual styling of `QrMoment`'s receiver panel.
- Add room code entry using `input-otp` on the home screen for manual code entry.

### Phase 3: Ephemeral File Storage & Transfer API

- Implement server functions / API routes in TanStack Start:
  - `POST /api/rooms`: Create room and allocate upload URLs.
  - `GET /api/rooms/:code`: Retrieve file metadata and room status.
  - Storage provider integration (Cloudflare R2 or S3 pre-signed URLs with 15-min auto-delete).
- Replace simulated `progress` timer with `XMLHttpRequest.upload` / `fetch` progress tracking real bytes.

### Phase 4: Real-time Signaling & Multi-Device Sync

- Implement Server-Sent Events (SSE) or WebSocket connection so the sender screen automatically detects when the receiver scans the QR code.
- Automatically advance sender from "Waiting for your laptop..." to "Laptop connected" and "Delivered" without manual button clicks.

### Phase 5: Real File Download & Cleanup

- Wire the receiver download buttons to trigger native file downloads (`window.open` or `<a download>`).
- Add "Download all as ZIP" option.
- Trigger automatic server-side room purge once files are fetched or upon expiration.

---

## IMPLEMENTATION STATUS (FEATURE-COMPLETE)

### Core Brand & UI

- [✓] Implemented: Pigeon geometric vector mascot with 5 moods and 3-tier avian kinematics (`src/components/pigeon/Pigeon.tsx`)
- [✓] Implemented: Pigeon compact lockup mark (`PigeonMark`)
- [✓] Implemented: Vector brand favicon (`public/favicon.svg`)
- [✓] Implemented: Tailwind v4 theme, OKLCH palette, and Outfit/Figtree typography
- [✓] Implemented: Hero poster section with oversized editorial layout
- [✓] Implemented: Animated ticker / marquee (`Open · Drop · Scan · Done`)
- [✓] Implemented: Campaign marketing sections below fold ("Why email yourself?", "Anything goes", "3-beat manifesto")
- [✓] Implemented: File list preview with contextual icons and size formatting
- [✓] Implemented: Mobile-first responsive layouts (tested 320px to 4K) with zero horizontal overflow
- [✓] Implemented: `prefers-reduced-motion` accessible fallbacks across all animations

### Interaction & Transfer Logic

- [✓] Implemented: Drag-and-drop and native file input selection handlers
- [✓] Implemented: 250 MB payload boundary enforcement
- [✓] Implemented: "Paste text / note" modal dialog with character counter
- [✓] Implemented: Copy room code to clipboard with visual confirmation
- [✓] Implemented: Real multipart file upload streaming with live `XMLHttpRequest.upload` progress tracking
- [✓] Implemented: Dynamic 5-character CSPRNG transfer codes (excluding ambiguous `0`, `1`, `I`, `O`)
- [✓] Implemented: Ephemeral chunked server filesystem storage (`backend/storage/{room_code}/`)
- [✓] Implemented: Real binary file downloads with byte-for-byte integrity and filename sanitization
- [✓] Implemented: Receiver status polling (`/api/rooms/{code}/status`) with auto-pairing transition
- [✓] Implemented: 10-minute (600s) TTL expiration with automated background disk purging
- [✓] Implemented: Multi-file transfers with collision-safe storage
- [✓] Implemented: Full test coverage (9 integration checks + 34 automated security & QA suite checks)

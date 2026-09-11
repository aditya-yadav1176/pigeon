# 🕊️ PIGEON — Instant Cross-Device File Drop

> **Get it off your phone. Onto your laptop. Without emailing yourself.**  
> *No login. No install. No permanent traces.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare Nitro](https://img.shields.io/badge/Cloudflare-Nitro%20SSR-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://nitro.unjs.io/)

---

## ⚡ The Everyday Problem

Every student and creator knows the daily friction:
- Assignment PDF on your phone ➔ College lab PC.
- Presentation slide on your phone ➔ Classroom digital board.
- Photos or video on your phone ➔ Friend's laptop.
- Snippet of code or URL on your laptop ➔ Phone.

You don't want to log into WhatsApp Web on a public machine. You don't want to email files to yourself. You don't want to install software or plug in a USB flash drive.

### The PIGEON Solution:
```
OPEN  ➔  DROP  ➔  CODE  ➔  DONE
```
1. **Open** `pigeon.app` on your phone.
2. **Drop** files or paste text.
3. **Receive** a clean, memorable 6-character pickup code (e.g. `K7M4-PQ`).
3. **Receive** a clean, memorable 5-character pickup code (e.g. `K7M4P`).
4. **Enter** the code on the laptop, lab PC, or smartboard to download.
5. **Auto-Purge**: Ephemeral 10-minute rooms destroy payload data automatically.

---

## ✨ Features

- **Zero Friction**: No account creation, passwords, phone numbers, or email sign-ups.
- **Bi-Directional**: Optimized for **Phone ➔ Laptop/Board**, with full support for **Laptop ➔ Phone**.
- **Any Payload**: Documents (PDF, PPT, DOCX), images, videos, audio, archives, and raw text/URLs.
- **Reactive State Machine**: Real-time feedback through `IDLE`, `FILE_SELECTED`, `UPLOADING`, `WAITING_FOR_RECEIVER`, `SENDING`, `RECEIVING`, and `SUCCESS`.
- **Parametric Vector Mascot**: Smooth, organic, animated Bézier SVG mascot with hardware-accelerated CSS keyframe choreography.
- **Ultra-Fast Edge Delivery**: Static asset compression, sub-second room routing, and server-side rendering support.
- **Accessibility First**: Respects `prefers-reduced-motion`, screen-reader ARIA states, high-contrast borders, and WCAG AA guidelines.

---

## 🎨 Visual Identity & Design System

PIGEON is built with a bold, tactile, editorial aesthetic inspired by physical posters, risograph prints, and modern consumer tech.

### Palette
| Color | Hex | Purpose |
| :--- | :--- | :--- |
| **Paper** | `#F8F1E5` | Warm, physical cream canvas background |
| **Ink** | `#13203E` | Deep navy editorial typography & heavy 2px borders |
| **Cobalt** | `#246AFF` | Primary high-voltage action blue & Pigeon mascot |
| **Wing Sky** | `#6F98E8` | Saturated, solid secondary blue wing tone |
| **Tail Mid** | `#4F83E8` | Layered secondary tail feather tone |
| **Acid Lime** | `#BFF100` | High-energy accent badges & beak highlight |
| **Coral** | `#F87962` | Delivery parcel payload accent & indicators |

### Typography
- **Headings**: `Outfit` — Geometric, confident, high-impact display lettering.
- **Body & Controls**: `Figtree` — Clean, legible, contemporary sans-serif.

---

## 🕊️ Reusable Mascot Component (`<Pigeon />`)

The Pigeon character is a modular, state-driven React + SVG component with organic Bézier geometry and physical weight physics:

```tsx
import { Pigeon, PigeonMark } from "@/components/pigeon";

// State-driven mascot with built-in flight & emotion physics
<Pigeon
  state="sending"        // "idle" | "dragging" | "uploading" | "ready" | "waiting" | "sending" | "receiving" | "success" | "error" | "expired"
  animated={true}
  className="w-48"
/>

// Compact logo badge for navigation & headers
<PigeonMark className="w-10 text-cobalt" />
```

### Motion Choreography
- **Idle**: Gentle breathing bob with resting wing and stoic eye blink.
- **Dragging**: Alert anticipation dip and perked wing ready pose.
- **Uploading / Flight**: Aerodynamic tucked legs, energetic wing stroke, and parcel swing.
- **Sending / Receiving**: 6-stage flight trajectory with takeoff crouch, power thrust, forward glide, air-braking flare, and touchdown impact compression.
- **Success**: Proud chest puff and spring checkmark pop.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) / React 19
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + CSS Variables
- **Icons**: [Lucide React](https://lucide.dev/)
- **UI Primitives**: [Radix UI](https://www.radix-ui.com/) (Dialog, Tooltip, Progress)
- **Deployment**: [Cloudflare Nitro](https://nitro.unjs.io/) Serverless Edge Workers

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) `>= 20.0.0`
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation
```bash
# Clone the repository
git clone https://github.com/aditya-yadav1176/pigeon.git
cd pigeon

# Install dependencies
npm install
```

### Development
```bash
# Start local development server with HMR
npm run dev
```
Open `http://localhost:3000` in your browser.

### Verification & Testing
```bash
# Typecheck
npx tsc --noEmit

# Lint code quality
npm run lint

# Production build
npm run build
```

---

## 📁 Project Structure

```
pigeon/
├── src/
│   ├── components/
│   │   ├── pigeon/                  # State-driven Pigeon mascot system
│   │   │   ├── Pigeon.tsx           # Reusable SVG character component
│   │   │   ├── PigeonCharacter.tsx  # Compatibility exports
│   │   │   ├── PigeonExperience.tsx # Complete file sharing product UX
│   │   │   ├── pigeon.css           # Hardware-accelerated motion engine
│   │   │   ├── pigeon.motion.ts     # State-to-animation choreography
│   │   │   └── pigeon.types.ts      # TypeScript definitions
│   │   └── ui/                      # Radix UI design system primitives
│   ├── services/
│   │   └── transfer/                # Room creation, file chunking, mock & API adapters
│   ├── routes/                      # TanStack file-based application routing
│   ├── styles.css                   # Global Tailwind v4 design tokens
│   └── lib/                         # Utility helpers
├── PIGEON_DESIGN_SYSTEM.md          # Visual identity specification & brand rules
├── ARCHITECTURE.md                  # Comprehensive technical audit & system architecture
└── package.json
```

---

## 📄 License

MIT © [Aditya Yadav](https://github.com/aditya-yadav1176)

# PIGEON Engineering Rules

## Project Identity

PIGEON is a temporary, no-login file transfer application designed for fast, seamless cross-device handoffs between phones and laptops.

## Current Stack

### Frontend:
- React 19
- TypeScript
- TanStack Start
- TanStack Router
- Vite
- Tailwind CSS v4

### Backend:
- Python 3.10+
- FastAPI

### Deployment:
- Vercel (Frontend)
- Render (Backend)

### Storage & State:
- Temporary backend filesystem (`backend/storage/{room_code}/`)
- In-memory room metadata manager (`RoomManager`)

## Product Flow

OPEN → DROP → CODE → CONNECT → DONE

## Transfer Codes

- Exactly 5 characters
- Unambiguous alphanumeric alphabet (excludes easily confused characters `0`, `1`, `I`, `O`)
- No hyphen
- Cryptographically secure generation (`secrets` module)

## Do Not Introduce

- Authentication or user accounts
- Databases (SQL/NoSQL)
- Supabase
- Firebase
- AWS S3 or Cloudflare R2
- WebSockets or WebRTC
- Unnecessary cloud services or external dependencies
- Unnecessary deployment platforms

## Product Rules

- Preserve the existing PIGEON visual identity and editorial design aesthetic.
- Preserve the geometric vector Pigeon mascot and its avian kinematics.
- Preserve the existing product flow: Send (drop files/text, get 5-character code) and Receive (enter code, download).
- Do not replace real functionality with fake/demo mocks.
- Keep the UI simple, high-contrast, and utility-first.
- Avoid unnecessary features or feature bloat.

## Engineering Rules

- Inspect the codebase before modifying any code or configuration.
- Prefer small, targeted, non-breaking changes.
- Avoid unnecessary architectural rewrites.
- Remove code only after verifying all repository-wide references.
- Keep TypeScript in strict mode with 0 type errors.
- Preserve existing working behavior and test baselines.
- Run complete validation (TypeScript, ESLint, frontend build, backend test suites) after making changes.

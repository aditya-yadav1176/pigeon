# PIGEON frontend experience

## Goal

Build PIGEON as a polished, mobile-first transfer utility and consumer brand—not a generic landing page. The core interaction will be immediately usable as a frontend prototype: choose or drop files, paste text, watch upload progress, reveal a branded QR room, and preview receiver/download states without login or fake server storage.

## Visual direction

- Follow the selected **Split poster dispatch** composition: warm paper base, deep navy type, dominant cobalt, with coral and acid-green used sparingly.
- Use **Outfit** for expressive display/interface typography and **Figtree** for supporting copy.
- Create an original geometric pigeon mark in code and use it selectively in the wordmark, transfer motion, empty states, and completion feedback.
- Preserve the asymmetrical editorial grid, oversized type, compact status labels, sharp poster-like color blocks, and restrained radii.
- Add purposeful motion for file → pigeon → QR, upload progress, connection, and delivery; respect reduced-motion preferences.

## Experience to build

1. **Landing / empty state**
   - Lead with “Get it off your phone.” and make PHONE → PIGEON → LAPTOP unmistakable.
   - Integrate a large, obvious drop target with **Choose files** and **Paste text**.
   - Keep “No account required” and “Temporary sharing” visible without technical copy.
2. **Selection and upload**
   - Support the native file picker, drag/drop, multiple files, and pasted text.
   - Show previews/metadata where the browser can provide them, remove-file actions, progress, and an honest cancel/error path.
3. **QR room / sender states**
   - Generate a branded demonstration room after the local upload animation.
   - Show a large QR-style room graphic, share link, copy/share actions, countdown, waiting state, receiver-connected state, and completion state.
4. **Receiver experience**
   - Provide a clean receiver view within the prototype, optimized for laptop screens.
   - Show single and multi-file layouts with Open, Download, and Download all actions plus visible downloading/completed feedback.
5. **Edge states**
   - Include file preview, text sharing, room expired, upload error, and reset/new-transfer flows.
6. **Brand sections**
   - Continue below the utility with poster-like campaign sections: “Why are you emailing yourself?”, the shorter Drop → Scan → Done comparison, and the secondary PC → phone direction.

## Responsive behavior

- **Mobile:** prioritize the sender journey, large touch targets, single-column poster composition, upload controls first, and a full-width QR moment.
- **Desktop:** retain the asymmetric selected grid and make the receiver/file actions immediately legible on lab PCs, laptops, and classroom displays.
- Verify at representative mobile and desktop sizes for clipping, overlap, touch sizing, and readable type.

## Technical details

- Keep the work frontend-only with React, TypeScript, TanStack Start, and Tailwind CSS v4.
- Build reusable components for the pigeon mark, transfer stage, upload area, QR room, file list, receiver panel, status timeline, and campaign sections.
- Use a local typed state machine for the requested product states; do not claim real transfer, storage, encryption, or deletion.
- Use semantic design tokens in the global stylesheet and load the chosen web fonts from the document head.
- Add route-specific PIGEON metadata and derive a matching favicon from the geometric mark.
- Keep temporary-room and storage boundaries clean so a real service can replace the simulated state later.

## Validation

- Check the current build diagnostics after implementation.
- Exercise file selection, text paste, progress, QR reveal, copy/share fallback, receiver, download, expired, error, and reset flows.
- Visually verify both mobile and desktop screens and confirm there are no console/runtime errors.

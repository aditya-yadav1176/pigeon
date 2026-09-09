/**
 * PigeonCharacter.tsx
 *
 * Re-exports the state-driven <Pigeon /> and <PigeonMark /> components
 * from ./Pigeon for seamless backwards compatibility across the application.
 */

export { Pigeon, PigeonMark } from "./Pigeon";
export type {
  Mood,
  PigeonMarkProps,
  PigeonPartProps,
  PigeonParts,
  PigeonProps,
  PigeonState,
} from "./pigeon.types";

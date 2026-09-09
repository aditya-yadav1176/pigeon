import type { SVGProps } from "react";

/**
 * Standard life-cycle states for Pigeon across the file-transfer journey.
 */
export type PigeonState =
  | "idle"
  | "dragging"
  | "uploading"
  | "ready"
  | "waiting"
  | "sending"
  | "receiving"
  | "success"
  | "error"
  | "expired";

/**
 * Visual mood of the Pigeon character.
 * Maps 1:1 with existing documented character silhouettes.
 */
export type Mood = "idle" | "flying" | "carrying" | "waiting" | "done";

/**
 * Customization props for individual anatomical parts of the Pigeon SVG.
 */
export interface PigeonPartProps {
  className?: string | undefined;
  fill?: string | undefined;
  stroke?: string | undefined;
  strokeWidth?: number | undefined;
  visible?: boolean | undefined;
}

/**
 * Granular control over individual anatomical sections of the character.
 */
export interface PigeonParts {
  tail?: PigeonPartProps | undefined;
  body?: PigeonPartProps | undefined;
  head?: PigeonPartProps | undefined;
  neck?: PigeonPartProps | undefined;
  beak?: PigeonPartProps | undefined;
  eye?: PigeonPartProps | undefined;
  wing?: PigeonPartProps | undefined;
  legs?: PigeonPartProps | undefined;
  parcel?: PigeonPartProps | undefined;
  checkmark?: PigeonPartProps | undefined;
}

/**
 * Primary props for the reusable <Pigeon /> component.
 */
export interface PigeonProps extends SVGProps<SVGSVGElement> {
  /**
   * Functional state of the pigeon in the transfer flow.
   * If provided, overrides/derives the appropriate visual mood.
   */
  state?: PigeonState | undefined;

  /**
   * Direct visual mood override.
   * Preserved for backwards compatibility with existing templates.
   */
  mood?: Mood | undefined;

  /** Top-level class name applied to the root SVG */
  className?: string | undefined;

  /** Tailwind / CSS classes for individual parts (shorthand API) */
  bodyClass?: string | undefined;
  wingClass?: string | undefined;
  beakClass?: string | undefined;
  eyeClass?: string | undefined;
  parcelClass?: string | undefined;
  checkmarkClass?: string | undefined;

  /** Detailed granular part overrides */
  parts?: PigeonParts | undefined;

  /** Whether animations (bobbing, flapping wing) are enabled. Default: true */
  animated?: boolean | undefined;

  /** Callback hook for animation completion (for chained state transitions in Phase 3) */
  onAnimationComplete?: (() => void) | undefined;

  /** If true, marks the SVG with aria-hidden="true" (purely decorative) */
  decorative?: boolean | undefined;

  /** Custom accessible label for screen readers. If omitted, derived from state */
  ariaLabel?: string | undefined;
}

/**
 * Props for the compact <PigeonMark /> logo lockup.
 */
export interface PigeonMarkProps {
  className?: string | undefined;
  mood?: Mood | undefined;
  state?: PigeonState | undefined;
  animated?: boolean | undefined;
  decorative?: boolean | undefined;
}


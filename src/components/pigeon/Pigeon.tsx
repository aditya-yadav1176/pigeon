import "./pigeon.css";

import { cn } from "@/lib/utils";
import type { Mood, PigeonMarkProps, PigeonProps, PigeonState } from "./pigeon.types";

/**
 * Maps the high-level transfer lifecycle state to the visual posture/mood
 * established in the original Pigeon design.
 */
function deriveMoodFromState(state?: PigeonState, explicitMood?: Mood): Mood {
  if (explicitMood) return explicitMood;
  if (!state) return "idle";

  switch (state) {
    case "sending":
      return "flying";
    case "dragging":
    case "uploading":
      return "carrying";
    case "ready":
    case "waiting":
    case "receiving":
      return "waiting";
    case "success":
      return "done";
    case "error":
    case "expired":
    case "idle":
    default:
      return "idle";
  }
}

/**
 * Derives a human-readable accessible label based on the current state.
 */
function getDefaultAriaLabel(state?: PigeonState, mood?: Mood): string {
  if (state) {
    switch (state) {
      case "idle":
        return "Pigeon: standing by";
      case "dragging":
        return "Pigeon: ready to receive file";
      case "uploading":
        return "Pigeon: uploading file";
      case "ready":
        return "Pigeon: ready for pickup";
      case "waiting":
        return "Pigeon: waiting for receiver";
      case "sending":
        return "Pigeon: file in flight";
      case "receiving":
        return "Pigeon: receiving file";
      case "success":
        return "Pigeon: transfer complete";
      case "error":
        return "Pigeon: transfer error";
      case "expired":
        return "Pigeon: room expired";
    }
  }

  switch (mood) {
    case "flying":
      return "Pigeon: flying";
    case "carrying":
      return "Pigeon: carrying file";
    case "waiting":
      return "Pigeon: waiting";
    case "done":
      return "Pigeon: done";
    case "idle":
    default:
      return "Pigeon";
  }
}

/**
 * PIGEON — The geometric brand character.
 *
 * Minimalist, geometric, deadpan/smug personality.
 * Constructed purely from vector primitives with parametric anatomy and
 * state-driven posture transitions.
 */
export function Pigeon({
  state,
  mood,
  className,
  bodyClass = "fill-current",
  wingClass = "fill-paper/25",
  beakClass = "fill-acid",
  eyeClass = "fill-paper",
  parcelClass = "fill-coral",
  checkmarkClass = "stroke-acid",
  parts,
  animated = true,
  onAnimationComplete,
  decorative = false,
  ariaLabel,
  ...svgProps
}: PigeonProps) {
  const effectiveMood = deriveMoodFromState(state, mood);

  // Determine active animations
  const isFlying = effectiveMood === "flying" || state === "sending";
  const isWaiting = effectiveMood === "waiting" || state === "ready" || state === "receiving";
  const isCarrying = effectiveMood === "carrying" || state === "dragging" || state === "uploading";
  const isDone = effectiveMood === "done" || state === "success";
  const isError = state === "error";

  const rootAnimationClass = animated
    ? cn(
        isFlying && "pigeon-bob",
        isError && "pigeon-error",
        state === "expired" && "opacity-70 transition-opacity duration-300",
      )
    : undefined;

  const wingAnimationClass = animated
    ? cn((isFlying || state === "uploading") && "pigeon-wing", isWaiting && "pigeon-wing-slow")
    : undefined;

  // Visual visibility toggles
  const showParcel = parts?.parcel?.visible ?? (isCarrying || state === "sending");
  const showCheckmark = parts?.checkmark?.visible ?? isDone;

  // Accessible attributes
  const accessibleAttributes = decorative
    ? { "aria-hidden": true as const }
    : {
        role: "img",
        "aria-label": ariaLabel ?? getDefaultAriaLabel(state, effectiveMood),
      };

  return (
    <svg
      viewBox="0 0 130 112"
      className={cn("block h-auto w-full overflow-visible", rootAnimationClass, className)}
      onAnimationEnd={onAnimationComplete}
      {...accessibleAttributes}
      {...svgProps}
    >
      {/* 1. Tail wedge */}
      {parts?.tail?.visible !== false && (
        <path
          d="M6 40 L44 50 L42 78 Z"
          className={cn(bodyClass, "opacity-90", parts?.tail?.className)}
          fill={parts?.tail?.fill}
          stroke={parts?.tail?.stroke}
          strokeWidth={parts?.tail?.strokeWidth}
        />
      )}

      {/* 2. Body ellipse */}
      {parts?.body?.visible !== false && (
        <ellipse
          cx="62"
          cy="58"
          rx="32"
          ry="24"
          transform="rotate(-8 62 58)"
          className={cn(bodyClass, parts?.body?.className)}
          fill={parts?.body?.fill}
          stroke={parts?.body?.stroke}
          strokeWidth={parts?.body?.strokeWidth}
        />
      )}

      {/* 3. Head circle */}
      {parts?.head?.visible !== false && (
        <circle
          cx="92"
          cy="33"
          r="16"
          className={cn(bodyClass, parts?.head?.className)}
          fill={parts?.head?.fill}
          stroke={parts?.head?.stroke}
          strokeWidth={parts?.head?.strokeWidth}
        />
      )}

      {/* 4. Neck bridge */}
      {parts?.neck?.visible !== false && (
        <path
          d="M74 40 L100 44 L86 62 Z"
          className={cn(bodyClass, parts?.neck?.className)}
          fill={parts?.neck?.fill}
          stroke={parts?.neck?.stroke}
          strokeWidth={parts?.neck?.strokeWidth}
        />
      )}

      {/* 5. Beak wedge */}
      {parts?.beak?.visible !== false && (
        <path
          d="M106 30 L128 36 L106 42 Z"
          className={cn(beakClass, parts?.beak?.className)}
          fill={parts?.beak?.fill}
          stroke={parts?.beak?.stroke}
          strokeWidth={parts?.beak?.strokeWidth}
        />
      )}

      {/* 6. Eye unblinking circle */}
      {parts?.eye?.visible !== false && (
        <circle
          cx="96"
          cy="29"
          r="3.6"
          className={cn(eyeClass, parts?.eye?.className)}
          fill={parts?.eye?.fill}
          stroke={parts?.eye?.stroke}
          strokeWidth={parts?.eye?.strokeWidth}
        />
      )}

      {/* 7. Signature chevron wing */}
      {parts?.wing?.visible !== false && (
        <g
          className={cn(wingAnimationClass, parts?.wing?.className)}
          style={{ transformOrigin: "52px 54px" }}
        >
          <path
            d="M40 50 L88 60 L54 80 Z"
            className={cn(wingClass)}
            fill={parts?.wing?.fill}
            stroke={parts?.wing?.stroke}
            strokeWidth={parts?.wing?.strokeWidth}
          />
        </g>
      )}

      {/* 8. Minimalist line legs */}
      {parts?.legs?.visible !== false && (
        <g className={parts?.legs?.className}>
          <path
            d="M60 80 L58 96 M58 96 L50 100 M58 96 L66 100"
            className="stroke-current"
            strokeWidth={parts?.legs?.strokeWidth ?? 4}
            strokeLinecap="round"
            fill="none"
            stroke={parts?.legs?.stroke}
          />
          <path
            d="M76 78 L76 94 M76 94 L68 98 M76 94 L84 98"
            className="stroke-current opacity-60"
            strokeWidth={parts?.legs?.strokeWidth ?? 4}
            strokeLinecap="round"
            fill="none"
            stroke={parts?.legs?.stroke}
          />
        </g>
      )}

      {/* 9. Parcel (active carrying / transfer state) */}
      {showParcel && (
        <g
          className={cn(
            "pigeon-parcel",
            animated && "pigeon-parcel-swing",
            parts?.parcel?.className,
          )}
        >
          <rect
            x="46"
            y="92"
            width="30"
            height="24"
            rx="3"
            className={parcelClass}
            fill={parts?.parcel?.fill}
            stroke={parts?.parcel?.stroke}
            strokeWidth={parts?.parcel?.strokeWidth}
          />
          <path d="M46 100 h30 M61 92 v24" className="stroke-paper" strokeWidth="3" fill="none" />
        </g>
      )}

      {/* 10. Success checkmark */}
      {showCheckmark && (
        <path
          d="M104 66 l8 9 l16 -20"
          className={cn(
            checkmarkClass,
            animated && "pigeon-checkmark",
            parts?.checkmark?.className,
          )}
          strokeWidth={parts?.checkmark?.strokeWidth ?? 8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          stroke={parts?.checkmark?.stroke}
        />
      )}
    </svg>
  );
}

/**
 * Compact lockup mark used in the nav, footer, and small chips.
 */
export function PigeonMark({
  className,
  mood = "idle",
  state,
  animated = false,
  decorative = true,
}: PigeonMarkProps) {
  return (
    <span className={cn("block w-9 shrink-0", className)}>
      <Pigeon
        mood={mood}
        state={state}
        animated={animated}
        decorative={decorative}
        wingClass="fill-cobalt"
        beakClass="fill-acid"
        eyeClass="fill-paper"
      />
    </span>
  );
}

export type {
  Mood,
  PigeonMarkProps,
  PigeonPartProps,
  PigeonParts,
  PigeonProps,
  PigeonState,
} from "./pigeon.types";

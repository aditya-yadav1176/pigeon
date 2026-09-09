import "./pigeon.css";

import type React from "react";
import { cn } from "@/lib/utils";
import {
  deriveMoodFromState,
  getDefaultAriaLabel,
  getPigeonMotionClasses,
  isSequenceAnimation,
} from "./pigeon.motion";
import type { PigeonMarkProps, PigeonProps } from "./pigeon.types";

/**
 * PIGEON — The geometric brand character.
 *
 * Minimalist, geometric, deadpan/smug personality.
 * Constructed purely from vector primitives with parametric anatomy and
 * state-driven posture transitions and physical motion engine (Phase 3).
 */
export function Pigeon({
  state,
  mood,
  className,
  bodyClass,
  wingClass,
  beakClass,
  eyeClass,
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
  const motion = getPigeonMotionClasses(state, mood, animated);

  // Visual visibility toggles
  const showParcel =
    parts?.parcel?.visible ??
    (effectiveMood === "carrying" ||
      state === "dragging" ||
      state === "uploading" ||
      state === "sending");

  const showCheckmark =
    parts?.checkmark?.visible ?? (effectiveMood === "done" || state === "success");

  // Accessible attributes
  const accessibleAttributes = decorative
    ? { "aria-hidden": true as const }
    : {
        role: "img",
        "aria-label": ariaLabel ?? getDefaultAriaLabel(state, effectiveMood),
      };

  const handleAnimationEnd = (e: React.AnimationEvent<SVGSVGElement>) => {
    if (onAnimationComplete && isSequenceAnimation(e.animationName)) {
      onAnimationComplete();
    }
  };

  return (
    <svg
      viewBox="0 0 130 112"
      className={cn("block h-auto w-full overflow-visible", className)}
      onAnimationEnd={handleAnimationEnd}
      {...accessibleAttributes}
      {...svgProps}
    >
      {/* Animated Stage Group: handles body lift, bob, sending, receiving, error, and expired transforms */}
      <g className={motion.stageClass}>
        {/* 1. Tail: Layered organic curved feathers (Solid fills, 100% opacity) */}
        {parts?.tail?.visible !== false && (
          <g
            className={parts?.tail?.className}
            stroke={parts?.tail?.stroke}
            strokeWidth={parts?.tail?.strokeWidth}
          >
            {/* Primary top feather: #246AFF */}
            <path
              d="M 42 50 C 30 50 18 54 8 60 C 8 61.5 9.5 62.8 11.5 62.8 C 21 62.8 31 61 41 58 Z"
              fill={parts?.tail?.fill ?? "#246AFF"}
            />
            {/* Middle feather: #4F83E8 (Solid secondary blue) */}
            <path
              d="M 40 56 C 28 58 19 62 11 68 C 11.5 69.5 13 70.2 14.8 70 C 23 69 32 66.5 39 64 Z"
              fill="#4F83E8"
            />
            {/* Under covert feather: #246AFF */}
            <path
              d="M 38 62 C 29 65 22 69 16 74 C 17 75.2 18.5 75.5 20 75 C 27 73 33 70 38 67 Z"
              fill={parts?.tail?.fill ?? "#246AFF"}
            />
          </g>
        )}

        {/* 2. Body, Head & Neck: Unified organic avian contour (Primary Cobalt #246AFF, 100% opacity) */}
        {parts?.body?.visible !== false &&
          parts?.head?.visible !== false &&
          parts?.neck?.visible !== false && (
            <path
              d="M 88 17 C 96 17 103.5 21.5 105.5 28.5 C 103.5 32 101 37.5 97 41.5 C 94 48 91 58 82 66 C 72 74 58 75.5 45 71.5 C 37 67.5 33 59.5 35 53.5 C 43 45.5 55 39.5 67 33.5 C 75 25.5 81 19 88 17 Z"
              className={cn(bodyClass, parts?.body?.className ?? parts?.head?.className)}
              fill={parts?.body?.fill ?? parts?.head?.fill ?? "#246AFF"}
              stroke={parts?.body?.stroke ?? parts?.head?.stroke}
              strokeWidth={parts?.body?.strokeWidth ?? parts?.head?.strokeWidth}
            />
          )}

        {/* 3. Beak: Refined curved beak (Acid Lime #BFF100, 100% opacity) */}
        {parts?.beak?.visible !== false && (
          <path
            d="M 105 28.5 C 112 29.8 119 32.2 123.5 34 C 118.5 36.8 111.5 38.8 104.5 38.8 C 104.8 35.5 104.9 32 105 28.5 Z"
            className={cn(beakClass, parts?.beak?.className)}
            fill={parts?.beak?.fill ?? "#BFF100"}
            stroke={parts?.beak?.stroke}
            strokeWidth={parts?.beak?.strokeWidth}
          />
        )}

        {/* 4. Eye: Unblinking stoic eye (Cream #F8F1E5, 100% opacity) */}
        {parts?.eye?.visible !== false && (
          <circle
            cx="94.5"
            cy="27"
            r="3.4"
            className={cn(eyeClass, motion.eyeClass, parts?.eye?.className)}
            fill={parts?.eye?.fill ?? "#F8F1E5"}
            stroke={parts?.eye?.stroke}
            strokeWidth={parts?.eye?.strokeWidth}
          />
        )}

        {/* 5. Wing: Curved aerodynamic blade (Solid Lighter Blue #6F98E8, 100% opacity) */}
        {parts?.wing?.visible !== false && (
          <g
            className={cn(motion.wingClass, parts?.wing?.className)}
            style={{ transformOrigin: "65px 42px" }}
          >
            <path
              d="M 66 41 C 78 43 85 51 83 59 C 80 66 67 74 46 78 C 50 72 55.5 67 56 62 C 57.5 53.5 60.5 45.5 66 41 Z"
              className={cn(wingClass)}
              fill={parts?.wing?.fill ?? "#6F98E8"}
              stroke={parts?.wing?.stroke}
              strokeWidth={parts?.wing?.strokeWidth}
            />
          </g>
        )}

        {/* 6. Legs: Shortened organic legs (~19% reduction), compact & grounded, 100% opacity */}
        {parts?.legs?.visible !== false && (
          <g
            className={cn(motion.legsClass, parts?.legs?.className)}
            strokeWidth={parts?.legs?.strokeWidth ?? 3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            {/* Rear leg: #5D87D9 (Solid secondary blue, 100% opacity) */}
            <path
              d="M 76 72 Q 74.5 81 73 87.5 M 73 87.5 Q 67.5 89 62 89 M 73 87.5 Q 69 91.5 64 92.5 M 73 87.5 Q 76.5 89.5 80 89"
              stroke={parts?.legs?.stroke ?? "#5D87D9"}
            />
            {/* Front leg: #246AFF (Primary cobalt, 100% opacity) */}
            <path
              d="M 64 74 Q 62.5 83 61 89 M 61 89 Q 55.5 91 50 91 M 61 89 Q 57 93.5 52 94.5 M 61 89 Q 64.5 91.5 68 91"
              stroke={parts?.legs?.stroke ?? "#246AFF"}
            />
          </g>
        )}

        {/* 7. Parcel (carrying / transfer states) */}
        {showParcel && (
          <g className={cn("pigeon-parcel", motion.parcelClass, parts?.parcel?.className)}>
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

        {/* 8. Success checkmark */}
        {showCheckmark && (
          <path
            d="M104 66 l8 9 l16 -20"
            className={cn(checkmarkClass, motion.checkmarkClass, parts?.checkmark?.className)}
            strokeWidth={parts?.checkmark?.strokeWidth ?? 8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            stroke={parts?.checkmark?.stroke}
          />
        )}
      </g>
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
      <Pigeon mood={mood} state={state} animated={animated} decorative={decorative} />
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

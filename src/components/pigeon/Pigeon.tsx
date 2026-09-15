import "./pigeon.css";

import { useId } from "react";
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
 * PIGEON — The signature vector brand character.
 *
 * Stylized, cohesive avian geometry with natural posture, dimensional shading,
 * 3-tier aerodynamic wing construction, iconic neck iridescence, and
 * state-driven kinematic physical motion (Phase 14).
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
  const rawId = useId();
  const gradientId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  // Custom fill class detections
  const hasCustomBodyFill = Boolean(bodyClass && bodyClass.includes("fill-"));
  const hasCustomWingFill = Boolean(wingClass && wingClass.includes("fill-"));
  const hasCustomBeakFill = Boolean(beakClass && beakClass.includes("fill-"));

  // Visual visibility toggles
  const showParcel =
    parts?.parcel?.visible ??
    (effectiveMood === "carrying" ||
      state === "dragging" ||
      state === "uploading" ||
      state === "sending");

  const showCheckmark =
    parts?.checkmark?.visible ??
    (effectiveMood === "done" || state === "success");

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
      <defs>
        {/* Torso & Head Dimensional Gradient: Vibrant crest into deep rich cobalt flank */}
        <linearGradient
          id={`pigeon-body-${gradientId}`}
          x1="15%"
          y1="0%"
          x2="45%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#3C7DFF" />
          <stop offset="42%" stopColor="#246AFF" />
          <stop offset="100%" stopColor="#154ABB" />
        </linearGradient>

        {/* Signature Iridescent Neck Sheen: Subtle acid/emerald reflection band */}
        <linearGradient
          id={`pigeon-neck-sheen-${gradientId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#BFF100" stopOpacity="0.32" />
          <stop offset="50%" stopColor="#29E0B0" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#246AFF" stopOpacity="0" />
        </linearGradient>

        {/* Primary Flight Feathers (Layer 1): Deep aerodynamic contrast */}
        <linearGradient
          id={`pigeon-wing-primary-${gradientId}`}
          x1="20%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#4A7DE8" />
          <stop offset="100%" stopColor="#1B4EC2" />
        </linearGradient>

        {/* Secondary Coverts (Layer 2): Mid-tone tiered feather layer */}
        <linearGradient
          id={`pigeon-wing-secondary-${gradientId}`}
          x1="0%"
          y1="0%"
          x2="70%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#719BF2" />
          <stop offset="100%" stopColor="#3F73DE" />
        </linearGradient>

        {/* Shoulder / Mantle (Layer 3): Smooth highlight cap */}
        <linearGradient
          id={`pigeon-wing-shoulder-${gradientId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#8CADF7" />
          <stop offset="100%" stopColor="#5588EC" />
        </linearGradient>

        {/* Tail Gradient */}
        <linearGradient
          id={`pigeon-tail-${gradientId}`}
          x1="90%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#246AFF" />
          <stop offset="100%" stopColor="#1240A8" />
        </linearGradient>

        {/* Beak Upper Gradient: Acid lime with subtle highlight */}
        <linearGradient
          id={`pigeon-beak-upper-${gradientId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#D2FF24" />
          <stop offset="100%" stopColor="#B4E800" />
        </linearGradient>

        {/* Beak Lower Shading */}
        <linearGradient
          id={`pigeon-beak-lower-${gradientId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#A2D600" />
          <stop offset="100%" stopColor="#8CB800" />
        </linearGradient>
      </defs>

      {/* Animated Stage Group: handles body lift, bob, flight sequence, and reaction transforms */}
      <g className={motion.stageClass}>
        {/* 1. Tail: 3 sculpted, tiered aerodynamic rectrix feathers */}
        {parts?.tail?.visible !== false && (
          <g
            className={parts?.tail?.className}
            stroke={parts?.tail?.stroke}
            strokeWidth={parts?.tail?.strokeWidth}
          >
            {/* Primary top rectrix */}
            <path
              d="M 42 50 C 30 50 18 54 8 60 C 8 61.5 9.5 62.8 11.5 62.8 C 21 62.8 31 61 41 58 Z"
              fill={parts?.tail?.fill ?? `url(#pigeon-tail-${gradientId})`}
            />
            {/* Middle rectrix with tonal separation */}
            <path
              d="M 40 56 C 28 58 19 62 11 68 C 11.5 69.5 13 70.2 14.8 70 C 23 69 32 66.5 39 64 Z"
              fill={parts?.tail?.fill ?? "#3B72E2"}
            />
            {/* Under covert rectrix with deep shadow */}
            <path
              d="M 38 62 C 29 65 22 69 16 74 C 17 75.2 18.5 75.5 20 75 C 27 73 33 70 38 67 Z"
              fill={parts?.tail?.fill ?? "#1C4EB8"}
            />
            {/* Subtle tail feather separation quills */}
            <path
              d="M 28 56 L 16 62.5 M 26 62 L 18 67.5"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.8"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {/* 2. Body, Head & Proud Chest: Organic avian contour with dimensional volume */}
        {parts?.body?.visible !== false &&
          parts?.head?.visible !== false &&
          parts?.neck?.visible !== false && (
            <g>
              {/* Base body contour */}
              <path
                d="M 88 17 C 96 17 103.5 21.5 105.5 28.5 C 103.5 32 101 37.5 97 41.5 C 94 48 91 58 82 66 C 72 74 58 75.5 45 71.5 C 37 67.5 33 59.5 35 53.5 C 43 45.5 55 39.5 67 33.5 C 75 25.5 81 19 88 17 Z"
                className={cn(
                  bodyClass,
                  parts?.body?.className ?? parts?.head?.className,
                )}
                fill={
                  parts?.body?.fill ??
                  parts?.head?.fill ??
                  (hasCustomBodyFill
                    ? undefined
                    : `url(#pigeon-body-${gradientId})`)
                }
                stroke={parts?.body?.stroke ?? parts?.head?.stroke}
                strokeWidth={
                  parts?.body?.strokeWidth ?? parts?.head?.strokeWidth
                }
              />

              {/* Signature iridescent neck sheen band */}
              {parts?.neckBand?.visible !== false && (
                <path
                  d="M 97 34 C 101 37.5 101.5 43 97 47 C 93 50.5 87 53 84 57 C 84 52 86 46 89 42 C 92 38 95 35.5 97 34 Z"
                  fill={`url(#pigeon-neck-sheen-${gradientId})`}
                  className={parts?.neckBand?.className}
                />
              )}

              {/* Subtle breast curvature highlight */}
              <path
                d="M 96 42 C 94 48 90 57 82 65 C 74 72 63 74 51 72 C 60 72 71 68 78 62 C 85 55 89 47 92 41 C 93.5 41.2 95 41.5 96 42 Z"
                fill="#FFFFFF"
                fillOpacity="0.09"
              />
            </g>
          )}

        {/* 3. Beak & Cere: Upper & lower mandibles with characteristic soft cere bump */}
        {parts?.beak?.visible !== false && (
          <g className={cn(beakClass, parts?.beak?.className)}>
            {/* Upper mandible */}
            <path
              d="M 105 28.5 C 112 29.8 119 32.2 123.5 34 C 118 35.8 111.5 36.8 104.8 36.8 Z"
              fill={
                parts?.beak?.fill ??
                (hasCustomBeakFill
                  ? undefined
                  : `url(#pigeon-beak-upper-${gradientId})`)
              }
              stroke={parts?.beak?.stroke}
              strokeWidth={parts?.beak?.strokeWidth}
            />
            {/* Lower mandible / mouth line shadow */}
            <path
              d="M 104.8 36.8 C 111 36.8 116.5 35.8 120.5 34.6 C 116.5 36.8 110.5 38.8 104.5 38.8 C 104.7 38.1 104.8 37.4 104.8 36.8 Z"
              fill={
                parts?.beak?.fill ??
                (hasCustomBeakFill
                  ? undefined
                  : `url(#pigeon-beak-lower-${gradientId})`)
              }
            />
            {/* Trademark pigeon cere (soft waxy node at base of beak) */}
            {parts?.cere?.visible !== false && (
              <path
                d="M 104.2 28.2 C 106.8 27.8 108.5 29.2 107.8 31.4 C 106.2 31.8 104.6 30.6 104.2 28.2 Z"
                fill={parts?.cere?.fill ?? "#F8F4EC"}
                stroke="rgba(11,25,44,0.14)"
                strokeWidth="0.5"
              />
            )}
          </g>
        )}

        {/* 4. Eye: Dimensional stoic eye with orbital ring, dark pupil & specular spark */}
        {parts?.eye?.visible !== false && (
          <g
            className={cn(eyeClass, motion.eyeClass, parts?.eye?.className)}
            style={{ transformOrigin: "94.5px 27px" }}
          >
            {/* Outer eye / orbital ring */}
            <circle
              cx="94.5"
              cy="27"
              r="4.2"
              fill={parts?.eye?.fill ?? "#FAF5EE"}
              stroke="rgba(11, 25, 44, 0.16)"
              strokeWidth="0.8"
            />
            {/* Subtle characteristic coral iris rim */}
            <circle
              cx="94.5"
              cy="27"
              r="3.2"
              fill="#FFA590"
              fillOpacity="0.45"
            />
            {/* Dark stoic pupil */}
            <circle cx="94.5" cy="27" r="2.2" fill="#0B192C" />
            {/* Crisp specular spark */}
            <circle cx="95.3" cy="26" r="0.75" fill="#FFFFFF" />
          </g>
        )}

        {/* 5. Wing: 3-Tier Layered Aerodynamic Wing (Mantle + Coverts + Flight Remiges) */}
        {parts?.wing?.visible !== false && (
          <g
            className={cn(motion.wingClass, parts?.wing?.className)}
            style={{ transformOrigin: "65px 42px" }}
          >
            {/* Layer 1: Primary Flight Remiges (Bottom tier, deep reaching feathers) */}
            <path
              d="M 64 42 C 78 44 87 53 84 62 C 80 70 65 78 44 82 C 49 76 53 71 54 65 C 55.5 55 58.5 46 64 42 Z"
              className={cn(wingClass)}
              fill={
                parts?.wing?.fill ??
                (hasCustomWingFill
                  ? undefined
                  : `url(#pigeon-wing-primary-${gradientId})`)
              }
              stroke={parts?.wing?.stroke}
              strokeWidth={parts?.wing?.strokeWidth}
            />

            {/* Layer 2: Secondary Coverts (Middle scalloped tier) */}
            <path
              d="M 65 42 C 76 44 82 50 80 57 C 76 63 67 69 49 73 C 53 67 56 63 57 58 C 58 51 60 45 65 42 Z"
              className={cn(hasCustomWingFill ? wingClass : undefined)}
              fill={
                parts?.wingCoverts?.fill ??
                (hasCustomWingFill
                  ? undefined
                  : `url(#pigeon-wing-secondary-${gradientId})`)
              }
              opacity={hasCustomWingFill ? 0.88 : 1}
            />

            {/* Layer 3: Wing Mantle & Shoulder Cap (Top curved protective cap) */}
            <path
              d="M 66 41 C 74 42 79 46 78 51 C 75 56 68 60 56 63 C 58.5 57 60.5 51 62 46 C 63 43 64.5 41.5 66 41 Z"
              className={cn(hasCustomWingFill ? wingClass : undefined)}
              fill={
                parts?.wing?.fill ??
                (hasCustomWingFill
                  ? undefined
                  : `url(#pigeon-wing-shoulder-${gradientId})`)
              }
              opacity={hasCustomWingFill ? 0.94 : 1}
            />

            {/* Subtle feather quill detailing accents */}
            <path
              d="M 62 48 C 66 54 71 60 74 62 M 58 53 C 61 58 64 64 66 66"
              stroke="#FFFFFF"
              strokeWidth="0.8"
              strokeOpacity="0.22"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* 6. Legs: Articulated grounded feet with claws, tucked in flight */}
        {parts?.legs?.visible !== false && (
          <g
            className={cn(motion.legsClass, parts?.legs?.className)}
            strokeWidth={parts?.legs?.strokeWidth ?? 3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            {/* Rear leg & claws */}
            <path
              d="M 76 72 Q 74.5 81 73 87 M 73 87 L 64 88.5 M 73 87 L 66 92 M 73 87 L 78 88.5"
              stroke={parts?.legs?.stroke ?? "#4D77CC"}
            />
            {/* Front leg & claws */}
            <path
              d="M 64 74 Q 62.5 83 61 89 M 61 89 L 52 90.5 M 61 89 L 54 94 M 61 89 L 66 90.5"
              stroke={parts?.legs?.stroke ?? "#1E50C2"}
            />
          </g>
        )}

        {/* 7. Parcel (carrying / transfer states): 3D beveled parcel with ribbon */}
        {showParcel && (
          <g
            className={cn(
              "pigeon-parcel",
              motion.parcelClass,
              parts?.parcel?.className,
            )}
          >
            {/* Soft parcel drop shadow */}
            <rect
              x="47"
              y="93"
              width="28"
              height="23"
              rx="3"
              fill="#000000"
              fillOpacity="0.14"
            />
            {/* Parcel box */}
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
            {/* Top bevel highlight */}
            <path
              d="M46 95 h30"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="1.5"
            />
            {/* Signature parcel ribbon */}
            <path
              d="M46 102 h30 M61 92 v24"
              className="stroke-paper"
              strokeWidth="2.5"
              fill="none"
            />
          </g>
        )}

        {/* 8. Success checkmark: Crisp spring reveal */}
        {showCheckmark && (
          <path
            d="M103 66 l8 9 l17 -21"
            className={cn(
              checkmarkClass,
              motion.checkmarkClass,
              parts?.checkmark?.className,
            )}
            strokeWidth={parts?.checkmark?.strokeWidth ?? 7.5}
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
      <Pigeon
        mood={mood}
        state={state}
        animated={animated}
        decorative={decorative}
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

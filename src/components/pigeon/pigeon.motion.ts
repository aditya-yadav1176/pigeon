import type { Mood, PigeonState } from "./pigeon.types";

export interface PigeonMotionClasses {
  stageClass?: string | undefined;
  wingClass?: string | undefined;
  eyeClass?: string | undefined;
  legsClass?: string | undefined;
  parcelClass?: string | undefined;
  checkmarkClass?: string | undefined;
}

/**
 * Maps transfer lifecycle state to the visual silhouette / mood.
 */
export function deriveMoodFromState(
  state?: PigeonState | undefined,
  explicitMood?: Mood | undefined,
): Mood {
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
 * Returns whether a given animation name corresponds to a finite state transition sequence
 * that should trigger `onAnimationComplete`.
 */
export function isSequenceAnimation(animationName: string): boolean {
  return (
    animationName === "pigeon-sending-sequence" ||
    animationName === "pigeon-receiving-sequence" ||
    animationName === "pigeon-success-sequence" ||
    animationName === "pigeon-error-shake" ||
    animationName === "pigeon-expired-retreat"
  );
}

/**
 * Generates the motion classes for all anatomical parts based on state, mood, and animated flag.
 */
export function getPigeonMotionClasses(
  state?: PigeonState | undefined,
  mood?: Mood | undefined,
  animated = true,
): PigeonMotionClasses {
  if (!animated) {
    return {
      stageClass: state === "expired" ? "opacity-65" : undefined,
      legsClass: state === "sending" || mood === "flying" ? "pigeon-legs-flying" : undefined,
    };
  }

  const effectiveMood = deriveMoodFromState(state, mood);

  // If explicit state is provided, state-specific sequence takes precedence
  if (state) {
    switch (state) {
      case "idle":
        return {
          stageClass: "pigeon-idle-bob",
          wingClass: "pigeon-wing-idle-breath",
          eyeClass: "pigeon-eye-blink",
        };
      case "dragging":
        return {
          stageClass: "pigeon-drag-anticipate",
          wingClass: "pigeon-wing-drag-ready",
          parcelClass: "pigeon-parcel-bob",
        };
      case "uploading":
        return {
          stageClass: "pigeon-upload-bounce",
          wingClass: "pigeon-wing-flap",
          legsClass: "pigeon-legs-flying",
          parcelClass: "pigeon-parcel-swing",
        };
      case "ready":
        return {
          stageClass: "pigeon-idle-bob",
          wingClass: "pigeon-wing-idle-breath",
          eyeClass: "pigeon-eye-blink",
        };
      case "waiting":
        return {
          stageClass: "pigeon-idle-bob-slow",
          wingClass: "pigeon-wing-idle-breath",
          eyeClass: "pigeon-eye-blink",
        };
      case "sending":
        return {
          stageClass: "pigeon-sending-sequence",
          wingClass: "pigeon-wing-flight",
          legsClass: "pigeon-legs-flying",
          parcelClass: "pigeon-parcel-sending",
        };
      case "receiving":
        return {
          stageClass: "pigeon-receiving-sequence",
          wingClass: "pigeon-wing-flare",
          legsClass: "pigeon-legs-flying",
          parcelClass: "pigeon-parcel-bob",
        };
      case "success":
        return {
          stageClass: "pigeon-success-sequence",
          wingClass: "pigeon-wing-idle-breath",
          checkmarkClass: "pigeon-checkmark",
        };
      case "error":
        return {
          stageClass: "pigeon-error-shake",
        };
      case "expired":
        return {
          stageClass: "pigeon-expired-retreat",
        };
    }
  }

  // Fallback for mood-only usages (backwards compatibility)
  switch (effectiveMood) {
    case "flying":
      return {
        stageClass: "pigeon-upload-bounce",
        wingClass: "pigeon-wing-flight",
        legsClass: "pigeon-legs-flying",
      };
    case "carrying":
      return {
        stageClass: "pigeon-upload-bounce",
        wingClass: "pigeon-wing-flap",
        parcelClass: "pigeon-parcel-swing",
      };
    case "waiting":
      return {
        stageClass: "pigeon-idle-bob-slow",
        wingClass: "pigeon-wing-idle-breath",
        eyeClass: "pigeon-eye-blink",
      };
    case "done":
      return {
        stageClass: "pigeon-success-sequence",
        checkmarkClass: "pigeon-checkmark",
      };
    case "idle":
    default:
      return {
        stageClass: "pigeon-idle-bob",
        wingClass: "pigeon-wing-idle-breath",
        eyeClass: "pigeon-eye-blink",
      };
  }
}

/**
 * Returns the default screen-reader label for the pigeon in this state.
 */
export function getDefaultAriaLabel(
  state?: PigeonState | undefined,
  mood?: Mood | undefined,
): string {
  if (state) {
    switch (state) {
      case "idle":
        return "Pigeon: standing by";
      case "dragging":
        return "Pigeon: ready to catch your file";
      case "uploading":
        return "Pigeon: uploading file";
      case "ready":
        return "Pigeon: file ready for pickup";
      case "waiting":
        return "Pigeon: waiting for connection";
      case "sending":
        return "Pigeon: delivering file across devices";
      case "receiving":
        return "Pigeon: receiving incoming file";
      case "success":
        return "Pigeon: file delivered successfully";
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
      return "Pigeon: waiting on standby";
    case "done":
      return "Pigeon: delivery completed";
    case "idle":
    default:
      return "Pigeon";
  }
}

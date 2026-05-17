/**
 * animationMap.ts — single source of truth for animation routing.
 *
 * Two mapping layers:
 *  1. emotion  → animation  (VRM expression preset → body animation)
 *  2. keyword  → animation  (phrases in Aura's text → specific clip)
 *
 * 10 emote clips + 1 idle loop live in public/cards/animations/.
 * Each .vrma is ~118KB (clips) or ~158KB (idle). All preload after
 * the first VRM mounts, so subsequent triggers are instant.
 */

export type AnimationName =
  | "Angry"
  | "Blush"
  | "Clapping"
  | "Goodbye"
  | "Jump"
  | "LookAround"
  | "Relax"
  | "Sad"
  | "Sleepy"
  | "Thinking";

/** Public URL for each named clip, absolute so any card landing works. */
export const ANIMATION_URL: Record<AnimationName, string> = {
  Angry: "/cards/animations/Angry.vrma",
  Blush: "/cards/animations/Blush.vrma",
  Clapping: "/cards/animations/Clapping.vrma",
  Goodbye: "/cards/animations/Goodbye.vrma",
  Jump: "/cards/animations/Jump.vrma",
  LookAround: "/cards/animations/LookAround.vrma",
  Relax: "/cards/animations/Relax.vrma",
  Sad: "/cards/animations/Sad.vrma",
  Sleepy: "/cards/animations/Sleepy.vrma",
  Thinking: "/cards/animations/Thinking.vrma",
};

export const IDLE_URL = "/cards/animations/idle_loop.vrma";

export const ALL_ANIMATIONS: AnimationName[] = [
  "Angry",
  "Blush",
  "Clapping",
  "Goodbye",
  "Jump",
  "LookAround",
  "Relax",
  "Sad",
  "Sleepy",
  "Thinking",
];

/** Emoji glyph per animation, for picker UI. */
export const ANIMATION_GLYPH: Record<AnimationName, string> = {
  Angry: "😠",
  Blush: "☺️",
  Clapping: "👏",
  Goodbye: "👋",
  Jump: "🤸",
  LookAround: "👀",
  Relax: "🧘",
  Sad: "😢",
  Sleepy: "😴",
  Thinking: "🤔",
};

/** Emotion tag → animation. null means stay in idle. */
export const EMOTION_TO_ANIMATION: Record<string, AnimationName | null> = {
  happy: "Clapping",
  angry: "Angry",
  sad: "Sad",
  relaxed: "Relax",
  neutral: null,
  // Extended Aura emotion tags
  curious: "LookAround",
  analytical: "Thinking",
  focused: "Thinking",
  nurturing: "Relax",
  playful: "Jump",
  mischievous: "Blush",
  firm: null,
  clinical: null,
  warm: "Relax",
  cold: null,
  concerned: "Thinking",
  approving: "Clapping",
  disapproving: "Angry",
  surprised: "Jump",
  stasis: null,
};

/** Keyword patterns → animation. Checked against Aura's response text. */
export const KEYWORD_ANIMATIONS: Array<{
  pattern: RegExp;
  animation: AnimationName;
  priority: number; // higher wins if multiple match
}> = [
  { pattern: /\b(bye|goodbye|see you|farewell|take care)\b/i, animation: "Goodbye", priority: 10 },
  { pattern: /\b(interesting|fascinating|curious|wonder|hmm)\b/i, animation: "Thinking", priority: 7 },
  { pattern: /\b(look around|let me see|let me check|looking)\b/i, animation: "LookAround", priority: 6 },
  { pattern: /\b(well done|great|excellent|bravo|congrats)\b/i, animation: "Clapping", priority: 5 },
  { pattern: /\b(jump|exciting|wow|oh!|wait—)\b/i, animation: "Jump", priority: 4 },
  { pattern: /\b(blush|embarrass|oh my|awkward)\b/i, animation: "Blush", priority: 4 },
  { pattern: /\b(tired|sleepy|exhausted|yawn)\b/i, animation: "Sleepy", priority: 3 },
  { pattern: /\b(relax|calm|breathe|settle|easy)\b/i, animation: "Relax", priority: 2 },
];

/**
 * Pick the best animation for a given emotion + response text.
 * Keyword match takes priority over emotion mapping. Returns null
 * if nothing matches and there's no emotion fallback.
 */
export function resolveAnimation(
  emotion: string,
  text: string,
): AnimationName | null {
  // Check keywords first (highest priority wins)
  let best: { animation: AnimationName; priority: number } | null = null;
  for (const entry of KEYWORD_ANIMATIONS) {
    if (entry.pattern.test(text)) {
      if (!best || entry.priority > best.priority) {
        best = entry;
      }
    }
  }
  if (best) return best.animation;

  // Fall back to emotion mapping
  return EMOTION_TO_ANIMATION[emotion] ?? null;
}

/**
 * Convenience: given just Aura's text (no emotion tag), surface an
 * animation if a keyword fires. Used for auto-triggering animations
 * from the assistant's reply.
 */
export function resolveAnimationFromText(text: string): AnimationName | null {
  return resolveAnimation("neutral", text);
}

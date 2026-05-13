/**
 * Player progress for the proving-ground ladder.
 *
 * The model is deliberately conservative in v1. Two solo levels start
 * unlocked — Module (the picker) and Trail (the playable preview).
 * Everything else is locked until the player passes one of those, at
 * which point the rest of the solo phase opens. Braided levels follow
 * the eligibility logic in lib/play.ts — threadCount solo passes
 * required, plus an optional explicit `requires` list.
 *
 * Persistence has two backends:
 *   - localStorage for the unauthenticated visitor (current default)
 *   - Firestore for the signed-in player (stubbed; production wiring
 *     uses the rookery client pattern in lib/rookery/client.ts)
 *
 * The Firestore stubs return local progress for now so the page can be
 * built without a working backend. Flip them on once /api/play/progress
 * has the firebase-admin SDK wired and the user's UID is being read off
 * the session cookie.
 */

import { playLevels, soloLevels, type PlayLevel } from "lib/play";

export type LevelStatus = "locked" | "unlocked" | "in-progress" | "passed";

export type PlayerProgress = {
  /** Firestore document id (Firebase UID) or null for an anonymous visitor. */
  userId: string | null;
  /** Per-level status; keys are level slugs from lib/play.ts. */
  levelStates: Record<string, LevelStatus>;
  /** Number of trail snapshots the player has pushed to the Rookery. */
  trailsPublished: number;
  /** ISO 8601 timestamp of the player's most recent session. */
  lastPlayed: string;
};

const LOCAL_STORAGE_KEY = "holoflow.play.progress.v1";

/**
 * Initial progress state. Module and Trail are unlocked from the
 * start — those are the two paths into the ladder. Every other level
 * waits behind its own gate.
 */
export function defaultProgress(): PlayerProgress {
  const levelStates: Record<string, LevelStatus> = {};
  for (const lvl of playLevels) {
    if (lvl.slug === "module" || lvl.slug === "trail") {
      levelStates[lvl.slug] = "unlocked";
    } else {
      levelStates[lvl.slug] = "locked";
    }
  }
  return {
    userId: null,
    levelStates,
    trailsPublished: 0,
    lastPlayed: new Date().toISOString(),
  };
}

/**
 * Is the level eligible to play given current progress?
 *
 * Solo levels are eligible if any solo level has been passed (or if
 * they are the starting pair). Braided levels need at least
 * `threadCount` solo passes; if `requires` is non-empty, every named
 * solo must be passed.
 */
export function isLevelEligible(
  slug: string,
  progress: PlayerProgress,
  level: PlayLevel,
): boolean {
  const passedSet = new Set(
    Object.entries(progress.levelStates)
      .filter(([, s]) => s === "passed")
      .map(([k]) => k),
  );

  if (level.phase === "solo") {
    // Module and Trail are unlocked from the start.
    if (slug === "module" || slug === "trail") return true;
    // Any solo pass unlocks every other solo.
    const anySoloPassed = soloLevels.some((s) => passedSet.has(s.slug));
    return anySoloPassed;
  }

  // Braided eligibility — mirrors the contract in lib/play.ts
  // eligibleLevels().
  const soloDoneCount = soloLevels.filter((s) => passedSet.has(s.slug))
    .length;
  if (level.threadCount > soloDoneCount) return false;
  if (level.requires.length > 0) {
    return level.requires.every((r) => passedSet.has(r));
  }
  return true;
}

export function unlockedLevels(progress: PlayerProgress): string[] {
  return Object.entries(progress.levelStates)
    .filter(([, s]) => s === "unlocked" || s === "in-progress")
    .map(([k]) => k);
}

export function passedLevelCount(progress: PlayerProgress): number {
  return Object.values(progress.levelStates).filter((s) => s === "passed")
    .length;
}

export function lockedLevelCount(progress: PlayerProgress): number {
  return Object.values(progress.levelStates).filter((s) => s === "locked")
    .length;
}

/**
 * Coerce an unknown blob into a PlayerProgress, falling back to the
 * default if shape is wrong or fields are missing. Tolerant on read,
 * strict on write.
 */
function coerceProgress(input: unknown): PlayerProgress {
  if (!input || typeof input !== "object") return defaultProgress();
  const obj = input as Partial<PlayerProgress>;
  const base = defaultProgress();
  const levelStates = { ...base.levelStates };
  if (obj.levelStates && typeof obj.levelStates === "object") {
    for (const lvl of playLevels) {
      const v = (obj.levelStates as Record<string, unknown>)[lvl.slug];
      if (
        v === "locked" ||
        v === "unlocked" ||
        v === "in-progress" ||
        v === "passed"
      ) {
        levelStates[lvl.slug] = v;
      }
    }
  }
  return {
    userId: typeof obj.userId === "string" ? obj.userId : null,
    levelStates,
    trailsPublished:
      typeof obj.trailsPublished === "number" && obj.trailsPublished >= 0
        ? Math.floor(obj.trailsPublished)
        : 0,
    lastPlayed:
      typeof obj.lastPlayed === "string" ? obj.lastPlayed : base.lastPlayed,
  };
}

export function loadProgressLocal(): PlayerProgress {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return defaultProgress();
    return coerceProgress(JSON.parse(raw));
  } catch {
    return defaultProgress();
  }
}

export function saveProgressLocal(progress: PlayerProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage can fail in private-mode or quota-exceeded; degrade
    // silently — the in-memory state is still good for this session.
  }
}

/**
 * TODO: replace the body of this stub with a Firestore read once the
 * /api/play/progress route has the firebase-admin SDK wired. The
 * collection is /play_progress/{uid} matching the rookery pattern. For
 * now we return the local copy so the UI can be built against the
 * eventual contract.
 */
export async function loadProgressFromFirestore(
  uid: string | null,
): Promise<PlayerProgress> {
  const base = loadProgressLocal();
  return { ...base, userId: uid };
}

/**
 * TODO: write to /play_progress/{uid} via firebase-admin. For now this
 * just mirrors to localStorage so the caller can develop against the
 * eventual shape.
 */
export async function saveProgressToFirestore(
  uid: string,
  progress: PlayerProgress,
): Promise<void> {
  saveProgressLocal({ ...progress, userId: uid });
}

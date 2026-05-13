/**
 * Chrono-Protocol game state machine and player telemetry.
 *
 * The prototype's enum (BOOT, HUB, RUN, CREATIVE, GAME_OVER) widens on
 * the site to seven states: BRIEFING (pre-run dialogue), ENCOUNTER
 * (combat inside a run), VICTORY (run cleared), and DEFEAT (health
 * hit zero, but continues available) all sit between HUB and the final
 * GAME_OVER terminal.
 *
 * Telemetry is the live run-state — drives the HUD, the dialogue
 * triggers, and the scoring system. SaveSlot is the persisted
 * cross-run record: unlocked zones, best scores, totals.
 *
 * Persistence: SaveSlot is mirrored to localStorage today; Firestore
 * /chrono_protocol_saves/{uid} when the firebase-admin SDK is wired
 * (mirrors the /api/play/progress pattern in lib/play/state.ts).
 */

import type { ChronoModeSlug } from "../chrono-protocol";
import { type ZoneSlug, zones } from "./zones";

export type GameState =
  | "boot"
  | "hub"
  | "briefing"
  | "run"
  | "encounter"
  | "victory"
  | "defeat"
  | "creative"
  | "game_over";

export type PlayerTelemetry = {
  /** Current health, 0..maxHealth. */
  health: number;
  maxHealth: number;
  /** Streak counter — resets on damage, increments per clear. */
  combo: number;
  /** Run phase number, 1..3 typically. */
  phase: number;
  /** Cumulative score this run. */
  score: number;
  /** Currently-selected mode on the wheel. */
  currentMode: ChronoModeSlug;
  /** Mode-switching history for the last 5 switches (newest last). */
  modeHistory: ChronoModeSlug[];
  /** When the last event happened (ISO 8601). */
  lastEventAt: string;
  /** Description of last event. */
  lastEvent: string;
};

export const INITIAL_HEALTH = 100;

export const initialTelemetry: PlayerTelemetry = {
  health: INITIAL_HEALTH,
  maxHealth: INITIAL_HEALTH,
  combo: 0,
  phase: 1,
  score: 0,
  currentMode: "azure",
  modeHistory: ["azure"],
  lastEventAt: "1970-01-01T00:00:00.000Z",
  lastEvent: "session-start",
};

export type SaveSlot = {
  /** Firebase uid if signed in; null for anonymous local-only play. */
  uid: string | null;
  /** Slugs of zones the player has access to. */
  unlockedZones: ZoneSlug[];
  /** Best score per zone, keyed by slug. */
  bestScores: Record<ZoneSlug, number>;
  /** Total number of runs the player has started. */
  totalRuns: number;
  /** Total number of cleared (victory) runs. */
  totalVictories: number;
  /** ISO 8601 of most-recent play session. */
  lastPlayedAt: string;
};

const LOCAL_STORAGE_KEY = "holoflow.chrono-protocol.save.v1";

export function defaultSaveSlot(): SaveSlot {
  const bestScores = {} as Record<ZoneSlug, number>;
  for (const z of zones) {
    bestScores[z.slug] = 0;
  }
  return {
    uid: null,
    // Leake St unlocked by default — it is the tutorial. Royal Mile and
    // Soho Grid gate on prior-zone-cleared.
    unlockedZones: ["leake-st-arches"],
    bestScores,
    totalRuns: 0,
    totalVictories: 0,
    lastPlayedAt: new Date().toISOString(),
  };
}

/**
 * Is the zone playable given the current save slot?
 *
 * - leake-st-arches: always unlocked.
 * - royal-mile: unlocked once leake-st-arches has been cleared
 *   (registered as unlockedZones includes royal-mile, or totalVictories
 *   reached the gate count).
 * - soho-grid: unlocked once royal-mile has been cleared.
 *
 * The site reads unlockedZones as the source of truth so the unlock
 * cascade can be triggered by either a run-victory or by the /play
 * ladder's pass-state (see CHRONO_PROTOCOL_BUILD_PLAN.md).
 */
export function isZoneUnlocked(slug: ZoneSlug, slot: SaveSlot): boolean {
  return slot.unlockedZones.includes(slug);
}

/** Apply a victory: bump scores, mark zone cleared, cascade unlocks. */
export function applyVictory(
  slot: SaveSlot,
  zoneSlug: ZoneSlug,
  finalScore: number,
): SaveSlot {
  const current = slot.bestScores[zoneSlug] ?? 0;
  const bestScores = {
    ...slot.bestScores,
    [zoneSlug]: Math.max(current, finalScore),
  };
  const unlockedZones = new Set(slot.unlockedZones);
  unlockedZones.add(zoneSlug);
  if (zoneSlug === "leake-st-arches") unlockedZones.add("royal-mile");
  if (zoneSlug === "royal-mile") unlockedZones.add("soho-grid");
  return {
    ...slot,
    bestScores,
    unlockedZones: Array.from(unlockedZones),
    totalVictories: slot.totalVictories + 1,
    totalRuns: slot.totalRuns + 1,
    lastPlayedAt: new Date().toISOString(),
  };
}

/** Apply a defeat: bump totalRuns, do not bump bestScores. */
export function applyDefeat(slot: SaveSlot): SaveSlot {
  return {
    ...slot,
    totalRuns: slot.totalRuns + 1,
    lastPlayedAt: new Date().toISOString(),
  };
}

function coerceSaveSlot(input: unknown): SaveSlot {
  if (!input || typeof input !== "object") return defaultSaveSlot();
  const obj = input as Partial<SaveSlot>;
  const base = defaultSaveSlot();
  const unlockedZones = Array.isArray(obj.unlockedZones)
    ? (obj.unlockedZones.filter((z): z is ZoneSlug =>
        zones.some((zz) => zz.slug === z),
      ) as ZoneSlug[])
    : base.unlockedZones;
  const bestScores = { ...base.bestScores };
  if (obj.bestScores && typeof obj.bestScores === "object") {
    for (const z of zones) {
      const v = (obj.bestScores as Record<string, unknown>)[z.slug];
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
        bestScores[z.slug] = Math.floor(v);
      }
    }
  }
  return {
    uid: typeof obj.uid === "string" ? obj.uid : null,
    unlockedZones: unlockedZones.length > 0 ? unlockedZones : base.unlockedZones,
    bestScores,
    totalRuns:
      typeof obj.totalRuns === "number" && obj.totalRuns >= 0
        ? Math.floor(obj.totalRuns)
        : 0,
    totalVictories:
      typeof obj.totalVictories === "number" && obj.totalVictories >= 0
        ? Math.floor(obj.totalVictories)
        : 0,
    lastPlayedAt:
      typeof obj.lastPlayedAt === "string"
        ? obj.lastPlayedAt
        : base.lastPlayedAt,
  };
}

export function loadSaveSlotLocal(): SaveSlot {
  if (typeof window === "undefined") return defaultSaveSlot();
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return defaultSaveSlot();
    return coerceSaveSlot(JSON.parse(raw));
  } catch {
    return defaultSaveSlot();
  }
}

export function saveSaveSlotLocal(slot: SaveSlot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(slot));
  } catch {
    // localStorage may fail in private-mode or quota; degrade silent.
  }
}

/**
 * Mutate telemetry on a mode switch. Pure: returns a new telemetry
 * object, keeps the last 5 switches in history.
 */
export function applyModeSwitch(
  telemetry: PlayerTelemetry,
  toMode: ChronoModeSlug,
): PlayerTelemetry {
  const nextHistory = [...telemetry.modeHistory, toMode].slice(-5);
  return {
    ...telemetry,
    currentMode: toMode,
    modeHistory: nextHistory,
    lastEventAt: new Date().toISOString(),
    lastEvent: `mode-switch:${toMode}`,
  };
}

/** Apply damage. Caps at zero; returns new telemetry. */
export function applyDamage(
  telemetry: PlayerTelemetry,
  amount: number,
): PlayerTelemetry {
  const health = Math.max(0, telemetry.health - amount);
  return {
    ...telemetry,
    health,
    combo: 0,
    lastEventAt: new Date().toISOString(),
    lastEvent: `damage:${amount}`,
  };
}

/** Bump combo. */
export function applyComboTick(telemetry: PlayerTelemetry): PlayerTelemetry {
  return {
    ...telemetry,
    combo: telemetry.combo + 1,
    lastEventAt: new Date().toISOString(),
    lastEvent: `combo:${telemetry.combo + 1}`,
  };
}

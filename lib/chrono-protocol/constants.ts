/**
 * lib/chrono-protocol/constants.ts — Numeric canon for the Chrono-Protocol runtime.
 *
 * # Purpose
 *
 * One file, one job: the numeric constants the Hangar prototype runs on
 * (apps/prototypes/neo-london-chrono-protocol/constants.ts +
 * apps/prototypes/neo-london-chrono-protocol/App.tsx +
 * apps/prototypes/neo-london-chrono-protocol/components/World.tsx).
 *
 * Ported verbatim from the prototype. Where a constant was implicit
 * (e.g. combo-decay rate, mode-switch cooldown), the slot is named
 * and left TODO so the next pass can resolve against either play
 * data or a re-derivation rather than invention.
 *
 * # Why this shape
 *
 * The zones file already exports BASE_TUNNEL_SPEED to satisfy its
 * per-zone speed multiplier; re-exported here as TUNNEL_SPEED so the
 * runtime imports read the same name the Hangar canon uses. The rest
 * is new numeric canon the slice + game-loop import from a single
 * place, so a tuning pass is one diff in one file.
 *
 * Provenance:
 * - TUNNEL_SPEED = 12                         (World.tsx, line 7)
 * - INITIAL_SPEED_MULTIPLIER = 1.0            (App.tsx, line 16)
 * - MAX_SPEED_MULTIPLIER = 2.5                (App.tsx, line 48)
 * - SCORE_TICK_MS = 100                       (App.tsx, line 56)
 * - SCORE_TICK_VALUE = 10                     (App.tsx, line 46)
 * - SPEED_RAMP_PER_TICK = 0.001               (App.tsx, line 48)
 * - BANTER_TICK_MS = 12_000                   (App.tsx, line 76)
 * - BANTER_TRIGGER_THRESHOLD = 0.6            (App.tsx, line 60)
 * - INITIAL_HEALTH = 5                        (App.tsx, line 11; site
 *   widens to 100 in state.ts — kept here on the prototype value for
 *   parity with the game-loop arithmetic)
 * - BOOT_LINE_MIN_MS / MAX_MS = 300 / 800     (Hub.tsx, line 32)
 * - BOOT_FINAL_DELAY_MS = 800                 (Hub.tsx, line 36)
 *
 * The site's PlayerTelemetry.health uses 0..100 (lib/chrono-protocol/
 * state.ts), separate from the prototype's 0..5 ints used by the
 * banter telemetry. Both are exported here so callers can pick the
 * matching scale.
 */

import { BASE_TUNNEL_SPEED } from "./zones";

/** Tunnel speed in world-units-per-second. Verbatim from World.tsx. */
export const TUNNEL_SPEED = BASE_TUNNEL_SPEED;

/** Baseline speed multiplier the runtime starts at. */
export const INITIAL_SPEED_MULTIPLIER = 1.0;

/** Cap on the speed multiplier so the runtime never runs unbounded. */
export const MAX_SPEED_MULTIPLIER = 2.5;

/** Interval between score ticks while in the RUN phase. */
export const SCORE_TICK_MS = 100;

/** Score awarded per tick at multiplier 1.0. */
export const SCORE_TICK_VALUE = 10;

/** Speed-multiplier ramp per score tick (additive). */
export const SPEED_RAMP_PER_TICK = 0.001;

/**
 * Cadence at which the banter loop polls the LLM. Matches
 * lib/capabilities/agent/banter.ts → DEFAULT_TICK_MS exactly.
 */
export const BANTER_TICK_MS = 12_000;

/**
 * Random-event trigger threshold (`Math.random() > THRESHOLD`).
 * 0.6 = ~40% of banter ticks fire a random-event banter.
 */
export const BANTER_TRIGGER_THRESHOLD = 0.6;

/**
 * Initial health on the prototype's 0..5 integer scale. The site's
 * PlayerTelemetry uses 0..100; this constant is the prototype shape
 * the banter telemetry expects.
 */
export const INITIAL_HEALTH_INT = 5;

/** Initial health on the site's 0..100 scale. Mirrors state.ts. */
export const INITIAL_HEALTH = 100;

/** Lower bound on a boot-line stagger. */
export const BOOT_LINE_MIN_MS = 300;

/** Upper bound on a boot-line stagger. */
export const BOOT_LINE_MAX_MS = 800;

/** Delay between the last boot line and the BOOT → HUB transition. */
export const BOOT_FINAL_DELAY_MS = 800;

/**
 * Phase durations in ms. The prototype's RUN phase has no explicit
 * timer; the run ends on player death or manual eject (App.tsx line
 * 119). Site-side, the runner ladders three phases — leaving
 * RUN_PHASE_DURATION_MS as TODO so the next pass picks a value
 * grounded in the build plan rather than invented here.
 *
 * TODO: derive RUN_PHASE_DURATION_MS from the build plan.
 */
// export const RUN_PHASE_DURATION_MS = TODO;

/**
 * Combo-decay rate. The prototype's banter loop reads combo as
 * `Math.floor(score / 100)` (App.tsx line 68) rather than decaying it.
 *
 * TODO: derive COMBO_DECAY_PER_SECOND from gameplay tuning. Leaving
 * it as a named slot here so the runner reads from one place when
 * the value lands.
 */
// export const COMBO_DECAY_PER_SECOND = TODO;

/**
 * Mode-switch cooldown. The prototype has no cooldown (App.tsx
 * uses a direct setPoiMode call from the Hub buttons, with no
 * timing gate).
 *
 * TODO: choose MODE_SWITCH_COOLDOWN_MS for the runner.
 */
// export const MODE_SWITCH_COOLDOWN_MS = TODO;

/**
 * Convert a combo count to the score multiplier the scoring module
 * computes (1 + min(1.0, floor(combo/5) * 0.1)). Re-exported here
 * for the game-loop arithmetic only; scoring.ts owns the canon copy.
 */
export function comboToScoreMultiplier(combo: number): number {
  const steps = Math.floor(combo / 5);
  return 1 + Math.min(1.0, steps * 0.1);
}

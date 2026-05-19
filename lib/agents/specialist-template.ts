/**
 * lib/agents/specialist-template.ts — Typed shape of the scaffolder output.
 *
 * One-line role: shared types between `scripts/scaffold-specialist.mjs`
 * (the CLI that writes the files) and any test or helper that wants to
 * reason about a freshly-scaffolded specialist before the operator has
 * filled in the [TODO] markers.
 *
 * The CLI is plain Node ESM and does not import this file at runtime —
 * it can't, ESM-importing a `.ts` from a `.mjs` would need a TS loader.
 * The file exists so the resulting JSON + TS the CLI writes still type-
 * checks against an explicit contract, and so any future test harness
 * (a `pnpm exec tsc --noEmit` smoke check, a Vitest case) can import
 * the shapes the CLI emits without re-deriving them.
 *
 * Two shapes live here:
 *  - `ScaffoldedCastBible` — the JSON the CLI writes to
 *    `data/agents/<slug>.json`. Mirrors `CastMember` in `cast.ts` but
 *    with `longBio` and a couple of fields permitted-empty until the
 *    operator fills them in.
 *  - `ScaffoldedSpecialist` — the registration record the CLI writes to
 *    `lib/agents/specialists/<slug>.ts`. Matches `Specialist` in
 *    `lib/agents/crew/types.ts`.
 *
 * If you change `CastMember` or `Specialist`, update these in the same
 * commit — the CLI generates files that have to typecheck.
 */

import "server-only";

import type { CastKingdom, CastMember } from "lib/agents/cast";
import type { Specialist } from "lib/agents/crew/types";

// ---------------------------------------------------------------------
// The cast-bible JSON the CLI writes
// ---------------------------------------------------------------------

/**
 * The shape of the JSON the scaffolder writes to `data/agents/<slug>.json`.
 *
 * Identical to `CastMember` except:
 *  - `longBio` is intentionally an empty string at scaffold time
 *    (operator fills it after voice review).
 *  - `active` defaults to `false` — the visible cast does not grow until
 *    the operator has read the [TODO] markers and flipped the flag.
 *  - `systemPrompt` is a template containing `{{placeholders}}` and
 *    `[TODO]` markers; the operator hand-fills before promoting to
 *    `active: true`.
 *
 * This is a structural type, not a runtime guard. The CLI emits JSON
 * that satisfies `CastMember`; this alias is the documentation of which
 * fields the operator is expected to leave alone vs. backfill.
 */
export type ScaffoldedCastBible = CastMember & {
  /** Always `false` at scaffold time. Operator sets to `true` after review. */
  active: false;
  /** Empty string until operator writes it. */
  longBio: "";
};

// ---------------------------------------------------------------------
// The specialist-registration TS the CLI writes
// ---------------------------------------------------------------------

/**
 * The `Specialist` record the scaffolder writes to
 * `lib/agents/specialists/<slug>.ts`.
 *
 * The scaffolder always sets `allowDelegation: false` — Aura-tier
 * orchestrator status is hand-crafted, not generated. If a new
 * specialist needs to delegate, the operator edits the file after
 * scaffolding.
 */
export type ScaffoldedSpecialist = Specialist & {
  /** Always `false` at scaffold time — generator specialists do not orchestrate. */
  allowDelegation: false;
};

// ---------------------------------------------------------------------
// CLI input — the parsed flag bundle
// ---------------------------------------------------------------------

/**
 * Parsed flag bundle from the CLI. Lives here so a future test harness
 * can construct a synthetic input without re-deriving the shape.
 */
export type ScaffoldInput = {
  slug: string;
  displayName: string;
  role: string;
  kingdom: CastKingdom;
  voiceRegister: string;
  speaksAbout: ReadonlyArray<string>;
  preferredModel: string;
  tools: ReadonlyArray<string>;
  vrmFile: string;
  /** When true, overwrite existing files. */
  force: boolean;
  /** When true, print the plan; write nothing. */
  dryRun: boolean;
};

// ---------------------------------------------------------------------
// Re-export the closed kingdom set so the CLI can validate against it
// without re-importing `cast.ts` from a `.mjs` (which can't).
// The CLI ships its own literal copy and asserts equivalence by reading
// this file at type-check time. (See `scripts/scaffold-specialist.mjs`
// for the literal list; keep them in sync.)
// ---------------------------------------------------------------------

export const SCAFFOLD_KINGDOMS: ReadonlyArray<CastKingdom> = [
  "choreographic",
  "curvilinear",
  "biomech",
  "techno",
  "assemblage",
  "artistic",
  "architectural",
  "ritual",
] as const;

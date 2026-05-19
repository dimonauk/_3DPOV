/**
 * lib/agents/specialists/index.ts — Crew specialist registry.
 *
 * One-line role: re-exports the five typed `Specialist` records and the
 * `allSpecialists` tuple so the crew runner can be given a uniform list.
 *
 * The runner (in `lib/agents/crew/`) consumes `Specialist` from
 * `lib/agents/crew/types.ts`; this module is the deployable inventory.
 * Adding a new specialist is two steps: write the file, add it to the
 * `allSpecialists` tuple here.
 *
 * Each specialist file is `server-only`; this re-export inherits that
 * constraint. Do not import this module from a client component.
 */

import "server-only";

import { aura } from "./aura";
import { coco } from "./coco";
import { marcel } from "./marcel";
import { penny } from "./penny";
import { scribe } from "./scribe";

export { aura, marcel, coco, scribe, penny };

/**
 * The full crew, in canonical order: orchestrator first, then the
 * named specialists in the order the cast bibles use elsewhere in the
 * codebase (Aura, Marcel, Coco, the Scribe, Penny).
 *
 * `as const` preserves the literal slug types so `SpecialistSlug`
 * resolves to the union of the five string literals rather than `string`.
 */
export const allSpecialists = [aura, marcel, coco, scribe, penny] as const;

/** Union of the five specialist slugs — `"aura" | "marcel" | ...`. */
export type SpecialistSlug = (typeof allSpecialists)[number]["slug"];

/**
 * Look up a specialist by slug. Returns `undefined` for unknown slugs;
 * the caller decides whether that's an error or a fall-through.
 */
export function getSpecialist(slug: string) {
  return allSpecialists.find((s) => s.slug === slug);
}

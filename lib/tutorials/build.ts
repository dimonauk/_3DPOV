import type { Entry } from "lib/writing";
import type { InstructableMeta } from "./types";

/**
 * Author helper. Attach a structured `InstructableMeta` to an
 * existing `Entry`. The registry keeps the same shape; readers that
 * know about `instructable` (the tutorial detail page) render the
 * Instructables-style surface below the standard body.
 *
 * Example:
 *   export const entry = buildInstructable(
 *     {
 *       time: "an evening",
 *       difficulty: "novice",
 *       cost: "the cost of one torch",
 *       supplies: { materials: [...], tools: [...] },
 *       steps: [...],
 *     },
 *     {
 *       slug: "your-first-light-painting",
 *       title: "Your first light painting",
 *       date: "2026-05-18",
 *       kind: "tutorial",
 *       excerpt: "…",
 *       Body: YourFirstLightPainting,
 *     },
 *   );
 */
export function buildInstructable(
  instructable: InstructableMeta,
  entry: Entry,
): Entry {
  return { ...entry, instructable };
}

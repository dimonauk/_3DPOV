import type { ComponentType } from "react";
import type { Entry } from "lib/writing";
import type { InstructableMeta } from "./types";

/**
 * buildInstructable — three supported calling conventions:
 *
 * ① Standard (structured tutorials with supplies/steps/difficulty):
 *   buildInstructable(meta: InstructableMeta, entry: Entry): Entry
 *   Attaches the structured Test-Chamber panel below the standard Body.
 *
 * ② Legacy two-arg (early blender entries, `data` object + Body component):
 *   buildInstructable(data: { title, lede, date, slug?, ... }, Body): Entry
 *   Body is a ComponentType, not an Entry. Slug derived from data.slug if present.
 *
 * ③ One-arg shorthand (current bot-generated blender entries):
 *   buildInstructable({ slug, title, lede?, date, tags?, body, blends? }): Entry
 *   All fields in one object; `body` (lowercase) is the Body component.
 */
export function buildInstructable(
  instructableOrShorthand: InstructableMeta | Record<string, unknown>,
  entryOrBody?: Entry | ComponentType,
): Entry {
  // ── ③ One-arg shorthand ─────────────────────────────────────────────────
  if (entryOrBody === undefined) {
    const s = instructableOrShorthand as Record<string, unknown>;
    const title = (s.title as string) ?? "";
    return {
      slug:    (s.slug   as string) ?? "",
      title,
      excerpt: (s.lede   as string) ?? title.slice(0, 220),
      date:    (s.date   as string) ?? "",
      kind:    "tutorial",
      tags:    s.tags as string[] | undefined,
      Body:    (s.body   as ComponentType) ?? (() => null),
    };
  }

  // ── ② Legacy two-arg (data + Body component) ────────────────────────────
  if (typeof entryOrBody === "function") {
    const d = instructableOrShorthand as Record<string, unknown>;
    const title = (d.title as string) ?? "";
    return {
      slug:    (d.slug   as string) ?? "",
      title,
      excerpt: (d.lede   as string) ?? title.slice(0, 220),
      date:    (d.date   as string) ?? "",
      kind:    "tutorial",
      Body:    entryOrBody as ComponentType,
    };
  }

  // ── ① Standard two-arg (InstructableMeta + Entry) ───────────────────────
  return {
    ...entryOrBody,
    instructable: instructableOrShorthand as InstructableMeta,
  };
}

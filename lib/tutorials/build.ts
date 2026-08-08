import type { ComponentType } from "react";
import type { Entry } from "lib/writing";
import type { InstructableMeta } from "./types";

/**
 * Author helper. Two calling conventions are supported.
 *
 * ── Classic two-argument form (original) ─────────────────────────────────────
 *
 *   export const entry = buildInstructable(
 *     {
 *       time: "an evening",
 *       difficulty: "novice",
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
 *
 * ── Blender-series single-argument form ──────────────────────────────────────
 *
 *   const data = { title: "…", lede: "…", date: "2026-08-08", externalSources: [] };
 *
 *   export const entry = buildInstructable({
 *     data,
 *     Body,
 *     slug: "blender-tutorial-…",
 *     libraryPath: "blends/scripting/…",
 *   });
 *
 *   Maps: data.title → entry.title, data.lede → entry.excerpt, data.date → entry.date,
 *         slug → entry.slug, Body → entry.Body, libraryPath → entry.instructable.libraryPath.
 */

// ─── Blender-series data bag ──────────────────────────────────────────────────
export type BlenderTutorialData = {
  title: string;
  lede: string;
  date: string;
  externalSources?: Array<{
    label: string;
    url: string;
    licence: string;
    author: string;
  }>;
};

// ─── Blender-series single-arg shape ─────────────────────────────────────────
type BlenderBuildArgs = {
  data: BlenderTutorialData;
  Body: ComponentType;
  slug: string;
  libraryPath?: string;
};

// ─── Overloads ────────────────────────────────────────────────────────────────
export function buildInstructable(args: BlenderBuildArgs): Entry;
export function buildInstructable(
  instructable: InstructableMeta,
  entry: Entry,
): Entry;

// ─── Implementation ───────────────────────────────────────────────────────────
export function buildInstructable(
  arg1: BlenderBuildArgs | InstructableMeta,
  arg2?: Entry,
): Entry {
  // Classic two-argument form
  if (arg2 !== undefined) {
    return { ...arg2, instructable: arg1 as InstructableMeta };
  }

  // Blender-series single-argument form
  const { data, Body, slug, libraryPath } = arg1 as BlenderBuildArgs;
  return {
    slug,
    title: data.title,
    date: data.date,
    kind: "tutorial",
    excerpt: data.lede,
    Body,
    instructable: { libraryPath },
  };
}

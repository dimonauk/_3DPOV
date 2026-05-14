/**
 * components/play/play-scene-brush.ts — Brush registry + Module-pass loader.
 *
 * Pure data + a localStorage read. The Trail level (PlayScene) picks its
 * brush from the visitor's prior pass on the Module level — that pass writes
 * the chosen brush slug to localStorage; this loader reads it back, falling
 * back to "thin" when nothing is set or storage is unavailable.
 */

export type BrushSlug = "thin" | "fat" | "dotted" | "additive";

export type Brush = {
  slug: BrushSlug;
  name: string;
  color: string;
  opacity: number;
  pointKeepRate: number;
};

export const BRUSHES: Record<BrushSlug, Brush> = {
  thin: {
    slug: "thin",
    name: "Thin line",
    color: "#00f3ff",
    opacity: 0.9,
    pointKeepRate: 1,
  },
  fat: {
    slug: "fat",
    name: "Fat brush",
    color: "#ffb3d9",
    opacity: 0.95,
    pointKeepRate: 1,
  },
  dotted: {
    slug: "dotted",
    name: "Dotted",
    color: "#e6e6e6",
    opacity: 1,
    pointKeepRate: 0.18,
  },
  additive: {
    slug: "additive",
    name: "Additive smear",
    color: "#ffcc66",
    opacity: 0.7,
    pointKeepRate: 1,
  },
};

export const MODULE_CHOICE_STORAGE_KEY = "holoflow.play.module.choice";

export function loadBrushFromModulePass(): Brush {
  if (typeof window === "undefined") return BRUSHES.thin;
  try {
    const slug = window.localStorage.getItem(MODULE_CHOICE_STORAGE_KEY);
    if (
      slug === "thin" ||
      slug === "fat" ||
      slug === "dotted" ||
      slug === "additive"
    ) {
      return BRUSHES[slug];
    }
  } catch {
    // localStorage may be unavailable.
  }
  return BRUSHES.thin;
}

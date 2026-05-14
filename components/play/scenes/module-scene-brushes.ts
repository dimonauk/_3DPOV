/**
 * components/play/scenes/module-scene-brushes.ts — Brush registry.
 *
 * The four v0.1 brush modules the Module level offers. Pure data; loader
 * for the persisted choice lives in `../play-scene-brush.ts` (Trail level
 * reads what this level writes).
 */

export type BrushSlug = "thin" | "fat" | "dotted" | "additive";

export type Brush = {
  slug: BrushSlug;
  name: string;
  blurb: string;
  color: string;
  opacity: number;
  /** Multiplier for sampled point density on draw — "dotted" thins the stream. */
  pointKeepRate: number;
};

/** Tailwind tint per brush slug for the active-card title. */
export const BRUSH_NAME_TINT: Record<BrushSlug, string> = {
  thin: "text-[#00f3ff]",
  fat: "text-[#ffb3d9]",
  dotted: "text-chrome-100",
  additive: "text-[#ffcc66]",
};

export const BRUSHES: Brush[] = [
  {
    slug: "thin",
    name: "Thin line",
    blurb:
      "One-pixel chrome curve. The default trail — good for diagrams, calligraphy, anything that wants the gesture read as a path.",
    color: "#00f3ff",
    opacity: 0.9,
    pointKeepRate: 1,
  },
  {
    slug: "fat",
    name: "Fat brush",
    blurb:
      "Wide additive stroke. For mass — a sword, a beam, a thrown shape. The same module the bench uses for the silhouette pieces.",
    color: "#ffb3d9",
    opacity: 0.95,
    pointKeepRate: 1,
  },
  {
    slug: "dotted",
    name: "Dotted",
    blurb:
      "Discrete marks, one per pointer-frame. Reads as rhythm — staccato gestures, beats, the persistence-of-vision counter-example.",
    color: "#e6e6e6",
    opacity: 1,
    pointKeepRate: 0.18,
  },
  {
    slug: "additive",
    name: "Additive smear",
    blurb:
      "Long-exposure simulation. The trail accumulates and bleeds; the brush is closer to fire poi than to a pen. Bright where the body lingered.",
    color: "#ffcc66",
    opacity: 0.7,
    pointKeepRate: 1,
  },
];

export const MODULE_CHOICE_STORAGE_KEY = "holoflow.play.module.choice";
export const MODULE_PASS_STORAGE_KEY = "holoflow.play.module.passed";

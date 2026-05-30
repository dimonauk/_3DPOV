/**
 * Instructables-style structured tutorial metadata.
 *
 * Layered on top of the standard `Entry` shape so that any tutorial
 * can opt in without breaking the registry. Tutorials that don't
 * supply this field render exactly as they always have — free-form
 * `Body` only. Tutorials that do supply it get the structured
 * Instructable surface rendered below the body.
 *
 * See `components/tutorials/Instructable.tsx` for the renderer and
 * `lib/tutorials/build.ts` for the author helper.
 */

export type InstructableDifficulty =
  | "novice"
  | "intermediate"
  | "advanced"
  | "expert";

/** A single sourcing link for a supply / part. Multiple suppliers per
 *  supply line, sorted by preference. */
export type InstructableSupplier = {
  /** Vendor name shown to the reader. "Bambu Lab", "Pimoroni", "iFactory3D". */
  name: string;
  /** Direct URL to the part / SKU. */
  url: string;
  /** Part number / SKU / model code for cross-referencing. */
  sku?: string;
  /** Indicative price as a free-form string ("~£18", "$22"). Optional;
   *  prices drift, so this is for guidance not exactness. */
  price?: string;
};

export type InstructableSupply = {
  name: string;
  note?: string;
  isOptional?: boolean;
  /** Optional URL where the reader can source the supply. Use
   *  `suppliers` for multiple-vendor lists; this stays as a quick
   *  single-link fallback. */
  url?: string;
  /** Multiple suppliers per part. Listed in preference order. */
  suppliers?: InstructableSupplier[];
  /** Indicative quantity needed for this trial. "1×", "a half-spool",
   *  "200 g". */
  quantity?: string;
};

/** Software the aspirant needs installed before they begin the trial.
 *  Versioned where it matters. */
export type InstructableSoftware = {
  /** Software name. "PrusaSlicer", "Blender", "ComfyUI". */
  name: string;
  /** Minimum / pinned version, free-form: "≥ 2.7", "5.1 LTS",
   *  "any current build". */
  version?: string;
  /** Official download URL. */
  url: string;
  /** Cost note: "free", "open-source", "£X", "free trial / £X/mo". */
  cost?: "free" | "open-source" | "paid" | "freemium" | string;
  /** Platforms supported: ["windows", "macos", "linux"]. */
  platforms?: Array<"windows" | "macos" | "linux" | "web" | "android" | "ios">;
  /** Optional one-liner on why this is the right tool. */
  note?: string;
};

/** A code-level dependency (npm / pip / cargo / etc.) the aspirant
 *  installs as part of the procedure. Distinct from `software` —
 *  software is the application; dependencies are libraries it pulls. */
export type InstructableDependency = {
  /** Package name as it appears in the registry. */
  name: string;
  /** Version pin / range. */
  version?: string;
  /** Which package manager. */
  registry?: "npm" | "pnpm" | "yarn" | "pip" | "cargo" | "brew" | "winget" | "apt" | "other";
  /** Direct link to the registry page. */
  url?: string;
  /** One-line role: "image processing", "3D mesh I/O", etc. */
  purpose?: string;
};

/** IKEA-style assembly figure — a flat-line illustration showing the
 *  step's geometry / motion / orientation. Usually an SVG under
 *  `/public/diagrams/<scene>/`. Distinct from a photograph (`image`):
 *  figures are abstract / instructional, photographs are the studio's
 *  bench. A step can have both. */
export type InstructableFigure = {
  /** Path to the SVG (preferred) or PNG asset, e.g.
   *  "/diagrams/dragon-scale/figure-04a.svg". */
  src: string;
  /** Alt text describing what the figure shows. */
  alt: string;
  /** Figure label for the legend, e.g. "Fig. 04a". */
  label?: string;
  /** Caption — what to focus on in the figure. */
  caption?: string;
  /** CSS max-width hint, e.g. "260px". */
  maxWidth?: string;
};

export type InstructableStep = {
  title: string;
  /** Markdown-light: paragraphs separated by `\n\n`. */
  body: string;
  /** A photograph from the studio's bench. */
  image?: { src: string; alt: string; credit?: string };
  /** One or more IKEA-style flat-line figures showing the step's
   *  geometry / motion. Rendered as a horizontal strip. */
  figures?: InstructableFigure[];
};

export type InstructableTroubleshooting = {
  symptom: string;
  cause?: string;
  fix: string;
};

export type InstructableSupplies = {
  materials?: InstructableSupply[];
  tools?: InstructableSupply[];
  /** Optional, nice-to-have provisions — Aura's term. */
  provisions?: InstructableSupply[];
};

export type InstructableMeta = {
  /** One-paragraph overview rendered above the structured surface. */
  overview?: string;
  /** Blender version the tutorial targets, e.g. "5.1". */
  blenderVersion?: string;
  /** Optional path into the studio asset/skill library this tutorial maps to. */
  libraryPath?: string;
  /** Free-form: "an evening", "3 hours of attention spread over a week". */
  time?: string;
  difficulty?: InstructableDifficulty;
  /** Free-form: "£20-£40 of PETG". */
  cost?: string;
  supplies?: InstructableSupplies;
  /** Software the aspirant needs installed before they begin. */
  software?: InstructableSoftware[];
  /** Code-level dependencies installed during the trial. */
  dependencies?: InstructableDependency[];
  /** Prerequisite skills / experience. Each item is a one-line gloss
   *  the reader can self-check. */
  prerequisites?: string[];
  steps?: InstructableStep[];
  finalResult?: string;
  variations?: string[];
  troubleshooting?: InstructableTroubleshooting[];
  /** Author-opt-in voice mode for the Test Chamber chrome. Defaults
   *  to `"aura"` per `docs/AURA-TEST-CHAMBER-VOICE.md`. Future:
   *  `"workshop"` for a plain workshop-Dimona shell. */
  voiceMode?: "aura" | "workshop";
};

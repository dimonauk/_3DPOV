/**
 * image-resize-types.ts — Types and option arrays for the image-resize chamber.
 */

export type ResizeMode  = "width" | "height" | "longest-edge";
export type FitMode     = "contain" | "cover" | "stretch";
export type OutputFormat = "png" | "jpeg" | "webp" | "avif";

export type OutputState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | { kind: "ready"; blob: Blob; previewUrl: string; filename: string; durationMs: number }
  | { kind: "error"; message: string };

export const MODE_OPTIONS: { value: ResizeMode; label: string }[] = [
  { value: "width",        label: "Width" },
  { value: "height",       label: "Height" },
  { value: "longest-edge", label: "Longest edge" },
];

export const FIT_OPTIONS: { value: FitMode; label: string; hint: string }[] = [
  { value: "contain", label: "Contain", hint: "Preserve aspect ratio; target dimension is exact." },
  { value: "cover",   label: "Cover",   hint: "Fill the target box; centre-crop the overflow." },
  { value: "stretch", label: "Stretch", hint: "Force the resampled image into the target; aspect ratio is lost." },
];

export const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: "png",  label: "PNG",  ext: "png"  },
  { value: "jpeg", label: "JPEG", ext: "jpg"  },
  { value: "webp", label: "WebP", ext: "webp" },
  { value: "avif", label: "AVIF", ext: "avif" },
];

// Shared Tailwind helpers used by both panels.
export const radioGroupCls =
  "flex flex-wrap gap-2 rounded-sm border border-warm-black-800 bg-warm-black-950 p-1";

export const radioItemCls = (active: boolean) =>
  `cursor-pointer rounded-sm px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
    active ? "bg-pink-200/20 text-pink-100" : "text-chrome-400 hover:text-chrome-200"
  }`;

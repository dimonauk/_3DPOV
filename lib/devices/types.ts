/**
 * lib/devices/types.ts — Shared types for the device catalogue.
 *
 * Lifted out of catalogue.ts so the per-category entry files (consoles
 * / controllers / vr-headsets / vr-controllers) can import the type
 * shape without circular imports, and so the 300-line cap on each
 * file holds.
 */

export type DeviceCategory =
  | "console"
  | "console-controller"
  | "vr-headset"
  | "vr-controller";

export type DeviceAttribution = {
  /** Hosting platform — "Sketchfab", "Poly Pizza", "Wikimedia". */
  source: string;
  /** Original author / uploader. */
  author: string;
  /** SPDX-style licence identifier — "CC0-1.0", "CC-BY-4.0". */
  licence: string;
  /** Direct URL to the source page. */
  url: string;
  /** Year of upload, when known. */
  year?: number;
};

export type DevicePresentation = {
  /** Multiplier applied to the loaded GLB / primitive. Default 1. */
  scale?: number;
  /** Initial Y rotation in radians. Default 0. */
  rotationY?: number;
  /** Accent colour for the plinth spot tint + placard underline. */
  accent: string;
};

export type DeviceLinks = {
  /** Codex entry slug, if the device is referenced there. */
  codex?: string;
  /** Article slug. */
  article?: string;
  /** Tutorial slug. */
  tutorial?: string;
};

export type DeviceEntry = {
  /** URL-safe identifier, used in `/atelier/devices/<slug>`. */
  slug: string;
  /** Full name as it appears on the placard. */
  name: string;
  /** Compact label used in dense lists. */
  shortName?: string;
  category: DeviceCategory;
  /** Year of original hardware release. */
  year: number;
  manufacturer: string;
  /**
   * Path under `public/models/devices/`. When the file is absent the
   * scene falls back to a category-tinted primitive — the catalogue
   * entry is still complete and the placard reads either way.
   */
  modelUrl: string;
  /** Whether the file is currently on disk. Hints the scene at fall-back. */
  modelPresent: boolean;
  attribution: DeviceAttribution;
  presentation: DevicePresentation;
  /** Princess catalogue note, one or two sentences. */
  note: string;
  links?: DeviceLinks;
};

/**
 * Display label for a category — used by the gallery showcase + the
 * single-device page.
 */
export function categoryLabel(category: DeviceCategory): string {
  switch (category) {
    case "console":
      return "Consoles";
    case "console-controller":
      return "Console controllers";
    case "vr-headset":
      return "VR headsets";
    case "vr-controller":
      return "VR controllers";
  }
}

/**
 * Ordered list of categories, used by layout code so the gallery rows
 * land in a consistent visual order regardless of catalogue iteration.
 */
export const CATEGORY_ORDER: ReadonlyArray<DeviceCategory> = [
  "console",
  "console-controller",
  "vr-headset",
  "vr-controller",
];

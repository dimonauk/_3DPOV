/**
 * lib/play/types.ts — shared types for the /play surface.
 *
 * Split out of families.ts so the per-family systems files (under
 * ./systems/) can import the SystemEntry shape without a circular
 * import back through families.ts.
 */

export type PlatformFamily =
  | "nintendo"
  | "playstation"
  | "xbox"
  | "sega"
  | "other";

/**
 * The four launch-path shapes. A tile renders the first launchable
 * one in its `launch` array; everything else is shown as a secondary
 * route on the per-system page.
 */
export type LaunchPath =
  /** EmulatorJS WASM core — handled at /emulator/[system]. */
  | { kind: "emulatorjs"; systemSlug: string }
  /** WebXR RetroArch room — handled at /atelier/webxr-retroarch/[slug]. */
  | { kind: "webxr-retroarch"; systemSlug: string }
  /** Native-only via bench bridge; the doc names the emulator. */
  | { kind: "bench-bridge"; emulator: string; doc: string }
  /** Catalogued, no launcher yet. */
  | { kind: "comingSoon" };

export type SystemEntry = {
  /** URL slug — kebab-case, what /play/<family>/<this> resolves to. */
  slug: string;
  /** Canonical name. */
  name: string;
  /** Short name for the tile. */
  shortName: string;
  /** Year released (Wikipedia-verified, first market). */
  year: number;
  /** Console-generation numbering. */
  generation: number;
  /** Which family the tile belongs to. */
  family: PlatformFamily;
  /** Manufacturer line. */
  manufacturer: string;
  /** Optional GLB path under public/models/devices/consoles/<slug>.glb. */
  modelUrl?: string;
  /** Launch paths in preferred order. */
  launch: LaunchPath[];
  /** One-line catalogue blurb — Princess teaching register. */
  blurb: string;
  /** Optional codex-entry slug for cross-reference. */
  codexSlug?: string;
};

export type FamilyMeta = {
  slug: PlatformFamily;
  name: string;
  tagline: string;
  accent: string;
};

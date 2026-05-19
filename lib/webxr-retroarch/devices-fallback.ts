/**
 * lib/webxr-retroarch/devices-fallback.ts — Helpers for picking
 * console / controller models in the WebXR RetroArch room.
 *
 * The primary catalogue lives at `lib/devices/catalogue.ts`. This
 * file holds the simple "does this system have a separate controller"
 * helper plus path conventions for when a catalogue entry doesn't
 * exist yet for a given system slug.
 *
 * License note. The studio sources console + controller GLBs from
 * CC0 / CC-BY OSS sources (Sketchfab, Quaternius, OpenGameArt) — see
 * docs/OSS-DEVICE-MODELS.md for per-model attribution.
 */

export type DeviceGlb = {
  key: string;
  url: string;
  scale: number;
};

export function fallbackConsoleGlb(systemSlug: string): DeviceGlb {
  const base = `/models/devices/consoles/${systemSlug}.glb`;
  return { key: systemSlug, url: base, scale: 1 };
}

export function fallbackControllerGlb(systemSlug: string): DeviceGlb {
  const base = `/models/devices/controllers/${systemSlug}.glb`;
  return { key: `${systemSlug}-controller`, url: base, scale: 1 };
}

/**
 * Handhelds don't have a separate controller — the device is the
 * controller. The room renders no in-hand prop for those.
 */
export function hasSeparateController(systemSlug: string): boolean {
  const handhelds = new Set([
    "gb",
    "gbc",
    "gba",
    "nds",
    "segagg",
    "lynx",
  ]);
  return !handhelds.has(systemSlug);
}

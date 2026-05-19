/**
 * lib/devices/catalogue.ts — OSS GLB device catalogue composition.
 *
 * Direction (Dimona, 2026-05-19): "fold in open source glb files for
 * games consoles and controlers and vr headsets ajd controllers etc".
 *
 * Per-category entry lists live under `./entries/`; the shared types
 * are in `./types`. This file composes them into the catalogue used
 * across the gallery scene, the card grid, and the per-device focused
 * view. Keeping each entries file in its own module keeps any single
 * file under the 300-line cap and lets a future split between
 * curated-by-Dimona and AI-curated entries land cleanly.
 *
 * Voice on each `note`: Princess catalogue mode — short, what-it-is.
 * Voice on `docs/OSS-DEVICE-MODELS.md`: workshop-Dimona.
 */

import { CONSOLE_ENTRIES } from "./entries/consoles";
import { CONTROLLER_ENTRIES } from "./entries/controllers";
import { VR_CONTROLLER_ENTRIES } from "./entries/vr-controllers";
import { VR_HEADSET_ENTRIES } from "./entries/vr-headsets";
import type { DeviceCategory, DeviceEntry } from "./types";

// Re-export the type surface so consumers only need one import.
export type {
  DeviceAttribution,
  DeviceCategory,
  DeviceEntry,
  DeviceLinks,
  DevicePresentation,
} from "./types";
export { CATEGORY_ORDER, categoryLabel } from "./types";

/**
 * The full seed catalogue. Ten consoles, six console controllers,
 * four VR headsets, four VR controllers — twenty-three entries, all
 * CC0 across the seeded set.
 */
export const DEVICE_CATALOGUE: ReadonlyArray<DeviceEntry> = [
  ...CONSOLE_ENTRIES,
  ...CONTROLLER_ENTRIES,
  ...VR_HEADSET_ENTRIES,
  ...VR_CONTROLLER_ENTRIES,
];

/**
 * Look up a single device by slug. Returns undefined when nothing
 * matches — callers should 404.
 */
export function findDevice(slug: string): DeviceEntry | undefined {
  return DEVICE_CATALOGUE.find((d) => d.slug === slug);
}

/**
 * Defensive copy so callers can sort or filter without mutating the
 * seed array.
 */
export function listDevices(): DeviceEntry[] {
  return DEVICE_CATALOGUE.slice();
}

/**
 * All devices of a given category, in catalogue order.
 */
export function devicesByCategory(category: DeviceCategory): DeviceEntry[] {
  return DEVICE_CATALOGUE.filter((d) => d.category === category);
}

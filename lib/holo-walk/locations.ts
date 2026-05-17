/**
 * lib/holo-walk/locations.ts — Thin re-export hub for the HoloWalk
 * catalogue.
 *
 * The original 2039-line file held three concerns:
 *   - the typed shape (`SculptureLocation`, `SculptureSpec`, etc.)
 *   - the LOCATIONS data array (132 entries, 1700+ lines)
 *   - the query/math helpers (haversine, getAttractorParams, ...)
 *
 * Split per ARCHITECTURE.md Rule 1 into:
 *   - `./types.ts`    — type definitions
 *   - `./data.ts`     — the LOCATIONS array (registry-exception)
 *   - `./helpers.ts`  — pure-function query layer
 *
 * This file now re-exports the public surface so every existing
 * import (`from "lib/holo-walk/locations"`) keeps working without
 * change. New code may import from the focused files directly.
 *
 * # Why this exists
 * - Types-only consumers (route handlers, AR capabilities) no longer
 *   pull in the 1700-line LOCATIONS constant just to read a type.
 * - The helpers file is now testable in isolation; mock the
 *   LOCATIONS import for distance/filter unit tests.
 * - The data file is the operator's editable surface — adding a
 *   trail location touches only `data.ts`.
 */

export type {
  LocationWithDistance,
  ResolvedAttractor,
  SculptureLocation,
  SculptureSpec,
  SplatAsset,
} from "./types";

export {
  getAttractorParams,
  getLocation,
  haversineMeters,
  listLocations,
  locationsByCity,
  locationsNear,
} from "./helpers";

export { LOCATIONS } from "./data";

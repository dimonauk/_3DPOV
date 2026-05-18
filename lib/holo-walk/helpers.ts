/**
 * lib/holo-walk/helpers.ts — Query + math helpers for the HoloWalk
 * catalogue.
 *
 * Extracted from `lib/holo-walk/locations.ts` per ARCHITECTURE.md
 * Rule 1. The data + types live in sibling files; this module is the
 * pure-function layer over LOCATIONS that every consumer (the
 * `/holo-walk` index, the per-id detail page, the AR view, the QR
 * route, the Aura banter route, the CCTV cross-reference chamber)
 * has been calling all along.
 *
 * Re-exported from `lib/holo-walk/locations.ts` so existing imports
 * continue to work.
 */

import { LOCATIONS } from "./data";
import type {
  LocationWithDistance,
  ResolvedAttractor,
  SculptureLocation,
  SculptureSpec,
} from "./types";

/** Earth radius in metres, mean sphere. */
const EARTH_R_M = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Haversine great-circle distance between two (lat, lon) pairs in
 * metres. Returns `NaN` when any input is non-finite — callers MUST
 * guard with `Number.isFinite()` before using the result for distance
 * gating (the AR view's "out of range" / "arrived" thresholds would
 * silently misbehave otherwise).
 */
export function haversineMeters(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  if (
    !Number.isFinite(aLat) ||
    !Number.isFinite(aLon) ||
    !Number.isFinite(bLat) ||
    !Number.isFinite(bLon)
  ) {
    return Number.NaN;
  }
  const dLat = toRadians(bLat - aLat);
  const dLon = toRadians(bLon - aLon);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_R_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

const DEFAULT_PARTICLE_COUNT = 60_000;
const DEFAULT_SCALE = 1;

export function getAttractorParams(
  spec: SculptureSpec,
): ResolvedAttractor | null {
  if (spec.kind === "attractor") {
    return {
      engine: spec.engine,
      particleCount: spec.particleCount ?? DEFAULT_PARTICLE_COUNT,
      scale: spec.scale ?? DEFAULT_SCALE,
    };
  }
  // splat-primary: use the optional fallback attractor when present
  if (spec.fallbackAttractor) {
    return {
      engine: spec.fallbackAttractor.engine,
      particleCount:
        spec.fallbackAttractor.particleCount ?? DEFAULT_PARTICLE_COUNT,
      scale: spec.fallbackAttractor.scale ?? DEFAULT_SCALE,
    };
  }
  return null;
}

/** Every catalogued trail location, in the order they were committed. */
export function listLocations(): SculptureLocation[] {
  return LOCATIONS.slice();
}

/** Look up a location by its kebab-case id. */
export function getLocation(id: string): SculptureLocation | undefined {
  return LOCATIONS.find((l) => l.id === id);
}

/** Every location in a given city, in catalogue order. */
export function locationsByCity(city: string): SculptureLocation[] {
  return LOCATIONS.filter((l) => l.city === city);
}

/**
 * Every location within `radiusMeters` of the given point, sorted
 * nearest-first, each with its distance attached. The viewer's GPS
 * fix supplies the input pair.
 */
export function locationsNear(
  lat: number,
  lon: number,
  radiusMeters: number,
): LocationWithDistance[] {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
  const matches: LocationWithDistance[] = [];
  for (const loc of LOCATIONS) {
    const distanceMeters = haversineMeters(
      lat,
      lon,
      loc.coords.lat,
      loc.coords.lon,
    );
    // `<= radius` is false for NaN, so the guard here is belt-and-
    // braces, but call it out explicitly so a future refactor that
    // changes the comparator doesn't silently let NaN slip through.
    if (Number.isFinite(distanceMeters) && distanceMeters <= radiusMeters) {
      matches.push({ ...loc, distanceMeters });
    }
  }
  matches.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return matches;
}

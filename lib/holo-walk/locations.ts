/**
 * lib/holo-walk/locations.ts — Typed catalogue for the HoloWalk outdoor sculpture trail.
 *
 * # Purpose
 * The data layer behind the AR sculpture trail: a per-location record
 * naming where each light-painting was made, which compass direction
 * the photographer was facing, which photograph it ties to, and which
 * attractor engine should be re-instantiated in situ when a visitor
 * holds up a phone. Without this catalogue, the trail has nothing to
 * anchor to.
 *
 * # Why this shape
 * - A discriminated union on `sculpture.kind` keeps room for future
 *   rendering kinds (mesh, volumetric, video) without breaking v0.1.
 * - Helpers stay near the data so consumers (route pages, the AR
 *   geospatial capability, Aura's narration runner) import a single
 *   module rather than re-implementing distance maths.
 * - Haversine is inlined: one function, twelve lines, zero new
 *   dependencies. A shared `lib/math/geo.ts` would be premature with
 *   one caller.
 */

import type { AttractorEngine } from "lib/state/viz";

/** A point on the trail — one light-sculpture, one location, one photograph. */
export type SculptureLocation = {
  readonly id: string;
  readonly name: string;
  readonly city: "manchester" | "london" | string;
  readonly coords: { readonly lat: number; readonly lon: number };
  /** Compass degrees (0 = north, clockwise) the photographer was facing. */
  readonly headingAtCapture: number;
  /** ISO 8601 date the photograph was made. */
  readonly captureDate: string;
  /** URL or `/photographs/...` route slug for the source image. */
  readonly originalPhoto: string;
  readonly sculpture: SculptureSpec;
  /** Per-spot Aura narration script (Princess voice). Optional. */
  readonly narrationScript?: string;
  /** Render distance envelope in metres — visible from `renderFromM`, fully detailed at `renderToM`. */
  readonly range: { readonly renderFromM: number; readonly renderToM: number };
  /** One-paragraph description in Dimona's bench register. */
  readonly description: string;
};

/** Discriminated rendering-kind union. v0.1 only ships `attractor`. */
export type SculptureSpec = {
  readonly kind: "attractor";
  readonly engine: AttractorEngine;
  readonly particleCount?: number;
  readonly scale?: number;
};

/** Result of a `locationsNear` query — the location with its distance attached. */
export type LocationWithDistance = SculptureLocation & {
  readonly distanceMeters: number;
};

// PLACEHOLDER — replace with real shoot location coords once the
// trail's first five spots are surveyed on foot with a calibrated
// phone compass. Names, cities and headings are also placeholder.
const LOCATIONS: ReadonlyArray<SculptureLocation> = [
  {
    id: "salford-quays-coil",
    name: "Salford Quays Coil",
    city: "manchester",
    coords: { lat: 53.4715, lon: -2.2901 }, // PLACEHOLDER — replace with real shoot location
    headingAtCapture: 215,
    captureDate: "2024-11-03",
    originalPhoto: "/photographs/salford-quays-coil",
    sculpture: { kind: "attractor", engine: "lorenz", particleCount: 50_000, scale: 1.4 },
    narrationScript:
      "I stood with my back to the water for this one. The rig swung in a long looping coil over the boardwalk and the long exposure caught the lot in a single frame.",
    range: { renderFromM: 80, renderToM: 8 },
    description:
      "Shot late autumn off the boardwalk at Salford Quays — flat water, low wind, the bridge lights doing half the work. The rig walked a slow Lorenz pass while I counted the seconds out under my breath. It's the most stable engine in the kit and the quays gave it the room it wanted.",
  },
  {
    id: "northern-quarter-thomas",
    name: "Northern Quarter Lattice",
    city: "manchester",
    coords: { lat: 53.4839, lon: -2.2358 }, // PLACEHOLDER — replace with real shoot location
    headingAtCapture: 92,
    captureDate: "2025-02-17",
    originalPhoto: "/photographs/northern-quarter-lattice",
    sculpture: { kind: "attractor", engine: "thomas", particleCount: 42_000, scale: 0.9 },
    narrationScript:
      "Tib Street, well after the bars shut. Aura held a thomas kata while the rain held off — the trace came out soft and even, which is what thomas wants from you.",
    range: { renderFromM: 60, renderToM: 6 },
    description:
      "Tucked between Tib Street and a long shutter of graffiti, this one needed a still night and got it. Thomas is the softest of the four engines — symmetrical, slow, forgiving — and the brick walls behind it took the bounce light cleanly. A two-minute exposure, no second take.",
  },
  {
    id: "trafalgar-square-clifford",
    name: "Trafalgar Square Wing",
    city: "london",
    coords: { lat: 51.508, lon: -0.1281 }, // PLACEHOLDER — replace with real shoot location
    headingAtCapture: 340,
    captureDate: "2024-09-22",
    originalPhoto: "/photographs/trafalgar-square-wing",
    sculpture: { kind: "attractor", engine: "clifford", particleCount: 48_000, scale: 1.1 },
    narrationScript:
      "I had the square more or less to myself between the cleaners and the early commute. A Clifford pass against Nelson — the curve hung in the air and the camera held the room open.",
    range: { renderFromM: 100, renderToM: 10 },
    description:
      "Made in that quiet hour between the street-cleaners and the first commuters, with the column behind me and the fountains rinsing the ambient down. Clifford gives you a planar butterfly when the rig walks it well, and the square's flat stone played the part of a printer's bed for the trace.",
  },
  {
    id: "bankside-coil",
    name: "Bankside Coil",
    city: "london",
    coords: { lat: 51.5076, lon: -0.0994 }, // PLACEHOLDER — replace with real shoot location
    headingAtCapture: 175,
    captureDate: "2025-03-08",
    originalPhoto: "/photographs/bankside-coil",
    sculpture: { kind: "attractor", engine: "dequan-li", particleCount: 36_000, scale: 1.6 },
    narrationScript:
      "Bankside, low tide, river smell. Dequan-Li is the most chaotic engine I keep in the kit and the riverbed lit it perfectly — every fold of the trace held its own shadow.",
    range: { renderFromM: 70, renderToM: 7 },
    description:
      "On the foreshore at low tide, between the Tate's flank and the wall. Dequan-Li is the restless one — the trace folds back on itself and the riverbed's small puddles bounced the light around in a way I couldn't have planned. A four-minute exposure, river working with me.",
  },
  {
    id: "hackney-lorenz",
    name: "Hackney Garage Lorenz",
    city: "london",
    coords: { lat: 51.5475, lon: -0.0566 }, // PLACEHOLDER — replace with real shoot location
    headingAtCapture: 60,
    captureDate: "2025-04-19",
    originalPhoto: "/photographs/hackney-garage-lorenz",
    sculpture: { kind: "attractor", engine: "lorenz", particleCount: 50_000, scale: 1.2 },
    narrationScript:
      "An old garage on a Hackney back-street, dust catching the LEDs like cheap glitter. A Lorenz pass and the dust did half the work for me — there's no other reason for that texture in the print.",
    range: { renderFromM: 50, renderToM: 5 },
    description:
      "A friend's dad's garage off a Hackney back-street, the kind of room that wears its history on the walls. Dust in the air caught the LED array's light and held it; the print's grain isn't an effect, it's actual airborne dust standing in for a softbox. Lorenz again, because Lorenz is what I reach for when the room is already the picture.",
  },
];

/** Earth radius in metres, mean sphere. */
const EARTH_R_M = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Haversine great-circle distance between two (lat, lon) pairs in metres. */
function haversineMeters(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const dLat = toRadians(bLat - aLat);
  const dLon = toRadians(bLon - aLon);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_R_M * Math.asin(Math.min(1, Math.sqrt(h)));
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
  const matches: LocationWithDistance[] = [];
  for (const loc of LOCATIONS) {
    const distanceMeters = haversineMeters(lat, lon, loc.coords.lat, loc.coords.lon);
    if (distanceMeters <= radiusMeters) {
      matches.push({ ...loc, distanceMeters });
    }
  }
  matches.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return matches;
}

/**
 * lib/cctv/match.ts — Cross-reference TfL JamCams against HoloWalk locations.
 *
 * One-line role: pure functions that compute (camera, location) pairs
 * within a configurable radius. Used by both the CLI script
 * (`scripts/cctv-match-holowalk.ts`) and the route
 * (`app/atelier/cctv-cross-reference`).
 */

import type { SculptureLocation } from "lib/holo-walk/locations";

import { extractCameraMedia, type TflJamCam } from "./tfl";

export type CctvMatch = {
  location: {
    id: string;
    name: string;
    city: string;
    lat: number;
    lon: number;
  };
  camera: {
    id: string;
    name: string;
    lat: number;
    lon: number;
    videoUrl?: string;
    imageUrl?: string;
  };
  /** Great-circle distance in metres. */
  distanceMeters: number;
};

const EARTH_R_M = 6_371_000;
const toRad = (d: number): number => (d * Math.PI) / 180;

/** Haversine great-circle distance between two (lat, lon) pairs in metres. */
export function haversine(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_R_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Compute (camera, location) pairs within the given radius. Non-London
 * locations are skipped (TfL only covers Greater London). Pairs are
 * sorted nearest-first; multiple cameras per location are allowed.
 */
export function matchCamerasToLocations(
  cams: TflJamCam[],
  locations: SculptureLocation[],
  radiusMeters: number,
): CctvMatch[] {
  const matches: CctvMatch[] = [];
  for (const loc of locations) {
    if (loc.city !== "london") continue;
    for (const cam of cams) {
      if (typeof cam.lat !== "number" || typeof cam.lon !== "number") continue;
      const d = haversine(loc.coords.lat, loc.coords.lon, cam.lat, cam.lon);
      if (d > radiusMeters) continue;
      const media = extractCameraMedia(cam);
      matches.push({
        location: {
          id: loc.id,
          name: loc.name,
          city: loc.city,
          lat: loc.coords.lat,
          lon: loc.coords.lon,
        },
        camera: {
          id: cam.id,
          name: cam.commonName ?? cam.id,
          lat: cam.lat,
          lon: cam.lon,
          videoUrl: media.videoUrl,
          imageUrl: media.imageUrl,
        },
        distanceMeters: d,
      });
    }
  }
  matches.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return matches;
}

/** Group matches by location id, preserving nearest-first order within each group. */
export function groupByLocation(matches: CctvMatch[]): Map<string, CctvMatch[]> {
  const out = new Map<string, CctvMatch[]>();
  for (const m of matches) {
    const list = out.get(m.location.id) ?? [];
    list.push(m);
    out.set(m.location.id, list);
  }
  return out;
}

import zonesData from "../../data/neo-london/zones.json";
import type { SplatStatus, SplatZone } from "./types";

/**
 * Neo-London zone registry.
 *
 * The JSON file at data/neo-london/zones.json is the source of truth.
 * Edit it by hand when a new splat lands (see docs/SHARP_PIPELINE.md).
 * This module re-exports the typed list, a slug lookup, a
 * status-filtered helper, and a precomputed status tally that the
 * map page renders.
 */

export const zones: SplatZone[] = zonesData as SplatZone[];

export function getZoneBySlug(slug: string): SplatZone | undefined {
  return zones.find((z) => z.slug === slug);
}

export function zonesByStatus(status: SplatStatus): SplatZone[] {
  return zones.filter((z) => z.status === status);
}

/**
 * Tally of zones at each status. Built once at module load so the
 * page can render counts without re-filtering.
 */
export const ZONE_COUNT_BY_STATUS: Record<SplatStatus, number> = {
  placeholder: 0,
  "frame-captured": 0,
  "splat-rendered": 0,
  "mesh-added": 0,
  playable: 0,
};

for (const zone of zones) {
  ZONE_COUNT_BY_STATUS[zone.status] += 1;
}

/**
 * Bounding box for the London map. Loose &mdash; covers Greater London
 * end-to-end so any future zone within the M25 fits. Used by the SVG
 * map for lat/lng &rarr; pixel interpolation.
 */
export const LONDON_BOUNDS = {
  latMin: 51.28,
  latMax: 51.69,
  lngMin: -0.51,
  lngMax: 0.33,
} as const;

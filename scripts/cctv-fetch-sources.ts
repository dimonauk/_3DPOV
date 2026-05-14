/**
 * scripts/cctv-fetch-sources.ts — Source resolvers for cctv-fetch.
 *
 * Each FetchSource.kind maps to a resolver that returns a list of
 * Candidate stills to attempt. The studio adds TfL JamCams (public,
 * no auth) and a manual-list for ad-hoc URLs; placeholder is a stub
 * for sources in development.
 */

import { stderr } from "node:process";

import type { Candidate, FetchSource, TflJamCam } from "./cctv-fetch-types";

export async function resolveCandidates(
  source: FetchSource,
): Promise<Candidate[]> {
  switch (source.kind) {
    case "tfl-jamcam":
      return resolveTflJamCams(source);
    case "manual-list":
      return resolveManualList(source);
    case "placeholder":
      return [];
    default:
      stderr.write(`Unknown source kind for ${source.id}, skipping.\n`);
      return [];
  }
}

async function resolveTflJamCams(source: FetchSource): Promise<Candidate[]> {
  if (!source.endpoint) {
    throw new Error(`Source ${source.id} (tfl-jamcam) needs an endpoint.`);
  }
  const res = await fetch(source.endpoint);
  if (!res.ok) {
    throw new Error(
      `TFL JamCams endpoint returned ${res.status} ${res.statusText}`,
    );
  }
  const raw: unknown = await res.json();
  if (!Array.isArray(raw)) {
    throw new Error("TFL JamCams response was not an array.");
  }
  const out: Candidate[] = [];
  for (const item of raw as TflJamCam[]) {
    if (!item || typeof item.id !== "string") continue;
    const propList = Array.isArray(item.additionalProperties)
      ? item.additionalProperties
      : [];
    let imageUrl: string | undefined;
    let available = true;
    for (const p of propList) {
      if (!p) continue;
      if (p.key === "imageUrl" && typeof p.value === "string") {
        imageUrl = p.value;
      }
      if (p.key === "available" && typeof p.value === "string") {
        if (p.value.toLowerCase() === "false") available = false;
      }
    }
    if (!imageUrl || !available) continue;
    out.push({
      cameraId: item.id,
      imageUrl,
      lat: typeof item.lat === "number" ? item.lat : undefined,
      lng: typeof item.lon === "number" ? item.lon : undefined,
      label: item.commonName,
      splatSource: "cctv-tfl",
    });
  }
  return out;
}

function resolveManualList(source: FetchSource): Candidate[] {
  const urls = source.urls ?? [];
  return urls.map((u) => ({
    cameraId: u.cameraId,
    imageUrl: u.imageUrl,
    lat: u.lat,
    lng: u.lng,
    label: u.label,
    splatSource: "manual",
  }));
}

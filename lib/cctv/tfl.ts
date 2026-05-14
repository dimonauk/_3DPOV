/**
 * lib/cctv/tfl.ts — TfL JamCams catalogue fetch.
 *
 * One-line role: pull the live TfL JamCams listing with sensible caching
 * so server components and CLI scripts share one source-of-truth for the
 * live camera set.
 */

export type TflJamCam = {
  id: string;
  commonName?: string;
  lat?: number;
  lon?: number;
  additionalProperties?: Array<{ key?: string; value?: string }>;
};

const TFL_JAMCAMS_URL = "https://api.tfl.gov.uk/Place/Type/JamCam";

/**
 * Fetch all TfL JamCam entries. Cached for 1 hour at the Next.js fetch
 * layer; CLI invocations bypass cache.
 */
export async function fetchJamCams(): Promise<TflJamCam[]> {
  const res = await fetch(TFL_JAMCAMS_URL, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600, tags: ["cctv-tfl-jamcams"] },
  });
  if (!res.ok) {
    throw new Error(
      `TfL JamCams fetch failed: ${res.status} ${res.statusText}`,
    );
  }
  const json: unknown = await res.json();
  if (!Array.isArray(json)) throw new Error("Unexpected TfL response shape");
  return json as TflJamCam[];
}

/** Pull videoUrl / imageUrl from a TfL camera's additionalProperties. */
export function extractCameraMedia(cam: TflJamCam): {
  videoUrl?: string;
  imageUrl?: string;
} {
  const props = cam.additionalProperties ?? [];
  const lookup = (key: string): string | undefined =>
    props.find((p) => p.key?.toLowerCase() === key.toLowerCase())?.value;
  return {
    videoUrl: lookup("videoUrl"),
    imageUrl: lookup("imageUrl"),
  };
}

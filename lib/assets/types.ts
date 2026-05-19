/**
 * lib/assets/types.ts — Shared types for the asset registry.
 *
 * The asset registry is the single source of truth for every
 * mesh, Blender file, scan, archive, or media asset the site
 * references but doesn't ship in the build. See
 * `docs/ASSET-HOSTING.md` for the hosting policy + size
 * thresholds.
 */

export type AssetKind =
  | "mesh" // .glb / .obj / .ply / .stl
  | "blend" // .blend project file
  | "scan" // raw photogrammetry / lidar / structured-light output
  | "texture" // standalone texture map
  | "video" // .mp4, etc.
  | "audio" // .wav / .mp3
  | "archive" // .zip / .tar.gz bundle
  | "image" // when not served from /public/
  | "other";

export type AssetHost =
  | "vercel-blob" // public Blob URL
  | "google-drive" // Drive-direct-download URL via driveId
  | "google-photos" // Google Photos shared album / image
  | "public-static" // served from /public/<path>
  | "external"; // any other absolute URL (use sparingly)

/**
 * One entry in `data/assets.json`. The shape is the registry
 * contract — once an asset has an id, every consumer reads it
 * through `getAsset(id)` and we can change `host` / `url` /
 * `driveId` without touching consumer code.
 */
export type Asset = {
  /** Stable kebab-case slug. Never changes once published. */
  id: string;

  /** Human-readable name. Surfaces in catalogue UIs + alt text. */
  name: string;

  /** Kind enum. Drives which <MeshAsset> / <BlendAsset> /
   *  <VideoAsset> component renders it. */
  kind: AssetKind;

  /** File extension without the dot. */
  format: string;

  /** File size in bytes. Used by the picker UI to surface "this is a
   *  500 MB download" warnings + by the resolver to validate the
   *  host choice matches the size policy. */
  bytes: number;

  /** Where the file lives. */
  host: AssetHost;

  /** Canonical embed/download URL. For google-drive entries this is
   *  the synthesised direct-download URL; for vercel-blob entries
   *  it's the public blob URL; for public-static it's a path under
   *  /public/. */
  url: string;

  /** Google Drive file id, when host = "google-drive". Lets us swap
   *  the file behind the entry by replacing the id (e.g. uploading
   *  a v2) without invalidating the id slug. */
  driveId?: string;

  /** Licence tag. Defaults to `studio-proprietary` if absent. */
  licence?:
    | "studio-proprietary"
    | "cc0"
    | "cc-by"
    | "cc-by-nc"
    | "cc-by-sa"
    | "cc-by-nc-sa"
    | "apache-2.0"
    | "mit"
    | "research-only" // e.g. SHARP, Apple AMLR-licensed splats
    | "other";

  /** Credit string when not authored by the studio. */
  attribution?: string;

  /** Free-form tags for filter/search UIs. */
  tags?: string[];

  /** Optional ISO timestamp when this asset was added or last
   *  refreshed. The registry doesn't sort by date — this is for
   *  the operator dashboard's recency column. */
  publishedAt?: string;
};

/** Wrapper shape for `data/assets.json`. Single top-level `assets`
 *  array so the file is easy to lint + diff. */
export type AssetRegistry = {
  assets: Asset[];
};

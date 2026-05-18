/**
 * lib/assets/resolve.ts — Asset registry lookup.
 *
 * Consumers go through this module instead of touching
 * `data/assets.json` directly. Lets the registry change shape
 * (extra hosts, file moves between hosts, URL normalisation) without
 * a sweep through call-sites.
 *
 * See `docs/ASSET-HOSTING.md` for the hosting policy.
 */

import assetsData from "../../data/assets.json";

import type { Asset, AssetHost, AssetKind, AssetRegistry } from "./types";

const REGISTRY: AssetRegistry = assetsData as AssetRegistry;

/** Look up an asset by id. Returns null on miss; never throws. */
export function getAsset(id: string): Asset | null {
  return REGISTRY.assets.find((a) => a.id === id) ?? null;
}

/** Convenience: resolved URL for an asset id, or null if not found. */
export function assetUrl(id: string): string | null {
  return getAsset(id)?.url ?? null;
}

/** Filter the registry by kind. */
export function assetsByKind(kind: AssetKind): Asset[] {
  return REGISTRY.assets.filter((a) => a.kind === kind);
}

/** Filter by tag (any of). */
export function assetsByTag(tag: string): Asset[] {
  return REGISTRY.assets.filter((a) => a.tags?.includes(tag));
}

/** All registry entries. */
export function allAssets(): Asset[] {
  return REGISTRY.assets;
}

/**
 * Normalise a Google Drive file id to a direct-download URL.
 * Drive's share URLs come in two flavours:
 *   https://drive.google.com/file/d/<ID>/view?usp=sharing
 *   https://drive.google.com/open?id=<ID>
 * The direct-download form is:
 *   https://drive.google.com/uc?export=download&id=<ID>
 * Use this when populating the `url` field for a new google-drive
 * asset, or when constructing a URL from an arbitrary share link.
 */
export function driveDirectUrl(driveId: string): string {
  return `https://drive.google.com/uc?export=download&id=${driveId}`;
}

/**
 * Extract a Drive file id from a share URL (best effort). Returns
 * null if the URL doesn't match the known Drive formats.
 */
export function parseDriveId(shareUrl: string): string | null {
  const m1 = shareUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1] ?? null;
  const m2 = shareUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1] ?? null;
  return null;
}

/**
 * Whether an asset id resolves to a remote (off-Vercel) host. Useful
 * for deciding whether to render via the local `<MeshAsset>` (Blob /
 * static) or via a CORS proxy (`<RemoteMeshAsset>` for Drive).
 */
export function isRemoteHost(host: AssetHost): boolean {
  return host === "google-drive" || host === "google-photos" || host === "external";
}

/**
 * Format an asset's size for UI display. Returns "8.4 MB" /
 * "412 MB" / "1.2 GB" style strings.
 */
export function formatAssetSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

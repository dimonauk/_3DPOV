/**
 * components/three/index.ts — Public surface for the registry-backed
 * asset components.
 *
 * All three resolve through `lib/assets/resolve.ts` so a swap in
 * data/assets.json (e.g. moving an asset from Drive to Blob) doesn't
 * require touching consumers.
 */

export { default as MeshAsset } from "./MeshAsset";
export type { MeshAssetProps } from "./MeshAsset";

export { default as BlendAsset } from "./BlendAsset";
export type { BlendAssetProps } from "./BlendAsset";

export { default as PhotosAlbumAsset } from "./PhotosAlbumAsset";
export type { PhotosAlbumAssetProps } from "./PhotosAlbumAsset";

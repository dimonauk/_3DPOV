/**
 * lib/stage/types.ts — Types for the VRM-world Stage system.
 *
 * The Stage is the studio's "VRM character in a good-looking world"
 * primitive. A Stage is composed of:
 *   - an Environment (HDRI image-based lighting + background)
 *   - an Avatar (the VRM character, optional — Stages without a VRM are
 *     useful for previewing the room itself)
 *   - any number of Props (loaded GLB / GLTF meshes placed in the scene)
 *   - a Ground (contact-shadow plane + optional floor material)
 *   - a Camera target (where the camera looks; defaults to the avatar)
 *
 * A `RoomConfig` is a serialisable description of a Stage's contents.
 * Rooms live in lib/stage/rooms.ts; the Stage component reads a room
 * config and assembles the scene. This is the seam DollyOS rooms will
 * migrate into.
 */

import type { Vector3Tuple, EulerTuple } from "three";

export type Vec3 = Vector3Tuple;
export type Euler = EulerTuple;

/**
 * Where the HDRI comes from. Two paths:
 *
 *   - `preset`: one of Drei's built-in @react-three/drei envmap presets,
 *     fetched from drei-assets jsdelivr CDN. Fast, reliable, no setup.
 *     Options: "apartment" | "city" | "dawn" | "forest" | "lobby" |
 *     "night" | "park" | "studio" | "sunset" | "warehouse".
 *
 *   - `url`: a path to an `.hdr` (Radiance) or `.exr` (OpenEXR) file
 *     served from this app. Drop the file in `public/hdri/<name>.hdr`
 *     and reference it as `"/hdri/<name>.hdr"`. Use this for
 *     ComfyUI-generated equirects via the Flux + Equirectangular LoRA
 *     v3 workflow (see [[dollyos-comfyui-3d]] skill).
 */
export type EnvironmentSpec =
  | { kind: "preset"; preset: DreiEnvPreset; background?: boolean; blur?: number }
  | { kind: "url"; url: string; background?: boolean; blur?: number };

export type DreiEnvPreset =
  | "apartment"
  | "city"
  | "dawn"
  | "forest"
  | "lobby"
  | "night"
  | "park"
  | "studio"
  | "sunset"
  | "warehouse";

export type AvatarSpec = {
  /** URL to a .vrm file. Defaults to /dimona.vrm for the studio's own. */
  url: string;
  position?: Vec3;
  rotation?: Euler;
  /** Optional stable ID forwarded to the VRMAvatar component. */
  id?: string;
};

export type PropSpec = {
  /** URL to a .glb or .gltf file. */
  url: string;
  position?: Vec3;
  rotation?: Euler;
  scale?: number | Vec3;
  /** Whether this prop casts/receives shadows. Default both true. */
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Free-text label, used in dev overlay only. */
  label?: string;
};

export type GroundSpec = {
  /**
   * "contact" — only ContactShadows, no visible floor.
   *   Good when the HDRI provides a believable ground (warehouse, park).
   * "plane" — a flat colored floor plane + ContactShadows.
   *   Good for studio shots with a neutral background.
   * "none" — no ground at all. The avatar floats.
   */
  kind: "contact" | "plane" | "none";
  /** Hex colour for "plane" mode. Ignored otherwise. */
  color?: string;
  /** Y-position for the ground plane. 0 by default. */
  y?: number;
};

export type CameraSpec = {
  /** Where the camera lives initially. */
  position: Vec3;
  /** What the camera looks at initially. */
  target: Vec3;
  /** Vertical field of view in degrees. */
  fov?: number;
  /** Whether OrbitControls are enabled (flat mode only). */
  orbit?: boolean;
};

export type PostSpec = {
  /** Enable bloom on emissive surfaces. */
  bloom?: boolean;
  /** 0..1 — how much vignette to apply at corners. */
  vignette?: number;
  /** Enable ACES tone-mapping. Default true; rarely turn off. */
  toneMapping?: boolean;
};

export type RoomConfig = {
  /** Slug used as the URL fragment + cache key. */
  slug: string;
  /** Human label for the dev overlay. */
  name: string;
  environment: EnvironmentSpec;
  ground: GroundSpec;
  camera: CameraSpec;
  avatar?: AvatarSpec;
  props?: PropSpec[];
  post?: PostSpec;
  /**
   * Background fallback while the HDRI loads. Hex. The Stage paints
   * this on the Canvas's <color attach="background"> before the
   * environment swaps in.
   */
  fallbackBackground?: string;
};

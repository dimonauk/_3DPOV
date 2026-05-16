/**
 * lib/stage/rooms.ts — Named Stage room presets.
 *
 * A room is a serialisable config: where the camera lives, which HDRI
 * lights the scene, what the ground looks like, which VRM avatar (if
 * any) stands in it, which props decorate it. The Stage component
 * reads a room and assembles the scene.
 *
 * This is the seam DollyOS scenes (VolumetricVoid, MultiplaneViewport,
 * ParallaxStage) will migrate into — each becomes a room config here,
 * not a hand-rolled R3F component.
 *
 * To add a new room:
 *   1. Add an entry below
 *   2. Reference it via /stage?room=<slug>
 *   3. If it uses a custom HDRI, drop the .hdr into public/hdri/
 *
 * To add a custom HDRI:
 *   - Easiest: download a 2K .hdr from polyhaven.com (CC0), drop into
 *     public/hdri/<name>.hdr, point environment.url at "/hdri/<name>.hdr".
 *   - Bespoke: generate via ComfyUI Flux + Equirectangular LoRA v3
 *     (see [[dollyos-comfyui-3d]] skill), export as 32-bit .hdr,
 *     same drop-in.
 */

import type { RoomConfig } from "./types";

export const DEFAULT_AVATAR_URL = "/dimona.vrm";

/**
 * The studio's reference room. Neutral lighting, no props, just the
 * avatar. This is the room any new Stage surface should start in
 * before customising.
 */
const STUDIO: RoomConfig = {
  slug: "studio",
  name: "Studio · neutral grey",
  environment: {
    kind: "preset",
    preset: "studio",
    background: true,
    blur: 0.4,
  },
  ground: {
    kind: "contact",
    y: 0,
  },
  camera: {
    position: [0, 1.3, 2.4],
    target: [0, 1.2, 0],
    fov: 35,
    orbit: true,
  },
  avatar: {
    url: DEFAULT_AVATAR_URL,
    position: [0, 0, 0],
    rotation: [0, Math.PI, 0],
  },
  post: {
    bloom: true,
    vignette: 0.2,
    toneMapping: true,
  },
  fallbackBackground: "#1a1a1f",
};

/**
 * Warehouse — broader, lit from sky-domes. The HDRI itself shows a
 * believable floor so we skip the plane. Good for environment shots
 * and when the avatar should feel placed in real space.
 */
const WAREHOUSE: RoomConfig = {
  slug: "warehouse",
  name: "Warehouse · open shell",
  environment: {
    kind: "preset",
    preset: "warehouse",
    background: true,
    blur: 0,
  },
  ground: {
    kind: "contact",
    y: 0,
  },
  camera: {
    position: [0, 1.6, 3.0],
    target: [0, 1.2, 0],
    fov: 40,
    orbit: true,
  },
  avatar: {
    url: DEFAULT_AVATAR_URL,
    position: [0, 0, 0],
    rotation: [0, Math.PI, 0],
  },
  post: {
    bloom: true,
    vignette: 0.15,
    toneMapping: true,
  },
  fallbackBackground: "#0c0a12",
};

/**
 * Sunset — warm, directional. The HDRI carries strong colour and a
 * single dominant light direction. Useful for the print-bar OG shots
 * and for testing skin-tone accuracy under coloured ambient.
 */
const SUNSET: RoomConfig = {
  slug: "sunset",
  name: "Sunset · warm sky",
  environment: {
    kind: "preset",
    preset: "sunset",
    background: true,
    blur: 0,
  },
  ground: {
    kind: "plane",
    color: "#1a0d0a",
    y: 0,
  },
  camera: {
    position: [0, 1.4, 2.8],
    target: [0, 1.2, 0],
    fov: 38,
    orbit: true,
  },
  avatar: {
    url: DEFAULT_AVATAR_URL,
    position: [0, 0, 0],
    rotation: [0, Math.PI, 0],
  },
  post: {
    bloom: true,
    vignette: 0.25,
    toneMapping: true,
  },
  fallbackBackground: "#2a1408",
};

/**
 * Void — DollyOS's signature space. Black background, no HDRI image
 * showing, but still using a preset for IBL so the avatar isn't lit
 * by hex-coloured directional lights. Bloom turned up.
 *
 * This is the migration target for DollyOS's VolumetricVoid surface;
 * full multiplane / portal-hands wiring happens in a follow-up.
 */
const VOID: RoomConfig = {
  slug: "void",
  name: "Void · DollyOS reference",
  environment: {
    kind: "preset",
    preset: "night",
    background: false,
    blur: 0,
  },
  ground: {
    kind: "none",
  },
  camera: {
    position: [0, 1.4, 2.6],
    target: [0, 1.2, 0],
    fov: 35,
    orbit: true,
  },
  avatar: {
    url: DEFAULT_AVATAR_URL,
    position: [0, 0, 0],
    rotation: [0, Math.PI, 0],
  },
  post: {
    bloom: true,
    vignette: 0.4,
    toneMapping: true,
  },
  fallbackBackground: "#000000",
};

export const ROOMS: Record<string, RoomConfig> = {
  studio: STUDIO,
  warehouse: WAREHOUSE,
  sunset: SUNSET,
  void: VOID,
};

export const ROOM_SLUGS = Object.keys(ROOMS);

export function getRoom(slug: string | null | undefined): RoomConfig {
  if (!slug) return STUDIO;
  return ROOMS[slug] ?? STUDIO;
}

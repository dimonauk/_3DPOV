/**
 * lib/type3d/sdf-text.ts — SDF body-text helpers (troika-three-text).
 *
 * Body prose is a different problem from display type. A hero
 * title is one short string of large glyphs, so paying the
 * per-glyph polygon cost of TextGeometry is fine. A paragraph is
 * dozens of small glyphs, repeated across the page; the same
 * extrusion math would blow the polygon budget on the first
 * `<MeshProseLayer>` mount.
 *
 * troika-three-text solves this by rendering each glyph as a
 * billboard quad shaded against a signed-distance-field texture
 * generated off the main thread. One quad per glyph, one SDF
 * texture per font face, antialiased at any zoom level. Their
 * worker ships with the package — see `Text.preloadFont` and the
 * `troika-worker-utils` lazy boot inside the library.
 *
 * This module exposes three things:
 *
 *   - `createSdfText(THREE)` — async factory that imports the
 *     troika module on demand and returns a builder closure. The
 *     dynamic import keeps the ~80kb out of pages that never
 *     mount a MeshProseLayer.
 *   - `applyMaterialPreset(text, preset)` — paints a troika
 *     `Text` mesh to match one of our three material modes.
 *   - `resolveSdfFontUrl(font)` — maps the public font-kind
 *     union to a URL under `/fonts/3d/`. SDF needs the real
 *     TTF/WOFF (not the typeface.json blobs the TextGeometry
 *     path consumes), so the files live in a sibling folder.
 */

import type * as THREE_NS from "three";

export type SdfFontKind = "display" | "mono" | "sans";

export type SdfMaterialPreset = "matte" | "chrome" | "foil";

/**
 * SDF font URL resolver. The fonts live under `public/fonts/3d/`.
 * The names here line up with the typeface.json siblings used by
 * the display-text path, just with the SDF-friendly extension.
 *
 * If the file is missing at runtime, troika falls back to its
 * bundled Roboto so the page never goes blank — it just renders
 * in the wrong typeface until the operator adds the asset. The
 * showcase journal entry exercises this fallback knowingly.
 */
export function resolveSdfFontUrl(font: SdfFontKind): string {
  switch (font) {
    case "display":
      return "/fonts/3d/cormorant-garamond.woff";
    case "mono":
      return "/fonts/3d/jetbrains-mono.woff";
    case "sans":
    default:
      return "/fonts/3d/inter.woff";
  }
}

/**
 * Lazy-load troika-three-text. Pages that never mount a
 * MeshProseLayer never pull this module. The returned factory
 * builds new `Text` instances pre-configured with the SDF
 * font URL and material preset.
 */
export async function loadTroikaText(): Promise<
  typeof import("troika-three-text")
> {
  return import("troika-three-text");
}

/**
 * Internal Three.js type for the troika Text mesh. We don't
 * `import { Text }` at module scope because that pulls the
 * troika bundle into every consumer; instead callers receive
 * `unknown` and treat the object via the `SdfTextInstance`
 * shape this file exports.
 */
export type SdfTextInstance = THREE_NS.Object3D & {
  text: string;
  font: string | null;
  fontSize: number;
  maxWidth: number;
  lineHeight: number;
  letterSpacing: number;
  color: number | string;
  anchorX: number | string;
  anchorY: number | string;
  material: THREE_NS.Material;
  sync(callback?: () => void): void;
  dispose(): void;
};

export type CreateSdfTextOptions = {
  font: SdfFontKind;
  fontSize: number;
  maxWidth: number;
  lineHeight?: number;
  letterSpacing?: number;
  material?: SdfMaterialPreset;
  /** Body text colour as hex. Default chrome-100ish. */
  color?: number;
  anchorX?: "left" | "right" | "center";
  anchorY?: "top" | "middle" | "bottom" | "top-baseline";
};

/**
 * Build an SDF Text instance laid out at the given size and
 * width. Caller owns disposal — call `.dispose()` when the
 * mesh leaves the scene.
 *
 * The returned instance is NOT yet sync'd — its glyph layout
 * lives in the worker until `instance.sync(callback)` resolves.
 * Most callers want to await sync before attaching to a scene
 * so the first paint doesn't show empty quads.
 */
export async function createSdfText(
  options: CreateSdfTextOptions,
): Promise<SdfTextInstance> {
  const {
    font,
    fontSize,
    maxWidth,
    lineHeight = 1.45,
    letterSpacing = 0,
    material = "matte",
    color = 0xe7e5e4,
    anchorX = "left",
    anchorY = "top",
  } = options;

  const { Text } = await loadTroikaText();
  const instance = new Text() as unknown as SdfTextInstance;

  instance.font = resolveSdfFontUrl(font);
  instance.fontSize = fontSize;
  instance.maxWidth = maxWidth;
  instance.lineHeight = lineHeight;
  instance.letterSpacing = letterSpacing;
  instance.color = color;
  instance.anchorX = anchorX;
  instance.anchorY = anchorY;

  applyMaterialPreset(instance, material);
  return instance;
}

/**
 * Paint a troika Text mesh to match one of the three body-text
 * material presets. troika owns the material slot, but it
 * accepts a vanilla Three.js material override — we set
 * `instance.material` and troika rewires its uniforms on the
 * next sync.
 *
 * Body text is small and dense — we deliberately stay flatter
 * than the display register's foil/chrome to keep legibility
 * up. The three presets here are the body-scale equivalents,
 * not a replay of the display materials.
 */
export function applyMaterialPreset(
  instance: SdfTextInstance,
  preset: SdfMaterialPreset,
): void {
  // We avoid importing three at module scope so the bundle stays
  // dynamic. The materials are constructed via the global THREE
  // ref troika exposes on the prototype's owner: troika's Text
  // uses MeshBasicMaterial by default so we read `material`'s
  // ctor and instantiate a matching one with our colour.
  const ctor = (
    instance.material as unknown as { constructor: new () => THREE_NS.Material }
  ).constructor;

  switch (preset) {
    case "chrome": {
      // Slight cool tint, slight glow against the dark page.
      instance.color = 0xfafafa;
      const m = new ctor() as unknown as {
        transparent: boolean;
        opacity: number;
      };
      m.transparent = true;
      m.opacity = 1;
      instance.material = m as unknown as THREE_NS.Material;
      return;
    }
    case "foil": {
      // Foil at body scale would be illegible — instead we cheat
      // with a pink tint so the body register quietly answers the
      // display register's foil without competing with it.
      instance.color = 0xfbcfe8;
      const m = new ctor() as unknown as {
        transparent: boolean;
        opacity: number;
      };
      m.transparent = true;
      m.opacity = 0.95;
      instance.material = m as unknown as THREE_NS.Material;
      return;
    }
    case "matte":
    default: {
      // The honest body colour — pulled from the chrome-200
      // token the prose-gallery class already paints.
      instance.color = 0xe7e5e4;
      const m = new ctor() as unknown as {
        transparent: boolean;
        opacity: number;
      };
      m.transparent = true;
      m.opacity = 1;
      instance.material = m as unknown as THREE_NS.Material;
      return;
    }
  }
}

/**
 * Convert a DOMRect on the page into scene-space coordinates
 * for a camera looking down -Z from `cameraZ` with vertical FOV
 * `fovDeg`. The resulting `{x, y, scale}` puts the troika Text's
 * anchor flush with the HTML element's top-left and scales the
 * glyph quads so they read at the same on-screen size as the
 * underlying HTML.
 *
 * The math:
 *   visibleHeight = 2 * tan(fov/2) * cameraZ
 *   pxToWorld = visibleHeight / viewport.height
 *
 * Anchor goes at the element's top-left in CSS pixels, mapped
 * through the same scalar. Negative Y because Three.js has Y
 * pointing up while CSS has it pointing down.
 */
export function rectToSceneCoords(params: {
  rect: DOMRect;
  viewport: { width: number; height: number };
  cameraZ: number;
  fovDeg: number;
}): { x: number; y: number; pxToWorld: number; widthWorld: number } {
  const { rect, viewport, cameraZ, fovDeg } = params;
  const fovRad = (fovDeg * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(fovRad / 2) * cameraZ;
  const pxToWorld = visibleHeight / viewport.height;

  // CSS origin is top-left; scene origin is the camera centre,
  // looking down -Z. Translate the element's top-left so the
  // anchor lands where the HTML sat.
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const halfW = viewport.width / 2;
  const halfH = viewport.height / 2;

  return {
    x: (rect.left - halfW) * pxToWorld,
    y: -(rect.top - halfH) * pxToWorld,
    pxToWorld,
    widthWorld: rect.width * pxToWorld,
  };
}

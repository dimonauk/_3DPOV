/**
 * lib/capabilities/viz/usdz-export.ts — Capability `viz.usdz-export`:
 * convert a Three.js scene (or a stereo pair of flat images) into a
 * USDZ blob and hand it to Apple's AR Quick Look.
 *
 * One-line role: turn 2D-to-3D pipeline output into a shareable
 * `model/vnd.usdz+zip` blob, then trigger AR Quick Look on iOS so the
 * receiver sees the scene anchored in their own room.
 * Full purpose in usdz-export.PURPOSE.md.
 */

import {
  CanvasTexture,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
} from "three";
import {
  USDZExporter,
  type USDZExporterOptions,
} from "three/examples/jsm/exporters/USDZExporter.js";

import type { StereoPair } from "lib/capabilities/viz/stereo-pair";

export type UsdzExportOptions = {
  /** Suggested filename (without extension). Default "scene". */
  filename?: string;
  /** AR Quick Look anchoring hint. Default "horizontal". */
  anchoring?: "horizontal" | "vertical" | "image" | "face";
  /** Allows the user to scale the model in AR Quick Look. Default true. */
  allowsContentScaling?: boolean;
};

/** USDZ mime type — registered with IANA for AR Quick Look pickup. */
const USDZ_MIME = "model/vnd.usdz+zip";

/**
 * Map our four anchoring values onto USDZExporter's `ar` options
 * surface. USDZExporter's typed surface only declares `plane`
 * anchoring + `horizontal | vertical | any` alignment. The
 * `image` and `face` anchorings are AR Quick Look features Apple
 * documents but the Three.js types don't model; we widen via an
 * `unknown` cast at the call site for those two branches.
 */
type PlaneAnchorAlignment = "horizontal" | "vertical" | "any";

function planeAnchor(alignment: PlaneAnchorAlignment): USDZExporterOptions["ar"] {
  return { anchoring: { type: "plane" }, planeAnchoring: { alignment } };
}

function anchorOptions(
  anchoring: NonNullable<UsdzExportOptions["anchoring"]>,
): USDZExporterOptions["ar"] {
  switch (anchoring) {
    case "vertical":
      return planeAnchor("vertical");
    case "image":
      // Widen past the typed surface — Apple's AR Quick Look honours
      // these alternative anchor types but the Three.js type defs
      // only model `plane`.
      return { anchoring: { type: "image" } } as unknown as USDZExporterOptions["ar"];
    case "face":
      return { anchoring: { type: "face" } } as unknown as USDZExporterOptions["ar"];
    case "horizontal":
    default:
      return planeAnchor("horizontal");
  }
}

/**
 * Export a Three.js scene to a USDZ blob. Wraps `THREE.USDZExporter`.
 * The result is `Blob({ type: "model/vnd.usdz+zip" })`.
 */
export async function exportSceneToUsdz(
  scene: Scene,
  options: UsdzExportOptions = {},
): Promise<Blob> {
  const exporter = new USDZExporter();
  const ar = anchorOptions(options.anchoring ?? "horizontal");
  // `quickLookCompatible: true` writes flags Apple's QL parser
  // honours (notably `allowsContentScaling`). Three.js wires both
  // when we set it. The "ar" stanza is merged with the defaults.
  const exporterOpts: USDZExporterOptions = {
    ar,
    includeAnchoringProperties: true,
    quickLookCompatible: true,
    maxTextureSize: 2048,
  };
  const bytes = await exporter.parseAsync(scene, exporterOpts);
  return new Blob([bytes], { type: USDZ_MIME });
}

/* ─── Stereo pair → USDZ ────────────────────────────────────────────────── */

/** Default IPD in metres — matches Apple's AR Quick Look stereo demos. */
const DEFAULT_IPD_METRES = 0.064;
/** Plane viewing distance in metres — far enough not to clip the user. */
const PLANE_DISTANCE_METRES = 1.5;
/** Plane width in metres — A4-ish portrait so a phone can frame it. */
const PLANE_WIDTH_METRES = 1.2;

/**
 * Build a `CanvasTexture` from a `StereoPair` half. ImageData isn't
 * directly accepted by three.js as a texture source; we paint it onto
 * a `<canvas>` first, which `CanvasTexture` happily wraps.
 */
function textureFromImageData(image: ImageData): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("viz.usdz-export: 2D context unavailable");
  }
  ctx.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Convenience: export a `StereoPair` as a USDZ scene with two image-plane
 * meshes positioned at the user's IPD offsets. AR Quick Look's stereo
 * renderer shows the left image to the left eye and the right to the
 * right — the "spatial photo" look from flat capture.
 */
export async function exportStereoToUsdz(
  pair: StereoPair,
  options: UsdzExportOptions = {},
): Promise<Blob> {
  const scene = new Scene();
  const aspect = pair.width / pair.height;
  const planeHeight = PLANE_WIDTH_METRES / aspect;
  const halfIpd = DEFAULT_IPD_METRES / 2;

  const geometry = new PlaneGeometry(PLANE_WIDTH_METRES, planeHeight);

  const leftTex = textureFromImageData(pair.left);
  const leftMat = new MeshStandardMaterial({
    map: leftTex,
    roughness: 1,
    metalness: 0,
  });
  const leftMesh = new Mesh(geometry, leftMat);
  leftMesh.position.set(-halfIpd, 0, -PLANE_DISTANCE_METRES);
  scene.add(leftMesh);

  const rightTex = textureFromImageData(pair.right);
  const rightMat = new MeshStandardMaterial({
    map: rightTex,
    roughness: 1,
    metalness: 0,
  });
  const rightMesh = new Mesh(geometry, rightMat);
  rightMesh.position.set(halfIpd, 0, -PLANE_DISTANCE_METRES);
  scene.add(rightMesh);

  try {
    return await exportSceneToUsdz(scene, options);
  } finally {
    // Free the GL/Canvas resources — the exporter has already
    // copied the pixel data into the USDZ archive at this point.
    leftTex.dispose();
    rightTex.dispose();
    leftMat.dispose();
    rightMat.dispose();
    geometry.dispose();
  }
}

/* ─── AR Quick Look launch ──────────────────────────────────────────────── */

/**
 * Trigger AR Quick Look on iOS, or fall back to a plain download
 * elsewhere. Builds a hidden `<a rel="ar">` with the USDZ object URL
 * and clicks it. iOS Safari + Chrome on iOS intercept the `<a rel="ar">`
 * click and open AR Quick Look in-place.
 *
 * iOS quirk: the anchor must contain a child element (an `<img>` is
 * canonical) for AR Quick Look to take over the click — without one,
 * Safari falls through and the file downloads instead. We add a
 * single-pixel transparent `<img>` so the intercept fires.
 */
export function openInARQuickLook(blob: Blob, filename = "scene"): void {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.rel = "ar";
  anchor.href = url;
  anchor.download = `${filename}.usdz`;
  anchor.style.display = "none";

  // iOS Safari requires a child element for the `rel="ar"` intercept.
  const child = document.createElement("img");
  child.alt = "";
  child.width = 1;
  child.height = 1;
  child.style.opacity = "0";
  child.src =
    "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
  anchor.appendChild(child);

  document.body.appendChild(anchor);
  anchor.click();

  // Remove + revoke after 1s. Revoking immediately races AR Quick
  // Look on slow networks (it fetches the blob URL asynchronously).
  window.setTimeout(() => {
    if (anchor.parentNode) anchor.parentNode.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 1_000);
}

/**
 * Feature-detect: returns true on iOS where AR Quick Look is supported.
 * The canonical signal is `relList.supports("ar")` on a fresh anchor —
 * iOS 12+ Safari and WKWebView return true here; everything else false.
 */
export function isARQuickLookSupported(): boolean {
  if (typeof document === "undefined") return false;
  const anchor = document.createElement("a");
  const list = anchor.relList as DOMTokenList & {
    supports?: (token: string) => boolean;
  };
  if (typeof list?.supports !== "function") return false;
  try {
    return list.supports("ar");
  } catch {
    return false;
  }
}

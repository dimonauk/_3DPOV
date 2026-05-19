/**
 * lib/tsl-materials/presets/skin.ts — Subsurface-feeling skin via
 * sheen + cheap SSS approximation.
 *
 * Canonical reference: porcelain doll skin — pink-50 body with a
 * faint pink-200 wash at the silhouette, low roughness on the
 * normal-facing patches and slight sheen for the soft-light read.
 * No real subsurface scattering — that's a screen-space pass and
 * out of scope here. The sheen layer + fresnel tint gets us close
 * enough for editorial use.
 *
 * Backend: dual-path. Sheen is core MeshPhysical. Optional fresnel
 * tint is a TSL node — falls back to a static emissive on WebGL2.
 */
import {
  loadNodeMaterials,
  loadThree,
  loadTSL,
  tokenHex,
} from "../internal";
import type { TslMaterialPreset, TslMaterialOverrides } from "../types";

function build(overrides?: TslMaterialOverrides): unknown {
  const THREE = loadThree();
  const TSL = loadTSL();
  const NM = loadNodeMaterials();

  const baseParams = {
    color: new THREE.Color(tokenHex(overrides?.color ?? "pink-50")),
    metalness: 0,
    roughness: overrides?.roughness ?? 0.48,
    sheen: 1.0,
    sheenColor: new THREE.Color(tokenHex("pink-200")),
    sheenRoughness: 0.4,
  };

  if (!TSL || !NM?.MeshPhysicalNodeMaterial) {
    return new THREE.MeshPhysicalMaterial({
      ...baseParams,
      emissive: new THREE.Color(tokenHex("pink-100")),
      emissiveIntensity: 0.05,
    });
  }

  const material = new NM.MeshPhysicalNodeMaterial(baseParams) as {
    emissiveNode?: unknown;
  };

  // Cheap SSS hint — fresnel-weighted pink emissive so the silhouette
  // catches a bit of warmth, suggesting light passing through the
  // outer surface. Intensity stays low so the body still reads as
  // diffuse rather than glowy.
  const n = TSL.normalView;
  const v = TSL.normalize(TSL.cameraPosition.sub(TSL.positionView));
  const fres = TSL.pow(
    TSL.oneMinus(TSL.saturate(TSL.dot(n, v))),
    TSL.float(2.0),
  );
  material.emissiveNode = TSL.mul(
    TSL.color(tokenHex("pink-200")),
    fres.mul(0.18),
  );
  return material;
}

export const skinPreset: TslMaterialPreset = {
  id: "skin",
  name: "Skin",
  category: "skin",
  description:
    "Porcelain skin with a pink sheen layer and a faint fresnel-driven warm rim. Not real SSS — close enough for stills.",
  cost: "moderate",
  backend: "dual",
  chip:
    "radial-gradient(circle at 40% 35%, #fff5f9 0%, #ffe4ee 50%, #ffc4d9 100%)",
  build,
};

export default skinPreset;

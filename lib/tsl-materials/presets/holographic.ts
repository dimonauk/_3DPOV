/**
 * lib/tsl-materials/presets/holographic.ts — Fresnel-driven iridescence
 * shifted to the studio's pink / lavender / mint trio.
 *
 * Canonical reference: trading-card holo foil and laserdisc edge
 * iridescence. The colour graph reads view-space normal · view vec,
 * raises that to a power for a tighter rim, then mixes the three
 * accents across the fresnel value. A slow time uniform shifts the
 * hue stops so it shimmers rather than sits flat.
 *
 * Backend: WebGPU-only. The fresnel + tonemap node graph compiles on
 * WebGL2 but at non-trivial fragment cost; the fallback path returns
 * a static iridescent gradient via MeshStandardMaterial + emissive
 * tint so the visual still reads.
 *
 * Reduced-motion: caller is responsible for not ticking phaseUniform.
 * SceneStage's preset wrapper already does this.
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

  if (!TSL || !NM?.MeshStandardNodeMaterial) {
    // Static iridescent fallback — high-metalness pink with emissive
    // lavender so the silhouette still glows.
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(tokenHex(overrides?.color ?? "pink-200")),
      metalness: 0.8,
      roughness: 0.25,
      emissive: new THREE.Color(tokenHex(overrides?.emissive ?? "lavender-200")),
      emissiveIntensity: 0.35,
    });
    return mat;
  }

  const phase = TSL.uniform(0);
  const material = new NM.MeshStandardNodeMaterial({
    metalness: overrides?.metalness ?? 0.55,
    roughness: overrides?.roughness ?? 0.18,
    color: new THREE.Color(tokenHex("pink-100")),
  }) as {
    colorNode?: unknown;
    emissiveNode?: unknown;
    phaseUniform?: unknown;
  };

  // Fresnel: 1 - saturate(dot(normalView, viewDir)). Power tightens.
  const n = TSL.normalView;
  const v = TSL.normalize(TSL.cameraPosition.sub(TSL.positionView));
  const fres = TSL.pow(
    TSL.oneMinus(TSL.saturate(TSL.dot(n, v))),
    TSL.float(2.4),
  );

  // Three accents — pink, lavender, mint — mixed across the fresnel
  // value plus a slow hue drift so the rim shimmers without strobing.
  const pink = TSL.color(tokenHex("pink-300"));
  const lavender = TSL.color(tokenHex("lavender-300"));
  const mint = TSL.color(tokenHex("mint-300"));
  const shifted = TSL.fract(fres.add(phase));
  const a = TSL.saturate(shifted.mul(2.0));
  const b = TSL.saturate(shifted.sub(0.5).mul(2.0));
  const iri = TSL.mix(TSL.mix(pink, lavender, a), mint, b);

  // Soft Reinhard so HDR XR tonemapping doesn't blow out the rim.
  const tonemapped = TSL.div(iri, TSL.add(TSL.float(1.0), iri));

  material.colorNode = tonemapped;
  material.emissiveNode = TSL.mul(tonemapped, fres.mul(0.4));
  material.phaseUniform = phase;
  return material;
}

export const holographicPreset: TslMaterialPreset = {
  id: "holographic",
  name: "Holographic",
  category: "glow",
  description:
    "Fresnel iridescence across pink, lavender, mint. Tonemapped so it doesn't blow out in XR HDR.",
  cost: "expensive",
  backend: "webgpu-only",
  chip:
    "conic-gradient(from 200deg at 50% 50%, #ff9fbf, #b490ff, #76dea6, #ff9fbf)",
  build,
};

export default holographicPreset;

/**
 * lib/tsl-materials/presets/iridescent-soap.ts — Thin-film soap-bubble
 * interference. View-angle-driven hue shift across the full spectrum.
 *
 * Adapted from the canonical thin-film optics algorithm (Cook & Torrance
 * 1982 model — public technique) and the cosine-palette pattern from
 * Inigo Quilez's procedural colour writings (public algorithm).
 * Implemented from first principles; no source copied.
 *
 * MToon-style ramp logic borrowed for the rim falloff
 * (https://github.com/Santarh/MToon — MIT, authors: Santarh + VRM Consortium).
 *
 * Where soap-bubble interference comes from: light reflecting off the
 * top of a thin film interferes with light reflecting off the bottom.
 * The path-length difference is `2 * thickness * cos(viewAngle)`, which
 * cycles colour bands across the visible spectrum as either thickness
 * or viewing angle change. Here thickness is uniform (no per-pixel
 * variation) and the fresnel term drives the cycle.
 *
 * Backend: WebGPU-only. The cosine palette + fresnel mix compiles to
 * WebGL2 too but at non-trivial cost; the fallback returns a near-foil
 * MeshStandardMaterial with pink + lavender emissive bias.
 *
 * Reduced-motion: no animated uniform on this preset. The hue is
 * fixed-per-angle. Safe everywhere.
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
    // Static near-foil fallback — pink base, lavender emissive bias.
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(tokenHex(overrides?.color ?? "pink-100")),
      metalness: 0.65,
      roughness: 0.22,
      emissive: new THREE.Color(tokenHex(overrides?.emissive ?? "lavender-200")),
      emissiveIntensity: 0.28,
    });
  }

  const material = new NM.MeshStandardNodeMaterial({
    metalness: overrides?.metalness ?? 0.4,
    roughness: overrides?.roughness ?? 0.15,
    color: new THREE.Color(tokenHex("pink-50")),
    transparent: (overrides?.opacity ?? 1) < 1,
    opacity: overrides?.opacity ?? 1,
  }) as {
    colorNode?: unknown;
    emissiveNode?: unknown;
  };

  // Fresnel — same construction as holographic.ts, lifted to a tighter
  // exponent because soap films sit further toward the silhouette than
  // a chrome rim does.
  const n = TSL.normalView;
  const v = TSL.normalize(TSL.cameraPosition.sub(TSL.positionView));
  const cosT = TSL.saturate(TSL.dot(n, v));
  const fres = TSL.pow(TSL.oneMinus(cosT), TSL.float(2.0));

  // Cosine-palette interference. Three RGB channels offset by 2pi/3 so
  // they cycle out of phase across the angle, producing the soap-band
  // sweep. Frequency 8.0 = roughly four colour bands from centre to
  // silhouette — looks right against a sphere of unit radius.
  const TAU = TSL.float(6.2831853);
  const freq = TSL.float(8.0);
  const phase = fres.mul(freq);
  const rBand = TSL.cos(phase.mul(TAU).add(TSL.float(0.0))).mul(0.5).add(0.5);
  const gBand = TSL.cos(phase.mul(TAU).add(TSL.float(2.094))).mul(0.5).add(0.5);
  const bBand = TSL.cos(phase.mul(TAU).add(TSL.float(4.188))).mul(0.5).add(0.5);
  const spectrum = TSL.vec3(rBand, gBand, bBand);

  // Tint the spectrum toward the studio palette — pink at low fresnel,
  // lavender at mid, mint at high — so the bubble reads as on-brand
  // rather than a generic rainbow. Mix amount is small so the
  // interference still drives the look.
  const pink = TSL.color(tokenHex("pink-200"));
  const lavender = TSL.color(tokenHex("lavender-200"));
  const mint = TSL.color(tokenHex("mint-200"));
  const tint = TSL.mix(TSL.mix(pink, lavender, fres), mint, fres.mul(fres));
  const blended = TSL.mix(spectrum, tint, TSL.float(0.35));

  // Soft Reinhard so the brightest bands don't blow out the XR HDR
  // tonemap. Same trick as holographic.ts.
  const tonemapped = TSL.div(blended, TSL.add(TSL.float(1.0), blended));

  material.colorNode = tonemapped;
  // Emissive lift in the rim band only — keeps the centre matte and
  // pushes the silhouette into the bloom pass when one is attached.
  material.emissiveNode = TSL.mul(tonemapped, fres.mul(0.5));
  return material;
}

export const iridescentSoapPreset: TslMaterialPreset = {
  id: "iridescent-soap",
  name: "Iridescent Soap",
  category: "glow",
  description:
    "Thin-film interference — soap-bubble bands sweeping across the silhouette. Reads brand-pink at centre, mint-cyan at the rim.",
  cost: "expensive",
  backend: "webgpu-only",
  chip:
    "conic-gradient(from 0deg at 50% 50%, #ffc4d9, #cfb7ff, #a8ecc6, #ffe4ee, #ffc4d9)",
  build,
};

export default iridescentSoapPreset;

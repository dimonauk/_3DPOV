/**
 * lib/tsl-materials/presets/waveguide-glow.ts — Studio signature.
 * Fresnel-ring with pink-300 emissive, on a translucent body.
 *
 * Canonical reference: the gyroid waveguide print at the workshop's
 * front desk — translucent resin with a glowing edge wherever the
 * grazing angle catches. We approximate it with a transmissive body
 * + an emissive node modulated by fresnel — the ring is brightest at
 * silhouette edges and fades into the body toward the centre.
 *
 * Backend: WebGPU-only for the emissive ring (needs the fragment
 * fresnel node). WebGL fallback returns a flat translucent pink with
 * a strong constant emissive so the silhouette still glows — same
 * intent, different mechanism.
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

  if (!TSL || !NM?.MeshPhysicalNodeMaterial) {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(tokenHex(overrides?.color ?? "pink-100")),
      transmission: 0.6,
      thickness: 0.5,
      ior: 1.45,
      roughness: 0.25,
      emissive: new THREE.Color(tokenHex(overrides?.emissive ?? "pink-300")),
      emissiveIntensity: 0.9,
      transparent: true,
    });
  }

  const material = new NM.MeshPhysicalNodeMaterial({
    color: new THREE.Color(tokenHex(overrides?.color ?? "pink-100")),
    metalness: overrides?.metalness ?? 0,
    roughness: overrides?.roughness ?? 0.2,
    transmission: 0.7,
    thickness: 0.5,
    ior: 1.45,
    transparent: true,
  }) as {
    emissiveNode?: unknown;
  };

  // Fresnel ring — strong at grazing, faded in the centre. Tinted to
  // pink-300, with a touch of pink-100 mixed for the ring colour so
  // it reads as glowing-pink rather than hot-pink.
  const n = TSL.normalView;
  const v = TSL.normalize(TSL.cameraPosition.sub(TSL.positionView));
  const fres = TSL.pow(
    TSL.oneMinus(TSL.saturate(TSL.dot(n, v))),
    TSL.float(2.8),
  );
  const ring = TSL.mix(
    TSL.color(tokenHex("pink-100")),
    TSL.color(tokenHex(overrides?.emissive ?? "pink-300")),
    fres,
  );
  material.emissiveNode = TSL.mul(ring, fres.mul(1.2));
  return material;
}

export const waveguideGlowPreset: TslMaterialPreset = {
  id: "waveguide-glow",
  name: "Waveguide Glow",
  category: "glow",
  description:
    "Translucent body with a fresnel-driven pink-300 emissive ring. The studio's signature gyroid look.",
  cost: "expensive",
  backend: "webgpu-only",
  chip:
    "radial-gradient(closest-side at 50% 50%, rgba(255,228,238,0.6) 0%, rgba(255,159,191,0.95) 60%, rgba(255,85,143,0.9) 100%)",
  build,
};

export default waveguideGlowPreset;

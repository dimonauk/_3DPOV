/**
 * lib/xr-scene/tsl-presets.ts — Shared TSL material presets.
 *
 * Cuts shader boilerplate in scene-level components. Each preset is
 * an async factory returning a `NodeMaterial` instance. They share a
 * convention: a single colour-node graph composed from the studio's
 * pink + chrome palette, optionally tickable via the returned
 * `tick(elapsed)` hook so the animation phase stays continuous across
 * the scene's lifetime.
 *
 * Why dynamic-imported: `three/tsl` ships a few hundred KB of node
 * definitions. Pages that mount a SceneStage but never request a
 * preset (custom-material scenes) should not pay the bundle cost.
 *
 * Compiles to both WebGPU + WebGL via Three's node-material backend.
 * The presets degrade gracefully — if the underlying material class
 * is absent (older three build) we hand back a MeshStandardMaterial
 * with the closest equivalent uniform setup.
 */

/**
 * Re-export the full catalogue from lib/tsl-materials so SceneStage
 * authors who already import `buildPreset` here keep working, but
 * can also reach for any of the extended presets (holographic,
 * anodised, waveguide-glow, etc.) without restructuring imports.
 *
 * The legacy `buildPreset(name, opts)` below covers the original four
 * (chrome / foil / matte / glass) with the SceneStage-friendly
 * `{ material, tick, dispose }` envelope. For everything else, call
 * `getMaterialPreset(id)?.build(overrides)` directly — you own
 * disposal in that path.
 */
export {
  ALL_MATERIAL_PRESETS,
  getMaterialPreset,
  presetsByCategory,
} from "lib/tsl-materials";
export type {
  TslMaterialPreset,
  TslMaterialOverrides,
  TslMaterialCategory,
  TslMaterialBackend,
  TslMaterialCost,
} from "lib/tsl-materials";

export type PresetName = "chrome" | "foil" | "matte" | "glass";

export type PresetMaterial = {
  material: import("three").Material;
  /** Per-frame hook for time-driven uniforms. May be undefined when
   *  the preset is static. */
  tick?: (elapsed: number) => void;
  dispose: () => void;
};

type Three = typeof import("three");
type TSL = typeof import("three/tsl");

/**
 * Build a preset by name. The caller is responsible for disposing
 * the returned material when the scene tears down.
 *
 * `opts.reducedMotion` suppresses animated uniforms — foil sweep
 * becomes a static gradient, chrome stops drifting its highlight.
 */
export async function buildPreset(
  name: PresetName,
  opts: { reducedMotion?: boolean } = {},
): Promise<PresetMaterial> {
  const THREE = (await import("three")) as Three;
  let TSL: TSL | null = null;
  try {
    TSL = (await import("three/tsl")) as TSL;
  } catch {
    // No TSL available in this build of three — drop back to vanilla
    // MeshStandardMaterials with the same palette intent.
    TSL = null;
  }

  switch (name) {
    case "chrome":
      return buildChrome(THREE, TSL, opts);
    case "foil":
      return buildFoil(THREE, TSL, opts);
    case "matte":
      return buildMatte(THREE, TSL, opts);
    case "glass":
      return buildGlass(THREE, TSL, opts);
  }
}

/* ------------------------------------------------------------------ */
/* Presets                                                            */
/* ------------------------------------------------------------------ */

function buildChrome(
  THREE: Three,
  _TSL: TSL | null,
  _opts: { reducedMotion?: boolean },
): PresetMaterial {
  // Polished metal. The studio's chrome look is a tight specular
  // highlight on a near-white plate with a hint of warm tint. We
  // stay on MeshStandardMaterial here because TSL's equivalent
  // PBR is heavier and the visual is identical at this surface.
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xeef1f5),
    metalness: 0.92,
    roughness: 0.18,
    envMapIntensity: 1.1,
  });
  return {
    material,
    dispose: () => material.dispose(),
  };
}

function buildFoil(
  THREE: Three,
  TSL: TSL | null,
  opts: { reducedMotion?: boolean },
): PresetMaterial {
  // Animated holographic sweep across the surface. Matches the
  // .lux-foil CSS treatment so the same look reads in both 2D HTML
  // chrome and 3D material space.
  if (!TSL) {
    return staticFoilFallback(THREE);
  }

  type MeshStandardNodeMaterialCtor = new (params: {
    metalness: number;
    roughness: number;
    color: import("three").Color;
  }) => import("three").Material & {
    colorNode?: unknown;
    emissiveNode?: unknown;
  };

  // `three/webgpu` ships the node materials; `MeshStandardNodeMaterial`
  // is the canonical PBR + TSL combo. Imported synchronously via a
  // require-style dynamic — already loaded by the caller of TSL.
  let NodeMaterial: MeshStandardNodeMaterialCtor | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webgpu = require("three/webgpu") as {
      MeshStandardNodeMaterial?: MeshStandardNodeMaterialCtor;
    };
    NodeMaterial = webgpu.MeshStandardNodeMaterial ?? null;
  } catch {
    NodeMaterial = null;
  }
  if (!NodeMaterial) {
    return staticFoilFallback(THREE);
  }

  const phase = TSL.uniform(0);
  const material = new NodeMaterial({
    metalness: 0.4,
    roughness: 0.3,
    color: new THREE.Color(0xffc4d9),
  });

  // Diagonal sweep — uv.x + uv.y + phase, wrapped sine. Mixed across
  // pink-200 → chrome-100 → pink-400 so the highlight reads as
  // moving foil rather than a flat tint shift.
  const uv = TSL.uv();
  const wave = TSL.sin(
    TSL.add(uv.x, uv.y, phase).mul(TSL.float(6.283)),
  ).mul(0.5).add(0.5);
  const pink = TSL.color(0xff78a5);
  const chrome = TSL.color(0xeef1f5);
  const blended = TSL.mix(pink, chrome, wave);
  material.colorNode = blended;
  material.emissiveNode = TSL.mul(pink, wave.mul(0.25));

  return {
    material,
    tick: opts.reducedMotion ? undefined : (elapsed: number) => {
      phase.value = elapsed * 0.18;
    },
    dispose: () => material.dispose(),
  };
}

function staticFoilFallback(THREE: Three): PresetMaterial {
  // Fallback for browsers where the node material isn't available.
  // Flat pink with a hint of metalness — close enough to the foil
  // look that the page doesn't fall apart.
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xff9fbf),
    metalness: 0.55,
    roughness: 0.4,
  });
  return {
    material,
    dispose: () => material.dispose(),
  };
}

function buildMatte(
  THREE: Three,
  _TSL: TSL | null,
  _opts: { reducedMotion?: boolean },
): PresetMaterial {
  // Flat warm-black with a soft ambient response. Used for floors,
  // backdrops, anything that should recede behind the focal mesh.
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x14111a),
    metalness: 0.05,
    roughness: 0.9,
  });
  return {
    material,
    dispose: () => material.dispose(),
  };
}

function buildGlass(
  THREE: Three,
  _TSL: TSL | null,
  _opts: { reducedMotion?: boolean },
): PresetMaterial {
  // MeshPhysicalMaterial gives us transmission for cheap. Pink-tinted
  // refraction reads as the studio's signature glass — the alternative
  // would be a full TSL transmission node graph, which costs another
  // 80kB on the WebGPU path for a visual we already have.
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xffe4ee),
    metalness: 0,
    roughness: 0.05,
    transmission: 0.92,
    thickness: 0.4,
    ior: 1.45,
    transparent: true,
  });
  return {
    material,
    dispose: () => material.dispose(),
  };
}

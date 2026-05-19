/**
 * lib/type3d/materials.ts — Four display-type materials.
 *
 *   foil    — pink → lavender → chrome gradient sweep that
 *             matches the existing `.lux-foil` CSS treatment.
 *             Animated when reduced-motion isn't asked for.
 *   chrome  — polished metal, neutral hue, high specular.
 *   matte   — warm-black with subtle ambient — used when the
 *             surrounding plate already carries the colour story
 *             and the type just needs presence.
 *   glass   — physically-thin transmissive material for glassy
 *             editorial moments (table-of-contents drops etc).
 *
 * All four implement the same `MaterialBundle` interface so the
 * renderer can swap them without branching every frame.
 */

import type * as THREE_NS from "three";

export type MaterialName = "foil" | "chrome" | "matte" | "glass";

export type MaterialBundle = {
  material: THREE_NS.Material;
  /** Optional per-frame hook — the renderer calls this with
   *  elapsed seconds. Used by foil's gradient sweep. */
  tick?: (t: number) => void;
  dispose(): void;
};

type Three = typeof import("three");

export function buildMaterial(
  THREE: Three,
  name: MaterialName,
  options: { reducedMotion: boolean },
): MaterialBundle {
  switch (name) {
    case "foil":
      return buildFoil(THREE, options);
    case "chrome":
      return buildChrome(THREE);
    case "matte":
      return buildMatte(THREE);
    case "glass":
      return buildGlass(THREE);
    default:
      return buildMatte(THREE);
  }
}

/**
 * Foil — animated pink-200 → lavender-200 → chrome-100 sweep.
 * Implemented as a `MeshPhysicalMaterial` with metalness=1 and a
 * tiny onBeforeCompile injection that mixes three colour stops
 * along world-space y with a time-varying offset.
 */
function buildFoil(
  THREE: Three,
  { reducedMotion }: { reducedMotion: boolean },
): MaterialBundle {
  const c1 = new THREE.Color("#fbcfe8"); // pink-200
  const c2 = new THREE.Color("#ddd6fe"); // lavender-200
  const c3 = new THREE.Color("#f5f5f4"); // chrome-100

  const uniforms = {
    uTime: { value: 0 },
    uC1: { value: c1 },
    uC2: { value: c2 },
    uC3: { value: c3 },
  };

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0.18,
    clearcoat: 0.6,
    clearcoatRoughness: 0.18,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uC1 = uniforms.uC1;
    shader.uniforms.uC2 = uniforms.uC2;
    shader.uniforms.uC3 = uniforms.uC3;

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
       varying vec3 vWorldPos;`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <worldpos_vertex>",
      `#include <worldpos_vertex>
       vWorldPos = worldPosition.xyz;`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
       uniform float uTime;
       uniform vec3 uC1;
       uniform vec3 uC2;
       uniform vec3 uC3;
       varying vec3 vWorldPos;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "vec4 diffuseColor = vec4( diffuse, opacity );",
      `float t = fract(vWorldPos.y * 0.18 + uTime * 0.08);
       vec3 foil;
       if (t < 0.5) foil = mix(uC1, uC2, t * 2.0);
       else foil = mix(uC2, uC3, (t - 0.5) * 2.0);
       vec4 diffuseColor = vec4(foil, opacity);`,
    );
  };

  return {
    material,
    tick: reducedMotion
      ? undefined
      : (t: number) => {
          uniforms.uTime.value = t;
        },
    dispose: () => material.dispose(),
  };
}

function buildChrome(THREE: Three): MaterialBundle {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xeaeaea,
    metalness: 1,
    roughness: 0.12,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    reflectivity: 1,
  });
  return { material, dispose: () => material.dispose() };
}

function buildMatte(THREE: Three): MaterialBundle {
  const material = new THREE.MeshStandardMaterial({
    color: 0x191420, // warm-black-ish
    metalness: 0.05,
    roughness: 0.85,
  });
  return { material, dispose: () => material.dispose() };
}

function buildGlass(THREE: Three): MaterialBundle {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.05,
    transmission: 0.95,
    thickness: 1.2,
    ior: 1.45,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  return { material, dispose: () => material.dispose() };
}

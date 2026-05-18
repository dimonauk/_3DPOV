/**
 * app/atelier/poi-sculptor/post.ts
 *
 * Post-processing pipeline. Bloom is the workhorse — it sells the
 * emissive trail surface and the spark particles. Film grain plus a
 * mild vignette stop the result reading too clean. AO and DoF are
 * intentionally omitted; they would need three nodes (ao, denoise, dof)
 * that may not be stable across all builds of the Three.js TSL set
 * the site targets, and we'd rather fail safely than fail loudly.
 */

import * as THREE from "three/webgpu";
import {
  length,
  mx_noise_float,
  pass,
  smoothstep,
  time,
  uv,
  vec2,
  vec3,
} from "three/tsl";
// BloomNode is vendored at lib/three-vendor/BloomNode.js (MIT, copied
// verbatim from three/examples/jsm/tsl/display/BloomNode.js). Vendored
// because Next 15.6 canary's Turbopack mis-resolves the export through
// `three/tsl` when the file is imported via three's package exports,
// failing the prod build with "The export bloom was not found in
// module three/build/three.tsl.js". Direct path-import avoids that.
import { bloom } from "lib/three-vendor/BloomNode.js";
import { createLogger, errToObject } from "lib/log";

const log = createLogger("atelier:poi-sculptor:post");

export type FxState = {
  bloom: boolean;
  film: boolean;
};

export type PostPipeline = {
  postProcessing: THREE.PostProcessing;
};

export function buildPostPipeline(
  renderer: THREE.WebGPURenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  fx: FxState,
): PostPipeline | null {
  try {
    const postProcessing = new THREE.PostProcessing(renderer);
    const sp = pass(scene, camera);
    const sc = sp.getTextureNode("output");
    let node: ReturnType<typeof sp.getTextureNode> = sc;

    if (fx.bloom) {
      try {
        node = bloom(node, 1.6, 0.35, 0.08);
      } catch (err) {
        log.warn("bloom unavailable", { err: errToObject(err) });
      }
    }

    if (fx.film) {
      const grain = mx_noise_float(vec3(uv().mul(512), time.mul(18))).mul(0.025);
      const vign = smoothstep(0.45, 0, length(uv().sub(vec2(0.5)))).oneMinus().mul(0.18);
      node = node.add(grain.sub(vign));
    }

    postProcessing.outputNode = node;
    return { postProcessing };
  } catch (err) {
    log.warn("post-pipeline failed", { err: errToObject(err) });
    return null;
  }
}

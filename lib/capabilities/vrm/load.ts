/**
 * lib/capabilities/vrm/load.ts — Capability `vrm.load`: parse a .vrm URL into a typed handle.
 *
 * One-line role: lift a VRM file from a URL, run the standard cleanup pass, register it in the vrm slice.
 * Full purpose in load.PURPOSE.md.
 *
 * Source / port: @pixiv/three-vrm canonical loader pattern, Hangar
 * webgpu-particles-library/apps/07-aura-alive/main.js VRM mount section.
 * Atomised per docs/CAPABILITY_REGISTRY_PLAN.md Wave 1.
 */

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  VRMLoaderPlugin,
  VRMUtils,
  type VRM,
} from "@pixiv/three-vrm";

import { vrmStore, type VRMHandle, type VRMHandleId } from "lib/state/vrm";

export type LoadVRMOptions = {
  /** Absolute URL or public-folder path to the .vrm file. */
  url: string;
  /** Optional stable ID. Auto-generated via `crypto.randomUUID()` if omitted. */
  id?: VRMHandleId;
};

export type LoadVRMResult = {
  id: VRMHandleId;
  vrm: VRM;
};

/**
 * Load a VRM from a URL, run the standard cleanup pass, and register
 * the handle in `lib/state/vrm.ts`. Returns the typed VRM + the ID
 * the caller should reference in slice updates.
 */
export async function loadVRM(options: LoadVRMOptions): Promise<LoadVRMResult> {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  const gltf = await loader.loadAsync(options.url);
  const vrm = gltf.userData.vrm as VRM | undefined;
  if (!vrm) {
    throw new Error(`vrm.load: no VRM data found at ${options.url}`);
  }

  VRMUtils.removeUnnecessaryVertices(vrm.scene);
  VRMUtils.combineSkeletons(vrm.scene);

  const id = options.id ?? crypto.randomUUID();
  const handle: VRMHandle = { id, vrm };

  vrmStore.getState().addHandle(handle);

  return { id, vrm };
}

/**
 * Unload a previously-loaded VRM. Disposes the scene's geometries +
 * materials and removes the handle from the slice. Idempotent — calling
 * with an unknown ID is a no-op.
 */
export async function unloadVRM(id: VRMHandleId): Promise<void> {
  const state = vrmStore.getState();
  const handle = state.handles[id];
  if (!handle) return;

  const vrm = handle.vrm as VRM;
  vrm.scene?.traverse((obj) => {
    const mesh = obj as { geometry?: { dispose: () => void }; material?: unknown };
    mesh.geometry?.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((m: { dispose?: () => void }) => m.dispose?.());
    } else if (material && typeof material === "object" && "dispose" in material) {
      (material as { dispose: () => void }).dispose();
    }
  });

  state.removeHandle(id);
}

/** Resolve the typed VRM for a handle ID, or `null` if unloaded. */
export function getVRM(id: VRMHandleId): VRM | null {
  const handle = vrmStore.getState().handles[id];
  if (!handle) return null;
  return handle.vrm as VRM;
}

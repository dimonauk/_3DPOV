/**
 * lib/capabilities/vrm/wardrobe.ts — Capability `vrm.wardrobe.swap`: hot-swap
 * outfit textures onto an already-loaded VRM rig without reloading it.
 *
 * One-line role: parse a second .vrm (the "outfit"), copy its material maps
 * onto the matching meshes of a base VRM. The rig keeps animating.
 *
 * Source / port: D:/The_Hangar/apps/aura-vrm/src/features/wardrobe/
 * outfitApplicator.ts — promoted into the Holoflow capability registry so
 * it has no Zustand store coupling and uses the standard logger.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, type VRM } from "@pixiv/three-vrm";

import { createLogger } from "lib/log";
import { vrmStore, type VRMHandleId } from "lib/state/vrm";

const log = createLogger("capability:vrm.wardrobe");

/** Slots both MToon and MeshStandard variants of VRM materials may carry. */
const TEXTURE_SLOTS = [
  "map",
  "normalMap",
  "emissiveMap",
  "shadeMultiplyTexture",
  "shadingShiftTexture",
  "matcapTexture",
  "rimMultiplyTexture",
  "outlineWidthMultiplyTexture",
  "uvAnimationMaskTexture",
] as const;

export type SwapOutfitResult = {
  /** Number of meshes whose materials were replaced. */
  swapped: number;
  /** Total meshes the outfit contained. */
  outfitMeshCount: number;
};

/**
 * Apply outfit textures from `outfitBuffer` onto the VRM stored under
 * `baseHandleId`. The base rig keeps its bones, animations, expressions.
 * Only materials change.
 */
export async function swapOutfit(
  baseHandleId: VRMHandleId,
  outfitBuffer: ArrayBuffer,
): Promise<SwapOutfitResult> {
  const handle = vrmStore.getState().handles[baseHandleId];
  if (!handle) {
    throw new Error(`vrm.wardrobe.swap: no base VRM with id ${baseHandleId}`);
  }
  const baseVRM = handle.vrm as VRM;

  const outfitVRM = await parseOutfit(outfitBuffer);
  if (!outfitVRM) {
    return { swapped: 0, outfitMeshCount: 0 };
  }

  const baseMeshes = collectSkinnedMeshes(baseVRM);
  const outfitMeshes = collectSkinnedMeshes(outfitVRM);

  let swapped = 0;
  for (const [name, outfitMesh] of outfitMeshes) {
    const baseMesh = baseMeshes.get(name) ?? fuzzyMatch(name, baseMeshes);
    if (!baseMesh) continue;
    applyMeshMaterials(baseMesh, outfitMesh);
    swapped++;
  }

  // Dispose temp scene geometry — keep cloned textures.
  outfitVRM.scene.traverse((obj) => {
    const mesh = obj as unknown as THREE.Mesh;
    if (mesh.isMesh) mesh.geometry?.dispose();
  });

  log.info("outfit applied", {
    baseHandleId,
    swapped,
    outfitMeshCount: outfitMeshes.size,
  });

  return { swapped, outfitMeshCount: outfitMeshes.size };
}

/* ─── internal ─────────────────────────────────────────────────────────── */

async function parseOutfit(buffer: ArrayBuffer): Promise<VRM | null> {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  try {
    const gltf = await loader.loadAsync(url);
    return (gltf.userData.vrm as VRM) ?? null;
  } catch (err) {
    log.warn("failed to parse outfit VRM", { err: String(err) });
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function collectSkinnedMeshes(vrm: VRM): Map<string, THREE.SkinnedMesh> {
  const map = new Map<string, THREE.SkinnedMesh>();
  vrm.scene.traverse((obj) => {
    const mesh = obj as unknown as THREE.SkinnedMesh;
    if (mesh.isSkinnedMesh) map.set(obj.name, mesh);
  });
  return map;
}

function fuzzyMatch(
  outfitName: string,
  baseMeshes: Map<string, THREE.SkinnedMesh>,
): THREE.SkinnedMesh | null {
  const stripped = outfitName.replace(/[\s_.]*\d+$/, "");
  for (const [name, mesh] of baseMeshes) {
    if (name.startsWith(stripped)) return mesh;
  }
  return null;
}

function applyMeshMaterials(
  baseMesh: THREE.SkinnedMesh,
  outfitMesh: THREE.SkinnedMesh,
): void {
  const baseMats = Array.isArray(baseMesh.material)
    ? baseMesh.material
    : [baseMesh.material];
  const outfitMats = Array.isArray(outfitMesh.material)
    ? outfitMesh.material
    : [outfitMesh.material];
  const count = Math.min(baseMats.length, outfitMats.length);
  for (let i = 0; i < count; i++) {
    const b = baseMats[i];
    const o = outfitMats[i];
    if (b && o) copyTexturesToMaterial(b, o);
  }
}

function copyTexturesToMaterial(
  dst: THREE.Material,
  src: THREE.Material,
): void {
  const d = dst as unknown as Record<string, unknown>;
  const s = src as unknown as Record<string, unknown>;
  let changed = false;
  for (const slot of TEXTURE_SLOTS) {
    const tex = s[slot];
    if (tex instanceof THREE.Texture) {
      const clone = tex.clone();
      clone.needsUpdate = true;
      d[slot] = clone;
      changed = true;
    }
  }
  if ("color" in s && s.color instanceof THREE.Color) {
    (d.color as THREE.Color | undefined)?.copy(s.color);
    changed = true;
  }
  if (changed) dst.needsUpdate = true;
}

# `wardrobe.ts` — purpose twin (capability `vrm.wardrobe.swap`)

## Role

Hot-swap outfit textures onto an already-loaded VRM rig without
reloading the avatar. The caller passes the ID of the base VRM
(already registered in `lib/state/vrm`) plus an `ArrayBuffer`
containing a second .vrm file. The capability parses that second
file into a temporary VRM, walks its skinned meshes, and copies
the texture maps + base colour onto the matching meshes of the
base rig. The base rig keeps its bones, animations, and
expression weights.

## Public surface

- `swapOutfit(baseHandleId, outfitBuffer)` — async, resolves with
  `{ swapped, outfitMeshCount }` so the UI can show "swapped 14/18
  meshes". Throws if the base handle is missing.
- Type: `SwapOutfitResult`.

## Internal

- `parseOutfit(buffer)` — GLTFLoader + VRMLoaderPlugin on a
  blob URL. Returns the temp VRM or `null` on parse failure.
- `collectSkinnedMeshes(vrm)` — map of meshName → SkinnedMesh.
- `fuzzyMatch(name, baseMeshes)` — strips trailing digits +
  punctuation that VRoid sometimes appends, then `.startsWith()`
  matches into the base map. Handles outfit files exported with
  slightly different mesh naming.
- `applyMeshMaterials(base, outfit)` — by-index pair of material
  arrays. VRoid keeps material order consistent across outfit
  exports.
- `copyTexturesToMaterial(dst, src)` — covers MToon + standard
  texture slots, plus base `color`. Clones textures so the temp
  scene can be disposed without breaking the base rig.

## Depends on

- `three` — `Texture`, `Color`, `Material`, `SkinnedMesh`, `Mesh`.
- `three/examples/jsm/loaders/GLTFLoader` — outfit parse.
- `@pixiv/three-vrm` — `VRMLoaderPlugin`, `VRM` type.
- `lib/state/vrm` — `vrmStore` for base handle lookup.
- `lib/log` — namespaced logger.

## Does not

- **Does not own the base VRM lifecycle.** The base rig must
  already have been loaded via `vrm.load`. This capability
  *mutates* its materials in place.
- **Does not own a Zustand slice.** Pure capability — entry-point
  function + helpers, no React, no global state beyond reading
  one handle from `vrm`.
- **Does not write to IndexedDB.** Outfit persistence is the
  caller's job. The route's client component can hold outfits in
  React state, or push them through a future
  `vrm.wardrobe.persist` capability.
- **Does not handle base-mesh dispose.** Only the temp outfit
  scene's geometry is disposed. The cloned textures live on
  inside the base rig.
- **Does not reload bones / skeleton.** Bones come from the base
  rig. Outfits that re-skin (different bind pose) will look wrong
  in places — known limitation of texture-only swap.

## Plug surface

- **State plug:** read-only on `vrm.handles[baseHandleId]`.
- **Type plug:** input `(VRMHandleId, ArrayBuffer)`; output
  `SwapOutfitResult`.
- **Dependency plug:** three.js + @pixiv/three-vrm + the GLTF
  loader. No new npm dependencies.

## Bordering files

- `lib/capabilities/vrm/load.ts` — registers the base handle this
  capability reads from.
- `lib/state/vrm.ts` — handle store.
- `app/aura/wardrobe/wardrobe-client.tsx` — the only current
  caller. Wires the file-drop + click-to-wear UI.

## Overlap with existing surfaces

- `/demo/vrm` — VRM rig + named-pose demo. Does not touch outfit
  textures. This capability operates on whatever rig that route
  (or any other route) has loaded.
- `/demo/aura-talks` — lipsync chain demo. Same — orthogonal to
  outfit swap.
- `/aura/web-llm` — browser-LLM chat. No VRM rendered, no overlap.

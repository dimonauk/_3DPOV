# bmesh.ops.symmetrize — Half-Mesh Mirror & Merge for VRM Character Helmet

**Blender version:** 5.1  
**Licence:** CC0  
**Studio topic:** scripting  
**Slug:** `python-bmesh-ops-symmetrize-half-mesh-vrm-character-helmet-webxr`

## What this entry covers

`bmesh.ops.symmetrize` is the programmatic equivalent of Mesh → Symmetrize in
Blender's Edit Mode. Unlike the Mirror Modifier — which is live and stays in
the stack — symmetrize is **destructive**: it bakes the mirrored copy directly
into the mesh data and merges seam vertices within a configurable tolerance.
That makes it the correct tool when you need clean final topology for VRM
weight-painting and GLB export rather than a non-destructive rig-friendly
stack.

This entry demonstrates the full workflow:

1. Build a low-poly right half of a sci-fi helmet (X ≥ 0) using direct bmesh
   geometry operations — no UI, no operators, no Edit Mode.
2. Call `bmesh.ops.symmetrize(bm, input=all_geom, direction="-X", dist=0.001)`
   to mirror across X=0 and merge the seam.
3. Recalculate face normals — the mirrored copy has inverted winding.
4. Assign a two-material layout (shell + visor tint) and export as Draco-L6
   GLB with +Y up for WebXR.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full build script; run headlessly or in Blender's Text Editor |
| `record.py` | Viewport animation renderer — outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar setup for the screen-capture tutorial video |
| `.expected-artefacts.json` | CI manifest for library validation |

## Produced artefacts

- `hf_sym_helmet.blend` — the Blender source file
- `hf_sym_helmet.glb` — Draco-L6 compressed GLB, WebP textures, +Y up, WebXR-ready

## Key gotchas

- **`direction` semantics**: `'X'` mirrors FROM positive-X TO negative-X (positive side is the *source*).  `'-X'` does the reverse.  When your half-mesh lives on positive-X and you want to mirror left, use `direction="-X"`.
- **`dist` threshold**: verts within this distance of the mirror plane merge.  1 mm (`0.001`) works for objects scaled near 1 BU = 1 m.  Flatten seam verts to X=0 exactly before calling — don't rely on the threshold to pull off-plane verts.
- **Inverted winding**: the mirrored copy ALWAYS has inverted normals.  `bmesh.ops.recalc_face_normals` is not optional.
- **Destination side cleared**: anything already on the destination side is deleted and replaced.  This is safe if your half-mesh is genuinely empty on that side.

## Outside sources

- Blender Foundation, *bmesh.ops API Reference 5.1*, CC-BY-SA-4.0
  <https://docs.blender.org/api/5.1/bmesh.ops.html>
- Blender Documentation Team, *Symmetrize manual*, CC-BY-SA-4.0
  <https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/symmetrize.html>
- KhronosGroup / glTF-Blender-IO, Apache-2.0
  <https://github.com/KhronosGroup/glTF-Blender-IO>

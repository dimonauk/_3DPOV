# Python UV Layer Atlas Pack — Multi-Object WebXR GLB

**Blender 5.1 · Python scripting · CC0 Holoflow Studio 2026**

Demonstrates how to author, read, and rewrite UV coordinates entirely via
Python — no manual UV editor interaction required.  Three prop meshes
(body cube, pillar cylinder, lantern cap sphere) are smart-projected then
placed into distinct quadrants of a shared 0-1 UV tile using
`foreach_get` / `foreach_set` on the mesh's `FLOAT2` corner attribute.
A single shared material with a quadrant-coloured debug texture confirms
the placement in the viewport before final GLB export.

## Key techniques

| Technique | API surface |
|-----------|------------|
| Read UV data in bulk | `mesh.attributes["UVMap"].data.foreach_get("vector", buf)` |
| Write UV data in bulk | `mesh.attributes["UVMap"].data.foreach_set("vector", flat_list)` |
| Headless smart UV project | `bpy.ops.uv.smart_project()` via `temp_override(edit_object=obj)` |
| Quadrant atlas placement | NumPy normalise + scale + offset |
| Debug atlas texture | `bpy.data.images.new()` + `pixels.foreach_set()` |
| Single-draw-call GLB | `export_apply=True`, one shared material |

## Artefacts produced

| File | Description |
|------|-------------|
| `blueprint.py` | Full production script — run in Blender Text Editor |
| `record.py` | Viewport turntable animation recorder |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `/tmp/holoflow_uv_atlas.glb` | Three-prop atlas-mapped GLB |
| `/tmp/holoflow_uv_atlas.json` | Export manifest |

## Running

```bash
blender --background --python blueprint.py
```

Or paste into the Blender Scripting workspace → Run Script.

## WebXR usage

The exported GLB has one `atlas_mat` material referencing `atlas_debug` (WebP
after export).  In Three.js r165+:

```js
const loader = new GLTFLoader();
const { scene } = await loader.loadAsync('holoflow_uv_atlas.glb');
// All three meshes share one MeshStandardMaterial — confirmed by:
// scene.traverse(o => { if (o.isMesh) console.log(o.material.name) })
```

Replace the debug atlas with a baked diffuse/AO texture to ship production
assets with one draw call per scene object group.

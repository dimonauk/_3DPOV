# Python bpy.types.Curves — Hair Strand Data Block
**Blender 5.1 | Holoflow Studio | CC0**

Procedurally constructs a `bpy.types.Curves` hair object from scratch via the
direct data API: `bpy.data.curves.new(name, type='CURVES')`,
`curves_data.add_curves(counts)`, and `foreach_set()` on flat numpy arrays.

64 guide strands distributed across the upper hemisphere of a UV sphere using
a golden-ratio Fibonacci spiral — even coverage with no randomness, so results
are reproducible across Blender versions and headless runs.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main script — builds surface sphere, hair Curves block, exports GLB |
| `record.py` | Renders 240-frame viewport orbit animation for tutorial video |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 capture |
| `.expected-artefacts.json` | Cross-references and expected output file list |

## Expected outputs (after running blueprint.py)

```
output/
  hair_strands_webxr.glb   — sphere + strand edge mesh, Draco L6 compressed
```

## Key API facts

- `bpy.types.Curves` is a **different data type** from `bpy.types.Curve` (bezier/NURBS).
  `type='CURVES'` in `bpy.data.curves.new()` selects the new hair substrate.
- `add_curves(counts)` declares topology — positions are zeroed until you write them.
- `attributes['position']` is **auto-created** after `add_curves()`.
  `attributes['radius']` must be **explicitly created** with `.attributes.new()`.
- The `surface_uv_coordinate` attribute (FLOAT2, CURVE domain) stores the UV of each
  strand's root on the surface mesh, enabling sculpt-mode snapping and the
  GN `Deform Curves on Surface` modifier.
- For GLB export, evaluate through the depsgraph (`evaluated_get()` +
  `new_from_object()`) to get a poly-line edge mesh — the GLTF exporter
  silently skips `Curves` objects.

## Downstream

Pair guide strands with a **GN Interpolate Hair Curves** modifier (on the surface
object) to interpolate thousands of render-density strands from 64 guides.
Add **spring-bone constraints** from the VRM Spring Bones tutorial for physics.

# Python Cycles Shader AOV — Arbitrary Output Variable Custom Data Baking (Blender 5.1)

**Technique:** Cycles Arbitrary Output Variables (AOVs) let you pipe custom
shader-computed data — gradients, masks, curvature estimates, any float or
colour your shader tree can produce — into named render passes alongside the
beauty output.  This blueprint demonstrates two complementary capture routes:
a full ViewLayer AOV render to multi-layer EXR, and a UV-projected Emit Bake
for ready-to-embed WebXR data textures.

## Quick start

```bash
# 1. Open Blender 5.1, new empty scene
# 2. Scripting workspace → open blueprint.py → Alt+P to run
# 3. Watch the single-sample Cycles render fire, then the emit bake
# 4. Check the blend directory: aov_passes_0001.exr + curvature_bake.webp + aov_sphere.glb
# 5. Open record.py → Alt+P for the turntable viewport.mp4
```

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full pipeline — sphere, AOV material, ViewLayer definition, compositor, render + bake + GLB export |
| `record.py` | Turntable animation → viewport.mp4 via EEVEE Next |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for screen.mp4 |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Key concepts

- `vl.aovs.add()` — appends a new `AOVItem` to the ViewLayer; `.name` and `.type` ('COLOR'|'VALUE') must be set before building the compositor
- `ShaderNodeOutputAOV.name` — the AOV target name; shadows the base `Node.name` quirk; must match ViewLayer AOV name **exactly** (case-sensitive)
- AOV Output nodes fire in **every** Cycles sample regardless of which Material Output is active — no need to route them through the active surface path
- `CompositorNodeRLayers` grows output sockets named after each AOV only **after** the ViewLayer AOVs are committed — build the compositor after `define_aovs()` runs
- `OPEN_EXR_MULTILAYER` with `color_depth='32'` — the correct format for lossless float AOV data
- `bpy.ops.object.bake(type='EMIT')` — bakes the Surface of the **active Material Output** node into the selected (unconnected) Image Texture node; no UV project is needed if smart_project already ran
- `Geometry.Pointiness` — vertex-interpolated curvature estimate; thin convex edges → 1.0, concavities → 0.0; good WebXR edge-wear or toon outline thickness data

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| AOV socket missing on RenderLayers | `define_aovs()` ran after compositor build | Re-run `define_aovs()` then `build_compositor()` |
| EXR layer is all black | AOV Output node name doesn't match ViewLayer AOV name | Check case-sensitivity; they must be identical strings |
| Emit bake writes a blank image | `nt.nodes.active` is not the Image Texture node | Confirm `img_node` is set active before calling `bake()` |
| Bake fails with "No active image found" | Image Texture node has no `.image` assigned | Create the image before assigning to `img_node.image` |
| GLB missing texture | Emit output was still active at export time | Confirm `out_render.is_active_output = True` before `export_glb()` |

## Blender version

5.1 — ViewLayer AOVs and `ShaderNodeOutputAOV` are stable from 3.0+; the `bpy.types.AOVItem` collection API is stable in 4.x / 5.x.

## Licence

CC0 — no rights reserved.

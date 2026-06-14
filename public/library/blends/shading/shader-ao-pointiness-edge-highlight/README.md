# Shader — Geometry Pointiness + AO Node: Procedural Edge Highlights & Cavity Shading

**Blender version:** 5.1  
**Licence:** CC0  
**Topic:** Shading  
**Difficulty:** Advanced  
**Estimated time:** 2–3 hours

## What this teaches

`Geometry.Pointiness` is a per-vertex curvature scalar computed from the angle-weighted
average of adjacent face normals.  Flat faces read ~0.5; convex ridges and points rise
toward 1.0; concave corners fall toward 0.0.  Two `ColourRamp` nodes isolate each
extreme — one drives a specular edge highlight, the other drives a cavity grime fill.
`ShaderNodeAmbientOcclusion` adds local-shell occlusion for micro-cavity deepening
without any UV maps or baked textures.  In Cycles, `ShaderNodeBevel` synthesises
virtual micro-chamfer normals at sharp edges, sharpening the specular hot-spot without
subdividing the mesh.

The result is a fully procedural, bake-free surface treatment that reads the underlying
topology and responds to it automatically — ideal for low-poly stylised assets where
hand-painted textures would be too laborious.

## Files in this entry

| File | Description |
|---|---|
| `blueprint.py` | Full scene + material setup. Run in Blender 5.1 Scripting workspace. |
| `record.py` | Camera orbit render → `viewport.mp4`. Run after blueprint.py. |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4`. |
| `hull_panel.blend` | Saved blend file (generated when you run blueprint.py and File → Save). |
| `hull_panel.glb` | GLB geometry export (uncomment `export_glb()` in blueprint.py). |
| `.expected-artefacts.json` | Machine-readable artefact + cross-reference manifest. |

## Key constants to tune

| Constant | Default | Effect |
|---|---|---|
| `EDGE_LO` | 0.52 | Pointiness threshold where edge highlight begins |
| `EDGE_HI` | 0.72 | Pointiness threshold where edge highlight reaches full strength |
| `CAVITY_LO` | 0.28 | Pointiness below this = full grime |
| `CAVITY_HI` | 0.46 | Pointiness above this = no grime |
| `AO_DISTANCE` | 0.20 m | Reach of the AO shell (scale to your object) |
| `BEVEL_RADIUS` | 0.014 m | Virtual chamfer radius (Cycles only) |

Shift `EDGE_LO` toward 0.50 to make the highlight appear on more geometry;
shift it toward 0.70 to restrict it to only the sharpest corners.

## Pointiness: common gotchas

- **Flat-shaded mesh:** every vertex reports a ridge — Pointiness is meaningless.
  Always use smooth shading + Edge Split or custom normals.
- **Resolution-dependent:** a high-poly mesh spreads the gradient; a low-poly mesh
  concentrates it.  A cube corner is a single vertex — the transition is instantaneous.
  Add a Bevel modifier (2 segments) to spread it across ~5 vertices.
- **Not in Geometry Nodes:** Pointiness is a shader-only signal.  Use
  `Edge Angle` in GN for a geometry-level equivalent.

## GLB export note

Pointiness, AO, and Bevel are render-time shader signals — they do not bake into the
GLB material automatically.  For WebXR delivery, bake the Pointiness output to a
vertex-colour attribute first, then reference it via `ShaderNodeAttribute` in the export
material.  See the Texture Baking + Normal / AO tutorial for the bake workflow.

## Outside sources

1. Blender Manual — Geometry Shader Node (CC-BY-SA 4.0, Blender Documentation Team)  
   <https://docs.blender.org/manual/en/latest/render/shader_nodes/input/geometry.html>

2. Blender Manual — Ambient Occlusion Shader Node (CC-BY-SA 4.0, Blender Documentation Team)  
   <https://docs.blender.org/manual/en/latest/render/shader_nodes/input/ambient_occlusion.html>

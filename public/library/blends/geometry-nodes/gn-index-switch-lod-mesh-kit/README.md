# GN Index Switch — Integer-Driven LOD Mesh Kit

**Blender version:** 5.1  
**Topic:** Geometry Nodes — Index Switch  
**Licence:** CC0

## What this is

A Geometry Nodes modifier that selects between three levels of detail
(hi / mid / lo ICO sphere) using `GeometryNodeIndexSwitch` — the
integer-driven sibling of Menu Switch.  The selector is a raw integer socket,
meaning it can be set from Python, driven by a Custom Property, wired from
another GN node, or animated on a keyframe track.

The blueprint exports three GLBs (`lod_sphere_hi.glb`, `lod_sphere_mid.glb`,
`lod_sphere_lo.glb`) by looping the Python export call with `mod[lod_id] = n`
before each `export_scene.gltf` call.  This pattern is the standard approach
for batch-exporting parametric variants from a single scene.

## Polygon budgets

| Tier | Subdivisions | Triangles (approx.) | Use case |
|------|-------------|---------------------|----------|
| Hi   | 3           | 5 120               | Close-up baked mesh |
| Mid  | 1           | 320                 | Standard WebXR prop |
| Lo   | 0           | 80                  | Instanced crowds / far-field |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full build + export script |
| `record.py` | 90-frame LOD cycle viewport render |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## How to run

1. Open Blender 5.1, new General file.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py`, click **Run Script**.
4. Three GLBs appear alongside the `.blend` file.
5. To record the viewport animation, run `record.py` afterwards.

## Key API notes

```python
# Add a third input item to the default 2-item Index Switch:
idx.index_switch_items.new()   # now 3 items

# Access the socket identifier safely (not hard-coded):
lod_id = next(
    s.identifier for s in nt.interface.items_tree
    if getattr(s, 'name', '') == 'LOD Level'
)
mod[lod_id] = 1   # set to mid-tier
bpy.context.view_layer.update()   # force depsgraph re-evaluation
```

## Cross-references

- [Menu Switch tutorial](/tutorials/blender-tutorial-gn-menu-switch-tile-variant-kit) — labelled dropdown sibling
- [GN Socket Groups](/tutorials/blender-tutorial-gn-socket-groups-parametric-crystal-ui) — panel organisation for modifiers
- [Decimate LOD tutorial](/tutorials/blender-tutorial-modifier-decimate-lod-webxr-planar-collapse) — triangle budget context
- [EEVEE Light Probes WebXR](/tutorials/blender-tutorial-eevee-light-probes-sphere-reflection-irradiance-webxr) — scene context for LOD assets

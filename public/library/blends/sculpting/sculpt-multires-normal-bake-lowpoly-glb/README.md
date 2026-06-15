# Multires Modifier — Subdivision-Level Sculpting, Normal Bake, GLB Low-Poly Export

**Blender 5.1 · CC0 · Holoflow Studio**

## What this is

A complete pipeline for adding fine surface detail to a low-poly mesh without
destroying its topology:

1. Build a low-poly UV sphere (96 quads at level 0).
2. Add the **Multiresolution** modifier and subdivide four times (24 576 faces at level 4).
3. Transfer sculpted (here: procedural displacement) shape into the Multires data via `multires_reshape`.
4. Bake a tangent-space **normal map** from level 4 to level 0 using Cycles.
5. Export **GLB** with the level-0 mesh + baked normal (Draco 6, WebP, ~60 KB).

The result is a low-poly asset that looks as though it carries fine hand-sculpted
surface detail — entirely via the normal map, with no high-poly geometry in the export.

## Why Multires rather than Dyntopo?

| | Multires | Dyntopo |
|---|---|---|
| Base topology | Preserved at level 0 | Destroyed (triangulated) |
| Level switching | Any time | N/A |
| Normal bake source | Built into modifier | Needs separate HP mesh |
| Export geometry | Level-0 quads | Remesh result |
| Shape keys | Work at each level | Break on topology change |

Use Multires when you need a clean low-poly result for real-time / GLB export.
Use Dyntopo for rapid organic form-finding before retopology.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy scene build: sphere → UV → Multires → reshape → bake → GLB |
| `record.py` | Viewport animation (level ramp 0→4 + 360° rotation → viewport.mp4) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `sculpted_talisman.blend` | Output .blend (created by blueprint.py) |
| `../../../glbs/sculpting/sculpt-multires-normal-bake-lowpoly-glb/sculpted_talisman.glb` | Output GLB |

## Key API calls

```python
# Add Multires modifier and subdivide
mr = obj.modifiers.new("Multires", type="MULTIRES")
with bpy.context.temp_override(object=obj):
    bpy.ops.object.multires_subdivide(modifier="Multires", mode="CATMULL_CLARK")

# Transfer shape from another mesh into Multires at the current sculpt level
bpy.ops.object.multires_reshape(modifier="Multires")

# Bake normals using built-in Multires bake (no Selected-to-Active needed)
scene.render.bake.use_multires_baking = True
bpy.ops.object.bake(type="NORMAL")
```

## Troubleshooting

**`use_multires_baking` AttributeError** — if the attribute is missing in your build,
fall back to Selected-to-Active bake: duplicate the high-poly at level 4, apply modifiers,
bake normal with `use_selected_to_active = True`, extrusion = 0.05.

**Bake is solid blue (no detail)** — confirm `mr.sculpt_levels = MULTIRES_LEVELS`
and `mr.levels = 0` before calling `bpy.ops.object.bake()`.

**GLB shows no normal-map shading in viewer** — confirm `export_tangents = True`
in the glTF exporter call; tangent vectors are mandatory for tangent-space normals.

## Licence

CC0 — place in the public domain.  No attribution required.

## Tutorial page

`/tutorials/blender-tutorial-sculpt-multires-normal-bake-lowpoly-glb`

# GN Interpolate Curves — Procedural Strand Hair on VRM Scalp

**Blender 5.1 · CC0 · Holoflow Studio**

Distributes 256 procedural hair strands across a VRM scalp hemisphere using
the Geometry Nodes `Interpolate Curves` node and 8 artist-positioned guide
curves. Strands are converted to a round ribbon mesh and exported as GLB for
WebXR/VRM use.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the full scene: scalp dome, guide HairCurves, GN modifier, saves blend + exports GLB |
| `record.py` | Renders a 90-frame viewport MP4 animating the Seed parameter |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen capture session |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Running

```bash
# In Blender's scripting workspace, with an empty scene:
# 1. Open blueprint.py — run it to build the scene and export GLB
# 2. Open record.py  — run it to render viewport.mp4

# Or from the command line:
blender --background --python blueprint.py
blender scalp_hair.blend --background --python record.py
```

## Key Concepts

**Why `bpy.data.hair_curves` not `bpy.data.curves`**
The new Curves object (HairCurves) uses an attribute-based point store
instead of control-point handles. `add_curves([n, n, n…])` appends curves
with explicit per-curve point counts. Position is set via
`hc.attributes['position'].data[i].vector`.

**Guide count vs strand count**
8 guides produce 256 interpolated strands. The Interpolate Curves node
blends up to 4 nearest guides per strand (Max Neighbours = 4). Fewer guides
→ smoother transitions; more guides → finer parting control.

**MINIMUM_TWIST guide up mode**
Prevents the per-strand frame from flipping at high curvature. Essential for
round profiles; FOLLOW_HAIR_CURVE is better only for flat ribbon hair.

**GLB export**
`Curve to Mesh` converts the Curves output to a Mesh before the modifier
chain ends. The GLTF exporter has no native Curves support, so this conversion
step is mandatory for any WebXR deployment.

## Triangle Budget

| Strands | Points | Circle verts | Triangles |
|---------|--------|--------------|-----------|
| 256 | 8 | 6 | ~24 K |
| 512 | 8 | 6 | ~48 K |
| 128 | 8 | 4 | ~6 K |

Recommend 256 strands / 6 verts for mobile WebXR; increase to 512 for desktop.

## Related Tutorials

- [Curves Hair Grooming](/tutorials/blender-tutorial-curves-hair-grooming) — manual grooming approach
- [VRM Spring Bones Hair Chain](/tutorials/blender-tutorial-vrm-spring-bones-hair-chain) — physics follow-up
- [GN Distribute Points Faces](/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter) — related surface scatter

## External References

- Blender Manual — Interpolate Curves node:
  `https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/interpolate_curves.html`
- Yuksel, Schaefer, Keyser — *Hair Meshes* (SIGGRAPH 2009):
  `https://www.cemyuksel.com/research/hairMeshes/`

# Modifier — Decimate: Planar, Collapse and Un-Subdivide for WebXR LOD Meshes

**Blender 5.1** · Modifier Stack · CC0

Three Decimate algorithms, each suited to a different mesh type:

| Mode | `decimate_type` | Best input | Key parameter |
|------|----------------|------------|---------------|
| Collapse | `COLLAPSE` | Organic / scanned mesh | `ratio` (0–1) |
| Planar | `DISSOLVE` | Hard-surface / boxy mesh | `angle_limit` (radians) |
| Un-Subdivide | `UNSUBDIV` | Previously subdivided quad mesh | `iterations` |

## Quick start

```bash
blender --background --python blueprint.py
```

Outputs three LOD GLBs beside the script:
- `lod_sphere_unsubdiv.glb` — icosphere with 2 levels of Un-Subdivide
- `lod_box_planar.glb` — over-subdivided cube with Planar dissolve
- `lod_blob_collapse.glb` — displaced UV sphere at 12% QEM Collapse

## Record the viewport animation

```bash
blender --background decimate_lod.blend --python record.py
```

Output: `public/library/videos/modifiers/modifier-decimate-lod-webxr-planar-collapse/viewport.mp4`

## Key constants

Edit these at the top of `blueprint.py` before running:

```python
COLLAPSE_RATIO   = 0.12   # 0.05 for ultra-low mobile, 0.25 for desktop VR
PLANAR_ANGLE_DEG = 5.0    # raise to 10° for more aggressive flat-face merging
UNSUBDIV_ITER    = 2      # must not exceed the number of SubDiv levels applied
```

## External references

- [Blender Manual: Decimate Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html) — CC-BY-SA 4.0, Blender Foundation
- [Three.js SimplifyModifier](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/modifiers/SimplifyModifier.js) — MIT, mrdoob et al.

# Superquadric Surfaces — Barr Signed Powers & Shape-Space Poi Head

**Blender 5.1 · Python + numpy · WebXR GLB with morph targets**

## What this builds

A poi-head-sized superquadric mesh with five shape keys that animate through
the (e1, e2) parameter space:

| Key | e1 | e2 | Shape |
|-----|----|----|-------|
| sphere (basis) | 1.0 | 1.0 | round sphere |
| cube | 0.2 | 0.2 | pillow cube |
| star | 2.5 | 2.5 | 8-point concave star |
| pillow | 1.0 | 0.2 | cylindrical cushion |
| cylinder | 0.2 | 1.0 | disc / flying saucer |
| discus | 0.5 | 0.5 | intermediate barrel |

All shapes share the same 48×26 quad topology — shape keys are valid and
export as glTF morph targets.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main script — builds mesh, shape keys, material, exports GLB |
| `record.py` | Viewport animation — morphs sphere→cube→star→pillow→sphere |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for screen.mp4 |

## Quick start

1. Open Blender 5.1. Scripting workspace.
2. Open `blueprint.py`. Set `OUT_DIR` to your output folder.
3. Run Script (Alt+P). Expect ~5–10 s on any modern CPU.
4. Check Properties → Object Data → Shape Keys: should list Basis, cube, star,
   pillow, cylinder, discus.
5. Run `record.py` for the morph animation render.

## Mathematical background

Barr (1981) parametric superellipsoid:

```
x = r · fexp(cos v, e1) · fexp(cos u, e2)
y = r · fexp(cos v, e1) · fexp(sin u, e2)
z = r · fexp(sin v, e1)
```

where `fexp(s, e) = sgn(s) · |s|^e` — the signed power function.

`u ∈ [−π, π]` (longitude), `v ∈ [−π/2, π/2]` (latitude).

## Expected artefacts

- `hf_superquadric_poi.glb` — Draco-6, WebP textures, morph targets
- `viewport.mp4` (after record.py)
- `screen.mp4` (after OBS session)

## Licence

Blueprint, record script and notes: CC0 (public domain).
Outside sources credited in tutorial at
`/tutorials/blender-tutorial-python-numpy-superquadric-lame-curve-barr-signed-powers-shape-space-poi-head-webxr`.

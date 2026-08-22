# GN Scale Instances — Noise-Driven Organic Spine Growth

**Blender 5.1 · CC0 · Holoflow Studio**

A procedural porcupine-bristle sphere where 642 cone spines grow outward from
an IcoSphere surface. `Scale Instances` applies a per-instance Z-only scale
field — driven by a 3D Noise Texture (macro pattern) × a latitude-compression
multiplier (polar cap shorter) × an animated `Grow_Factor` socket (0 → 1
reveal).

## Key technique

`Scale Instances` differs from `Transform Instances` in one critical way:
it accepts a **field** — a value that is evaluated independently per instance.
Transform Instances applies a single uniform delta to every instance at once.
Scale Instances can produce a completely different scale for each instance,
enabling organic variation from a single noise evaluation pass.

`Local Space = True` + `Center = (0,0,0)` are the non-obvious settings: Local
Space maps the scale to the instance's own axes (outward from the sphere, not
world-up), and Center at the local origin anchors growth at the base so spines
extend outward rather than retracting inward.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Run inside Blender — builds the full scene and exports GLB |
| `record.py` | Run after blueprint — renders the grow-reveal animation |
| `spine_growth.blend` | Built output (run blueprint.py to generate) |
| `spine_growth.glb` | Draco-compressed GLB for web delivery |

## Running

```bash
blender --background --python blueprint.py
blender spine_growth.blend --background --python record.py
```

## Parameters (top of blueprint.py)

| Constant | Default | Effect |
|---|---|---|
| `SPHERE_SUBDIVISIONS` | 4 | IcoSphere detail (642 verts at 4) |
| `SPINE_LENGTH` | 0.18 m | Full-grown cone height |
| `NOISE_SCALE` | 2.4 | Noise patch size — lower = larger blobs |
| `MIN_SCALE` | 0.18 | Shortest spine fraction |
| `LAT_COMPRESS` | 0.42 | Polar-cap height multiplier |

## Cross-references

- Tutorial: [/tutorials/blender-tutorial-gn-scale-instances-spine-growth](/tutorials/blender-tutorial-gn-scale-instances-spine-growth)
- Related: Instance On Points, Repeat Zone Crystal Cluster, Set Position Noise Blob Planet

## Licence

CC0 — all scripts and scene data in this directory are released into the
public domain. Outside sources credited in blueprint.py header.

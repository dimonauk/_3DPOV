# Catmull-Clark Subdivision from Scratch

**Blender 5.1 · Python bmesh · CC0**

Implements the complete Catmull-Clark algorithm in ~150 lines of Python,
without touching the built-in Subdivision Surface modifier, so every
stencil weight is visible and explainable.

## What is Catmull-Clark?

Edwin Catmull and Jim Clark published their subdivision scheme in 1978
as a way to define smooth surfaces over meshes of arbitrary topology —
the same mathematical foundation Pixar later used for every character in
*Toy Story* onwards (via OpenSubdiv).

The scheme recurses:

1. **Face point F** — centroid of each polygon.
2. **Edge point E** — for interior edges, average of the two endpoints
   and the two adjacent face points.  Boundary edges use the plain
   midpoint.
3. **New vertex V'** — valence-`n` blend:
   ```
   V' = F_avg/n  +  2·E_avg/n  +  (n−3)·V/n
   ```
   At regular valence `n=4` this reproduces the bicubic B-spline
   limit surface exactly — the weights are `1/16, 6/16, 1/16` in the
   standard B-spline notation.  At extraordinary vertices (`n≠4`) the
   surface is C¹ rather than C².

After two rounds the output is visually indistinguishable from the
Blender modifier result.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full CC implementation + poi-head build + GLB export |
| `record.py` | Viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |

## Artefacts produced

- `hf_poi_head_cc.blend` — .blend with base sphere, debug gizmos, CC result
- `hf_poi_head_cc.glb` — WebXR-ready metallic chrome poi head (~55 KB with Draco)
- `public/library/videos/…/viewport.mp4` — 3 s render (run `record.py`)
- `public/library/videos/…/screen.mp4` — OBS screen capture (manual step)

## Running

Open Blender 5.1 → Scripting workspace → open `blueprint.py` → Run Script.
Or from a terminal:

```bash
blender --background --python blueprint.py
```

## Sources

- Catmull E, Clark J (1978). *Computer-Aided Design* 10(6). Public domain mathematics.
- OpenSubdiv by Pixar Animation Studios — Apache-2.0.
  <https://github.com/PixarAnimationStudios/OpenSubdiv>
- DeRose T, Kass M, Truong T (1998). SIGGRAPH '98 Proceedings.

## Cross-references

- [Geodesic Sphere: icosahedron frequency subdivision](/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr)
- [Cotangent Laplacian mesh fairing](/tutorials/blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr)
- [Laplacian vertex smoothing](/tutorials/blender-tutorial-python-bmesh-ops-smooth-vert-laplacian-zone-smoothing-vrm-webxr)
- [GN Tree from Python — poi head](/tutorials/blender-tutorial-python-bpy-gn-tree-from-python-index-switch-poi-head-webxr)
- [Blender Extensions Platform install scan](/docs/INSTALL-SCAN-BLENDER.md)

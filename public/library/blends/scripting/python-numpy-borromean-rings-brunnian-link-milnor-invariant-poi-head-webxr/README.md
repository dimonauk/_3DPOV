# Borromean Rings — Brunnian Link, Milnor μ̄₁₂₃ & Oval-Ring Poi Head

**Topic**: Knot theory / topology  
**Blender version**: 5.1  
**Licence**: CC0  
**Category**: poi-head

## What This Is

Three oval rings interlocked so that removing **any one** of them causes the
remaining two to spring apart freely — yet all three together are inseparable.
This is the defining property of a **Brunnian link**, and the simplest
non-trivial example is the Borromean rings, which carry Milnor's triple
linking number μ̄₁₂₃ = ±1 (zero for any trivially-linked triple).

## Why Oval Rings?

Freedman and Skora (1987) proved that *round* circles in R³ **cannot** form
Borromean rings.  This blueprint uses oval rings with semi-axes a=1.4, b=1.0.
Under the Z₃ cyclic symmetry (X→Y→Z→X), each ring is the geometric image of
its predecessor.  The minimum tube-tube clearance at every crossing is:

    gap = (a − b) − 2·TUBE_R = 0.40 − 0.24 = 0.16 m

provably collision-free for all six crossings simultaneously.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script — generates three oval-ring tori, exports GLB |
| `record.py` | Viewport animation script for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

1. Open Blender 5.1 → Scripting workspace
2. Paste `blueprint.py` and run (F5 or ▶)
3. GLB exported to `//hf_borromean_poi.glb` (same folder as .blend)
4. For viewport animation: paste `record.py` and run

## Cross-References

- `/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr`
  — the Hopf fibration realises Borromean-adjacent great-circle links on S³
- `/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr`
  — Bishop parallel transport frame used in both blueprints
- `/tutorials/blender-tutorial-python-numpy-villarceau-circles-torus-hopf-fiber-interlocked-poi-head-webxr`
  — another interlocked-circle construction on the torus

## Expected Output

- `hf_borromean_poi.blend` — Blender scene
- `hf_borromean_poi.glb` — WebXR-ready GLB (Draco-6, WebP textures)
- `viewport.mp4` — rendered via record.py
- `screen.mp4` — OBS screen recording

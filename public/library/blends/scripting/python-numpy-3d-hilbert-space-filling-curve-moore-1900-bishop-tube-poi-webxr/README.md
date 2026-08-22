# 3D Hilbert Space-Filling Curve — Poi Head

**Category:** scripting · **Blender:** 5.1 · **Licence:** CC0

A Bishop-frame tube wound along the order-3 three-dimensional Hilbert curve.
The curve visits all 512 voxels of an 8 × 8 × 8 integer lattice exactly once,
with every consecutive pair of voxels sharing a face.  The cobalt→amber vertex
colour encodes the path parameter *t* ∈ [0, 1], making the serpentine route
legible as a single continuous thread.

---

## Mathematical content

| Concept | Value / Formula |
|---------|-----------------|
| Hausdorff dimension | dim_H(C∞) = 3 |
| Curve length at order k | L(k) = (8^k / (2^k − 1)) × edge_length → ∞ |
| Voxels visited at order k | 8^k |
| Grid side at order k | 2^k |
| Self-similarity factor | 1/2 per axis per level |
| Consecutive-voxel distance | 1 lattice step (face-adjacent only) |
| Entry→exit displacement | each sub-curve forms a Hamiltonian path on sub-cube |

The curve is **surjective** in the limit (Peano 1890 / Hilbert 1891 / Moore
1900): for any point p ∈ [0,1]³ there exists a parameter t with C∞(t) = p.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 Python script — generates geometry, vertex colour, GLB |
| `record.py` | EEVEE Next viewport animation — 6 s / 180 frames / 1080p |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for `screen.mp4` |

---

## Artefacts produced

- `hf_hilbert_poi.blend` (save manually after running `blueprint.py`)
- `hf_hilbert_poi.glb` (written by `blueprint.py` next to the .blend)
- `viewport.mp4` (written by `record.py`)
- `screen.mp4` (recorded manually — see `SCREEN-RECORDING-NOTES.md`)

---

## Licence

All authored code in this directory is released under **CC0 1.0 Universal**.
Outside references are credited in the tutorial page at
`/tutorials/blender-tutorial-python-numpy-3d-hilbert-space-filling-curve-moore-1900-bishop-tube-poi-webxr`.

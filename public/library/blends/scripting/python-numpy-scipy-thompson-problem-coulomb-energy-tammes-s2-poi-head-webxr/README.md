# Thompson's Problem — Coulomb Energy Minimisation on S²

**Blender 5.1 · Python + NumPy + SciPy · CC0**

## What this is

Place N equal point charges on a unit sphere. The equilibrium arrangement —
where every charge is as far as possible from all others — minimises the total
Coulomb potential energy E = Σᵢ<ⱼ 1/|pᵢ−pⱼ|. This problem was posed by J.J.
Thomson in 1904 (his "plum-pudding" model of the atom) and remains open for
general N.

For small N the answers are classical Platonic solids:
- N=4 → regular tetrahedron
- N=6 → regular octahedron
- N=8 → square antiprism (NOT a cube — surprising)
- N=12 → regular icosahedron

The same geometry appears in spherical virus capsids, geodesic domes, and
optimal satellite constellations.

This blueprint finds the local energy minimum for **N=32** using Riemannian
projected gradient descent initialised from a Fibonacci sphere lattice, then
builds a faceted poi-head mesh from the convex hull of the result.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Expert bpy script — runs in Blender 5.1 Scripting workspace |
| `record.py` | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for `screen.mp4` |
| `hf_thompson_poi.blend` | Saved blend (after running blueprint) |
| `hf_thompson_poi.glb` | Draco-6 GLB for WebXR |

## Running

1. Open Blender 5.1. Switch to Scripting workspace.
2. Open `blueprint.py`. Press **Alt+P**.
3. Console prints energy values at each stage. Expect runtime ~30–90 s.
4. Shape keys `Optimal`, `Mid_Energy`, `Random` appear in Object Properties.
5. Save blend: File → Save As → `hf_thompson_poi.blend`.
6. Load `record.py` and press **Alt+P** to render `viewport.mp4`.

## Expected console output

```
[thompson] N=32 on S²
[thompson] E(random)    = 158.xxxx
[thompson] E(fibonacci) = 146.xxxx
[thompson] E(mid @1200) = 138.xxxx
[thompson] E(optimal)   = 137.xxxx
[thompson] GLB → //hf_thompson_poi.glb
[thompson] Done — poi head hf_thompson_poi.glb written.
```

Lower E(optimal) is better. Known best-known N=32 value ≈ 137.26 (Sloane tables).

## Dependencies

- NumPy (bundled with Blender 5.1)
- SciPy (install via Blender's bundled pip if not present:
  `import subprocess, sys; subprocess.run([sys.executable, "-m", "pip", "install", "scipy"])`)

## Licence

CC0 — all studio-authored content in this folder is dedicated to the public domain.
Outside sources: see blueprint.py docstring for attributions.

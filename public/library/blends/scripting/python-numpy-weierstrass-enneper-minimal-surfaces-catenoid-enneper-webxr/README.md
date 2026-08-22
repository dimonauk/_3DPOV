# Weierstrass–Enneper Minimal Surfaces

**Blender 5.1 · Python + NumPy · CC0**

Three classical minimal surfaces built from complex-analytic data:

| Object | WE data (f, g) | Domain | Notable property |
|--------|---------------|--------|-----------------|
| Catenoid | e^{−z}, e^z | u∈[−2,2], v∈[0,2π) | Only minimal surface of revolution; global embedding |
| Helicoid | same (θ=π/2 Bonnet) | — | Ruled; isometric to catenoid (Schwarz 1865) |
| Enneper surface | 1, z | u,v∈[−1.5,1.5] | Self-intersecting; Z₃ rotational symmetry |

The catenoid object carries 9 Shape Keys (θ = 0 → π/2 in 8 steps) that
interpolate through the associate family, smoothly morphing into the helicoid
while preserving the intrinsic metric at every intermediate stage.

## Running

```python
# In Blender's Script Editor or via bpy CLI:
exec(open("blueprint.py").read())   # builds scene, exports GLB
exec(open("record.py").read())      # renders viewport.mp4
```

## Files

- `blueprint.py` — scene + mesh + GLB export
- `record.py` — EEVEE Next orbit animation render
- `SCREEN-RECORDING-NOTES.md` — OBS setup for screen.mp4
- `.expected-artefacts.json` — CI manifest

## Mathematical background

The WE representation guarantees minimality via the null condition
Φ₁² + Φ₂² + Φ₃² = 0, which forces each coordinate to satisfy Laplace's
equation in the conformal parameter z.  For surfaces with non-trivial topology
(Costa surface: g = ℘(z), the Weierstrass elliptic function), the same
framework applies but requires numerical path integration and period
cancellation to avoid branch cuts.

## Licence

Blueprint, record script, and all generated `.glb` files: **CC0 1.0 Universal**.

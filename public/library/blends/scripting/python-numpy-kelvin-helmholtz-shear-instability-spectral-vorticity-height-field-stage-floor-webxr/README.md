# Kelvin–Helmholtz Shear Instability — Stage Floor

Blender 5.1 · CC0 · bpy + numpy · pseudo-spectral vorticity–streamfunction

---

## Physics summary

Two fluid layers in opposing motion share a flat interface under zero surface
tension.  Any infinitesimal corrugation of the interface creates a horizontal
pressure gradient that reinforces the corrugation — positive feedback drives
exponential growth at rate σ = k·U₀/2 for a step-profile (Kelvin 1871;
Helmholtz 1868).  A smooth tanh profile concentrates growth near the peak
wavenumber k* ≈ 0.45/δ (Michalke 1964).  The vortex sheet eventually rolls
up into the iconic cat's-eye billows; further evolution produces secondary
instabilities on the braid regions between cores.

**Miles–Howard criterion (1961):** shear-driven instability requires the bulk
Richardson number Ri = N²/(∂U/∂y)² < 0.25 at some height.  Here Ri = 0
(neutral stratification), so the entire shear layer is unstable.

---

## Parameters

| Symbol | Value | Meaning |
|--------|-------|---------|
| U₀ | 1.0 | Shear velocity half-amplitude |
| δ | 0.2 | tanh shear-layer half-thickness |
| k* | 0.45/δ = 2.25 | Most-unstable wavenumber |
| σ_max | ≈ 0.20·U₀/δ = 1.0 | Peak growth rate |
| NX, NY | 128, 128 | Grid resolution |
| Lx, Ly | 4π, 2π | Periodic domain extents |
| DT | 0.025 | RK4 time step |

---

## Shape keys

| Key | t (simulation) | Physical stage |
|-----|----------------|----------------|
| Basis | 0 | Initial tanh profile — gentle sinusoidal seed visible |
| SK_t20 | 20 | Onset: vortex sheet begins to corrugate |
| SK_t40 | 40 | Billowing: cat's-eye vortices fully formed |
| SK_t60 | 60 | Nonlinear: core merging, secondary KH on braid |

---

## Files

| File | Role |
|------|------|
| `blueprint.py` | Full bpy scene builder — simulation, mesh, colour, shader |
| `record.py` | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS hand-recording instructions |
| `.expected-artefacts.json` | Artefact manifest and cross-references |

---

## Running

```bash
# Build scene and open in Blender GUI:
blender --python blueprint.py

# Headless scene-build + render:
blender --background --python blueprint.py --python record.py

# Export GLB from the saved .blend:
blender --background kelvin_helmholtz_kh.blend \
  --python-expr "import bpy; bpy.ops.export_scene.gltf(filepath='kelvin_helmholtz_kh.glb', export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6)"
```

---

## Licence

Blueprint, record.py, and all generated .blend / .glb files: **CC0 1.0
Universal Public Domain Dedication** — Holoflow Studio.

Physics method: Kelvin (1871) / Helmholtz (1868) — public domain.
Numerical scheme: Orszag (1971) pseudo-spectral + RK4 — standard open
technique, implemented independently.

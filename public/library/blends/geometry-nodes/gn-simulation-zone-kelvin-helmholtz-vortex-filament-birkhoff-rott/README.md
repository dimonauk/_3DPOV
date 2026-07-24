# GN Simulation Zone + Repeat Zone — Kelvin-Helmholtz Vortex Filament Sheet

**Blender 5.1 · CC0 · Holoflow Studio**

24 vortex filaments represent the interface between two counter-streaming fluid
layers.  Each frame a Geometry Nodes **Repeat Zone** accumulates the Biot-Savart
velocity induced by every other filament (Birkhoff-Rott equation with Krasny
desingularisation), then an Euler step advances the positions.  The wavy line
rolls progressively into a tight orange-and-blue spiral — the "cat's-eye" vortex
that is the signature of Kelvin-Helmholtz instability.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds polyline mesh, GN Simulation + Repeat Zone, emission tube material |
| `record.py` | Renders 200-frame EEVEE animation → `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick start

1. Open Blender 5.1 → **Scripting** workspace
2. Open `blueprint.py` → **Run Script**
3. Press **Space** in the viewport — watch the KH instability develop
4. Open `record.py` → **Run Script** to render `viewport.mp4`
5. Follow `SCREEN-RECORDING-NOTES.md` to capture `screen.mp4` via OBS

## Physics summary

```
Birkhoff-Rott:
  u_x(i←j) =  Γ/(2πN) · (y_i − y_j) / (r²_ij + δ²)  ·  (1 − δ_{ij})
  u_y(i←j) = −Γ/(2πN) · (x_i − x_j) / (r²_ij + δ²)  ·  (1 − δ_{ij})
  r²_ij = (x_i−x_j)² + (y_i−y_j)²
  δ  = 0.35  (Krasny core radius)
  Γ  = 2π    (total circulation over period L=2π)
  N  = 24    (filaments; Γ per filament = 2π/N)
  dt = 0.018  (Euler step)
```

## GN node summary

```
Simulation Zone
  StoreNamedAttribute vx=0, vy=0
  Repeat Zone (N=24 iterations)
    SampleIndex(px/py, j) → xj, yj
    per-point: dx=px−xj, dy=py−yj, r²=dx²+dy²+δ²
    mask = Switch(Index==j, 1.0, 0.0)
    dvx += (1/N)·dy/r²·mask
    dvy += (1/N)·(−dx)/r²·mask
    StoreNamedAttribute vx+=dvx, vy+=dvy
  Euler: px+=vx·dt, py+=vy·dt
  SetPosition = (px/2π, py/2π, 0)
Outside: MeshToCurve → CurveToMesh (hex circle r=0.012)
```

## Expected output

- `hf_kh_vortex.blend` — scene with Repeat-inside-Simulation GN tree
- `viewport.mp4` — 200-frame roll-up from wavy line to cat's-eye spiral
- `screen.mp4` — OBS recording of walkthrough + node-tree explanation

## Licence

CC0.  Original implementation of the Birkhoff-Rott vortex-filament method;
mathematics follows Lord Kelvin (1871, Public Domain) and Krasny (1986).

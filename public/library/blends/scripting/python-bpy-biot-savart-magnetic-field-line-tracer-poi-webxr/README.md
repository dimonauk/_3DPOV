# Biot-Savart Magnetic Field-Line Tracer
### Python bpy · Blender 5.1 · CC0 · Holoflow Studio

Implements the Biot-Savart law in pure Python to trace magnetic field lines
around a helical poi-cable current source. 24 tracer particles seeded on an
equatorial ring integrate forward using 4th-order Runge-Kutta, producing
light-painting curve objects that export to GLB for WebXR display.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Production script: helix wire → Biot-Savart B-field → RK4 integrator → POLY curves → GLB |
| `record.py` | Compact 12-trail version with 90-frame camera orbit; renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |

---

## Output artefacts

- `hf_biot_savart.glb` — 24 field-line tube meshes (Draco L6, WebP, +Y up)
- `videos/…/viewport.mp4` — 90-frame EEVEE render: field lines drawing on while camera orbits
- `videos/…/screen.mp4` — Screen capture of script walkthrough (record by hand per NOTES)

---

## Physics

The Biot-Savart law discretised over N wire segments:

```
B ≈ Σ_i  (dl_i × r̂_i) / |r_i|²
r_i = p_field − m_i     (displacement to probe)
dl_i = helix(t_hi) − helix(t_lo)   (chord vector, N=256)
```

Field-line integration step (RK4):

```
k1 = B̂(p)
k2 = B̂(p + ½h·k1)
k3 = B̂(p + ½h·k2)
k4 = B̂(p + h·k3)
p_new = p + (h/6)(k1 + 2k2 + 2k3 + k4)
```

---

## Expected visual

- Helix coil: thin grey-blue emissive tube, 3 turns, 0.15 m radius
- Field lines near axis: tight closed loops through the coil bore
- Equatorial seeds: arcs that spiral outward, bend at the poles, return along
  the exterior — the classic magnetic "doughnut + axis" topology
- 6-colour palette cycling every 4 seeds; bloom glow on black background

---

## Parameters to experiment with

| Constant | Default | Effect |
|----------|---------|--------|
| `WIRE_TURNS` | 3 | More turns → stronger axial field channelling |
| `SEED_RADIUS` | 0.30 m | Seeds inside helix radius → trace field inside coil bore |
| `RK4_DT` | 0.012 m | Larger step → faster but rougher; keep ≤ 0.02 |
| `N_SEEDS` | 24 | 48+ fills the doughnut shell beautifully |

---

## Outside sources

- **magpylib** (MIT) — Michael Ortner et al. — discrete Biot-Savart model
  https://github.com/magpylib/magpylib
- **Blender Python API — bpy.types.Curve** (CC-BY-SA-4.0) — Blender Foundation
  https://docs.blender.org/api/5.1/bpy.types.Curve.html

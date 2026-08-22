# GN Distribute Points on Faces — Poisson Disc Scatter
**Blender 5.1 · Geometry Nodes · CC0**

Scatter three faceted rock variants across a terrain plane using Poisson
Disc distribution.  A vertex-group weight attribute modulates density
per-face, giving brush-level art direction without extra geometry.
Instance on Points places a randomly-chosen rock at each scatter point
with face-normal alignment, random yaw, and random uniform scale.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene build: terrain, rock variants, GN tree, GLB export |
| `record.py` | Viewport animation: density grow (fr. 1–60) → orbit (fr. 91–150) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for screen.mp4 |
| `scatter_terrain.blend` | Saved .blend (created by blueprint.py) |
| `../../glbs/.../scatter_terrain.glb` | Realised instances, Draco 6 + WebP |

## Quick start

1. Open Blender 5.1 → Scripting workspace → open `blueprint.py` → **Run Script** (Alt+P).
2. The terrain appears with `HF_ScatterDensityMask` modifier active.
3. Inspect the GN tree in the Geometry Nodes workspace.
4. In the modifier panel drag **Density Max**, **Min Distance**, **Scale Min/Max** live.
5. Switch to Weight Paint mode to repaint the `scatter_density` group — rocks follow instantly.
6. Run `record.py` to render `viewport.mp4`.

## Key technique

```
Named Attribute ("scatter_density")  ─┐
                                       ├─ Multiply → Density Max field
Group Input ("Density Max")          ─┘

Distribute Points on Faces (POISSON)
  Rotation output ─→ Rotate Euler (AXIS_ANGLE LOCAL Z + random yaw)
  Points   ─→ Instance on Points
               ├─ Collection Info (Separate Children) → random pick
               ├─ rotated euler
               └─ Combine XYZ (uniform random scale)
```

## Node tree parameters

| Parameter | Default | Effect |
|-----------|---------|--------|
| Density Max | 6.0 / m² | Points per m² where vertex weight = 1.0 |
| Min Distance | 0.25 m | Poisson minimum separation |
| Scale Min | 0.08 | Smallest rock world scale |
| Scale Max | 0.22 | Largest rock world scale |
| Seed | 42 | Reshuffles all random streams simultaneously |

## Blender version note

`Distribute Points on Faces` outputs **Normal** and **Rotation** sockets
since Blender 4.0.  The **Rotation** output already aligns local Z to the
face normal — no Align Euler to Vector node required.
`Separate Children` + `Pick Instance` on Instance on Points enables
per-point collection member selection.

## Licence

Blueprint, record script, and all authored assets — CC0 / public domain.  
Blender Manual references — CC-BY-SA 4.0, Blender Documentation Team.

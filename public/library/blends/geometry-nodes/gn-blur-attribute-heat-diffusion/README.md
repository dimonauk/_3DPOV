# GN Blur Attribute — Heat Diffusion Dome

**Blender 5.1 | Geometry Nodes | CC0**

## What this demonstrates

The **Blur Attribute** node performs iterated topological averaging: each
pass replaces every element's value with a weighted mean of its
edge-adjacent neighbours.  The result mimics heat conduction along the
mesh surface — hence the name "heat diffusion".

Two properties make it distinct from Geometry Proximity:

- **Topology-aware, not geometry-aware.** It counts mesh hops, not metres.
  A long thin triangle counts as one hop the same as a tiny equilateral one.
- **Conductor weights.** The `Weight` input (a per-element float field) lets
  you designate zones that resist diffusion — the equatorial band here uses a
  low-weight socket to slow the spread.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy data-API build: sphere, GN tree, material, GLB export |
| `record.py` | Animates Iterations 1→24→1; renders to `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for `screen.mp4` |
| `.expected-artefacts.json` | Output manifest + cross-references |

## Outputs

- `heat_diffusion_dome.blend` — source file with live GN modifier
- `heat_diffusion_dome.glb` — Draco-compressed GLB with `heat_blurred`
  written as custom vertex attribute `_HEAT_BLURRED`
- `viewport.mp4` — rendered viewport animation (requires `record.py`)
- `screen.mp4` — Dimona's OBS screen recording

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `POLE_Z_THRESHOLD` | 0.92 | cos(23°): cap size |
| `ITER_DEFAULT` | 12 | Blur iterations |
| `EQUATOR_WIDTH` | 0.15 | |Z| < this → insulation band |
| `RESIST_DEFAULT` | 0.3 | Conductivity in insulation band |
| `LIFT_MAX` | 0.18 m | Peak normal displacement |

## Tutorial

`/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion`

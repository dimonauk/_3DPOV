# Barkley Excitable Medium — Rotating Spiral Wave Poi Head

**Blender 5.1 · Python numpy · CC0**

## What this is

The Barkley model (1991) is a minimal two-species reaction-diffusion system
that supports **rotating spiral waves** — the same class of dynamics as the
Belousov-Zhabotinsky chemical reaction, cardiac fibrillation, and migrating
cortical activity.  We integrate it on a 128 × 128 grid, then drape the
resulting activator field over a UV sphere to produce a displaced poi head
whose surface tells the spiral's story in geometry.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full pipeline: PDE simulation → mesh → shape keys → GLB |
| `record.py` | Automated viewport animation (`viewport.mp4`) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Artefact manifest for the CI checker |

## Running

1. Open Blender 5.1.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` (Text ▸ Open).
4. Press **Alt+P** to run.

The script takes approximately **45–90 seconds** on a modern CPU (most time
is the 1 200-step PDE integration).

## Parameters to experiment with

```python
A_BARKLEY = 0.75   # increase → sharper wavefront (try 0.5–0.9)
B_BARKLEY = 0.06   # decrease → lower excitation threshold
EPS       = 0.02   # increase → wider pulse (try 0.05 for meandering spirals)
GRID_N    = 128    # increase to 256 for finer spiral resolution
DISP_SCALE = 0.022 # reduce for subtler displacement
```

Setting `EPS = 0.04` and `A_BARKLEY = 0.6` pushes the system into the
**meandering** regime where the spiral core drifts on a flower-petal trajectory
rather than orbiting in a circle.

## Licence

All code CC0.  Outside sources (equations) in the public domain:
- Barkley (1991) Physica D 49:61–70  
- Fenton & Karma (1998) Chaos 8:20–47

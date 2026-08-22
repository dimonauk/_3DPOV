# Gray-Scott Reaction-Diffusion
**Blender 5.1 | Python + numpy | CC0 | Holoflow Studio**

Produces a 128×128 displacement mesh from the final V-concentration field of a Gray-Scott RD simulation.  The pattern (spots, stripes, or labyrinths) depends on the feed/kill parameter pair.

## Quick Start

```
blender --python blueprint.py
```

Output: `hf_gray_scott.glb` (WebXR-ready, Draco-compressed)

## Parameter Cheat-Sheet

| F_RATE | K_RATE | Pattern |
|--------|--------|---------|
| 0.060 | 0.062 | Turing spots (default) |
| 0.035 | 0.060 | Stripe labyrinths |
| 0.025 | 0.060 | Self-replicating spots |
| 0.025 | 0.065 | Worm-hole holes |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Expert bpy script — simulation + mesh build + GLB export |
| `record.py` | Viewport animation rendering (runs from Blender) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

## References

- Pearson, J. E. (1993) Science 261:189 — parameter space classification
- Gray & Scott (1985) Chem. Eng. Sci. 40:1087 — original model paper

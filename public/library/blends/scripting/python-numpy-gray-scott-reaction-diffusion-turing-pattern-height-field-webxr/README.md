# Gray-Scott Reaction-Diffusion — Turing Pattern Height-Field

**Blender 5.1  |  bpy + numpy  |  CC0**

Generates an organic height-field mesh from the Gray-Scott PDE, which
describes two interacting chemical species producing spontaneous Turing
patterns (spots, stripes, mazes).

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Main script — simulate, build mesh, export GLB |
| `record.py` | Animation script — renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest for this entry |

## Expected output

- `hf_gray_scott.glb` — Draco-6 compressed, WebP textures, +Y up
- `viewport.mp4` — 12-frame OpenGL render showing pattern emergence
- `screen.mp4` — recorded from Blender UI (manual step, see notes)

## Quick start

1. Open Blender 5.1.
2. Switch to **Scripting** workspace.
3. Open `blueprint.py`.
4. Press **Alt + P** (or ▶).
5. The mesh appears in the viewport in ~10–20 s; the GLB is written
   next to the `.blend` file.

## Parameters

```
GRID_N        = 64      # grid resolution (higher = slower, denser pattern)
STEPS         = 6000    # integration depth (lower = coarser pattern)
DU / DV       = 0.210 / 0.105  # diffusion rates
FEED          = 0.035   # substrate feed (alpha/spot regime)
KILL          = 0.060   # activator kill rate
HEIGHT_SCALE  = 0.80    # Z amplitude
```

### Parameter regimes (Pearson 1993)

| Name | f | k | Pattern |
|---|---|---|---|
| alpha | 0.035 | 0.060 | isolated spots |
| beta | 0.035 | 0.065 | labyrinths / stripes |
| gamma | 0.040 | 0.060 | mazes / reticulate |
| worms | 0.062 | 0.061 | moving worm-like blobs |
| solitons | 0.030 | 0.058 | self-replicating spots |

## Mathematical background

```
∂U/∂t = Du·∇²U  − UV²  + f·(1 − U)
∂V/∂t = Dv·∇²V  + UV²  − (f + k)·V
```

Turing instability condition: Dv < Du (activator diffuses slower than substrate).

## Outside sources

- Pearson, J.E. (1993) "Complex Patterns in a Simple System."
  *Science* 261 (5118), pp. 189–192. — PD mathematical description.
- pmneila/jsexp (MIT) — JavaScript Gray-Scott visualiser.
  <https://github.com/pmneila/jsexp>

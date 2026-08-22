# GN Simulation Zone — Coupled Map Lattice: Logistic Map & Spatiotemporal Chaos

**Blender 5.1 · CC0 · Holoflow Studio**

Implements Kaneko's (1984/1989) Coupled Map Lattice (CML) on a ring of 64 vertices
using a Geometry Nodes Simulation Zone.  Each vertex carries a state φ ∈ (0,1) that
evolves by the discrete update rule:

    φᵢ(t+1) = (1−ε)·f(φᵢ) + ε·½·[f(φᵢ₋₁) + f(φᵢ₊₁)]
    f(x) = r·x·(1−x)   r = 3.8 (fully chaotic)

`BlurAttribute` on a 2-connected edge-ring computes the exact Kaneko neighbour average
without any custom iteration.  The coupling ε steps through three regimes over 180 frames:

| Frames  | ε    | Behaviour                                 |
|---------|------|-------------------------------------------|
| 1–60    | 0.05 | Spatiotemporal chaos — all sites incoherent |
| 61–120  | 0.50 | Kink–antikink travelling waves             |
| 121–180 | 0.95 | Synchronised chaos — all sites lock together |

Each vertex is instanced with a glowing poi sphere (0.06 m radius).  Elevation z = φ × 2 m
and emission hue = φ → colour ramp (blue=0, red=1) — the ring pulses, ripples, then unifies.

## Run

1. Open Blender 5.1, switch to **Scripting** workspace.
2. Paste and run `blueprint.py` — builds `hf_cml_ring` with the GN modifier.
3. Switch to **Rendered** shading (EEVEE Next) and press **Space**.
4. Optionally run `record.py` to render `viewport.mp4`.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds ring, GN Simulation Zone tree, material, camera |
| `record.py` | EEVEE Next 180-frame render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Key parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `N` | 64 | Ring sites (even number for symmetric period-2) |
| `R_LOG` | 3.8 | Logistic growth rate; must exceed 3.57 for chaos |
| `R_RING` | 3.0 m | Ring radius |
| `HEIGHT` | 2.0 m | φ → z mapping range |
| `FRAME_END` | 180 | Total frames (60 per ε regime) |

## Maths note

The logistic map f(x) = r·x·(1−x) at r = 3.8 has a chaotic attractor filling
roughly [0.19, 0.96] with invariant density ρ(x) = 1/(π√(x(1−x))).  Period-2
skeleton: the period-2 orbit sits near φ ≈ 0.17 and φ ≈ 0.95 — you see alternating
blue/red neighbours in the ring during the synchronised regime.

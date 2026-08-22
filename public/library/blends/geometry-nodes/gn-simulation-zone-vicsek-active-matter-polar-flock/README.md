# GN Simulation Zone — Vicsek Active-Matter Phase Transition

**Blender 5.1 · CC0 · Holoflow Studio**

Implements the Vicsek (1995) self-propelled particle model on a 56×56 vertex grid using
a Geometry Nodes Simulation Zone.  Each vertex carries a heading angle θ that evolves by
averaging its neighbours' headings (circular mean via BlurAttribute) then adding uniform
noise η.

As η cools from 2.20 → 0.10 over 280 frames, the lattice transitions from a disordered
rainbow (all θ independent) to large coherent colour domains (spontaneous polar order),
visualising the second-order active-matter phase transition live in the viewport.

## Run

1. Open Blender 5.1, switch to Scripting workspace.
2. Paste and run `blueprint.py` — creates `hf_vicsek` object with GN modifier.
3. Press **Space** in the viewport to watch the simulation.
4. Optionally run `record.py` to render `viewport.mp4`.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds grid, GN tree, material, camera |
| `record.py` | Renders 280-frame EEVEE Next video |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `N` | 56 | Grid side — N² vertices total |
| `BLUR_ITER` | 1 | Neighbour radius (1 = 4-connected) |
| `ETA_HOT` | 2.20 | Start noise (disordered) |
| `ETA_COLD` | 0.10 | End noise (ordered) |
| `FRAME_END` | 280 | Cooling schedule length |

## Physics notes

Critical noise for the XY model on a square lattice ≈ π/3 ≈ 1.05 rad.
Increase `BLUR_ITER` to 2 to model a larger interaction radius (≈ 2-cell neighbourhood),
which raises η_c and changes the domain growth exponent.

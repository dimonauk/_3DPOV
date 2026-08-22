# Python numpy — 2D Navier-Stokes Vorticity-Streamfunction: Lid-Driven Cavity

**Blender 5.1 · Python + numpy · Scripting workspace**

## What this is

A lid-driven cavity simulation using the **vorticity-streamfunction formulation** of the
2D incompressible Navier-Stokes equations.  A unit-square cavity has three no-slip walls and
a top lid moving at velocity U_LID = 1.  At Reynolds number 400 the flow reaches a steady state:
one dominant recirculation vortex with two small corner eddies in the lower corners.

The steady-state velocity field is then used to trace streamlines which become bevel-profile
poi-ribbon curves in Blender, ready for WebXR export as a GLB.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Runs the NS solver + builds the Blender curve object |
| `record.py` | Renders `viewport.mp4` (orbiting camera, 4 s clip) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the full `screen.mp4` tutorial recording |
| `.expected-artefacts.json` | CI artefact manifest |

## Technique summary

| Step | What happens |
|---|---|
| Poisson solver | SOR iteration solves ∇²ψ = −ω on the interior grid |
| Velocity extraction | u = ∂ψ/∂y, v = −∂ψ/∂x from central differences |
| Vorticity transport | Explicit Euler + first-order upwind advection for stability |
| Boundary conditions | Thom (1933) second-order wall BC for ω at each wall |
| Streamline tracing | Arc-length–normalised Euler integration with bilinear sampling |

## Running

1. Open Blender 5.1 → Scripting workspace → New script
2. Paste `blueprint.py` and press **Alt+P** (Run Script)
3. Wait ~25 s for the 8 000 time steps to converge
4. Optionally run `record.py` to render `viewport.mp4`
5. Export GLB: **File → Export → glTF 2.0** with Draco level 6

## Expected artefacts

- `hf_lid_cavity.blend` — saved .blend file
- `hf_lid_cavity.glb` — WebXR-ready GLB export
- `viewport.mp4` — rendered orbit video (see `record.py`)
- `screen.mp4` — OBS screen recording (see `SCREEN-RECORDING-NOTES.md`)

## Parameters to explore

| Parameter | Default | Effect |
|---|---|---|
| `RE` | 400 | Reynolds number — increase toward 1000 to deepen corner eddies |
| `N` | 64 | Grid resolution — 128 gives smoother streamlines, ~4× longer |
| `N_STREAMS` | 22 | Number of traced ribbons |
| `BEVEL_D` | 0.012 | Ribbon cross-section radius |

## Credits

- Ghia, Ghia & Shin (1982) — benchmark velocity profiles — *Computers & Fluids* 10(4)
- Barba & Forsyth (2012) — "12 Steps to Navier-Stokes" — MIT licence
- NumPy Developers — BSD-3-Clause

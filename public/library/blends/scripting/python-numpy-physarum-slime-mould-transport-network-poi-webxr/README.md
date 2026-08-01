# Physarum Slime-Mould Transport Network

**Blender 5.1 · Python / numpy · CC0**

Physarum polycephalum is a single-celled slime mould that forages by extending
a sheet of microscopic agents.  Each agent deposits a trail chemical, senses
that chemical with three forward-facing antennae, and steers toward the
strongest signal.  After thousands of steps the population self-organises into
a fault-tolerant transport network — a biological approximation of the Steiner
minimum tree problem.

This library entry implements the Jones (2010) algorithm on a toroidal
128 × 128 grid with 5 000 agents, then lifts the trail-density field into a
height-field mesh in Blender 5.1 for WebXR export.

## Artefacts

| File | Description |
|---|---|
| `blueprint.py` | Full production script: simulation → height-field mesh → Draco-6 GLB |
| `record.py` | Viewport animation: top-down → oblique pitch → 360° orbit |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar capture instructions |
| `hf_physarum_network.glb` | Draco-6 WebP GLB (produced on run) |
| `hf_physarum_network.blend` | Saved Blender file (save manually after run) |

## Algorithm

The Jones algorithm has four steps per timestep:

1. **Sense** — each agent samples trail values at three positions: straight
   ahead, ahead-left, and ahead-right by `SENSOR_DIST` cells at ± `SENSOR_ANGLE`.
2. **Rotate** — if the forward value is highest, keep heading; if a flank is
   highest, turn that way by `ROTATION_ANGLE`; if both flanks exceed forward,
   random wiggle breaks the deadlock.
3. **Move** — advance `STEP_SIZE` cells in the current heading direction,
   wrapping on the toroidal boundary.
4. **Deposit & Diffuse** — deposit `DEPOSIT` at the new cell; apply a 3 × 3 box
   blur to spread the chemical; multiply by `DECAY` to fade old trails.

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `SENSOR_ANGLE` | 45° | Wider → tighter channels; narrower → diffuse branching |
| `SENSOR_DIST` | 9 cells | Longer → longer-range trunk formation |
| `ROTATION_ANGLE` | 45° | Stiffer agents; reduce for meandering hyphae |
| `DECAY` | 0.88 | Slower decay → denser network; faster → sparse skeleton |
| `N_AGENTS` | 5 000 | More agents → denser coverage, longer runtime |

## Cross-references

- Tutorial: [Physarum tutorial](/tutorials/blender-tutorial-python-numpy-physarum-slime-mould-transport-network-poi-webxr)
- Related: [Gray-Scott reaction-diffusion](/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr)
- Related: [DLA branching crystal](/tutorials/blender-tutorial-python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr)
- Related: [Reynolds Boids flocking](/tutorials/blender-tutorial-python-bpy-reynolds-boids-3d-separation-alignment-cohesion-numpy-webxr)

## External sources

- Jones, J. (2010). *Characteristics of Pattern Formation and Evolution in
  Approximations of Physarum Transport Networks.*  Int. J. Unconventional
  Computing 5(1): 3-23.  Algorithm in public domain.
  <https://uwe-repository.worktribe.com/output/980579>
- NumPy Developers (2024). *NumPy Reference — Random Sampling.*  BSD-3-Clause.
  <https://numpy.org/doc/stable/reference/random/>

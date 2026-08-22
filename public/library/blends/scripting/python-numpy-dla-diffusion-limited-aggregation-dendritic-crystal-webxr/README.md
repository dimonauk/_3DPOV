# DLA — Diffusion-Limited Aggregation: Dendritic Crystal (Blender 5.1)

**Slug**: `python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr`  
**Topic**: scripting  
**Blender**: 5.1  
**Licence**: CC0

## What it makes

A 600-point dendritic crystal grown by the Diffusion-Limited Aggregation
algorithm, animated over 120 frames as each particle freezes into place.
Exported as a Draco-compressed GLB (`hf_dla_crystal.glb`) ready for WebXR
or resin printing.

## Fractal geometry

DLA was first described by Witten & Sander (1981, PRL 47 p. 1400).  Particles
perform a random walk from a source ring; the moment a walker touches the
existing aggregate it sticks.  The resulting shape has fractal dimension
D ≈ 1.71 (3-D DLA; confining spawns to an equatorial belt lowers it
toward 1.65, giving the thin coral-arm appearance).

The same mechanism drives lightning discharge paths, electrodeposition
dendrites, snowflake arm formation, and the vascular branching visible in
the *resin MSLA light-sculpture* tutorial.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full DLA algorithm + Blender scene assembly. Run from Blender Scripting workspace. |
| `record.py` | Viewport render → `viewport.mp4`. Run after blueprint. |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4`. |
| `.expected-artefacts.json` | CI artefact manifest. |

## How to run

```bash
# 1.  Open Blender 5.1, new general file.
# 2.  Scripting workspace → open blueprint.py → Run Script.
# 3.  Wait for console: [DLA] GLB exported → //hf_dla_crystal.glb
# 4.  Scripting workspace → open record.py → Run Script.
# 5.  viewport.mp4 appears in public/library/videos/scripting/…
```

## Parameters (blueprint.py top section)

| Constant | Default | Effect |
|---|---|---|
| `N_AGGREGATE` | 600 | Particle count. 200 = fast test; 1500 = museum-quality |
| `STICK_RADIUS` | 0.18 | Capture radius. Larger → fatter arms |
| `STEP_SIZE` | 0.14 | Brownian step. Larger → more open / less dense |
| `SPAWN_RADIUS` | 6.0 | Walker spawn ring. Must exceed aggregate extent |
| `EMIT_STRENGTH` | 6.0 | EEVEE bloom intensity per bead |

## Cross-references

- [Gray-Scott Reaction-Diffusion](/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr) — another pattern-formation algorithm driven by local rules
- [L-System Branching Coral](/tutorials/blender-tutorial-python-numpy-l-system-lindenmayer-turtle3d-coral-webxr) — deterministic branching vs. DLA's stochastic growth
- [MSLA Light Sculpture](/tutorials/blender-tutorial-python-bpy-resin-msla-light-sculpture-nested-shell-led-cavity-tir-drainage) — print the DLA crystal in clear resin, LED-lit

## Outside sources

1. Witten & Sander 1981 — *Physical Review Letters* 47(19) p. 1400 — original
   DLA paper — public domain via age.
   <https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.47.1400>

2. *The Nature of Code* §1.4 Random Walks — Daniel Shiffman — code MIT.
   <https://natureofcode.com/random-walks/>
   Related: <https://github.com/nature-of-code/noc-book-2>

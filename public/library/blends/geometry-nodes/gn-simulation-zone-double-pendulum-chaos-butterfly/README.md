# Double Pendulum Chaos — Blueprint & Recording Guide

**Blender 5.1 · GN Simulation Zone / Python Handler · CC0 · Holoflow Studio**

Five pendulums start with θ₁ offset by ε = 0.001 rad between neighbours.
Their lower-bob trajectories diverge exponentially — within 120 frames
the purple pendulum traces a completely different path from the cyan one,
despite starting only 2 mm apart. This is *deterministic chaos*: no
randomness, perfect physics, maximum unpredictability.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Build the scene in Blender — run once via Scripting tab |
| `record.py` | Render `viewport.mp4` — run after blueprint in same session |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar capture guide for `screen.mp4` |

## Quick start

1. Open a new Blender 5.1 file.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py`, press **Run Script**.
4. Press **Space** to preview the animation in the viewport.
5. Open `record.py`, press **Run Script** to render `viewport.mp4`.

## Physics parameters (top of blueprint.py)

| Constant | Default | Notes |
|----------|---------|-------|
| `N_PEND` | 5 | Number of pendulums to compare |
| `L1 / L2` | 1.0 / 0.85 m | Arm lengths |
| `M1 / M2` | 1.0 / 0.75 kg | Bob masses |
| `TH1_0` | 120° | Upper-arm starting angle |
| `TH2_0` | 150° | Lower-arm starting angle |
| `EPSILON` | 0.001 rad | θ₁ perturbation between neighbours |
| `FRAME_END` | 250 | Total frames to simulate |

## Expected artefacts

See `.expected-artefacts.json`.

- `hf_double_pendulum.blend` — saved scene
- `viewport.mp4` — EEVEE render with neon trails
- `screen.mp4` — OBS capture of live playback

## Cross-references

- Tutorial: `/tutorials/blender-tutorial-gn-simulation-zone-double-pendulum-chaos-butterfly`
- Related: Spring-Pendulum Poi (Lissajous light-painting)
- Related: Coupled Pendulums (Mathieu resonance)
- Related: Points to Curves Poi Trail (Build modifier ribbon)

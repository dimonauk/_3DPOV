# Screen Recording Notes — Ising Model Spin Lattice

## OBS / Windows Game Bar setup

- **Window source**: Blender 5.1 (full window, not canvas-only)
- **Resolution**: 1920×1080 @ 30 fps
- **Audio**: OFF (silent recording, no mic)
- **Output format**: MP4 / H.264

## What to capture in `screen.mp4`

### Part 1 — Blueprint run (0:00–1:30)

1. Open Blender 5.1 → **Scripting** workspace.
2. Open `blueprint.py` from the file browser in the text editor.
3. Show the parameter block at the top — comment on `N=32` (1024 faces), `T_HOT=4.5`, `T_COLD=0.8`, the critical temperature `T_c ≈ 2.269`.
4. Press **Run Script**. The 32×32 indigo/white tile lattice appears in the viewport with a top-down camera.
5. Switch to **Rendered** shading to show the emission map (pure-black world, two-tone tiles).

### Part 2 — Simulation playback (1:30–3:00)

6. Press **Space** to play from frame 1.
7. Narrate the three regimes live:
   - **Frames 1–40**: disordered — tiles flicker randomly at T=4.5 > T_c. No pattern.
   - **Frames 70–130**: near T_c — domain walls appear. White and indigo blobs grow. Fluctuations are large — this is the *critical slowing down* region.
   - **Frames 160–200**: deep order — large monochromatic patches dominate. Domain walls are sharp. T=0.8.
8. Pause at frame 120. Point out the `spin` face attribute in the **Spreadsheet Editor** (Add Editor → Spreadsheet, set domain=Face).

### Part 3 — GN node tree walkthrough (3:00–5:00)

9. Open the **Geometry Node Editor** with the lattice selected.
10. Walk through:
    - `SimulationInput → SimulationOutput` pair (zone boundary)
    - `Index → Modulo/Divide/Floor` → col/row (face grid decode)
    - Four `SampleIndex(domain=FACE)` nodes (neighbour spin read)
    - `Math(MULTIPLY, 2) → Math(SUBTRACT, 1)` chains → ±1 encoding
    - `Math(ADD)×3` → neighbour sum → `Math(MULTIPLY, 2J)` → ΔE
    - `Math(MAXIMUM, 0) → Math(DIVIDE, T) → Math(MULTIPLY, −1) → Math(EXPONENT) → Math(MINIMUM, 1)` → acceptance probability
    - `SceneTime(Frame) → RandomValue(Float)` → per-face random
    - `Compare(LESS_THAN) → Switch(FLOAT)` → conditional flip
    - `StoreNamedAttribute('spin', FACE)` → state update

### Part 4 — Variation demo (5:00–6:00)

11. Change `T_HOT = 2.5` and `T_COLD = 2.1` to zoom in on the critical region.
12. Re-run blueprint.py and play: domain walls fluctuate at every scale simultaneously — this is scale invariance at T_c (second-order phase transition).
13. Mention: Onsager showed T_c = 2/ln(1+√2) ≈ 2.269 exactly in 1944.

## Recommended OBS scene layout

| Source | Notes |
|--------|-------|
| Blender window capture | Full window, no crop |
| Desktop audio | OFF |
| Mic | OFF |

## File naming

Save as `screen.mp4` in:
`public/library/videos/geometry-nodes/gn-simulation-zone-ising-model-spin-lattice-phase-transition/`

# Screen Recording Notes — Ising Model Tutorial

## Software
- OBS Studio (any recent version) or Windows Game Bar (Win+G)

## Setup
| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no microphone input needed) |
| Output | `screen.mp4`, H.264, CRF 23 |

## Sequence to record (≈ 8–10 minutes)

1. **Theory (2 min)**
   - Open a browser tab to the Onsager 1944 paper abstract.
   - Explain the Ising Hamiltonian on a whiteboard or narrate over a quick sketch:
     H = −J Σ σᵢσⱼ (nearest-neighbour pairs).
   - Name the three temperature regimes and what they look like physically.
   - Mention Onsager's exact result Tc = 2/ln(1+√2) ≈ 2.27 — the first
     exact solution to a non-trivial statistical mechanics model.

2. **Script walkthrough (2 min)**
   - Switch to Blender → Scripting workspace.
   - Step through blueprint.py section by section in the text editor:
     - Parameters block (N=64, TC formula, temperature values).
     - Checkerboard masks (explain WHY bipartite update works).
     - `_sweep()` function — show the ΔE = 2Jσ(Σneighbour) line.
     - `_run()` — equilibration then production snapshot.
     - `build_scene()` — from_pydata, shape keys, vertex colours.

3. **Run the script (2 min)**
   - Press Alt+P. Watch console output:
     `[ising] T_high = 4.000 (paramagnetic) …`
     `[ising] T_crit = 2.2692 (critical)      …`
     `[ising] T_low  = 1.000 (ferromagnetic) …`
     `[ising] mean magnetisation: {'high': ~0.0, 'crit': ~±0.1, 'low': ~±0.9}`
   - The mesh appears in the viewport. Switch to Vertex Colour shading (Z key).

4. **Inspect the three states (2 min)**
   - In Object Properties → Shape Keys panel:
     - Drag T_crit to 1.0 — fractal blue/magenta clusters emerge.
     - Drag T_low to 1.0 (T_crit back to 0) — large monochrome domains
       separated by sharp boundaries.
     - Return Basis (T_high) — salt-and-pepper random noise.
   - Point out: at T_crit, clusters exist at ALL scales simultaneously
     (self-similar, power-law distribution of domain sizes).

5. **Record viewport animation (1 min)**
   - Load record.py. Press Alt+P.
   - Observe the 120-frame render complete (~30 s on a modern CPU).

6. **Save .blend**
   - File → Save As → `hf_ising_floor.blend` in the same directory.

## File outputs expected
- `screen.mp4` — OBS recording of this session
- `viewport.mp4` — rendered by record.py
- `hf_ising_floor.blend` — saved by you
- `hf_ising_floor.glb` — written by blueprint.py automatically

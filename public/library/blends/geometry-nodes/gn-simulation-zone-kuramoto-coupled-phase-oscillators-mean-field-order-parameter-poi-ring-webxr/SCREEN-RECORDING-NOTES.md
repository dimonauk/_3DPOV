# Screen Recording Notes — Kuramoto Coupled Phase Oscillators

**Output**: `public/library/videos/geometry-nodes/gn-simulation-zone-kuramoto-coupled-phase-oscillators-mean-field-order-parameter-poi-ring-webxr/screen.mp4`

## OBS / Xbox Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 |

## What to capture (8–12 minutes)

1. **Open Blender 5.1** — Scripting workspace. Show the system console
   (`Window → Toggle System Console` on Windows).

2. **Paste blueprint.py** — Walk through the parameters block. Point out:
   - `GAMMA = 0.5` → critical coupling `K_c = 2γ = 1.0`
   - `K = 1.8` → 1.8× the critical value, firmly in the synchronised regime
   - `DT = 0.025` → explicit Euler; mention stability bound
   **Run the script** (Alt+P). The console should print the K/K_c ratio.

3. **Switch to Layout workspace** — press **Space** to play. In the first
   10–20 frames the ring is a scramble of cobalt and amber specks at random
   positions. By frame 60–80 you should see them clustering; by frame 120
   most oscillators have locked to the mean phase.

4. **Pause at frame 10** — point at the disordered arrangement. Narrate:
   "Each point's angular position is its phase θ. They're all over the ring
   because K hasn't pulled them together yet — but it has started to."

5. **Advance frame by frame (← →) through frames 50–90** — show the cluster
   forming and the Z lift increasing (order parameter r rising).

6. **At frame 120+** — the ring has collapsed to a tight cluster. Mention the
   Z height: "Every point shares roughly the same Z value now — that's the
   order parameter r ≈ 0.9 lifting the whole ring."

7. **Open GN Editor in a split panel** — navigate the Simulation Zone:
   - Point at the two `AttributeStatistic` nodes and explain that these
     compute the global mean of `cos θ` and `sin θ` in one step.
   - Show `ARCTAN2` feeding into `psi` and the final `SINE(psi − theta)`.
   - Highlight `StoreNamedAttribute('theta')` writing the updated phase back.

8. **Change K to 0.5** — below K_c. Re-run script. Play: the ring stays
   disordered, Z stays near zero, no synchronisation. Narrate the phase
   transition.

9. **Change K to 1.0** — exactly K_c. Run. The cluster forms slowly, weakly —
   classic critical slowing. Nice visual for the phase-transition boundary.

10. **Run record.py** — show render thumbnails appearing. Narrate the camera
    animation (overhead → oblique tilt).

## Framing tips

- Use **Material Preview** (`Z` key) — emission colours show without a full render.
- Split viewport: left = 3-D view in **Camera** mode (`Numpad 0`), right = GN editor.
- Sketch the order parameter r vs K on paper and hold it up at step 8:
  flat r≈0 for K < K_c, then a sqrt-shaped rise above K_c — analogous to a
  ferromagnetic phase transition (compare the Ising tutorial).

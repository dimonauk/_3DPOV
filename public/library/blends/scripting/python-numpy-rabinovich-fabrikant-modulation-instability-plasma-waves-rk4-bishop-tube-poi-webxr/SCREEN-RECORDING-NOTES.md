# Screen Recording Notes — Rabinovich–Fabrikant Attractor Poi Light Trail

**Blender version**: 5.1  
**Recording software**: OBS Studio (or Windows Game Bar)  
**Target file**: `public/library/videos/scripting/.../screen.mp4`

---

## OBS Setup

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (main window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

---

## What to record (step by step)

1. **Open Blender 5.1** with a fresh General scene.

2. **Run blueprint** — Scripting workspace → open `blueprint.py` → press **Run Script**.
   - The terminal prints three orbit-integration passes (~5–15 s each on a modern CPU).
   - Look for `Saved → hf_rf_poi.blend + hf_rf_poi.glb` in the console.
   - The viewport shows a glowing scroll-tube: cobalt for slow segments near the
     fixed-point shadows, amber at the rapid fold where the scroll reverses.

3. **Viewport settings for recording**:
   - Shading: **Material Preview** (or Rendered with Eevee Next)
   - Overlay: disable Grid, Axes, and Statistics
   - Background: solid black  
     (Edit → Preferences → Themes → 3D Viewport → Gradient High → black)
   - If using Rendered mode: enable Bloom (Render Properties → Eevee → Bloom)

4. **Start OBS recording**.

5. **Demonstrate the scroll topology** (1–2 min):
   - Orbit slowly with middle-mouse drag. The RF attractor has a characteristic
     scroll-sheet structure — unlike Lorenz's two butterfly wings, the RF orbit
     spirals outward in a single-sheet scroll then folds back.
   - Press **Numpad 7** (top-down): the orbit traces a figure-of-eight-like path
     in the xy-plane (real and imaginary amplitude components).
   - Press **Numpad 1** (front): the z-axis (energy surplus) is compressed — the
     attractor is thin (D_KY ≈ 2.05, barely above 2-D).
   - Press **Numpad 3** (side): the scroll sheets are visible as layers.

6. **Demonstrate shape keys** — Properties → Object Data → Shape Keys:
   - Drag **SK_PeriodTwo** slider to 1.0: the chaotic scroll collapses to a
     compact period-2 limit cycle (two loops, perfectly repeating). This is
     the parameter regime γ=0.10, α=0.14 — the system has settled into a
     stable periodic attractor instead of chaos.
   - Return to 0. Drag **SK_WeakChaos** to 1.0: mild chaos at γ=0.10, α=0.10
     — the scroll is narrower and less folded than Basis, a transitional state
     between the limit cycle and full chaos.
   - These three shape keys demonstrate the route into chaos through bifurcation
     of the Rabinovich–Fabrikant system.

7. **Show the scripting setup** — briefly scroll through `blueprint.py`:
   - Point out `rf_deriv()` — the 3z term in ẏ vs −1 in ẋ: that asymmetry
     is the root cause of the scroll topology.
   - Show `rk4_orbit()` with the 5 000-step burn-in (the orbit must settle
     onto the attractor from the chosen IC before sampling begins).
   - Show `bishop_frame()` — the Rodrigues projection step that keeps the
     tube normal rotation-minimising.
   - Show the `add_vertex_colour()` call that maps speed magnitude to the
     cobalt → amber gradient via `foreach_set`.

8. **Run `record.py`** to trigger the automatic viewport render (show the
   file-path output in the console).

9. **Stop OBS recording** and trim to ≤ 3 min.

---

## Tips

- The RF attractor is more compact than Lorenz — set `TUBE_R = 0.018` for a
  thicker tube if the thin scroll is hard to see on screen.
- The amber glow is strongest at fold points where speed spikes; boost
  `bloom_intensity` from 0.22 to 0.35 for a more dramatic XR look.
- For a close-up of the scroll fold: zoom to the region where cobalt (slow)
  transitions sharply to amber (fast) — that boundary is the separatrix where
  the orbit reverses direction and accelerates.
- If the period-2 shape key produces a shape that looks like a single loop,
  check that `GAMMA_SK1=0.10` and `ALPHA_SK1=0.14` — even small perturbations
  to these values can push into chaos or a fixed point.

---

*Holoflow Studio — Blender Expert Content Mill*

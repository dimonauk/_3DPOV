# Screen Recording Notes — Lorenz Strange Attractor Poi Light Trail

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

2. **Load blueprint** — Scripting workspace → open `blueprint.py` → press **Run Script**.
   - Watch the terminal: integration of 30 000 ODE steps takes 3–8 s on a modern CPU.
   - Look for `Saved → hf_lorenz_poi.blend + hf_lorenz_poi.glb` in the console.
   - The viewport shows the Lorenz butterfly: two glowing rainbow-coloured wings.

3. **Viewport settings for recording**:
   - Shading: **Solid → Colour: Attribute → Attribute name: LorenzAge**
   - Overlay: disable Grid, Axes, and Statistics
   - Background: solid black (Edit → Preferences → Themes → 3D Viewport → Gradient High)

4. **Start OBS recording**.

5. **Demonstrate the butterfly topology** (1–2 min):
   - Orbit slowly around the object with middle-mouse drag.
   - Press **Numpad 7** (top-down): the two lobes are clearly symmetrical about z.
   - Press **Numpad 1** (front): the wings are thin — the attractor has D_KY ≈ 2.06, barely
     above 2D, so the trajectory fills a planar-like surface.
   - Press **Numpad 3** (side): the z-extension (height of attractor) is visible.
   - Zoom into the centre where the wings meet — trajectories never cross (Lorenz system
     is a homeomorphism; crossing would violate uniqueness of solutions).

6. **Demonstrate shape keys** — Properties → Object Data → Shape Keys:
   - Drag the **Stable_ρ22** slider to 1.0: watch the attractor shrink toward a tight
     spiral (converging to the fixed point C+ at ρ=22 < ρ_H).
   - Return to 0. Drag **Hot_ρ200** to 1.0: the attractor widens and shifts upward
     (higher Rayleigh number → stronger, more vigorous convection rolls).

7. **Show the scripting setup** — briefly scroll through `blueprint.py`:
   - Point out the `lorenz()` function and the three constants σ, ρ, β.
   - Show the `bishop_frame()` loop — the Rodrigues rotation propagating N.
   - Show the `foreach_set` call that sets shape key coordinates in bulk.

8. **Run `record.py`** to trigger the automatic viewport render (show the file path
   output in the console).

9. **Stop OBS recording** and trim to ≤ 3 min.

---

## Tips

- The rainbow vertex colour is most vivid in Workbench with Studio lighting off.
- If the object appears dark, check the material uses the Emission node (not Principled).
- At oblique angles the tube catches the studio light and reads clearly as a 3D ribbon.
- For a dramatic shot: increase `TUBE_R_FRAC` to 0.05 and re-run — thicker wings, more visible at low zoom.
- The `SKIP=5` parameter controls polyline density. Reduce to 3 for a denser, smoother tube
  (increases mesh size to ~5 333 vertices, still real-time).

---

*Holoflow Studio — Blender Expert Content Mill*

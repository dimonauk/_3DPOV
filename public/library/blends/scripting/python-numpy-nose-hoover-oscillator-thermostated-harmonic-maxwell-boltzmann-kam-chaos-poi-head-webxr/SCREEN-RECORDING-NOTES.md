# Screen Recording Notes — Nosé–Hoover Oscillator Poi Head

Captures `screen.mp4`: you navigating and demonstrating in Blender's 3-D viewport.

---

## OBS Settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (silent tutorial; narration added in post) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

---

## What to Record (~90 seconds)

1. **Scripting workspace** (10 s)  
   Show `blueprint.py` open.  Scroll past the docstring so the three equations
   `ẋ = y`, `ẏ = −x + ξ·y`, `ξ̇ = y² − T` are visible.  Hit **Run Script**.

2. **Wait for completion** (15–30 s depending on machine)  
   Stay on the scripting workspace; the script prints `[NoseHoover] Vertices: ...`
   in the console at the bottom when done.

3. **Switch to 3-D Viewport** (5 s)  
   Press Numpad 5 (orthographic → perspective), then Numpad 0 (camera view).

4. **Orbit and inspect** (20 s)  
   Middle-mouse-drag to orbit.  The cobalt-to-amber gradient encodes the
   thermostat friction ξ — cobalt sections are cooling, amber sections heating.

5. **Shape-key tour** (20 s)  
   Open Properties → Object Data → Shape Keys.  
   - Drag **SK_Torus** value from 0 → 1: the tube restructures into a quieter,
     near-periodic winding.  
   - Reset to 0.  Drag **SK_HotT** to 1: wider, hotter trajectory (T=2 bath).  
   - Reset.  Drag **SK_ColdT** to 1: more confined, cooler (T=0.5 bath).

6. **Colour attribute** (10 s)  
   In the viewport, press **Z → Material Preview**.  The ξ-colour gradient
   glows.  Cobalt nodes are the "refrigerator" phase; amber nodes are the
   "engine" phase.

7. **Run record.py** (5 s)  
   Switch back to Scripting, open `record.py`, hit **Run Script**.  
   (Render will run in background — stop OBS once the render begins.)

---

## Output

Save as: `public/library/videos/scripting/python-numpy-nose-hoover-oscillator-thermostated-harmonic-maxwell-boltzmann-kam-chaos-poi-head-webxr/screen.mp4`

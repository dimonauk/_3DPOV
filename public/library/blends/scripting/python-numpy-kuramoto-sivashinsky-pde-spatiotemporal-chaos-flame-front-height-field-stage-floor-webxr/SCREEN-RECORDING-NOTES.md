# Screen-Recording Notes — KS Flame-Front Stage Floor

## What to capture

A screen recording of Blender while you run `blueprint.py`, watch the mesh
appear, then explore the shape keys — showing the transition from quiet
early turbulence (SK_Early) through canonical chaos (Basis) to the
large-domain multi-scale patterns (SK_LgL).

---

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 |
| Output file | `screen.mp4` in this folder |

---

## Recording run (in order)

1. **Open Blender** with a fresh General scene.  Set viewport shading to
   **Material Preview** (Z key → Material Preview) so colours are visible
   from the start.

2. **Open the Text Editor** panel.  Load `blueprint.py` (Text → Open →
   select file).  Press **Run Script** (Alt-P or the ▶ button).
   
   The console will print progress:
   ```
   [KS] Simulating Basis (L=36π, t_rec=100)…
   [KS] Simulating SK_Early…
   [KS] Simulating SK_SmL…
   [KS] Simulating SK_LgL…
   [KS] ✓ Exported → .../ks_floor.glb
   ```
   Simulation takes approximately 60–90 seconds on a modern CPU.

3. **Select `ks_floor`** in the outliner.  Switch to the **3-D Viewport**.
   Press Numpad-5 for orthographic, then Numpad-2 twice for an angled view.

4. **Open the Properties panel → Object Data Properties → Shape Keys**.
   Slowly drag each key value from 0→1 while the camera is recording:
   - `SK_Early` 0→1 (show cells forming)
   - reset to `Basis`
   - `SK_SmL` 0→1 (show quasi-periodic pattern)
   - `SK_LgL` 0→1 (show larger domain chaos)

5. **Orbit the viewport** (middle-mouse drag) to show the floor from a
   45°-overhead angle so both axes (x = space, t = time) are visible.

6. Stop recording.  Trim to ≈ 90 seconds.  Save as `screen.mp4`.

---

## Tip

The cobalt-to-amber colour map directly encodes the wave amplitude:
- **Cobalt** (dark blue) = negative u (troughs, slow-moving cells)
- **Amber** (orange) = positive u (crests, fast-moving flame fronts)

The horizontal axis is space; the vertical axis (pointing away from the
camera in the floor view) is time.  Diagonal stripes that angle forward
indicate cells drifting in space — the characteristic KS turbulence.

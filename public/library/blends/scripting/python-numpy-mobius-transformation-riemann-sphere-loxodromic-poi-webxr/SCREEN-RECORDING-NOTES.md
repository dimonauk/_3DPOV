# Screen Recording Notes — Möbius Transformation / Loxodromic Orbits

**Target file:** `public/library/videos/scripting/python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr/screen.mp4`

## OBS Studio setup

| Setting | Value |
|---|---|
| Window Source | Blender 5.1 (any version ≥ 5.1) |
| Resolution | 1920 × 1080 |
| Frame Rate | 30 fps |
| Audio | Off (no mic, no system) |
| Output Format | MP4 (H.264) |
| CRF | 18 (high quality) |

## What to record (3–4 minutes)

### Step 1 — Run blueprint.py (30 s)
- Open Blender → Scripting workspace
- Load `blueprint.py`
- Hit Run Script
- Let it complete; show viewport going from empty to sphere + spiral orbits

### Step 2 — Inspect the scene (90 s)
- Numpad 5 for orthographic
- Rotate around the sphere with middle-mouse drag
- Show the 72 logarithmic spiral curves converging at north and south poles
- Select one guide curve (every 8th orbit, thicker) — show the NURBS spline handle in the sidebar
- Select the sphere — show the three shape keys in Properties → Object Data → Shape Keys
- Scrub the shape key value slider for `loxodromic` from 0 to 1: the sphere vertices visibly migrate under the transformation

### Step 3 — Material + EEVEE bloom (30 s)
- Show the emission material on a curve (Properties → Material)
- Show EEVEE bloom in Render Properties → Bloom
- Toggle on/off in viewport to demonstrate the glow effect

### Step 4 — Compare conjugacy classes (60 s)
- Explain the three shape keys: elliptic (vertices slide along latitude circles), hyperbolic (cluster toward north pole), loxodromic (spiral — both effects combined)
- Show each by setting that shape key's value to 1.0 and others to 0

### Step 5 — Playback the record.py animation (optional, 30 s)
- Load `record.py`, run it, or open the saved .blend and press Space to play
- Show the shape key animating 0 → 1 → 0 while the camera orbits

## Tips
- Maximise Blender window before recording (F11 or Preferences → Interface → Fullscreen)
- In Viewport Shading → Material Preview, click the sphere-with-dots icon for Rendered preview to see EEVEE bloom in real time
- Zoom so the sphere fills ~70 % of the frame for readable orbit curves

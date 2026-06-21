# Screen Recording Notes
## Python — bmesh Extrude + Scale: Fractal Spike-Ball
### Blender 5.1 · OBS Studio / Windows Game Bar

---

## Goal

Capture `screen.mp4`: you typing through `blueprint.py` in the Scripting
workspace, running it, and panning around the finished spike-ball in the
3D Viewport.

---

## Setup

| Setting | Value |
|---|---|
| Software | OBS Studio 30+ or Windows Game Bar (Win + G) |
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output | MP4 · H.264 · CRF 22 |
| File name | `screen.mp4` |
| Output folder | `public/library/videos/scripting/python-bmesh-extrude-scale-fractal-spikes/` |

---

## OBS Setup Steps

1. Open OBS → Sources → `+` → Window Capture → select `Blender 5.1`.
2. Settings → Output → Recording Path → set to the output folder above.
3. Settings → Video → Base (Canvas) Resolution = 1920×1080, Output = 1920×1080, FPS = 30.
4. Start Recording (or Win+G on Windows).

---

## Recording Script

### Part 1 — Open the Scripting workspace (≈ 30 s)

1. Launch Blender 5.1, dismiss the splash screen.
2. Click the **Scripting** workspace tab.
3. In the Text Editor header: **Open** → navigate to this folder → open `blueprint.py`.
4. Read the parameter block at the top; point out `ICO_SUBDIVISIONS`, `ITERATIONS`, `SCALE_FACTOR`.

### Part 2 — Run the script (≈ 20 s)

1. Press **Run Script** (or Alt+P).
2. Watch the Info header for error messages.
3. Confirm three `[holoflow]` print lines appear in the console.

### Part 3 — Inspect the spike-ball (≈ 60 s)

1. Switch to the **Layout** workspace.
2. Press **Numpad 5** (orthographic), then **Numpad 0** (camera view).
3. Press **Tab** → **Edge select mode** — show the 4-tier spike topology.
4. Switch back to Object Mode.
5. Orbit the viewport with middle-mouse to show the spikes from multiple angles.
6. Open **Object Data Properties** (green triangle) → Normals — confirm flat shading.

### Part 4 — Inspect the material slots (≈ 30 s)

1. Open the **Shader Editor** (Shift+F3 or the shading workspace).
2. Select the object, switch the Shader Editor to Object mode.
3. Switch between material slot 0 (SpikeBase, dark PBR) and slot 1 (SpikeTip, emission).
4. Back in the 3D Viewport, enable **Material Preview** (Z → Material Preview) to see the cyan tips glowing.

### Part 5 — Render preview (optional, ≈ 30 s)

1. Press **F12** for a single-frame render.
2. EEVEE renders the spike-ball with bloom on the emissive tips.

---

## After Recording

- Stop OBS / Game Bar.
- Rename the output to `screen.mp4`.
- Place in `public/library/videos/scripting/python-bmesh-extrude-scale-fractal-spikes/`.

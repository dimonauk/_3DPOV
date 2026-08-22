# Screen-Recording Notes — Gray-Scott Morphogenesis Poi Head

> OBS / Game Bar instructions for capturing `screen.mp4`.  
> Target: 1920 × 1080 px · 30 fps · no audio · H.264 · ~8 min total.

---

## Software

| Tool | Setting |
|------|---------|
| **OBS Studio** (recommended) | Source: Window Capture → select "Blender 5.1" |
| **Windows Game Bar** | Win + G → Capture → Record this window |
| **macOS QuickTime** | File → New Screen Recording → select Blender window |

---

## OBS Setup (one-time)

1. **Output** → Recording → Container: `mp4`, Encoder: `x264`, CRF `18`.
2. **Video** → Base Resolution `1920 × 1080`, Output Resolution `1920 × 1080`, FPS `30`.
3. **Scene** → Sources → + → Window Capture → select the Blender window.
4. Lock source to prevent accidental resize during recording.

---

## What to Record

### Part 1 — Script Setup (~2 min)

1. Open Blender 5.1.  New General file.
2. Switch top-right editor to **Scripting** workspace.
3. Click **New** (text block), paste `blueprint.py`, confirm numpy import visible.
4. Briefly explain the two PDE lines in the docstring — point at each term.
5. Highlight the `REGIMES` list — explain the five (F, k) parameter pairs.

### Part 2 — Simulation Running (~3 min)

1. Click **Run Script**.
2. Switch to the **Info** header to watch print output scrolling ("regime 'spots' …").
3. Switch to **3D Viewport** → Material Preview shading.
4. As each regime completes, orbit the sphere to show it building.
5. After all five finish, open the **Properties** panel → Object Data → Shape Keys.
   Show the four morph targets with value sliders.

### Part 3 — Morphing Demo (~2 min)

1. In the Shape Keys panel, scrub the `worm_stripes` slider from 0 → 1.  
   The surface visibly changes pattern topology.
2. Do the same for `labyrinthine` and `holes`.
3. Orbit slowly to show the 3D displacement depth.

### Part 4 — GLB Export (~1 min)

1. Select the object, File → Export → glTF 2.0.
2. Show settings: Draco compression on, level 6, WebP textures, Morph targets ✓.
3. Click Export.  Confirm terminal shows "Exported → gs_morphogenesis_poi.glb".

---

## After Recording

- Trim to remove dead time before "Run Script" and after "Exported".
- Export as `screen.mp4` into `public/library/videos/scripting/python-numpy-gray-scott-reaction-diffusion-turing-morphogenesis-poi-sphere-webxr/`.
- Keep raw `.mkv` as backup in a local archive folder.

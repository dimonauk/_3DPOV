# Screen Recording Notes — Quaternion Julia Set Hyperplane Sweep

Target file: `screen.mp4` alongside `viewport.mp4`

## Software

- **OBS Studio** (recommended) or Windows Game Bar (Win+G → Record)
- Resolve at **1920 × 1080**, **30 fps**, audio **off**

## OBS Setup

1. Sources → + → Window Capture
2. Window: `[blender.exe] Blender 5.1 – hf_qjulia.blend`
3. Properties → Capture Method: **BitBlt**
4. Transform → Crop to Blender window bounds (exclude taskbar)
5. Settings → Output → Recording Path: same folder as the `.blend`
6. Settings → Video → Base Resolution: 1920×1080 · Output: 1920×1080 · FPS: 30
7. Settings → Output → Recording Format: **MKV** (safer for OBS); remux to MP4 after

## What to Capture

### Pass 1 — Script execution (≈ 2 min)

1. Open `hf_qjulia.blend` (or a new file), switch to the **Scripting** workspace.
2. Load `blueprint.py` into the Text Editor.
3. Maximise the Text Editor so the code is readable.
4. Press **Run Script** — capture the console output appearing in the Info header
   and the mesh building in the viewport behind.
5. Once done, switch to a **3D Viewport** in Solid mode. Rotate around the mesh
   to show the fractal ridgeline at t=0.

### Pass 2 — Shape key morph (≈ 1 min)

1. Select the mesh. Properties → Object Data → Shape Keys.
2. Click each shape key in sequence (`z=0.30`, `z=0.55`, `z=0.75`, `z=0.92`),
   dragging the Value slider from 0 → 1 → 0. Capture in the viewport using
   **Material Preview** (Z key) to show vertex colours.
3. The Julia set cross-section should visibly fragment and shrink with each slice.

### Pass 3 — GLB in browser (optional, ≈ 30 s)

1. Drag `hf_qjulia.glb` onto https://gltf-viewer.donmccurdy.com
2. Show the morph-target sliders under the Extensions panel.
3. Screen-record this tab briefly.

## Editing (DaVinci Resolve / Kdenlive)

- Trim Pass 1 to the ~30 s where mesh appears and camera orbits it.
- Cut to Pass 2 shape key morph (30 s).
- Title card: "Quaternion Julia Set — 4D Hyperplane Sweep" over black.
- Export H.264 MP4 at 1920×1080, CRF 22, AAC silent.
- Rename final file to `screen.mp4`.

## File naming

Place both recordings in:

```
public/library/videos/scripting/
  python-numpy-quaternion-julia-set-4d-hyperplane-sweep-de-height-field-webxr/
    viewport.mp4   ← from record.py
    screen.mp4     ← from OBS
```

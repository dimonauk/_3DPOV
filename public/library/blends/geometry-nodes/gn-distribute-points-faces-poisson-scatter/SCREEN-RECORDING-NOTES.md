# Screen Recording Notes — GN Distribute Points on Faces Scatter

These instructions tell you how to capture `screen.mp4` with OBS Studio or
Windows Game Bar.  The `viewport.mp4` (automated render) is separate.

## Software

- **OBS Studio 30+** (recommended) — or Windows Game Bar (Win+G) on Windows 11.
- Blender 5.1 open, `scatter_terrain.blend` loaded.

## OBS setup

1. **Sources panel → + → Window Capture** → select `Blender`.
2. Right-click source → **Transform → Edit Transform** → set Base Resolution to
   `1920 × 1080`.  Crop if Blender window is larger.
3. **Settings → Output → Recording**:
   - Format: `mkv` (safe against crash) → remux to mp4 after.
   - Encoder: `x264` · Rate Control: `CRF 18` · Preset: `veryfast`.
4. **Settings → Video** → Canvas: `1920×1080` · FPS: `30`.
5. **Start Recording** before step 1 below.

## What to record (≈ 4 minutes)

1. **Open blueprint.py** in the Scripting workspace.  Show the Constants block
   at the top — point out `DENSITY_MAX`, `MIN_DISTANCE`, `WEIGHT_GROUP`.
2. **Run Script** (Alt+P).  Let the scene build.  Pan around the terrain to
   show the scattered rocks.
3. **Geometry Nodes workspace** — trace the tree left-to-right: Group Input →
   Named Attribute → Multiply → Distribute Points (Poisson) → Rotate Euler →
   Instance on Points → Group Output.  Hover each node so the tooltip appears.
4. **Modifier panel** (Properties ▸ spanner icon):
   - Drag `Density Max` from 0 to 10 — rocks densify.  Return to 6.
   - Drag `Min Distance` from 0.05 to 0.6 — spacing widens.  Return to 0.25.
   - Change `Seed` by a few values — rocks shuffle without changing density.
5. **Weight Paint mode** — switch terrain to Weight Paint.  With the Draw brush
   paint a new cluster in an empty area.  Switch back to Object mode — new
   rocks appear inside the painted area.
6. **3D Viewport** — orbit slowly to show the rocks sitting on the flat terrain
   with correct face-normal alignment and varied yaw.

## Stop recording

Click **Stop Recording** in OBS.  Remux the MKV:
- OBS → File → **Remux Recordings** → select the MKV → Remux.

Rename output to `screen.mp4` and place beside `viewport.mp4` in:
`public/library/videos/geometry-nodes/gn-distribute-points-faces-poisson-scatter/`

## Checklist before uploading

- [ ] Resolution 1920×1080
- [ ] No personal notifications visible during recording
- [ ] Blender UI font large enough to read at 720p playback
  (Preferences → Interface → Resolution Scale ≥ 1.25)
- [ ] No audio recorded (source: Desktop Audio muted in OBS mixer)

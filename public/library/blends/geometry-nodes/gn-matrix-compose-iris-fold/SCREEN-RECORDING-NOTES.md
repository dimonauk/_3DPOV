# Screen Recording Notes — GN Compose Matrix: Iris Fold

## Software
OBS Studio (recommended) or Windows Game Bar (Win+G).

## Source settings
- Window Capture → select **Blender 5.1** window
- Resolution: **1920 × 1080** (crop to Blender viewport if needed)
- Frame rate: **30 fps**
- Audio: **off** (no microphone input needed for silent viewport demo)

## What to record

### Shot 1 — Node tree overview (30 s)
1. Open `iris_fold.blend` in Blender 5.1.
2. Switch the right viewport to **Geometry Node Editor**.
3. Select the `IrisFold` modifier object.
4. Pan slowly across the full node tree left → right, pausing 2 s on each of:
   - `FunctionNodeAxisAngleToRotation` (fold hinge)
   - `GeometryNodeComposeMatrix` (M_fold)
   - `GeometryNodeComposeMatrix` (M_azim)
   - `GeometryNodeMultiplyMatrices` (M_i)
   - `GeometryNodeSetInstanceTransform`

### Shot 2 — Live fold animation (15 s)
1. Switch left viewport to **3D Viewport**, Solid shading.
2. Press **Space** to play the timeline.
3. Let the iris close from flat (frame 1) to fully vertical (frame 60).
4. Replay once more.

### Shot 3 — Parameter tweak (15 s)
1. In the **N-panel** (press N), open **Modifier** tab.
2. Change **N Panels** from 8 to 12 — show the tree rebuilding live.
3. Change **Fold Angle** at frame 1 manually to show partial folds.

## Output
Save as `screen.mp4` in `public/library/videos/geometry-nodes/gn-matrix-compose-iris-fold/`.

## Encoding (OBS)
Output → Recording → Format: **mp4** · Encoder: **x264** · CRF: **18** · Preset: **veryfast**

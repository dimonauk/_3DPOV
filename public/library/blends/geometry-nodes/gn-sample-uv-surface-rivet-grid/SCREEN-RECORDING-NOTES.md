# Screen Recording Notes — GN Sample UV Surface: UV-Addressed Rivet Grid

**Output file:** `public/library/videos/geometry-nodes/gn-sample-uv-surface-rivet-grid/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (windowed, 1920×1080) |
| Output resolution | 1920×1080 |
| Frame rate | 30 fps |
| Encoder | x264 or NVENC (CRF 20) |
| Audio | Off — this is a silent technique reel |

## Blender Layout Before You Hit Record

1. Open Blender → **New File → General**.
2. Run `blueprint.py` via **Scripting** workspace → **Run Script**.
3. Switch to **Geometry Nodes** editor. Zoom to show the full node tree.
4. Split the viewport: left = **3D Viewport (Material Preview)**, right = **Geometry Nodes**.
5. Select the `hull_panel` object. Confirm the rivet grid is visible.
6. In the 3D Viewport, press **Numpad 5** (Ortho/Persp toggle → Perspective).
   Press **Numpad 4** once to orbit slightly left. Aim for a 3/4 angle.

## Shot List (aim for 60–90 seconds total)

1. **Overview (0–10s):** Static shot of the hull + rivet grid in Material Preview.
   Show the rivets sitting flush with the warped surface.

2. **Node tree walk (10–35s):** In the GN editor, hover over each key node:
   - `MeshGrid` → explain this is the UV sample coordinate generator
   - `SampleUVSurface` (position) → explain the inverse UV lookup
   - `SampleUVSurface` (normal) → explain how we also grab face normals
   - `AlignEulerToVector` → show how normals drive rivet orientation
   Narrate: *"This grid of points lives in UV space — each vertex is a (u, v)
   coordinate. Sample UV Surface maps those UV coordinates to 3D surface
   positions and normals, regardless of how the hull mesh is shaped."*

3. **Live deform demo (35–65s):** Select the `MapRange` node controlling noise
   strength. In the side panel (N key), drag the `To Max` input from 0.14 to
   0.30. Watch the hull warp and the rivets follow.
   Narrate: *"Notice the rivets move with the surface because they're keyed to
   UV addresses, not world positions."*

4. **Is Valid highlight (65–80s):** Briefly drag one rivet's UV sample outside
   the 0–1 range (edit `UV_MARGIN` constant to −0.1) and show the invalid
   rivet vanishes because the Delete Geometry node gates on `Is Valid`.

5. **Close-up + export (80–90s):** Zoom in on the Material Preview for a final
   beauty shot. Then switch to Scripting tab and run the GLB export section.

## Narration Keywords to Hit

- "inverse UV lookup"
- "topology-independent placement"
- "Is Valid — the safety catch"
- "two Sample UV Surface nodes: one for position, one for normal"
- "UV space as an addressing grid"

## After Recording

1. Trim silence from start/end in the Blender VSE or DaVinci Resolve.
2. Export at 1920×1080, H.264, CRF 20, no audio track.
3. Drop file at: `public/library/videos/geometry-nodes/gn-sample-uv-surface-rivet-grid/screen.mp4`

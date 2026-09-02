# Screen Recording Notes — Hopf Fibration

**Target file:** `public/library/videos/scripting/python-numpy-hopf-fibration-s3-s2-quaternion-villarceau-circles-stereographic-poi-webxr/screen.mp4`

## OBS / Game Bar Settings

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 (full window) |
| Resolution | 1920×1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic needed) |
| Format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## What to record

**Total duration: ~4–6 minutes**

### Part 1 — Blueprint run (45 seconds)
1. Open Blender 5.1 → Scripting workspace.
2. Paste `blueprint.py` into the text editor (or open the file).
3. Press **Run Script**.  
4. Let the console print `[Hopf] … verts · … quads · 16 fibres`.
5. Switch to 3D Viewport.  Hit **Numpad 5** (ortho) then **Numpad 0** (camera).

### Part 2 — Shape key demo (90 seconds)
1. Select `hf_hopf_poi` → Properties → Object Data → Shape Keys.
2. Slowly drag **SK_CapN** from 0→1 in the slider.  Pause on max.
3. Return to 0.  Drag **SK_Equat** from 0→1 — the interlocking circles collapse
   onto a single torus.  Pause on max.
4. Return to 0.  Drag **SK_2Lat** — two linked tori emerge.  Rotate the viewport
   (middle-mouse) to show the linkage from different angles.

### Part 3 — Colour attribute (30 seconds)
1. In the Viewport, switch Shading to **Solid** with **Colour → Attribute**.
2. In the dropdown, pick **Hopf_Z**.
3. Rotate the viewport slowly — show cobalt (negative-Z, large rings)
   blending to amber (positive-Z, smaller rings).

### Part 4 — record.py run (60 seconds)
1. Back to Scripting workspace.  Open `record.py`.
2. Press **Run Script**.  Wait for the render to complete.
3. Navigate to the output folder and open `viewport.mp4` in the file browser.

## Tips
- Set Viewport Shading to **Material Preview** (HDRI lit) for Part 2.
- Disable overlays (header toggle) before recording the shape-key demo.
- Keep mouse movements smooth and slow — no sudden jumps.
- If the script takes >15 seconds, that is expected: 16 fibres × 64 points
  × 8 segments × 4 configs = 32 768 vertices total.

# Screen Recording Notes — Compositor Colour Grading

**Target file:** `public/library/videos/compositing/compositor-color-grading-rgb-curves-cdl/screen.mp4`

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no mic needed) |
| Output format | MP4 / H.264 |
| Bitrate | 6000 kbps |

## Session flow to record

1. **Run blueprint.py** — switch to Scripting workspace, run the script.
   Camera and pillar appear. Compositor tree builds automatically.

2. **Show the scene** — orbit the viewport briefly so the viewer sees the
   faceted pillar and emissive ring.

3. **Open Compositing workspace** — point at the node tree. Pan across:
   Render Layers → Denoise → Exposure → RGB Curves → Color Balance → HSV → Vignette → Composite.

4. **Single-frame render** — press F12. Let Cycles render (64 adaptive samples,
   ~10-30 s depending on GPU). The compositor chain fires automatically after
   the render finishes.

5. **Show before/after** — in the Image Editor (render result), press N to open
   the side panel. Toggle the "Compositing" checkbox off and on to show the raw
   render vs the graded output.

6. **Adjust one parameter live** — click the RGB Curves node, drag the S-curve
   midpoint, press F12 again to show the change.

7. **Adjust CDL Slope** — change the R channel of Slope from 1.05 to 0.96 to
   show a cool grade; re-render to demonstrate the opposite look.

8. **Vignette strength** — disconnect the vignette Math nodes, re-render once
   without vignette, reconnect and re-render to show the difference.

## Tips

- Use Window → Toggle Fullscreen on the Compositing workspace for clean framing.
- Zoom the node editor so node labels are legible (Numpad 0 centres view).
- Keep the Viewer node open in the compositor — it shows the live graded result
  as a floating preview without having to switch to the Image Editor.
- If the render is too slow, reduce Samples to 16 for the demonstration;
  re-run at 64 for the final recording.

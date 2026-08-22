# Screen-Recording Notes — Cycles DOF Bokeh + Motion Blur (Blender 5.1)

Target: a 4–6 minute `screen.mp4` showing the complete workflow.

## Software
- OBS Studio (free, https://obsproject.com) or Windows Game Bar (Win+G)
- Blender 5.1

## OBS Settings
- Source: **Window Capture → Blender** (not Display Capture — avoids stray notifications)
- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Audio: off (narrate in post or add music)
- Output: MP4 / H.264, CRF 18

## Recording Sequence

### Part 1 — Scene Build (~1 min)
1. Open Blender 5.1.  Switch to the Scripting workspace.
2. Click **Open** → load `blueprint.py`.  Click **Run Script**.
3. Switch to the Layout workspace.  Press **Numpad 0** for Camera view.
4. Show the five gems in a line receding from camera.

### Part 2 — DoF Properties (~2 min)
5. Select the camera.  Open **Properties → Camera tab** (camera icon).
6. Expand **Depth of Field** — show: Focus Object = gem_focus, f-stop = 1.4, Blades = 6.
7. In the 3D Viewport header, set overlay dropdown to show **Depth of Field** guide lines.
8. Change **Aperture Blades**: 0 → 3 → 6 → 8 — in EEVEE preview each change updates the bokeh shape in real time.
9. Raise f-stop to 8.0 — show all gems becoming sharp.  Return to 1.4.

### Part 3 — Single-Frame Cycles Render (~1.5 min)
10. Set frame to 1 (camera at start of dolly).  Press **F12**.
11. When render completes, show the sharp gold gem in focus, purple gem near blurred, red gem far blurred.
12. In the render result window, toggle **Slot 1** / **Slot 2** to compare with/without DoF if you render twice.

### Part 4 — Motion Blur (~1 min)
13. Scrub timeline to frame 60 (mid-dolly).  Press **F12**.
14. Show the horizontal streak on bokeh discs — the out-of-focus gems smear sideways more than the in-focus gem.
15. In **Render Properties → Motion Blur**, change Shutter: 0.1 → 0.5 → 1.0 and re-render to show length change.

### Part 5 — Record.py Preview (~0.5 min)
16. Back in Scripting, open `record.py`, click **Run Script**.
17. Play back the viewport frames in the Image Editor: **Image → Browse Image** or drag the output folder.

## Output File
Save as: `public/library/videos/rendering/render-cycles-dof-motion-blur-bokeh/screen.mp4`

# Screen Recording Notes — Newton Fractal Basin of Attraction

Target file: `public/library/videos/scripting/python-numpy-newton-fractal-basin-attraction-complex-roots-stage-floor-webxr/screen.mp4`

## OBS Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Disabled** (capture desktop audio off) |
| Output format | MP4 (H.264 / AAC) |
| Bitrate | 8 000 kbps |

## Recording sequence (~4 minutes)

1. **Open Blender 5.1** — show the default splash / startup scene (10 s).
2. **Switch to Scripting workspace** — click the workspace tab (5 s).
3. **Open blueprint.py** — Text → Open → navigate to the file (10 s).
4. **Run blueprint.py** — press Alt+P. Let console output scroll (20–30 s).
5. **Switch to 3D Viewport** — press N to open sidebar, show the object (10 s).
6. **Material Preview mode** — press Z → Material Preview.  
   Pan slowly around the mesh to show the five-coloured basins and ridge detail (30 s).
7. **Shape key demonstration** — open Object Properties → Shape Keys panel.  
   Slowly drag `roots_3` value 0 → 1 (three-basin morph), back to 0.  
   Then drag `roots_7` value 0 → 1 (seven basins), back to 0 (60 s total).
8. **Top-down view** — press Numpad 7. The five-fold symmetry is most visible
   from directly above. Hold for 15 s.
9. **Open record.py** — load from Text menu, press Alt+P. Show progress bar
   as Workbench renders the 90-frame animation (30 s).
10. **Play the rendered animation** — open the Video Sequence Editor or
    Image Editor → play `viewport.mp4` (15 s).

## Post-processing

None required. Trim the start/end slate in your video editor and export at
the same 1920 × 1080 / 30 fps settings.

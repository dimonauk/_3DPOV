# Screen Recording Notes — bmesh Faceted Gem

Target file: `public/library/videos/scripting/python-bmesh-faceted-gem-topology-construction-webxr/screen.mp4`

## OBS Studio setup

**Window source**: Blender 5.1 (entire window, not display capture)  
**Resolution**: 1920 × 1080  
**Frame rate**: 30 fps  
**Audio**: off (no commentary track needed)  
**Output format**: MP4 / H.264  

## What to record

1. **Open Blender** — File > New > General.  Save to a local folder.
2. **Open Text Editor** — `Shift+F11`.  Paste `blueprint.py`.
3. **Run the script** — `Alt+P`.  Let it execute (~1 second).
4. **Pan to see the gem** — numpad `0` for camera view, or middle-mouse orbit
   in the 3D Viewport.
5. **Zoom into facets** — scroll to fill the viewport with the gem.
6. **Inspect sharp edges** — Overlay dropdown > Tick "Edge Angle" to see the
   hard facet boundaries highlighted.
7. **Open System Console** — Window > Toggle System Console.  Show the
   `[bmesh gem] 17V 24E 17F` output line.
8. **Material preview** — press `Z`, choose "Material Preview" shading.
   The sapphire transmission colour appears.
9. **Rotate the gem** — `R Z` to spin it, showing each facet catching light.
10. **Open the Text Editor again** — paste `record.py` and run `Alt+P`
    to start the EEVEE render.  Record the render progress bar.

## Post-production

Trim to ≤ 90 seconds.  No audio needed.  Export at original resolution to
`public/library/videos/scripting/python-bmesh-faceted-gem-topology-construction-webxr/screen.mp4`.

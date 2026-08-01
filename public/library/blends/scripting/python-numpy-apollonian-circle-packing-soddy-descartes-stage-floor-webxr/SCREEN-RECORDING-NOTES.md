# Screen Recording Notes — Apollonian Circle Packing

**Software**: OBS Studio 30+ or Windows Game Bar  
**Source**: Window Capture → Blender 5.1  
**Resolution**: 1920 × 1080  
**Frame rate**: 30 fps  
**Audio**: Off  
**Output**: `screen.mp4` alongside `viewport.mp4`

---

## What to capture

The script produces a bas-relief stage floor of concentric fractal circles.
The recording should show:

1. **Run blueprint.py** (Scripting workspace, Run Script button).
   - Confirm console prints `[Apollonian] N circles (k < 180)` — expect 700–1 400 circles.
   - Mesh appears in viewport as flat faceted disks of graduated height.

2. **Switch to Rendered viewport** (Z → Rendered) in EEVEE Next.
   - Bloom makes taller pillars glow brighter — this is the key visual.
   - Zoom into the centre where the smallest circles cluster.

3. **Rotate around the origin** using middle-mouse drag.
   - Show the fractal self-similarity: each interstice filled with a smaller disk.
   - Show the height gradient: large circles are flat, tiny circles are tall columns.

4. **Optional**: open the Spreadsheet editor on the mesh and show the faces count (~20 000–40 000).

5. **Run record.py** — let the 150-frame animation render; capture the render progress bar.

---

## Clip structure (tutorial cut)

| Clip | Duration | Content |
|------|----------|---------|
| intro | 5 s | Full gasket in Rendered view, top-down |
| algorithm | 20 s | Annotate a few circles showing their curvature k |
| bas-relief | 15 s | Side view showing height differential |
| render | 10 s | render.py running, output MP4 |
| export | 5 s | GLB file size in file manager |

---

## OBS Scene setup

```
Scene: BlenderApollonian
├── Window Capture: Blender
└── (optional) Image Overlay: Holoflow watermark bottom-right
```

Hotkeys: Start F9, Stop F9. Save output as `screen.mp4` in:
`public/library/videos/scripting/python-numpy-apollonian-circle-packing-soddy-descartes-stage-floor-webxr/`

# Screen Recording Notes — Superquadric Poi Head

## OBS Studio settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off (no narration for raw capture) |
| Output | `screen.mp4`, H.264, CRF 18 |

## Game Bar (Windows 10/11)

Win + G → Record → toggle "Record in background" off → Win + Alt + R to start.

## What to record

1. **Scripting workspace** — paste blueprint.py, show the _fexp function and
   SHAPE_KEYS list clearly, then hit Run Script. Let the console print complete.
2. **Properties panel** — Object Data → Shape Keys — drag through each key
   value slider from 0 to 1 while watching the viewport morph.
3. **Material Preview** (Z key) — orbit the mesh at cube=1 and again at star=1
   so both profiles are visible.
4. **3D Viewport → Timeline** — run record.py and let the OpenGL render play.
5. **File output** — show the GLB file size in the OS file manager.

## Editing the raw capture into a tutorial clip

1. Import `screen.mp4` into Blender VSE (or DaVinci Resolve).
2. Cut to: intro code view (30 s) → shape key demo (30 s) → material preview (15 s) → render (15 s).
3. Add text lower-thirds with key terms: "signed power", "e1 = latitude",
   "e2 = longitude", "morph target".
4. Export at 1080p 30fps, place as
   `public/library/videos/scripting/python-numpy-superquadric-lame-curve-barr-signed-powers-shape-space-poi-head-webxr/screen.mp4`.

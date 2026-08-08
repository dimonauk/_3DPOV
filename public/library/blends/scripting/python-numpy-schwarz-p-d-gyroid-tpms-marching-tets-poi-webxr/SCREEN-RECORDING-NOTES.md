# Screen Recording Notes — TPMS Trio Blender Tutorial

**Output file:** `screen.mp4`  
**Software:** OBS Studio 30+ (Windows / macOS / Linux)

## OBS Configuration

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (voiceover added in post) |
| Output format | MP4 (H.264, CRF 18) |

## What to Capture

1. **Open Blender 5.1** → Scripting workspace.
2. Load `blueprint.py` via the text editor header ▸ *Open*.
3. Press **Run Script** — the console will print `Extracting schwarz_p…` etc.
4. Switch to the **3D Viewport** once the three objects appear.
5. In the **Viewport Shading** dropdown: set *Color* → *Vertex*, enable *Cavity*.
6. Orbit slowly around the trio using middle-mouse drag; zoom into the Gyroid centre.
7. Press **Numpad 1** for front view, **Numpad 7** for top view.
8. Open **Properties** ▸ *Object Data* ▸ *Color Attributes* to show the `GaussMap` layer.
9. Stop OBS after approximately 3–5 minutes of exploration.

## Post-Processing Checklist

- [ ] Trim silence at start/end (DaVinci Resolve or ffmpeg).
- [ ] Add title card: "Schwarz P, D & Gyroid — TPMS via Marching Tetrahedra · Blender 5.1".
- [ ] Overlay lower-third captions at each surface reveal:
      "Schwarz P · cos x + cos y + cos z = 0"
      "Schoen Gyroid · chiral, no mirror planes"
      "Schwarz D · diamond lattice"
- [ ] Colour-grade: slight cool lift in shadows to match Holoflow palette.
- [ ] Export: `screen.mp4`, H.264, CRF 22, 1920 × 1080, 30 fps.

## Upload

Place `screen.mp4` in:
`public/library/videos/scripting/python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr/screen.mp4`

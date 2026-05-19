# Screen-recording notes — Geometry Nodes Low-Poly Terrain

OBS / Xbox Game Bar instructions for capturing `screen.mp4` alongside
the pre-rendered `viewport.mp4`.

## Capture target

**Window source: Blender 5.1.** Before starting the capture, press
`Ctrl + Space` with the mouse in the 3D Viewport to maximise it. Do NOT
use Display Capture — taskbar notifications will appear in the recording.

## OBS settings

| Setting | Value |
|---|---|
| Base resolution | 1920 × 1080 |
| Output resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off — no mic, no desktop audio |
| Recording format | MKV during capture; remux to MP4 after (File → Remux) |
| Video encoder CRF | 18 (near-lossless for screen content) |

## What to record — step by step

Work at a pace where each step is legible. Pause between steps.
Do not rush the node-wiring section — it is the tutorial's core.

1. **File → New → General.** Delete the default cube (X → Delete).
2. **Add a Grid** — `Shift + A → Mesh → Grid`. Press F9, set subdivisions
   to 47 × 47, size to 10 m. The 10 m grid fills the viewport cleanly.
3. **Add Geometry Nodes modifier** — Properties (wrench icon) →
   Add Modifier → Generate → Geometry Nodes → click **New**.
4. **Split the viewport** — drag the top-right corner of the 3D Viewport
   left; set the new area to Geometry Node Editor.
5. **Delete the default pass-through link.** Click the connector and X it.
6. **Wire the nodes** in this order (add each with Shift + A):
   - `Geometry → Set Shade Smooth` — domain: Face, Shade Smooth: off
   - `Input → Position`
   - `Texture → Noise Texture` — Scale 3.2, Detail 4.0, Roughness 0.65
   - `Converter → Map Range` — To Max: 1.6
   - `Utilities → Combine XYZ`
   - `Geometry → Set Position`
   Wire: Group In → Set Shade Smooth → Set Position → Group Out.
   Wire: Position → Noise Vector; Noise Fac → Map Range Value;
         Map Range Result → Combine XYZ Z; Combine XYZ Vector → Set Position Offset.
7. **Show the viewport updating** — scrub the Scale slider on the Noise
   Texture node from 0 to 3.2 slowly. The terrain erupts in real time.
   Hold on the final value for 3 seconds.
8. **Export** — File → Export → glTF 2.0. Show the Draco and Y Up
   checkboxes being enabled. Click Export.

Total target recording length: **8–12 minutes** for the screen session.

## File destination

Place the remuxed recording at:

```
public/library/videos/geometry-nodes/low-poly-terrain/screen.mp4
```

Do not commit MP4 files to git — the videos folder holds only `.gitkeep`.

## Editing note

For a finished tutorial video, cut as:
- 0:00–0:15  : viewport.mp4 (terrain erupting, camera orbit)
- 0:15–8:30  : screen.mp4 (the full hand-built session)
- 8:30–8:45  : viewport.mp4 again (final orbit, fade to black)

Target upload resolution: 1920 × 1080, H.264, CRF 23, AAC stereo (or mute).

# Screen Recording Notes — Weaire-Phelan A15 Foam

**Output filename:** `screen.mp4`  
**Target folder:** `public/library/videos/scripting/python-numpy-scipy-weaire-phelan-a15-kelvin-conjecture-foam-bubble-cage-poi-webxr/`

---

## Software

| Tool | Settings |
|------|----------|
| OBS Studio (≥ 29) **or** Windows Game Bar (Win+G) | see below |
| Blender | 5.1, maximised on primary display |

---

## OBS Setup

1. **Scene → Add → Window Capture**  
   Source: `Blender` window  
   Crop to the 3D Viewport only (exclude header panels) if possible.

2. **Output settings**  
   - Format: MP4  
   - Encoder: x264 (software) or NVENC H.264 (hardware if available)  
   - Rate control: CBR  
   - Bitrate: 8000 Kbps  
   - Resolution: **1920 × 1080** (match Blender's render output or scale OBS canvas)  
   - Frame rate: **30 fps**  
   - Audio: **Disabled** (no audio track needed)

3. **Start recording before running the script.**

---

## Windows Game Bar

1. Focus the Blender window.  
2. Press **Win + G** → Record → **Start recording** (or Alt+R).  
3. Run `blueprint.py` in the Blender scripting workspace.  
4. After the mesh appears, manually demonstrate the viewport:

---

## What to show on screen (12–15 seconds total)

| Seconds | Action |
|---------|--------|
| 0 – 2 | Pan around the completed foam cage — use **Middle Mouse** orbit, show both amber (type-A) and cobalt (type-B) cells. |
| 2 – 5 | Switch to **Solid** viewport mode, switch on **Cavity** shading — shows pentagonal vs hexagonal faces. |
| 5 – 7 | Open the **Properties > Object Data > Shape Keys** panel; drag SK_Tight slider to 1.0, show bubbles contracting. Return to 0. |
| 7 – 9 | Drag SK_Expanded to 1.0, show bubbles inflating. Return to 0. |
| 9 – 11 | Switch to **Material Preview** viewport — shows amber/cobalt two-cell colouring. |
| 11 – 14 | Open **Scripting** workspace, scroll through `blueprint.py` to show the periodic_seeds() and cell_triangles() functions. |

---

## Tips

- Zoom level in Blender: numpad `.` to frame the foam after the script runs.  
- To toggle the wireframe cage overlay: Properties panel (N) → Object → Modifiers → Cage → toggle eye icon.  
- If the mesh appears inside-out in solid mode, press **Alt+N → Recalculate Outside** in Edit Mode.

---

## After recording

- Trim the clip to 12–15 seconds.  
- Export as `screen.mp4` using Handbrake or ffmpeg:

```bash
ffmpeg -i raw-capture.mp4 -vf "scale=1920:1080" -c:v libx264 -crf 22 -preset medium -an screen.mp4
```

- Place the file at the path shown at the top of this document.

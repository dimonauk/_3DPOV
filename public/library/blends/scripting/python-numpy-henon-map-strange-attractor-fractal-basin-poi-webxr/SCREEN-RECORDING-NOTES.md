# Screen Recording Notes — Hénon Map Strange Attractor

## OBS / Windows Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary track needed for viewport capture) |
| Output format | MP4 / H.264 |
| Output file | `screen.mp4` in this folder |

## What to record

1. **Run blueprint.py** (Text Editor → Run Script).  
   Let the basin grid compute (~0.5–2 s at GRID_N=200).  
   When the 3D Viewport populates, start recording.

2. **Viewport shading**: switch to **Material Preview** (Z → Material Preview)  
   so the plasma escape-time vertex colours are visible on the basin surface.

3. **Orbit the view** manually for 15–20 seconds:
   - Start top-down (Numpad 7) — the fractal basin looks like a Mandelbrot slice from above.
   - Tilt to 45° (middle-mouse drag) — the Z relief shows how the escape-time gradient rises away from the attractor.
   - Orbit to a side angle — the three NURBS poi trails glow cyan/pink/yellow in front of the purple-to-yellow basin.
   - Zoom into the centre — the dense attractor orbit fills the bottom of the basin bowl.

4. **Optional**: press `G` then `Z` and drag the basin mesh slightly down to separate it from the trails — this reveals the layered depth of the two geometries.

5. Stop recording. Save `screen.mp4` to this folder.

## Tips

- If the vertex colours appear grey, check **Object Properties → Viewport Display → Color** is set to **Vertex Color** (Blender 5.x calls this the active Colour Attribute).
- Bloom only shows in **Rendered** mode (Z → Rendered, engine = EEVEE Next). For Material Preview, the trails appear as flat emissive colours — that is fine for the screen recording; bloom is captured in record.py's render output.
- The basin mesh has 200 × 200 = 40,000 faces; expected viewport FPS ~25 fps on integrated graphics, ~60 fps on a discrete GPU.

# Screen Recording Notes — GP3 Line Art Toon Outline

**Software**: OBS Studio (any current release)  
**Codec**: H.264 | **Resolution**: 1920×1080 | **FPS**: 30 | **Audio**: off

## OBS setup

1. OBS → Sources → Add → **Window Capture** → select Blender
2. Output → Recording Path:
   `public/library/videos/grease-pencil/grease-pencil-3-line-art-toon-outline/`
3. Filename: `screen.mp4`
4. Video → Base Resolution: 1920×1080, FPS: 30
5. Enable **Rescale Output** only if your monitor is 4K and you want 1080p output

## Segments to record

Target total: **75–90 seconds**

| Segment | Duration | Action |
|---------|----------|--------|
| Script run | 10 s | Show `blueprint.py` loaded in Scripting workspace; click Run Script; show Info bar confirmation |
| Viewport reveal | 10 s | Switch to 3D Viewport — show faceted gem with black ink strokes and sapphire toon bands |
| Overlay toggle | 8 s | Click Overlays → untick Grease Pencil (strokes vanish) → re-tick (strokes return) |
| Modifier panel | 15 s | Select `gp_ink` → Properties → Modifier → show InkLines settings: edge types, crease angle, thickness |
| GP3 layer panel | 8 s | Properties → Object Data → Layers → show "Ink Outlines" and frame at 1 |
| Shader Editor | 12 s | Select gem → Shader Editor: walk Diffuse → Shader to RGB → CONSTANT ColourRamp → Emission chain |
| Rotation test | 12 s | Grab gem (G Z), rotate slowly — show CONTOUR strokes migrating, CREASE strokes staying fixed |
| Render preview | 10 s | F12 quick render — show ink + cel-shading combined in the Image Editor |

## Tips

- Set viewport shading to **Rendered** (EEVEE Next) before recording so cel bands are live
- Keep Blender maximised; avoid taskbar overlap
- If ink strokes disappear during recording, press `Ctrl+Shift+Q` in the viewport
- Stop OBS before closing Blender — OBS cannot detect app exit automatically
- If the crease threshold slider is visible in the modifier panel, adjust it live
  on camera to show how stroke density changes (good tutorial moment)

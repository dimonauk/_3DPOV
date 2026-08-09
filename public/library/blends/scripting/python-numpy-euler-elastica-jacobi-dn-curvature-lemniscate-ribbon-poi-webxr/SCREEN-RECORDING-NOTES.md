# Screen Recording Notes — Euler Elastica Ribbon Poi

## For OBS Studio (recommended) or Windows Game Bar

### Window source
- **Application**: Blender 5.1 (full window)
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: OFF (no microphone capture needed)

### Blender workspace setup before recording
1. Open `elastica_poi.blend`
2. **Viewport shading → Vertex Colours** (Solid mode, Colour = Vertex)
3. Set **Timeline** end frame to 360, frame rate to 30 fps
4. Maximise the 3-D viewport (`Numpad 5` for ortho → `Numpad 0` for camera view)
5. Set camera view: press `Numpad 0` — should show the oval elastica ribbon centred

### What to record

| Segment | Frames | What to show |
|---------|--------|--------------|
| A | 1–90 | Viewport play — slow Z rotation reveals the flat oval ribbon shape |
| B | 91–270 | Shape key animation — watch the ribbon morph from circle → exact oval → elongated cusp |
| C | 271–330 | Camera orbit shows the gentle z-lift, ribbon has real 3-D depth |
| D | 331–360 | Emission glow pulse on the completed ribbon |

### OBS settings
```
Output mode: Advanced
Recording format: MP4 (H.264)
Rate control: CRF 18
Keyframe interval: 2 s
Audio tracks: NONE
File name: screen.mp4
```

### After recording
- Drop `screen.mp4` into:
  `public/library/videos/scripting/python-numpy-euler-elastica-jacobi-dn-curvature-lemniscate-ribbon-poi-webxr/`
- The `viewport.mp4` is generated automatically by `record.py` (run from terminal or Blender Scripting tab)

### Tips
- If the ribbon appears black: ensure **Workbench** engine is active, shading → Colour → Vertex
- If shape key morphing looks jerky: in the Action editor, set all interpolation to **BEZIER**
- The z-lift is subtle (8 mm) — best visible in the 3/4 orbit view (frames 271–330)
- Ambient occlusion OFF for clean vertex-colour look

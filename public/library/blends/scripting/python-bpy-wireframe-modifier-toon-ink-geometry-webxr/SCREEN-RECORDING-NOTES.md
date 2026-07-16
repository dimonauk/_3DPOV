# Screen Recording Notes — WireframeModifier Toon Ink

**Target file:** `public/library/videos/scripting/python-bpy-wireframe-modifier-toon-ink-geometry-webxr/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Window source | Blender (not display capture) |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off |
| Format | MP4 / H.264 |
| Bitrate | 8 Mbps |

## What to record

1. **Open Blender 5.1** — splash screen dismisses automatically or press Escape.
2. **Open the Text Editor** (top-right area type picker → Text Editor).
3. **Paste `blueprint.py`** and press Run Script (▶).  
   - Two objects appear in viewport: `hf_fill` (cobalt icosphere) and `hf_wire` (black lines only).
4. **Select `hf_wire` in Outliner** — show Properties ▸ Modifier Properties to see applied WireframeModifier (already consumed, modifier stack is empty post-apply).
5. **In Viewport Shading** switch to Rendered mode (Numpad-0 → Z → R or top-right sphere icon).
6. **Orbit the viewport** slowly so the audience sees both fill and wire from multiple angles.
7. **Select `hf_fill`, go to Material Properties** — point to the two material slots (slot 0 = hf_fill blue, slot 1 = hf_wire dark).
8. **Open a new Text Editor tab**, paste and run `record.py` — viewport renders `viewport.mp4`.

## Take length

3–4 minutes for a complete walkthrough. Keep the viewport visible at all times.
Cut to code close-ups only when explaining the constants block.

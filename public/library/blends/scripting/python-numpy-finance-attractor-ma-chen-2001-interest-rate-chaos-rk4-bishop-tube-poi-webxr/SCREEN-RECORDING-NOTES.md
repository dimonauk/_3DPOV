# Screen Recording Notes — Finance Attractor
**Target file:** `public/library/videos/scripting/python-numpy-finance-attractor-ma-chen-2001-interest-rate-chaos-rk4-bishop-tube-poi-webxr/screen.mp4`

## OBS / Game Bar settings
| Setting | Value |
|---------|-------|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (silent technical demo) |
| Encoder | H.264 (hardware preferred) |
| Output format | MP4 |

## What to record (~90 seconds)

1. **Open Blender 5.1.** New → General.  
2. **Open the Text Editor** (shift the area type).  Paste `blueprint.py` and press **Run Script**.  Wait ~25–40 s for the tube to appear in the viewport.  
3. **Inspect the mesh.** Tab into Edit Mode briefly so the viewer can see the tube topology, then Tab back.  
4. **Open the Shape Key panel** (Properties → Object Data → Shape Keys).  Drag the `SK_Thrift` value from 0 → 1 while watching the viewport.  Return to 0.  Repeat for `SK_Rigid`.  
5. **Open the Attribute panel** (Properties → Object Data → Color Attributes).  Click the `Finance_Speed` attribute and switch to the viewport overlay showing colour.  
6. **Orbit** the viewport freely — cobalt-slow, amber-fast regions should be visible on the looping tube.  
7. End the recording.

## Colour-attribute overlay
In Viewport Overlay (the ☰ icon at top-right of the 3D viewport):
- Enable **Geometry → Vertex Colors** (Attributes)
- Or switch the viewport shading to **Material Preview** to see the Principled BSDF + emission.

## glTF export hint (for screen.mp4 b-roll)
File → Export → glTF 2.0  
Options: Draco compression level 6, WebP textures, export morph targets, export vertex colors.

## Tip for the edit
Cut at frame where shape-key change is most dramatic (usually the `SK_Rigid` transition — the price-index axis expands noticeably).

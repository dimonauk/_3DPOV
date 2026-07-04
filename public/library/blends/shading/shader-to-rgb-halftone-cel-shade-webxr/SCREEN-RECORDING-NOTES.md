# Screen Recording Notes — Shader to RGB Halftone Cel-Shade

**Target file:** `public/library/videos/shading/shader-to-rgb-halftone-cel-shade-webxr/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Capture source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no system sound) |
| Output format | MP4 / H.264, CRF 18 |

## Shot list

1. **Open blend file** — show the 3D viewport with the panel and halftone visible
   in Solid mode briefly, then switch to Material Preview (Z).

2. **Shader Editor** — split viewport, open Shader Editor on right.
   Pan to show the full node graph.  Hover over `ShaderToRGB` and read the
   tooltip aloud (or use a screen annotation overlay to label it).

3. **Node walk** — hover each group of nodes while narrating:
   - `Principled BSDF → Shader to RGB` — capture EEVEE lighting
   - `ColourRamp (CONSTANT)` — posterise to two hard bands
   - `Mapping (45°) → VectorMath SCALE` — screen frequency and angle
   - `Frac / Centre / Length` chain — build the dot distance field
   - `Mix node` — amplitude-modulate the dot radius by toon value
   - `LESS_THAN` — threshold to binary dot mask

4. **Sun lamp rotation** — in Viewport, select the Sun lamp.
   In the Properties panel (Item tab) manually drag the X rotation from 80° to 15°.
   The halftone dots should visibly grow as the shadow band expands.
   This is the core money shot — record 10–15 seconds of slow rotation.

5. **ColourRamp edit** — shift the band threshold stop left and right.
   Show how the shadow/lit split point moves the boundary between heavy and
   light halftone.

6. **Screen angle demonstration** — change Mapping node Z Rotation from 45° to
   0°.  Show the moiré pattern that appears when the grid aligns with the mesh
   UV.  Return to 45° to fix it.  Good teaching moment.

7. **Material slot switch** — select slot 1 (`HalftoneCel_Baked`) to show the
   baked emission texture result.  Compare side-by-side with slot 0.

8. **GLB export** — File → Export → glTF 2.0, confirm settings (WebP, Apply
   Modifiers).  Show the file size.

## Post-processing

Trim to ≤ 8 minutes.  No colour grade needed — the halftone is the subject.
Add chapter markers at the ColourRamp step and the moiré demonstration.

# Screen Recording Notes — Triplanar Projection

**Target file:** `public/library/videos/shading/shader-triplanar-projection-no-uv-hard-surface-webxr/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| Quality | CRF 18 |

## What to capture

1. **Open blueprint.py** in Blender's Text Editor → Run Script.  
   Show the System Console confirming `[holoflow] baked → output/triplanar_baked.png`
   and `[holoflow] GLB → output/triplanar_boulder.glb`.

2. **Shader Editor inspection** (approx. 45 s):  
   - Select `boulder`, open Shader Editor.  
   - Pan to the Texture Coordinate node. Hover over the **Object** output socket.  
   - Pan right to the three Noise Texture nodes — show how they receive
     (X,Y), (Y,Z) and (X,Z) input pairs.  
   - Pan to the Normal weight chain: `Geometry → SeparateXYZ → abs → Power → sum → Divide`.  
   - Pan to the final MixRGB cascade (ADD mode).

3. **Viewport orbit** (approx. 30 s):  
   - Switch to **Rendered** shading (EEVEE Next).  
   - Slowly orbit the boulder 360°.  
   - Pause at the top, sides and underside to confirm zero visible seams.

4. **SHARPNESS live edit** (approx. 20 s):  
   - With the Shader Editor open, select any of the three `Power` nodes.  
   - Change `Exponent` from **1.0** → **4.0** → **8.0** and show the seam
     tightening in real-time in the split viewport.

5. **UV texture inspect** (approx. 15 s):  
   - Open UV Editor alongside Shader Editor.  
   - Select the `BakeTarget` Image Texture node to show the baked result.

## Duration target

Aim for **2–3 minutes total**. Trim dead air in the video editor.

## File name

Save as `screen.mp4` in the videos folder above.

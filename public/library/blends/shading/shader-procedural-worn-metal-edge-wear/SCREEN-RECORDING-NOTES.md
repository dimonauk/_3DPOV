# Screen Recording Notes — Procedural Worn Metal

## Setup

**Software:** OBS Studio (free) or Windows Game Bar (`Win + G`)  
**Source:** Window Capture → select the Blender window  
**Resolution:** 1920 × 1080  
**Frame rate:** 30 fps  
**Audio:** Off (no mic needed)

## What to record

1. **Open Blender 5.1.** Close the splash screen.
2. Open the Text Editor (top menu: Scripting workspace).
3. Paste `blueprint.py` into a new text block. Click **Run Script**.
4. Switch to the **3D Viewport**, set shading to **Material Preview** (EEVEE).
5. **Slowly orbit the camera** (middle-mouse drag) around the Suzanne head.
   - Show the tight eye-socket creases darkening as they rotate into frame.
   - Show the flat forehead staying bright and mirror-like.
   - Pause at a three-quarter view where both regions are visible simultaneously.
6. Switch to **Rendered** shading mode to show the full EEVEE result.
7. Open the **Shader Editor** (drag a viewport edge or use the workspace).
8. Walk through the node graph from left to right:
   - Bevel node → VectorMath DOT → Math (1−x) → ColorRamp Edge
   - TexNoise → ColorRamp Noise
   - Math MAX combining both signals
   - Mix Shader blending Clean and Worn PBSDF
9. Demonstrate **parameter adjustment**: select the ColorRamp Edge node,
   drag the left stop rightward to tighten wear to only the sharpest edges.
10. Press `F12` for a single-frame render.  Show the render output.

## File naming

Save recordings as:

```
public/library/videos/shading/shader-procedural-worn-metal-edge-wear/screen.mp4
```

Keep `blueprint.py` and `record.py` open beside the OBS window so the viewer
can see the code side-by-side with the result.

## Duration target

8–12 minutes total.  No faster — the node graph walkthrough is the most
valuable part and viewers pause and rewind it.

# Screen-Recording Notes — Joukowski Conformal Aerofoil

Target file: `screen.mp4`  
Resolution: 1920×1080 · 30 fps · no audio

## OBS Setup

| Field | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920×1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output | MP4 (H.264 High, CRF 20) |

## Suggested Recording Script (~4 min)

1. **Open Blender** (1 min)
   - New → General project. Set Python Dev workspace.
   - Scripting tab. Paste `blueprint.py`.
   - Briefly scroll through code: pause on `joukowski()`, `kutta_gamma()`,
     and `build_wing()` so viewers see the key functions.

2. **Run the script** (30 s)
   - Click Run Script. Blender creates the wing mesh + streamline curves.
   - Switch to 3D Viewport. Orbit to show the wing from front, then side,
     then quarter view to reveal both aerofoil profile and span.

3. **Inspect objects** (1 min)
   - Select `hf_joukowski_wing` → show vertex count in status bar.
   - Select `hf_joukowski_streams` → show it is a Curve object (bevel tubes).
   - Toggle Eevee renderer; set Background = `#050505`; orbit slowly.

4. **Run record.py** (30 s)
   - Switch back to Scripting tab. Paste `record.py`. Click Run Script.
   - Switch to Timeline; press Space to preview the camera dolly animation.

5. **Export and close** (30 s)
   - Briefly show the exported `hf_joukowski_aerofoil.glb` in the file system.
   - Mention loading it in Three.js / `model-viewer` for WebXR.

## Tips
- Toggle `Viewport Shading → Material Preview` before recording to show
  the emissive gold wing and cyan streamline tubes at their best.
- Zoom into the trailing-edge cusp region to show the Kutta condition
  visually (streamlines converging to a point).
- Use Numpad `1` (front), `3` (right), `7` (top) to show the three
  standard views before orbiting freely.

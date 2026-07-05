# Screen Recording Notes — Compositor Nodetree Pipeline

**Target file:** `public/library/videos/scripting/python-compositor-nodetree-render-passes-eevee-glb-bake/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Capture source | Window — Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary) |
| Output format | MP4 (H.264, CRF 18) |

## What to record

1. **Open Blender 5.1** → New General file.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` → click **Run Script**.
4. Switch to the **Compositor** workspace.  Show the full node graph wired on screen — pan so all nodes are visible.
5. Switch to **Layout** workspace.  Select the subject sphere. Press **Z → Rendered** to see the viewport compositor active (emission glow + barrel distortion visible).
6. Press **Spacebar** to play the keyframe animation (sphere spins, glow sweeps).
7. Switch to the **Compositor** workspace again.  Click the **Image** tab in the header to show the rendered result.  Drag the Viewer node backdrop to show the graded beauty.
8. Open a **Properties → Render** panel — point out `compositor_device = GPU` in the Output section.
9. Press **F12** to render one frame.  Show the multilayer EXR write confirmation in the Info bar.

## Timing guide

| Segment | Duration |
|---|---|
| Run script, graph appears | 0:00 – 0:20 |
| Compositor node walkthrough | 0:20 – 1:00 |
| Viewport Rendered + spin animation | 1:00 – 1:30 |
| F12 render + EXR output log | 1:30 – 2:00 |

Total target: **~2 minutes**.

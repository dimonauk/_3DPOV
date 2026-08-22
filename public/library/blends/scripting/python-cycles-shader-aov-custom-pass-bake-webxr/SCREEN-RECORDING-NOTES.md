# Screen Recording Notes — Cycles Shader AOV Tutorial

**OBS / Xbox Game Bar instructions for screen.mp4**

## Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no microphone) |
| Output | MP4, H.264, CRF 23 |

## What to capture (sequence)

1. **Open Blender 5.1** — start recording from the splash screen.
2. **Scripting workspace** → open `blueprint.py` → review the parameter block at the top (scroll slowly so viewers read `BAKE_RES`, `RENDER_SAMPLES`, `AOV_HEIGHT_NAME`).
3. **Run blueprint.py** (Alt+P) — let the Cycles single-sample render complete, then the emit bake.  Keep the Info header visible so viewers see the operator feedback.
4. **Properties panel → Render → Output → View Layer → Passes → AOVs** — expand the AOV list to show HeightGradient (Color) and NoiseMask (Value) defined there.
5. **Compositor workspace** — show the RenderLayers node with its AOV output sockets wired to the File Output node.
6. **Material node tree** — scrub through to show the two `ShaderNodeOutputAOV` nodes and how their Name field matches the ViewLayer AOV list.
7. **Image Editor** — open `curvature_bake` from the dropdown to show the baked WebP pointiness map.
8. **File Browser** — navigate to the .blend directory and show `aov_passes_0001.exr` was written.
9. **Run record.py** (Alt+P) — let the turntable render complete.
10. **Stop recording.**

## Duration target

7–12 minutes.  Pause before each node tree section so viewers can read the connections.

## Post

Trim the start (loading) and any idle waits.  No colour grading needed — the AOV data texture is the hero visual.

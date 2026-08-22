# Screen-Recording Notes — Deform Curves on Surface
**For OBS Studio / Windows Game Bar · 1920×1080 · 30 fps · audio off**

## OBS Settings

- **Video Capture Device:** Blender application window (Window Capture — not Display Capture)
- **Base Resolution:** 1920×1080
- **Output Resolution:** 1920×1080
- **FPS:** 30
- **Audio:** all tracks disabled — no commentary for the raw viewport capture
- **File:** `screen.mp4`, H.264, CRF 18

## Suggested recording workflow

1. Run `blueprint.py` in Blender's scripting workspace so all objects are built.
2. Switch to the **3D Viewport**. Set shading to **Material Preview** (Z → Material Preview).
3. Select `HF_GuideHair` in the Outliner. In the Properties panel → Modifier Properties, confirm you see the `DeformCurvesOnSurface` modifier listed.
4. Set frame to **1** (rest pose). The hair should be standing in the rest-pose radial pattern.
5. Press **Space** to play. Watch frames 1–30: the head bone tilts forward and the hair strands follow the scalp surface — this is the key demonstration.
6. Pause at frame **30**. Slowly orbit the viewport with Middle Mouse to show the leaning hair from front, side, and rear (≈ 20 seconds of orbiting).
7. Press **Space** to resume. Watch frames 31–60: the head returns to rest and the hair follows back.
8. Stop recording at frame 60 or let it run to 90 for the orbit section.
9. Trim to ≈ 60–75 seconds in the VSE or any editor.

## What to emphasise visually

- **Frame 1 vs Frame 30** comparison: cut or jump-cut to show rest pose and tilted pose side by side.
- **Modifier panel** (right strip): show the `DeformCurvesOnSurface` modifier name and that it has no parameters — the binding lives entirely in the HairCurves data properties (shown in Object Data Properties → Surface Binding).
- **Object Data Properties** for `HF_GuideHair`: show `Surface = HF_Scalp` and `Surface UV Map = UVMap` — these two fields are the entire bind step.
- The fact that the hair follows **without any keyframes on the curves object** — all motion comes from the armature alone.

## Thumbnail frame

Frame **28** (just before peak tilt) gives the most readable composition: the
hair leaning distinctly to one side against a straight scalp dome. Use EEVEE
Material Preview or a quick F12 render for the thumbnail.

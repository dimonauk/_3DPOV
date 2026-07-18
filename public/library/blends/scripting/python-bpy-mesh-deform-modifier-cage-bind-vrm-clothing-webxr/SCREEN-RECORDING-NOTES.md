# Screen Recording Notes — MeshDeform Cage Bind VRM Clothing

**Target file:** `public/library/videos/scripting/python-bpy-mesh-deform-modifier-cage-bind-vrm-clothing-webxr/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Encoder | x264 / NVENC H.264 |
| Output format | MP4 |

## What to Capture

1. **Open Blender 5.1.** New file → Scripting workspace.
2. **Load `blueprint.py`** → Run Script. Let it complete (~10–20 s for binding).
3. **Switch to Layout workspace.** Show the 3D viewport in Solid mode.
4. **Enable cage wireframe overlay** (cage object is already `WIRE` display type).
5. **Scrub the timeline** from frame 1 to 60 slowly — show the waist pinch
   deforming both the cage wire and the cloth mesh together.
6. **Zoom into the waist at frame 30** — show the cloth cinching cleanly with
   no intersections or pinching artefacts.
7. **Open the modifier Properties panel** for the cloth object — show the
   MeshDeform modifier, `is_bound = True`, precision = 5.
8. **Switch to Rendered / Material Preview shading** at frame 30 — show the
   burnt-orange tunic pinched at the waist.
9. **Open `record.py`** → Run Script to render `viewport.mp4`.

## Narration Beats

- "The cage is a closed torso capsule — any mesh topology works, unlike a Lattice."
- "Bind happens once; afterwards the cage is free to animate, pose, or shape-key."
- "Every target vertex outside the cage gets zero weight — the cage MUST enclose the cloth at bind time."
- "At frame 30 the shape key drives the waist to 65% of its original radius — the cloth follows without any skinning."
- "Before GLB export: apply the modifier to bake the deformation; the cage stays in the .blend but is excluded from the export."

## Duration

Target: **45–60 seconds** at 30 fps.

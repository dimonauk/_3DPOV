# Screen Recording Notes — VRM Auto-Key Capture Pipeline

**Target file**: `public/library/videos/scripting/python-bpy-keying-set-vrm-auto-key-capture/screen.mp4`

## OBS Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic) |
| Output format | MP4 / H.264 |
| Bitrate | 6 000 kbps |

## Shot List

### Shot 1 — Open `keying_set_vrm_capture.blend` (10 s)
Run `blueprint.py` to generate the file, then open it in Blender.  
Show the **Outliner** — armature object, vrm_head mesh, both selected.  
Expand the **Scene Properties → Keying Sets** panel to show
"Holoflow VRM Capture" with its path count listed.

### Shot 2 — Inspect paths in the Scripting workspace (20 s)
Open the **Scripting** workspace.  In the Python Console type:
```python
ks = bpy.context.scene.keying_sets["Holoflow VRM Capture"]
[(ksp.data_path, ksp.array_index) for ksp in ks.paths]
```
Scroll through the output to show bone paths and shape-key paths side by side.

### Shot 3 — Pose the armature and inspect the shape keys (15 s)
In **Object Mode** select `vrm_proxy_arm`, switch to **Pose Mode**.  
Select the Head bone, rotate it on X (nod).  
In the **Properties → Object Data → Shape Keys** panel on the mesh, drag
"happy" slider to 0.8 to show expression + bone pose co-existing.

### Shot 4 — Set Active Keying Set and press I (15 s)
In the **Timeline** header, click the Active Keying Set dropdown and choose
"Holoflow VRM Capture".  Hover over the 3D Viewport and press **I**.  
Show the keyframe diamonds appearing in the **Timeline** on every channel
simultaneously — bone channels and shape key channels in one press.

### Shot 5 — Scrub the baked animation (20 s)
Play back the existing animation (Space).  Show the Head bone nodding while
the happy + blink expressions animate.  Open the **Graph Editor** briefly to
show all channels grouped by bone name and expression name as set by
`group_method='NAMED'`.

### Shot 6 — GLB in Blender's glTF viewer (15 s)
Open the **Viewport** and drag-drop `keying_set_vrm_capture.glb` into it
(Blender 5.1 drag-drop import).  Press Space to play — confirm the animation
plays, confirm shape key morphs are visible in the mesh.

## Editing notes

Trim dead time between shots.  Add a lower-third text caption for each shot
title.  No voiceover needed — the on-screen actions tell the story.
Final cut: approximately 95 seconds at 30 fps.

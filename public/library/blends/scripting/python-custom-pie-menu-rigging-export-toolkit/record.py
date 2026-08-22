"""
record.py — Viewport animation render for Holoflow Pie Menu demo
================================================================
Outputs 90 PNG frames (3 s at 30 fps) to:
  public/library/videos/scripting/
    python-custom-pie-menu-rigging-export-toolkit/frames/

Run (headless, from the blend's directory):
  blender --background --python record.py

After render, combine frames with ffmpeg:
  ffmpeg -framerate 30 \
    -i frames/frame_%04d.png \
    -c:v libx264 -pix_fmt yuv420p \
    viewport.mp4
"""
import bpy
import math
import pathlib

# ── output paths ─────────────────────────────────────────────────────────────
SCRIPT_DIR  = pathlib.Path(__file__).parent
FRAMES_DIR  = (SCRIPT_DIR.parents[3]
               / 'videos'
               / 'scripting'
               / 'python-custom-pie-menu-rigging-export-toolkit'
               / 'frames')
FRAMES_DIR.mkdir(parents=True, exist_ok=True)

# ── render settings ───────────────────────────────────────────────────────────
FRAME_COUNT = 90   # 3 s at 30 fps
FPS         = 30

scn = bpy.context.scene
scn.frame_start = 1
scn.frame_end   = FRAME_COUNT
scn.render.fps  = FPS

# Workbench: fast, no GPU ray-tracing required, cavity shows prop edges clearly
scn.render.engine                            = 'BLENDER_WORKBENCH'
scn.display.shading.light                    = 'STUDIO'
scn.display.shading.show_object_outline      = True
scn.display.shading.color_type               = 'OBJECT'

scn.render.resolution_x                     = 1280
scn.render.resolution_y                     = 720
scn.render.image_settings.file_format        = 'PNG'
scn.render.filepath                          = str(FRAMES_DIR / 'frame_####')

# ── colour-code the three props ───────────────────────────────────────────────
PROP_COLOURS = {
    'Prop_Panel_A': (0.18, 0.78, 0.40, 1.0),   # green — tagged
    'Prop_Panel_B': (0.18, 0.55, 0.90, 1.0),   # blue  — tagged
    'Prop_Untagged': (0.72, 0.28, 0.28, 1.0),  # red   — untagged
}
for name, rgba in PROP_COLOURS.items():
    obj = bpy.data.objects.get(name)
    if obj:
        obj.color = rgba

# ── camera orbit via parent empty ─────────────────────────────────────────────
# Orbit 90° (π/2 rad) over the full 90 frames so the viewer sees all three props.
cam = scn.camera
if cam:
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    pivot      = bpy.context.active_object
    pivot.name = 'REC_CamPivot'

    cam.parent      = pivot
    cam.parent_type = 'OBJECT'

    pivot.rotation_euler = (0, 0, 0)
    pivot.keyframe_insert('rotation_euler', frame=1)
    pivot.rotation_euler.z = math.pi / 2
    pivot.keyframe_insert('rotation_euler', frame=FRAME_COUNT)

    for fc in pivot.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'

# ── animated highlight: cycle object outline colours ─────────────────────────
# Frame 1-30:  Panel_A glows bright (hover state)
# Frame 31-60: Panel_B glows bright
# Frame 61-90: Untagged glows bright
HIGHLIGHT_COLOUR = (1.0, 0.95, 0.4, 1.0)   # warm yellow = "active"
DIM_FACTOR       = 0.35

for obj_name, base_col in PROP_COLOURS.items():
    obj = bpy.data.objects.get(obj_name)
    if not obj:
        continue

    dim = tuple(c * DIM_FACTOR for c in base_col[:3]) + (1.0,)

    highlight_start = {
        'Prop_Panel_A':  1,
        'Prop_Panel_B':  31,
        'Prop_Untagged': 61,
    }[obj_name]

    # dim at frame 1
    obj.color = dim
    obj.keyframe_insert('color', frame=1)
    # brighten at highlight window start
    obj.color = HIGHLIGHT_COLOUR
    obj.keyframe_insert('color', frame=highlight_start)
    obj.keyframe_insert('color', frame=highlight_start + 28)
    # dim again
    obj.color = dim
    obj.keyframe_insert('color', frame=highlight_start + 30)

# ── render ────────────────────────────────────────────────────────────────────
bpy.ops.render.render(animation=True, write_still=False)

print(f'\nRecord complete: {FRAME_COUNT} frames in {FRAMES_DIR}')
print('Next step — combine with ffmpeg:')
print(f'  ffmpeg -framerate {FPS} -i "{FRAMES_DIR}/frame_%04d.png"'
      ' -c:v libx264 -pix_fmt yuv420p viewport.mp4')

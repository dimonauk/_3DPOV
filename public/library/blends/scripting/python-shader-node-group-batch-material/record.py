# ============================================================
# Holoflow Studio — record.py: Shader Node Group Scene
# Blender 5.1 · CC0 1.0 Universal
# ============================================================
# Viewport animation for screen recording.
# Run AFTER blueprint.py has built the scene and materials.
#
# Animation: camera orbits the 3×3 grid of cel-shaded objects.
# At frame 60, Toon Steps inside the shared node group bumps
# from 3 → 6 — all 9 materials switch band count simultaneously.
# This 10-second shot illustrates the propagation in one take.
#
# Output: public/library/videos/scripting/
#   python-shader-node-group-batch-material/viewport.mp4
# ============================================================

import bpy
import math

FRAME_START  = 1
FRAME_END    = 300          # 10 s at 30 fps
OUTPUT_PATH  = "//../../videos/scripting/" \
               "python-shader-node-group-batch-material/viewport"
GROUP_NAME   = "HS_FacetCelShader"

# ── Camera ────────────────────────────────────────────────────
cam_data = bpy.data.cameras.get('Camera') or bpy.data.cameras.new('Camera')
cam_obj  = bpy.data.objects.get('Camera')
if cam_obj is None:
    cam_obj = bpy.data.objects.new('Camera', cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)

bpy.context.scene.camera = cam_obj
cam_obj.location       = (0.0, -14.0, 10.0)
cam_obj.rotation_euler = (math.radians(52), 0.0, 0.0)

# ── Key light ─────────────────────────────────────────────────
sun_data = bpy.data.lights.get('Sun') or bpy.data.lights.new('Sun', 'SUN')
sun_obj  = bpy.data.objects.get('Sun')
if sun_obj is None:
    sun_obj = bpy.data.objects.new('Sun', sun_data)
    bpy.context.scene.collection.objects.link(sun_obj)
sun_obj.location       = (6.0, -4.0, 12.0)
sun_obj.rotation_euler = (math.radians(40), 0.0, math.radians(50))
sun_data.energy        = 5.0

# ── Animate: whole scene rotates slowly ───────────────────────
# Using a single Empty parent makes the group rotation trivial.
empty = bpy.data.objects.get('SceneRoot')
if empty is None:
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    empty = bpy.context.active_object
    empty.name = 'SceneRoot'

for obj in bpy.data.objects:
    if obj.type == 'MESH' and obj.parent is None:
        obj.parent = empty

empty.rotation_euler = (0.0, 0.0, 0.0)
empty.keyframe_insert('rotation_euler', frame=FRAME_START)
empty.rotation_euler = (0.0, 0.0, math.radians(360))
empty.keyframe_insert('rotation_euler', frame=FRAME_END)

# Make the rotation linear (constant angular speed)
for fc in (empty.animation_data.action.fcurves if empty.animation_data else []):
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── Animate Toon Steps inside shared group (frame 90 → 180) ───
# Find the shared group data-block.
group = bpy.data.node_groups.get(GROUP_NAME)
if group:
    # Find the Multiply math node that receives Toon Steps.
    # We keyframe the group interface socket's default_value.
    # Because all ShaderNodeGroup nodes share this data-block,
    # the animated default is visible across all 9 materials.
    for item in group.interface.items_tree:
        if getattr(item, 'name', '') == 'Toon Steps':
            item.default_value = 3.0
            item.keyframe_insert('default_value', frame=1)
            item.keyframe_insert('default_value', frame=89)
            item.default_value = 6.0
            item.keyframe_insert('default_value', frame=90)
            item.default_value = 6.0
            item.keyframe_insert('default_value', frame=200)
            item.default_value = 3.0
            item.keyframe_insert('default_value', frame=201)
            break

# ── Render settings ───────────────────────────────────────────
scn = bpy.context.scene
scn.frame_start = FRAME_START
scn.frame_end   = FRAME_END

scn.render.engine       = 'BLENDER_EEVEE_NEXT'
scn.render.resolution_x = 1280
scn.render.resolution_y = 720
scn.render.fps          = 30

scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format = 'MPEG4'
scn.render.ffmpeg.codec  = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scn.render.filepath = OUTPUT_PATH

print("[HS] record.py configured. Run Render → Render Animation (Ctrl+F12).")
print(f"[HS] Output → {OUTPUT_PATH}.mp4")

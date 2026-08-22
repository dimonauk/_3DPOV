"""
record.py — viewport animation for Villarceau Circles poi head.
Blender 5.1 · Python 3.12

Run AFTER blueprint.py has built the scene.  Produces a 7-second
(210-frame, 30 fps) EEVEE render to viewport.mp4 showing:
  0–60   f  Camera orbits the full poi head from equator height (bloom glow)
 60–120  f  Morph SK_Slender (r=0.06) → SK_Horn (r=0.20): tilt angle sweep
120–180  f  Morph back to Basis; camera pulls up to top-down view
180–210  f  Hold top-down + slow rotation — see all 16 rings at once
"""

import math
import bpy

# ---------------------------------------------------------------------------
# Find poi object (must already exist from blueprint.py)
# ---------------------------------------------------------------------------
OBJ_NAME   = "hf_villarceau_poi"
OUT_PATH   = "//viewport.mp4"
TOTAL_F    = 210
FPS        = 30

ob = bpy.data.objects.get(OBJ_NAME)
if ob is None:
    raise RuntimeError("Run blueprint.py first — object not found.")

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_F
scene.render.fps  = FPS
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format   = "MPEG4"
scene.render.ffmpeg.codec    = "H264"
scene.render.ffmpeg.audio_codec = "NONE"
scene.render.filepath        = OUT_PATH
scene.render.resolution_x    = 1920
scene.render.resolution_y    = 1080
scene.render.engine          = "BLENDER_EEVEE_NEXT"
scene.eevee.bloom_threshold  = 0.08
scene.eevee.use_bloom        = True

# ---------------------------------------------------------------------------
# Lighting — single area light from above
# ---------------------------------------------------------------------------
bpy.ops.object.light_add(type="AREA", location=(0, 0, 1.5))
lamp = bpy.context.object
lamp.data.energy = 200
lamp.data.size   = 1.5

# World background — near-black
bpy.context.scene.world.use_nodes = True
bg = bpy.context.scene.world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value    = (0.01, 0.01, 0.015, 1.0)
bg.inputs["Strength"].default_value = 0.5

# ---------------------------------------------------------------------------
# Camera rig — empty at origin, camera parented to it
# ---------------------------------------------------------------------------
bpy.ops.object.empty_add(location=(0.0, 0.0, 0.0))
rig = bpy.context.object
rig.name = "CamRig"

bpy.ops.object.camera_add(location=(0.0, -0.80, 0.10))
cam_ob = bpy.context.object
cam_ob.name = "RecordCam"
cam_ob.data.lens = 85
cam_ob.parent = rig

# Track-To constraint — camera looks at rig centre
tt = cam_ob.constraints.new("TRACK_TO")
tt.target    = rig
tt.track_axis  = "TRACK_NEGATIVE_Z"
tt.up_axis     = "UP_Y"


def set_key(obj, attr_path, frame, value):
    """Set obj attribute and insert a keyframe on it."""
    parts = attr_path.split(".")
    target = obj
    for p in parts[:-1]:
        target = getattr(target, p)
    setattr(target, parts[-1], value)
    target.keyframe_insert(parts[-1], frame=frame)


# ---------------------------------------------------------------------------
# Camera orbit animation (rig rotates around Z-axis)
# ---------------------------------------------------------------------------
# Frames 1–60: full 360° equatorial orbit
rig.rotation_euler = (0, 0, 0)
rig.keyframe_insert("rotation_euler", frame=1)
rig.rotation_euler = (0, 0, 2 * math.pi)
rig.keyframe_insert("rotation_euler", frame=60)

# Frames 60–120: hold orientation while shape keys morph
rig.rotation_euler = (0, 0, 2 * math.pi)
rig.keyframe_insert("rotation_euler", frame=120)

# Frames 120–180: camera rises to top (rig tilts -35°, thenhold top-down)
rig.rotation_euler = (0, 0, 2 * math.pi)
rig.keyframe_insert("rotation_euler", frame=120)

# Camera rises by adjusting its local Z offset
cam_ob.location = (0.0, -0.80, 0.10)
cam_ob.keyframe_insert("location", frame=1)
cam_ob.location = (0.0, -0.45, 0.70)
cam_ob.keyframe_insert("location", frame=180)
cam_ob.location = (0.0, -0.20, 0.85)
cam_ob.keyframe_insert("location", frame=210)

# Linear interpolation for orbit
for fc in rig.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"

# ---------------------------------------------------------------------------
# Shape key morph animation
# ---------------------------------------------------------------------------
if ob.data.shape_keys:
    kb = ob.data.shape_keys.key_blocks

    # All shape key values start at 0
    for block in kb:
        block.value = 0.0
        block.keyframe_insert("value", frame=1)

    # Frames 60–90: fade in SK_Slender
    kb["SK_Slender"].value = 0.0; kb["SK_Slender"].keyframe_insert("value", frame=60)
    kb["SK_Slender"].value = 1.0; kb["SK_Slender"].keyframe_insert("value", frame=90)

    # Frames 90–110: cross-fade SK_Slender → SK_Horn
    kb["SK_Slender"].value = 0.0; kb["SK_Slender"].keyframe_insert("value", frame=110)
    kb["SK_Horn"].value    = 0.0; kb["SK_Horn"].keyframe_insert("value",    frame=90)
    kb["SK_Horn"].value    = 1.0; kb["SK_Horn"].keyframe_insert("value",    frame=110)

    # Frames 110–140: cross-fade SK_Horn → Basis
    kb["SK_Horn"].value    = 0.0; kb["SK_Horn"].keyframe_insert("value",    frame=140)

# Smooth keyframe interpolation on shape keys
for fc in ob.data.shape_keys.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "BEZIER"

# ---------------------------------------------------------------------------
# Slow Z-rotation on poi object during top-down phase (frames 150–210)
# ---------------------------------------------------------------------------
ob.rotation_euler = (0, 0, 0);                 ob.keyframe_insert("rotation_euler", frame=150)
ob.rotation_euler = (0, 0, math.pi / 3);       ob.keyframe_insert("rotation_euler", frame=210)

# ---------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------
bpy.ops.render.render(animation=True, write_still=False)
print(f"✓ viewport.mp4 rendered — {TOTAL_F} frames at {FPS} fps")

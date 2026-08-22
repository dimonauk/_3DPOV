"""
record.py — Viewport recording blueprint for:
  Python bpy.types.BoneCollection — Rig Classification for VRM WebXR

What this renders
-----------------
A 90-frame (3-second) viewport animation in which the armature bones light up
one collection at a time, demonstrating the classification:

  Frames  1–20  : full armature in DEFAULT colour — unclassified state
  Frames 21–40  : DEF bones switch to THEME09 green — deform bones revealed
  Frames 41–60  : CTRL bones switch to THEME01 red — controls visible
  Frames 61–75  : MCH bones switch to THEME08 teal then hidden — helpers off
  Frames 76–90  : all DEF visible, CTRL visible, MCH hidden — final state

The camera orbits slowly around the rig.  The output is a viewport OpenGL
render (bpy.ops.render.opengl) at 1920×1080 30 fps.

Run in Blender after blueprint.py has already been executed, or open
rig_classified.blend first.

Output: public/library/videos/scripting/
          python-armature-bone-collections-vrm-rig-classification-webxr/
            viewport.mp4
"""

import math
import bpy

# ---------------------------------------------------------------------------
# OUTPUT PATH
# ---------------------------------------------------------------------------
MP4_OUT = "//../../videos/scripting/python-armature-bone-collections-vrm-rig-classification-webxr/viewport.mp4"

TOTAL_FRAMES = 90
FPS          = 30

# ---------------------------------------------------------------------------
# SCENE + RENDER SETTINGS
# ---------------------------------------------------------------------------
sc = bpy.context.scene
sc.frame_start = 1
sc.frame_end   = TOTAL_FRAMES
sc.render.fps  = FPS
sc.render.resolution_x = 1920
sc.render.resolution_y = 1080
sc.render.image_settings.file_format  = 'FFMPEG'
sc.render.ffmpeg.format               = 'MPEG4'
sc.render.ffmpeg.codec                = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'HIGH'
sc.render.filepath = bpy.path.abspath(MP4_OUT)

# ---------------------------------------------------------------------------
# LOCATE THE RIG
# ---------------------------------------------------------------------------
arm_obj = bpy.data.objects.get("HoloflowRig")
if not arm_obj:
    raise RuntimeError("Run blueprint.py first — HoloflowRig object not found")
arm_data = arm_obj.data

# ---------------------------------------------------------------------------
# CAMERA — ORBIT
# ---------------------------------------------------------------------------
cam_data = bpy.data.cameras.new("RecordCam")
cam_data.lens = 50
cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
sc.collection.objects.link(cam_obj)
sc.camera = cam_obj

ORBIT_RADIUS = 2.8
ORBIT_HEIGHT = 0.6

# Keyframe camera position at first and last frame
for frame in [1, TOTAL_FRAMES + 1]:
    t      = (frame - 1) / TOTAL_FRAMES
    angle  = t * math.pi * 2 * 0.75    # 270-degree sweep
    cam_obj.location = (
        math.sin(angle) * ORBIT_RADIUS,
        -math.cos(angle) * ORBIT_RADIUS,
        ORBIT_HEIGHT,
    )
    # Point at rig centre (approx y=0, z=0.3)
    dx = 0 - cam_obj.location[0]
    dy = 0 - cam_obj.location[1]
    dz = 0.3 - cam_obj.location[2]
    cam_obj.rotation_euler = (
        math.atan2(math.sqrt(dx*dx + dy*dy), -dz) - math.pi * 0.5,
        0,
        math.atan2(dx, dy),
    )
    cam_obj.keyframe_insert("location",       frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

# Linear interpolation for orbit
for fc in cam_obj.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ---------------------------------------------------------------------------
# LIGHTING
# ---------------------------------------------------------------------------
sun_data = bpy.data.lights.new("RecordSun", 'SUN')
sun_data.energy = 3.0
sun_obj  = bpy.data.objects.new("RecordSun", sun_data)
sc.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(45), 0, math.radians(30))

fill_data = bpy.data.lights.new("RecordFill", 'SUN')
fill_data.energy = 1.0
fill_obj = bpy.data.objects.new("RecordFill", fill_data)
sc.collection.objects.link(fill_obj)
fill_obj.rotation_euler = (math.radians(60), 0, math.radians(210))

# ---------------------------------------------------------------------------
# BONE COLOUR KEYFRAMES — one collection lights up per phase
# ---------------------------------------------------------------------------
"""
Blender's BoneColor.palette is set per pose bone.  To animate the classification
reveal we switch each bone's palette at specific frames using keyframe_insert on
'color.palette'.

NOTE: as of 5.1, pose_bone.color.palette is an enum and its animation uses
integer enum indices.  The reliable path is to set the value directly at each
frame and let bpy_struct handle the keyframe, rather than assuming enum-string
keyframing.  We use bpy.context.scene.frame_set() + keyframe_insert.
"""

PALETTE_DEF   = "THEME09"
PALETTE_CTRL  = "THEME01"
PALETTE_MCH   = "THEME08"
PALETTE_DEFAULT = "DEFAULT"

PHASE_SCHEDULE = [
    # (frame_start, collection_name_prefix, palette, make_visible)
    (1,  None,   PALETTE_DEFAULT, True),   # phase 0 – all default
    (21, "DEF",  PALETTE_DEF,    True),    # phase 1 – DEF green
    (41, "CTRL", PALETTE_CTRL,   True),    # phase 2 – CTRL red
    (61, "MCH",  PALETTE_MCH,    True),    # phase 3 – MCH teal
    (75, "MCH",  PALETTE_DEFAULT, False),  # phase 4 – MCH hidden
]

for (start_frame, prefix, palette, visible) in PHASE_SCHEDULE:
    sc.frame_set(start_frame)
    for coll in arm_data.collections:
        matches = prefix is None or coll.name.startswith(prefix.split()[0])
        if matches and prefix is not None:
            coll.is_visible = visible
        for bone in coll.bones:
            pb = arm_obj.pose.bones.get(bone.name)
            if pb and matches:
                pb.color.palette = palette
                pb.keyframe_insert("color.palette", frame=start_frame)

# ---------------------------------------------------------------------------
# OPENGL VIEWPORT RENDER
# ---------------------------------------------------------------------------
# Set viewport shading to SOLID (bone overlay visible)
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        area.spaces[0].shading.type = 'SOLID'
        area.spaces[0].overlay.show_bones = True
        break

bpy.ops.render.opengl(animation=True, sequencer=False, write_still=False)
print(f"[holoflow] viewport render complete → {MP4_OUT}")

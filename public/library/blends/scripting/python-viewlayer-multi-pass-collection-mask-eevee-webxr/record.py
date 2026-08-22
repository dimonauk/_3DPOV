"""
record.py — viewport animation for python-viewlayer-multi-pass-collection-mask-eevee-webxr
Blender 5.1 | CC0

Animates between four states over 120 frames:
  0-29   : All three collections visible (full scene preview)
  30-59  : ENV layer only (highlight ground plane)
  60-89  : PROPS layer only (highlight prop geometry)
  90-119 : CHAR layer only (highlight character sphere)

Each phase uses hide_render to isolate the layer being demonstrated,
giving Dimona a clear visual showing what each ViewLayer renders.
"""

import bpy
import math

OUTPUT_PATH = "//../../videos/scripting/python-viewlayer-multi-pass-collection-mask-eevee-webxr/viewport.mp4"
FRAME_COUNT = 120
FPS         = 24

scene = bpy.context.scene
scene.render.engine        = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x  = 1280
scene.render.resolution_y  = 720
scene.frame_start          = 1
scene.frame_end            = FRAME_COUNT
scene.render.fps           = FPS
scene.render.filepath      = OUTPUT_PATH
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format  = 'MPEG4'
scene.render.ffmpeg.codec   = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

# Gather references (created by blueprint.py)
def _find(name: str):
    return bpy.data.objects.get(name)

env_plane = _find("HLF_GroundPlane")
prop_box  = _find("HLF_PropBox")
prop_cyl  = _find("HLF_PropCylinder")
char_body = _find("HLF_CharBody")

if not all([env_plane, prop_box, prop_cyl, char_body]):
    raise RuntimeError("Run blueprint.py first to create scene objects.")

# Helper: insert hide_render keyframe
def _kf_hide(obj: bpy.types.Object, frame: int, hidden: bool) -> None:
    obj.hide_render = hidden
    obj.keyframe_insert("hide_render", frame=frame)


# Phase 0-29: all visible
for ob in [env_plane, prop_box, prop_cyl, char_body]:
    _kf_hide(ob, 1,  False)
    _kf_hide(ob, 29, False)

# Phase 30-59: ENV only
_kf_hide(env_plane, 30, False);  _kf_hide(env_plane, 59, False)
_kf_hide(prop_box,  30, True);   _kf_hide(prop_box,  59, True)
_kf_hide(prop_cyl,  30, True);   _kf_hide(prop_cyl,  59, True)
_kf_hide(char_body, 30, True);   _kf_hide(char_body, 59, True)

# Phase 60-89: PROPS only
_kf_hide(env_plane, 60, True);  _kf_hide(env_plane, 89, True)
_kf_hide(prop_box,  60, False); _kf_hide(prop_box,  89, False)
_kf_hide(prop_cyl,  60, False); _kf_hide(prop_cyl,  89, False)
_kf_hide(char_body, 60, True);  _kf_hide(char_body, 89, True)

# Phase 90-119: CHAR only
_kf_hide(env_plane, 90, True);  _kf_hide(env_plane, 120, True)
_kf_hide(prop_box,  90, True);  _kf_hide(prop_box,  120, True)
_kf_hide(prop_cyl,  90, True);  _kf_hide(prop_cyl,  120, True)
_kf_hide(char_body, 90, False); _kf_hide(char_body, 120, False)

# Orbiting camera
cam_data = bpy.data.cameras.new("HLF_RecordCam")
cam_data.lens = 35.0
cam_ob   = bpy.data.objects.new("HLF_RecordCam", cam_data)
bpy.context.collection.objects.link(cam_ob)
scene.camera = cam_ob

for frame in range(1, FRAME_COUNT + 1):
    t      = (frame - 1) / (FRAME_COUNT - 1)
    angle  = t * math.pi * 1.5          # 270° orbit
    radius = 6.0
    cam_ob.location.x = math.sin(angle) * radius
    cam_ob.location.y = math.cos(angle) * radius * -1
    cam_ob.location.z = 3.0 + math.sin(t * math.pi) * 1.0
    # Point camera at scene centre
    direction = cam_ob.location.copy()
    direction.z -= 1.0
    rot_q = direction.to_track_quat('Z', 'Y')
    cam_ob.rotation_euler = rot_q.to_euler()
    cam_ob.keyframe_insert("location",        frame=frame)
    cam_ob.keyframe_insert("rotation_euler",  frame=frame)

# Execute render
bpy.ops.render.render(animation=True, use_viewport=False)
print(f"[HLF] Viewport animation rendered → {OUTPUT_PATH}")

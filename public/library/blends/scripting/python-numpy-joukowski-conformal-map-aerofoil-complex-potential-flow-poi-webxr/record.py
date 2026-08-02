# ============================================================
# record.py — viewport animation for Joukowski Aerofoil
# Run inside Blender 5.1 after blueprint.py has executed.
# Outputs:
#   public/library/videos/scripting/
#   python-numpy-joukowski-conformal-map-aerofoil-complex-potential-flow-poi-webxr/
#   viewport.mp4
# Duration: 120 frames @ 24 fps = 5 s
# Technique: dolly past the wing showing streamlines curving
#            round the aerofoil, then orbit to show 3-D span.
# ============================================================

import bpy, math
from mathutils import Vector

SLUG     = ("python-numpy-joukowski-conformal-map-"
            "aerofoil-complex-potential-flow-poi-webxr")
OUT_PATH = f"//../../../../library/videos/scripting/{SLUG}/viewport"
FPS      = 24
FRAMES   = 120   # 5 s

scene = bpy.context.scene
scene.render.fps         = FPS
scene.frame_start        = 1
scene.frame_end          = FRAMES
scene.render.filepath    = OUT_PATH
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

# ── ensure objects exist ────────────────────────────────────
wing = bpy.data.objects.get("hf_joukowski_wing")
strm = bpy.data.objects.get("hf_joukowski_streams")
if wing is None or strm is None:
    raise RuntimeError("Run blueprint.py first.")

# ── camera rig ─────────────────────────────────────────────
cam_data = bpy.data.cameras.new("cam_jouk")
cam_data.lens = 50
cam_ob = bpy.data.objects.new("cam_jouk", cam_data)
scene.collection.objects.link(cam_ob)
scene.camera = cam_ob

def set_cam(frame, loc, look_at=Vector((0, 0, 0))):
    cam_ob.location = loc
    # Point camera at look_at
    direction = look_at - Vector(loc)
    cam_ob.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    cam_ob.keyframe_insert("location",       frame=frame)
    cam_ob.keyframe_insert("rotation_euler", frame=frame)

# Phase 1 (frames 1–40): upstream approach — camera drifts right
# along chord revealing the incoming streamlines
set_cam( 1, (-2.2,  0.0,  0.25))
set_cam(40, ( 0.0,  0.0,  0.25))

# Phase 2 (frames 40–80): elevate + orbit to show span
set_cam(40, ( 0.0,  0.0,  0.25))
set_cam(80, ( 0.3, -1.5,  0.5))

# Phase 3 (frames 80–120): pull back to show full wake
set_cam( 80, ( 0.3, -1.5,  0.5))
set_cam(120, ( 1.5, -0.5,  0.6))

# ── lighting: simple world emission so emissive materials glow ─
world = scene.world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value   = (0.02, 0.02, 0.04, 1.0)
    bg.inputs["Strength"].default_value = 0.1

# ── render ──────────────────────────────────────────────────
scene.render.resolution_x = 1280
scene.render.resolution_y =  720
bpy.ops.render.render(animation=True)
print(f"viewport.mp4 written to {OUT_PATH}")

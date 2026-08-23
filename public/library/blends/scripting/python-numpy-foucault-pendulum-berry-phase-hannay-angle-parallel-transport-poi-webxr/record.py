"""
record.py — Foucault Pendulum Rosette, viewport animation
Outputs: public/library/videos/scripting/<SLUG>/viewport.mp4
Run AFTER blueprint.py (needs hf_foucault_poi in the scene).
Blender 5.1 · Holoflow Studio · CC0
═══════════════════════════════════════════════════════════════════════════

5-second clip at 30 fps (150 frames):
  0– 49  Slow top-down view — shows the 7-petal rosette pattern.
 50–100  Morph to SK_Arctic (5 petals) while camera tilts to 45°.
101–130  Morph back to Basis — 7 petals return.
131–150  Continuous slow turntable showing 3D tube depth.
"""

import bpy, math

SLUG     = ("python-numpy-foucault-pendulum-berry-phase-hannay-angle"
            "-parallel-transport-poi-webxr")
OBJ_NAME = "hf_foucault_poi"
OUT_DIR  = f"//../../videos/scripting/{SLUG}/"
N_FRAMES = 150
FPS      = 30


def _interp(obj, data_path, val, frame, interp='BEZIER'):
    obj.keyframe_insert(data_path=data_path, frame=frame)


def setup_render():
    sc = bpy.context.scene
    sc.render.resolution_x = 1280
    sc.render.resolution_y = 720
    sc.render.fps          = FPS
    sc.frame_start         = 1
    sc.frame_end           = N_FRAMES
    sc.render.image_settings.file_format  = 'FFMPEG'
    sc.render.ffmpeg.format               = 'MPEG4'
    sc.render.ffmpeg.codec                = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    sc.render.filepath = OUT_DIR + "viewport"
    sc.render.engine   = 'BLENDER_EEVEE_NEXT'


def add_camera():
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 65          # mild telephoto keeps rosette filling frame
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)

    # Frame 1: top-down (directly above)
    cam_obj.location = (0.0, 0.0, 0.22)
    cam_obj.rotation_euler = (0.0, 0.0, 0.0)
    cam_obj.keyframe_insert("location",       frame=1)
    cam_obj.keyframe_insert("rotation_euler", frame=1)

    # Frame 75: 45° angle to show disc depth
    cam_obj.location = (0.0, -0.18, 0.18)
    cam_obj.rotation_euler = (math.radians(50), 0.0, 0.0)
    cam_obj.keyframe_insert("location",       frame=75)
    cam_obj.keyframe_insert("rotation_euler", frame=75)

    # Frame 150: return to top-down but rotated 90° in Z
    cam_obj.location = (0.0, 0.0, 0.22)
    cam_obj.rotation_euler = (0.0, 0.0, math.radians(90))
    cam_obj.keyframe_insert("location",       frame=150)
    cam_obj.keyframe_insert("rotation_euler", frame=150)

    bpy.context.scene.camera = cam_obj
    return cam_obj


def add_light():
    ld = bpy.data.lights.new("RecordLight", 'AREA')
    ld.energy   = 80.0
    ld.size     = 0.15
    ld.color    = (0.95, 0.90, 1.00)
    lo = bpy.data.objects.new("RecordLight", ld)
    bpy.context.collection.objects.link(lo)
    lo.location       = (0.08, -0.08, 0.20)
    lo.rotation_euler = (math.radians(45), 0.0, math.radians(30))

    # Fill light
    ld2 = bpy.data.lights.new("FillLight", 'AREA')
    ld2.energy = 20.0
    ld2.size   = 0.3
    lo2 = bpy.data.objects.new("FillLight", ld2)
    bpy.context.collection.objects.link(lo2)
    lo2.location = (-0.15, 0.10, 0.12)


def keyframe_object(obj):
    """Slow Z-rotation + SK_Arctic morph midway."""
    # Turntable: 0° → 180° over all frames (slow rotation)
    obj.rotation_euler = (0.0, 0.0, 0.0)
    obj.keyframe_insert("rotation_euler", frame=1)
    obj.rotation_euler = (0.0, 0.0, math.radians(180))
    obj.keyframe_insert("rotation_euler", frame=N_FRAMES)

    sk_blocks = obj.data.shape_keys.key_blocks

    # All shape keys at 0 initially
    for sk in sk_blocks:
        sk.value = 0.0
        sk.keyframe_insert("value", frame=1)
        sk.keyframe_insert("value", frame=N_FRAMES)

    # Morph into SK_Arctic at frame 60 (5-petal, more open pattern)
    sk_blocks["SK_Arctic"].value = 1.0
    sk_blocks["SK_Arctic"].keyframe_insert("value", frame=60)
    # Hold briefly
    sk_blocks["SK_Arctic"].keyframe_insert("value", frame=90)
    # Return to Basis at 115
    sk_blocks["SK_Arctic"].value = 0.0
    sk_blocks["SK_Arctic"].keyframe_insert("value", frame=115)


def run():
    setup_render()
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        raise RuntimeError(
            "❌  hf_foucault_poi not found — run blueprint.py first.")
    add_camera()
    add_light()
    keyframe_object(obj)
    bpy.ops.render.render(animation=True, write_still=False)
    print(f"✓  Viewport animation saved to {OUT_DIR}viewport.mp4")


run()

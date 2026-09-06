"""
record.py — EEVEE Next viewport animation → viewport.mp4
KP-I Lump Soliton stage-floor height-field (Blender 5.1)

Run AFTER blueprint.py has saved hf_kp_lump.blend.
Output: public/library/videos/scripting/
        python-numpy-kp-lump-soliton-manakov-zakharov-bordag-1977-rational-exact-2d-height-field-webxr/
        viewport.mp4

Animation design (150 frames @ 30 fps = 5 seconds):
  Frames   1– 30  Shape-key blend from Basis (t=−2, lump far left) to SK_t0 (lump centred)
  Frames  31– 60  Hold at SK_t0; camera orbit +15° to side profile
  Frames  61– 90  Blend SK_t0 → SK_t+2 (lump exits right); camera returns overhead
  Frames  91–120  Hold at SK_t+2 overhead; show algebraic decay tails
  Frames 121–150  Cross-fade all keys back to Basis; final wide shot
"""

import bpy
import os

# ── paths ─────────────────────────────────────────────────────────────────────
BLEND_PATH  = bpy.path.abspath("//hf_kp_lump.blend")
OUTPUT_DIR  = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "..", "..",
    "public", "library", "videos", "scripting",
    "python-numpy-kp-lump-soliton-manakov-zakharov-bordag-1977-rational-exact-2d-height-field-webxr",
)
OUTPUT_MP4  = os.path.join(OUTPUT_DIR, "viewport.mp4")
os.makedirs(OUTPUT_DIR, exist_ok=True)

FRAME_START = 1
FRAME_END   = 150
FPS         = 30
RES_X       = 1920
RES_Y       = 1080

# shape-key names from blueprint.py
SK_BASIS = "Basis"
SK_T0    = "SK_t0"
SK_T2    = "SK_t+2"


def setup_camera():
    """Position camera overhead and slightly angled for the initial wide shot."""
    cam_data = bpy.data.cameras.new("KP_Lump_Cam")
    cam_data.type = 'PERSP'
    cam_data.lens = 50.0
    cam = bpy.data.objects.new("KP_Lump_Cam", cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    import mathutils
    # overhead at 35° tilt, looking down at origin
    cam.location    = mathutils.Vector((0.0, -9.5, 10.0))
    cam.rotation_euler = mathutils.Euler((0.92, 0.0, 0.0), 'XYZ')
    return cam


def animate_shape_keys(mesh_obj):
    """Drive three shape-key channels with simple keyframes."""
    sk_blocks = mesh_obj.data.shape_keys.key_blocks

    def key(name, frame, val):
        sk = sk_blocks.get(name)
        if sk is None:
            return
        sk.value = val
        sk.keyframe_insert("value", frame=frame)

    # Silence all keys at frame 1
    for sk in sk_blocks[1:]:
        sk.value = 0.0
        sk.keyframe_insert("value", frame=1)

    # Basis: start at 1, fade to 0 by frame 60
    key(SK_BASIS, 1, 1.0)
    key(SK_BASIS, 60, 0.0)

    # SK_t0: fade in from frame 30→60, hold, fade out by frame 100
    key(SK_T0, 1, 0.0)
    key(SK_T0, 30, 0.0)
    key(SK_T0, 60, 1.0)
    key(SK_T0, 90, 1.0)
    key(SK_T0, 110, 0.0)

    # SK_t+2: fade in 90→120, hold 120→150
    key(SK_T2, 1, 0.0)
    key(SK_T2, 90, 0.0)
    key(SK_T2, 120, 1.0)
    key(SK_T2, 150, 1.0)

    # Use LINEAR interpolation for clean scrubbing
    for sk in sk_blocks[1:]:
        if sk.id_data.animation_data and sk.id_data.animation_data.action:
            for fc in sk.id_data.animation_data.action.fcurves:
                for kf in fc.keyframe_points:
                    kf.interpolation = 'LINEAR'


def animate_camera_orbit(cam):
    """Gentle 30° orbit mid-animation to expose the lump's side profile."""
    import mathutils, math

    cam.rotation_euler = mathutils.Euler((0.92, 0.0, 0.0), 'XYZ')
    cam.keyframe_insert("rotation_euler", frame=1)

    cam.rotation_euler = mathutils.Euler((0.92, 0.0, math.radians(30)), 'XYZ')
    cam.keyframe_insert("rotation_euler", frame=60)

    cam.rotation_euler = mathutils.Euler((0.92, 0.0, 0.0), 'XYZ')
    cam.keyframe_insert("rotation_euler", frame=120)

    for fc in cam.animation_data.action.fcurves:
        for kf in fc.keyframe_points:
            kf.interpolation = 'BEZIER'


def render_animation():
    sc = bpy.context.scene
    sc.frame_start       = FRAME_START
    sc.frame_end         = FRAME_END
    sc.render.fps        = FPS
    sc.render.resolution_x = RES_X
    sc.render.resolution_y = RES_Y
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format              = 'MPEG4'
    sc.render.ffmpeg.codec               = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    sc.render.filepath   = OUTPUT_MP4

    # EEVEE Next — fast, matches WebXR look
    sc.render.engine = 'BLENDER_EEVEE_NEXT'

    bpy.ops.render.render(animation=True)
    print(f"[KP-Lump record] viewport.mp4 → {OUTPUT_MP4}")


def main():
    # open the saved blend
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

    mesh_obj = bpy.data.objects.get("hf_kp_lump_stage")
    if mesh_obj is None:
        raise RuntimeError("[KP-Lump record] hf_kp_lump_stage not found — run blueprint.py first")

    cam = setup_camera()
    animate_shape_keys(mesh_obj)
    animate_camera_orbit(cam)
    render_animation()


if __name__ == "__main__":
    main()

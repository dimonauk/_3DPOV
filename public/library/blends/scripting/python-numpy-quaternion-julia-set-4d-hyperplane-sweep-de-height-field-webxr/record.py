"""
record.py — Viewport animation for quaternion Julia set hyperplane sweep.
Run this AFTER blueprint.py has built the scene.

Output: public/library/videos/scripting/
        python-numpy-quaternion-julia-set-4d-hyperplane-sweep-de-height-field-webxr/
        viewport.mp4

Animation plan (300 frames @ 24 fps ≈ 12.5 s):
  F001–060  : shape key "z=0.00" visible — classic complex Julia set, camera orbits 0°→90°
  F061–120  : morph to "z=0.30" — first fragmentation of connected tendrils
  F121–180  : morph to "z=0.55" — isolated islands appear
  F181–240  : morph to "z=0.75" — majority of structure gone, dust remains
  F241–300  : morph to "z=0.92" — near-empty field; camera returns overhead
"""

import bpy
import math

FRAME_RATE   = 24
TOTAL_FRAMES = 300
OUTPUT_PATH  = "//../../videos/scripting/python-numpy-quaternion-julia-set-4d-hyperplane-sweep-de-height-field-webxr/viewport"
BLEND_KEY    = "z_blend"   # driver target property on object
MESH_NAME    = "hf_qjulia"


def _clear_anim(obj) -> None:
    obj.animation_data_clear()
    if obj.data.shape_keys:
        obj.data.shape_keys.animation_data_clear()


def _key_sk(obj, key_name: str, frame: int, value: float) -> None:
    """Insert a keyframe on a shape key block."""
    sk = obj.data.shape_keys.key_blocks.get(key_name)
    if sk is None:
        return
    sk.value = value
    sk.keyframe_insert("value", frame=frame)


def _setup_camera() -> bpy.types.Object:
    """Place a camera on a rotating arc above the mesh."""
    if "RecordCam" in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects["RecordCam"], do_unlink=True)
    bpy.ops.object.camera_add()
    cam = bpy.context.active_object
    cam.name = "RecordCam"
    bpy.context.scene.camera = cam

    # Keyframe camera arc: starts at 45° elevation, swings overhead
    positions = [
        (1,   (2.8, -3.2, 2.2)),
        (150, (3.5,  0.0, 3.8)),
        (300, (2.8,  3.2, 2.2)),
    ]
    for frame, loc in positions:
        cam.location = loc
        cam.keyframe_insert("location", frame=frame)
        bpy.context.scene.frame_set(frame)
        bpy.ops.object.constraint_add(type='TRACK_TO') if frame == 1 else None

    # Aim at origin
    if not cam.constraints:
        bpy.ops.object.select_all(action='DESELECT')
        cam.select_set(True)
        bpy.context.view_layer.objects.active = cam
        ct = cam.constraints.new(type='TRACK_TO')
        ct.target = bpy.data.objects.get(MESH_NAME)
        ct.track_axis = 'TRACK_NEGATIVE_Z'
        ct.up_axis = 'UP_Y'
    return cam


def _setup_light() -> None:
    """Soft overhead area light."""
    if "RecordLight" in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects["RecordLight"], do_unlink=True)
    bpy.ops.object.light_add(type='AREA', location=(0.0, 0.0, 4.5))
    lt = bpy.context.active_object
    lt.name = "RecordLight"
    lt.data.energy = 600
    lt.data.size = 4.0


def _setup_render() -> None:
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_EEVEE_NEXT'
    scn.render.image_settings.file_format = 'FFMPEG'
    scn.render.ffmpeg.format = 'MPEG4'
    scn.render.ffmpeg.codec = 'H264'
    scn.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scn.render.filepath = OUTPUT_PATH
    scn.render.resolution_x = 1920
    scn.render.resolution_y = 1080
    scn.render.fps = FRAME_RATE
    scn.frame_start = 1
    scn.frame_end = TOTAL_FRAMES
    # Bloom for emissive glow
    scn.eevee.use_bloom = True
    scn.eevee.bloom_threshold = 0.70
    scn.eevee.bloom_intensity = 0.40
    scn.eevee.bloom_radius = 3.0


def main() -> None:
    obj = bpy.data.objects.get(MESH_NAME)
    if obj is None:
        raise RuntimeError(f"Object '{MESH_NAME}' not found — run blueprint.py first.")
    _clear_anim(obj)

    # Shape key sweep schedule: (start_frame, end_frame, key_name)
    schedule = [
        (  1,  60, "Basis"),
        ( 61, 120, "z=0.30"),
        (121, 180, "z=0.55"),
        (181, 240, "z=0.75"),
        (241, 300, "z=0.92"),
    ]
    # Initialise all keys to 0
    for _, _, key in schedule:
        for f in (1, TOTAL_FRAMES):
            _key_sk(obj, key, f, 0.0)

    # Fade each key in at its start and out at its end
    for s, e, key in schedule:
        mid = (s + e) // 2
        _key_sk(obj, key, s,   0.0)
        _key_sk(obj, key, mid, 1.0)
        _key_sk(obj, key, e,   0.0)

    _setup_camera()
    _setup_light()
    _setup_render()

    print("[record] Rendering viewport.mp4 …")
    bpy.ops.render.render(animation=True)
    print("[record] Done.")


if __name__ == "__main__":
    main()

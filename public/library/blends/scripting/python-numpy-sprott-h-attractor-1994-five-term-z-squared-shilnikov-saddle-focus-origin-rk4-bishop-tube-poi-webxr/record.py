"""
record.py — Viewport Animation Recorder for Sprott H Attractor
==============================================================
Output: public/library/videos/scripting/
  python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-
    saddle-focus-origin-rk4-bishop-tube-poi-webxr/viewport.mp4

Pre-condition: blueprint.py has been run in this .blend file.

Animation: 150 frames at 30 fps (5 seconds).
Shape-key timeline:
  Frames   1–30   Basis (a=0.50, canonical spiral)
  Frames  31–60   cross-fade to SK_LoA (a=0.25, tighter tube)
  Frames  61–90   SK_LoA settled
  Frames  91–120  cross-fade to SK_HiA (a=0.75, wider orbit)
  Frames 121–150  SK_NearCons (a=0.95, near-conservative ring)

Camera: orbits 360° at elevation 0.35 rad, radius 6.0 m.
Shading: Material Preview (vertex-colour cobalt→amber gradient visible).
"""

import bpy
from math import pi, cos, sin

SLUG = (
    "python-numpy-sprott-h-attractor-1994-five-term-z-squared-"
    "shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr"
)
OUTPUT_PATH = f"//../../videos/scripting/{SLUG}/viewport.mp4"

TOTAL_FRAMES = 150
FPS          = 30
CAM_RADIUS   = 6.0
CAM_ELEV     = 0.35   # radians above equator


def set_render_settings():
    scn = bpy.context.scene
    scn.render.engine          = "BLENDER_EEVEE_NEXT"
    scn.render.image_settings.file_format = "FFMPEG"
    scn.render.ffmpeg.format   = "MPEG4"
    scn.render.ffmpeg.codec    = "H264"
    scn.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scn.render.filepath        = OUTPUT_PATH
    scn.render.resolution_x   = 1920
    scn.render.resolution_y   = 1080
    scn.render.fps             = FPS
    scn.frame_start            = 1
    scn.frame_end              = TOTAL_FRAMES
    # Bloom for cobalt-to-amber glow
    eevee = scn.eevee
    eevee.use_bloom            = True
    eevee.bloom_threshold      = 0.28
    eevee.bloom_intensity      = 0.50


def setup_camera():
    if "RecordCam" in bpy.data.objects:
        cam_ob = bpy.data.objects["RecordCam"]
    else:
        bpy.ops.object.camera_add()
        cam_ob = bpy.context.active_object
        cam_ob.name = "RecordCam"
    cam_ob.data.lens = 85   # mm — telephoto compresses depth nicely
    bpy.context.scene.camera = cam_ob

    cam_ob.animation_data_clear()
    for fr in range(1, TOTAL_FRAMES + 1):
        angle = 2.0*pi * (fr - 1) / TOTAL_FRAMES   # full revolution
        x = CAM_RADIUS * cos(angle)
        y = CAM_RADIUS * sin(angle)
        z = CAM_RADIUS * sin(CAM_ELEV)
        cam_ob.location = (x, y, z)
        # Point at origin
        dx, dy, dz = -x, -y, -z
        import mathutils
        cam_ob.rotation_euler = mathutils.Vector((dx, dy, dz)).to_track_quat(
            '-Z', 'Y').to_euler()
        cam_ob.keyframe_insert("location", frame=fr)
        cam_ob.keyframe_insert("rotation_euler", frame=fr)


def animate_shape_keys():
    """Insert shape-key value keyframes on the SprottH_Tube object."""
    ob = bpy.data.objects.get("SprottH_Tube")
    if ob is None or ob.data.shape_keys is None:
        print("ERROR: SprottH_Tube not found or has no shape keys.")
        return

    kb = ob.data.shape_keys.key_blocks
    sched = {
        "Basis":      [(1, 1.0), (30, 1.0), (60, 0.0), (90,  0.0), (120, 0.0), (150, 0.0)],
        "SK_LoA":     [(1, 0.0), (30, 0.0), (60, 1.0), (90,  0.0), (120, 0.0), (150, 0.0)],
        "SK_HiA":     [(1, 0.0), (60, 0.0), (90, 0.0), (120, 1.0), (150, 0.0)],
        "SK_NearCons":[(1, 0.0), (120, 0.0),(150, 1.0)],
    }
    for key_name, kf_list in sched.items():
        if key_name not in kb:
            continue
        key = kb[key_name]
        for frame, val in kf_list:
            key.value = val
            key.keyframe_insert("value", frame=frame)


def add_world_light():
    """Soft world light so the attractor tube reads against black."""
    world = bpy.context.scene.world
    world.use_nodes = True
    nt = world.node_tree
    bg = nt.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value   = (0.01, 0.01, 0.02, 1.0)
        bg.inputs["Strength"].default_value = 0.15


def main():
    set_render_settings()
    setup_camera()
    animate_shape_keys()
    add_world_light()
    bpy.ops.render.render(animation=True)
    print(f"Sprott H recording done → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

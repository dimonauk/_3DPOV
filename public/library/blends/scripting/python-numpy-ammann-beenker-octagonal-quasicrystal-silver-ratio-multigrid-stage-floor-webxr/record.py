"""
record.py — Viewport-Animation Recorder for Ammann-Beenker Stage Floor (Blender 5.1)
=====================================================================================
Run AFTER blueprint.py has built the scene.
Produces: public/library/videos/scripting/
            python-numpy-ammann-beenker-octagonal-quasicrystal-silver-ratio-multigrid-stage-floor-webxr/
            viewport.mp4

Strategy: 120 frames at 24 fps = 5 s.
  • Frames 1–40:   Top view (Z+) — reveals 8-fold local symmetry.
  • Frames 41–80:  Smooth orbit to 45° elevation — exposes slab-height contrast.
  • Frames 81–120: Slow dolly-in zoom — one tile cluster fills the frame.
All via bpy.ops.render.render(animation=True) with the 3D-viewport camera.
"""

import bpy
import math

# ─── Parameters ──────────────────────────────────────────────────────────────
OUT_DIR    = "//../../videos/scripting/" \
             "python-numpy-ammann-beenker-octagonal-quasicrystal-silver-ratio-multigrid-stage-floor-webxr/"
FRAME_END  = 120
FPS        = 24
RES_X, RES_Y = 1920, 1080

# Camera path (three phases).
KEYFRAMES = [
    # (frame, loc_xyz, rot_euler_deg, lens_mm)
    (1,   (0, 0,  9.0),  (0,   0, 0),  35),   # top-down
    (40,  (0, 0,  9.0),  (0,   0, 0),  35),   # hold top
    (41,  (0, -7, 5.5),  (50,  0, 0),  40),   # begin orbit
    (80,  (0, -7, 5.5),  (50,  0, 0),  40),   # hold orbit
    (81,  (0, -3, 3.0),  (58,  0, 0),  55),   # dolly in
    (120, (0, -3, 3.0),  (58,  0, 0),  55),   # hold close
]


def _deg2rad(d):
    return math.radians(d)


def setup_camera():
    """Create or re-use a camera named RecordCam."""
    cam_data = bpy.data.cameras.get("RecordCam")
    if cam_data is None:
        cam_data = bpy.data.cameras.new("RecordCam")

    cam_obj = bpy.data.objects.get("RecordCam")
    if cam_obj is None:
        cam_obj = bpy.data.objects.new("RecordCam", cam_data)
        bpy.context.collection.objects.link(cam_obj)

    bpy.context.scene.camera = cam_obj
    return cam_obj, cam_data


def set_keyframes(cam_obj, cam_data):
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end   = FRAME_END

    for (fr, loc, rot_deg, lens) in KEYFRAMES:
        bpy.context.scene.frame_set(fr)
        cam_obj.location = loc
        cam_obj.rotation_euler = (_deg2rad(rot_deg[0]),
                                   _deg2rad(rot_deg[1]),
                                   _deg2rad(rot_deg[2]))
        cam_data.lens = lens
        cam_obj.keyframe_insert(data_path="location")
        cam_obj.keyframe_insert(data_path="rotation_euler")
        cam_data.keyframe_insert(data_path="lens")

    # Smooth interpolation for orbit phases, linear for holds.
    for fc in cam_obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"

    print("Keyframes set.")


def setup_render():
    scn = bpy.context.scene
    scn.render.engine              = "BLENDER_WORKBENCH"
    scn.render.fps                 = FPS
    scn.render.resolution_x        = RES_X
    scn.render.resolution_y        = RES_Y
    scn.render.resolution_percentage = 100
    scn.render.image_settings.file_format = "FFMPEG"
    scn.render.ffmpeg.format       = "MPEG4"
    scn.render.ffmpeg.codec        = "H264"
    scn.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scn.render.filepath            = OUT_DIR + "viewport"

    # Workbench: vertex colour + cavity shading.
    wbench = scn.display.shading
    wbench.type    = "MATERIAL"
    wbench.show_cavity = True
    wbench.cavity_type = "BOTH"

    # Background: dark studio.
    scn.world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    scn.world.color = (0.05, 0.05, 0.07)


def add_light():
    """Add a single area light for slab-height definition."""
    existing = bpy.data.objects.get("RecordLight")
    if existing:
        return
    ld = bpy.data.lights.new("RecordLight", "AREA")
    ld.energy = 600
    ld.size   = 4.0
    lo = bpy.data.objects.new("RecordLight", ld)
    bpy.context.collection.objects.link(lo)
    lo.location     = (3, -2, 6)
    lo.rotation_euler = (math.radians(45), 0, math.radians(30))


def main():
    cam_obj, cam_data = setup_camera()
    set_keyframes(cam_obj, cam_data)
    setup_render()
    add_light()
    bpy.ops.render.render(animation=True)
    print(f"Render complete → {bpy.context.scene.render.filepath}")


main()

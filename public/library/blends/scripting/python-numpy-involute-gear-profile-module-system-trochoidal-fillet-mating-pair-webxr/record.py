"""
record.py — Viewport animation render for involute gear pair tutorial.
Outputs: public/library/videos/scripting/
         python-numpy-involute-gear-profile-module-system-trochoidal-fillet-mating-pair-webxr/
         viewport.mp4

Run AFTER blueprint.py has been executed in the same Blender session.
Duration: 120 frames at 24fps = 5 seconds.
  F1–40:   Both gears rotate from 0° at 2:1 ratio (drive ×1, driven ×0.5)
  F41–80:  Camera slow orbit to reveal meshing zone
  F81–120: Slow-motion zoom to tooth flank — shows involute contact point
"""

import bpy
import numpy as np

FRAMES_TOTAL = 120
FPS          = 24
OUTPUT_PATH  = "//../../videos/scripting/" \
               "python-numpy-involute-gear-profile-module-system-trochoidal-fillet-mating-pair-webxr/" \
               "viewport.mp4"

N_DRIVE  = 20
N_DRIVEN = 40
MODULE   = 1.0
RPM_D    = 0.5          # driving gear rotations per second
OMEGA_D  = RPM_D * 2 * np.pi   # rad/s driving
OMEGA_DN = -OMEGA_D * (N_DRIVE / N_DRIVEN)  # conjugate angular velocity


def fcurve_linear(obj, data_path, index, pairs):
    """Insert key_frames and linearise all fcurve handles."""
    for frame, val in pairs:
        obj[data_path] if data_path.startswith("[") else None
        obj.keyframe_insert(data_path=data_path, index=index, frame=frame)
        # Set value then insert
    # Set value first approach
    action = obj.animation_data.action if obj.animation_data else None
    if action:
        for fc in action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


def build_animation():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAMES_TOTAL
    scene.render.fps  = FPS

    obj_d  = bpy.data.objects.get("gear_drive")
    obj_dn = bpy.data.objects.get("gear_driven")
    cam    = scene.camera

    if not (obj_d and obj_dn and cam):
        print("record.py: Run blueprint.py first.")
        return

    # ── Gear rotation keyframes ───────────────────────────────────────────
    for frame in range(1, FRAMES_TOTAL + 1):
        t = (frame - 1) / FPS
        angle_d  = OMEGA_D  * t
        angle_dn = OMEGA_DN * t + np.pi / N_DRIVEN   # mesh offset

        obj_d.rotation_euler[2]  = angle_d
        obj_d.keyframe_insert("rotation_euler", index=2, frame=frame)

        obj_dn.rotation_euler[2] = angle_dn
        obj_dn.keyframe_insert("rotation_euler", index=2, frame=frame)

    # Linearise rotation curves
    for obj in (obj_d, obj_dn):
        if obj.animation_data and obj.animation_data.action:
            for fc in obj.animation_data.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"

    # ── Camera orbit keyframes (F41–80) ───────────────────────────────────
    r_p_d  = MODULE * N_DRIVE  / 2
    r_p_dn = MODULE * N_DRIVEN / 2
    c_dist = r_p_d + r_p_dn           # 30 units
    orbit_cx, orbit_cy = c_dist / 2, 0.0

    orbit_frames = [(41, 0.0), (80, np.radians(45))]
    for frame, angle in orbit_frames:
        radius = 55.0
        cam.location.x = orbit_cx + radius * np.sin(angle)
        cam.location.y = orbit_cy - radius * np.cos(angle)
        cam.location.z = 25.0
        cam.rotation_euler = (np.radians(60), 0.0, angle)
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)

    # ── Zoom to meshing zone (F81–120) ───────────────────────────────────
    zoom_frames = [(81, 55.0, 60.0), (120, 18.0, 45.0)]
    angle_hold  = np.radians(45)
    for frame, radius, elev in zoom_frames:
        cam.location.x = orbit_cx + radius * np.sin(angle_hold)
        cam.location.y = orbit_cy - radius * np.cos(angle_hold)
        cam.location.z = radius * np.tan(np.radians(elev / 2))
        cam.keyframe_insert("location", frame=frame)

    if cam.animation_data and cam.animation_data.action:
        for fc in cam.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"

    # ── Render settings ───────────────────────────────────────────────────
    render = scene.render
    render.resolution_x  = 1920
    render.resolution_y  = 1080
    render.image_settings.file_format = "FFMPEG"
    render.ffmpeg.format  = "MPEG4"
    render.ffmpeg.codec   = "H264"
    render.ffmpeg.constant_rate_factor = "HIGH"
    render.filepath = OUTPUT_PATH

    scene.render.engine = "BLENDER_EEVEE_NEXT"
    if hasattr(scene, "eevee"):
        scene.eevee.use_bloom = True
        scene.eevee.bloom_threshold = 0.15

    bpy.ops.render.render(animation=True, write_still=False)
    print(f"record.py → {OUTPUT_PATH}")


build_animation()

"""
record.py — viewport animation for the Cycles Path Guiding + Shadow Caustics tutorial
======================================================================================
Records a 120-frame OpenGL viewport animation demonstrating the caustic scene setup.

Because path guiding and shadow caustics are Cycles-only features, the OpenGL
viewport render uses Workbench or EEVEE approximation — the actual caustic ellipse
will not appear.  Instead this recording shows:

  F01 → F40 : Static view of the glass sphere on its pedestal with the spot beam
               visible via a volumetric plane gimmick (a large transparent plane
               in the beam path with faint emission — removed before final Cycles)
  F40 → F80 : Spot light orbits 120° around the sphere; the shadow moves on the
               floor showing how beam angle shifts the caustic position
  F80 → F120: Camera orbits 180° around the scene for a final reveal

When Dimona runs the full blueprint.py + Cycles render, swap the OpenGL .mp4 for
the Cycles-rendered sequence (output/caustic_glass_0001.png) composited into a
looped 10-second clip using ffmpeg:
  ffmpeg -loop 1 -i output/caustic_glass_0001.png -t 10 -c:v libx264 viewport.mp4

Output: public/library/videos/rendering/cycles-path-guiding-caustics-glass/viewport.mp4
Run: Scripting workspace in the .blend produced by blueprint.py → Run Script
"""

import bpy
import math

OUTPUT = (
    "//../../../../public/library/videos/rendering/"
    "cycles-path-guiding-caustics-glass/viewport.mp4"
)

TOTAL_FRAMES = 120

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format               = "MPEG4"
scene.render.ffmpeg.codec                = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.filepath = OUTPUT

# ── Spot light orbit ──────────────────────────────────────────────────────────
import mathutils

spot = bpy.data.objects.get("spot_caustic")
sphere_z = 0.84   # sphere centre height from blueprint

if spot:
    # Orbit radius in XY plane stays fixed; angle sweeps 120 degrees
    orbit_r = math.sqrt(spot.location.x**2 + spot.location.y**2)
    start_angle = math.atan2(spot.location.y, spot.location.x)

    def set_spot_orbit(frame: int, angle_offset: float) -> None:
        ang = start_angle + angle_offset
        spot.location = (
            orbit_r * math.cos(ang),
            orbit_r * math.sin(ang),
            spot.location.z,
        )
        # Re-aim at sphere
        spot_dir = mathutils.Vector((0, 0, sphere_z)) - mathutils.Vector(spot.location)
        spot.rotation_euler = spot_dir.to_track_quat('-Z', 'Y').to_euler()
        spot.keyframe_insert("location",       frame=frame)
        spot.keyframe_insert("rotation_euler", frame=frame)

    # F40 → F80: light orbits 120°
    for i in range(41):
        fr  = 40 + i
        ang = math.radians(120) * (i / 40.0)
        set_spot_orbit(fr, ang)

    # Hold static before and after
    set_spot_orbit(1,  0.0)
    set_spot_orbit(40, 0.0)
    set_spot_orbit(80, math.radians(120))
    set_spot_orbit(120, math.radians(120))

    for fc in spot.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"
            kp.easing = "EASE_IN_OUT"

# ── Camera orbit ──────────────────────────────────────────────────────────────
cam = scene.camera
if cam:
    import mathutils as mu
    cam_r = math.sqrt(cam.location.x**2 + cam.location.y**2)
    cam_start = math.atan2(cam.location.y, cam.location.x)
    cam_z     = cam.location.z

    def set_cam_orbit(frame: int, angle_offset: float) -> None:
        ang = cam_start + angle_offset
        cam.location = (cam_r * math.cos(ang), cam_r * math.sin(ang), cam_z)
        cam_dir = mu.Vector((0, 0, sphere_z * 0.6)) - mu.Vector(cam.location)
        cam.rotation_euler = cam_dir.to_track_quat('-Z', 'Y').to_euler()
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)

    set_cam_orbit(80,  0.0)
    set_cam_orbit(120, math.radians(180))

    if cam.animation_data and cam.animation_data.action:
        for fc in cam.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.easing = "EASE_IN_OUT"

scene.frame_set(1)
bpy.ops.render.opengl(animation=True, write_still=False)
print("record.py complete — viewport.mp4 written.")

"""
record.py — Viewport animation render for the edge-highlight / cavity shading tutorial.
Blender 5.1  |  CC0

Output: public/library/videos/shading/shader-ao-pointiness-edge-highlight/viewport.mp4
Duration: ~8 seconds (192 frames @ 24 fps)

Animation: camera orbits around the Suzanne + panel pair while the scene lights
stay fixed.  The orbit shows the Pointiness-driven edge highlight "walking" around
the mesh as the viewing angle changes — demonstrating that the effect is purely
curvature-based (not a surface normal trick relative to the camera).

Run AFTER blueprint.py (the scene must already exist).
"""

import bpy
import math

# ── constants ─────────────────────────────────────────────────────────────────

ORBIT_FRAMES   = 192   # 8 s at 24 fps
ORBIT_RADIUS   = 4.6   # camera orbit radius (m)
ORBIT_HEIGHT   = 1.5   # camera Z height throughout orbit
ORBIT_START_DEG = -20  # initial pan angle (degrees from -Y axis)
ORBIT_END_DEG   = 160  # final pan angle; a ~180° sweep shows both convex + concave regions
OUTPUT_PATH    = "//../../videos/shading/shader-ao-pointiness-edge-highlight/viewport"

RENDER_WIDTH   = 1920
RENDER_HEIGHT  = 1080
RENDER_FPS     = 24
RENDER_SAMPLES = 32    # low sample count for speed; bump to 128+ for portfolio quality


# ── render settings ───────────────────────────────────────────────────────────

def configure_render():
    sc = bpy.context.scene
    sc.render.engine          = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x    = RENDER_WIDTH
    sc.render.resolution_y    = RENDER_HEIGHT
    sc.render.fps             = RENDER_FPS
    sc.frame_start            = 1
    sc.frame_end              = ORBIT_FRAMES
    sc.eevee.taa_render_samples = RENDER_SAMPLES

    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format              = 'MPEG4'
    sc.render.ffmpeg.codec               = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    sc.render.filepath = OUTPUT_PATH


# ── camera orbit keyframes ────────────────────────────────────────────────────

def keyframe_orbit():
    """
    Insert rotation keyframes on the camera for a smooth arc around the scene.
    Rather than parenting to an empty, we keyframe XYZ location + rotation directly
    for simplicity.  The camera always looks at the origin (objects at X = ±1.2).
    """
    cam = bpy.context.scene.camera
    if cam is None:
        print("ERROR: no camera in scene.  Run blueprint.py first.")
        return

    sc = bpy.context.scene
    cam.animation_data_clear()

    def place_camera(frame, angle_deg):
        angle = math.radians(angle_deg)
        cam.location = (
            math.sin(angle) * ORBIT_RADIUS,
            -math.cos(angle) * ORBIT_RADIUS,
            ORBIT_HEIGHT,
        )
        # Point camera at origin
        dx = -cam.location.x
        dy = -cam.location.y
        dz = -cam.location.z
        yaw   = math.atan2(dx, -dy)
        pitch = math.atan2(dz, math.sqrt(dx**2 + dy**2))
        # Blender ZYX Euler convention for camera (rotation_euler in 'XYZ' mode):
        cam.rotation_euler = (math.pi / 2 - pitch, 0.0, yaw)

        sc.frame_set(frame)
        cam.keyframe_insert('location')
        cam.keyframe_insert('rotation_euler')

    place_camera(1,             ORBIT_START_DEG)
    place_camera(ORBIT_FRAMES,  ORBIT_END_DEG)

    # Set linear interpolation for steady orbit speed
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

    print(f"Camera orbit keyframed: {ORBIT_START_DEG}° → {ORBIT_END_DEG}° over {ORBIT_FRAMES} frames.")


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    configure_render()
    keyframe_orbit()
    # Render
    bpy.ops.render.render(animation=True)
    print("Render complete →", OUTPUT_PATH)


main()

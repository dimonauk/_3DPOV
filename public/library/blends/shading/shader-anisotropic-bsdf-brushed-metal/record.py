"""
record.py — Viewport animation render for the Anisotropic BSDF tutorial.
Blender 5.1  |  CC0

Output: public/library/videos/shading/shader-anisotropic-bsdf-brushed-metal/viewport.mp4
Duration: ~10 seconds (240 frames @ 24 fps)

Animation: the camera orbits 270° around both objects while the key light stays fixed.
The fixed light is the essential ingredient — as the camera moves, the anisotropic
highlight remains anchored to the light direction and sweeps along the surface.
This demonstrates the fundamental difference between anisotropic and isotropic highlights:
an isotropic sphere peak tracks the reflection vector (camera+light bisector);
an anisotropic streak stays tangent-locked even as the camera swings wide.

Run AFTER blueprint.py (scene must already exist).
"""

import bpy
import math

# ── constants ─────────────────────────────────────────────────────────────────

TOTAL_FRAMES    = 240        # 10 s at 24 fps
ORBIT_RADIUS    = 5.0
ORBIT_HEIGHT    = 1.6
ORBIT_START_DEG = -10.0
ORBIT_END_DEG   = 260.0      # 270° sweep shows the highlight from all azimuths
OUTPUT_PATH     = "//../../videos/shading/shader-anisotropic-bsdf-brushed-metal/viewport"

RENDER_WIDTH    = 1920
RENDER_HEIGHT   = 1080
RENDER_FPS      = 24
EEVEE_SAMPLES   = 64    # enough for smooth SSR highlight; bump to 256 for portfolio


# ── render configuration ──────────────────────────────────────────────────────

def configure_render():
    sc = bpy.context.scene
    sc.render.engine            = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x      = RENDER_WIDTH
    sc.render.resolution_y      = RENDER_HEIGHT
    sc.render.fps               = RENDER_FPS
    sc.frame_start              = 1
    sc.frame_end                = TOTAL_FRAMES
    sc.eevee.taa_render_samples = EEVEE_SAMPLES
    sc.eevee.use_raytracing     = True

    sc.render.image_settings.file_format  = 'FFMPEG'
    sc.render.ffmpeg.format               = 'MPEG4'
    sc.render.ffmpeg.codec                = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    sc.render.filepath = OUTPUT_PATH


# ── camera orbit ──────────────────────────────────────────────────────────────

def keyframe_orbit():
    cam = bpy.context.scene.camera
    if cam is None:
        print("ERROR: no camera found. Run blueprint.py first.")
        return

    sc = bpy.context.scene
    cam.animation_data_clear()

    def place(frame, deg):
        a = math.radians(deg)
        cam.location = (
            math.sin(a) * ORBIT_RADIUS,
            -math.cos(a) * ORBIT_RADIUS,
            ORBIT_HEIGHT,
        )
        dx, dy, dz = -cam.location.x, -cam.location.y, -cam.location.z
        yaw   = math.atan2(dx, -dy)
        pitch = math.atan2(dz, math.sqrt(dx**2 + dy**2))
        cam.rotation_euler = (math.pi / 2 - pitch, 0.0, yaw)
        sc.frame_set(frame)
        cam.keyframe_insert('location')
        cam.keyframe_insert('rotation_euler')

    place(1,             ORBIT_START_DEG)
    place(TOTAL_FRAMES,  ORBIT_END_DEG)

    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

    print(f"Orbit keyframed: {ORBIT_START_DEG}° → {ORBIT_END_DEG}° over {TOTAL_FRAMES} frames.")


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    configure_render()
    keyframe_orbit()
    bpy.ops.render.render(animation=True)
    print("Render complete →", OUTPUT_PATH)


main()

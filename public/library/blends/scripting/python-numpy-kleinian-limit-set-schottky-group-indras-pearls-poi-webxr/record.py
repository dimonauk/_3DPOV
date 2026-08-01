"""
record.py — Viewport animation for the Kleinian Limit Set entry
Blender 5.1 · CC0

Run AFTER blueprint.py (or with the saved hf_kleinian.blend open).
Outputs: public/library/videos/scripting/
         python-numpy-kleinian-limit-set-schottky-group-indras-pearls-poi-webxr/
         viewport.mp4

Action (12 seconds, 288 frames @ 24 fps):
  0–4 s   — camera orbits 360° at mid elevation, fractal cloud visible
  4–8 s   — camera descends to view the four Schottky guide circles below
  8–12 s  — pull back to show both cloud + circles in one frame
"""

import bpy, math

FRAME_START = 1
FRAME_END   = 288
FPS         = 24

def setup_render():
    scn = bpy.context.scene
    scn.render.engine           = "BLENDER_EEVEE_NEXT"
    scn.render.resolution_x     = 1920
    scn.render.resolution_y     = 1080
    scn.render.fps              = FPS
    scn.frame_start             = FRAME_START
    scn.frame_end               = FRAME_END
    scn.render.filepath = ("//../../videos/scripting/"
                           "python-numpy-kleinian-limit-set-schottky-group-indras-pearls-poi-webxr/"
                           "viewport")
    scn.render.image_settings.file_format = "FFMPEG"
    scn.render.ffmpeg.format    = "MPEG4"
    scn.render.ffmpeg.codec     = "H264"
    scn.render.ffmpeg.constant_rate_factor = "HIGH"
    # Bloom must be on for emission to read as light
    scn.eevee.bloom_threshold   = 0.55
    scn.eevee.bloom_intensity   = 0.95
    scn.eevee.bloom_radius      = 4.0

def look_at(cam, target=(0, 0, 0)):
    """Orient camera so it faces `target` using Euler ZXY decomposition."""
    dx = target[0] - cam.location.x
    dy = target[1] - cam.location.y
    dz = target[2] - cam.location.z
    dist_xy  = math.sqrt(dx * dx + dy * dy)
    pitch    = math.atan2(dz, -dist_xy)       # tilt up/down from horizon
    yaw      = math.atan2(dx, -dy)            # azimuth (Blender Y-forward convention)
    cam.rotation_euler = (math.pi / 2 + pitch, 0, yaw)

def keyframe_cam(cam, frame, x, y, z, target=(0, 0, 0)):
    bpy.context.scene.frame_set(frame)
    cam.location = (x, y, z)
    look_at(cam, target)
    cam.keyframe_insert("location",       frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)

def animate_camera(cam):
    """Three-phase orbit: high circle → descend to circles plane → pull back."""
    # Phase 1: orbit at elevation +1.0, radius 3.5 (frames 1–96 = 4 s)
    for i in range(5):
        f  = FRAME_START + int(i * 96 / 4)
        t  = i / 4.0
        az = 2 * math.pi * t
        x  = 3.5 * math.sin(az)
        y  = -3.5 * math.cos(az)
        keyframe_cam(cam, f, x, y, 1.0, target=(0, 0, 0.1))

    # Phase 2: descend to view the Schottky guide circles at z = −1.25 (fr 97–192)
    for i in range(5):
        f  = 97 + int(i * 96 / 4)
        t  = i / 4.0
        az = 2 * math.pi * (0.25 + t * 0.5)  # slow half-orbit
        radius = 3.0
        x  = radius * math.sin(az)
        y  = -radius * math.cos(az)
        z  = 1.0 - 2.5 * t       # descend from z=1 to z=−1.5
        keyframe_cam(cam, f, x, y, z, target=(0, 0, -1.0))

    # Phase 3: pull back to show full scene (fr 193–288)
    for i in range(5):
        f  = 193 + int(i * 96 / 4)
        t  = i / 4.0
        radius = 3.0 + 2.5 * t   # zoom out from 3 to 5.5
        az = 2 * math.pi * (0.75 + 0.25 * t)
        x  = radius * math.sin(az)
        y  = -radius * math.cos(az)
        z  = -1.5 + 3.0 * t      # rise from z=−1.5 back to z=1.5
        keyframe_cam(cam, f, x, y, z, target=(0, 0, -0.3))

def main():
    setup_render()
    cam = bpy.context.scene.camera
    if cam is None:
        bpy.ops.object.camera_add()
        cam = bpy.context.active_object
        bpy.context.scene.camera = cam
    # Clear existing camera keyframes
    if cam.animation_data:
        cam.animation_data_clear()
    animate_camera(cam)
    bpy.ops.render.render(animation=True)
    print("Viewport render complete.")

main()

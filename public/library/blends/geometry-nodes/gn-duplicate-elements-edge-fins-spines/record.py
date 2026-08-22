"""
record.py — Viewport animation recorder for the Edge Fin Spike Sphere.
Blender 5.1 | CC0 | Holoflow Studio

Run AFTER blueprint.py.  Animates the camera in a 72° arc over 60 frames
while the spike sphere rotates 120°, producing a 2-second clip at 30 fps
that shows fins from multiple angles.  Output: viewport.mp4.

Usage (headless):
  blender --background gn_edge_fins.blend --python record.py
"""
import bpy
import math
import os

OUT_DIR  = "//../../videos/geometry-nodes/gn-duplicate-elements-edge-fins-spines/"
OUT_FILE = OUT_DIR + "viewport"
FPS      = 30
FRAMES   = 60      # 2 s

CAMERA_RADIUS = 4.5
CAMERA_TILT   = math.radians(20)    # elevation above equator

# Arc: camera sweeps -36° to +36° (72° total)
CAM_START_ANGLE = math.radians(-36)
CAM_END_ANGLE   = math.radians(36)

# Sphere rotates 120° over 60 frames to show fins on all faces
SPHERE_ROT_DEG = 120


def setup_render() -> None:
    sc = bpy.context.scene
    sc.render.engine          = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x    = 1920
    sc.render.resolution_y    = 1080
    sc.render.fps             = FPS
    sc.frame_start            = 1
    sc.frame_end              = FRAMES
    sc.render.image_settings.file_format  = 'FFMPEG'
    sc.render.ffmpeg.format   = 'MPEG4'
    sc.render.ffmpeg.codec    = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'HIGH'
    sc.render.filepath        = bpy.path.abspath(OUT_FILE)

    # EEVEE quality settings for a crisp viewport clip
    sc.eevee.taa_render_samples   = 64
    sc.eevee.use_bloom            = False
    sc.eevee.use_gtao             = True


def animate_camera() -> None:
    cam = bpy.data.objects.get("Camera")
    if cam is None:
        return

    cam.animation_data_create()
    action = bpy.data.actions.new("CameraOrbit")
    cam.animation_data.action = action

    for frame_idx in range(FRAMES + 1):
        t = frame_idx / FRAMES
        angle = CAM_START_ANGLE + (CAM_END_ANGLE - CAM_START_ANGLE) * t
        x = CAMERA_RADIUS * math.sin(angle)
        y = -CAMERA_RADIUS * math.cos(angle) * math.cos(CAMERA_TILT)
        z = CAMERA_RADIUS * math.sin(CAMERA_TILT)

        cam.location = (x, y, z)
        # Point camera at origin
        dx, dy, dz = -x, -y, -z
        pitch = math.atan2(dz, math.sqrt(dx*dx + dy*dy))
        yaw   = math.atan2(dx, -dy)
        cam.rotation_euler = (math.pi/2 - pitch, 0, yaw)

        frame = frame_idx + 1
        cam.keyframe_insert('location',       frame=frame)
        cam.keyframe_insert('rotation_euler', frame=frame)


def animate_sphere() -> None:
    obj = bpy.data.objects.get("spike_sphere")
    if obj is None:
        return

    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert('rotation_euler', frame=1)
    obj.rotation_euler = (0, 0, math.radians(SPHERE_ROT_DEG))
    obj.keyframe_insert('rotation_euler', frame=FRAMES)

    # Linear interpolation so rotation is constant-speed
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'


def ensure_output_dir() -> None:
    abs_path = bpy.path.abspath(OUT_DIR)
    os.makedirs(abs_path, exist_ok=True)


if __name__ == "__main__":
    setup_render()
    animate_camera()
    animate_sphere()
    ensure_output_dir()
    bpy.ops.render.render(animation=True)
    print(f"[holoflow] viewport.mp4 written → {bpy.path.abspath(OUT_FILE)}.mp4")

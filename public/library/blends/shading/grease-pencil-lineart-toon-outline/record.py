# record.py — viewport animation renderer
# Blender 5.1 | CC0
#
# Orbits the camera 360° around the toon sphere over 90 frames.
# The Line Art modifier rebuilds contour + crease strokes each frame as the
# camera position changes — demonstrating that the outline is view-dependent:
# the silhouette "rolls" around the sphere's surface, and which crease edges
# are front-visible vs back-visible flips as the camera orbits.
#
# Run after blueprint.py:
#   blender grease_pencil_lineart.blend --background --python record.py
#
# Output:
#   public/library/videos/shading/grease-pencil-lineart-toon-outline/viewport.mp4

import bpy
import math

BLEND_PATH = (
    "public/library/blends/shading/"
    "grease-pencil-lineart-toon-outline/grease_pencil_lineart.blend"
)
OUT_VIDEO = (
    "public/library/videos/shading/"
    "grease-pencil-lineart-toon-outline/viewport.mp4"
)

MESH_OBJ_NAME = "toon_sphere"
TOTAL_FRAMES  = 90
FPS           = 30
CAM_RADIUS    = 5.0    # orbit radius (world units)
CAM_HEIGHT    = 1.8    # camera Z elevation during orbit


def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.fps  = FPS

    scene.render.image_settings.file_format  = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = OUT_VIDEO

    cam_obj    = scene.camera
    target_obj = bpy.data.objects[MESH_OBJ_NAME]

    # Remove old Track-To constraint so we can set rotation via look-at each frame
    # (the constraint is fine at playback but we need manual control for keyframing)
    for c in list(cam_obj.constraints):
        if c.type == "TRACK_TO":
            cam_obj.constraints.remove(c)

    for frame in range(1, TOTAL_FRAMES + 1):
        t     = (frame - 1) / TOTAL_FRAMES
        angle = 2.0 * math.pi * t              # full 360° orbit

        # Camera spirals in a circle at fixed elevation
        cam_obj.location = (
            CAM_RADIUS * math.cos(angle),
            CAM_RADIUS * math.sin(angle),
            CAM_HEIGHT,
        )

        # Point at origin — delta vector → Euler via look-at decomposition
        dx = -cam_obj.location[0]
        dy = -cam_obj.location[1]
        dz = -cam_obj.location[2]
        # Azimuth angle (yaw)
        yaw   = math.atan2(dy, dx) + math.pi
        # Pitch angle (look-down)
        dist  = math.sqrt(dx * dx + dy * dy)
        pitch = math.atan2(-dz, dist) + math.pi
        cam_obj.rotation_euler = (pitch, 0.0, yaw)

        cam_obj.keyframe_insert("location",       frame=frame)
        cam_obj.keyframe_insert("rotation_euler", frame=frame)

    # Viewport render — GP strokes update each frame via Line Art evaluation
    bpy.ops.render.opengl(animation=True)
    print(f"✓ viewport animation → {OUT_VIDEO}")


if __name__ == "__main__":
    main()

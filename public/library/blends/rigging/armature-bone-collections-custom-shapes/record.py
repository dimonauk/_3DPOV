"""
record.py — Viewport animation render for armature-bone-collections-custom-shapes
Blender 5.1  ·  CC0  ·  Holoflow Studio

Run AFTER blueprint.py.  Animates the left arm through a simple raise-and-lower
arc while orbiting the camera 360°, producing a 10-second clip (240 frames @
24 fps) that shows the custom bone shapes responding to animation.

Output:
  public/library/videos/rigging/armature-bone-collections-custom-shapes/viewport.mp4

Technique: bpy.ops.render.opengl records the 3D Viewport in EEVEE — fast
enough for CI.  Pose keyframes are set in Pose mode via pose bone rotation
assignments; the camera orbit is driven by location keyframes on a camera object.
"""

import bpy
import math
import os


OUT_DIR    = "//../../videos/rigging/armature-bone-collections-custom-shapes/"
OUT_FILE   = "viewport"
FRAME_END  = 240
ORBIT_R    = 4.5
ORBIT_Z    = 1.4    # centre-of-interest height (mid-torso)
ORBIT_EYE_Z = 2.2  # camera elevation


def _ensure_dir() -> str:
    blend_dir = bpy.path.abspath("//")
    parts = [".."] * 2 + ["videos", "rigging",
                           "armature-bone-collections-custom-shapes"]
    out = os.path.join(blend_dir, *parts)
    os.makedirs(out, exist_ok=True)
    return bpy.path.relpath(out) + "/"


def _setup_render(out_dir: str) -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.filepath = out_dir + OUT_FILE
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format  = "MPEG4"
    scene.render.ffmpeg.codec   = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.resolution_x   = 1920
    scene.render.resolution_y   = 1080
    scene.render.resolution_percentage = 100
    scene.render.fps     = 24
    scene.frame_start    = 1
    scene.frame_end      = FRAME_END


def _orbit_camera() -> None:
    scene = bpy.context.scene

    # Reuse or create camera
    if "RecordCam" not in bpy.data.objects:
        cam_data = bpy.data.cameras.new("RecordCam")
        cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
        bpy.context.scene.collection.objects.link(cam_obj)
    else:
        cam_obj = bpy.data.objects["RecordCam"]

    scene.camera = cam_obj
    cam_obj.animation_data_clear()

    # Point camera at centre of rig (mid-torso)
    cam_obj.rotation_mode = 'XYZ'
    for fr in range(1, FRAME_END + 1):
        angle = 2 * math.pi * (fr - 1) / FRAME_END
        cam_obj.location.x = ORBIT_R * math.sin(angle)
        cam_obj.location.y = -ORBIT_R * math.cos(angle)
        cam_obj.location.z = ORBIT_EYE_Z

        # Point at centre of armature (approximate)
        dx = -cam_obj.location.x
        dy = -cam_obj.location.y
        dz = ORBIT_Z - cam_obj.location.z
        pitch = math.atan2(dz, math.sqrt(dx**2 + dy**2))
        yaw   = math.atan2(dx, dy)
        cam_obj.rotation_euler = (math.pi/2 - pitch, 0.0, yaw)

        cam_obj.keyframe_insert("location",       frame=fr)
        cam_obj.keyframe_insert("rotation_euler", frame=fr)


def _animate_arm() -> None:
    rig_obj = bpy.data.objects.get("RIG_character")
    if rig_obj is None:
        print("[record] RIG_character not found — skipping arm animation.")
        return

    bpy.context.view_layer.objects.active = rig_obj
    bpy.ops.object.mode_set(mode='POSE')

    pb = rig_obj.pose.bones.get("upper_arm.L")
    if pb is None:
        bpy.ops.object.mode_set(mode='OBJECT')
        return

    pb.rotation_mode = 'XYZ'
    pb.rotation_euler = (0, 0, 0)

    def _kf(frame: int, angle_z: float) -> None:
        scene = bpy.context.scene
        scene.frame_set(frame)
        pb.rotation_euler.z = angle_z
        pb.keyframe_insert("rotation_euler", frame=frame)

    # Rest → arm up → back to rest (full arc over 240 frames)
    _kf(1,   0.0)
    _kf(60, -math.pi * 0.4)   # arm starts rising
    _kf(120, math.pi * 0.55)  # arm fully raised overhead
    _kf(180, -math.pi * 0.1)  # on the way down
    _kf(240, 0.0)              # back to rest

    bpy.ops.object.mode_set(mode='OBJECT')


def main() -> None:
    out_dir = _ensure_dir()
    _setup_render(out_dir)
    _orbit_camera()
    _animate_arm()

    bpy.ops.render.render(animation=True, use_viewport=True)
    print(f"[record] viewport.mp4 written to {out_dir}")


if __name__ == "__main__":
    main()

"""
record.py — Viewport animation for blob_fusion.blend
=====================================================
Blender 5.1 headless render. Run AFTER blueprint.py has saved the .blend.

Animation: camera orbits 90° around the blob cluster over 90 frames while
the Threshold socket animates from 0.0 (isolated spheres) to 0.09 (fused blob).
Output: public/library/videos/geometry-nodes/gn-mesh-to-volume-sdf-blob-fusion/viewport.mp4

Usage:
  blender --background blob_fusion.blend --python record.py
"""

import bpy
import math
import pathlib

VIDEO_OUT  = pathlib.Path(
    "//../../../../videos/geometry-nodes/gn-mesh-to-volume-sdf-blob-fusion/viewport.mp4"
)
FRAME_START = 1
FRAME_END   = 90
FPS         = 30


def animate_threshold(carrier, tree):
    """
    Keyframe the Threshold socket: 0 → 0.09 over FRAME_END frames.
    WHY: Animating threshold from 0 to the fusion value shows, in one clip,
    both what the raw voxelized surface looks like (individual spheres) and
    the emergent blob merge (bridged spheres) — the key pedagogic moment.
    """
    for frame, value in ((FRAME_START, 0.0), (FRAME_END, 0.09)):
        bpy.context.scene.frame_set(frame)
        for sock in tree.interface.items_tree:
            if sock.name == "Threshold":
                sock.default_value = value
                sock.keyframe_insert("default_value", frame=frame)


def orbit_camera(cam, radius=5.5, z_offset=2.0):
    """Keyframe camera on a 90° arc around the world origin."""
    for frame in range(FRAME_START, FRAME_END + 1):
        t = (frame - FRAME_START) / max(FRAME_END - FRAME_START, 1)
        angle = math.radians(-45 + 90 * t)  # -45° → +45°
        cam.location.x = radius * math.sin(angle)
        cam.location.y = -radius * math.cos(angle)
        cam.location.z = z_offset
        # Aim at origin
        import mathutils
        direction = mathutils.Vector((0, 0, 0)) - cam.location
        rot = direction.to_track_quat("-Z", "Y")
        cam.rotation_euler = rot.to_euler()
        cam.keyframe_insert("location", frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)


def main():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath = str(VIDEO_OUT)
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720

    cam  = scene.camera
    blob = bpy.data.objects.get("blob_fusion")
    if not blob:
        raise RuntimeError("Run blueprint.py first to create blob_fusion object.")

    tree = blob.modifiers["BlobFusion"].node_group
    animate_threshold(blob, tree)
    orbit_camera(cam)

    bpy.ops.render.render(animation=True)
    print(f"[record] viewport.mp4 written → {VIDEO_OUT}")


if __name__ == "__main__":
    main()

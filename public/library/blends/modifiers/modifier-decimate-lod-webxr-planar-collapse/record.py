"""
record.py — Viewport animation for decimate_lod.blend
=====================================================
Blender 5.1 headless render. Run AFTER blueprint.py has saved the .blend.

Animation: 90 frames, 30 fps (3 seconds).
  Frames 1–30:   camera orbits left, all three objects at their decimated state.
  Frames 31–60:  Decimate Ratio on the blob animates from 0.12 → 1.0 (full mesh).
  Frames 61–90:  Ratio returns to 0.12 (decimated again).
The orbit + ratio change reveals the QEM Collapse quality gradient live.

Output:
  public/library/videos/modifiers/modifier-decimate-lod-webxr-planar-collapse/viewport.mp4

Usage:
  blender --background decimate_lod.blend --python record.py
"""

import bpy
import math
import pathlib

VIDEO_OUT   = pathlib.Path(
    "//../../../../videos/modifiers/"
    "modifier-decimate-lod-webxr-planar-collapse/viewport.mp4"
)
FRAME_START = 1
FRAME_END   = 90
FPS         = 30


def orbit_camera(cam: bpy.types.Object) -> None:
    """Keyframe camera on a 120° arc around the scene centre."""
    radius = 9.5
    z_pos  = 2.5
    for frame in range(FRAME_START, FRAME_END + 1):
        t     = (frame - FRAME_START) / max(FRAME_END - FRAME_START, 1)
        angle = math.radians(-60 + 120 * t)
        cam.location.x = radius * math.sin(angle)
        cam.location.y = -radius * math.cos(angle)
        cam.location.z = z_pos
        import mathutils
        direction = mathutils.Vector((0, 0, 0.8)) - cam.location
        rot = direction.to_track_quat('-Z', 'Y')
        cam.rotation_euler = rot.to_euler()
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)


def animate_collapse_ratio(blob: bpy.types.Object) -> None:
    """
    Keyframe the COLLAPSE Decimate Ratio on the organic blob.
    Animating from full mesh (1.0) back to target (0.12) shows in one clip:
      - what the original high-poly surface looks like (Ratio=1.0)
      - the dramatic triangle reduction of QEM Collapse (Ratio=0.12)
    This is the single most pedagogically useful animation for this tutorial.
    """
    dec = blob.modifiers.get("Decimate")
    if not dec or dec.decimate_type != 'COLLAPSE':
        print("[record] No Collapse modifier found on blob — skip ratio animation.")
        return

    keyframes = [
        (FRAME_START,      0.12),   # start: decimated
        (FRAME_START + 30, 1.00),   # mid:   full mesh
        (FRAME_END,        0.12),   # end:   decimated again
    ]
    for frame, ratio in keyframes:
        bpy.context.scene.frame_set(frame)
        dec.ratio = ratio
        dec.keyframe_insert("ratio", frame=frame)


def main() -> None:
    scene              = bpy.context.scene
    scene.frame_start  = FRAME_START
    scene.frame_end    = FRAME_END
    scene.render.fps   = FPS

    scene.render.image_settings.file_format     = "FFMPEG"
    scene.render.ffmpeg.format                  = "MPEG4"
    scene.render.ffmpeg.codec                   = "H264"
    scene.render.ffmpeg.constant_rate_factor    = "MEDIUM"
    scene.render.filepath                       = str(VIDEO_OUT)
    scene.render.resolution_x                   = 1280
    scene.render.resolution_y                   = 720

    cam  = scene.camera
    blob = bpy.data.objects.get("lod_blob_collapse")

    if not cam:
        raise RuntimeError("No camera in scene — run blueprint.py first.")
    if not blob:
        raise RuntimeError("lod_blob_collapse not found — run blueprint.py first.")

    orbit_camera(cam)
    animate_collapse_ratio(blob)

    bpy.ops.render.render(animation=True)
    print(f"[record] viewport.mp4 written → {VIDEO_OUT}")


if __name__ == "__main__":
    main()

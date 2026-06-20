"""
record.py — Viewport animation for panel_inset.blend
======================================================
Blender 5.1 headless render. Run AFTER blueprint.py has saved the .blend.

Animation: Panel Depth animates from 0.0 to 0.030 m over frames 1-60,
then Inner Depth rises from 0.0 to 0.014 m over frames 60-90. Camera
orbits 60° over the full 90-frame clip. The result demonstrates the
two-tier extrusion effect building up live — the key pedagogic moment.

Output:
  public/library/videos/geometry-nodes/gn-extrude-mesh-panel-inset-procedural/viewport.mp4

Usage:
  blender --background panel_inset.blend --python record.py
"""

import bpy
import math
import pathlib

VIDEO_OUT   = pathlib.Path(
    "//../../../../videos/geometry-nodes/"
    "gn-extrude-mesh-panel-inset-procedural/viewport.mp4"
)
FRAME_START = 1
FRAME_END   = 90
FPS         = 30


def get_gn_sock(obj: bpy.types.Object, name: str):
    """Return the named GN interface socket on PanelInset modifier."""
    mod = obj.modifiers.get("PanelInset")
    if mod is None:
        raise RuntimeError("PanelInset modifier not found — run blueprint.py first.")
    for sock in mod.node_group.interface.items_tree:
        if sock.name == name:
            return sock
    raise KeyError(f"Socket '{name}' not found in PanelInset node group.")


def keyframe_socket(sock, value: float, frame: int) -> None:
    sock.default_value = value
    sock.keyframe_insert("default_value", frame=frame)


def animate_depths(carrier: bpy.types.Object) -> None:
    """
    Panel Depth: 0.0 → 0.030  over frames 1-60
    Inner Depth: 0.0 → 0.014  over frames 60-90
    WHY staggered: first shows panels rising, then the inner tier appears —
    clearly separates the two extrusion passes for the viewer.
    """
    depth_sock = get_gn_sock(carrier, "Panel Depth")
    inner_sock = get_gn_sock(carrier, "Inner Depth")

    keyframe_socket(depth_sock, 0.0,   FRAME_START)
    keyframe_socket(depth_sock, 0.030, 60)
    keyframe_socket(depth_sock, 0.030, FRAME_END)

    keyframe_socket(inner_sock, 0.0,   FRAME_START)
    keyframe_socket(inner_sock, 0.0,   60)
    keyframe_socket(inner_sock, 0.014, FRAME_END)


def orbit_camera(cam: bpy.types.Object, radius: float = 3.8, z: float = 2.8) -> None:
    """Keyframe camera on a 60° arc from -30° to +30° around the Z axis."""
    import mathutils
    for frame in range(FRAME_START, FRAME_END + 1):
        t     = (frame - FRAME_START) / max(FRAME_END - FRAME_START, 1)
        angle = math.radians(-30 + 60 * t)
        cam.location.x = radius * math.sin(angle)
        cam.location.y = -radius * math.cos(angle)
        cam.location.z = z
        direction = mathutils.Vector((0, 0, 0.3)) - cam.location
        rot = direction.to_track_quat("-Z", "Y")
        cam.rotation_euler = rot.to_euler()
        cam.keyframe_insert("location",        frame=frame)
        cam.keyframe_insert("rotation_euler",  frame=frame)


def main() -> None:
    scene             = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    scene.render.image_settings.file_format    = "FFMPEG"
    scene.render.ffmpeg.format                 = "MPEG4"
    scene.render.ffmpeg.codec                  = "H264"
    scene.render.ffmpeg.constant_rate_factor   = "MEDIUM"
    scene.render.filepath                      = str(VIDEO_OUT)
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720

    carrier = bpy.data.objects.get("panel_inset")
    if carrier is None:
        raise RuntimeError("panel_inset object not found — run blueprint.py first.")

    animate_depths(carrier)
    orbit_camera(scene.camera)

    bpy.ops.render.render(animation=True)
    print(f"[record] viewport.mp4 written → {VIDEO_OUT}")


if __name__ == "__main__":
    main()

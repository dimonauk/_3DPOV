"""
record.py — Viewport animation render for gn-bevel-mesh-edge-angle-chamfer
Blender 5.1  ·  CC0  ·  Holoflow Studio

Animates the Chamfer Width modifier input from 0.001 m to 0.060 m and back,
then holds on a finished chamfered block rotating 360°.

Output: public/library/videos/geometry-nodes/gn-bevel-mesh-edge-angle-chamfer/viewport.mp4
Duration: 180 frames @ 30 fps = 6 seconds
  Frames   1–60 : chamfer width grows 0.001 → 0.060 m
  Frames  61–90 : chamfer width shrinks back to 0.025 m (default)
  Frames  91–180: block rotates 360° at default width
"""

import math
import bpy

OUTPUT_PATH = "//../../videos/geometry-nodes/gn-bevel-mesh-edge-angle-chamfer/viewport.mp4"
FRAME_END   = 180
FPS         = 30
OBJ_NAME    = "junction_block"
MOD_NAME    = "Chamfer"
WIDTH_MIN   = 0.001
WIDTH_MAX   = 0.060
WIDTH_DEF   = 0.025


def _ease_in_out(t: float) -> float:
    """Smoothstep easing 0→1."""
    return t * t * (3.0 - 2.0 * t)


def _set_chamfer_width(ob: bpy.types.Object, frame: int, value: float) -> None:
    mod = ob.modifiers.get(MOD_NAME)
    if mod is None:
        return
    # Blender 5.1: modifier inputs keyed via mod["Input_X"] where X is
    # the socket index on the GN group interface (0=Geometry, 1=Width, ...)
    # The Width socket is index 1 on the interface → key "Input_2" (1-based in DNA)
    key = None
    for k in mod.keys():
        if "Input" in k:
            try:
                if abs(float(mod[k]) - mod[k]) < 0.001:
                    key = k
                    break
            except Exception:
                pass
    # Fallback: iterate interface to find the float socket index
    ng = mod.node_group
    if ng:
        for i, item in enumerate(ng.interface.items_tree):
            if item.item_type == "SOCKET" and item.in_out == "INPUT" \
                    and item.socket_type == "NodeSocketFloat" \
                    and "Width" in item.name:
                ident = item.identifier  # e.g. "Socket_1"
                mod[ident] = value
                mod.keyframe_insert(data_path=f'["{ident}"]', frame=frame)
                return
    print(f"[record.py] Warning: could not key Chamfer Width at frame {frame}")


def main() -> None:
    scene = bpy.context.scene
    ob    = bpy.data.objects.get(OBJ_NAME)
    if ob is None:
        raise RuntimeError(
            "junction_block not found — run blueprint.py first."
        )

    scene.frame_start = 1
    scene.frame_end   = FRAME_END

    # ── Phase 1: width grow (frames 1–60) ───────────────────────────────────
    for f in range(1, 61):
        t = _ease_in_out((f - 1) / 59.0)
        w = WIDTH_MIN + t * (WIDTH_MAX - WIDTH_MIN)
        _set_chamfer_width(ob, f, w)

    # ── Phase 2: width return (frames 61–90) ────────────────────────────────
    for f in range(61, 91):
        t = _ease_in_out((f - 61) / 29.0)
        w = WIDTH_MAX + t * (WIDTH_DEF - WIDTH_MAX)
        _set_chamfer_width(ob, f, w)

    # ── Phase 3: 360° rotation (frames 91–180) ──────────────────────────────
    ob.rotation_euler = (0.0, 0.0, 0.0)
    ob.keyframe_insert(data_path="rotation_euler", frame=91)
    ob.rotation_euler = (0.0, 0.0, math.radians(360.0))
    ob.keyframe_insert(data_path="rotation_euler", frame=180)

    # Make rotation LINEAR (no easing)
    if ob.animation_data and ob.animation_data.action:
        for fc in ob.animation_data.action.fcurves:
            if "rotation" in fc.data_path:
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"

    # ── Render settings ──────────────────────────────────────────────────────
    rnd = scene.render
    rnd.filepath          = OUTPUT_PATH
    rnd.resolution_x      = 1280
    rnd.resolution_y      = 720
    rnd.fps               = FPS
    rnd.image_settings.file_format  = "FFMPEG"
    rnd.ffmpeg.format               = "MPEG4"
    rnd.ffmpeg.codec                = "H264"
    rnd.ffmpeg.constant_rate_factor = "MEDIUM"

    scene.render.engine = "BLENDER_EEVEE_NEXT"

    bpy.ops.render.render(animation=True)
    print(f"[Holoflow] record.py → {OUTPUT_PATH}")


main()

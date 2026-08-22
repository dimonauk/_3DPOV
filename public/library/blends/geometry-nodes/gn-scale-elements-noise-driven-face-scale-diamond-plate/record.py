"""
record.py — Viewport animation for GN Scale Elements Diamond Plate (Blender 5.1)

Animates the 'Scale Min' group-input socket from 1.0 (flat grid, no gaps) down
to SCALE_MIN (full diamond-plate texture) over 150 frames (≈6 s at 24 fps).
Renders via bpy.ops.render.opengl(animation=True) to:
  public/library/videos/geometry-nodes/gn-scale-elements-noise-driven-face-scale-diamond-plate/viewport.mp4

Run inside Blender 5.1: open the Scripting workspace, paste/open this file,
press Alt+P. Requires blueprint.py to have been run first so the .blend exists,
OR run blueprint.run() inline before _animate().
"""

import bpy
import math
from pathlib import Path
import sys

# ── Paths ──────────────────────────────────────────────────────────────────────
BLEND_FILE  = Path(bpy.path.abspath("//")) / "output" / \
              "gn-scale-elements-noise-driven-face-scale-diamond-plate" / \
              "diamond_plate.blend"
OUTPUT_DIR  = Path(bpy.path.abspath("//")) / \
              "public" / "library" / "videos" / "geometry-nodes" / \
              "gn-scale-elements-noise-driven-face-scale-diamond-plate"
OUTPUT_MP4  = str(OUTPUT_DIR / "viewport.mp4")

SCALE_MIN   = 0.52
SCALE_MAX   = 0.97
FRAMES      = 150   # 6.25 s at 24 fps
HOLD_IN     = 24    # frames at Scale Min = 1.0 (grid looks flat)
ANIM_START  = 30    # start of shrink animation
ANIM_END    = 120   # scale reaches SCALE_MIN
HOLD_OUT    = 150   # hold final state until last frame


def _setup_render():
    scene = bpy.context.scene
    scene.render.fps          = 24
    scene.frame_start         = 1
    scene.frame_end           = FRAMES
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format              = 'MPEG4'
    scene.render.ffmpeg.codec               = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.filepath     = OUTPUT_MP4
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720


def _find_scale_min_socket(mod: bpy.types.NodesModifier) -> str | None:
    """
    Return the socket identifier for the 'Scale Min' group input.
    The identifier (e.g. 'Socket_4') is stable after tree construction.
    """
    tree = mod.node_group
    for item in tree.interface.items_tree:
        if item.name == "Scale Min" and item.in_out == 'INPUT':
            return item.identifier
    return None


def _animate():
    # ── Open the saved .blend from blueprint.py ───────────────────────────────
    if not BLEND_FILE.exists():
        # Build inline if not already saved
        sys.path.insert(0, str(BLEND_FILE.parent.parent.parent.parent / "blends" /
                               "geometry-nodes" /
                               "gn-scale-elements-noise-driven-face-scale-diamond-plate"))
        import blueprint  # type: ignore
        blueprint.run()
    else:
        bpy.ops.wm.open_mainfile(filepath=str(BLEND_FILE))

    obj = bpy.data.objects.get("diamond_plate")
    if obj is None:
        raise RuntimeError("diamond_plate object not found — run blueprint.py first.")

    mod = next((m for m in obj.modifiers if m.type == 'NODES'), None)
    if mod is None:
        raise RuntimeError("No NODES modifier on diamond_plate.")

    sid = _find_scale_min_socket(mod)
    if sid is None:
        raise RuntimeError("'Scale Min' socket not found in GN tree interface.")

    # ── Keyframe Scale Min: 1.0 (flat) → SCALE_MIN (panels) ──────────────────
    scene = bpy.context.scene

    def key(frame, value):
        scene.frame_set(frame)
        mod[sid] = value
        mod.keyframe_insert(data_path=f'["{sid}"]', frame=frame)

    key(1,          1.0)       # fully flat — no gaps at all
    key(HOLD_IN,    1.0)       # hold flat
    key(ANIM_END,   SCALE_MIN) # shrink to diamond-plate
    key(HOLD_OUT,   SCALE_MIN) # hold final

    # Smooth the F-Curve
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
            kp.handle_left_type  = 'AUTO_CLAMPED'
            kp.handle_right_type = 'AUTO_CLAMPED'

    # ── Render ────────────────────────────────────────────────────────────────
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    _setup_render()

    # Viewport render captures the GN modifier in real time
    bpy.ops.render.opengl(animation=True, write_still=False)
    print(f"[record] viewport.mp4 → {OUTPUT_MP4}")


if __name__ == "__main__":
    _animate()

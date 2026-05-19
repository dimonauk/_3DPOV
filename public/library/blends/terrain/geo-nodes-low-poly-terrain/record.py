"""
Holoflow Studio — Viewport Recording Script
Terrain · geo-nodes-low-poly-terrain · Blender 5.1

Run AFTER blueprint.py has created the terrain object.
Animates the Height Scale slider from 0 → 2 → 2 over 90 frames,
showing the terrain rising from flat to full height.
Output: public/library/videos/terrain/geo-nodes-low-poly-terrain/viewport.mp4

Usage:
  1. Open the .blend produced by blueprint.py (or run blueprint.py first).
  2. Open this file in the Scripting workspace.
  3. Set render output path (OUTPUT_DIR below) to match your local clone.
  4. Alt+R to run.  Blender renders 90 viewport frames → mp4 automatically.
"""

import bpy
from pathlib import Path

# ── CONFIG ─────────────────────────────────────────────────────────────
OUTPUT_DIR  = "//../../videos/terrain/geo-nodes-low-poly-terrain/"
OBJECT_NAME = "terrain_low_poly"
MODIFIER_ID = "HoloflowTerrain"
FRAME_START = 1
FRAME_END   = 90
FPS         = 30
# Height Scale keyframe values: (frame, value)
HEIGHT_KEYFRAMES = [
    (1,  0.0),   # start flat — audience sees the grid
    (30, 2.0),   # rise to full terrain over 1 second
    (90, 2.0),   # hold finished state for 2 seconds
]


# ── ANIMATION ──────────────────────────────────────────────────────────

def keyframe_height(obj: bpy.types.Object) -> None:
    """
    Insert keyframes on the GN modifier's Height Scale input.
    The modifier panel slider maps to mod.node_group.interface_socket at
    index 1 (second INPUT socket after Geometry).  In 5.x, the value
    lives at mod["Input_1"] in the modifier's data block — Blender names
    GN inputs "Input_N" internally even though the panel shows the
    human-readable label.

    If the socket index shifts (e.g. after a node tree edit), inspect
    mod.keys() in the Python console to find the correct key.
    """
    mod = obj.modifiers.get(MODIFIER_ID)
    if mod is None:
        raise RuntimeError(f"Modifier '{MODIFIER_ID}' not found on '{obj.name}'.")

    # Resolve the internal key for Height Scale (index 1, after Geometry)
    # In Blender 5.x, interface sockets are numbered from 1 for non-geometry
    height_key = "Input_1"

    scene = bpy.context.scene
    for frame, value in HEIGHT_KEYFRAMES:
        scene.frame_set(frame)
        mod[height_key] = value
        mod.keyframe_insert(data_path=f'["{height_key}"]', frame=frame)

    print(f"[HF-rec] Keyframed Height Scale on '{obj.name}'.")


def configure_render() -> None:
    """
    Set viewport render settings for a clean 10-15 second capture.
    EEVEE Next is the default in Blender 5.x — fast enough for interactive
    viewport capture without a full Cycles pass.
    """
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    scene.render.engine             = 'BLENDER_EEVEE_NEXT'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format      = 'MPEG4'
    scene.render.ffmpeg.codec       = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.resolution_x       = 1920
    scene.render.resolution_y       = 1080
    scene.render.resolution_percentage = 100

    out = bpy.path.abspath(OUTPUT_DIR)
    Path(out).mkdir(parents=True, exist_ok=True)
    scene.render.filepath = out + "viewport"

    # Isometric-ish view — shows the terrain's faceted silhouette clearly
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            space = area.spaces.active
            space.shading.type           = 'MATERIAL'   # show material colour
            space.shading.show_backface_culling = False
            r3d = space.region_3d
            r3d.view_perspective = 'ORTHO'
            # 45° overhead angle in Euler; readable for terrain height demo
            import math
            from mathutils import Euler
            r3d.view_rotation = Euler((math.radians(55), 0, math.radians(45)), 'XYZ').to_quaternion()
            r3d.view_distance = 18.0
            break

    print(f"[HF-rec] Render configured → {out}viewport.mp4")


def render_animation() -> None:
    bpy.ops.render.opengl(animation=True)
    print("[HF-rec] Render complete.")


# ── ENTRY POINT ────────────────────────────────────────────────────────

def main() -> None:
    obj = bpy.data.objects.get(OBJECT_NAME)
    if obj is None:
        raise RuntimeError(
            f"Object '{OBJECT_NAME}' not found. Run blueprint.py first."
        )

    keyframe_height(obj)
    configure_render()
    render_animation()


main()

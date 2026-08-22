"""
record.py — Viewport animation recorder for gn-distribute-points-ground-cover-scatter
Blender 5.1  |  Run AFTER blueprint.py  |  CC0 / Holoflow Studio
=================================================================================
Animates density from 0 → full over frames 1–60 so the scatter visibly
populates the ground plane, then holds for 30 frames as the camera arc.
Output: public/library/videos/geometry-nodes/gn-distribute-points-ground-cover-scatter/viewport.mp4
Duration: ~3 s at 30 fps.
"""

import bpy
import math
import os
from pathlib import Path
from mathutils import Euler

# ── Output path ───────────────────────────────────────────────────────────────
REPO_ROOT    = Path(__file__).resolve().parents[5]
OUTPUT_PATH  = str(REPO_ROOT / "public" / "library" / "videos" /
                   "geometry-nodes" / "gn-distribute-points-ground-cover-scatter" /
                   "viewport.mp4")
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

FPS          = 30
TOTAL_FRAMES = 90   # 3 seconds: 0→density ramp (60f) + hold + arc (30f)


def find_modifier(ground: bpy.types.Object) -> bpy.types.Modifier | None:
    for mod in ground.modifiers:
        if mod.type == 'NODES':
            return mod
    return None


def animate_density(ground: bpy.types.Object) -> None:
    """
    Drive the Density Max input of the Distribute node via a GN modifier
    socket.  In Blender 5.1 the modifier exposes GN inputs as ID properties
    on the modifier, accessible via mod[socket_identifier].
    We animate "Input_3" which corresponds to the Density Max socket
    (index determined by socket order in the interface at build time).
    As a fallback we animate via fcurves on the modifier's RNA path.
    """
    mod = find_modifier(ground)
    if mod is None:
        print("WARN: no NODES modifier found on ground; skipping density anim.")
        return

    # Locate the Density Max socket identifier
    tree = mod.node_group
    density_id = None
    for s in tree.interface.items_tree:
        if "Density Max" in getattr(s, 'name', ''):
            density_id = s.identifier
            break

    if density_id:
        # Frame 1: density = 0
        mod[density_id] = 0.0
        mod.keyframe_insert(data_path=f'["{density_id}"]', frame=1)
        # Frame 60: full density
        mod[density_id] = 12.0
        mod.keyframe_insert(data_path=f'["{density_id}"]', frame=60)
        # Frame 90: hold
        mod.keyframe_insert(data_path=f'["{density_id}"]', frame=TOTAL_FRAMES)
    else:
        print("WARN: Density Max socket not found; density animation skipped.")


def animate_camera() -> None:
    """Slow arc around the scatter field from frame 1 to TOTAL_FRAMES."""
    cam_ob = bpy.context.scene.camera
    if cam_ob is None:
        return
    cam_ob.animation_data_create()
    radius  = 3.2
    height  = 2.0
    arc_deg = 40    # swing ±20° around centre
    for frame, angle_offset in [(1, -arc_deg / 2), (TOTAL_FRAMES, arc_deg / 2)]:
        a = math.radians(angle_offset - 90)   # start behind plane
        cam_ob.location = (radius * math.cos(a), radius * math.sin(a), height)
        # Point towards origin
        dx = -cam_ob.location.x
        dy = -cam_ob.location.y
        yaw   = math.atan2(dx, -dy)
        pitch = math.atan2(height, radius) * -1 + math.pi / 2
        cam_ob.rotation_euler = Euler((pitch, 0, yaw))
        cam_ob.keyframe_insert(data_path="location",       frame=frame)
        cam_ob.keyframe_insert(data_path="rotation_euler", frame=frame)

    # Smooth interpolation
    for fc in cam_ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'


def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine          = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = 32   # fast for preview video
    scene.render.resolution_x    = 1920
    scene.render.resolution_y    = 1080
    scene.render.fps              = FPS
    scene.frame_start             = 1
    scene.frame_end               = TOTAL_FRAMES
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format    = 'MPEG4'
    scene.render.ffmpeg.codec     = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.filepath         = OUTPUT_PATH


def main() -> None:
    # Expect blueprint.py was run first; find GroundPlane
    ground = bpy.data.objects.get("GroundPlane")
    if ground is None:
        print("ERROR: GroundPlane not found. Run blueprint.py first.")
        return

    animate_density(ground)
    animate_camera()
    configure_render()
    bpy.ops.render.render(animation=True, write_still=False)
    print(f"Viewport animation written to:\n  {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

"""
record.py — Viewport animation for GN Volume Cube Procedural Cumulus Cloud
Blender 5.1  ·  CC0  ·  Holoflow Studio

Animates the cloud formation by keyframing the threshold Map Range's "From Min"
from 0.90 → 0.45 over 60 frames.  At frame 1 the threshold is so high that only
the densest noise peaks exceed it — a handful of wispy cores.  By frame 60 the
threshold drops to its final value and the full cumulus silhouette is visible.
Output: public/library/videos/geometry-nodes/gn-volume-cube-procedural-cloud/viewport.mp4
"""

import bpy
import sys
import os

FRAME_START = 1
FRAME_END   = 60
FPS         = 24

# Threshold animation: high → low (cloud forms from thin wisps)
THRESHOLD_START = 0.88
THRESHOLD_END   = 0.45

OUTPUT_DIR  = "public/library/videos/geometry-nodes/gn-volume-cube-procedural-cloud"
OUTPUT_FILE = "viewport"


def _find_threshold_node(ng: bpy.types.NodeTree) -> bpy.types.Node | None:
    """Returns the second Map Range node (the threshold one, not the altitude ramp)."""
    map_range_nodes = [n for n in ng.nodes if n.type == "MAP_RANGE"]
    # The threshold node has To Min = 0.0 and To Max = 1.0 with From Min = DENSITY_THRESHOLD
    for n in map_range_nodes:
        if abs(n.inputs["To Min"].default_value) < 0.01:
            return n
    return None


def _keyframe_threshold(ng: bpy.types.NodeTree) -> None:
    thr = _find_threshold_node(ng)
    if thr is None:
        print("[record] ERROR: could not locate threshold Map Range node")
        return

    scene = bpy.context.scene

    scene.frame_set(FRAME_START)
    thr.inputs["From Min"].default_value = THRESHOLD_START
    thr.inputs["From Min"].keyframe_insert("default_value", frame=FRAME_START)

    scene.frame_set(FRAME_END)
    thr.inputs["From Min"].default_value = THRESHOLD_END
    thr.inputs["From Min"].keyframe_insert("default_value", frame=FRAME_END)

    # Ease-in: smooth interpolation from sparse wisps to full cloud body
    for fc in ng.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"


def _place_camera() -> None:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    # Slightly elevated front-quarter view
    cam_obj.location  = (7.0, -6.0, 3.5)
    cam_obj.rotation_euler = (1.15, 0.0, 0.82)
    cam_data.lens = 50
    bpy.context.scene.camera = cam_obj


def _place_sun() -> None:
    sun_data = bpy.data.lights.new("RecordSun", "SUN")
    sun_data.energy = 6.0
    sun_data.angle  = 0.05   # sharp sun disc
    sun_obj  = bpy.data.objects.new("RecordSun", sun_data)
    bpy.context.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (0.5, 0.3, 0.7)


def _configure_render(out_path: str) -> None:
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS

    scene.render.engine          = "CYCLES"
    scene.cycles.samples         = 32   # low for speed; raise to 128 for final
    scene.cycles.use_denoising   = True

    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.filepath     = out_path


def record() -> None:
    # Build the scene using the blueprint
    blueprint_dir = os.path.dirname(os.path.abspath(__file__))
    if blueprint_dir not in sys.path:
        sys.path.insert(0, blueprint_dir)
    import blueprint
    blueprint.build()

    cloud_obj = bpy.data.objects.get(blueprint.OBJ_NAME)
    if cloud_obj is None:
        print("[record] ERROR: cloud object not found after blueprint.build()")
        return

    mod = cloud_obj.modifiers.get("CumulusCloud")
    if mod is None or mod.node_group is None:
        print("[record] ERROR: CumulusCloud GN modifier not found")
        return

    ng = mod.node_group
    _keyframe_threshold(ng)
    _place_camera()
    _place_sun()

    blend_root = bpy.path.abspath("//").rstrip("/\\")
    output_abs = os.path.join(blend_root, "..", "..", "..", "..", OUTPUT_DIR, OUTPUT_FILE)
    os.makedirs(os.path.dirname(output_abs), exist_ok=True)
    _configure_render(output_abs)

    bpy.ops.render.render(animation=True, write_still=False)
    print(f"[record] animation written to {output_abs}")


if __name__ == "__main__":
    record()

"""
Halvorsen Attractor — Viewport Recording Script
================================================
Blender 5.1 | CC0 | Holoflow Studio

Run blueprint.py first to build the Halvorsen_Attractor collection.
This script then:
  1. Places a circling camera
  2. Animates shape-key value 0 → 1 → 0 across 180 frames (alpha_1.4 morph)
  3. Renders an EEVEE viewport animation to viewport.mp4

Output path mirrors the library videos directory convention:
  public/library/videos/scripting/<slug>/viewport.mp4
Run from the project root (Blender is given the path via bpy.data.filepath
or you set OUTPUT_PATH manually below).
"""

import bpy
import math
from pathlib import Path

# ── config ─────────────────────────────────────────────────────────────────
FRAMES      = 180           # 180 f / 24 fps ≈ 7.5 s
FPS         = 24
CAMERA_DIST = 4.2           # distance from attractor centroid
MORPH_KEY   = "alpha_1.4"  # shape key to animate

SLUG = "python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr"
OUTPUT_PATH = str(
    Path(bpy.data.filepath).parents[4]  # project root
    / "public" / "library" / "videos" / "scripting" / SLUG / "viewport.mp4"
    if bpy.data.filepath
    else Path("/tmp/hf_halvorsen_viewport.mp4")
)


# ── scene ──────────────────────────────────────────────────────────────────

def setup_render():
    scene = bpy.context.scene
    scene.render.engine    = "BLENDER_EEVEE_NEXT"
    scene.render.fps       = FPS
    scene.frame_start      = 1
    scene.frame_end        = FRAMES
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.filepath  = OUTPUT_PATH
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080


def add_camera():
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 35.0
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    return cam_obj


def keyframe_camera(cam_obj, n_frames, radius, height_range=(0.3, 0.8)):
    """Circle the camera; insert location + track-to keyframes."""
    for f in range(1, n_frames + 1):
        t    = (f - 1) / (n_frames - 1)
        angle = 2.0 * math.pi * t
        x = radius * math.cos(angle)
        y = radius * math.sin(angle)
        z = height_range[0] + (height_range[1] - height_range[0]) * abs(math.sin(math.pi * t))
        cam_obj.location = (x, y, z)
        cam_obj.keyframe_insert("location", frame=f)
    # Track-to constraint pointing at attractor centroid
    cns = cam_obj.constraints.new("TRACK_TO")
    cns.target  = bpy.data.objects.get("arm_A") or list(bpy.context.scene.objects)[-1]
    cns.track_axis  = "TRACK_NEGATIVE_Z"
    cns.up_axis     = "UP_Y"


def add_world_light():
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value   = (0.01, 0.01, 0.02, 1.0)
        bg.inputs["Strength"].default_value = 0.1


def keyframe_shape_keys(n_frames, key_name):
    """Animate shape key influence: ramp up at 25%, full at 50%, back to 0 at 100%."""
    arm_objs = [o for o in bpy.context.scene.objects if o.type == "CURVE"]
    for obj in arm_objs:
        if obj.data.shape_keys is None:
            continue
        kb = obj.data.shape_keys.key_blocks.get(key_name)
        if kb is None:
            continue
        timeline = {
            1:             0.0,
            n_frames // 4: 0.0,
            n_frames // 2: 1.0,
            n_frames:      0.0,
        }
        for frame, val in timeline.items():
            kb.value = val
            kb.keyframe_insert("value", frame=frame)


def main():
    setup_render()
    cam = add_camera()
    add_world_light()
    keyframe_camera(cam, FRAMES, CAMERA_DIST)
    keyframe_shape_keys(FRAMES, MORPH_KEY)

    print(f"[record.py] Rendering {FRAMES} frames → {OUTPUT_PATH}")
    bpy.ops.render.render(animation=True)
    print("[record.py] Done.")


main()

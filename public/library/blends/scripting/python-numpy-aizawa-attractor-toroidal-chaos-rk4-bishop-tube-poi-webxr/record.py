# SPDX-License-Identifier: CC0-1.0
"""
Aizawa Attractor — Viewport Recording Script
============================================
Blender 5.1 | CC0 | Holoflow Studio

Run blueprint.py first to build the Aizawa_Attractor object.
This script then:
  1. Places a circling camera on a helical path
  2. Animates the SK_e0 shape key 0→1→0 to morph the tangle
  3. Renders an EEVEE viewport animation → viewport.mp4 (10 s at 24 fps)

Output mirrors library video convention:
  public/library/videos/scripting/<slug>/viewport.mp4
"""

import bpy
import math
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────────
FRAMES      = 240           # 240 f / 24 fps = 10 s
FPS         = 24
CAM_RADIUS  = 1.6           # metres from attractor centroid
CAM_HEIGHT  = (-0.10, 0.55) # z-range for helical spiral
MORPH_KEY   = "SK_e0"       # shape key to demonstrate

SLUG = "python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr"
OUTPUT_PATH = str(
    Path(bpy.data.filepath).parents[4]
    / "public" / "library" / "videos" / "scripting" / SLUG / "viewport.mp4"
    if bpy.data.filepath
    else Path("/tmp/hf_aizawa_viewport.mp4")
)


# ── Render settings ────────────────────────────────────────────────────────

def _setup_render():
    sc = bpy.context.scene
    sc.render.engine   = "BLENDER_EEVEE_NEXT"
    sc.render.fps      = FPS
    sc.frame_start     = 1
    sc.frame_end       = FRAMES
    sc.render.image_settings.file_format    = "FFMPEG"
    sc.render.ffmpeg.format                 = "MPEG4"
    sc.render.ffmpeg.codec                  = "H264"
    sc.render.ffmpeg.constant_rate_factor   = "MEDIUM"
    sc.render.filepath      = OUTPUT_PATH
    sc.render.resolution_x  = 1920
    sc.render.resolution_y  = 1080
    # Bloom on for emission glow
    sc.eevee.use_bloom      = True
    sc.eevee.bloom_threshold = 0.4
    sc.eevee.bloom_intensity = 0.6


# ── World ──────────────────────────────────────────────────────────────────

def _black_world():
    world = bpy.context.scene.world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.0, 0.0, 0.0, 1.0)
        bg.inputs["Strength"].default_value = 0.0


# ── Camera ─────────────────────────────────────────────────────────────────

def _add_camera():
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 40.0
    cam_obj = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    return cam_obj


def _keyframe_camera(cam_obj, n_frames, radius, z_range):
    """Helical orbit: one full revolution + mild z oscillation."""
    for f in range(1, n_frames + 1):
        t     = (f - 1) / max(n_frames - 1, 1)
        angle = 2.0 * math.pi * t
        z     = z_range[0] + (z_range[1] - z_range[0]) * (0.5 - 0.5 * math.cos(math.pi * t))
        cam_obj.location = (
            radius * math.cos(angle),
            radius * math.sin(angle),
            z,
        )
        cam_obj.keyframe_insert("location", frame=f)

    # Track-to constraint aimed at world origin (attractor centroid)
    empty = bpy.data.objects.new("CamTarget", None)
    empty.location = (0.0, 0.0, 0.0)
    bpy.context.scene.collection.objects.link(empty)
    cns = cam_obj.constraints.new("TRACK_TO")
    cns.target     = empty
    cns.track_axis = "TRACK_NEGATIVE_Z"
    cns.up_axis    = "UP_Y"


# ── Shape key animation ────────────────────────────────────────────────────

def _animate_shape_key(key_name, n_frames):
    """Animate shape key: 0 at f=1, peak 1.0 at f=n/2, back 0 at f=n."""
    obj = bpy.data.objects.get("Aizawa_Attractor")
    if obj is None or obj.data.shape_keys is None:
        print(f"[record] Object or shape keys not found — skipping morph")
        return
    kb = obj.data.shape_keys.key_blocks.get(key_name)
    if kb is None:
        print(f"[record] Shape key '{key_name}' not found")
        return

    mid = n_frames // 2
    for frame, val in [(1, 0.0), (mid, 1.0), (n_frames, 0.0)]:
        kb.value = val
        kb.keyframe_insert("value", frame=frame)


# ── Main ───────────────────────────────────────────────────────────────────

def record():
    _setup_render()
    _black_world()
    cam = _add_camera()
    _keyframe_camera(cam, FRAMES, CAM_RADIUS, CAM_HEIGHT)
    _animate_shape_key(MORPH_KEY, FRAMES)
    bpy.ops.render.render(animation=True)
    print(f"[record] Viewport animation rendered → {OUTPUT_PATH}")


if __name__ == "__main__":
    record()

# SPDX-License-Identifier: CC0-1.0
"""
Thomas Attractor — Viewport Recording Script
============================================
Blender 5.1 | CC0 | Holoflow Studio

Run blueprint.py first to build the Thomas_Attractor object.
This script then:
  1. Places a circling camera on a helical arc
  2. Animates the SK_Dense shape key 0→1→0 to show the labyrinth fill
  3. Renders an EEVEE Next viewport animation → viewport.mp4 (10 s at 24 fps)

Output convention:
  public/library/videos/scripting/<slug>/viewport.mp4
"""

import bpy
import math
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────────
FRAMES      = 240            # 240 f / 24 fps = 10 s
FPS         = 24
CAM_RADIUS  = 1.8            # metres from attractor centroid
CAM_HEIGHT  = (-0.15, 0.50)  # z-range for helical spiral (attractor is compact)
MORPH_KEY   = "SK_Dense"     # shape key demonstrated in the recording

SLUG = ("python-numpy-thomas-cyclically-symmetric-attractor"
        "-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr")

OUTPUT_PATH = str(
    Path(bpy.data.filepath).parents[4]
    / "public" / "library" / "videos" / "scripting" / SLUG / "viewport.mp4"
    if bpy.data.filepath
    else Path("/tmp/hf_thomas_viewport.mp4")
)


# ── Render settings ─────────────────────────────────────────────────────────
def _setup_render():
    sc = bpy.context.scene
    sc.render.engine          = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x    = 1920
    sc.render.resolution_y    = 1080
    sc.render.fps             = FPS
    sc.frame_start            = 1
    sc.frame_end              = FRAMES
    sc.render.filepath        = OUTPUT_PATH
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format   = 'MPEG4'
    sc.render.ffmpeg.codec    = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'

    # World: pure black background so the emission glow reads clearly
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0, 0, 0, 1)
        bg.inputs['Strength'].default_value = 0.0

    # EEVEE bloom
    sc.eevee.use_bloom = True
    sc.eevee.bloom_threshold = 0.80
    sc.eevee.bloom_intensity = 0.60


# ── Camera orbit ────────────────────────────────────────────────────────────
def _setup_camera():
    """Helical orbit camera: circles the attractor while rising then falling."""
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    cam_obj.rotation_mode = 'XYZ'
    z_lo, z_hi = CAM_HEIGHT

    for f in range(1, FRAMES + 1):
        t = (f - 1) / (FRAMES - 1)          # 0 → 1
        angle = 2 * math.pi * t * 1.5       # 1.5 full revolutions

        # Helical height: rise then fall
        z_frac = 4 * t * (1 - t)            # parabola 0→1→0
        z = z_lo + (z_hi - z_lo) * z_frac

        x = CAM_RADIUS * math.cos(angle)
        y = CAM_RADIUS * math.sin(angle)
        cam_obj.location = (x, y, z)

        # Point at origin (attractor centroid)
        dx, dy, dz = -x, -y, -z
        horiz = math.sqrt(dx**2 + dy**2)
        cam_obj.rotation_euler = (
            math.atan2(horiz, -dz) - math.pi / 2,
            0,
            math.atan2(dx, -dy),
        )
        cam_obj.keyframe_insert(data_path="location",       frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)


# ── Shape-key animation ─────────────────────────────────────────────────────
def _animate_morph():
    """Drive SK_Dense 0→1→0 over the full clip to show the denser labyrinth."""
    obj = bpy.data.objects.get("Thomas_Attractor")
    if obj is None or obj.data.shape_keys is None:
        print("[record] Thomas_Attractor not found — run blueprint.py first",
              flush=True)
        return
    kb = obj.data.shape_keys.key_blocks.get(MORPH_KEY)
    if kb is None:
        print(f"[record] shape key {MORPH_KEY} not found", flush=True)
        return

    def _kf(val, frame):
        kb.value = val
        kb.keyframe_insert(data_path="value", frame=frame)

    _kf(0.0, 1)
    _kf(0.0, 40)        # hold canonical at start
    _kf(1.0, 120)       # fully morphed to dense labyrinth at mid-point
    _kf(1.0, 160)       # brief hold to appreciate the difference
    _kf(0.0, 240)       # return to canonical


# ── Entry point ─────────────────────────────────────────────────────────────
def main():
    _setup_render()
    _setup_camera()
    _animate_morph()
    print(f"[record] Output → {OUTPUT_PATH}", flush=True)
    bpy.ops.render.render(animation=True)
    print("[record] Render complete.", flush=True)


main()

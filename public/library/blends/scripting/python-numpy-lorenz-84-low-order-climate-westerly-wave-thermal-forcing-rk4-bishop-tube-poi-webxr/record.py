# SPDX-License-Identifier: CC0-1.0
"""
Lorenz 84 — Viewport Recording Script
======================================
Blender 5.1 | CC0 | Holoflow Studio

Run blueprint.py first to build Lorenz84_Poi.
This script then:
  1. Places a circling camera on a helical arc
  2. Animates shape-key morphs to sweep through the dynamical regimes
  3. Renders EEVEE Next → viewport.mp4 (10 s at 24 fps)

Output:
  public/library/videos/scripting/<slug>/viewport.mp4
"""

import bpy
import math
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────
FRAMES      = 240           # 24 fps × 10 s
FPS         = 24
CAM_RADIUS  = 1.40          # orbit radius, metres
CAM_HEIGHT  = (-0.06, 0.42) # z-arc start → peak

SLUG = (
    "python-numpy-lorenz-84-low-order-climate-westerly-wave-"
    "thermal-forcing-rk4-bishop-tube-poi-webxr"
)
OUTPUT_PATH = str(
    Path(bpy.data.filepath).parents[4]
    / "public" / "library" / "videos" / "scripting" / SLUG / "viewport.mp4"
    if bpy.data.filepath
    else Path("/tmp/hf_lorenz84_viewport.mp4")
)


# ── Render settings ───────────────────────────────────────────────────────
def _setup_render():
    sc = bpy.context.scene
    sc.render.engine  = "BLENDER_EEVEE_NEXT"
    sc.render.fps     = FPS
    sc.frame_start    = 1
    sc.frame_end      = FRAMES
    sc.render.image_settings.file_format   = "FFMPEG"
    sc.render.ffmpeg.format                = "MPEG4"
    sc.render.ffmpeg.codec                 = "H264"
    sc.render.ffmpeg.constant_rate_factor  = "MEDIUM"
    sc.render.filepath     = OUTPUT_PATH
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.eevee.use_bloom         = True
    sc.eevee.bloom_threshold   = 0.36
    sc.eevee.bloom_intensity   = 0.55


# ── World ─────────────────────────────────────────────────────────────────
def _black_world():
    w = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.01, 0.01, 0.02, 1.0)
        bg.inputs[1].default_value = 0.40
    bpy.context.scene.world = w


# ── Camera ────────────────────────────────────────────────────────────────
def _setup_camera():
    """Helical orbit: rises from CAM_HEIGHT[0] to peak then back, 1.5 revs."""
    cam_data = bpy.data.cameras.new("RecCam")
    cam_data.lens = 85.0
    cam_ob   = bpy.data.objects.new("RecCam", cam_data)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob

    for f in range(1, FRAMES + 1):
        t   = (f - 1) / (FRAMES - 1)
        ang = t * 1.5 * 2.0 * math.pi
        z_t = (CAM_HEIGHT[0]
               + (CAM_HEIGHT[1] - CAM_HEIGHT[0]) * math.sin(math.pi * t))
        cam_ob.location = (
            CAM_RADIUS * math.cos(ang),
            CAM_RADIUS * math.sin(ang),
            z_t,
        )
        # Point camera at origin (attractor centroid)
        dx = -cam_ob.location[0]
        dy = -cam_ob.location[1]
        dz = -z_t
        cam_ob.rotation_euler = (
            math.atan2(math.sqrt(dx*dx + dy*dy), -dz),
            0.0,
            math.atan2(dy, dx) + math.pi / 2.0,
        )
        cam_ob.keyframe_insert("location",       frame=f)
        cam_ob.keyframe_insert("rotation_euler", frame=f)

    return cam_ob


# ── Shape-key animation ───────────────────────────────────────────────────
def _animate_shape_keys(ob):
    """Sweep: Basis → SK_Hopf → back → SK_Periodic → back.

    Framing (24 fps, 240 frames total):
      1–60    Basis (canonical chaos, establish the attractor)
      60–100  morph to SK_Hopf (quasi-periodic near-Hopf regime)
      100–130 hold SK_Hopf
      130–160 return to Basis
      160–200 morph to SK_Periodic (clean limit cycle)
      200–230 hold SK_Periodic
      230–240 return to Basis
    """
    sk_keys = ob.data.shape_keys.key_blocks

    def _kf(key_name: str, val: float, frame: int):
        sk = sk_keys.get(key_name)
        if not sk:
            return
        sk.value = val
        sk.keyframe_insert("value", frame=frame)

    # Reset all to 0 at frame 1
    for kname in ("SK_Hopf", "SK_Periodic", "SK_HighG"):
        _kf(kname, 0.0, 1)

    # Basis period
    _kf("SK_Hopf",     0.0,  60)
    # Morph → SK_Hopf
    _kf("SK_Hopf",     1.0, 100)
    _kf("SK_Hopf",     1.0, 130)
    # Return to Basis
    _kf("SK_Hopf",     0.0, 160)
    # Morph → SK_Periodic
    _kf("SK_Periodic", 0.0, 160)
    _kf("SK_Periodic", 1.0, 200)
    _kf("SK_Periodic", 1.0, 230)
    _kf("SK_Periodic", 0.0, 240)


# ── Main ─────────────────────────────────────────────────────────────────
def main():
    _setup_render()
    _black_world()

    ob = bpy.data.objects.get("Lorenz84_Poi")
    if ob is None:
        raise RuntimeError("Run blueprint.py first to create Lorenz84_Poi.")

    _setup_camera()
    _animate_shape_keys(ob)

    import os
    os.makedirs(str(Path(OUTPUT_PATH).parent), exist_ok=True)
    bpy.ops.render.render(animation=True)
    print(f"[Lorenz84 record] → {OUTPUT_PATH}")


main()

"""
record.py — Viewport-animation render for the Lozi Map blend file.
Blender 5.1 · bpy direct-data API · outputs viewport.mp4

Run from Blender's Script Editor AFTER blueprint.py has built the scene.
Output: public/library/videos/scripting/
        python-numpy-lozi-map-piecewise-linear-chaos-misiurewicz-srb-height-field-stage-floor-webxr/
        viewport.mp4

Timeline: 120 frames @ 24 fps ≈ 5 seconds.
  Frame   1–30   Basis (a=1.70, b=0.50)  canonical Misiurewicz chaos
  Frame  31–60   SK_LowA (a=1.40)        near-bifurcation sparse structure
  Frame  61–90   SK_HiA  (a=2.00)        wider attractor support
  Frame  91–120  SK_LowB (a=1.70, b=0.30) thinner leaves, weaker dissipation

Technique: morph all shape-key values simultaneously using a driver-free
linear sweep on each shape key, so Blender's timeline controls the preview
without requiring geometry-nodes or drivers.
"""

import bpy
import math
import os

OUTPUT_DIR = (
    "public/library/videos/scripting/"
    "python-numpy-lozi-map-piecewise-linear-chaos-misiurewicz-srb-height-field-stage-floor-webxr"
)
TOTAL_FRAMES = 120
FPS          = 24

KEYS = ["SK_LowA", "SK_HiA", "SK_LowB"]   # Basis is always 1 at frame 1
# Each key gets a 30-frame window; value ramps 0→1 during its window, else 0.
WINDOWS = {
    "SK_LowA": (31, 60),
    "SK_HiA":  (61, 90),
    "SK_LowB": (91, 120),
}


def setup_camera() -> bpy.types.Object:
    """Top-down camera looking at the floor mesh from above at a slight angle."""
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 50.0
    cam = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = (0.0, -8.0, 7.0)
    cam.rotation_euler = (math.radians(50), 0.0, 0.0)
    bpy.context.scene.camera = cam
    return cam


def setup_light() -> bpy.types.Object:
    """Single area light above and to the side for rim illumination."""
    ld   = bpy.data.lights.new("RecordLight", type="AREA")
    ld.energy  = 1200.0
    ld.size    = 4.0
    light = bpy.data.objects.new("RecordLight", ld)
    bpy.context.collection.objects.link(light)
    light.location = (4.0, -4.0, 9.0)
    light.rotation_euler = (math.radians(30), math.radians(20), 0.0)
    return light


def set_shape_key_values(ob: bpy.types.Object,
                         frame: int) -> None:
    """Compute and key shape-key values at the given frame."""
    if ob.data.shape_keys is None:
        return
    kb = ob.data.shape_keys.key_blocks

    # Basis is always 0 (Blender Basis key is implicit reference — other keys
    # blend on top of it; set non-Basis keys explicitly).
    for key_name, (start, end) in WINDOWS.items():
        if key_name not in kb:
            continue
        t = (frame - start) / max(end - start, 1)
        # Triangle ramp: 0→1 in first half, 1→0 in second half of window.
        if frame < start or frame > end:
            val = 0.0
        elif t <= 0.5:
            val = t * 2.0
        else:
            val = (1.0 - t) * 2.0
        kb[key_name].value = val
        kb[key_name].keyframe_insert("value", frame=frame)


def main() -> None:
    ob = bpy.data.objects.get("Lozi_Attractor")
    if ob is None:
        print("[record] ERROR: 'Lozi_Attractor' not found — run blueprint.py first.")
        return

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.fps  = FPS

    # Viewport render settings (EEVEE Next, Blender 5.1)
    scene.render.engine              = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x        = 1920
    scene.render.resolution_y        = 1080
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format       = "MPEG4"
    scene.render.ffmpeg.codec        = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = os.path.join(
        bpy.path.abspath("//"),
        OUTPUT_DIR,
        "viewport.mp4",
    )

    setup_camera()
    setup_light()

    # Insert shape-key keyframes across the timeline.
    for f in range(1, TOTAL_FRAMES + 1):
        scene.frame_set(f)
        set_shape_key_values(ob, f)

    bpy.ops.render.render(animation=True)
    print(f"[record] Done — wrote {scene.render.filepath}")


main()

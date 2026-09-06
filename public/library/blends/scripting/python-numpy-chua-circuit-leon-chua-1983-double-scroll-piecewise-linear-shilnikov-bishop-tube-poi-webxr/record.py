"""
record.py — Viewport animation for Chua's Circuit Double-Scroll Attractor
==========================================================================
Renders a 10-second / 240-frame sequence to:
  public/library/videos/scripting/
    python-numpy-chua-circuit-leon-chua-1983-double-scroll-piecewise-linear-shilnikov-bishop-tube-poi-webxr/
    viewport.mp4

Run from Blender's Scripting workspace after blueprint.py has built the
scene, or invoke headlessly via:
    blender --background hf_chua_poi.blend --python record.py

WHAT IT SHOWS
  0 – 59   fr   Basis — canonical double-scroll (α=15.6, β=28)
 60 – 119  fr   Morph → SK_HighAlpha (α=20.0 — tighter winding)
120 – 179  fr   Morph → SK_SpiralChua (α=9.5 — single-scroll topology)
180 – 239  fr   Morph → SK_LowBeta (β=16.0 — wider scroll spacing)

Camera orbits 300° at 22° elevation; bloom accentuates the emission
gradient that distinguishes the two lobes by orbital speed.
"""

import bpy
import math

# ── Constants ─────────────────────────────────────────────────────────────────
OUTPUT_DIR = (
    "//../../videos/scripting/"
    "python-numpy-chua-circuit-leon-chua-1983-double-scroll-"
    "piecewise-linear-shilnikov-bishop-tube-poi-webxr/"
)
N_FRAMES   = 240
FPS        = 24
CAM_DIST   = 0.45    # metres from origin
CAM_ELEV   = 0.22    # radians (~12.5°)
LENS_MM    = 85
ORBIT_DEG  = 300
SHAPE_KEYS = ["SK_HighAlpha", "SK_SpiralChua", "SK_LowBeta"]


def setup_render():
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = N_FRAMES
    sc.render.fps  = FPS

    sc.render.engine = "BLENDER_EEVEE_NEXT"
    eevee = sc.eevee
    eevee.use_bloom       = True
    eevee.bloom_threshold = 0.30
    eevee.bloom_intensity = 0.32
    eevee.bloom_radius    = 4.0

    sc.render.image_settings.file_format      = "FFMPEG"
    sc.render.ffmpeg.format                   = "MPEG4"
    sc.render.ffmpeg.codec                    = "H264"
    sc.render.ffmpeg.constant_rate_factor     = "MEDIUM"
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.render.filepath     = OUTPUT_DIR + "viewport"


def animate_camera():
    cam = bpy.context.scene.camera
    if cam is None:
        bpy.ops.object.camera_add()
        cam = bpy.context.object
        bpy.context.scene.camera = cam

    cam.data.lens = LENS_MM

    for f in range(1, N_FRAMES + 1):
        t  = (f - 1) / (N_FRAMES - 1)
        az = math.radians(ORBIT_DEG * t)
        x  =  CAM_DIST * math.cos(az)
        y  = -CAM_DIST * math.sin(az)
        z  =  CAM_DIST * math.sin(CAM_ELEV)

        cam.location = (x, y, z)
        dx, dy, dz = -x, -y, -z
        ln = math.sqrt(dx*dx + dy*dy + dz*dz)
        cam.rotation_euler = (
            math.acos(max(-1.0, min(1.0, dz / ln))),
            0.0,
            math.atan2(dy, dx),
        )
        cam.keyframe_insert("location",        frame=f)
        cam.keyframe_insert("rotation_euler",  frame=f)


def animate_shape_keys():
    """Step through each shape key in equal thirds of the sequence."""
    obj = bpy.data.objects.get("hf_chua_poi")
    if obj is None or obj.data.shape_keys is None:
        print("WARNING: hf_chua_poi mesh not found — shape-key animation skipped")
        return

    keys = obj.data.shape_keys.key_blocks
    seg  = N_FRAMES // (len(SHAPE_KEYS) + 1)   # frames per segment

    # Silence all keys at frame 1
    for k in keys:
        k.value = 0.0
        k.keyframe_insert("value", frame=1)

    for idx, sk_name in enumerate(SHAPE_KEYS):
        if sk_name not in keys:
            continue
        k = keys[sk_name]
        start = (idx + 1) * seg

        # Fade in over 10 frames
        k.value = 0.0;  k.keyframe_insert("value", frame=start - 10)
        k.value = 1.0;  k.keyframe_insert("value", frame=start)

        # Previous key fades out
        if idx > 0:
            prev = keys[SHAPE_KEYS[idx - 1]]
            prev.value = 1.0; prev.keyframe_insert("value", frame=start - 10)
            prev.value = 0.0; prev.keyframe_insert("value", frame=start)

    # Hold last key to end
    last = keys[SHAPE_KEYS[-1]]
    last.value = 1.0; last.keyframe_insert("value", frame=N_FRAMES)


def setup_world():
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)
        bg.inputs["Strength"].default_value = 0.15


def main():
    setup_render()
    setup_world()
    animate_camera()
    animate_shape_keys()
    bpy.ops.render.render(animation=True)
    print("Render complete →", OUTPUT_DIR)


if __name__ == "__main__":
    main()

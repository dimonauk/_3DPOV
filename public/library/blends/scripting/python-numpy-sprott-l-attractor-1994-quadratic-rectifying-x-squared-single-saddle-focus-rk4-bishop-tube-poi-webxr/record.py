"""
record.py — Sprott L Attractor · Viewport Animation Recording
Blender 5.1 · bpy headless-safe · outputs viewport.mp4

Run AFTER blueprint.py has built the scene.
Produces a 5–10 second animation rotating around the tube poi head,
then cycling through shape keys to show the parameter sweep.

Output path (relative to .blend):
    public/library/videos/scripting/
    python-numpy-sprott-l-attractor-1994-quadratic-rectifying-x-squared-single-saddle-focus-rk4-bishop-tube-poi-webxr/
    viewport.mp4
"""

import bpy
import math

# ── RENDER SETTINGS ────────────────────────────────────────────────────────────
FPS         = 30
N_FRAMES    = 270            # 9 seconds: orbit sweep + shape-key transition
OUTPUT_PATH = (
    "//../../videos/scripting/"
    "python-numpy-sprott-l-attractor-1994-quadratic-rectifying-x-squared"
    "-single-saddle-focus-rk4-bishop-tube-poi-webxr/viewport"
)

CAM_RADIUS  = 3.6            # metres from origin
CAM_ELEV    = 1.0            # metres above origin (slight upward angle)
LENS_MM     = 50             # focal length


def set_render() -> None:
    sc   = bpy.context.scene
    sc.render.engine          = "BLENDER_EEVEE_NEXT"
    sc.render.fps             = FPS
    sc.frame_start            = 1
    sc.frame_end              = N_FRAMES
    sc.render.filepath        = OUTPUT_PATH
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format   = "MPEG4"
    sc.render.ffmpeg.codec    = "H264"
    sc.render.ffmpeg.constant_rate_factor = "HIGH"
    sc.render.resolution_x    = 1920
    sc.render.resolution_y    = 1080
    sc.render.resolution_percentage = 100

    # EEVEE bloom for the emissive tube glow
    sc.eevee.use_bloom        = True
    sc.eevee.bloom_intensity  = 0.28
    sc.eevee.bloom_threshold  = 0.50


def add_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(CAM_RADIUS, 0, CAM_ELEV))
    cam = bpy.context.active_object
    cam.name = "SprottL_Cam"
    cam.data.lens = LENS_MM
    bpy.context.scene.camera = cam
    return cam


def keyframe_camera(cam: bpy.types.Object) -> None:
    """
    Animate the camera orbiting around origin.
    Full 360° over N_FRAMES.  The camera always points at the origin.
    WHY orbit rather than static?  The tube surface reads as flat from any
    single angle; rotation reveals the helical winding and the scroll's depth.
    """
    sc = bpy.context.scene
    for fr in range(1, N_FRAMES + 1):
        angle = 2 * math.pi * (fr - 1) / N_FRAMES
        x = CAM_RADIUS * math.cos(angle)
        y = CAM_RADIUS * math.sin(angle)
        cam.location = (x, y, CAM_ELEV)

        # Point at origin
        dx, dy, dz = -x, -y, -CAM_ELEV
        length = math.sqrt(dx*dx + dy*dy + dz*dz)
        cam.rotation_euler = (
            math.acos(-dz / length),
            0,
            math.atan2(dy, dx) + math.pi / 2,
        )
        cam.keyframe_insert("location",        frame=fr)
        cam.keyframe_insert("rotation_euler",  frame=fr)


def add_lights() -> None:
    bpy.ops.object.light_add(type="POINT",
                             location=(3.0, 2.0, 4.0))
    bpy.context.active_object.data.energy = 500

    bpy.ops.object.light_add(type="POINT",
                             location=(-3.0, -2.0, 2.0))
    bpy.context.active_object.data.energy = 200


def keyframe_shape_keys() -> None:
    """
    Animate shape-key weights to sweep through four parameter regimes:
      1–60   Basis    (canonical a=3.9, b=0.9)
      61–120 SK_HighA (broader spiral)
      121–180 SK_LowB (near-bifurcation)
      181–240 SK_Compact (tight orbit)
      241–270 return to Basis
    Each transition uses a smooth 15-frame blend window.
    """
    ob = bpy.data.objects.get("SprottL_Attractor")
    if ob is None or ob.data.shape_keys is None:
        return
    keys = ob.data.shape_keys.key_blocks
    names = ["Basis", "SK_HighA", "SK_LowB", "SK_Compact"]
    # schedule: (start_peak, end_peak) for each key
    windows = [(1, 60), (61, 120), (121, 180), (181, 240)]

    for fr in range(1, N_FRAMES + 1):
        for ki, kname in enumerate(names):
            if kname not in keys:
                continue
            s, e = windows[ki]
            if s <= fr <= e:
                w = 1.0
            elif fr < s:
                w = max(0.0, 1.0 - (s - fr) / 15.0)
            else:
                w = max(0.0, 1.0 - (fr - e) / 15.0)
            keys[kname].value = w
            keys[kname].keyframe_insert("value", frame=fr)


def main() -> None:
    set_render()
    cam = add_camera()
    keyframe_camera(cam)
    add_lights()
    keyframe_shape_keys()
    bpy.ops.render.opengl(animation=True)
    print("record.py complete — viewport.mp4 written.")


main()

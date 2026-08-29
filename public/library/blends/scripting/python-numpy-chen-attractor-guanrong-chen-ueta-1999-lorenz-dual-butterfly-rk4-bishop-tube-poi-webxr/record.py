"""
Chen Attractor — record.py
Blender 5.1  |  CC0

Renders a 10-second (240-frame) EEVEE Next viewport animation, orbiting the
Chen attractor poi head and morphing through its shape keys.

Run in the Blender Scripting workspace AFTER blueprint.py has completed.
Output path: public/library/videos/scripting/<slug>/viewport.mp4
  (the // path resolves relative to the saved .blend file)
"""

import bpy
import math

SLUG  = (
    "python-numpy-chen-attractor-guanrong-chen-ueta-1999"
    "-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
)
# Render output — // = directory of the saved .blend
OUT   = f"//../../videos/scripting/{SLUG}/viewport"

FPS      = 24
N_FRAMES = 240   # 10 s — shows full 360° orbit + three shape-key morphs

CAM_RADIUS = 0.24   # metres (poi head radius ≈ 0.082 m; give generous clearance)
CAM_ELEV   = 20.0   # degrees above equator


def setup_render() -> None:
    sc = bpy.context.scene
    sc.render.engine                        = "BLENDER_EEVEE_NEXT"
    sc.render.fps                           = FPS
    sc.frame_start                          = 1
    sc.frame_end                            = N_FRAMES
    sc.render.filepath                      = OUT
    sc.render.image_settings.file_format    = "FFMPEG"
    sc.render.ffmpeg.format                 = "MPEG4"
    sc.render.ffmpeg.codec                  = "H264"
    sc.render.resolution_x                  = 1920
    sc.render.resolution_y                  = 1080
    sc.render.resolution_percentage         = 100

    # Bloom — the cobalt/amber emission glows without overexposing
    ev = sc.eevee
    ev.use_bloom       = True
    ev.bloom_threshold = 0.30
    ev.bloom_intensity = 0.22

    # World — near-black void so emission colours read cleanly
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value    = (0.02, 0.02, 0.04, 1.0)
        bg.inputs["Strength"].default_value = 0.5


def setup_camera() -> None:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 85   # telephoto compresses the lobe depth nicely
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # Parent camera to an empty so orbit = rotation of the empty
    rig = bpy.data.objects.new("CamRig", None)
    bpy.context.collection.objects.link(rig)
    cam_obj.parent = rig

    er = math.radians(CAM_ELEV)
    cam_obj.location       = (0.0, -CAM_RADIUS*math.cos(er), CAM_RADIUS*math.sin(er))
    cam_obj.rotation_euler = (math.pi/2 - er, 0.0, 0.0)

    # Linear orbit: 0° → 360° over N_FRAMES + 1 frames
    rig.rotation_euler = (0, 0, 0)
    rig.keyframe_insert("rotation_euler", frame=1)
    rig.rotation_euler = (0, 0, math.radians(360))
    rig.keyframe_insert("rotation_euler", frame=N_FRAMES + 1)
    for fc in rig.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def morph(obj: bpy.types.Object, key_name: str,
          f_start: int, f_peak: int, f_hold_end: int, f_return: int) -> None:
    """Ease in → hold → ease out for one shape key."""
    keys = obj.data.shape_keys.key_blocks
    sk   = keys.get(key_name)
    if not sk:
        return
    for f, v in [(max(1, f_start - 8), 0.0),
                 (f_start, 0.0),
                 (f_peak, 1.0),
                 (f_hold_end, 1.0),
                 (f_return, 0.0),
                 (min(N_FRAMES, f_return + 8), 0.0)]:
        sk.value = v
        sk.keyframe_insert("value", frame=f)


def setup_shape_key_animation() -> None:
    """
    Three morphs over 240 frames:
      SK_Periodic  f40→60 peak, hold→80, return f90  — shows limit-cycle collapse
      SK_Wing      f110→130 peak, hold→150, return f160 — denser lobe structure
      SK_Lu        f185→205 peak, hold→215, return f225 — Lü bridge attractor
    """
    obj = bpy.context.scene.objects.get("Chen_Attractor_Poi")
    if not obj or not obj.data.shape_keys:
        print("[record.py] Chen_Attractor_Poi not found — run blueprint.py first")
        return
    morph(obj, "SK_Periodic", 40,  60,  80,  90)
    morph(obj, "SK_Wing",    110, 130, 150, 160)
    morph(obj, "SK_Lu",      185, 205, 215, 225)


def add_fill_light() -> None:
    ld = bpy.data.lights.new("FillLight", "POINT")
    ld.energy = 0.3
    ld.color  = (0.2, 0.4, 1.0)  # cool fill complements the warm amber
    lo = bpy.data.objects.new("FillLight", ld)
    lo.location = (0.3, -0.2, 0.2)
    bpy.context.collection.objects.link(lo)


def run() -> None:
    setup_render()
    setup_camera()
    setup_shape_key_animation()
    add_fill_light()
    bpy.ops.render.render(animation=True)
    print(f"[chen-attractor] record.py complete — viewport.mp4 at {OUT}")


if __name__ == "__main__":
    run()

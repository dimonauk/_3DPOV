"""
record.py — viewport animation for the CC poi-head tutorial
Blender 5.1 · CC0 (Holoflow Studio)

Produces public/library/videos/scripting/
  python-bmesh-catmull-clark-subdivision-from-scratch-valence-weight-poi-head-webxr/
  viewport.mp4

Timeline (90 frames at 30 fps = 3 s):
  0–10   base polo-sphere visible, CC head hidden
  10–30  CC head fades in (alpha ramp via Principled BSDF α)
  30–60  slow 60° camera orbit, both objects visible
  60–90  second 60° orbit — face-point gizmos blink on/off (2 blinks)

Run after blueprint.py has been executed in the same session.
"""

import bpy
import math
import os

FRAME_END = 90
FPS       = 30
OUTPUT_DIR = "//public/library/videos/scripting/python-bmesh-catmull-clark-subdivision-from-scratch-valence-weight-poi-head-webxr"

def _setup_scene() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format       = "MPEG4"
    scene.render.ffmpeg.codec        = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.filepath = OUTPUT_DIR + "/viewport.mp4"
    os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)


def _add_orbital_camera() -> bpy.types.Object:
    """Parent camera to an empty so rotation drives a clean orbit."""
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    pivot = bpy.context.active_object
    pivot.name = "CamPivot"

    cam_ob = bpy.data.objects.get("Camera") or bpy.data.cameras.new("RecordCam")
    if isinstance(cam_ob, bpy.types.Camera):
        cam_ob = bpy.data.objects.new("RecordCam", cam_ob)
        bpy.context.collection.objects.link(cam_ob)
    cam_ob.location = (0.0, -0.28, 0.04)
    cam_ob.rotation_euler = (math.radians(88), 0, 0)
    cam_ob.parent = pivot
    bpy.context.scene.camera = cam_ob
    return pivot


def _animate_camera_orbit(pivot: bpy.types.Object) -> None:
    """120° total orbit across frames 30–90."""
    pivot.rotation_euler = (0, 0, 0)
    pivot.keyframe_insert("rotation_euler", frame=30)
    pivot.rotation_euler = (0, 0, math.radians(60))
    pivot.keyframe_insert("rotation_euler", frame=60)
    pivot.rotation_euler = (0, 0, math.radians(120))
    pivot.keyframe_insert("rotation_euler", frame=90)
    for fc in pivot.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def _animate_head_reveal() -> None:
    """Fade-in the CC head between frames 10–30."""
    head = bpy.data.objects.get("PoiHead_CC2")
    base = bpy.data.objects.get("PoiHead_Base")
    if not head:
        return

    # alpha via material node Principled BSDF → Alpha
    mat = head.data.materials[0] if head.data.materials else None
    if mat and mat.use_nodes:
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            mat.blend_method = "BLEND"
            bsdf.inputs["Alpha"].default_value = 0.0
            bsdf.inputs["Alpha"].keyframe_insert("default_value", frame=1)
            bsdf.inputs["Alpha"].default_value = 0.0
            bsdf.inputs["Alpha"].keyframe_insert("default_value", frame=10)
            bsdf.inputs["Alpha"].default_value = 1.0
            bsdf.inputs["Alpha"].keyframe_insert("default_value", frame=30)

    # hide base after frame 40
    if base:
        base.hide_render = False
        base.keyframe_insert("hide_render", frame=1)
        base.hide_render = True
        base.keyframe_insert("hide_render", frame=40)


def _animate_gizmo_blinks() -> None:
    """Blink face-point gizmo 2× between frames 60–90."""
    fp = bpy.data.objects.get("FacePoints_R1")
    if not fp:
        return
    fp.hide_render = True
    fp.keyframe_insert("hide_render", frame=60)
    fp.hide_render = False
    fp.keyframe_insert("hide_render", frame=65)
    fp.hide_render = True
    fp.keyframe_insert("hide_render", frame=70)
    fp.hide_render = False
    fp.keyframe_insert("hide_render", frame=75)
    fp.hide_render = True
    fp.keyframe_insert("hide_render", frame=90)


def _setup_lighting() -> None:
    # Key light — warm
    bpy.ops.object.light_add(type="AREA", location=(0.3, -0.2, 0.3))
    key = bpy.context.active_object
    key.data.energy = 60
    key.data.color  = (1.0, 0.92, 0.8)

    # Fill light — cool
    bpy.ops.object.light_add(type="AREA", location=(-0.2, 0.2, 0.1))
    fill = bpy.context.active_object
    fill.data.energy = 25
    fill.data.color  = (0.6, 0.75, 1.0)

    scene = bpy.context.scene
    scene.eevee.use_bloom = True
    scene.eevee.bloom_threshold = 0.8
    scene.eevee.bloom_intensity = 0.4


def main() -> None:
    _setup_scene()
    pivot = _add_orbital_camera()
    _animate_camera_orbit(pivot)
    _animate_head_reveal()
    _animate_gizmo_blinks()
    _setup_lighting()

    bpy.ops.render.render(animation=True)
    print("[Holoflow record] viewport.mp4 written →", OUTPUT_DIR)


if __name__ == "__main__":
    main()

"""
record.py — Viewport animation for the Euler Elastica ribbon poi.

HOW TO RUN
----------
Open elastica_poi.blend in Blender 5.1, then:
    Scripting workspace → Open → this file → Run Script
Alternatively from a terminal:
    blender elastica_poi.blend --background --python record.py

Output: public/library/videos/scripting/
        python-numpy-euler-elastica-jacobi-dn-curvature-lemniscate-ribbon-poi-webxr/
        viewport.mp4   (12 s · 30 fps · 360 frames · 1920×1080)

Sequence
--------
 0–90   Slow rotation around Z, base oval elastica visible.
91–200  Shape key animation: base → M_010_circle → M_348_exact →
        M_550_oval → M_750_elongated → M_950_cusp → back to base.
201–300 Camera orbit to show z-lift ribbon depth.
301–360 Hold on the completed ribbon, glow emission pulses.
"""

import bpy
from math import pi, sin

SCENE    = bpy.context.scene
FRAMES   = 360
FPS      = 30
RES_X    = 1920
RES_Y    = 1080
OUT_DIR  = "//../../videos/scripting/" \
           "python-numpy-euler-elastica-jacobi-dn-curvature-lemniscate-ribbon-poi-webxr/"

def ease(t: float) -> float:
    """Smooth-step cubic for morph blends — no velocity discontinuity."""
    t = max(0.0, min(1.0, t))
    return 3*t*t - 2*t*t*t


def setup_scene():
    SCENE.render.fps = FPS
    SCENE.frame_start = 1
    SCENE.frame_end   = FRAMES
    SCENE.render.resolution_x = RES_X
    SCENE.render.resolution_y = RES_Y
    SCENE.render.image_settings.file_format = 'FFMPEG'
    SCENE.render.ffmpeg.format   = 'MPEG4'
    SCENE.render.ffmpeg.codec    = 'H264'
    SCENE.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    SCENE.render.filepath = OUT_DIR + "viewport"
    SCENE.render.engine   = 'BLENDER_WORKBENCH'
    SCENE.display.shading.color_type = 'VERTEX'
    SCENE.display.shading.light      = 'FLAT'


def keyframe_rotation(obj, frame, z_angle):
    obj.rotation_euler[2] = z_angle
    obj.keyframe_insert("rotation_euler", frame=frame)
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def morph_sk(obj, sk_name, value, frame):
    kb = obj.data.shape_keys.key_blocks
    for key in kb:
        key.value = 0.0
    if sk_name != "Basis":
        kb[sk_name].value = value
    for key in kb:
        key.keyframe_insert("value", frame=frame)


def build_camera():
    bpy.ops.object.camera_add(location=(0.18, -0.12, 0.14))
    cam = bpy.context.object
    cam.data.lens  = 85
    cam.data.clip_start = 0.001
    SCENE.camera = cam

    # track-to empty at origin
    bpy.ops.object.empty_add(location=(0, 0, 0))
    target = bpy.context.object
    tt = cam.constraints.new('TRACK_TO')
    tt.target     = target
    tt.track_axis = 'TRACK_NEGATIVE_Z'
    tt.up_axis    = 'UP_Y'
    return cam


def build():
    setup_scene()

    # find the ribbon object
    obj = bpy.data.objects.get("hf_elastica_poi")
    if obj is None:
        print("[record] ERROR: hf_elastica_poi not found — run blueprint.py first.")
        return

    obj.animation_data_clear()
    cam = build_camera()

    # ─── Phase 1 (1–90): slow Z rotation, see the flat oval ───────────────
    for fr in range(1, 91):
        t = (fr - 1) / 89.0
        keyframe_rotation(obj, fr, t * 2 * pi * 0.8)

    # ─── Phase 2 (91–270): shape key cycle ────────────────────────────────
    morphs = [
        ("Basis",            91,  120),
        ("M_010_circle",    121,  150),
        ("M_348_exact",     151,  180),
        ("M_550_oval",      181,  210),
        ("M_750_elongated", 211,  240),
        ("M_950_cusp",      241,  270),
    ]
    for (sk, f_start, f_end) in morphs:
        span = f_end - f_start
        for fr in range(f_start, f_end + 1):
            t = (fr - f_start) / span
            morph_sk(obj, sk, ease(t), fr)

    # ─── Phase 3 (271–330): camera orbit to show z-lift ──────────────────
    cam.animation_data_clear()
    cam_path_frames = range(271, 331)
    for i, fr in enumerate(cam_path_frames):
        t = i / (len(cam_path_frames) - 1)
        angle = t * pi   # half orbit
        r = 0.20
        z = 0.06 + 0.08 * sin(t * pi)
        cam.location = (r * sin(angle), -r * 0.7 * cos(angle), z)
        cam.keyframe_insert("location", frame=fr)

    # ─── Phase 4 (331–360): hold, emission pulse ──────────────────────────
    mat = bpy.data.materials.get("hf_elastica_poi_mat")
    if mat:
        emit_node = next((n for n in mat.node_tree.nodes
                          if n.type == 'EMISSION'), None)
        if emit_node:
            for fr in (331, 346, 361):
                t = (fr - 331) / 30.0
                emit_node.inputs["Strength"].default_value = 2.8 + 1.4 * abs(sin(t * pi))
                emit_node.inputs["Strength"].keyframe_insert("default_value", frame=fr)

    bpy.ops.render.render(animation=True)
    print("[record] render complete →", OUT_DIR)


build()

"""
record.py — Viewport animation recorder for python-modal-operator-vertex-colour-painter
=========================================================================================
Blender 5.1 | CC0

Since the modal operator requires interactive mouse input, this recorder
demonstrates the *result* of the technique rather than live interaction.
It programmatically paints a meridian stripe + polar cap onto the sphere's
colour attribute, then renders a 5-second (150 frame) 360° turntable.

Run from the Scripting workspace after blueprint.py has been executed,
or headless:
    blender paint_canvas.blend --background --python record.py

Output:
    public/library/videos/scripting/python-modal-operator-vertex-colour-painter/viewport.mp4
"""

import bpy
import math
import os

# ── Paths ──────────────────────────────────────────────────────────────────────
_HERE   = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.normpath(os.path.join(
    _HERE, "../../../../public/library/videos/scripting/"
    "python-modal-operator-vertex-colour-painter"
))
os.makedirs(OUT_DIR, exist_ok=True)

# ── Constants (must match blueprint.py) ────────────────────────────────────────
SPHERE_NAME   = "paint_canvas"
COL_ATTR_NAME = "Col"
STRIPE_COLOUR = (1.0, 0.25, 0.05, 1.0)   # vermillion stroke
CAP_COLOUR    = (0.15, 0.55, 1.0, 1.0)   # cobalt polar cap
FPS           = 30
FRAMES        = 150  # 5 s


# ── Programmatic paint (simulates interactive strokes) ─────────────────────────

def pre_paint():
    """Paint demonstrative shapes directly onto colour attribute data."""
    obj = bpy.data.objects.get(SPHERE_NAME)
    if obj is None:
        print("[record] ERROR — paint_canvas not found; run blueprint.py first.")
        return

    mesh     = obj.data
    col_attr = mesh.color_attributes.get(COL_ATTR_NAME)
    if col_attr is None:
        print("[record] colour attribute missing; run blueprint.py first.")
        return

    # Build vertex→world-Z lookup
    mat = obj.matrix_world
    verts = mesh.vertices

    for poly in mesh.polygons:
        # Average Z of the polygon's vertices in world space
        avg_z = sum(
            (mat @ verts[mesh.loops[li].vertex_index].co).z
            for li in range(poly.loop_start, poly.loop_start + poly.loop_total)
        ) / poly.loop_total

        # Normalise Z to [-1, 1] relative to sphere radius
        nz = avg_z / 1.4

        # Polar cap above 0.7 in normalised Z → cobalt blue
        if nz > 0.7:
            colour = CAP_COLOUR
        # Vertical stripe: faces whose polygon centre has X ≈ 0 on the front half
        else:
            avg_x = sum(
                (mat @ verts[mesh.loops[li].vertex_index].co).x
                for li in range(poly.loop_start, poly.loop_start + poly.loop_total)
            ) / poly.loop_total
            avg_y = sum(
                (mat @ verts[mesh.loops[li].vertex_index].co).y
                for li in range(poly.loop_start, poly.loop_start + poly.loop_total)
            ) / poly.loop_total
            # Stripe where |x| < 0.2 and y < 0 (front face)
            if abs(avg_x) < 0.2 and avg_y < -0.3:
                colour = STRIPE_COLOUR
            else:
                continue  # leave base grey

        for li in range(poly.loop_start, poly.loop_start + poly.loop_total):
            col_attr.data[li].color = colour

    mesh.update()


# ── Turntable ──────────────────────────────────────────────────────────────────

def setup_turntable():
    obj = bpy.data.objects.get(SPHERE_NAME)
    if obj is None:
        return
    obj.rotation_mode = "XYZ"
    obj.rotation_euler[2] = 0.0
    obj.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
    obj.rotation_euler[2] = math.tau  # 360°
    obj.keyframe_insert(data_path="rotation_euler", index=2, frame=FRAMES)
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


# ── Render ─────────────────────────────────────────────────────────────────────

def render():
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = FRAMES
    sc.render.fps  = FPS
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.render.resolution_percentage       = 100
    sc.render.image_settings.file_format  = "FFMPEG"
    sc.render.ffmpeg.format               = "MPEG4"
    sc.render.ffmpeg.codec                = "H264"
    sc.render.ffmpeg.constant_rate_factor = "HIGH"
    sc.render.ffmpeg.audio_codec          = "NONE"
    sc.render.filepath = os.path.join(OUT_DIR, "viewport.mp4")

    bpy.ops.render.opengl(animation=True, sequencer=False)
    print(f"[record] viewport.mp4 → {sc.render.filepath}")


if __name__ == "__main__":
    pre_paint()
    setup_turntable()
    render()

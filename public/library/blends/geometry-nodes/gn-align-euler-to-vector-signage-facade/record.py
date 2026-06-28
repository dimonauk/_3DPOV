"""
record.py — Viewport animation render for GN Align Euler to Vector
Blender 5.1 · CC0 · Holoflow Studio

Output: public/library/videos/geometry-nodes/
          gn-align-euler-to-vector-signage-facade/viewport.mp4

What it renders (270 frames → 9 s at 30 fps):
  0–30    Factor = 0.0  — panels all face default orientation (no alignment)
  31–120  Factor 0→1    — panels snap to face normals, revealing the technique
  121–180 Hold at 1.0   — slow orbit around the cylinder to show all faces
  181–270 Camera completes orbit

Run from CLI:
  blender --background signage_facade.blend --python record.py
Or in Scripting workspace after blueprint.py has run.
"""

import bpy
import math
import os

# ── Config ─────────────────────────────────────────────────────────────────
FACADE_NAME  = "SignageFacade"
NG_NAME      = "GN_AlignEulerSignage"
OUTPUT_PATH  = "//../../videos/geometry-nodes/" \
               "gn-align-euler-to-vector-signage-facade/viewport"
FRAME_START  = 1
FRAME_END    = 270
FPS          = 30
RESOLUTION   = (1920, 1080)
CAMERA_DIST  = 9.0
CAMERA_ELEV  = 0.25        # radians above equator

# (frame, factor) — blends alignment from none to full
FACTOR_KEYS = [
    (  1, 0.0),
    ( 30, 0.0),
    (120, 1.0),
    (270, 1.0),
]

# Camera orbit: full 360° over frames 120–270 to show all faces
ORBIT_KEYS = [
    (120, 0.0),
    (270, 360.0),
]

# ── Camera ─────────────────────────────────────────────────────────────────
def setup_camera():
    bpy.ops.object.camera_add()
    cam = bpy.context.active_object
    cam.name = "RecordCam"
    angle = math.radians(0.0)
    cam.location = (
        CAMERA_DIST * math.cos(CAMERA_ELEV) * math.cos(angle),
        CAMERA_DIST * math.cos(CAMERA_ELEV) * math.sin(angle),
        CAMERA_DIST * math.sin(CAMERA_ELEV) + 3.0,  # look at mid-height
    )
    cam.rotation_euler = (
        math.pi * 0.5 - CAMERA_ELEV,
        0.0,
        math.atan2(cam.location.y, cam.location.x) + math.pi,
    )
    bpy.context.scene.camera = cam
    return cam

# ── Empty target for orbit constraint ─────────────────────────────────────
def setup_orbit():
    bpy.ops.object.empty_add(location=(0.0, 0.0, 3.0))
    target = bpy.context.active_object
    target.name = "RecordTarget"

    cam = bpy.data.objects.get("RecordCam")
    if cam is None:
        return target

    # Track-To constraint keeps camera pointing at the façade centre
    con = cam.constraints.new("TRACK_TO")
    con.target   = target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis  = "UP_Y"

    # Animate the camera Z rotation to orbit
    cam.rotation_mode = "XYZ"
    for frame, degrees in ORBIT_KEYS:
        cam.rotation_euler.z = math.radians(degrees)
        cam.keyframe_insert("rotation_euler", index=2, frame=frame)

    return target

# ── Lighting ───────────────────────────────────────────────────────────────
def setup_lighting():
    bpy.ops.object.light_add(type="SUN", location=(5, 3, 8))
    sun = bpy.context.active_object
    sun.name = "RecordSun"
    sun.data.energy = 4.0
    sun.data.angle  = math.radians(3.0)

    # Rim light to silhouette the cylinder edge
    bpy.ops.object.light_add(type="AREA", location=(-4, -3, 4))
    rim = bpy.context.active_object
    rim.name = "RecordRim"
    rim.data.energy = 80.0
    rim.data.size   = 2.0
    rim.data.color  = (0.15, 0.60, 1.0)

# ── Animate the Factor socket ──────────────────────────────────────────────
def keyframe_factor():
    obj = bpy.data.objects.get(FACADE_NAME)
    if obj is None:
        print(f"[record] Object '{FACADE_NAME}' not found — run blueprint.py first.")
        return

    mod = next((m for m in obj.modifiers if m.name == NG_NAME), None)
    if mod is None:
        print(f"[record] Modifier '{NG_NAME}' not found.")
        return

    ng = mod.node_group
    # Find the AlignEulerToVector node
    align_node = next(
        (n for n in ng.nodes if n.bl_idname == "FunctionNodeAlignEulerToVector"),
        None,
    )
    if align_node is None:
        print("[record] AlignEulerToVector node not found in GN tree.")
        return

    # Animate inputs[1] = Factor
    for frame, value in FACTOR_KEYS:
        align_node.inputs[1].default_value = value
        align_node.inputs[1].keyframe_insert("default_value", frame=frame)
    print(f"[record] Keyed Factor at frames: {[k[0] for k in FACTOR_KEYS]}")

# ── Render settings ────────────────────────────────────────────────────────
def configure_render():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = FPS
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x, scene.render.resolution_y = RESOLUTION
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec  = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.ffmpeg.audio_codec = "NONE"
    scene.render.filepath = OUTPUT_PATH
    scene.eevee.taa_render_samples = 32

# ── Main ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_abs = bpy.path.abspath(OUTPUT_PATH)
    os.makedirs(os.path.dirname(out_abs), exist_ok=True)

    setup_camera()
    setup_orbit()
    setup_lighting()
    keyframe_factor()
    configure_render()

    print("[record] Rendering 270 frames →", OUTPUT_PATH)
    bpy.ops.render.render(animation=True)
    print("[record] viewport.mp4 written.")

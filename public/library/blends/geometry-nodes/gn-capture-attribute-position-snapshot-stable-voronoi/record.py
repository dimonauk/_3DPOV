"""
record.py — Viewport animation render for CaptureAttribute Position Snapshot
Blender 5.1 · CC0 · Holoflow Studio

Output: public/library/videos/geometry-nodes/
          gn-capture-attribute-position-snapshot-stable-voronoi/viewport.mp4

What it renders (300 frames → 10 s at 30 fps):
  0–60    Twist = 0°   — untwisted cylinder, Voronoi cells visible
  61–180  Twist 0° → 180°  — column twists; cells stay locked to original grid
  181–240 Hold at 180°
  241–300 Twist 180° → 0°  — untwist back to rest

Run: open Blender, load (or append) capture_column.blend, then run this
script in the Scripting workspace, OR invoke from CLI:
  blender --background capture_column.blend --python record.py
"""

import bpy
import os
import math

# ── Config ─────────────────────────────────────────────────────────────────
OBJ_NAME     = "CaptureAttr_Column"
NG_NAME      = "GN_CaptureAttr_StableVoronoi"
OUTPUT_PATH  = "//../../videos/geometry-nodes/" \
               "gn-capture-attribute-position-snapshot-stable-voronoi/viewport"
FRAME_START  = 1
FRAME_END    = 300
FPS          = 30
RESOLUTION   = (1920, 1080)
CAMERA_DIST  = 2.8
CAMERA_ELEV  = 0.35    # radians above equator

# Twist keyframe data: (frame, twist_degrees)
TWIST_KEYS = [
    (  1,   0.0),
    ( 61,   0.0),
    (180, 180.0),
    (240, 180.0),
    (300,   0.0),
]

# ── Camera ─────────────────────────────────────────────────────────────────
def setup_camera():
    bpy.ops.object.camera_add()
    cam = bpy.context.active_object
    cam.name = "RecordCam"
    cam.location = (
        CAMERA_DIST * math.cos(CAMERA_ELEV) * math.cos(math.radians(25)),
        CAMERA_DIST * math.cos(CAMERA_ELEV) * math.sin(math.radians(25)),
        CAMERA_DIST * math.sin(CAMERA_ELEV),
    )
    # Point at origin
    direction = -cam.location.normalized()
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    return cam

# ── Lighting ───────────────────────────────────────────────────────────────
def setup_lighting():
    bpy.ops.object.light_add(type="SUN", location=(3, 2, 5))
    sun = bpy.context.active_object
    sun.name = "RecordSun"
    sun.data.energy = 3.0
    sun.data.angle  = math.radians(5.0)
    # Fill light from below-left for visible faceting
    bpy.ops.object.light_add(type="AREA", location=(-2, -1.5, -0.5))
    fill = bpy.context.active_object
    fill.name = "RecordFill"
    fill.data.energy = 40.0
    fill.data.size    = 1.5

# ── Keyframes — animate the GN Twist socket ────────────────────────────────
def keyframe_twist():
    obj = bpy.data.objects.get(OBJ_NAME)
    if obj is None:
        print(f"[record] Object '{OBJ_NAME}' not found — run blueprint.py first.")
        return

    mod = next((m for m in obj.modifiers if m.name == NG_NAME), None)
    if mod is None:
        print(f"[record] Modifier '{NG_NAME}' not found.")
        return

    ng = mod.node_group
    # Find the identifier for the "Twist" socket on the modifier
    twist_id = next(
        (item.identifier for item in ng.interface.items_tree
         if item.name == "Twist" and item.in_out == "INPUT"),
        None,
    )
    if twist_id is None:
        print("[record] 'Twist' socket not found in GN interface.")
        return

    for frame, degrees in TWIST_KEYS:
        mod[twist_id] = math.radians(degrees)
        mod.keyframe_insert(data_path=f'["{twist_id}"]', frame=frame)
    print(f"[record] Keyed Twist at frames: {[k[0] for k in TWIST_KEYS]}")

# ── Render settings ────────────────────────────────────────────────────────
def configure_render():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps   = FPS
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x, scene.render.resolution_y = RESOLUTION
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format          = "MPEG4"
    scene.render.ffmpeg.codec           = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.ffmpeg.audio_codec     = "NONE"
    scene.render.filepath = OUTPUT_PATH
    # EEVEE — fast preview quality
    scene.eevee.taa_render_samples = 32

# ── Main ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Ensure output dir exists
    out_abs = bpy.path.abspath(OUTPUT_PATH)
    os.makedirs(os.path.dirname(out_abs), exist_ok=True)

    setup_camera()
    setup_lighting()
    keyframe_twist()
    configure_render()

    print("[record] Rendering 300 frames to", OUTPUT_PATH)
    bpy.ops.render.render(animation=True)
    print("[record] viewport.mp4 written.")

"""
record.py — Viewport animation for collection batch-export tutorial.
Outputs: public/library/videos/scripting/
         python-bpy-collection-link-visibility-override-batch-glb-webxr/viewport.mp4

Blender 5.1 | CC0 | 2026-07-10

Sequence (10 s @ 24 fps = 240 frames):
  0–60    All three collections visible; camera orbits slowly
  61–120  hf_lights collection hidden (LayerCollection.hide_viewport)
  121–180 hf_props collection excluded (LayerCollection.exclude)
  181–240 All restored, final orbit
"""

import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────
OUTPUT = "//../../videos/scripting/python-bpy-collection-link-visibility-override-batch-glb-webxr/viewport.mp4"
TOTAL  = 240
FPS    = 24

# ── Helpers ───────────────────────────────────────────────────────────────────

def find_layer_collection(root_lc, name):
    if root_lc.collection.name == name:
        return root_lc
    for child in root_lc.children:
        found = find_layer_collection(child, name)
        if found:
            return found
    return None


def insert_lc_flags(lc, frame, hide_viewport, exclude):
    """LayerCollection properties are not keyframeable — animate via handlers."""
    pass   # visibility toggled directly at record time per-frame below


# ── Scene setup (assumes blueprint.py has already been run) ──────────────────

scene = bpy.context.scene
scene.render.fps      = FPS
scene.render.fps_base = 1.0
scene.frame_start     = 1
scene.frame_end       = TOTAL

# Camera
cam_data = bpy.data.cameras.new("rec_cam")
cam_data.lens = 35.0
cam_obj  = bpy.data.objects.new("rec_cam", cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Orbit camera around origin; keyframe every 4 frames.
ORBIT_R = 8.0
ORBIT_Z = 4.5
for f in range(1, TOTAL + 1, 4):
    t = (f - 1) / (TOTAL - 1)
    angle = t * math.pi * 2.0 * 0.8    # 288° sweep
    cam_obj.location = (
        ORBIT_R * math.cos(angle),
        ORBIT_R * math.sin(angle),
        ORBIT_Z,
    )
    # Always look at origin.
    cam_obj.rotation_euler = (
        math.atan2(ORBIT_Z, ORBIT_R),
        0.0,
        math.radians(90) + angle,
    )
    cam_obj.keyframe_insert("location",       frame=f)
    cam_obj.keyframe_insert("rotation_euler", frame=f)

# Smooth interpolation.
if cam_obj.animation_data:
    for fc in cam_obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'

# ── Render settings ───────────────────────────────────────────────────────────

scene.render.engine         = 'BLENDER_EEVEE_NEXT'
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format             = 'MPEG4'
scene.render.ffmpeg.codec              = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath     = OUTPUT

# ── Render with mid-sequence visibility changes ────────────────────────────────
# NOTE: LayerCollection.hide_viewport and .exclude cannot be keyframed.
# We therefore render three segments with bpy.ops.render.render(animation=True)
# spanning each visibility state, then stitch in the VSE.
# The VSE stitching pattern is documented in the VSE tutorial:
#   /tutorials/blender-tutorial-python-bpy-sequence-editor-vse-script-tutorial-assembly

vl      = scene.view_layers[0]
root_lc = vl.layer_collection
lc_lights = find_layer_collection(root_lc, "hf_lights")
lc_props  = find_layer_collection(root_lc, "hf_props")

SEGMENTS = [
    (1,   60,  {"lights": (False, False), "props": (False, False)}),
    (61,  120, {"lights": (True,  False), "props": (False, False)}),
    (121, 180, {"lights": (True,  False), "props": (False, True)}),
    (181, 240, {"lights": (False, False), "props": (False, False)}),
]

for seg_start, seg_end, flags in SEGMENTS:
    if lc_lights:
        lc_lights.hide_viewport = flags["lights"][0]
        lc_lights.exclude       = flags["lights"][1]
    if lc_props:
        lc_props.hide_viewport  = flags["props"][0]
        lc_props.exclude        = flags["props"][1]

    scene.frame_start = seg_start
    scene.frame_end   = seg_end
    seg_path = OUTPUT.replace("viewport.mp4", f"seg_{seg_start:04d}.mp4")
    scene.render.filepath = seg_path
    bpy.ops.render.render(animation=True, write_still=False)
    print(f"[holoflow] Segment {seg_start}–{seg_end} rendered → {seg_path}")

# Restore frame range.
scene.frame_start = 1
scene.frame_end   = TOTAL

print("[holoflow] record.py segments complete — stitch in VSE.")

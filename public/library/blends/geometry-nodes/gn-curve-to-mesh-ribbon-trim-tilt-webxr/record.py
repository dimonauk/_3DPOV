"""
record.py — Viewport animation recorder for hf_light_ribbon
Blender 5.1 | Holoflow Studio | CC0 1.0

Run this AFTER blueprint.py has built the scene.
Animates Trim End from 0.0 → 1.0 over 120 frames (4 s at 30 fps), then
renders the viewport as an MP4 to:
  public/library/videos/geometry-nodes/gn-curve-to-mesh-ribbon-trim-tilt-webxr/viewport.mp4

The animation shows the ribbon growing on from base to tip — the canonical
demo for Trim Curve's parametric reveal technique.
"""

import bpy
import os

# ── OUTPUT ──────────────────────────────────────────────────────────────────
REPO_ROOT   = os.path.dirname(bpy.data.filepath)          # directory of .blend
OUTPUT_PATH = os.path.join(
    REPO_ROOT, "public", "library", "videos",
    "geometry-nodes", "gn-curve-to-mesh-ribbon-trim-tilt-webxr",
    "viewport.mp4"
)

FRAME_START = 1
FRAME_END   = 120
FPS         = 30

# ── SCENE SETUP ─────────────────────────────────────────────────────────────
scene = bpy.context.scene
scene.render.fps        = FPS
scene.frame_start       = FRAME_START
scene.frame_end         = FRAME_END

# Use EEVEE for fast viewport-quality render (emission materials look correct)
scene.render.engine = "BLENDER_EEVEE_NEXT"

# Output format
scene.render.image_settings.file_format    = "FFMPEG"
scene.render.ffmpeg.format                 = "MPEG4"
scene.render.ffmpeg.codec                  = "H264"
scene.render.ffmpeg.constant_rate_factor   = "MEDIUM"
scene.render.resolution_x                  = 1920
scene.render.resolution_y                  = 1080
scene.render.resolution_percentage         = 100
scene.render.filepath                      = OUTPUT_PATH

# ── FIND TARGET OBJECT & MODIFIER ───────────────────────────────────────────
obj = bpy.data.objects.get("hf_light_ribbon")
if obj is None:
    raise RuntimeError("[record.py] hf_light_ribbon not found. Run blueprint.py first.")

mod = obj.modifiers.get("HF_LightRibbon")
if mod is None:
    raise RuntimeError("[record.py] HF_LightRibbon modifier not found on hf_light_ribbon.")

# ── KEYFRAME: Trim End 0 → 1 ────────────────────────────────────────────────
# Trim End is the 2nd interface socket (index 1 in the socket order:
# Trim Start=0, Trim End=1, Tilt Turns=2, Profile Verts=3, Resample Count=4)
# In the modifier, inputs are keyed by socket identifier.

def set_trim_end(frame: int, value: float):
    scene.frame_set(frame)
    # The GN interface socket "Trim End" maps to the modifier input by name.
    # Access via the socket identifier — more stable than index.
    for item in mod.node_group.interface.items_tree:
        if item.name == "Trim End":
            mod[item.identifier] = value
            mod.keyframe_insert(data_path=f'["{item.identifier}"]', frame=frame)
            return
    raise RuntimeError("[record.py] Could not find 'Trim End' socket in modifier.")

# Frame 1: ribbon invisible (Trim End = 0)
set_trim_end(FRAME_START, 0.0)
# Frame 120: ribbon fully visible (Trim End = 1)
set_trim_end(FRAME_END, 1.0)

# ── LIGHTING: minimal HDRI-free key light for emission objects ───────────────
# Emission materials self-illuminate; a single sun lamp is added only so any
# non-emissive geometry in the scene is not pure black.
sun_data = bpy.data.lights.new("rec_sun", "SUN")
sun_data.energy = 2.0
sun_obj = bpy.data.objects.new("rec_sun", sun_data)
scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (0.8, 0.0, 0.5)

# ── CAMERA: angled view to show S-curve depth ────────────────────────────────
cam_data = bpy.data.cameras.new("rec_cam")
cam_data.lens = 50
cam_obj = bpy.data.objects.new("rec_cam", cam_data)
scene.collection.objects.link(cam_obj)
cam_obj.location       = (4.0, -4.0, 2.8)
cam_obj.rotation_euler = (1.1, 0.0, 0.8)
scene.camera = cam_obj

# ── RENDER ───────────────────────────────────────────────────────────────────
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
bpy.ops.render.render(animation=True)
print(f"[record.py] Render complete → {OUTPUT_PATH}")

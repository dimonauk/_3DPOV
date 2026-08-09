"""
record.py — Viewport animation render for the Phyllotaxis Poi Disc.

Produces public/library/videos/scripting/
  python-numpy-phyllotaxis-golden-angle-vogel-fibonacci-parastichy-poi-disc-webxr/
  viewport.mp4

Run AFTER blueprint.py (the poi disc must exist in the scene).

Camera sequence (240 frames = 8 s at 30 fps):
  0–60    Overhead plan view — full disc, all seeds visible.
  61–150  Orbit 360° around the equator at mid-elevation (elevation 40°).
  151–200 Spiral morph: scrub shape-key Alpha_180 → 0 then back to Basis,
          camera stays level — shows the packing collapse.
  201–240 Pull back to reveal the full disc floating in a dark void.
"""

import bpy
import math


# ── Scene helpers ─────────────────────────────────────────────────────────────

def clear_animation():
    """Remove all animation data from the scene objects."""
    for ob in bpy.data.objects:
        ob.animation_data_clear()


def set_workbench_vertex_colour():
    """Switch to Workbench with vertex-colour shading (no HDRI needed)."""
    for space in (
        s for a in bpy.context.screen.areas
        for s in a.spaces
        if s.type == "VIEW_3D"
    ):
        space.shading.type          = "SOLID"
        space.shading.color_type    = "VERTEX"
        space.shading.show_shadows  = False
        space.shading.light         = "STUDIO"


def find_poi():
    for ob in bpy.data.objects:
        if "phyllotaxis" in ob.name.lower():
            return ob
    raise RuntimeError("Phyllotaxis poi disc not found — run blueprint.py first.")


# ── Camera rig ────────────────────────────────────────────────────────────────

def build_camera_rig(target):
    """
    Empty + Camera parented to it, rotating around target.
    Returns (empty, camera_obj).
    """
    empty = bpy.data.objects.new("CamTarget", None)
    bpy.context.collection.objects.link(empty)
    empty.location = (0.0, 0.0, 0.003)

    cam_data = bpy.data.cameras.new("RecordCam")
    cam_data.lens = 85          # moderate telephoto — flatters the disc
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.collection.objects.link(cam_obj)

    # Track-to constraint
    cns = cam_obj.constraints.new("TRACK_TO")
    cns.target    = empty
    cns.track_axis = "TRACK_NEGATIVE_Z"
    cns.up_axis   = "UP_Y"

    bpy.context.scene.camera = cam_obj
    return empty, cam_obj


def set_camera_spherical(cam_obj, radius: float, elevation_deg: float, azimuth_deg: float):
    """Position camera on a sphere of `radius` at given elevation + azimuth."""
    el  = math.radians(elevation_deg)
    az  = math.radians(azimuth_deg)
    cam_obj.location = (
        radius * math.cos(el) * math.cos(az),
        radius * math.cos(el) * math.sin(az),
        radius * math.sin(el),
    )


# ── Shape-key keyframing ───────────────────────────────────────────────────────

def find_shape_key(poi, key_name: str):
    kb = poi.data.shape_keys
    if not kb:
        return None
    return kb.key_blocks.get(key_name)


def zero_all_keys(poi, frame: int):
    """Set all non-Basis shape key values to 0.0 at `frame`."""
    kb = poi.data.shape_keys
    if not kb:
        return
    bpy.context.scene.frame_set(frame)
    for block in kb.key_blocks:
        if block.name == "Basis":
            continue
        block.value = 0.0
        block.keyframe_insert(data_path="value", frame=frame)


def keyframe_key(poi, key_name: str, value: float, frame: int):
    sk = find_shape_key(poi, key_name)
    if sk is None:
        return
    bpy.context.scene.frame_set(frame)
    sk.value = value
    sk.keyframe_insert(data_path="value", frame=frame)


# ── Render settings ───────────────────────────────────────────────────────────

def configure_render(output_dir: str):
    scene   = bpy.context.scene
    scene.render.engine           = "BLENDER_WORKBENCH"
    scene.render.resolution_x     = 1920
    scene.render.resolution_y     = 1080
    scene.render.fps               = 30
    scene.frame_start              = 1
    scene.frame_end                = 240
    scene.render.image_settings.file_format  = "FFMPEG"
    scene.render.ffmpeg.format               = "MPEG4"
    scene.render.ffmpeg.codec                = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath = output_dir + "viewport"


# ── Main ──────────────────────────────────────────────────────────────────────

import os

OUTPUT_BASE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "..",
    "public", "library", "videos", "scripting",
    "python-numpy-phyllotaxis-golden-angle-vogel-fibonacci-parastichy-poi-disc-webxr",
    "",  # trailing sep
)
os.makedirs(OUTPUT_BASE, exist_ok=True)

clear_animation()
set_workbench_vertex_colour()

poi = find_poi()
bpy.context.view_layer.objects.active = poi

empty, cam = build_camera_rig(poi)
configure_render(OUTPUT_BASE)

CAM_DIST = 0.18    # metres from disc centre

# Phase 1 (1–60): plan view, directly overhead
for fr in range(1, 61):
    t = (fr - 1) / 59.0
    set_camera_spherical(cam, CAM_DIST, 80.0 - t * 40.0, 90.0)
    cam.keyframe_insert(data_path="location", frame=fr)
zero_all_keys(poi, 1)

# Phase 2 (61–150): full 360° orbit at elevation 40°
for fr in range(61, 151):
    t   = (fr - 61) / 89.0
    az  = 90.0 + t * 360.0
    set_camera_spherical(cam, CAM_DIST, 40.0, az)
    cam.keyframe_insert(data_path="location", frame=fr)

# Phase 3 (151–200): morph Alpha_180 in and out — shows packing breakdown
# Key 151: all keys at 0
zero_all_keys(poi, 151)
# Key 175: Alpha_180 = 1.0 (fully broken)
keyframe_key(poi, "Alpha_180", 0.0, 151)
keyframe_key(poi, "Alpha_180", 1.0, 175)
# Key 200: back to 0
keyframe_key(poi, "Alpha_180", 0.0, 200)
# Camera stays level, close
for fr in range(151, 201):
    set_camera_spherical(cam, CAM_DIST * 0.9, 35.0, 90.0 + (fr - 151) * 2.0)
    cam.keyframe_insert(data_path="location", frame=fr)

# Phase 4 (201–240): pull back to full reveal
for fr in range(201, 241):
    t = (fr - 201) / 39.0
    set_camera_spherical(cam, CAM_DIST + t * 0.08, 35.0, 90.0 + (fr - 200) * 2.0)
    cam.keyframe_insert(data_path="location", frame=fr)

# Interpolation: linear for camera, bezier for shape keys (auto)
for ob in (cam, poi):
    if ob.animation_data and ob.animation_data.action:
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"

bpy.ops.render.render(animation=True)
print(f"[phyllotaxis record] Animation rendered → {OUTPUT_BASE}viewport.mp4")

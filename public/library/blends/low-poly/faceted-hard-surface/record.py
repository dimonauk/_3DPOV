"""
Blender 5.1 Record Script: Faceted Hard-Surface Panel — viewport turntable
===========================================================================
Builds the panel via blueprint.py logic, sets up a three-point studio light
rig, animates a 360° Y-axis rotation over 150 frames, and renders a viewport
(EEVEE) animation to:
  public/library/videos/low-poly/faceted-hard-surface/viewport.mp4

Run: blender --background --python record.py
Prerequisites: none beyond a vanilla Blender 5.1 install.
Output: H.264 MP4, 1920×1080, 30 fps, ~5 seconds.
"""

import bpy
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))
import blueprint  # noqa: E402 — sibling module

SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
OUTPUT_DIR = os.path.normpath(
    os.path.join(SCRIPT_DIR, "..", "..", "..", "videos", "low-poly", "faceted-hard-surface")
)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "viewport")   # Blender appends frame ext


# ── Render settings ────────────────────────────────────────────────────────────
def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine          = "BLENDER_EEVEE_NEXT"   # 5.1 EEVEE name
    scene.render.resolution_x    = 1920
    scene.render.resolution_y    = 1080
    scene.render.fps             = 30
    scene.frame_start            = 1
    scene.frame_end              = 150
    scene.render.filepath        = OUTPUT_PATH
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format   = "MPEG4"
    scene.render.ffmpeg.codec    = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"

    # EEVEE — fast enough for viewport preview quality, no path-trace noise.
    eevee = scene.eevee
    eevee.use_bloom              = False   # no glow; cel reads cleaner without
    eevee.use_ambient_occlusion  = True
    eevee.ao_distance            = 0.3


# ── Camera ─────────────────────────────────────────────────────────────────────
def add_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(0.0, -1.6, 0.15))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(90), 0.0, 0.0)
    bpy.context.scene.camera = cam

    cam.data.type        = "PERSP"
    cam.data.lens        = 50   # mm; natural perspective, no distortion
    cam.data.clip_end    = 50.0
    return cam


# ── Lighting ───────────────────────────────────────────────────────────────────
def add_lights() -> None:
    """
    Three-point rig tuned for faceted geometry.
    Key: front-left, high — primary shadow that reveals the facet relief.
    Fill: front-right, low — softens the shadow side without killing facets.
    Rim:  rear, high — separates the silhouette from the background.
    All area lights to keep shadows crisp but not harsh.
    """
    lights = [
        # (name,        location,           rotation_euler (deg),  energy, colour)
        ("Key",   (-1.5, -1.2,  1.5),  (45, -30, 0),   400, (1.00, 0.97, 0.93)),
        ("Fill",  ( 1.2, -1.0,  0.0),  (90,  20, 0),   120, (0.82, 0.88, 1.00)),
        ("Rim",   ( 0.0,  1.8,  1.2),  (-50,  0, 0),   250, (1.00, 0.95, 0.88)),
    ]
    for name, loc, rot_deg, energy, colour in lights:
        bpy.ops.object.light_add(type="AREA", location=loc)
        light = bpy.context.active_object
        light.name = f"Light_{name}"
        light.rotation_euler = tuple(math.radians(d) for d in rot_deg)
        light.data.energy = energy
        light.data.color  = colour
        light.data.size   = 0.8


# ── Rotation animation ─────────────────────────────────────────────────────────
def animate_rotation(obj: bpy.types.Object) -> None:
    """
    360° Y-axis rotation over 150 frames (5 s at 30 fps).
    Y-axis rotation shows the panel from every angle, including the
    side profile where the inset depth and bevel chamfers are most visible.
    """
    obj.rotation_euler = (0.0, 0.0, 0.0)
    obj.keyframe_insert(data_path="rotation_euler", frame=1)

    obj.rotation_euler.y = math.radians(360)
    obj.keyframe_insert(data_path="rotation_euler", frame=150)

    # Use LINEAR interpolation for constant-speed rotation (no ease-in/out).
    action = obj.animation_data.action
    for fcurve in action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = "LINEAR"


# ── World background ───────────────────────────────────────────────────────────
def set_background() -> None:
    world = bpy.data.worlds.new("RecordWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value   = (0.05, 0.05, 0.07, 1.0)  # near-black
    bg.inputs["Strength"].default_value = 0.0


# ── Entry point ────────────────────────────────────────────────────────────────
def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    blueprint.clear_scene()
    obj = blueprint.build_panel_mesh()
    blueprint.apply_smooth_by_angle(obj, blueprint.SMOOTH_ANGLE_DEG)
    blueprint.mark_silhouette_sharps(obj)
    blueprint.assign_flat_material(obj)

    configure_render()
    add_camera()
    add_lights()
    set_background()
    animate_rotation(obj)

    bpy.ops.render.render(animation=True)
    print(f"[holoflow] ✓ render complete → {OUTPUT_PATH}.mp4")


if __name__ == "__main__":
    main()

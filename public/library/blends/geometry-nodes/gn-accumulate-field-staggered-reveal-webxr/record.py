"""
record.py — Viewport animation render: staggered hex-pillar reveal
Blender 5.1  |  CC0  |  Holoflow Studio

Run after blueprint.py has been executed in the same session, or open
stagger_reveal.blend and run this script from the Text Editor.

Renders 150 frames (5 s at 30 fps) covering the full 3 s stagger window
plus a 2 s hold of the completed grid.  Camera is slightly elevated and
angled to show the wave sweeping across the hex-pillar field.

Output:
  public/library/videos/geometry-nodes/
    gn-accumulate-field-staggered-reveal-webxr/viewport.mp4
"""

import bpy

OUTPUT = (
    "//../../../../videos/geometry-nodes/"
    "gn-accumulate-field-staggered-reveal-webxr/viewport.mp4"
)
FRAME_START = 0
FRAME_END   = 149    # 5 s at 30 fps
FPS         = 30

scn = bpy.context.scene
scn.render.engine              = "BLENDER_EEVEE_NEXT"
scn.render.resolution_x        = 1920
scn.render.resolution_y        = 1080
scn.render.resolution_percentage = 100
scn.render.fps                 = FPS
scn.frame_start                = FRAME_START
scn.frame_end                  = FRAME_END
scn.render.filepath            = OUTPUT
scn.render.image_settings.file_format = "FFMPEG"
scn.render.ffmpeg.format       = "MPEG4"
scn.render.ffmpeg.codec        = "H264"
scn.render.ffmpeg.constant_rate_factor = "HIGH"

# ── Camera ────────────────────────────────────────────────────────────────────
# Diagonal view from above-left gives a clear read of the left-to-right wave
bpy.ops.object.camera_add(location=(-3.5, -7.5, 6.0))
cam              = bpy.context.active_object
cam.name         = "render_cam"
cam.rotation_euler = (1.05, 0.0, -0.38)   # ~60° down, ~22° pan right
scn.camera       = cam

# ── Key light ─────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="SUN", location=(5, -5, 10))
sun              = bpy.context.active_object
sun.name         = "key_sun"
sun.data.energy  = 3.5
sun.data.angle   = 0.08   # sharp shadows emphasise the hex geometry

# ── Rim fill ──────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type="AREA", location=(-4, 4, 3))
rim              = bpy.context.active_object
rim.name         = "rim_fill"
rim.data.energy  = 60.0
rim.data.size    = 3.0
rim.rotation_euler = (2.2, 0.0, 2.8)

# ── World background ──────────────────────────────────────────────────────────
scn.world        = bpy.data.worlds.new("render_world")
scn.world.use_nodes = True
bg               = scn.world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value   = (0.04, 0.04, 0.06, 1.0)
bg.inputs["Strength"].default_value = 0.6

bpy.ops.render.render(animation=True)
print(f"Viewport render complete → {OUTPUT}")

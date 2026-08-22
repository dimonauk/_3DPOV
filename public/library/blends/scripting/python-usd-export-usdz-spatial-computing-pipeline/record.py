"""
record.py — Viewport animation recording script
python-usd-export-usdz-spatial-computing-pipeline
Blender 5.1 | CC0 — Holoflow Studio

Output: public/library/videos/scripting/
          python-usd-export-usdz-spatial-computing-pipeline/viewport.mp4
Duration: ~5 s (120 frames at 24 fps)
Scene:    Faceted gem turntable, floor plane, key light, orbit camera.
          Demonstrates the export-ready scene that blueprint.py sends to USD.

Run via Blender:
  blender --background --python record.py
Or open Blender, paste into Scripting tab, Run Script.
"""

import bpy, mathutils, os

# ── Config ───────────────────────────────────────────────────────────────────
VIDEO_OUTPUT = os.path.join(
    bpy.path.abspath("//"),
    "..", "..", "..", "..",
    "public", "library", "videos", "scripting",
    "python-usd-export-usdz-spatial-computing-pipeline",
    "viewport"
)
FRAME_START  = 1
FRAME_END    = 120    # 5 s at 24 fps
RENDER_W     = 1280
RENDER_H     = 720

# ── Scene ────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Gem
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.5,
                                      location=(0, 0, 0.6))
gem = bpy.context.active_object
gem.name = "gem"
bpy.ops.object.shade_flat()
mat = bpy.data.materials.new("gem_glass_preview")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value           = (0.2, 0.7, 1.0, 1.0)
bsdf.inputs["Roughness"].default_value            = 0.05
bsdf.inputs["Transmission Weight"].default_value  = 0.9
gem.data.materials.append(mat)

# Floor
bpy.ops.mesh.primitive_plane_add(size=4.0, location=(0, 0, 0))
floor = bpy.context.active_object
floor.name = "floor"
fm = bpy.data.materials.new("floor_dark")
fm.use_nodes = True
fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (
    0.08, 0.08, 0.10, 1.0)
fm.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.7
floor.data.materials.append(fm)

# Light
bpy.ops.object.light_add(type='AREA', location=(2.5, -2.0, 3.5))
key = bpy.context.active_object
key.name = "key_light"
key.data.energy = 120.0
key.data.size   = 1.5
key.rotation_euler = mathutils.Euler((0.96, 0, 0.785), 'XYZ')

# Orbit camera — driven by an empty rotating around origin
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
rig = bpy.context.active_object
rig.name = "cam_rig"

bpy.ops.object.camera_add(location=(0, -3.5, 1.5))
cam = bpy.context.active_object
cam.name = "orbit_cam"
cam.rotation_euler = mathutils.Euler((1.22, 0, 0), 'XYZ')
cam.parent = rig
bpy.context.scene.camera = cam

# Gem spin + camera orbit animation
for obj, axis_idx, end_val in [
    (gem, 2, 6.28318),   # Z-spin one full turn
    (rig, 2, 6.28318),   # camera orbit
]:
    action = bpy.data.actions.new(f"{obj.name}_anim")
    obj.animation_data_create()
    obj.animation_data.action = action
    fc = action.fcurves.new(data_path="rotation_euler", index=axis_idx)
    fc.keyframe_points.add(count=2)
    fc.keyframe_points[0].co = (FRAME_START, 0.0)
    fc.keyframe_points[1].co = (FRAME_END,   end_val)
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'
    fc.update()

# ── Render settings (EEVEE Next viewport quality) ────────────────────────────
scn = bpy.context.scene
scn.frame_start = FRAME_START
scn.frame_end   = FRAME_END
scn.render.engine               = 'BLENDER_EEVEE_NEXT'
scn.render.resolution_x         = RENDER_W
scn.render.resolution_y         = RENDER_H
scn.render.fps                  = 24
scn.render.image_settings.file_format = 'FFMPEG'
scn.render.ffmpeg.format        = 'MPEG4'
scn.render.ffmpeg.codec         = 'H264'
scn.render.ffmpeg.constant_rate_factor = 'HIGH'
scn.render.filepath             = VIDEO_OUTPUT

bpy.ops.render.render(animation=True)
print(f"[record] Rendered → {VIDEO_OUTPUT}.mp4")

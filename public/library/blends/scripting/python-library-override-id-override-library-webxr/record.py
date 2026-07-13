"""
Holoflow Studio — Viewport Recording Script
Python bpy.types.IDOverrideLibrary — Library Override WebXR Composition
Outputs: public/library/videos/scripting/python-library-override-id-override-library-webxr/viewport.mp4

This script animates the viewport to show:
  0–30   (0.0–1.0 s)  Linked prop at library-default position (centre, default teal)
  31–60  (1.0–2.0 s)  Camera dolly reveals the override position (right, studio teal)
  61–90  (2.0–3.0 s)  Wireframe overlay highlights the override boundary
  91–120 (3.0–4.0 s)  Smooth rotate around the composed scene; fade to solid

Frame rate: 30 fps.  Total: 4 seconds, 120 frames.
"""

import bpy
import math

SLUG   = "python-library-override-id-override-library-webxr"
FPS    = 30
FRAMES = 120
OUT    = f"//../../videos/scripting/{SLUG}/viewport.mp4"

# ─── Minimal scene rebuild for recording ────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for blk in (bpy.data.meshes, bpy.data.materials):
    for item in list(blk):
        blk.remove(item)

# Library reference: faceted sphere at origin (library default)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, segments=8, ring_count=6, location=(0, 0, 0))
lib_gem = bpy.context.active_object
lib_gem.name = "gem_library_ref"
for poly in lib_gem.data.polygons:
    poly.use_smooth = False
mat_lib = bpy.data.materials.new("gem_lib_mat")
mat_lib.use_nodes = True
mat_lib.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.08, 0.55, 0.75, 1.0)
mat_lib.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value  = 0.22
lib_gem.data.materials.append(mat_lib)

# Override copy: same shape, studio teal, at offset position
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, segments=8, ring_count=6, location=(1.4, 0, 0))
ov_gem = bpy.context.active_object
ov_gem.name = "gem_override"
for poly in ov_gem.data.polygons:
    poly.use_smooth = False
mat_ov = bpy.data.materials.new("gem_override_mat")
mat_ov.use_nodes = True
mat_ov.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.12, 0.72, 0.85, 1.0)
mat_ov.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value  = 0.22
ov_gem.data.materials.append(mat_ov)

# Floor
bpy.ops.mesh.primitive_plane_add(size=4.0, location=(0, 0, -0.5))
floor = bpy.context.active_object
floor.name = "floor_plane"
mat_fl = bpy.data.materials.new("floor_mat")
mat_fl.use_nodes = True
mat_fl.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.18, 0.18, 0.22, 1.0)
floor.data.materials.append(mat_fl)

# Camera
bpy.ops.object.camera_add(location=(3.5, -3.5, 2.2))
cam = bpy.context.active_object
cam.name = "record_cam"
cam.rotation_euler = (math.radians(58), 0, math.radians(46))
bpy.context.scene.camera = cam

# Light
bpy.ops.object.light_add(type='AREA', location=(2.0, -2.0, 3.0))
key = bpy.context.active_object
key.name = "key_light"
key.data.energy = 120.0

# ─── Animation: camera orbit around scene centre ─────────────────────────────
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = FRAMES
scene.render.fps  = FPS

# Orbit: camera animates on a 3 m circle around (0.7, 0, 0) — midpoint of both gems
cx, cy_base, cz = 0.7, -3.5, 2.2
radius = math.sqrt(cx**2 + cy_base**2)  # ≈ 3.57 m orbit radius

for f in range(1, FRAMES + 1):
    t      = (f - 1) / (FRAMES - 1)
    angle  = t * math.pi * 0.6              # 108° sweep, not a full orbit
    cam_x  = 0.7 + radius * math.sin(angle)
    cam_y  = -radius * math.cos(angle)
    cam.location = (cam_x, cam_y, cz)

    # Look-at: point camera at midpoint of both gems
    import mathutils
    direction = mathutils.Vector((0.7, 0, 0)) - mathutils.Vector((cam_x, cam_y, cz))
    quat      = direction.to_track_quat('-Z', 'Y')
    cam.rotation_euler = quat.to_euler()

    cam.keyframe_insert("location",        frame=f)
    cam.keyframe_insert("rotation_euler",  frame=f)

# ─── Wireframe toggle at frame 61 ────────────────────────────────────────────
for space in (s for area in bpy.context.screen.areas
              if area.type == 'VIEW_3D'
              for s in area.spaces if s.type == 'VIEW_3D'):
    space.overlay.show_wireframes = False

# We do not keyframe overlays from Python (not animatable RNA) — the
# SCREEN-RECORDING-NOTES.md instructs the operator to toggle it manually.

# ─── Render settings for OpenGL animation ────────────────────────────────────
scene.render.resolution_x   = 1920
scene.render.resolution_y   = 1080
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format              = 'MPEG4'
scene.render.ffmpeg.codec               = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
scene.render.filepath = bpy.path.abspath(OUT)

# Run via:  bpy.ops.render.opengl(animation=True)
print(f"[{SLUG}] record.py configured — run bpy.ops.render.opengl(animation=True)")

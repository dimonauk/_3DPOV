"""
record.py — viewport animation for Join/Transform lantern tutorial
Blender 5.1 · CC0 · Holoflow Studio

Renders a 6-second (180-frame @ 30fps) OpenGL viewport animation showing
the lantern rotating once on its vertical axis while the gem core pulses
between dim and full emission. Run AFTER blueprint.py has built the scene.

Output:
  public/library/videos/geometry-nodes/
    gn-join-geometry-transform-multi-part-assembly-lantern-webxr/viewport.mp4
"""

import bpy, math

# ── Resolve lantern object ─────────────────────────────────────────────────────
obj = bpy.data.objects.get("hf_lantern")
if obj is None:
    raise RuntimeError("Run blueprint.py first — 'hf_lantern' object not found.")

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = 180
scene.render.fps  = 30

# ── Full 360° Y-rotation over 180 frames ──────────────────────────────────────
# Insert rotation keyframes directly on the object's euler channel
obj.rotation_euler = (0.0, 0.0, 0.0)
obj.keyframe_insert(data_path="rotation_euler", frame=1)

obj.rotation_euler = (0.0, 0.0, math.radians(360))
obj.keyframe_insert(data_path="rotation_euler", frame=180)

# LINEAR interpolation → constant angular velocity (no ease-in/out spin)
if obj.animation_data and obj.animation_data.action:
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

# ── Emit pulse on gem material (Emission Strength 0.4 → 1.8 → 0.4) ───────────
mat_gem = bpy.data.materials.get("Lantern_Gem")
if mat_gem:
    bsdf = mat_gem.node_tree.nodes.get("Principled BSDF")
    if bsdf and "Emission Strength" in bsdf.inputs:
        em = bsdf.inputs["Emission Strength"]
        em.default_value = 0.4
        em.keyframe_insert(data_path="default_value", frame=1)
        em.default_value = 1.8
        em.keyframe_insert(data_path="default_value", frame=90)
        em.default_value = 0.4
        em.keyframe_insert(data_path="default_value", frame=180)
        for fc in mat_gem.node_tree.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing        = 'AUTO'

# ── Camera: 3/4 front view, slightly above ────────────────────────────────────
cam_data = bpy.data.cameras.new("record_cam_data")
cam_obj  = bpy.data.objects.new("record_cam", cam_data)
scene.collection.objects.link(cam_obj)
cam_obj.location       = (0.6, -1.0, 0.55)
cam_obj.rotation_euler = (math.radians(72), 0.0, math.radians(30))
cam_data.type          = 'PERSP'
cam_data.lens          = 60.0
scene.camera           = cam_obj

# ── Lighting ──────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(2, -2, 4))
sun = bpy.context.active_object
sun.data.energy        = 4.0
sun.rotation_euler     = (math.radians(55), 0, math.radians(40))

bpy.ops.object.light_add(type='POINT', location=(-1, 1, 0.5))
fill = bpy.context.active_object
fill.data.energy       = 1.5
fill.data.color        = (0.7, 0.85, 1.0)

# ── Render settings (OpenGL viewport) ─────────────────────────────────────────
render = scene.render
render.resolution_x         = 1280
render.resolution_y         = 720
render.resolution_percentage = 100
render.fps                  = 30

output_path = "//../../videos/geometry-nodes/gn-join-geometry-transform-multi-part-assembly-lantern-webxr/viewport"
render.filepath = output_path
render.image_settings.file_format = 'FFMPEG'
render.ffmpeg.format               = 'MPEG4'
render.ffmpeg.codec                = 'H264'
render.ffmpeg.constant_rate_factor = 'MEDIUM'

# Viewport shading — SOLID with flat-shade cavities shows facets clearly
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type          = 'MATERIAL'
                space.shading.use_scene_lights = True
                break

bpy.ops.render.opengl(animation=True, write_still=False)
print("Viewport animation rendered →", output_path)

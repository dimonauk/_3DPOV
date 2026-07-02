# record.py — viewport animation: N-Panel add-on demo
# Output: public/library/videos/scripting/python-custom-panel-operator-n-panel-sidebar/viewport.mp4
#
# Sequence (90 frames @ 30fps = 3 seconds):
#   0–29   — three coloured mesh props in default pose, named with spaces
#   30–59  — objects scale-animated to show "selection" pulse, then renamed
#   60–89  — colour shift on each mesh simulates facet-tag toggling

import bpy, math

OUTPUT_PATH = "//../../videos/scripting/python-custom-panel-operator-n-panel-sidebar/viewport.mp4"
TOTAL_FRAMES = 90
FPS = 30

# ── Scene reset ──────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = TOTAL_FRAMES
scene.render.fps = FPS
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

# ── Camera ────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(6, -5, 4))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(55), 0, math.radians(47))
scene.camera = cam

# ── Light ─────────────────────────────────────────────────────
bpy.ops.object.light_add(type="SUN", location=(3, 3, 8))
sun = bpy.context.active_object
sun.data.energy = 3.0

# ── Three prop meshes ─────────────────────────────────────────
MESH_DEFS = [
    ("Panel A Rough", "CUBE",     (-2.0, 0, 0), (0.8, 0.05, 1.2), (0.7, 0.3, 0.1, 1)),
    ("Wall Trim.01",  "CYLINDER", ( 0.0, 0, 0), (0.4, 0.4, 1.0),  (0.2, 0.5, 0.8, 1)),
    ("Floor_Detail",  "SPHERE",   ( 2.0, 0, 0), (0.6, 0.6, 0.6),  (0.3, 0.7, 0.3, 1)),
]

objs = []
for raw_name, prim, loc, scale, colour in MESH_DEFS:
    if prim == "CUBE":
        bpy.ops.mesh.primitive_cube_add(location=loc)
    elif prim == "CYLINDER":
        bpy.ops.mesh.primitive_cylinder_add(location=loc)
    else:
        bpy.ops.mesh.primitive_uv_sphere_add(location=loc)

    obj = bpy.context.active_object
    obj.name = raw_name
    obj.scale = scale

    mat = bpy.data.materials.new(name=f"mat_{raw_name}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = colour
        bsdf.inputs["Roughness"].default_value = 0.6
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

    obj.keyframe_insert(data_path="scale", frame=1)
    objs.append(obj)

# ── Phase 1 (f1–30): pulse scale on first object ─────────────
o = objs[0]
for f, sx in [(15, 1.15), (30, 1.0)]:
    o.scale = (sx * 0.8, sx * 0.05, sx * 1.2)
    o.keyframe_insert(data_path="scale", frame=f)

# ── Phase 2 (f31–60): facet-tag colour flash on second object ─
# Simulate "holoflow:facet" toggle by shifting emission colour
o2 = objs[1]
mat2 = o2.data.materials[0]
bsdf2 = mat2.node_tree.nodes.get("Principled BSDF")
if bsdf2:
    bsdf2.inputs["Emission Color"].default_value = (0, 0, 0, 1)
    bsdf2.inputs["Emission Color"].keyframe_insert(data_path="default_value", frame=31)
    bsdf2.inputs["Emission Color"].default_value = (0.1, 0.8, 1.0, 1)
    bsdf2.inputs["Emission Color"].keyframe_insert(data_path="default_value", frame=46)
    bsdf2.inputs["Emission Strength"].default_value = 0.0
    bsdf2.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=31)
    bsdf2.inputs["Emission Strength"].default_value = 3.0
    bsdf2.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=46)
    bsdf2.inputs["Emission Strength"].default_value = 0.0
    bsdf2.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=60)

# ── Phase 3 (f61–90): rotate all objects slowly for outro ─────
for obj in objs:
    obj.keyframe_insert(data_path="rotation_euler", frame=61)
    import mathutils
    obj.rotation_euler = mathutils.Euler((0, 0, math.radians(45)), "XYZ")
    obj.keyframe_insert(data_path="rotation_euler", frame=90)

# ── Render ────────────────────────────────────────────────────
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format = "MPEG4"
scene.render.ffmpeg.codec = "H264"
scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
scene.render.filepath = OUTPUT_PATH

bpy.ops.render.render(animation=True)
print(f"[record.py] Done → {OUTPUT_PATH}")

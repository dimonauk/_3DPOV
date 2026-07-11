"""
record.py — Viewport animation recording for UV Atlas tutorial
Renders a 5-second turntable of the three atlas-mapped props.
Output: public/library/videos/scripting/python-bpy-mesh-uv-layer-atlas-pack-multi-object-webxr/viewport.mp4

Run:
  blender --background --python record.py
"""

import bpy, math, pathlib

# ── output path ───────────────────────────────────────────────────────────────
OUT_DIR = pathlib.Path(__file__).parent.parent.parent.parent.parent / \
          "videos/scripting/python-bpy-mesh-uv-layer-atlas-pack-multi-object-webxr"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT  = str(OUT_DIR / "viewport.mp4")

# ── scene setup ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc  = bpy.context.scene
col = sc.collection

# --- props (simplified — no modifiers for fast render) ---
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.5))
body = bpy.context.active_object; body.name = "prop_body"
body.scale = (0.5, 0.5, 0.9)
bpy.ops.object.transform_apply(scale=True)

bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.07, depth=0.45, location=(0, 0, 0))
pillar = bpy.context.active_object; pillar.name = "prop_pillar"

bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=0.22, location=(0, 0, 1.1))
cap = bpy.context.active_object; cap.name = "prop_cap"

PROPS = [body, pillar, cap]

# ── atlas debug material ──────────────────────────────────────────────────────
import numpy as np
ATLAS_SIZE = 256
h = ATLAS_SIZE // 2
grid = np.zeros((ATLAS_SIZE, ATLAS_SIZE, 4), dtype=np.float32)
grid[:h, :h] = [0.78, 0.22, 0.22, 1.0]
grid[:h, h:] = [0.22, 0.72, 0.22, 1.0]
grid[h:, :h] = [0.22, 0.32, 0.85, 1.0]
grid[h:, h:] = [0.82, 0.82, 0.82, 1.0]

atlas_img = bpy.data.images.new("atlas_record", ATLAS_SIZE, ATLAS_SIZE, alpha=False)
atlas_img.pixels.foreach_set(grid.ravel().tolist())

mat = bpy.data.materials.new("atlas_record_mat")
mat.use_nodes = True
nt = mat.node_tree; nt.nodes.clear()

out = nt.nodes.new("ShaderNodeOutputMaterial"); out.location = (400, 0)
pe  = nt.nodes.new("ShaderNodeBsdfPrincipled"); pe.location  = (150, 0)
tex = nt.nodes.new("ShaderNodeTexImage");       tex.location = (-100, 150)
uvn = nt.nodes.new("ShaderNodeTexCoord");       uvn.location = (-320, 150)
tex.image = atlas_img; tex.interpolation = 'Closest'
nt.links.new(uvn.outputs["UV"], tex.inputs["Vector"])
nt.links.new(tex.outputs["Color"], pe.inputs["Base Color"])
nt.links.new(pe.outputs["BSDF"], out.inputs["Surface"])

# Apply smart UV project and quadrant placement
import math as _math
QUADRANT = {
    "prop_body":   (0.0, 0.0),
    "prop_pillar": (0.5, 0.0),
    "prop_cap":    (0.0, 0.5),
}
for obj in PROPS:
    with bpy.context.temp_override(active_object=obj, selected_objects=[obj], edit_object=obj):
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=_math.radians(66), island_margin=0.01, scale_to_bounds=True)
        bpy.ops.object.mode_set(mode='OBJECT')
    mesh = obj.data
    attr = next((a for a in mesh.attributes if a.data_type == 'FLOAT2' and a.domain == 'CORNER'), None)
    if attr:
        buf = np.empty(len(mesh.loops) * 2, dtype=np.float32)
        attr.data.foreach_get("vector", buf)
        uvs = buf.reshape(-1, 2)
        um, vm = uvs[:, 0].min(), uvs[:, 1].min()
        ur = max(uvs[:, 0].max() - um, 1e-6)
        vr = max(uvs[:, 1].max() - vm, 1e-6)
        ox, oy = QUADRANT.get(obj.name, (0.0, 0.0))
        pad = 0.005; sc2 = 0.5 - pad * 2
        uvs[:, 0] = (uvs[:, 0] - um) / ur * sc2 + ox + pad
        uvs[:, 1] = (uvs[:, 1] - vm) / vr * sc2 + oy + pad
        attr.data.foreach_set("vector", uvs.ravel().tolist())
    obj.data.materials.clear()
    obj.data.materials.append(mat)

# ── pivot empty for turntable ─────────────────────────────────────────────────
bpy.ops.object.empty_add(location=(0, 0, 0.55))
pivot = bpy.context.active_object; pivot.name = "pivot"
for obj in PROPS:
    obj.parent = pivot

# ── camera ────────────────────────────────────────────────────────────────────
bpy.ops.object.camera_add(location=(2.8, -2.8, 1.4))
cam = bpy.context.active_object; cam.name = "rec_cam"
cam.data.lens = 50
sc.camera = cam

import mathutils
direction = mathutils.Vector((0, 0, 0.55)) - mathutils.Vector((2.8, -2.8, 1.4))
rot_quat  = direction.to_track_quat('-Z', 'Y')
cam.rotation_euler = rot_quat.to_euler()

# ── light ─────────────────────────────────────────────────────────────────────
bpy.ops.object.light_add(type='SUN', location=(4, -2, 6))
sun = bpy.context.active_object
sun.data.energy = 3.0

# ── turntable animation: 0°→360° over 150 frames (5 s at 30 fps) ─────────────
FRAMES = 150
sc.frame_start = 1
sc.frame_end   = FRAMES
sc.render.fps  = 30

pivot.rotation_euler = (0, 0, 0)
pivot.keyframe_insert("rotation_euler", frame=1)
pivot.rotation_euler = (0, 0, _math.radians(360))
pivot.keyframe_insert("rotation_euler", frame=FRAMES)

for fc in pivot.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# ── render settings ───────────────────────────────────────────────────────────
sc.render.engine               = 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x         = 1280
sc.render.resolution_y         = 720
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'FFMPEG'
sc.render.ffmpeg.format        = 'MPEG4'
sc.render.ffmpeg.codec         = 'H264'
sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
sc.render.filepath             = OUTPUT

bpy.ops.render.opengl(animation=True, write_still=False)
print(f"[holoflow] Viewport recording → {OUTPUT}")

"""
blueprint.py — ClothModifier → Vertex Animation Texture (VAT) for WebXR
Blender 5.1  ·  Holoflow Studio  ·  CC0

Captures per-frame vertex positions + normals from a cloth simulation into
two 32-bit EXR images (vat_position.exr, vat_normal.exr).  Exports the
rest-pose mesh as a GLB with a VAT_ID UV channel so the WebXR shader can
sample the correct column per vertex.  A vat_meta.json carries the bounding
box and frame count for shader-side decode.

VAT layout
  col  = vertex index, padded right to the next power-of-two width
  row  = simulation frame (row 0 = frame FRAME_START, bottom of image)
  pos  : RGBA32F — (x_norm, y_norm, z_norm, 1)  normalised by global bbox
  nrm  : RGBA32F — ((nx+1)/2, (ny+1)/2, (nz+1)/2, 1)

WebXR shader snippet (GLSL 300 es)
  float t = clamp(uTime / uVATFrames, 0.0, 1.0 - 1.0/uVATFrames);
  vec2  uv_pos = vec2(aVatId, t + 0.5/uVATFrames);
  vec3  pos_n  = texture(uVATPos, uv_pos).rgb;
  vec3  pos    = uBBoxMin + pos_n * uBBoxSize;
  gl_Position  = uMVP * vec4(pos, 1.0);
"""
import bpy
import bmesh
import json
import math
from mathutils import Matrix, Vector

# ── Parameters ─────────────────────────────────────────────────────────────────
CLOTH_NAME  = "ClothFlag"
VAT_FRAMES  = 48       # simulation length == texture height
FRAME_START = 1
GRID_X      = 12       # quads along X  →  13 vertices
GRID_Y      = 8        # quads along Y  →   9 vertices; top row pinned
FLAG_W      = 1.0      # world width after bmesh scale
FLAG_H      = 0.6      # world height
WIND_STR    = 3.5      # m/s
WIND_NOISE  = 0.4
DRACO_LVL   = 6
OUT         = "//"     # relative to the saved .blend

def _pow2(n: int) -> int:
    p = 1
    while p < n:
        p <<= 1
    return p

# ── Scene ───────────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.frame_start = FRAME_START
sc.frame_end   = FRAME_START + VAT_FRAMES - 1

# ── Build flag mesh ─────────────────────────────────────────────────────────────
# create_grid with size=0.5 → vertices span −0.5…+0.5 in XY.
# bmesh.ops.scale expands to FLAG_W × FLAG_H before writing to mesh,
# so the object has identity transform and object-space == world-space.
me = bpy.data.meshes.new(CLOTH_NAME)
cloth_ob = bpy.data.objects.new(CLOTH_NAME, me)
sc.collection.objects.link(cloth_ob)
sc.view_layer.objects.active = cloth_ob

bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=GRID_X, y_segments=GRID_Y, size=0.5)
bmesh.ops.scale(
    bm, vec=Vector((FLAG_W, FLAG_H, 1.0)),
    space=Matrix.Identity(4), verts=bm.verts
)
bm.to_mesh(me)
bm.free()
n_verts   = len(me.vertices)
VAT_WIDTH = _pow2(n_verts)
print(f"[vat] vertices={n_verts}  VAT={VAT_WIDTH}×{VAT_FRAMES}")

# ── VAT_ID UV channel ───────────────────────────────────────────────────────────
# Encode vertex index as UV.x so the GLB shader can sample the correct VAT
# column regardless of how the exporter re-orders the index buffer.
uv_layer = me.uv_layers.new(name="VAT_ID")
for poly in me.polygons:
    for li in poly.loop_indices:
        vi = me.loops[li].vertex_index
        uv_layer.data[li].uv = (vi / max(VAT_WIDTH - 1, 1), 0.0)

# ── Pin vertex group (top edge) ─────────────────────────────────────────────────
# vertex_group_mass must match an existing group name on the object.
# Mass = ∞ for pinned verts is encoded by weight = 1.0 in the pin group;
# Blender internally treats any vertex in this group as fixed-position.
pin_vg = cloth_ob.vertex_groups.new(name="Pin")
top_y  = max(v.co.y for v in me.vertices)
pin_ids = [v.index for v in me.vertices if abs(v.co.y - top_y) < 1e-4]
pin_vg.add(pin_ids, 1.0, 'REPLACE')
print(f"[vat] pinned {len(pin_ids)} vertices at y={top_y:.4f}")

# ── Cloth modifier ──────────────────────────────────────────────────────────────
cloth_mod = cloth_ob.modifiers.new("Cloth", 'CLOTH')
cs = cloth_mod.settings
cs.vertex_group_mass      = "Pin"   # anchors these vertices
cs.mass                   = 0.30    # kg/vertex — lighter cloth blows more
cs.tension_stiffness      = 15.0
cs.compression_stiffness  = 15.0
cs.shear_stiffness        = 5.0
cs.bending_stiffness      = 0.5
cs.air_damping            = 1.0
cloth_mod.collision_settings.use_self_collision = False
pc = cloth_mod.point_cache
pc.frame_start = FRAME_START
pc.frame_end   = FRAME_START + VAT_FRAMES - 1

# ── Wind force ──────────────────────────────────────────────────────────────────
# effector_add needs a live scene+view_layer context even in headless scripts.
with bpy.context.temp_override(scene=sc, view_layer=sc.view_layer):
    bpy.ops.object.effector_add(type='WIND', location=(0.6, -0.4, 0.3))
wind_ob = sc.view_layer.objects.active
wind_ob.rotation_euler   = (math.radians(75), 0.0, math.radians(-15))
wind_ob.field.strength   = WIND_STR
wind_ob.field.noise      = WIND_NOISE

# ── Frame-by-frame capture ──────────────────────────────────────────────────────
# frame_set() drives the cloth integrator one step at a time via the
# dependency graph.  Jumping to an arbitrary frame without stepping through
# each prior frame will produce wrong or rest-pose results unless the
# point cache is already fully baked.
pos_data: list[list[float]] = []
nrm_data: list[list[float]] = []

for fi in range(VAT_FRAMES):
    sc.frame_set(FRAME_START + fi)
    dg       = bpy.context.evaluated_depsgraph_get()
    ob_eval  = cloth_ob.evaluated_get(dg)
    me_eval  = ob_eval.to_mesh()

    pos_row = [0.0] * (VAT_WIDTH * 4)
    nrm_row = [0.0] * (VAT_WIDTH * 4)
    for vi, v in enumerate(me_eval.vertices):
        co  = v.co      # object-space == world-space (identity transform)
        n   = v.normal
        i4  = vi * 4
        pos_row[i4:i4+4] = [co.x, co.y, co.z, 1.0]
        nrm_row[i4:i4+4] = [(n.x+1)*0.5, (n.y+1)*0.5, (n.z+1)*0.5, 1.0]

    pos_data.append(pos_row)
    nrm_data.append(nrm_row)
    ob_eval.to_mesh_clear()

# ── Bounding box → normalise positions ─────────────────────────────────────────
# A global bbox across all frames ensures the shader decode range is tight
# without per-frame rescaling.  Padding the range with or 1e-6 guards against
# a perfectly flat axis (zero-thickness) that would produce NaN in the shader.
all_x = [pos_data[f][vi*4]   for f in range(VAT_FRAMES) for vi in range(n_verts)]
all_y = [pos_data[f][vi*4+1] for f in range(VAT_FRAMES) for vi in range(n_verts)]
all_z = [pos_data[f][vi*4+2] for f in range(VAT_FRAMES) for vi in range(n_verts)]
bmin  = (min(all_x), min(all_y), min(all_z))
bmax  = (max(all_x), max(all_y), max(all_z))
bsz   = tuple((bmax[i] - bmin[i]) or 1e-6 for i in range(3))

for f in range(VAT_FRAMES):
    for vi in range(n_verts):
        i4 = vi * 4
        pos_data[f][i4]   = (pos_data[f][i4]   - bmin[0]) / bsz[0]
        pos_data[f][i4+1] = (pos_data[f][i4+1] - bmin[1]) / bsz[1]
        pos_data[f][i4+2] = (pos_data[f][i4+2] - bmin[2]) / bsz[2]

# ── Pack EXR images ─────────────────────────────────────────────────────────────
# float_buffer=True gives a 32-bit RGBA image; file_format OPEN_EXR preserves
# full precision.  Saving as 8-bit PNG would quantise positions to 256 steps,
# visible as stepping artefacts at medium distances.
for img_name, data, fname in (
    ("vat_position", pos_data, "vat_position.exr"),
    ("vat_normal",   nrm_data, "vat_normal.exr"),
):
    img = bpy.data.images.new(
        img_name, width=VAT_WIDTH, height=VAT_FRAMES,
        float_buffer=True, is_data=True, alpha=False
    )
    flat: list[float] = []
    for row in data:
        flat.extend(row)
    img.pixels[:] = flat
    img.filepath_raw = OUT + fname
    img.file_format  = "OPEN_EXR"
    img.save()
    print(f"[vat] {fname}  {VAT_WIDTH}×{VAT_FRAMES}")

# ── Metadata JSON ───────────────────────────────────────────────────────────────
meta = {
    "vat_frames":    VAT_FRAMES,
    "vat_width":     VAT_WIDTH,
    "n_verts":       n_verts,
    "frame_start":   FRAME_START,
    "bbox_min":      list(bmin),
    "bbox_max":      list(bmax),
    "position_tex":  "vat_position.exr",
    "normal_tex":    "vat_normal.exr",
    "rest_mesh_glb": "cloth_flag_rest.glb",
}
with open(bpy.path.abspath(OUT + "vat_meta.json"), "w") as fh:
    json.dump(meta, fh, indent=2)

# ── Export rest-pose GLB ────────────────────────────────────────────────────────
# export_apply=False exports the BASE mesh data (pre-simulation, rest shape),
# which is what the VAT shader rebuilds each frame by offsetting FROM.
# The VAT_ID UV layer is included automatically via export_uvs=True (default).
cloth_ob.select_set(True)
with bpy.context.temp_override(scene=sc, view_layer=sc.view_layer):
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUT + "cloth_flag_rest.glb"),
        export_format="GLB",
        export_apply=False,
        export_image_format="WEBP",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LVL,
        export_yup=True,
        export_normals=True,
        use_selection=True,
    )
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUT + "cloth_vat.blend"))
print("[vat] complete — cloth_flag_rest.glb  vat_position.exr  vat_normal.exr")

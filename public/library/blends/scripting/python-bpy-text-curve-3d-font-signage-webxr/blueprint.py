# blueprint.py — Python bpy.types.TextCurve
# 3D Font Object Scripting, Custom Font Loading & Mesh Conversion for WebXR Signage
# Blender 5.1 — Holoflow Studio
#
# Technique: TextCurve created via bpy.data.curves.new(type='FONT') — no operator
# context required at construction time. Font loaded via bpy.data.fonts.load().
# Per-character material index assigned through tc.body_format. TextCurve converted
# to Mesh in-place; Smart UV Project resolves mixed normals on extruded glyph faces.
# Backing panel built with bmesh using converted mesh vertex extents.
#
# Outputs: holoflow_sign.glb (GLB, Draco level 6, WebP textures)

import bpy
import bmesh
import math
from mathutils import Vector
from pathlib import Path

# ── Parameters ───────────────────────────────────────────────────────────────
SIGN_TEXT       = "HOLOFLOW"
SIGN_SUBTITLE   = "STUDIO"
FONT_PATH       = ""      # absolute path to .ttf / .otf; "" → built-in Bfont
CHAR_HEIGHT     = 0.50    # active character height in Blender units (≈ metres)
EXTRUDE_DEPTH   = 0.07    # depth of extrusion behind the face plane
BEVEL_DEPTH     = 0.010   # radius of rounded bevel at extruded edges
BEVEL_RES       = 2       # bevel arc segments: 0=chamfer, 1=one arc, 2=smooth
SUBTITLE_SCALE  = 0.42    # subtitle size as fraction of CHAR_HEIGHT
CHAR_SPACING    = 1.0     # character tracking multiplier (1.0 = Blender default)
PLATE_MARGIN    = 0.22    # extra padding around text block for backing panel
OUTPUT_GLB      = "//holoflow_sign.glb"

# ── Scene reset ───────────────────────────────────────────────────────────────
for _obj in list(bpy.data.objects):
    bpy.data.objects.remove(_obj, do_unlink=True)
for _me in list(bpy.data.meshes):
    bpy.data.meshes.remove(_me, do_unlink=True)
for _cu in list(bpy.data.curves):
    bpy.data.curves.remove(_cu, do_unlink=True)

# ── Font ──────────────────────────────────────────────────────────────────────
# bpy.data.fonts.load() deduplicates by path: calling it again with the same
# filepath returns the existing VFont rather than creating a second copy.
# 'Bfont' is the built-in font, permanently in bpy.data.fonts regardless of
# whether a .blend file has been saved.
if FONT_PATH:
    abs_path = bpy.path.abspath(FONT_PATH)
    font = (bpy.data.fonts.load(abs_path)
            if Path(abs_path).exists()
            else bpy.data.fonts["Bfont"])
else:
    font = bpy.data.fonts["Bfont"]

# ── Materials ─────────────────────────────────────────────────────────────────
def make_principled(name: str, base_color: tuple,
                    roughness: float = 0.15,
                    metallic:  float = 0.0) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value        = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value         = roughness
    bsdf.inputs["Metallic"].default_value          = metallic
    # Blender 5.1 renamed "Specular" → "Specular IOR Level"
    bsdf.inputs["Specular IOR Level"].default_value = 0.5
    return mat

mat_face  = make_principled("hf_sign_face",  (0.94, 0.94, 0.96), roughness=0.05)
mat_bevel = make_principled("hf_sign_bevel", (0.80, 0.82, 0.92), roughness=0.02)
mat_plate = make_principled("hf_sign_plate", (0.05, 0.05, 0.08), roughness=0.60)

# ── TextCurve creation — data API, no bpy.ops ─────────────────────────────────
# bpy.data.curves.new(name, type='FONT') returns bpy.types.TextCurve directly.
# type='FONT' is the discriminator: same registry (bpy.data.curves) as CURVE /
# SURFACE, but the Python type of the returned data-block differs.
# Object linking is manual — no operator context required.

def make_text_obj(name: str, body: str, size: float,
                  extrude: float, bevel_d: float, bevel_r: int,
                  align_x: str = 'CENTER', align_y: str = 'CENTER',
                  spacing: float = 1.0) -> bpy.types.Object:
    tc: bpy.types.TextCurve = bpy.data.curves.new(name, type='FONT')
    tc.body             = body
    tc.font             = font
    tc.size             = size
    tc.extrude          = extrude
    tc.bevel_mode       = 'ROUND'   # explicit; 'ROUND' is default but safe to set
    tc.bevel_depth      = bevel_d
    tc.bevel_resolution = bevel_r
    tc.align_x          = align_x
    # align_y='CENTER' places the text block centred on the object origin.
    # 'TOP_BASELINE' aligns to the cap-height baseline — useful when stacking
    # multiple text objects at a known Y position.
    tc.align_y          = align_y
    tc.space_character  = spacing
    tc.shear            = 0.0
    # Two material slots: slot 0 → front/back cap faces, slot 1 → extrusion band
    tc.materials.append(mat_face)   # slot 0
    tc.materials.append(mat_bevel)  # slot 1 — extrusion side quads use last slot
    obj = bpy.data.objects.new(name, tc)
    bpy.context.scene.collection.objects.link(obj)
    return obj

obj_main = make_text_obj(
    "SignMain", SIGN_TEXT,
    size=CHAR_HEIGHT, extrude=EXTRUDE_DEPTH,
    bevel_d=BEVEL_DEPTH, bevel_r=BEVEL_RES,
)
obj_sub = make_text_obj(
    "SignSub", SIGN_SUBTITLE,
    size=CHAR_HEIGHT * SUBTITLE_SCALE,
    extrude=EXTRUDE_DEPTH * 0.40,
    bevel_d=BEVEL_DEPTH * 0.50,
    bevel_r=BEVEL_RES,
    spacing=CHAR_SPACING * 1.50,  # wider tracking on subtitle
)
# Position subtitle below main on the OBJECT, not the curve.
# The TextCurve align_y='CENTER' makes the object origin the centre of the text
# block, so shifting obj_sub.location.y by the combined heights clears it.
obj_sub.location.y = -(CHAR_HEIGHT * 0.60 + CHAR_HEIGHT * SUBTITLE_SCALE * 0.55)

# ── Per-character material index via body_format ──────────────────────────────
# tc.body_format is a collection of TextCharacterFormat, one entry per character.
# Assigning material_index here controls which material slot renders each glyph
# CAP FACE. The extrusion SIDE BAND always uses the last material slot when more
# than one slot is present — there is no per-face extrusion control pre-conversion.
for fmt in obj_main.data.body_format:
    fmt.material_index = 0
for fmt in obj_sub.data.body_format:
    fmt.material_index = 0

# ── Convert TextCurve → Mesh ──────────────────────────────────────────────────
# bpy.ops.object.convert(target='MESH') is the only conversion path — there is
# no bpy.data equivalent. The operator mutates obj.data IN PLACE: obj.type
# becomes 'MESH' and obj.data becomes bpy.types.Mesh. The original TextCurve
# data-block is released (use_count → 0) and orphaned.
# Requires bpy.context.active_object — set it explicitly before each call.

def convert_to_mesh(obj: bpy.types.Object) -> None:
    for o in bpy.context.scene.objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)

convert_to_mesh(obj_main)
convert_to_mesh(obj_sub)

# Apply transforms — necessary so GLB vertex coords are in world space.
bpy.ops.object.select_all(action='DESELECT')
for o in [obj_main, obj_sub]:
    o.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ── Smart UV Project on converted meshes ──────────────────────────────────────
# Extruded text has three face normal families: +Z front caps, -Z back caps,
# and radially-directed side extrusion quads. Smart UV Project handles all
# angles in one pass and treats each glyph as its own UV island.

def smart_uv(obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02,
                              scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')

smart_uv(obj_main)
smart_uv(obj_sub)

# ── Backing panel — bmesh, no operator context ────────────────────────────────
# Compute exact bounding box from the converted SignMain mesh vertices.
xs = [v.co.x for v in obj_main.data.vertices]
ys = [v.co.y for v in obj_main.data.vertices]
sub_bottom = obj_sub.location.y - (CHAR_HEIGHT * SUBTITLE_SCALE * 0.55)
pw = (max(xs) - min(xs)) + PLATE_MARGIN * 2.0
ph = (max(ys) - sub_bottom)  + PLATE_MARGIN * 2.0
cx = (max(xs) + min(xs)) / 2.0
cy = (max(ys) + sub_bottom)  / 2.0
z_front = 0.0
z_back  = -(EXTRUDE_DEPTH + 0.03)

bm = bmesh.new()
hw, hh = pw * 0.5, ph * 0.5
vb = [
    bm.verts.new(Vector((cx - hw, cy - hh, z_front))),
    bm.verts.new(Vector((cx + hw, cy - hh, z_front))),
    bm.verts.new(Vector((cx + hw, cy + hh, z_front))),
    bm.verts.new(Vector((cx - hw, cy + hh, z_front))),
]
face = bm.faces.new(vb)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
ret    = bmesh.ops.extrude_face_region(bm, geom=[face])
everts = [e for e in ret['geom'] if isinstance(e, bmesh.types.BMVert)]
for v in everts:
    v.co.z = z_back

me_plate = bpy.data.meshes.new("SignPlate")
bm.to_mesh(me_plate)
bm.free()
obj_plate = bpy.data.objects.new("SignPlate", me_plate)
obj_plate.data.materials.append(mat_plate)
bpy.context.scene.collection.objects.link(obj_plate)

bpy.context.view_layer.objects.active = obj_plate
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.unwrap(method='ANGLE_BASED', margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

# ── Holoflow tags + export ────────────────────────────────────────────────────
# holoflow:facet = False → smooth normals. The rounded bevel highlight on text
# edges requires smooth shading; flat (faceted) shading would alias it.
for obj in [obj_main, obj_sub, obj_plate]:
    obj["holoflow:facet"] = False

bpy.ops.object.select_all(action='DESELECT')
for obj in [obj_main, obj_sub, obj_plate]:
    obj.select_set(True)

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(OUTPUT_GLB),
    use_selection=True,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_apply=True,      # bakes transforms — critical, text meshes often
    export_normals=True,    # carry non-identity scale after conversion
    export_materials='EXPORT',
)
print("holoflow_sign.glb written.")

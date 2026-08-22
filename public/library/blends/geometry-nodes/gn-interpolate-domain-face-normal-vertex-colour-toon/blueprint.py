#!/usr/bin/env python3
"""
blueprint.py — GN Interpolate Domain: Face Random Hue + Toon Lighting → Vertex Colour
Blender 5.1 | CC0 | Holoflow Studio

Technique: two GeometryNodeFieldOnDomain nodes transfer data across mesh topology
domains within a single Geometry Nodes modifier evaluation.

  Pass A — Per-face random hue:
    FunctionNodeRandomValue evaluates per-FACE (one float per face).
    GeometryNodeFieldOnDomain(domain='FACE') forces face-domain evaluation and
    exposes the result so StoreNamedAttribute(domain='POINT') can consume it —
    each vertex receives the UNWEIGHTED AVERAGE of its adjacent faces' hue values.

  Pass B — Unweighted smooth normal for toon lighting:
    GeometryNodeInputNormal evaluated via FieldOnDomain(domain='FACE') gives face
    normals averaged per-vertex WITHOUT Blender's angle-weighting, producing a
    flatter, more stylised toon gradient than the built-in vertex normal.

  The two passes are blended: shadow colour (flat purple) in dark regions, per-face
  hue in lit regions. The result is a watercolour-mosaic toon gradient stored as
  BYTE_COLOR and exported in the GLB for WebXR vertex-colour display.

Run headlessly:
    blender --background --python blueprint.py
"""

import bpy
from pathlib import Path

# ============================================================
# Parameters — edit here, nowhere else
# ============================================================
SLUG       = "gn-interpolate-domain-face-normal-vertex-colour-toon"
TOPIC      = "geometry-nodes"
MESH_NAME  = "toon_gem_faceted"

HERE      = Path(__file__).parent
BLEND_OUT = HERE / f"{MESH_NAME}.blend"
GLB_OUT   = HERE.parents[3] / "glbs" / TOPIC / SLUG / f"{MESH_NAME}.glb"

ICO_SUBS    = 2              # 80 faces; enough gradient variation without excess tris
LIGHT_DIR   = (0.5, 0.3, 1.0)  # world sun direction (normalised inside node tree)
SHADOW_COL  = (0.10, 0.05, 0.20, 1.0)   # deep-purple unlit tone
HSV_SAT     = 0.75           # saturation for per-face hues
HSV_VAL     = 0.90           # value/brightness for per-face hues
ATTR_NAME   = "toon_col"     # vertex colour attribute name exported as COLOR_0

# ============================================================
# Scene reset
# ============================================================
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"

# ============================================================
# 1. Icosphere — flat-shaded (faceted aesthetic)
# ============================================================
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=ICO_SUBS, radius=1.0)
obj  = bpy.context.active_object
obj.name = MESH_NAME
for poly in obj.data.polygons:
    poly.use_smooth = False
# GN InputNormal reads geometric face normals; flat shading is intentional.

# ============================================================
# 2. GN Node Group
# ============================================================
ng    = bpy.data.node_groups.new("HS_InterpolateDomainToon", "GeometryNodeTree")
ni    = ng.interface
nodes = ng.nodes
links = ng.links

# Group interface sockets
ni.new_socket("Geometry",   in_out="OUTPUT", socket_type="NodeSocketGeometry")
s_geo = ni.new_socket("Geometry",   in_out="INPUT",  socket_type="NodeSocketGeometry")
s_ld  = ni.new_socket("Light Dir",  in_out="INPUT",  socket_type="NodeSocketVector")
s_sc  = ni.new_socket("Shadow Col", in_out="INPUT",  socket_type="NodeSocketColor")
s_ld.default_value = LIGHT_DIR
s_sc.default_value = SHADOW_COL

g_in  = nodes.new("NodeGroupInput");  g_in.location  = (-1800,   0)
g_out = nodes.new("NodeGroupOutput"); g_out.location  = (  400,   0)

# ------------------------------------------------------------------
# BRANCH A — Per-face random hue interpolated to vertices
# ------------------------------------------------------------------
# WHY FieldOnDomain is essential here:
#   Without it, FunctionNodeRandomValue wired into StoreNamedAttribute(POINT)
#   would be re-evaluated in POINT context — giving a DIFFERENT (per-vertex) random
#   value, destroying per-face identity.  FieldOnDomain(domain='FACE') locks
#   evaluation to face context; StoreNamedAttribute then averages adjacent face values.

n_rnd = nodes.new("FunctionNodeRandomValue")
n_rnd.data_type             = "FLOAT"
n_rnd.inputs[0].default_value = 0.0   # Min
n_rnd.inputs[1].default_value = 1.0   # Max
n_rnd.location = (-1500, 350)

n_fi_rnd = nodes.new("GeometryNodeFieldOnDomain")
n_fi_rnd.domain    = "FACE"    # force the connected field to evaluate in face domain
n_fi_rnd.data_type = "FLOAT"   # must match the connected field type
n_fi_rnd.location  = (-1250, 350)
links.new(n_rnd.outputs[1], n_fi_rnd.inputs[0])

# Map 0-1 float → full hue spectrum via CombineColor HSV.
# Saturation/Value held constant so faces differ only in hue.
n_hsv = nodes.new("ShaderNodeCombineColor")
n_hsv.mode                  = "HSV"
n_hsv.inputs[1].default_value = HSV_SAT   # Saturation (internally labelled Green)
n_hsv.inputs[2].default_value = HSV_VAL   # Value/brightness (internally labelled Blue)
n_hsv.location = (-1000, 350)
links.new(n_fi_rnd.outputs[0], n_hsv.inputs[0])   # Hue (internally labelled Red)

# ------------------------------------------------------------------
# BRANCH B — Face normal unweighted → toon light gradient
# ------------------------------------------------------------------
# FieldOnDomain(FACE) vs direct InputNormal(POINT):
#   Built-in POINT normal: Σ(face_normal_i × face_angle_at_vertex_i) / Σ angle_i
#   FieldOnDomain average: Σ face_normal_i / N (no angle weighting)
# For cel-shading the unweighted version avoids over-darkening near acute-angle faces
# and gives a more "painted" gradient that reads as intentional stylisation.

n_nor = nodes.new("GeometryNodeInputNormal")
n_nor.location = (-1500, -80)

n_fi_nor = nodes.new("GeometryNodeFieldOnDomain")
n_fi_nor.domain    = "FACE"
n_fi_nor.data_type = "FLOAT_VECTOR"
n_fi_nor.location  = (-1250, -80)
links.new(n_nor.outputs["Normal"], n_fi_nor.inputs[0])

# Re-normalise: averaging unit vectors can yield sub-unit length near valence
# transitions (e.g. vertex shared by 5 vs 6 triangles).
n_norm = nodes.new("ShaderNodeVectorMath")
n_norm.operation = "NORMALIZE"
n_norm.location  = (-1000, -80)
links.new(n_fi_nor.outputs[0], n_norm.inputs[0])

# Dot product → float range −1 (back-lit) to +1 (facing light).
n_dot = nodes.new("ShaderNodeVectorMath")
n_dot.operation = "DOT_PRODUCT"
n_dot.location  = (-750, -80)
links.new(n_norm.outputs["Vector"],    n_dot.inputs[0])
links.new(g_in.outputs["Light Dir"],   n_dot.inputs[1])

# Remap −1..1 → 0..1 for clean shadow-to-lit factor.
n_map = nodes.new("ShaderNodeMapRange")
n_map.inputs["From Min"].default_value = -1.0
n_map.inputs["From Max"].default_value =  1.0
n_map.inputs["To Min"].default_value   =  0.0
n_map.inputs["To Max"].default_value   =  1.0
n_map.location = (-500, -80)
links.new(n_dot.outputs["Value"], n_map.inputs["Value"])

# ------------------------------------------------------------------
# BRANCH C — Blend: shadow → per-face hue driven by light factor
# ------------------------------------------------------------------
# Shadow side collapses to flat purple; lit side reveals the face's unique hue.
# This two-pass read of FieldOnDomain data is the key studio technique: one domain
# transfer for identity (hue), a second for geometry (normal), blended by maths.
n_mix = nodes.new("ShaderNodeMix")
n_mix.data_type  = "RGBA"
n_mix.blend_type = "MIX"
n_mix.location   = (-230, 130)
# ShaderNodeMix RGBA socket layout: Factor=inputs[0], A=inputs[6], B=inputs[7]
links.new(n_map.outputs["Result"],      n_mix.inputs[0])    # Factor (light 0-1)
links.new(g_in.outputs["Shadow Col"],   n_mix.inputs[6])    # A = shadow
links.new(n_hsv.outputs["Color"],       n_mix.inputs[7])    # B = per-face hue

# ------------------------------------------------------------------
# Store as BYTE_COLOR vertex attribute
# ------------------------------------------------------------------
# BYTE_COLOR (4 × uint8) is the correct type for GLB COLOR_0.
# FLOAT_COLOR would work but doubles the attribute data size unnecessarily.
n_store = nodes.new("GeometryNodeStoreNamedAttribute")
n_store.domain    = "POINT"
n_store.data_type = "BYTE_COLOR"
n_store.location  = (100, 0)
n_store.inputs["Name"].default_value = ATTR_NAME
links.new(g_in.outputs["Geometry"],    n_store.inputs["Geometry"])
links.new(n_mix.outputs["Result"],     n_store.inputs["Value"])
links.new(n_store.outputs["Geometry"], g_out.inputs["Geometry"])

# ============================================================
# 3. Attach, apply modifier
# ============================================================
mod = obj.modifiers.new("HS_InterpolateDomainToon", "NODES")
mod.node_group = ng
bpy.ops.object.modifier_apply(modifier=mod.name)

# ============================================================
# 4. Vertex-colour material (for viewport and EEVEE preview)
# ============================================================
mat  = bpy.data.materials.new("toon_gem_vcol")
mat.use_nodes = True
nt   = mat.node_tree
nt.nodes.clear()
vcol = nt.nodes.new("ShaderNodeVertexColor")
vcol.layer_name = ATTR_NAME
bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
bsdf.inputs["Metallic"].default_value  = 0.0
bsdf.inputs["Roughness"].default_value = 0.95  # near-flat for toon read
out  = nt.nodes.new("ShaderNodeOutputMaterial")
nt.links.new(vcol.outputs["Color"], bsdf.inputs["Base Color"])
nt.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
obj.data.materials.append(mat)
obj.data.materials[0] = mat

# ============================================================
# 5. Save .blend + export GLB
# ============================================================
bpy.ops.wm.save_mainfile(filepath=str(BLEND_OUT))
print(f"[blueprint] Saved blend → {BLEND_OUT}")

GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath        = str(GLB_OUT),
    export_format   = "GLB",
    use_selection   = False,
    export_apply    = True,
    export_colors   = True,    # vertex colour → COLOR_0 attribute in GLB
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
)
print(f"[blueprint] Exported GLB → {GLB_OUT}")

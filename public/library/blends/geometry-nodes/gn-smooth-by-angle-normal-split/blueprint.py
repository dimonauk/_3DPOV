"""
GN Smooth by Angle — Blender 5.1 Auto-Smooth Replacement
Normal Split for Faceted and Hard-Surface Meshes
Holoflow Studio | CC0

Technique
---------
Blender 4.1 removed bpy.types.Mesh.use_auto_smooth and auto_smooth_angle.
The replacement is GeometryNodeSmoothByAngle — either as a standalone
'SMOOTH_BY_ANGLE' modifier (the UI shortcut) or wired into a custom GN
modifier tree (the composable approach this blueprint demonstrates).

The node reads the unsigned dihedral angle at every EDGE and writes a
boolean 'sharp_edge' attribute: True where the dihedral angle exceeds
the Angle threshold, False where it falls below.  The GLB exporter splits
vertex normals at any edge where sharp_edge=True, producing the classic
"hard edge" appearance.  Where sharp_edge=False, normals interpolate
smoothly across the edge — provided SetShadeSmooth(smooth=True) precedes
SmoothByAngle in the tree so there is a smooth baseline to begin with.

Critical ordering constraint:
  SetShadeSmooth(FACE, smooth=True) → SmoothByAngle → Group Output
  Reversing or omitting SetShadeSmooth leaves the mesh flat-shaded by
  default; the sharp_edge marks from SmoothByAngle then have no smooth
  baseline to override and are effectively invisible.

The blueprint builds a 16-sided prism:
  Side face dihedral ≈ 22.5°  (360°/16)
  Cap-to-side dihedral = 90°
  ANGLE_THRESHOLD_A = 30°  → sides smooth, caps sharp
  ANGLE_THRESHOLD_B = 15°  → both sides and caps sharp (fully faceted)
  Two GLBs exported to compare.

Run: Scripting workspace → Run Script.
Outputs: smooth_prism_30deg.glb, smooth_prism_15deg.glb alongside .blend.
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── CONSTANTS ───────────────────────────────────────────────────────────────
MESH_NAME        = "smooth_prism"
MAT_NAME         = "SmoothPrism_Mat"
GN_MOD_NAME      = "SmoothByAngle_GN"
GN_TREE_NAME     = "SmoothByAngle_GN"
SIDES            = 16          # prism circumference divisions
HEIGHT           = 1.6         # world-unit height
RADIUS           = 0.7         # world-unit radius
ANGLE_THRESHOLD_A = math.radians(30.0)   # sides smooth, caps sharp
ANGLE_THRESHOLD_B = math.radians(15.0)   # fully faceted
EXPORT_A         = "//smooth_prism_30deg.glb"
EXPORT_B         = "//smooth_prism_15deg.glb"

# ── SCENE SETUP ─────────────────────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
bpy.context.scene.unit_settings.system = "METRIC"

# ── MESH BUILDER ─────────────────────────────────────────────────────────────
def build_prism() -> bpy.types.Object:
    """N-sided prism with flat caps. All faces share-smooth=False initially.
    The GN modifier will shade smooth then re-mark hard edges."""
    me = bpy.data.meshes.new(MESH_NAME)
    bm = bmesh.new()

    # Bottom and top ring vertices
    bot = [
        bm.verts.new(Vector((
            RADIUS * math.cos(2 * math.pi * i / SIDES),
            RADIUS * math.sin(2 * math.pi * i / SIDES),
            -HEIGHT / 2,
        )))
        for i in range(SIDES)
    ]
    top = [
        bm.verts.new(Vector((
            RADIUS * math.cos(2 * math.pi * i / SIDES),
            RADIUS * math.sin(2 * math.pi * i / SIDES),
            HEIGHT / 2,
        )))
        for i in range(SIDES)
    ]

    # Side quads — dihedral between adjacent quads = 360°/SIDES ≈ 22.5°
    for i in range(SIDES):
        j = (i + 1) % SIDES
        bm.faces.new([bot[i], bot[j], top[j], top[i]])

    # Bottom cap — dihedral between cap and side = 90°
    bm.faces.new(list(reversed(bot)))

    # Top cap
    bm.faces.new(top)

    bm.to_mesh(me)
    bm.free()

    obj = bpy.data.objects.new(MESH_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    return obj

# ── MATERIAL ─────────────────────────────────────────────────────────────────
def add_material(obj: bpy.types.Object) -> None:
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.55, 0.72, 0.90, 1.0)
    bsdf.inputs["Metallic"].default_value   = 0.0
    bsdf.inputs["Roughness"].default_value  = 0.18
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    obj.data.materials.append(mat)

# ── GN MODIFIER TREE ─────────────────────────────────────────────────────────
def build_gn_modifier(obj: bpy.types.Object) -> bpy.types.NodesModifier:
    """
    Builds a NODES modifier containing:
      GroupInput → SetShadeSmooth(FACE, True) → SmoothByAngle → GroupOutput

    Why not use the 'SMOOTH_BY_ANGLE' modifier type directly?
    The shortcut modifier is correct for standalone use, but when you need
    SmoothByAngle inside a larger GN tree (e.g., after distributing instances
    or procedurally extruding panels) you must wire it as a node.  This
    blueprint demonstrates the node form so you can transplant the pattern
    into any existing GN tree.
    """
    nt = bpy.data.node_groups.new(GN_TREE_NAME, "GeometryNodeTree")

    # Node tree interface (Blender 4.0+ .interface API)
    nt.interface.new_socket("Geometry",     in_out='INPUT',  socket_type='NodeSocketGeometry')
    ang_sock = nt.interface.new_socket(
        "Smooth Angle", in_out='INPUT', socket_type='NodeSocketFloat')
    ang_sock.subtype       = 'ANGLE'
    ang_sock.default_value = ANGLE_THRESHOLD_A
    ang_sock.min_value     = 0.0
    ang_sock.max_value     = math.radians(180.0)
    ignore_sock = nt.interface.new_socket(
        "Ignore Sharpness", in_out='INPUT', socket_type='NodeSocketBool')
    ignore_sock.default_value = False
    nt.interface.new_socket("Geometry",     in_out='OUTPUT', socket_type='NodeSocketGeometry')

    # Place nodes
    gn_in   = nt.nodes.new("NodeGroupInput");   gn_in.location  = (-500,  0)
    smooth  = nt.nodes.new("GeometryNodeSetShadeSmooth")
    smooth.domain              = 'FACE'
    smooth.inputs["Shade Smooth"].default_value = True
    smooth.location            = (-250,  0)
    sba     = nt.nodes.new("GeometryNodeSmoothByAngle")
    sba.location               = (  0,  0)
    gn_out  = nt.nodes.new("NodeGroupOutput");  gn_out.location = ( 250,  0)

    # Wire: GroupInput.Geometry → SetShadeSmooth → SmoothByAngle → GroupOutput
    lk = nt.links.new
    lk(gn_in.outputs["Geometry"],        smooth.inputs["Mesh"])
    lk(smooth.outputs["Mesh"],           sba.inputs["Mesh"])
    lk(gn_in.outputs["Smooth Angle"],    sba.inputs["Angle"])
    lk(gn_in.outputs["Ignore Sharpness"], sba.inputs["Ignore Sharpness"])
    lk(sba.outputs["Mesh"],              gn_out.inputs["Geometry"])

    mod = obj.modifiers.new(GN_MOD_NAME, "NODES")
    mod.node_group = nt
    return mod

# ── ALTERNATIVE: SMOOTH_BY_ANGLE MODIFIER (non-GN tree approach) ─────────────
def add_simple_smooth_modifier(obj: bpy.types.Object, angle_rad: float) -> None:
    """
    The shortcut: type='SMOOTH_BY_ANGLE' is a Geometry Nodes modifier whose
    internal tree Blender generates automatically.  Use this when you just want
    to replace the old use_auto_smooth checkbox and nothing more.

    Input_1 is the internal identifier for the Angle socket.
    Input_2 is the Ignore Sharpness socket.

    Not used in the main blueprint (we use the explicit GN tree instead),
    but shown here as the migration path for scripts that only needed
    use_auto_smooth=True and nothing else.

      # Old (Blender ≤ 3.6):
      #   obj.data.use_auto_smooth = True
      #   obj.data.auto_smooth_angle = math.radians(30.0)
      #
      # New (Blender 4.1+):
      mod = obj.modifiers.new("SmoothByAngle", "SMOOTH_BY_ANGLE")
      mod["Input_1"] = math.radians(30.0)   # Angle
      mod["Input_2"] = False                 # Ignore Sharpness
    """
    pass  # implementation in the docstring; not called in this blueprint

# ── EXPORT ───────────────────────────────────────────────────────────────────
def export_glb(obj: bpy.types.Object, angle_rad: float, path: str) -> None:
    """Set the Angle group socket to angle_rad, then export to GLB.
    export_apply=True bakes the GN modifier; without it the sharp_edge
    attribute never reaches the glTF exporter and normals are split only
    at UV seams, not at the angle-detected hard edges."""
    mod = obj.modifiers[GN_MOD_NAME]
    # Angle is the second socket (index 1 in the modifier's inputs)
    mod["Input_2"] = angle_rad   # GN modifier stores interface sockets as ["Input_N"]
    bpy.context.view_layer.update()

    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(path),
        export_format='GLB',
        use_selection=True,
        export_apply=True,          # CRITICAL: bakes GN modifier
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"[SmoothByAngle] GLB → {path}  angle={math.degrees(angle_rad):.0f}°")

# ── MAIN ──────────────────────────────────────────────────────────────────────
obj  = build_prism()
add_material(obj)
build_gn_modifier(obj)
export_glb(obj, ANGLE_THRESHOLD_A, EXPORT_A)   # 30° — smooth sides, sharp caps
export_glb(obj, ANGLE_THRESHOLD_B, EXPORT_B)   # 15° — fully faceted

bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//smooth_prism.blend"))
print("[SmoothByAngle] Done. Two GLBs exported.")

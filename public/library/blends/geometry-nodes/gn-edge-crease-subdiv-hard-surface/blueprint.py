# =============================================================================
# HOLOFLOW STUDIO — blueprint.py
# Topic  : geometry-nodes / gn-edge-crease-subdiv-hard-surface
# Blender: 5.1  |  Licence: CC0
# Run    : blender --background --python blueprint.py
# Outputs: edge_crease_hard_surface.blend  ·  gn_edge_crease_hard_surface.glb
# =============================================================================
"""
GN Edge Angle Crease + Subdivision Surface — Expert Blueprint

A Geometry Nodes modifier reads the unsigned dihedral angle between adjacent
face normals for every edge, maps it through a soft threshold to a [0, 1]
crease weight, and writes the result as the `crease_edge` float attribute on
the EDGE domain.  The Subdivision Surface modifier — placed AFTER the GN
modifier in the stack — reads that attribute automatically via OpenSubdiv's
Catmull-Clark implementation: crease=1.0 edges stay geometrically sharp at
every level; crease=0.0 edges blend into the smooth limit surface.

WHY CREASE OVER BEVEL MODIFIER?
  Bevel inserts edge loops before Subdiv — the polygon count compounds.
  Crease is zero-cost: no extra source geometry; OpenSubdiv handles sharpness
  analytically in the limit-surface calculation.  Fewer source edges gives
  cleaner topology and better smooth normals on GLB export.

WHY GN CREASE OVER MANUAL CREASE PAINTING?
  The GN approach exposes Angle Threshold and Blend Width as live modifier
  sliders in the Properties panel.  Drag the threshold while watching the
  viewport: edges snap from smooth to sharp in real time.  Manual crease
  painting is non-parametric — changing the threshold means re-selecting and
  re-painting every affected edge by hand.

BLENDER 5.1 API NOTES:
  - crease_edge: FLOAT attribute on the EDGE domain.  Blender 4.0+ canonical
    storage; the older edge.crease BMesh field is now a view over this attr.
  - GeometryNodeEdgeAngle: outputs[0]='Unsigned Angle' range [0, π].
  - SubsurfModifier.use_creases = True  (default True in 5.1; set explicitly).
  - ShaderNodeMapRange works in GN trees (shared node implementation).
  - GeometryNodeStoreNamedAttribute: domain='EDGE', data_type='FLOAT'.
"""

import bpy
import bmesh
import math
import pathlib

# ── Parameters ────────────────────────────────────────────────────────────────
CUBE_SIZE          : float = 2.0
INSET_THICKNESS    : float = 0.25   # panel boundary inset distance
INSET_DEPTH        : float = -0.08  # negative → recesses inner face into box
SUBDIV_VIEWPORT    : int   = 2
SUBDIV_RENDER      : int   = 3
CREASE_ANGLE_DEG   : float = 40.0  # edges above this angle → full crease = 1.0
CREASE_BLEND_DEG   : float = 15.0  # soft transition band: ± 7.5° around threshold
OUTPUT_GLB         : str   = "//gn_edge_crease_hard_surface.glb"

OBJ_NAME           : str   = "edge_crease_hard_surface"
GN_TREE_NAME       : str   = "GNEdgeCrease"
MATL_NAME          : str   = "HoloflowHardSurface"
GN_MOD_NAME        : str   = "HoloflowGNCrease"
SUBDIV_MOD_NAME    : str   = "HoloflowSubdiv"

_RAD               : float = math.pi / 180.0  # degrees → radians constant


# ── 1. Scene setup ─────────────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.node_groups, bpy.data.materials):
        for block in list(col):
            block.user_clear()
            col.remove(block)


# ── 2. Source mesh ─────────────────────────────────────────────────────────────

def build_panel_mesh() -> bpy.types.Object:
    """
    Box with a recessed top panel and a recessed front panel.
    Produces three distinct edge-angle populations the GN crease system
    will separate:
      • outer-box corners  ≈ 90°  → crease 1.0 → sharp through Subdiv
      • panel-wall corners ≈ 90°  → crease 1.0 → sharp panel boundaries
      • flat face spans    ≈  0°  → crease 0.0 → smooth Catmull-Clark rounding
    """
    bpy.ops.mesh.primitive_cube_add(size=CUBE_SIZE, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = OBJ_NAME
    obj.data.name = OBJ_NAME

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.faces.ensure_lookup_table()

    # Inset top and front faces.  INSET_DEPTH < 0 moves the inner face along
    # the reversed face-normal direction (into the box), creating perpendicular
    # wall edges at the panel perimeter.  Those walls produce ~90° unsigned
    # angle → the GN crease pass marks them fully sharp.
    panel_faces = [
        f for f in bm.faces
        if f.normal.z > 0.9 or f.normal.y < -0.9
    ]
    bmesh.ops.inset_faces(
        bm,
        faces=panel_faces,
        thickness=INSET_THICKNESS,
        depth=INSET_DEPTH,
        use_boundary=True,
        use_even_offset=True,
    )

    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    return obj


# ── 3. GN tree: Edge Angle → crease_edge attribute ────────────────────────────

def build_gn_tree() -> bpy.types.NodeTree:
    """
    Node data-flow:
      GroupInput[threshold_deg] → ×(π/180) ─────────────────────── lo/hi Math
      GroupInput[blend_deg]     → ×(π/360) → half_blend ──────────────┘
      GroupInput[Geometry] ─────────────────────────────────── StoreNamedAttr
      EdgeAngle[Unsigned] ─────────────────────────── MapRange ─┘
    """
    tree  = bpy.data.node_groups.new(type='GeometryNodeTree', name=GN_TREE_NAME)
    nodes = tree.nodes
    links = tree.links

    # ── Interface sockets (Blender 4.0+ API) ──────────────────────────────────
    tree.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    tree.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')

    s_th = tree.interface.new_socket(
        'Angle Threshold Deg', in_out='INPUT', socket_type='NodeSocketFloat')
    s_th.default_value = CREASE_ANGLE_DEG
    s_th.min_value     = 0.0
    s_th.max_value     = 180.0

    s_bl = tree.interface.new_socket(
        'Blend Width Deg', in_out='INPUT', socket_type='NodeSocketFloat')
    s_bl.default_value = CREASE_BLEND_DEG
    s_bl.min_value     = 0.1
    s_bl.max_value     = 45.0

    # ── Group I/O ──────────────────────────────────────────────────────────────
    n_gin  = nodes.new('NodeGroupInput');   n_gin.location  = (-820, 0)
    n_gout = nodes.new('NodeGroupOutput');  n_gout.location = (420, 0)

    # ── threshold_deg → threshold_rad ─────────────────────────────────────────
    # Multiply by π/180; the constant π/180 lives in inputs[1].default_value.
    n_th_conv = nodes.new('ShaderNodeMath')
    n_th_conv.operation            = 'MULTIPLY'
    n_th_conv.inputs[1].default_value = _RAD   # π/180
    n_th_conv.label                = 'Threshold deg→rad'
    n_th_conv.location             = (-560, 120)
    links.new(n_gin.outputs['Angle Threshold Deg'], n_th_conv.inputs[0])

    # ── blend_deg → half_blend_rad ────────────────────────────────────────────
    # Multiply by π/360 = (π/180) × 0.5 to convert and halve in one node.
    n_bl_conv = nodes.new('ShaderNodeMath')
    n_bl_conv.operation            = 'MULTIPLY'
    n_bl_conv.inputs[1].default_value = _RAD * 0.5  # π/360
    n_bl_conv.label                = 'Half-blend deg→rad'
    n_bl_conv.location             = (-560, -120)
    links.new(n_gin.outputs['Blend Width Deg'], n_bl_conv.inputs[0])

    # ── lo = threshold_rad − half_blend ───────────────────────────────────────
    n_lo = nodes.new('ShaderNodeMath')
    n_lo.operation = 'SUBTRACT'
    n_lo.label     = 'Map lo'
    n_lo.location  = (-320, 120)
    links.new(n_th_conv.outputs['Value'], n_lo.inputs[0])
    links.new(n_bl_conv.outputs['Value'], n_lo.inputs[1])

    # ── hi = threshold_rad + half_blend ───────────────────────────────────────
    n_hi = nodes.new('ShaderNodeMath')
    n_hi.operation = 'ADD'
    n_hi.label     = 'Map hi'
    n_hi.location  = (-320, -40)
    links.new(n_th_conv.outputs['Value'], n_hi.inputs[0])
    links.new(n_bl_conv.outputs['Value'], n_hi.inputs[1])

    # ── Edge Angle: unsigned dihedral between adjacent face normals ────────────
    # outputs[0] = Unsigned Angle  (0=coplanar, π/2=90°, π=reversed)
    # outputs[1] = Signed Angle    (not used here — signed is topology-dependent)
    n_angle = nodes.new('GeometryNodeEdgeAngle')
    n_angle.location = (-320, -240)

    # ── Map [lo, hi] → [0.0, 1.0] crease weight, clamped ─────────────────────
    n_map = nodes.new('ShaderNodeMapRange')
    n_map.data_type          = 'FLOAT'
    n_map.interpolation_type = 'LINEAR'
    n_map.clamp              = True
    n_map.label              = 'Angle → Crease'
    n_map.location           = (-80, 0)
    links.new(n_angle.outputs['Unsigned Angle'], n_map.inputs['Value'])
    links.new(n_lo.outputs['Value'],             n_map.inputs['From Min'])
    links.new(n_hi.outputs['Value'],             n_map.inputs['From Max'])
    n_map.inputs['To Min'].default_value = 0.0
    n_map.inputs['To Max'].default_value = 1.0

    # ── Store crease_edge on EDGE domain ──────────────────────────────────────
    # SubsurfModifier reads this attribute when use_creases=True.
    # The attribute name 'crease_edge' is the Blender 4.0+ canonical name;
    # do not use 'crease' (the pre-4.0 name that is no longer recognised).
    n_store = nodes.new('GeometryNodeStoreNamedAttribute')
    n_store.data_type = 'FLOAT'
    n_store.domain    = 'EDGE'
    n_store.inputs['Name'].default_value = 'crease_edge'
    n_store.label     = 'Write crease_edge'
    n_store.location  = (200, 0)
    links.new(n_gin.outputs['Geometry'], n_store.inputs['Geometry'])
    links.new(n_map.outputs['Result'],   n_store.inputs['Value'])

    links.new(n_store.outputs['Geometry'], n_gout.inputs['Geometry'])

    return tree


# ── 4. Attach modifiers ────────────────────────────────────────────────────────

def attach_modifiers(obj: bpy.types.Object, tree: bpy.types.NodeTree) -> None:
    # GN modifier FIRST: writes crease_edge before Subdiv reads it.
    # Blender evaluates the modifier stack top-to-bottom; order is critical.
    mod_gn            = obj.modifiers.new(name=GN_MOD_NAME, type='NODES')
    mod_gn.node_group = tree
    # Input_2 = Angle Threshold Deg   (first user socket after the two Geometry sockets)
    # Input_3 = Blend Width Deg
    mod_gn['Input_2'] = CREASE_ANGLE_DEG
    mod_gn['Input_3'] = CREASE_BLEND_DEG

    mod_sub                  = obj.modifiers.new(name=SUBDIV_MOD_NAME, type='SUBSURF')
    mod_sub.subdivision_type = 'CATMULL_CLARK'
    mod_sub.levels           = SUBDIV_VIEWPORT
    mod_sub.render_levels    = SUBDIV_RENDER
    # use_creases=True tells the modifier to read the crease_edge attribute.
    # In Blender 5.1 this defaults to True, but set it explicitly so the
    # .blend is self-documenting.
    mod_sub.use_creases      = True
    mod_sub.use_limit_surface = True   # OpenSubdiv limit surface positions


# ── 5. Material ────────────────────────────────────────────────────────────────

def build_material() -> bpy.types.Material:
    mat  = bpy.data.materials.new(name=MATL_NAME)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (0.11, 0.14, 0.18, 1.0)  # dark titanium
    bsdf.inputs['Metallic'].default_value   = 0.88
    bsdf.inputs['Roughness'].default_value  = 0.28
    return mat


# ── 6. Export ──────────────────────────────────────────────────────────────────

def export_glb(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    out = pathlib.Path(bpy.path.abspath(OUTPUT_GLB))
    out.parent.mkdir(parents=True, exist_ok=True)

    # export_apply=True bakes the full modifier stack:
    #   1. GN evaluates → writes crease_edge attribute
    #   2. Subdiv reads crease_edge → Catmull-Clark subdivision with creases
    #   3. Final subdivided mesh is serialised to GLB
    # Without this flag the base mesh (pre-GN, pre-Subdiv) is exported.
    bpy.ops.export_scene.gltf(
        filepath=str(out),
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_normals=True,
        export_materials='EXPORT',
        export_image_format='WEBP',
    )
    print(f'[blueprint] exported → {out}')


# ── 7. Main ────────────────────────────────────────────────────────────────────

def main() -> None:
    clear_scene()
    obj  = build_panel_mesh()
    tree = build_gn_tree()
    attach_modifiers(obj, tree)
    mat  = build_material()
    obj.data.materials.append(mat)

    blend_path = pathlib.Path(__file__).with_name('edge_crease_hard_surface.blend')
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    print(f'[blueprint] saved  → {blend_path}')

    export_glb(obj)


if __name__ == '__main__':
    main()

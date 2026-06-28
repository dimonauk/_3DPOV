"""
GN Delete Geometry — Noise-Mask Face Culling for Eroded Rock / Asteroid (Blender 5.1)
======================================================================================
Technique: Use a 3-D Noise Texture evaluated per face-centre position to drive
a boolean selection, then feed that selection into Delete Geometry (domain=FACE,
mode=ALL) to remove faces — and their exclusively-owned edges + vertices —
from an icosphere base mesh.  The remaining shell is cleaned with Merge by
Distance, sharpened with Smooth by Angle, triangulated, and exported as a
Draco-compressed GLB for WebXR.

WHY Delete Geometry over Separate Geometry:
  Separate Geometry keeps both halves alive as separate geometry sockets and
  wires them individually; Delete Geometry is truly destructive — it removes
  topology from the data-block, renumbering all indices in the output.  That
  index-shift is the most important thing to know: any downstream Sample Index,
  Field at Index, or Capture Attribute referencing a PRE-deletion face index
  will resolve to the WRONG face after the node.  Plan all index lookups to
  sit BEFORE the Delete node.

WHY mode='ALL':
  Three modes exist on the node (set as a node enum property, not a socket):
    ALL             — removes face + its edges + its verts if they are not
                      shared by any surviving face.  Cleanest output; leaves
                      no orphaned wire edges.
    ONLY_FACES      — removes the face poly record but leaves every edge and
                      vertex in place.  Useful if downstream nodes need edge
                      continuity (e.g., Curve to Mesh, Edge Paths to Curves)
                      but the face topology is unwanted.  Produces naked edges
                      that Merge by Distance will not collapse — you must
                      Delete Geometry again with domain='EDGE' to remove them.
    ONLY_EDGES_AND_FACES — removes faces and edges but keeps vertices.
                      Rarely needed; mainly useful before converting to a point
                      cloud.

WHY FACE domain for the noise selection:
  Noise Texture in GN evaluates its Vector input once per geometry element.
  domain='FACE' routes the per-face position (centroid) into the texture,
  giving one float per face — exactly what Delete Geometry's boolean selection
  socket expects.  domain='POINT' gives per-vertex floats that would need
  Evaluate on Domain(FACE) to aggregate before comparison.

PARAMETERS (exposed as Group Input sockets):
"""

import bpy
import bmesh
import math

# ── PARAMETERS ──────────────────────────────────────────────────────────────
OBJECT_NAME       = "eroded_asteroid"
SUBDIVISIONS      = 4          # icosphere subdivision level  → 320 base faces
ROCK_NOISE_SCALE  = 1.8        # world-space noise scale for base-mesh displacement
ROCK_NOISE_DETAIL = 6.0        # octaves for displacement noise
ROCK_DISPLACE_AMT = 0.28       # max vertex displacement (metres)
EROSION_SEED      = 0          # GN seed socket default
EROSION_SCALE     = 3.2        # noise scale for erosion field
EROSION_DETAIL    = 5.0        # octaves for erosion noise
EROSION_THRESHOLD = 0.48       # delete faces where noise > threshold (0=none, 1=all)
SMOOTH_ANGLE_DEG  = 30.0       # normal-split angle for Smooth by Angle node
MERGE_DIST        = 0.002      # Merge by Distance threshold (small, avoids topology weld)
DRACO_LEVEL       = 6

EXPORT_PATH = "//eroded_asteroid.glb"


def purge_object(name: str) -> None:
    if name in bpy.data.objects:
        obj = bpy.data.objects[name]
        bpy.data.objects.remove(obj, do_unlink=True)


def build_rock_base() -> bpy.types.Object:
    """Icosphere displaced by noise → bumpy rock silhouette (applied at build time)."""
    purge_object(OBJECT_NAME)

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=SUBDIVISIONS, radius=1.0)
    obj = bpy.context.active_object
    obj.name = OBJECT_NAME

    # displace in bmesh using mathutils noise
    from mathutils.noise import noise as mn_noise
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    for v in bm.verts:
        p = v.co * ROCK_NOISE_SCALE
        displacement = mn_noise((p.x, p.y, p.z))
        v.co += v.normal * displacement * ROCK_DISPLACE_AMT
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()

    # apply scale so GN world-space noise matches scene units
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def build_delete_geometry_tree(obj: bpy.types.Object) -> None:
    """
    Node tree layout:

      [Group Input]
          │  Erosion Threshold  ──┐
          │  Noise Scale         ─┤
          │  Noise Detail        ─┤
          │  Seed                ─┤
          │  Merge Distance      ─┤
                                  │
      [Position] ──────────────► [Noise Texture]
                                      │ Fac
                                  [Math: MULTIPLY by −1, ADD 1]  ← invert so
                                      │                            high Fac = more KEPT
                                  [Compare: LESS_THAN threshold] ← True = DELETE
                                      │ Result (boolean)
                                  [Delete Geometry]  domain=FACE  mode=ALL
                                      │
                                  [Merge by Distance]
                                      │
                                  [Triangulate Mesh]
                                      │
                                  [Smooth by Angle]
                                      │
                                  [Set Shade Smooth]
                                      │
                               [Group Output]

    WHY invert the noise:
      Noise Texture Fac output is in [0, 1].  Low Fac = dark valleys, high
      Fac = bright peaks.  We want to delete the HOLES (valleys), not the
      high material.  So invert: new_fac = 1 − fac.  Then Compare(LESS_THAN,
      threshold) marks any face whose inverted noise is below the threshold
      for deletion.  Threshold=0.0 deletes nothing; threshold=1.0 deletes all.
    """
    # tear down any existing GN modifier
    for mod in obj.modifiers:
        if mod.type == 'NODES':
            obj.modifiers.remove(mod)

    mod = obj.modifiers.new("GN_DeleteErosion", 'NODES')

    # create the node tree
    tree_name = "GN_DeleteErosionTree"
    if tree_name in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[tree_name])

    tree = bpy.data.node_groups.new(tree_name, 'GeometryNodeTree')
    mod.node_group = tree

    nodes = tree.nodes
    links = tree.links

    # ── expose Group Input sockets ───────────────────────────────────────────
    # Blender 4.0+ interface API
    iface = tree.interface
    iface.new_socket("Erosion Threshold", in_out='INPUT',
                     socket_type='NodeSocketFloat').default_value = EROSION_THRESHOLD
    iface.new_socket("Noise Scale",       in_out='INPUT',
                     socket_type='NodeSocketFloat').default_value = EROSION_SCALE
    iface.new_socket("Noise Detail",      in_out='INPUT',
                     socket_type='NodeSocketFloat').default_value = EROSION_DETAIL
    iface.new_socket("Seed",              in_out='INPUT',
                     socket_type='NodeSocketInt').default_value  = EROSION_SEED
    iface.new_socket("Merge Distance",    in_out='INPUT',
                     socket_type='NodeSocketFloat').default_value = MERGE_DIST

    iface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    iface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    def N(bl_idname: str, x: float = 0, y: float = 0):
        n = nodes.new(bl_idname)
        n.location = (x, y)
        return n

    # node instances
    grp_in    = N('NodeGroupInput',          -800,  0)
    grp_out   = N('NodeGroupOutput',          800,  0)
    position  = N('GeometryNodeInputPosition', -800, -200)
    noise     = N('ShaderNodeTexNoise',        -400, -200)
    math_inv  = N('ShaderNodeMath',            -100, -200)   # 1 − fac (invert)
    compare   = N('FunctionNodeCompare',        200, -200)
    delete_geo = N('GeometryNodeDeleteGeometry', 400,   0)
    merge_dist = N('GeometryNodeMergeByDistance', 600,  0)
    triangulate = N('GeometryNodeTriangulateMesh', 700, -100)
    smooth    = N('GeometryNodeSmoothByAngle',   800, -200)
    shade     = N('GeometryNodeSetShadeSmooth',  900,   0)

    # ── node property settings ───────────────────────────────────────────────
    noise.noise_dimensions = '3D'

    math_inv.operation = 'SUBTRACT'
    math_inv.inputs[0].default_value = 1.0   # 1 − (noise Fac)

    compare.data_type  = 'FLOAT'
    compare.operation  = 'LESS_THAN'

    # FACE domain, ALL mode: removes face + orphaned edges + verts
    delete_geo.domain = 'FACE'
    delete_geo.mode   = 'ALL'

    triangulate.quad_method    = 'SHORTEST_DIAGONAL'
    triangulate.ngon_method    = 'BEAUTY'
    triangulate.min_vertices   = 4     # leave triangles as-is

    smooth.inputs['Angle'].default_value = math.radians(SMOOTH_ANGLE_DEG)

    shade.inputs['Shade Smooth'].default_value = True

    # ── wiring ───────────────────────────────────────────────────────────────
    # position → noise vector
    links.new(position.outputs['Position'],       noise.inputs['Vector'])

    # group inputs → noise settings
    links.new(grp_in.outputs['Noise Scale'],      noise.inputs['Scale'])
    links.new(grp_in.outputs['Noise Detail'],     noise.inputs['Detail'])
    links.new(grp_in.outputs['Seed'],             noise.inputs['W'])   # seed via W dimension

    # noise fac → invert → compare
    links.new(noise.outputs['Fac'],               math_inv.inputs[1])  # 1 − fac
    links.new(math_inv.outputs['Value'],          compare.inputs['A'])
    links.new(grp_in.outputs['Erosion Threshold'], compare.inputs['B'])

    # compare result → delete geometry selection
    links.new(compare.outputs['Result'],          delete_geo.inputs['Selection'])

    # geometry chain
    links.new(grp_in.outputs['Geometry'],         delete_geo.inputs['Geometry'])
    links.new(delete_geo.outputs['Geometry'],     merge_dist.inputs['Geometry'])
    links.new(grp_in.outputs['Merge Distance'],   merge_dist.inputs['Distance'])
    links.new(merge_dist.outputs['Geometry'],     triangulate.inputs['Mesh'])
    links.new(triangulate.outputs['Mesh'],        smooth.inputs['Geometry'])
    links.new(smooth.outputs['Geometry'],         shade.inputs['Geometry'])
    links.new(shade.outputs['Geometry'],          grp_out.inputs['Geometry'])

    # ── set identifier-keyed modifier inputs ─────────────────────────────────
    # threshold is the primary animatable parameter
    threshold_id = next(
        item.identifier for item in iface.items_tree
        if item.name == 'Erosion Threshold' and item.in_out == 'INPUT'
    )
    mod[threshold_id] = EROSION_THRESHOLD


def add_material(obj: bpy.types.Object) -> None:
    """Flat cel-shade asteroid material: dark basalt + occlusion hint."""
    mat_name = "mat_asteroid"
    if mat_name in bpy.data.materials:
        bpy.data.materials.remove(bpy.data.materials[mat_name])

    mat = bpy.data.materials.new(mat_name)
    mat.use_nodes = True
    mat.shadow_method = 'OPAQUE'
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out  = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')

    # dark basalt: roughness 0.85, metallic 0, base colour charcoal-grey
    bsdf.inputs['Base Color'].default_value  = (0.12, 0.11, 0.10, 1.0)
    bsdf.inputs['Roughness'].default_value   = 0.85
    bsdf.inputs['Metallic'].default_value    = 0.0

    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def export_glb(obj: bpy.types.Object) -> None:
    """Apply GN modifier into the mesh, then export Draco GLB."""
    # apply the modifier into a temporary copy
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier="GN_DeleteErosion")

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PATH),
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LEVEL,
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_apply=True,
        use_selection=True,
    )
    print(f"[holoflow] exported → {EXPORT_PATH}")


# ── MAIN ─────────────────────────────────────────────────────────────────────
def main() -> None:
    bpy.ops.object.select_all(action='DESELECT')

    obj = build_rock_base()
    build_delete_geometry_tree(obj)
    add_material(obj)

    # parent the object so the GN tree can be previewed at default threshold
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    export_glb(obj)
    print("[holoflow] blueprint complete — eroded_asteroid.glb ready.")


if __name__ == "__main__":
    main()

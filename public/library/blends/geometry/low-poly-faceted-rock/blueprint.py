"""
Geometry Nodes: Procedural Low-Poly Faceted Rock
=================================================
Technique: displacement of an icosphere along its vertex normals, driven by a
3D Noise Texture node, then flat-shaded. The entire node tree is constructed
via the bpy data API so it is repeatable and scriptable — no manual node
wiring in the UI needed.

Why icosphere, not UV sphere?
  Icosphere triangles are near-uniform in area. UV spheres concentrate triangles
  at the poles, so noise displacement produces wildly different facet sizes top
  and bottom. Uniformity here means every facet is a comparable size to its
  neighbour, which is what the studio aesthetic needs.

Why Geometry Nodes, not direct bmesh displacement?
  GN is non-destructive until you apply. You can iterate the parameters,
  convert the node group into a reusable asset, and share it across blend files.
  The bmesh approach would require re-running the entire script to change a value.

Run from Blender's Text Editor (Alt+P) or headless:
  blender --background --python blueprint.py

Outputs:
  rock_faceted.glb  — next to the .blend when saved, or at EXPORT_PATH
"""

import bpy
import math

# ── parameters ────────────────────────────────────────────────────────────────
ICO_SUBDIVISIONS    = 1      # base resolution; 1 = 80 tris, 2 = 320
GN_SUBDIVISIONS     = 2      # extra GN-level subdivisions before displacement
NOISE_SCALE         = 1.8    # frequency of the noise field; lower = bolder lumps
NOISE_DETAIL        = 4.0    # octaves; adds micro-facet texture on top of macro form
NOISE_ROUGHNESS     = 0.65   # fractal roughness; 0 = smooth, 1 = sharp fractal
NOISE_DISTORTION    = 0.40   # warp the noise on itself; adds turbulence
DISPLACEMENT_STR    = 0.20   # ±metres the verts are pushed along their normals
ROCK_COLOUR         = (0.36, 0.33, 0.30, 1.0)   # warm grey, flat diffuse
EXPORT_PATH         = "//rock_faceted.glb"       # relative to the .blend
DRACO_LEVEL         = 6      # studio standard compression level
# ──────────────────────────────────────────────────────────────────────────────


def purge_scene() -> None:
    """Remove everything in the default scene so the script is idempotent."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)


def create_icosphere() -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=ICO_SUBDIVISIONS, radius=1.0)
    obj = bpy.context.active_object
    obj.name = "rock_faceted"
    return obj


def build_gn_tree() -> bpy.types.GeometryNodeTree:
    """
    Construct the Geometry Nodes tree programmatically.

    Node chain:
      GroupInput → SubdivideMesh → SetPosition(offset=Normal*Noise) → SetShadeSmooth(False) → GroupOutput

    The 'Shade Smooth = False' node is the key to the faceted look. Blender's
    flat shading produces a hard normal discontinuity at every face boundary,
    which is exactly what gives low-poly rocks their angular, crystalline read.
    """
    ng = bpy.data.node_groups.new("RockFaceted", 'GeometryNodeTree')

    # Group interface (Blender 4.0+ API; replaces ng.inputs.new / ng.outputs.new)
    ng.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    nodes = ng.nodes
    links = ng.links

    # I/O
    gn_in  = nodes.new('NodeGroupInput');  gn_in.location  = (-900, 0)
    gn_out = nodes.new('NodeGroupOutput'); gn_out.location = ( 800, 0)

    # Subdivide before displacement so there are enough faces to displace
    subdivide = nodes.new('GeometryNodeSubdivideMesh')
    subdivide.location = (-600, 0)
    subdivide.inputs['Level'].default_value = GN_SUBDIVISIONS

    # Normal — the direction we push each vertex (always perpendicular to the face)
    in_normal = nodes.new('GeometryNodeInputNormal')
    in_normal.location = (-300, -280)

    # Noise texture — maps 3D position to a scalar 0..1
    noise = nodes.new('ShaderNodeTexNoise')
    noise.location        = (-300, -80)
    noise.noise_dimensions = '3D'
    noise.inputs['Scale'      ].default_value = NOISE_SCALE
    noise.inputs['Detail'     ].default_value = NOISE_DETAIL
    noise.inputs['Roughness'  ].default_value = NOISE_ROUGHNESS
    noise.inputs['Distortion' ].default_value = NOISE_DISTORTION
    # Leave 'Vector' unconnected: GN implicitly feeds in the vertex world position.

    # Remap 0..1 → -DISPLACEMENT_STR..+DISPLACEMENT_STR so the rock
    # gains mass on both sides of its rest surface, not just outward.
    remap = nodes.new('ShaderNodeMapRange')
    remap.location = (-50, -80)
    remap.inputs['From Min'].default_value =  0.0
    remap.inputs['From Max'].default_value =  1.0
    remap.inputs['To Min'  ].default_value = -DISPLACEMENT_STR
    remap.inputs['To Max'  ].default_value =  DISPLACEMENT_STR

    # Scale the normal vector by the remapped scalar → the displacement vector
    # VectorMath SCALE: inputs[0] = Vector, inputs[3] = Scale (float)
    scale_n = nodes.new('ShaderNodeVectorMath')
    scale_n.location  = (200, -180)
    scale_n.operation = 'SCALE'

    # Set Position with 'Offset': adds the displacement to the existing position.
    # Using 'Offset' (not 'Position') means we describe movement, not destination —
    # the node handles the addition internally.
    set_pos = nodes.new('GeometryNodeSetPosition')
    set_pos.location = (450, 0)

    # Flat shading: every face keeps its geometric normal, no interpolation.
    shade = nodes.new('GeometryNodeSetShadeSmooth')
    shade.location = (620, 0)
    shade.inputs['Shade Smooth'].default_value = False

    # Wire
    links.new(gn_in.outputs['Geometry'],    subdivide.inputs['Mesh'])
    links.new(subdivide.outputs['Mesh'],    set_pos.inputs['Geometry'])
    links.new(noise.outputs['Fac'],         remap.inputs['Value'])
    links.new(remap.outputs['Result'],      scale_n.inputs[3])      # Scale float
    links.new(in_normal.outputs['Normal'],  scale_n.inputs[0])      # Vector
    links.new(scale_n.outputs[0],           set_pos.inputs['Offset'])
    links.new(set_pos.outputs['Geometry'],  shade.inputs['Geometry'])
    links.new(shade.outputs['Geometry'],    gn_out.inputs['Geometry'])

    return ng


def apply_modifier(obj: bpy.types.Object, ng: bpy.types.GeometryNodeTree) -> None:
    mod = obj.modifiers.new("RockGen", 'NODES')
    mod.node_group = ng

    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="RockGen")

    # Consistent face normals after displacement
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')


def create_material(obj: bpy.types.Object) -> None:
    """Flat, un-textured diffuse to keep the GLB small and studio-palette."""
    mat = bpy.data.materials.new("rock_flat")
    mat.use_nodes = True
    mat.node_tree.nodes.clear()

    bsdf = mat.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = ROCK_COLOUR
    bsdf.inputs['Roughness' ].default_value = 0.92
    bsdf.inputs['Metallic'  ].default_value = 0.0

    out = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    obj.data.materials.append(mat)


def export_glb(filepath: str = EXPORT_PATH) -> None:
    bpy.ops.export_scene.gltf(
        filepath                          = filepath,
        export_format                     = 'GLB',
        export_yup                        = True,   # +Y up: studio / three.js convention
        use_selection                     = False,
        export_apply                      = True,
        export_materials                  = 'EXPORT',
        export_normals                    = True,
        export_texcoords                  = False,  # no UVs; flat colour only
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = DRACO_LEVEL,
    )


if __name__ == "__main__":
    purge_scene()
    rock = create_icosphere()
    ng   = build_gn_tree()
    apply_modifier(rock, ng)
    create_material(rock)
    export_glb()
    print(f"[blueprint] Done — rock_faceted.glb written to {EXPORT_PATH}")

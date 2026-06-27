"""
GN Field at Index — Altitude Gradient Slope Map
Blender 5.1  ·  CC0  ·  Holoflow Studio

Technique
─────────
GeometryNodeFieldAtIndex (bl_idname 'GeometryNodeFieldAtIndex') is a PURE FIELD NODE:
it has no Geometry socket. Its `domain` property declares which element TABLE to
sample from (POINT = vertex array). Its `Index` socket (INT field) supplies the row.
The evaluation CONTEXT — and therefore which element Index belongs to — is determined
by the downstream consumer.

Here the consumer is StoreNamedAttribute(domain='EDGE'). So for each of the 120 edges
on a subdivided IcoSphere, the chain evaluates once:
  EdgeVertices → vertex_index_1 (INT), vertex_index_2 (INT)
  FieldAtIndex(POINT, FLOAT, NamedAttribute('altitude'), index=vertex_index_1) → alt_v1
  FieldAtIndex(POINT, FLOAT, NamedAttribute('altitude'), index=vertex_index_2) → alt_v2
  Math(SUBTRACT, alt_v2, alt_v1) → gradient_raw
  MapRange(-GRAD_MAX, +GRAD_MAX, 0, 1) → t
  ColorRamp(t) → blue(downhill) → white(flat) → red(uphill)
  StoreNamedAttribute('edge_slope', EDGE, FLOAT_COLOR)

Why Field at Index and not EdgeVertices.Position1/2?
  EdgeVertices already exposes vertex positions directly — but ONLY positions.
  Field at Index lets you read ANY per-vertex attribute (weights, heat, custom data)
  at the same indices. Here it reads 'altitude' (Z coordinate stored earlier), which
  would be impossible through EdgeVertices alone. This is the canonical use-case.

Contrast with Sample Index (GeometryNodeSampleIndex):
  Sample Index has an explicit Geometry socket — it crosses geometry boundaries.
  Field at Index stays WITHIN the active geometry context. Swapping one for the other
  causes a topology mismatch error because Field at Index reads from the modifier's
  own vertex array, not a separately provided geometry.

Domain promotion for shader access:
  Per-edge colour cannot be read directly by a vertex shader. Evaluate on Domain
  (GeometryNodeFieldOnDomain, domain='EDGE') re-evaluates the stored edge attribute
  in the EDGE domain, then the POINT-domain StoreNamedAttribute averages adjacent-edge
  colours per vertex — giving smooth interpolation across the sphere.

Outside sources
───────────────
  Blender Manual — Field at Index Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/field/field_at_index.html
    CC-BY-SA 4.0 · Blender Documentation Team
    Related nodes in the same manual section: Sample Index, Evaluate at Index

  Blender Manual — Edge Vertices Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/read/edge_vertices.html
    CC-BY-SA 4.0 · Blender Documentation Team
    Related: Edges of Vertex, Corners of Edge (same topology-read family)

  njanakiev/blender-scripting
    https://github.com/njanakiev/blender-scripting
    MIT · Nicolas Janakiev
    Reference for bpy node-tree construction patterns used throughout.
"""

import bpy
import os
import math

# ── Parameters ────────────────────────────────────────────────────────────────
ICO_SUBDIVISIONS  = 2        # 42 verts, 120 edges, 80 triangles
NOISE_SCALE       = 1.60     # Noise texture scale for altitude displacement
NOISE_STRENGTH    = 0.22     # Displacement amplitude (metres)
GRAD_MAX          = 0.18     # MapRange cap: ±GRAD_MAX altitude delta → 0..1
EMISSION_STRENGTH = 3.0      # Material emission multiplier
EXPORT_FRAME      = 1
OUTPUT_DIR        = "//output"


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in list(bpy.data.meshes):
        bpy.data.meshes.remove(b)
    for b in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(b)
    for b in list(bpy.data.materials):
        bpy.data.materials.remove(b)


def build_material() -> bpy.types.Material:
    """Emission shader reading 'vertex_slope' FLOAT_COLOR per-vertex attribute."""
    mat = bpy.data.materials.new("MAT_SlopeMap")
    mat.use_nodes = True
    nt = mat.node_tree
    for node in list(nt.nodes):
        nt.nodes.remove(node)

    out   = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (500, 0)
    mix   = nt.nodes.new('ShaderNodeMixShader')
    mix.location = (300, 0)
    mix.inputs['Fac'].default_value = 0.80     # 80% emission for glow
    diff  = nt.nodes.new('ShaderNodeBsdfDiffuse')
    diff.location = (100, -100)
    diff.inputs['Color'].default_value = (0.01, 0.01, 0.01, 1.0)
    emit  = nt.nodes.new('ShaderNodeEmission')
    emit.location = (100, 100)
    emit.inputs['Strength'].default_value = EMISSION_STRENGTH
    attr  = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_type = 'GEOMETRY'
    attr.attribute_name = 'vertex_slope'
    attr.location = (-150, 100)

    nt.links.new(attr.outputs['Color'], emit.inputs['Color'])
    nt.links.new(diff.outputs['BSDF'],  mix.inputs[1])
    nt.links.new(emit.outputs['Emission'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    return mat


def build_gn_tree(sphere: bpy.types.Object):
    tree = bpy.data.node_groups.new("GN_FieldAtIndex_SlopeMap", 'GeometryNodeTree')
    mod  = sphere.modifiers.new("GN_SlopeMap", 'NODES')
    mod.node_group = tree
    tree.interface.new_socket('Geometry', in_out='OUTPUT',
                              socket_type='NodeSocketGeometry')

    nd = tree.nodes
    lk = tree.links

    def n(tp, loc=(0, 0)):
        node = nd.new(tp)
        node.location = loc
        return node

    gin  = n('NodeGroupInput',  (-1600, 0))
    gout = n('NodeGroupOutput', ( 1100, 0))

    # ── Noise displacement → altitude attribute ────────────────────────────
    noise = n('ShaderNodeTexNoise', (-1200, 200))
    noise.noise_dimensions = '3D'
    noise.inputs['Scale'].default_value = NOISE_SCALE

    mr = n('ShaderNodeMapRange', (-1000, 200))
    mr.inputs['From Min'].default_value  = 0.0
    mr.inputs['From Max'].default_value  = 1.0
    mr.inputs['To Min'].default_value    = -NOISE_STRENGTH
    mr.inputs['To Max'].default_value    =  NOISE_STRENGTH

    cxyz = n('ShaderNodeCombineXYZ', (-800, 200))
    lk.new(noise.outputs['Fac'],  mr.inputs['Value'])
    lk.new(mr.outputs['Result'],  cxyz.inputs['Z'])

    setpos = n('GeometryNodeSetPosition', (-600, 0))
    lk.new(gin.outputs[0],          setpos.inputs['Geometry'])
    lk.new(cxyz.outputs['Vector'],  setpos.inputs['Offset'])

    # Store altitude = displaced Z per vertex (POINT domain, FLOAT)
    sep_z = n('ShaderNodeSeparateXYZ', (-800, -100))
    inp_p = n('GeometryNodeInputPosition', (-1000, -100))
    lk.new(inp_p.outputs['Position'], sep_z.inputs['Vector'])

    store_alt = n('GeometryNodeStoreNamedAttribute', (-400, 0))
    store_alt.domain    = 'POINT'
    store_alt.data_type = 'FLOAT'
    store_alt.inputs['Name'].default_value = 'altitude'
    lk.new(setpos.outputs['Geometry'],  store_alt.inputs['Geometry'])
    lk.new(sep_z.outputs['Z'],          store_alt.inputs['Value'])

    # ── Field at Index: read altitude at each edge's vertex endpoints ──────
    edge_verts = n('GeometryNodeInputEdgeVertices', (-1200, -300))

    na_alt1 = n('GeometryNodeInputNamedAttribute', (-800, -350))
    na_alt1.data_type = 'FLOAT'
    na_alt1.inputs['Name'].default_value = 'altitude'

    na_alt2 = n('GeometryNodeInputNamedAttribute', (-800, -500))
    na_alt2.data_type = 'FLOAT'
    na_alt2.inputs['Name'].default_value = 'altitude'

    # Field at Index — vertex 1
    fai1 = n('GeometryNodeFieldAtIndex', (-500, -350))
    fai1.domain    = 'POINT'
    fai1.data_type = 'FLOAT'
    lk.new(na_alt1.outputs['Attribute'],          fai1.inputs['Value'])
    lk.new(edge_verts.outputs['Vertex Index 1'],  fai1.inputs['Index'])

    # Field at Index — vertex 2
    fai2 = n('GeometryNodeFieldAtIndex', (-500, -500))
    fai2.domain    = 'POINT'
    fai2.data_type = 'FLOAT'
    lk.new(na_alt2.outputs['Attribute'],          fai2.inputs['Value'])
    lk.new(edge_verts.outputs['Vertex Index 2'],  fai2.inputs['Index'])

    # Gradient = altitude_v2 − altitude_v1
    grad = n('ShaderNodeMath', (-250, -430))
    grad.operation = 'SUBTRACT'
    lk.new(fai2.outputs['Value'], grad.inputs[0])
    lk.new(fai1.outputs['Value'], grad.inputs[1])

    # Map gradient to [0, 1]
    grad_map = n('ShaderNodeMapRange', (-50, -430))
    grad_map.clamp = True
    grad_map.inputs['From Min'].default_value = -GRAD_MAX
    grad_map.inputs['From Max'].default_value =  GRAD_MAX
    grad_map.inputs['To Min'].default_value   = 0.0
    grad_map.inputs['To Max'].default_value   = 1.0
    lk.new(grad.outputs['Value'], grad_map.inputs['Value'])

    # ColorRamp: 0=blue(downhill), 0.5=white(flat), 1=red(uphill)
    ramp = n('ShaderNodeValToRGB', (150, -430))
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color    = (0.0, 0.1, 1.0, 1.0)   # blue
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color    = (1.0, 0.08, 0.0, 1.0)  # red
    mid = ramp.color_ramp.elements.new(0.5)
    mid.color = (1.0, 1.0, 1.0, 1.0)                               # white
    lk.new(grad_map.outputs['Result'], ramp.inputs['Fac'])

    # Store per-edge colour (EDGE domain)
    store_edge = n('GeometryNodeStoreNamedAttribute', (-200, 0))
    store_edge.domain    = 'EDGE'
    store_edge.data_type = 'FLOAT_COLOR'
    store_edge.inputs['Name'].default_value = 'edge_slope'
    lk.new(store_alt.outputs['Geometry'],  store_edge.inputs['Geometry'])
    lk.new(ramp.outputs['Color'],          store_edge.inputs['Value'])

    # ── Promote to POINT domain via Evaluate on Domain ─────────────────────
    na_edge = n('GeometryNodeInputNamedAttribute', (150, -550))
    na_edge.data_type = 'FLOAT_COLOR'
    na_edge.inputs['Name'].default_value = 'edge_slope'

    # GeometryNodeFieldOnDomain  (Evaluate on Domain)
    eval_dom = n('GeometryNodeFieldOnDomain', (350, -550))
    eval_dom.data_type = 'FLOAT_COLOR'
    eval_dom.domain    = 'EDGE'          # source domain of the attribute
    lk.new(na_edge.outputs['Attribute'], eval_dom.inputs['Value'])

    store_vert = n('GeometryNodeStoreNamedAttribute', (100, 0))
    store_vert.domain    = 'POINT'
    store_vert.data_type = 'FLOAT_COLOR'
    store_vert.inputs['Name'].default_value = 'vertex_slope'
    lk.new(store_edge.outputs['Geometry'],   store_vert.inputs['Geometry'])
    lk.new(eval_dom.outputs['Value'],        store_vert.inputs['Value'])

    lk.new(store_vert.outputs['Geometry'],   gout.inputs['Geometry'])


def export_glb(sphere: bpy.types.Object):
    bpy.context.scene.frame_set(EXPORT_FRAME)
    out_path = bpy.path.abspath(OUTPUT_DIR + "/edge_flow_sphere.glb")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_attributes=True,
        export_colors=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"Exported → {out_path}")


def main():
    clear_scene()

    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=ICO_SUBDIVISIONS, radius=1.0, location=(0, 0, 0)
    )
    sphere = bpy.context.active_object
    sphere.name = "edge_flow_sphere"

    build_gn_tree(sphere)

    mat = build_material()
    sphere.data.materials.append(mat)

    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
    export_glb(sphere)
    print("Blueprint complete — edge flow sphere built.")


if __name__ == "__main__":
    main()

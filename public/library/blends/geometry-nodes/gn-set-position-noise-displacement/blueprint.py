# blends/geometry-nodes/gn-set-position-noise-displacement/blueprint.py
# Blender 5.1 | CC0
#
# GN Set Position + Noise Texture — Animated Blob Planet
#
# Set Position's OFFSET socket ADDS to vertex positions; the sphere base radius
# is preserved while each vertex steps along its outward normal by an amount
# driven by two stacked 4D Noise Texture layers (macro + micro).  The W socket
# is advanced per-frame via a SCRIPTED driver so the blob breathes without
# touching UV coordinates.  StoreNamedAttribute freezes the elevation scalar
# BEFORE SetPosition ("freeze-before-deform") so the material colour ramp
# stays locked to topology regardless of displacement magnitude.
#
# Outside sources:
#   Blender Manual — Set Position node  CC-BY-SA 4.0, Blender Documentation Team
#   https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/write/set_position.html
#   njanakiev/blender-scripting  MIT, Nicolas Janakiev
#   https://github.com/njanakiev/blender-scripting
#   KhronosGroup/glTF-Blender-IO  Apache-2.0, Khronos Group
#   https://github.com/KhronosGroup/glTF-Blender-IO

import bpy
import math

# ── Parameters ──────────────────────────────────────────────────────────
BLEND_NAME   = "blob_planet"
OBJ_NAME     = "blob_planet"
MAT_NAME     = "blob_planet_mat"
GNM_NAME     = "BlobPlanet"
RINGS        = 64
SEGMENTS     = 64
BASE_RADIUS  = 1.0
MACRO_SCALE  = 1.5;  MACRO_DETAIL = 2.0;  MACRO_ROUGH = 0.40;  MACRO_AMP = 0.28
MICRO_SCALE  = 9.0;  MICRO_DETAIL = 5.0;  MICRO_ROUGH = 0.65;  MICRO_AMP = 0.055
NOISE_SEED_A = 3.0;  NOISE_SEED_B = 17.0   # W offsets — decorrelate layers
W_PER_FRAME  = 1.0 / 24.0                  # W advances 1 unit/second at 24 fps
MAX_LIFT     = MACRO_AMP + MICRO_AMP        # peak possible displacement
ELEV_ATTR    = "elevation_fac"
COLD_COL     = (0.01, 0.05, 0.45, 1.0)
MID_COL      = (0.03, 0.42, 0.18, 1.0)
HOT_COL      = (0.85, 0.70, 0.15, 1.0)
OUT_BLEND    = ("public/library/blends/geometry-nodes/"
                "gn-set-position-noise-displacement/blob_planet.blend")
OUT_GLB      = ("public/library/glbs/geometry-nodes/"
                "gn-set-position-noise-displacement/blob_planet.glb")


def _n(nodes, t, pos, **kw):
    """Add a node, set location, apply keyword defaults."""
    nd = nodes.new(t)
    nd.location = pos
    for k, v in kw.items():
        setattr(nd, k, v)
    return nd


def _noise4d(nodes, pos, scale, detail, roughness, distortion, lacunarity):
    nd = _n(nodes, "ShaderNodeTexNoise", pos)
    nd.noise_dimensions = '4D'
    nd.inputs['Scale'].default_value      = scale
    nd.inputs['Detail'].default_value     = detail
    nd.inputs['Roughness'].default_value  = roughness
    nd.inputs['Distortion'].default_value = distortion
    nd.inputs['Lacunarity'].default_value = lacunarity
    return nd


def _build_gn_tree() -> bpy.types.GeometryNodeTree:
    ng = bpy.data.node_groups.new(GNM_NAME, "GeometryNodeTree")
    N = ng.nodes;  L = ng.links

    # Group interface
    ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    s_w  = ng.interface.new_socket("W_Anim",          in_out="INPUT", socket_type="NodeSocketFloat")
    s_ma = ng.interface.new_socket("Macro_Amplitude", in_out="INPUT", socket_type="NodeSocketFloat")
    s_mi = ng.interface.new_socket("Micro_Amplitude", in_out="INPUT", socket_type="NodeSocketFloat")
    s_w.default_value  = 0.0;  s_w.min_value  = -100.0;  s_w.max_value  = 100.0
    s_ma.default_value = MACRO_AMP;  s_ma.min_value = 0.0;  s_ma.max_value = 1.0
    s_mi.default_value = MICRO_AMP;  s_mi.min_value = 0.0;  s_mi.max_value = 0.5

    gi  = _n(N, "NodeGroupInput",  (-960, 0))
    go  = _n(N, "NodeGroupOutput", ( 780, 0))
    pos = _n(N, "GeometryNodeInputPosition", (-780, 220))
    nor = _n(N, "GeometryNodeInputNormal",   (-780, -60))

    # W seed offsets — add constant per layer so W animations are uncorrelated
    wa  = _n(N, "ShaderNodeMath", (-780,  90), operation='ADD')
    wb  = _n(N, "ShaderNodeMath", (-780, -190), operation='ADD')
    wa.inputs[1].default_value = NOISE_SEED_A
    wb.inputs[1].default_value = NOISE_SEED_B
    L.new(gi.outputs['W_Anim'], wa.inputs[0])
    L.new(gi.outputs['W_Anim'], wb.inputs[0])

    nm_a = _noise4d(N, (-560, 220), MACRO_SCALE, MACRO_DETAIL, MACRO_ROUGH, 0.08, 2.0)
    nm_b = _noise4d(N, (-560, -100), MICRO_SCALE, MICRO_DETAIL, MICRO_ROUGH, 0.0,  2.2)
    L.new(pos.outputs['Position'], nm_a.inputs['Vector'])
    L.new(pos.outputs['Position'], nm_b.inputs['Vector'])
    L.new(wa.outputs['Value'], nm_a.inputs['W'])
    L.new(wb.outputs['Value'], nm_b.inputs['W'])

    # Centre noise: (Fac-0.5)×2  →  ∈[-1,1], then ×amplitude socket ∈[-AMP,+AMP]
    def _scale_layer(fac_out, amp_socket, y):
        sub = _n(N, "ShaderNodeMath", (-320, y), operation='SUBTRACT')
        sub.inputs[1].default_value = 0.5
        mul = _n(N, "ShaderNodeMath", (-160, y), operation='MULTIPLY')
        mul.inputs[1].default_value = 2.0
        amp = _n(N, "ShaderNodeMath", (-10, y), operation='MULTIPLY')
        L.new(fac_out, sub.inputs[0])
        L.new(sub.outputs['Value'], mul.inputs[0])
        L.new(mul.outputs['Value'], amp.inputs[0])
        L.new(amp_socket, amp.inputs[1])
        return amp.outputs['Value']

    sc_a = _scale_layer(nm_a.outputs['Fac'], gi.outputs['Macro_Amplitude'], 220)
    sc_b = _scale_layer(nm_b.outputs['Fac'], gi.outputs['Micro_Amplitude'], -100)

    add_ab = _n(N, "ShaderNodeMath", (200, 80), operation='ADD')
    L.new(sc_a, add_ab.inputs[0])
    L.new(sc_b, add_ab.inputs[1])

    # Normalise to [0,1] for elevation attribute: (combined+MAX_LIFT)/(2×MAX_LIFT)
    shift = _n(N, "ShaderNodeMath", (200, -170), operation='ADD')
    shift.inputs[1].default_value = MAX_LIFT
    norm  = _n(N, "ShaderNodeMath", (380, -170), operation='DIVIDE')
    norm.inputs[1].default_value = 2.0 * MAX_LIFT
    norm.use_clamp = True
    L.new(add_ab.outputs['Value'], shift.inputs[0])
    L.new(shift.outputs['Value'],  norm.inputs[0])

    # StoreNamedAttribute — freeze elevation BEFORE SetPosition
    store = _n(N, "GeometryNodeStoreNamedAttribute", (380, 80))
    store.data_type = 'FLOAT';  store.domain = 'POINT'
    store.inputs['Name'].default_value = ELEV_ATTR
    L.new(gi.outputs['Geometry'],  store.inputs['Geometry'])
    L.new(norm.outputs['Value'],   store.inputs['Value'])

    # Scale Normal by combined scalar → offset vector
    v_sc = _n(N, "ShaderNodeVectorMath", (200, -330), operation='SCALE')
    L.new(nor.outputs['Normal'],   v_sc.inputs[0])
    L.new(add_ab.outputs['Value'], v_sc.inputs['Scale'])

    setp = _n(N, "GeometryNodeSetPosition", (580, 80))
    L.new(store.outputs['Geometry'], setp.inputs['Geometry'])
    L.new(v_sc.outputs['Vector'],    setp.inputs['Offset'])
    L.new(setp.outputs['Geometry'],  go.inputs['Geometry'])
    return ng


def _build_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    T = mat.node_tree;  nodes = T.nodes;  links = T.links
    nodes.clear()
    attr = _n(nodes, "ShaderNodeAttribute", (-580, 80))
    attr.attribute_type = 'GEOMETRY';  attr.attribute_name = ELEV_ATTR
    ramp = _n(nodes, "ShaderNodeValToRGB", (-340, 80))
    ramp.color_ramp.interpolation = 'LINEAR'
    ramp.color_ramp.elements[0].position = 0.0;  ramp.color_ramp.elements[0].color = COLD_COL
    ramp.color_ramp.elements.new(0.45);           ramp.color_ramp.elements[1].color = MID_COL
    ramp.color_ramp.elements[2].position = 1.0;  ramp.color_ramp.elements[2].color = HOT_COL
    bsdf = _n(nodes, "ShaderNodeBsdfPrincipled", (-80, 80))
    bsdf.inputs['Roughness'].default_value = 0.75
    out  = _n(nodes, "ShaderNodeOutputMaterial", (220, 80))
    links.new(attr.outputs['Fac'],   ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(bsdf.outputs['BSDF'],  out.inputs['Surface'])
    return mat


def _add_w_driver(obj, ng):
    """Drive W_Anim socket with a scene-frame scripted expression."""
    w_id = next(
        item.identifier for item in ng.interface.items_tree
        if item.name == 'W_Anim' and item.in_out == 'INPUT'
    )
    mod = obj.modifiers[GNM_NAME]
    fc  = mod.driver_add(f'["{w_id}"]')
    drv = fc.driver;  drv.type = 'SCRIPTED'
    drv.expression = f'frame * {W_PER_FRAME:.8f}'
    var = drv.variables.new();  var.name = 'frame'
    var.targets[0].id_type   = 'SCENE'
    var.targets[0].id        = bpy.context.scene
    var.targets[0].data_path = 'frame_current'


def main():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    scene = bpy.context.scene;  scene.render.fps = 24

    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=SEGMENTS, ring_count=RINGS, radius=BASE_RADIUS, location=(0, 0, 0))
    obj = bpy.context.active_object;  obj.name = OBJ_NAME
    bpy.ops.object.shade_smooth()

    ng  = _build_gn_tree()
    mod = obj.modifiers.new(GNM_NAME, 'NODES');  mod.node_group = ng
    _add_w_driver(obj, ng)

    mat = _build_material()
    obj.data.materials.clear();  obj.data.materials.append(mat)

    bpy.ops.object.camera_add(location=(0, -4.5, 0.8),
                               rotation=(math.radians(80), 0, 0))
    scene.camera = bpy.context.active_object
    bpy.ops.object.light_add(type='SUN', location=(3, -2, 5))
    bpy.context.active_object.data.energy = 4.0

    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)

    scene.frame_set(1)
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB, export_format='GLB', export_apply=True,
        export_attributes=True, export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6, export_image_format='WEBP',
        use_selection=False)
    print(f"Saved: {OUT_BLEND}");  print(f"Exported: {OUT_GLB}")


if __name__ == "__main__":
    main()

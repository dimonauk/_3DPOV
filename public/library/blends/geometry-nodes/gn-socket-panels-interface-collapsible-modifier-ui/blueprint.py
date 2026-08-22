"""
GN Socket Panels — NodeTreeInterfacePanel API (Blender 5.0+/5.1)
=================================================================
CC0 · Holoflow Studio

Geometry Nodes group inputs get cluttered fast. Blender 5.0 introduced
NodeTreeInterfacePanel — a collapsible section in the modifier UI that
groups related sockets together. Declare panels via:

    panel = node_group.interface.new_panel(name, default_closed=False)

then place sockets inside by passing `parent=panel` to new_socket().

This blueprint builds a "Poi Energy Ribbon" GN modifier entirely from
Python. The modifier takes an input curve and produces a noise-displaced
tube mesh. Its ten sockets are organised into three panels — Curve Shape,
Noise Displacement, Ribbon — so the modifier panel stays readable at
production scale.

4.x vs 5.0 API difference
--------------------------
    # Blender 3.x / 4.x — flat list, no panels available:
    #   node_group.interface.new_socket("Scale", ...)   # panel= kwarg absent

    # Blender 5.0+ — panels added to NodeTreeInterface:
    #   panel = node_group.interface.new_panel("Noise", default_closed=False)
    #   node_group.interface.new_socket("Scale", ..., parent=panel)

The `parent` keyword silently drops to None on 4.x builds, so scripts that
use it still run but produce a flat layout. Detect the version at runtime
and branch if backward compat matters.

Outside sources:
  Blender 5.0 Release Notes — Geometry Nodes: Socket Panels — CC0
    https://www.blender.org/download/releases/5-0/
    related: https://projects.blender.org/blender/blender
  Blender Python API — bpy.types.NodeTreeInterface — CC-BY-SA-4.0
    https://docs.blender.org/api/5.1/bpy.types.NodeTreeInterface.html
    related: https://projects.blender.org/blender/blender
"""

import bpy
import math

# ---------------------------------------------------------------------------
# Parameters
# ---------------------------------------------------------------------------

SLUG = "hf_poi_energy_ribbon"
NG_NAME = "HF_PoiEnergyRibbon"
GLB_PATH = "//hf_poi_energy_ribbon.glb"

HELIX_LOOPS = 3
HELIX_RADIUS = 0.5
HELIX_HEIGHT = 0.3
HELIX_POINTS = 96

DEFAULT_RESAMPLE = 256
DEFAULT_PROFILE_RES = 8
DEFAULT_NOISE_SCALE = 4.0
DEFAULT_NOISE_STRENGTH = 0.012
DEFAULT_NOISE_DETAIL = 6.0
DEFAULT_NOISE_ROUGHNESS = 0.5
DEFAULT_RIBBON_RADIUS = 0.008
DEFAULT_FILL_CAPS = False

EMIT_COLOUR = (0.08, 0.95, 1.0, 1.0)
EMIT_STRENGTH = 12.0


# ---------------------------------------------------------------------------
# Scene cleanup
# ---------------------------------------------------------------------------

def _purge():
    for col in [
        bpy.data.objects, bpy.data.meshes, bpy.data.curves,
        bpy.data.materials, bpy.data.node_groups,
    ]:
        for item in list(col):
            col.remove(item, do_unlink=True)


# ---------------------------------------------------------------------------
# 1. Helix source curve (poi spinner path)
# ---------------------------------------------------------------------------

def _make_helix() -> bpy.types.Object:
    cu = bpy.data.curves.new(SLUG, type='CURVE')
    cu.dimensions = '3D'
    cu.resolution_u = 1  # GN resamples; keep the source low-poly
    sp = cu.splines.new(type='POLY')
    sp.points.add(HELIX_POINTS - 1)
    for i, pt in enumerate(sp.points):
        t = i / max(HELIX_POINTS - 1, 1)
        a = t * HELIX_LOOPS * 2 * math.pi
        pt.co = (
            HELIX_RADIUS * math.cos(a),
            HELIX_RADIUS * math.sin(a),
            HELIX_HEIGHT * t - HELIX_HEIGHT * 0.5,
            1.0,  # POLY points carry homogeneous w=1
        )
    ob = bpy.data.objects.new(SLUG, cu)
    bpy.context.collection.objects.link(ob)
    return ob


# ---------------------------------------------------------------------------
# 2. GN tree with panels
# ---------------------------------------------------------------------------

def _make_gn_tree() -> bpy.types.GeometryNodeTree:
    ng = bpy.data.node_groups.new(NG_NAME, type='GeometryNodeTree')
    iface = ng.interface
    nodes = ng.nodes
    links = ng.links

    # Output socket (no panel)
    iface.new_socket("Geometry", in_out='OUTPUT',
                     socket_type='NodeSocketGeometry')

    # Bare geometry input — modifier auto-feeds the host object's geometry here
    iface.new_socket("Geometry", in_out='INPUT',
                     socket_type='NodeSocketGeometry')

    # --- Panel 1: Curve Shape (open by default) ---
    # WHY open: users adjust resample count most often during
    # performance tuning; keeping it visible saves a click.
    p_curve = iface.new_panel("Curve Shape", default_closed=False)

    s = iface.new_socket("Resample Count", in_out='INPUT',
                         socket_type='NodeSocketInt', parent=p_curve)
    s.default_value = DEFAULT_RESAMPLE
    s.min_value = 8
    s.max_value = 1024

    s = iface.new_socket("Profile Resolution", in_out='INPUT',
                         socket_type='NodeSocketInt', parent=p_curve)
    s.default_value = DEFAULT_PROFILE_RES
    s.min_value = 3
    s.max_value = 32

    # --- Panel 2: Noise Displacement (open by default) ---
    p_noise = iface.new_panel("Noise Displacement", default_closed=False)

    s = iface.new_socket("Noise Scale", in_out='INPUT',
                         socket_type='NodeSocketFloat', parent=p_noise)
    s.default_value = DEFAULT_NOISE_SCALE
    s.min_value = 0.1
    s.max_value = 20.0

    s = iface.new_socket("Noise Strength", in_out='INPUT',
                         socket_type='NodeSocketFloat', parent=p_noise)
    s.default_value = DEFAULT_NOISE_STRENGTH
    s.min_value = 0.0
    s.max_value = 0.1
    s.subtype = 'DISTANCE'

    s = iface.new_socket("Noise Detail", in_out='INPUT',
                         socket_type='NodeSocketFloat', parent=p_noise)
    s.default_value = DEFAULT_NOISE_DETAIL
    s.min_value = 1.0
    s.max_value = 15.0

    s = iface.new_socket("Noise Roughness", in_out='INPUT',
                         socket_type='NodeSocketFloat', parent=p_noise)
    s.default_value = DEFAULT_NOISE_ROUGHNESS
    s.min_value = 0.0
    s.max_value = 1.0

    # --- Panel 3: Ribbon (closed by default) ---
    # WHY closed: ribbon radius and fill caps are set once and rarely
    # revisited; hiding them reduces visual noise in the modifier UI.
    p_ribbon = iface.new_panel("Ribbon", default_closed=True)

    s = iface.new_socket("Ribbon Radius", in_out='INPUT',
                         socket_type='NodeSocketFloat', parent=p_ribbon)
    s.default_value = DEFAULT_RIBBON_RADIUS
    s.min_value = 0.001
    s.max_value = 0.05
    s.subtype = 'DISTANCE'

    s = iface.new_socket("Fill Caps", in_out='INPUT',
                         socket_type='NodeSocketBool', parent=p_ribbon)
    s.default_value = DEFAULT_FILL_CAPS

    # --- Nodes ---
    n_in   = nodes.new('NodeGroupInput')
    n_out  = nodes.new('NodeGroupOutput')
    n_res  = nodes.new('GeometryNodeResampleCurve')
    n_res.mode = 'COUNT'
    n_circ = nodes.new('GeometryNodeCurveCircle')
    n_circ.mode = 'RADIUS'
    n_c2m  = nodes.new('GeometryNodeCurveToMesh')
    n_pos  = nodes.new('GeometryNodeInputPosition')
    n_norm = nodes.new('GeometryNodeInputNormal')
    n_nois = nodes.new('ShaderNodeTexNoise')
    n_nois.noise_dimensions = '3D'
    n_nois.inputs['Distortion'].default_value = 0.0
    n_mul  = nodes.new('ShaderNodeMath')
    n_mul.operation = 'MULTIPLY'
    n_vsc  = nodes.new('ShaderNodeVectorMath')
    n_vsc.operation = 'SCALE'
    n_setp = nodes.new('GeometryNodeSetPosition')
    n_mat  = nodes.new('GeometryNodeSetMaterial')

    # --- Wiring ---
    links.new(n_in.outputs['Geometry'],          n_res.inputs['Curve'])
    links.new(n_in.outputs['Resample Count'],    n_res.inputs['Count'])
    links.new(n_in.outputs['Profile Resolution'],n_circ.inputs['Resolution'])
    links.new(n_in.outputs['Ribbon Radius'],     n_circ.inputs['Radius'])
    links.new(n_res.outputs['Curve'],            n_c2m.inputs['Curve'])
    links.new(n_circ.outputs['Curve'],           n_c2m.inputs['Profile Curve'])
    links.new(n_in.outputs['Fill Caps'],         n_c2m.inputs['Fill Caps'])
    links.new(n_c2m.outputs['Mesh'],             n_setp.inputs['Geometry'])
    links.new(n_pos.outputs['Position'],         n_nois.inputs['Vector'])
    links.new(n_in.outputs['Noise Scale'],       n_nois.inputs['Scale'])
    links.new(n_in.outputs['Noise Detail'],      n_nois.inputs['Detail'])
    links.new(n_in.outputs['Noise Roughness'],   n_nois.inputs['Roughness'])
    links.new(n_nois.outputs['Fac'],             n_mul.inputs[0])
    links.new(n_in.outputs['Noise Strength'],    n_mul.inputs[1])
    # VectorMath SCALE: inputs[0]=Vector, inputs[3]=Scale float
    links.new(n_norm.outputs['Normal'],          n_vsc.inputs[0])
    links.new(n_mul.outputs['Value'],            n_vsc.inputs[3])
    links.new(n_vsc.outputs['Vector'],           n_setp.inputs['Offset'])
    links.new(n_setp.outputs['Geometry'],        n_mat.inputs['Geometry'])
    links.new(n_mat.outputs['Geometry'],         n_out.inputs['Geometry'])

    # Spread nodes for human readability in the editor
    n_in.location   = (-800,  0)
    n_res.location  = (-520,  240)
    n_circ.location = (-520, -100)
    n_c2m.location  = (-280,  120)
    n_pos.location  = (-520, -300)
    n_nois.location = (-280, -200)
    n_mul.location  = ( -40, -260)
    n_norm.location = (-280, -420)
    n_vsc.location  = ( 200, -310)
    n_setp.location = ( 440,  80)
    n_mat.location  = ( 680,  80)
    n_out.location  = ( 920,  80)

    return ng


# ---------------------------------------------------------------------------
# 3. Emission material, wired into the GN Set Material node
# ---------------------------------------------------------------------------

def _make_material(ng: bpy.types.GeometryNodeTree) -> bpy.types.Material:
    mat = bpy.data.materials.new(SLUG + "_emit")
    mat.use_nodes = True
    tree = mat.node_tree
    for nd in list(tree.nodes):
        tree.nodes.remove(nd)
    out = tree.nodes.new('ShaderNodeOutputMaterial')
    em  = tree.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = EMIT_COLOUR
    em.inputs['Strength'].default_value = EMIT_STRENGTH
    tree.links.new(em.outputs['Emission'], out.inputs['Surface'])
    for nd in ng.nodes:
        if nd.type == 'SET_MATERIAL':
            nd.inputs['Material'].default_value = mat
    return mat


# ---------------------------------------------------------------------------
# 4. Apply modifier
# ---------------------------------------------------------------------------

def _apply(ob: bpy.types.Object, ng: bpy.types.GeometryNodeTree):
    mod = ob.modifiers.new(NG_NAME, type='NODES')
    mod.node_group = ng
    # Modifier inputs are keyed by the socket identifier string
    # (e.g. "Socket_3"). The interface defaults flow through automatically;
    # only override here when you need a non-default value at start.


# ---------------------------------------------------------------------------
# 5. EEVEE scene
# ---------------------------------------------------------------------------

def _eevee():
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    sc.eevee.use_bloom = True
    sc.eevee.bloom_threshold = 0.3
    sc.eevee.bloom_intensity = 1.2
    sc.eevee.bloom_radius = 5.0
    sc.world = bpy.data.worlds.new("hf_world")
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes.get("Background") or \
         sc.world.node_tree.nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.003, 0.002, 0.01, 1.0)
    bg.inputs['Strength'].default_value = 0.0


# ---------------------------------------------------------------------------
# 6. Camera
# ---------------------------------------------------------------------------

def _camera():
    cd = bpy.data.cameras.new("hf_cam")
    cam = bpy.data.objects.new("hf_cam", cd)
    cam.location = (1.4, -1.4, 0.6)
    cam.rotation_euler = (math.radians(74), 0.0, math.radians(45))
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam


# ---------------------------------------------------------------------------
# 7. GLB export helper (call manually from Python console after review)
# ---------------------------------------------------------------------------

def _export():
    bpy.context.scene.frame_set(bpy.context.scene.frame_end)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT',
        use_selection=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )
    print(f"[HF] Exported → {GLB_PATH}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

_purge()
ob  = _make_helix()
ng  = _make_gn_tree()
_make_material(ng)
_apply(ob, ng)
_eevee()
_camera()
bpy.context.view_layer.update()

print("[HF] hf_poi_energy_ribbon ready.")
print("[HF] Modifier has 3 panels: 'Curve Shape', 'Noise Displacement', 'Ribbon'")
print("[HF] Run _export() to write hf_poi_energy_ribbon.glb")

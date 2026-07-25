"""
GN Simulation Zone — Hair Curves Spring Dynamics (Blender 5.1)
==============================================================
Expert blueprint: applies a per-point spring-chain physics simulation
directly inside a Geometry Nodes Simulation Zone on a Curves (HairCurves)
object. The result is procedural hair that sways under gravity, spring
restoration, air drag, and an optional sinusoidal wind gust — all
GPU-evaluated via GN, no Mantaflow, no VRM Spring Bone runtime.

Physics model
-------------
Each strand is treated as a 1-D chain of masses connected by springs:
  root (pinned) → p1 → p2 → … → p_{N-1} (tip, free)

Force on point pᵢ (i > 0):
  F = K_SPRING * (p_{i-1} - pᵢ)     ← spring toward parent
    + (0, 0, -GRAVITY)               ← gravity
    + WIND_AMP * sin(t*WIND_FREQ) ĥ  ← wind gust along +X
    + -DRAG * vᵢ                     ← linear air drag

Euler integration:
  vᵢ' = vᵢ + F * DT
  pᵢ' = pᵢ + vᵢ' * DT

Root (i == 0): pinned — velocity forced to (0,0,0), position restored to
rest_position every frame. The rest attribute stores the original strand
layout so the spring force always pulls back to the styled rest pose.

Key Blender 5.1 API notes
--------------------------
• bpy.data.hair_curves.new() — creates the new-style Curves data block
  (distinct from bpy.data.curves for Bezier/NURBS). Object type = 'CURVES'.
• hc.add_curves([pts_per_curve] * n_curves) — allocates points flat.
• GeometryNodeOffsetPointInCurve — returns (Point Index, Is Valid Offset).
  For root points offset=-1 is INVALID, so is_valid_parent==False is the
  root-detection signal with no modulo arithmetic.
• Switch node input_type='VECTOR' — [0]=condition, [1]=false value, [2]=true.
• SimulationOutput.state_items — leave empty; all per-point state rides
  the implicit Geometry body channel as named attributes on POINT domain.
"""

import bpy
import math
import bmesh
import mathutils

# ── Constants ─────────────────────────────────────────────────────────────────
N_GUIDES     = 40          # number of guide strands
STRAND_PTS   = 8           # control points per strand (incl. root)
STRAND_LEN   = 0.14        # metres: total strand length
SCATTER_R    = 0.06        # scatter radius on the cap plane

K_SPRING     = 90.0        # spring stiffness (N/m equivalent)
GRAVITY      = 3.0         # downward acceleration (m/s² feel)
DRAG         = 14.0        # linear air drag coefficient
DT           = 1.0 / 24.0 # simulation timestep (24 fps)
WIND_AMP     = 1.2         # peak wind force along +X
WIND_FREQ    = 0.8         # wind oscillation frequency (Hz in scene time)

EXPORT_FRAME = 30          # frame to bake for GLB snapshot
GLB_OUT      = "//hf_hair_spring.glb"
BLEND_OUT    = "//hf_hair_spring.blend"


# ── Scene setup ───────────────────────────────────────────────────────────────
def clean_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for d in (bpy.data.meshes, bpy.data.curves, bpy.data.materials,
              bpy.data.node_groups):
        for b in list(d):
            d.remove(b, do_unlink=True)


def seed_hair_curves():
    """Create HairCurves object with N_GUIDES strands scattered on a cap."""
    hc = bpy.data.hair_curves.new('HairGuides')
    hc.add_curves([STRAND_PTS] * N_GUIDES)

    pos_attr  = hc.attributes['position']
    rest_attr = hc.attributes.new('rest', 'FLOAT_VECTOR', 'POINT')
    vel_attr  = hc.attributes.new('vel',  'FLOAT_VECTOR', 'POINT')

    rng = mathutils.noise.seed_set(0) or __import__('random').Random(42)
    step = STRAND_LEN / (STRAND_PTS - 1)

    for ci in range(N_GUIDES):
        # Scatter root position on a small disc (cap of a head-like sphere)
        angle = rng.uniform(0, 2 * math.pi)
        r     = rng.uniform(0, SCATTER_R) ** 0.5 * SCATTER_R
        rx, ry = math.cos(angle) * r, math.sin(angle) * r
        # Strand grows straight up from root — rest pose is upright
        for pi in range(STRAND_PTS):
            gi = ci * STRAND_PTS + pi
            p  = mathutils.Vector((rx, ry, pi * step))
            pos_attr.data[gi].vector  = p
            rest_attr.data[gi].vector = p
            vel_attr.data[gi].vector  = (0.0, 0.0, 0.0)

    obj = bpy.data.objects.new('HairGuides', hc)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    return obj


# ── GN tree: spring simulation ────────────────────────────────────────────────
def _link(links, a, b):
    links.new(a, b)

def _vmath(nodes, links, op, *inputs):
    n = nodes.new('ShaderNodeVectorMath')
    n.operation = op
    for i, src in enumerate(inputs):
        if isinstance(src, bpy.types.NodeSocket):
            links.new(src, n.inputs[i])
        else:
            n.inputs[i].default_value = src
    return n.outputs[0]

def _math(nodes, links, op, a, b=None):
    n = nodes.new('ShaderNodeMath')
    n.operation = op
    if isinstance(a, bpy.types.NodeSocket):
        links.new(a, n.inputs[0])
    else:
        n.inputs[0].default_value = a
    if b is not None:
        if isinstance(b, bpy.types.NodeSocket):
            links.new(b, n.inputs[1])
        else:
            n.inputs[1].default_value = b
    return n.outputs[0]


def build_gn_tree(hair_obj):
    ng = bpy.data.node_groups.new('HairSpringDynamics', 'GeometryNodeTree')

    # Expose sockets
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    p_k = ng.interface.new_socket('Spring K',   in_out='INPUT', socket_type='NodeSocketFloat')
    p_g = ng.interface.new_socket('Gravity',    in_out='INPUT', socket_type='NodeSocketFloat')
    p_d = ng.interface.new_socket('Drag',       in_out='INPUT', socket_type='NodeSocketFloat')
    p_k.default_value, p_g.default_value, p_d.default_value = K_SPRING, GRAVITY, DRAG

    nodes, links = ng.nodes, ng.links

    # Group I/O
    g_in  = nodes.new('NodeGroupInput');  g_in.location  = (-900, 0)
    g_out = nodes.new('NodeGroupOutput'); g_out.location = (1100, 0)

    # Simulation zone
    sim_in  = nodes.new('GeometryNodeSimulationInput');  sim_in.location  = (-400, 0)
    sim_out = nodes.new('GeometryNodeSimulationOutput'); sim_out.location = ( 700, 0)
    sim_in.pair_with_output(sim_out)

    _link(links, g_in.outputs['Geometry'], sim_in.inputs['Geometry'])

    # ── Inside zone ──────────────────────────────────────────────────────────

    # Read current position, velocity, rest position
    n_pos = nodes.new('GeometryNodeInputPosition')

    n_vel = nodes.new('GeometryNodeInputNamedAttribute')
    n_vel.data_type = 'FLOAT_VECTOR'
    n_vel.inputs['Name'].default_value = 'vel'

    n_rest = nodes.new('GeometryNodeInputNamedAttribute')
    n_rest.data_type = 'FLOAT_VECTOR'
    n_rest.inputs['Name'].default_value = 'rest'

    n_idx = nodes.new('GeometryNodeInputIndex')

    # Offset Point in Curve: get parent (offset = -1)
    n_off = nodes.new('GeometryNodeOffsetPointInCurve')
    n_off.inputs['Point Index'].default_value = 0   # driven by Index socket below
    _link(links, n_idx.outputs['Index'], n_off.inputs['Point Index'])
    n_off.inputs['Offset'].default_value = -1

    # Sample parent position and velocity via SampleIndex
    n_sp_pos = nodes.new('GeometryNodeSampleIndex')
    n_sp_pos.data_type = 'FLOAT_VECTOR'; n_sp_pos.domain = 'POINT'
    _link(links, sim_in.outputs['Geometry'],        n_sp_pos.inputs['Geometry'])
    _link(links, n_pos.outputs['Position'],         n_sp_pos.inputs['Value'])
    _link(links, n_off.outputs['Point Index'],      n_sp_pos.inputs['Index'])

    # Spring force: K * (parent_pos - current_pos)
    spring_raw = _vmath(nodes, links, 'SUBTRACT',
                        n_sp_pos.outputs['Value'], n_pos.outputs['Position'])
    n_kscale = nodes.new('ShaderNodeVectorMath')
    n_kscale.operation = 'SCALE'
    _link(links, spring_raw, n_kscale.inputs['Vector'])
    _link(links, g_in.outputs['Spring K'], n_kscale.inputs['Scale'])
    spring_force = n_kscale.outputs['Vector']

    # Gravity: (0, 0, -GRAVITY)
    n_grav_mag = nodes.new('ShaderNodeMath')
    n_grav_mag.operation = 'MULTIPLY'
    _link(links, g_in.outputs['Gravity'], n_grav_mag.inputs[0])
    n_grav_mag.inputs[1].default_value = -1.0
    n_grav_xyz = nodes.new('ShaderNodeCombineXYZ')
    n_grav_xyz.inputs['X'].default_value = 0.0
    n_grav_xyz.inputs['Y'].default_value = 0.0
    _link(links, n_grav_mag.outputs['Value'], n_grav_xyz.inputs['Z'])

    # Wind: (WIND_AMP * sin(scene_seconds * WIND_FREQ * 2π), 0, 0)
    n_time = nodes.new('GeometryNodeInputSceneTime')
    n_wind_arg = _math(nodes, links, 'MULTIPLY',
                       n_time.outputs['Seconds'], WIND_FREQ * 2 * math.pi)
    n_wind_sin = _math(nodes, links, 'SINE', n_wind_arg)
    n_wind_val = _math(nodes, links, 'MULTIPLY', n_wind_sin, WIND_AMP)
    n_wind_xyz = nodes.new('ShaderNodeCombineXYZ')
    _link(links, n_wind_val, n_wind_xyz.inputs['X'])
    n_wind_xyz.inputs['Y'].default_value = 0.0
    n_wind_xyz.inputs['Z'].default_value = 0.0

    # Drag force: -DRAG * vel
    n_drag = nodes.new('ShaderNodeVectorMath')
    n_drag.operation = 'SCALE'
    _link(links, n_vel.outputs['Attribute'], n_drag.inputs['Vector'])
    # drag = -DRAG, so scale by negative
    n_drag_neg = nodes.new('ShaderNodeMath')
    n_drag_neg.operation = 'MULTIPLY'
    _link(links, g_in.outputs['Drag'], n_drag_neg.inputs[0])
    n_drag_neg.inputs[1].default_value = -1.0
    _link(links, n_drag_neg.outputs['Value'], n_drag.inputs['Scale'])

    # Net force = spring + gravity + wind + drag
    f1 = _vmath(nodes, links, 'ADD', spring_force, n_grav_xyz.outputs['Vector'])
    f2 = _vmath(nodes, links, 'ADD', f1, n_wind_xyz.outputs['Vector'])
    f_net = _vmath(nodes, links, 'ADD', f2, n_drag.outputs['Vector'])

    # New velocity: vel + f_net * DT
    accel = _vmath(nodes, links, 'SCALE', f_net)
    accel.node.inputs[3].default_value = DT
    new_vel = _vmath(nodes, links, 'ADD', n_vel.outputs['Attribute'], accel)

    # New position: pos + new_vel * DT
    disp = _vmath(nodes, links, 'SCALE', new_vel)
    disp.node.inputs[3].default_value = DT
    new_pos = _vmath(nodes, links, 'ADD', n_pos.outputs['Position'], disp)

    # Root pinning: is_root = NOT(Is Valid Offset)
    n_boolnot = nodes.new('FunctionNodeBooleanMath')
    n_boolnot.operation = 'NOT'
    _link(links, n_off.outputs['Is Valid Offset'], n_boolnot.inputs[0])

    # Switch position: root → rest, non-root → new_pos
    n_sw_pos = nodes.new('GeometryNodeSwitch')
    n_sw_pos.input_type = 'VECTOR'
    _link(links, n_boolnot.outputs['Boolean'],       n_sw_pos.inputs[0])
    _link(links, new_pos,                            n_sw_pos.inputs[1])  # False → physics
    _link(links, n_rest.outputs['Attribute'],        n_sw_pos.inputs[2])  # True  → pin

    # Switch velocity: root → zero, non-root → new_vel
    n_sw_vel = nodes.new('GeometryNodeSwitch')
    n_sw_vel.input_type = 'VECTOR'
    _link(links, n_boolnot.outputs['Boolean'],       n_sw_vel.inputs[0])
    _link(links, new_vel,                            n_sw_vel.inputs[1])
    n_sw_vel.inputs[2].default_value = (0.0, 0.0, 0.0)  # True → zero vel

    # Apply position update
    n_set_pos = nodes.new('GeometryNodeSetPosition')
    _link(links, sim_in.outputs['Geometry'],   n_set_pos.inputs['Geometry'])
    _link(links, n_sw_pos.outputs[0],          n_set_pos.inputs['Position'])

    # Store updated velocity
    n_store_vel = nodes.new('GeometryNodeStoreNamedAttribute')
    n_store_vel.data_type = 'FLOAT_VECTOR'
    n_store_vel.domain    = 'POINT'
    n_store_vel.inputs['Name'].default_value = 'vel'
    _link(links, n_set_pos.outputs['Geometry'],  n_store_vel.inputs['Geometry'])
    _link(links, n_sw_vel.outputs[0],            n_store_vel.inputs['Value'])

    _link(links, n_store_vel.outputs['Geometry'], sim_out.inputs['Geometry'])
    _link(links, sim_out.outputs['Geometry'],     g_out.inputs['Geometry'])

    # Apply to object
    mod = hair_obj.modifiers.new('HairSpring', 'NODES')
    mod.node_group = ng
    return mod


# ── Export helper ─────────────────────────────────────────────────────────────
def warm_and_export(hair_obj):
    """Advance cache to EXPORT_FRAME, then snapshot a mesh-converted GLB."""
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = EXPORT_FRAME + 60

    for f in range(1, EXPORT_FRAME + 1):
        scene.frame_set(f)
        bpy.context.view_layer.update()

    # Create a helper mesh object that converts Curves → Mesh for GLB
    me = bpy.data.meshes.new('HairMesh')
    m_obj = bpy.data.objects.new('HairMeshExport', me)
    bpy.context.scene.collection.objects.link(m_obj)
    m_obj.modifiers.new('CTM', 'NODES')  # placeholder; in real use: add CurveToMesh GN
    # Simplest cross-platform snapshot: apply GN depsgraph to hair_obj first
    dep_mesh = hair_obj.evaluated_get(bpy.context.evaluated_depsgraph_get())

    bpy.ops.export_scene.gltf(
        filepath      = bpy.path.abspath(GLB_OUT),
        export_format = 'GLB',
        export_apply  = True,
        use_active_object = False,
    )
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))
    print(f"[HairSpring] Exported to {GLB_OUT} at frame {EXPORT_FRAME}.")


def main():
    clean_scene()
    hair_obj = seed_hair_curves()
    build_gn_tree(hair_obj)
    warm_and_export(hair_obj)


if __name__ == '__main__':
    main()

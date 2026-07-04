"""
GN Simulation Zone — Verlet Rope: Position-Based Dynamics Cable Physics
Blender 5.1  |  CC0  |  Holoflow Studio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECHNIQUE  Position-Based Dynamics (PBD) stores NO explicit velocity.
Velocity is implicit: vel = pos - prev_pos. Each frame: new_pos = pos + vel
+ g·dt². Constraints project positions to rest lengths, implicitly correcting
velocity too — no extra correction term. Unconditionally stable; stiffer with
more constraint iterations.

Frame pipeline:
  1. vel = pos - prev_pos  (Verlet)       3. Repeat Zone: ITERS × constraint
  2. new_pos = pos + vel + g_vec          4. Pin: SetPosition(Selection=idx==0)

Outside ref — Blender Manual: Simulation Zone  CC-BY-SA 4.0  Blender Foundation
  https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html
  sibling: github.com/blender/blender
Outside ref — Müller et al. "Position Based Dynamics" (2006)  freely redistributed
  https://matthias-research.github.io/pages/publications/posBasedDyn.pdf
  GN re-implementation is an independent CC0 work.
  sibling: github.com/InteractiveComputerGraphics/PositionBasedDynamics

RUN    blender --background --python blueprint.py
OUTPUTS  verlet_rope.blend · verlet_rope_frame48.glb  (Draco 6, WebP)
"""

import bpy

ANCHOR_NAME      = "rope_anchor"
HOST_NAME        = "rope_cable_host"
GN_NAME          = "VerletRopeSim"
OUTPUT_BLEND     = "//verlet_rope.blend"
OUTPUT_GLB       = "//verlet_rope_frame48.glb"

ROPE_POINTS      = 20
ROPE_LENGTH      = 2.0
REST_SEG         = ROPE_LENGTH / (ROPE_POINTS - 1)
ANCHOR_POS       = (0.0, 0.0, 0.0)
INITIAL_SWING_X  = 0.7            # horizontal offset of lowest point (drama)
ROPE_RADIUS      = 0.025          # tube cross-section (metres)
GRAVITY_Z        = -9.81
DT               = 1.0 / 24.0
CONSTRAINT_ITERS = 6
SIM_FRAMES       = 96
GLB_FRAME        = 48


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for coll in (bpy.data.meshes, bpy.data.node_groups,
                 bpy.data.curves, bpy.data.materials):
        for b in list(coll):
            coll.remove(b)


def build_anchor():
    bpy.ops.object.empty_add(type='SPHERE', radius=0.04, location=ANCHOR_POS)
    obj = bpy.context.active_object
    obj.name = ANCHOR_NAME
    return obj


def build_host():
    mesh = bpy.data.meshes.new(HOST_NAME)
    obj  = bpy.data.objects.new(HOST_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def build_gn_tree(host_obj, anchor_obj):
    mod  = host_obj.modifiers.new(GN_NAME, 'NODES')
    tree = bpy.data.node_groups.new(GN_NAME, 'GeometryNodeTree')
    mod.node_group = tree
    ns, lk = tree.nodes, tree.links
    N = lambda t, lbl="": (lambda n: (setattr(n, 'label', lbl) or n) if lbl else n)(ns.new(t))
    L = lk.new

    iface = tree.interface
    iface.new_socket('Geometry',     in_out='OUTPUT', socket_type='NodeSocketGeometry')
    iface.new_socket('Geometry',     in_out='INPUT',  socket_type='NodeSocketGeometry')
    for nm, tp, val in [
        ('Anchor',      'NodeSocketObject',  None),
        ('Gravity Z',   'NodeSocketFloat',   GRAVITY_Z),
        ('Rest Length', 'NodeSocketFloat',   REST_SEG),
        ('Iterations',  'NodeSocketInt',     CONSTRAINT_ITERS),
    ]:
        s = iface.new_socket(nm, in_out='INPUT', socket_type=tp)
        if val is not None:
            s.default_value = val

    g_in  = N('NodeGroupInput')
    g_out = N('NodeGroupOutput')

    # ── Initial rope geometry ─────────────────────────────────────────────────
    n_line = N('GeometryNodeCurveLine', 'Rope line')
    n_line.inputs['Start'].default_value = ANCHOR_POS
    n_line.inputs['End'].default_value   = (INITIAL_SWING_X, 0.0, -ROPE_LENGTH)
    n_resamp = N('GeometryNodeResampleCurve')
    n_resamp.mode = 'COUNT'
    n_resamp.inputs['Count'].default_value = ROPE_POINTS
    L(n_line.outputs['Curve'], n_resamp.inputs['Curve'])

    # Seed prev_pos with current positions on the frame-1 skip path
    n_seed = N('GeometryNodeStoreNamedAttribute', 'Seed prev_pos')
    n_seed.data_type = 'FLOAT_VECTOR'; n_seed.domain = 'POINT'
    n_seed.inputs['Name'].default_value = 'prev_pos'
    L(n_resamp.outputs['Curve'], n_seed.inputs['Geometry'])
    # Value unconnected → defaults to InputPosition

    # ── Simulation Zone ───────────────────────────────────────────────────────
    sim_out = N('GeometryNodeSimulationOutput', 'Sim Out')
    sim_in  = N('GeometryNodeSimulationInput',  'Sim In')
    sim_in.pair_with_output(sim_out)
    L(n_seed.outputs['Geometry'], sim_in.inputs['Geometry'])

    # ── INSIDE: Verlet integration ────────────────────────────────────────────
    n_prev  = N('GeometryNodeNamedAttribute', 'prev_pos')
    n_prev.data_type = 'FLOAT_VECTOR'
    n_prev.inputs['Name'].default_value = 'prev_pos'
    n_pos = N('GeometryNodeInputPosition', 'pos_cur')

    n_vel = N('ShaderNodeVectorMath', 'vel'); n_vel.operation = 'SUBTRACT'
    L(n_pos.outputs['Position'],   n_vel.inputs[0])
    L(n_prev.outputs['Attribute'], n_vel.inputs[1])

    n_dt2 = N('ShaderNodeValue', 'dt²'); n_dt2.outputs[0].default_value = DT * DT
    n_gdt = N('ShaderNodeMath', 'g·dt²'); n_gdt.operation = 'MULTIPLY'
    L(g_in.outputs['Gravity Z'], n_gdt.inputs[0]); L(n_dt2.outputs[0], n_gdt.inputs[1])
    n_gv  = N('ShaderNodeCombineXYZ', 'g_vec'); L(n_gdt.outputs[0], n_gv.inputs[2])

    n_pv  = N('ShaderNodeVectorMath'); n_pv.operation = 'ADD'
    L(n_pos.outputs['Position'], n_pv.inputs[0]); L(n_vel.outputs['Vector'], n_pv.inputs[1])
    n_np  = N('ShaderNodeVectorMath', 'new_pos'); n_np.operation = 'ADD'
    L(n_pv.outputs['Vector'], n_np.inputs[0]); L(n_gv.outputs['Vector'], n_np.inputs[1])

    # Store prev_pos = CURRENT pos before committing new_pos
    n_spp = N('GeometryNodeStoreNamedAttribute', 'Store prev_pos')
    n_spp.data_type = 'FLOAT_VECTOR'; n_spp.domain = 'POINT'
    n_spp.inputs['Name'].default_value = 'prev_pos'
    L(sim_in.outputs['Geometry'],    n_spp.inputs['Geometry'])
    L(n_pos.outputs['Position'],     n_spp.inputs['Value'])

    n_spv = N('GeometryNodeSetPosition', 'Apply Verlet')
    L(n_spp.outputs['Geometry'], n_spv.inputs['Geometry'])
    L(n_np.outputs['Vector'],    n_spv.inputs['Position'])

    # ── INSIDE: Constraint Repeat Zone ────────────────────────────────────────
    rep_out = N('GeometryNodeRepeatOutput', 'Constraint Out')
    rep_out.repeat_items.new('GEOMETRY', 'Geometry')
    rep_in  = N('GeometryNodeRepeatInput', 'Constraint In')
    rep_in.pair_with_output(rep_out)
    L(g_in.outputs['Iterations'],      rep_in.inputs['Iterations'])
    L(n_spv.outputs['Geometry'],       rep_in.inputs['Geometry'])

    # Each iteration: point i projects toward point i+1 (Jacobi, one-sided)
    n_off = N('GeometryNodeOffsetPointInCurve', 'Offset +1')
    n_off.inputs['Offset'].default_value = 1    # Point Index → implicit Index field

    n_pf   = N('GeometryNodeInputPosition', 'Pos field (sample)')
    n_samp = N('GeometryNodeSampleIndex', 'Pos[i+1]')
    n_samp.data_type = 'FLOAT_VECTOR'; n_samp.domain = 'POINT'
    L(rep_in.outputs['Geometry'],      n_samp.inputs['Geometry'])
    L(n_pf.outputs['Position'],        n_samp.inputs['Value'])
    L(n_off.outputs['Point Index'],    n_samp.inputs['Index'])

    n_ci    = N('GeometryNodeInputPosition', 'Pos[i]')
    n_dlt   = N('ShaderNodeVectorMath', 'delta'); n_dlt.operation = 'SUBTRACT'
    L(n_samp.outputs['Value'],  n_dlt.inputs[0]); L(n_ci.outputs['Position'], n_dlt.inputs[1])

    n_len   = N('ShaderNodeVectorMath', '|delta|'); n_len.operation = 'LENGTH'
    L(n_dlt.outputs['Vector'], n_len.inputs[0])

    n_dr    = N('ShaderNodeMath', 'dist - rest'); n_dr.operation = 'SUBTRACT'
    L(n_len.outputs['Value'], n_dr.inputs[0]); L(g_in.outputs['Rest Length'], n_dr.inputs[1])
    n_h     = N('ShaderNodeMath', '× 0.5'); n_h.operation = 'MULTIPLY'; n_h.inputs[1].default_value = 0.5
    L(n_dr.outputs[0], n_h.inputs[0])
    n_sc    = N('ShaderNodeMath', '÷ dist'); n_sc.operation = 'DIVIDE'; n_sc.use_clamp = True
    L(n_h.outputs[0], n_sc.inputs[0]); L(n_len.outputs['Value'], n_sc.inputs[1])
    n_cv    = N('ShaderNodeVectorMath', 'corr_vec'); n_cv.operation = 'SCALE'
    L(n_dlt.outputs['Vector'], n_cv.inputs[0]); L(n_sc.outputs[0], n_cv.inputs[3])  # Scale=inputs[3]

    # Zero correction at last point (no next neighbour)
    n_swv   = N('GeometryNodeSwitch'); n_swv.input_type = 'VECTOR'
    L(n_off.outputs['Is Valid'],  n_swv.inputs[0])   # condition
    L(n_cv.outputs['Vector'],     n_swv.inputs[5])   # True branch; False=(0,0,0)

    n_spc   = N('GeometryNodeSetPosition', 'Apply constraint')
    L(rep_in.outputs['Geometry'],  n_spc.inputs['Geometry'])
    L(n_swv.outputs['Output'],     n_spc.inputs['Offset'])
    L(n_spc.outputs['Geometry'],   rep_out.inputs['Geometry'])

    # ── INSIDE: Pin point 0 to anchor ─────────────────────────────────────────
    n_anc  = N('GeometryNodeObjectInfo', 'Anchor'); n_anc.transform_space = 'ORIGINAL'
    n_anc.inputs['Object'].default_value = anchor_obj
    n_idx  = N('GeometryNodeIndex')
    n_eq0  = N('FunctionNodeCompare', 'idx==0')
    n_eq0.data_type = 'INT'; n_eq0.operation = 'EQUAL'
    L(n_idx.outputs['Index'], n_eq0.inputs[2])    # A int

    n_spp2 = N('GeometryNodeSetPosition', 'Pin pt 0')
    L(rep_out.outputs['Geometry'],  n_spp2.inputs['Geometry'])
    L(n_eq0.outputs['Result'],      n_spp2.inputs['Selection'])
    L(n_anc.outputs['Location'],    n_spp2.inputs['Position'])
    L(n_spp2.outputs['Geometry'],   sim_out.inputs['Geometry'])

    # ── OUTSIDE: Curve → mesh tube ────────────────────────────────────────────
    n_circ = N('GeometryNodeCurvePrimitiveCircle', 'Profile')
    n_circ.mode = 'RADIUS'
    n_circ.inputs['Radius'].default_value     = ROPE_RADIUS
    n_circ.inputs['Resolution'].default_value = 8
    n_c2m  = N('GeometryNodeCurveToMesh')
    n_c2m.inputs['Fill Caps'].default_value = True
    L(sim_out.outputs['Geometry'], n_c2m.inputs['Curve'])
    L(n_circ.outputs['Curve'],     n_c2m.inputs['Profile Curve'])
    n_mset = N('GeometryNodeSetMaterial')
    L(n_c2m.outputs['Mesh'],       n_mset.inputs['Geometry'])
    L(n_mset.outputs['Geometry'],  g_out.inputs['Geometry'])
    return n_mset


def build_material(n_mset):
    mat = bpy.data.materials.new("rope_rubber_cable")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (0.018, 0.018, 0.018, 1.0)
    bsdf.inputs['Roughness'].default_value   = 0.72
    bsdf.inputs['Metallic'].default_value    = 0.0
    n_mset.inputs['Material'].default_value  = mat


def advance_simulation(host_obj, n_frames):
    """frame_set + view_layer.update() on every frame — skipping any frame loses cache."""
    s = bpy.context.scene
    s.frame_start, s.frame_end = 1, n_frames
    bpy.context.view_layer.objects.active = host_obj
    for f in range(1, n_frames + 1):
        s.frame_set(f); bpy.context.view_layer.update()


def export_glb(host_obj, frame):
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    host_obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB, use_selection=True, export_format='GLB',
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
        export_image_format='WEBP', export_apply=True, export_animations=False,
    )


def main():
    clear_scene()
    anchor = build_anchor()
    host   = build_host()
    n_mset = build_gn_tree(host, anchor)
    build_material(n_mset)
    advance_simulation(host, SIM_FRAMES)
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
    export_glb(host, GLB_FRAME)
    print(f"[verlet-rope] saved. GLB at frame {GLB_FRAME}.")


if __name__ == "__main__":
    main()

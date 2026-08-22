"""
GN Simulation Zone — 2D Ising Model: Ferromagnetic Spin Lattice,
Metropolis Dynamics & Magnetic Domain Light-Painting (Blender 5.1)
===================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

The 2D Ising model places binary spins σᵢ ∈ {−1, +1} on a square lattice
and minimises the Hamiltonian  H = −J Σ⟨ij⟩ σᵢσⱼ  over nearest-neighbour
pairs ⟨ij⟩.  J>0 is ferromagnetic: aligned neighbours lower energy.  Lars
Onsager (1944) solved the 2D case exactly; the critical temperature is
T_c = 2J / ln(1 + √2) ≈ 2.269 J/k_B.  Below T_c, long-range order emerges
spontaneously and magnetic domains appear.

This blueprint encodes a parallel Metropolis update in a Geometry Nodes
Simulation Zone:
  1. Index arithmetic on FACE domain → periodic neighbours (toroidal BC)
  2. SampleIndex reads σ at each of 4 adjacent faces
  3. ΔE = 2J σᵢ Σ σⱼ   (single-flip energy cost)
  4. acceptance = min(1, exp(−max(0,ΔE)/T))
  5. FunctionNodeRandomValue (implicitly per-face, seed=frame) → accept/reject
  6. T cools linearly from T_HOT to T_COLD over FRAME_END frames

Parallel Metropolis violates strict detailed balance because all spins flip
simultaneously.  The visual phase transition dynamics are qualitatively
correct; for quantitative Onsager comparison, halve FRAME_END and use a
Python pre-pass to build a checkerboard mask (left as Variation 5).

Outside sources:
  Blender Manual — Simulation Zone  CC-BY-SA 4.0  Blender Foundation
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html
    related: projects.blender.org/blender/blender-manual
  Ernst Ising — "Beitrag zur Theorie des Ferromagnetismus" (1925)  Public Domain
    https://link.springer.com/article/10.1007/BF02980577
    related: physik.uni-augsburg.de/theo1/ising/
  Lars Onsager — "Crystal Statistics I" (1944)  Public Domain
    https://journals.aps.org/pr/abstract/10.1103/PhysRev.65.117
    related: physicstoday.scitation.org/doi/10.1063/1.882441
"""

import bpy, bmesh, random, array

# ── Parameters ────────────────────────────────────────────────────────────────
N         = 32       # spins per side → N×N = 1024 faces
CELL      = 0.18     # metres per spin → 5.76 m lattice
J         = 1.0      # ferromagnetic coupling constant
T_HOT     = 4.5      # start T (disordered, T >> T_c ≈ 2.269)
T_COLD    = 0.8      # end T   (strongly ordered, T << T_c)
FRAME_END = 200
SEED      = 17       # spin initialisation seed (17 gives ~50/50 start)
SLUG      = "gn-simulation-zone-ising-model-spin-lattice-phase-transition"


def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for c in (bpy.data.meshes, bpy.data.materials, bpy.data.node_groups,
              bpy.data.cameras, bpy.data.lights):
        for b in list(c): c.remove(b, do_unlink=True)


def make_lattice() -> bpy.types.Object:
    """(N+1)×(N+1) vertex grid → N×N quad faces, one spin per face."""
    mesh = bpy.data.meshes.new('ising_mesh')
    obj  = bpy.data.objects.new('ising_lattice', mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    bm = bmesh.new()
    for row in range(N + 1):
        for col in range(N + 1):
            bm.verts.new((col * CELL, row * CELL, 0.0))
    bm.verts.ensure_lookup_table()
    for row in range(N):
        for col in range(N):
            i = row * (N + 1) + col
            bm.faces.new([bm.verts[i], bm.verts[i + 1],
                          bm.verts[i + N + 2], bm.verts[i + N + 1]])
    bm.to_mesh(mesh); bm.free(); mesh.update()

    rng  = random.Random(SEED)
    spin = array.array('f', [float(rng.randint(0, 1)) for _ in range(N * N)])
    a = mesh.attributes.new('spin', 'FLOAT', 'FACE')
    a.data.foreach_set('value', spin)
    return obj


def make_material(obj: bpy.types.Object):
    """CONSTANT colour ramp: spin=0 → deep indigo, spin=1 → warm white."""
    mat = bpy.data.materials.new('ising_mat')
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = 'spin'; attr.attribute_type = 'GEOMETRY'

    cr = ramp.color_ramp; cr.interpolation = 'CONSTANT'
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.04, 0.01, 0.28, 1)
    cr.elements[1].position = 0.5; cr.elements[1].color = (0.97, 0.95, 1.00, 1)

    emit.inputs['Strength'].default_value = 6.0
    nt.links.new(attr.outputs['Fac'],      ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'],    emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    obj.data.materials.append(mat)


# ── GN node helpers ───────────────────────────────────────────────────────────
def _n(ng, t):       return ng.nodes.new(t)
def _lk(ng, s, d):   ng.links.new(s, d)


def _math(ng, op, a, b=None):
    nd = _n(ng, 'ShaderNodeMath'); nd.operation = op; nd.use_clamp = False
    for i, v in enumerate([a, b]):
        if v is None: continue
        if isinstance(v, (int, float)): nd.inputs[i].default_value = float(v)
        else: _lk(ng, v, nd.inputs[i])
    return nd.outputs[0]


def _na(ng, nm):
    nd = _n(ng, 'GeometryNodeInputNamedAttribute')
    nd.data_type = 'FLOAT'; nd.inputs['Name'].default_value = nm
    return nd.outputs['Attribute']


def _sample(ng, geo, val, idx):
    nd = _n(ng, 'GeometryNodeSampleIndex')
    nd.data_type = 'FLOAT'; nd.domain = 'FACE'
    _lk(ng, geo, nd.inputs['Geometry'])
    _lk(ng, val, nd.inputs['Value'])
    _lk(ng, idx, nd.inputs['Index'])
    return nd.outputs[0]


def _store(ng, geo, nm, val):
    nd = _n(ng, 'GeometryNodeStoreNamedAttribute')
    nd.data_type = 'FLOAT'; nd.domain = 'FACE'
    nd.inputs['Name'].default_value = nm
    _lk(ng, geo, nd.inputs['Geometry'])
    _lk(ng, val, nd.inputs['Value'])
    return nd.outputs['Geometry']


def _sw(ng, cond, fv, tv):
    nd = _n(ng, 'GeometryNodeSwitch'); nd.input_type = 'FLOAT'
    _lk(ng, cond, nd.inputs[0])
    for i, v in [(1, fv), (2, tv)]:
        if isinstance(v, (int, float)): nd.inputs[i].default_value = float(v)
        else: _lk(ng, v, nd.inputs[i])
    return nd.outputs[0]


def _cmp(ng, a, b, op):
    nd = _n(ng, 'FunctionNodeCompare')
    nd.data_type = 'FLOAT'; nd.operation = op
    for i, v in enumerate([a, b]):
        if isinstance(v, (int, float)): nd.inputs[i].default_value = float(v)
        else: _lk(ng, v, nd.inputs[i])
    return nd.outputs['Result']


# ── GN Simulation Zone ────────────────────────────────────────────────────────
def build_ising_tree(obj: bpy.types.Object):
    """
    Zone geometry carries 'spin' (FLOAT, FACE) through each frame:

    decode → neighbours → ΔE → acceptance → random → flip → store
    """
    mod = obj.modifiers.new('IsingGN', 'NODES')
    ng  = bpy.data.node_groups.new('IsingModelGN', 'GeometryNodeTree')
    mod.node_group = ng
    ng.interface.new_socket('Geometry', in_out='INPUT',
                            socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT',
                            socket_type='NodeSocketGeometry')

    gi    = _n(ng, 'NodeGroupInput')
    go    = _n(ng, 'NodeGroupOutput')
    sim_i = _n(ng, 'GeometryNodeSimulationInput')
    sim_o = _n(ng, 'GeometryNodeSimulationOutput')
    sim_i.pair_with_output(sim_o)
    _lk(ng, gi.outputs['Geometry'], sim_i.inputs['Geometry'])
    geo = sim_i.outputs['Geometry']

    # Face index → col / row  (FACE domain; faces are row-major: idx = row*N+col)
    FN   = float(N)
    idx  = _n(ng, 'GeometryNodeInputIndex').outputs['Index']
    col  = _math(ng, 'MODULO', idx, FN)
    row  = _math(ng, 'FLOOR', _math(ng, 'DIVIDE', idx, FN))

    def neigh_idx(dc, dr):
        """Periodic neighbour face index with toroidal wrap."""
        nc = _math(ng, 'MODULO', _math(ng, 'ADD', col, FN + dc), FN)
        nr = _math(ng, 'MODULO', _math(ng, 'ADD', row, FN + dr), FN)
        return _math(ng, 'ADD', _math(ng, 'MULTIPLY', nr, FN), nc)

    spin_field  = _na(ng, 'spin')
    spin_self   = _sample(ng, geo, spin_field, idx)

    # σ ∈ {0,1} → ±1 for energy calculation
    def pm1(v): return _math(ng, 'SUBTRACT', _math(ng, 'MULTIPLY', v, 2.0), 1.0)

    s_self = pm1(spin_self)
    s_r    = pm1(_sample(ng, geo, spin_field, neigh_idx( 1,  0)))
    s_l    = pm1(_sample(ng, geo, spin_field, neigh_idx(-1,  0)))
    s_u    = pm1(_sample(ng, geo, spin_field, neigh_idx( 0,  1)))
    s_d    = pm1(_sample(ng, geo, spin_field, neigh_idx( 0, -1)))

    nsum   = _math(ng, 'ADD',
                   _math(ng, 'ADD', s_r, s_l),
                   _math(ng, 'ADD', s_u, s_d))
    # ΔE = 2J σᵢ Σσⱼ  (positive ΔE = unfavourable flip)
    dE = _math(ng, 'MULTIPLY', _math(ng, 'MULTIPLY', s_self, nsum), 2.0 * J)

    # Temperature: linear cooling T_HOT → T_COLD over FRAME_END frames
    stime   = _n(ng, 'GeometryNodeInputSceneTime')
    frame_f = stime.outputs['Frame']
    t_now   = _math(ng, 'SUBTRACT', T_HOT,
                    _math(ng, 'MULTIPLY',
                          _math(ng, 'DIVIDE', frame_f, float(FRAME_END)),
                          T_HOT - T_COLD))

    # acceptance = min(1, exp(−max(0,ΔE)/T))
    dE_pos   = _math(ng, 'MAXIMUM', dE, 0.0)
    neg_dE_T = _math(ng, 'DIVIDE', _math(ng, 'MULTIPLY', dE_pos, -1.0), t_now)
    accept   = _math(ng, 'MINIMUM', _math(ng, 'EXPONENT', neg_dE_T), 1.0)

    # FunctionNodeRandomValue: implicitly hashes per-face index; Seed varies per frame
    rnd = _n(ng, 'FunctionNodeRandomValue'); rnd.data_type = 'FLOAT'
    rnd.inputs['Min'].default_value = 0.0
    rnd.inputs['Max'].default_value = 1.0
    _lk(ng, frame_f, rnd.inputs['Seed'])
    rval = rnd.outputs['Value']

    # Flip condition: random < acceptance
    flip     = _cmp(ng, rval, accept, 'LESS_THAN')
    new_spin = _sw(ng, flip, spin_self,
                   _math(ng, 'SUBTRACT', 1.0, spin_self))

    geo2 = _store(ng, geo, 'spin', new_spin)
    _lk(ng, geo2, sim_o.inputs['Geometry'])
    _lk(ng, sim_o.outputs['Geometry'], go.inputs['Geometry'])


def main():
    import os
    purge()
    obj = make_lattice()
    make_material(obj)
    build_ising_tree(obj)

    mid = N * CELL / 2
    bpy.ops.object.camera_add(location=(mid, mid, 9.0))
    cam = bpy.context.active_object
    cam.rotation_euler = (0.0, 0.0, 0.0)
    bpy.context.scene.camera = cam
    bpy.context.scene.frame_end = FRAME_END
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
    bpy.context.scene.eevee.use_bloom       = True
    bpy.context.scene.eevee.bloom_intensity = 0.4
    bpy.context.scene.eevee.bloom_threshold = 0.5

    out = os.path.join(bpy.path.abspath('//'),
                       f'public/library/blends/geometry-nodes/{SLUG}/')
    os.makedirs(out, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(
        filepath=os.path.join(out, 'hf_ising_model.blend'))
    print(f'[blueprint] → {out}hf_ising_model.blend')


if __name__ == '__main__':
    main()

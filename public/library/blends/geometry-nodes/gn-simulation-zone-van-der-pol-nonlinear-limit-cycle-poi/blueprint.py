"""
GN Simulation Zone — Van der Pol Oscillator: Nonlinear Limit Cycle,
Hopf Bifurcation & Huygens Coupling for Poi Dynamics (Blender 5.1)
====================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

The Van der Pol equation (1926) models a self-sustaining oscillator
with nonlinear damping:

    ẍ − μ(1 − x²)ẋ + x = 0

The crucial term is μ(1 − x²)ẋ.  When |x| < 1 the factor (1 − x²)
is positive → the "damping" injects energy into the system (amplifies
small oscillations).  When |x| > 1 the factor is negative → energy is
removed (clips large amplitudes).  The BALANCE of these two regimes
creates a STABLE LIMIT CYCLE of amplitude ≈ 2 in the phase plane,
approached from both inside (growing from zero) and outside (decaying
from large amplitude).  The limit cycle is born at μ = 0 via a Hopf
bifurcation.

Poi connection:
  A poi system is a driven nonlinear oscillator — the wrist inputs energy
  at a preferred frequency while the poi bob dissipates it.  The limit
  cycle is the steady spinning rhythm.  When two performers couple their
  wrists (even through visual cues alone), their poi synchronise exactly
  as Huygens observed two pendulum clocks on a shared wall lock in 1665.
  BlurAttribute coupling in this blueprint IS that Huygens mechanism.

Outside sources:
  B. van der Pol — "On Relaxation-Oscillations" (1926). Philosophical
    Magazine vol. 2. Original work, Public Domain.
    See: https://en.wikipedia.org/wiki/Van_der_Pol_oscillator (CC-BY-SA)
    related: Strogatz S.H. — Sync (Hyperion 2003, educational descriptions);
             Huygens C. — Horologium Oscillatorium (1673, PD)
  Blender Foundation — Blur Attribute node reference  CC-BY-SA 4.0
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/
      attribute/blur_attribute.html
    related: projects.blender.org/blender/blender-manual
"""

import bpy, bmesh, random, math, array

# ── Parameters ────────────────────────────────────────────────────────────────
N          = 40       # grid side (N×N = 1600 oscillators)
CELL       = 0.18     # metres per grid step → 7.2 m lattice
MU         = 1.5      # nonlinearity: 0 = harmonic, >1 = relaxation oscillator
DT         = 0.06     # time step (stable: DT < 2/(1+MU) ≈ 0.8)
COUPLING   = 0.12     # Huygens coupling strength (0 = independent, 1 = locked)
BLUR_ITER  = 1        # 1 = 4-neighbour mean; increase for wider entrainment
Z_SCALE    = 0.22     # metres/unit: oscillation amplitude as surface height
AMP_MAX    = 2.5      # limit cycle amplitude for colour mapping
X_INIT     = 0.5      # initial displacement scatter (inside limit cycle)
V_INIT     = 0.5      # initial velocity scatter
FRAME_END  = 300
SEED       = 17
SLUG       = "gn-simulation-zone-van-der-pol-nonlinear-limit-cycle-poi"


def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for c in (bpy.data.meshes, bpy.data.materials,
              bpy.data.node_groups, bpy.data.cameras, bpy.data.lights):
        for b in list(c): c.remove(b, do_unlink=True)


def make_grid():
    """N×N vertex grid with horizontal+vertical edges; vdp_x and vdp_v FLOAT attrs."""
    mesh = bpy.data.meshes.new('vdp_mesh')
    obj  = bpy.data.objects.new('hf_vdp', mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    bm = bmesh.new()
    for r in range(N):
        for c in range(N):
            bm.verts.new((c * CELL, r * CELL, 0.0))
    bm.verts.ensure_lookup_table()
    for r in range(N):
        for c in range(N - 1):
            bm.edges.new([bm.verts[r * N + c], bm.verts[r * N + c + 1]])
    for r in range(N - 1):
        for c in range(N):
            bm.edges.new([bm.verts[r * N + c], bm.verts[(r + 1) * N + c]])
    bm.to_mesh(mesh); bm.free(); mesh.update()

    rng = random.Random(SEED)
    # Random initial conditions near (0,0) in phase plane — inside limit cycle
    x_arr = array.array('f', [rng.uniform(-X_INIT, X_INIT) for _ in range(N * N)])
    v_arr = array.array('f', [rng.uniform(-V_INIT, V_INIT) for _ in range(N * N)])
    mesh.attributes.new('vdp_x', 'FLOAT', 'POINT').data.foreach_set('value', x_arr)
    mesh.attributes.new('vdp_v', 'FLOAT', 'POINT').data.foreach_set('value', v_arr)
    return obj


def make_material():
    """x_01 ∈ [0,1]: blue (negative displacement) → white (zero) → red (positive)."""
    mat = bpy.data.materials.new('hf_vdp_mat')
    mat.use_nodes = True; nt = mat.node_tree; nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = 'x_01'; attr.attribute_type = 'GEOMETRY'
    emit.inputs['Strength'].default_value = 5.0
    cr = ramp.color_ramp; cr.interpolation = 'LINEAR'
    while len(cr.elements) < 5: cr.elements.new(0.5)
    for el, (pos, col) in zip(cr.elements, [
        (0.00, (0.05, 0.15, 0.90, 1.0)),
        (0.25, (0.10, 0.70, 1.00, 1.0)),
        (0.50, (0.95, 0.95, 0.95, 1.0)),
        (0.75, (1.00, 0.60, 0.05, 1.0)),
        (1.00, (0.90, 0.08, 0.05, 1.0)),
    ]):
        el.position = pos; el.color = col
    nt.links.new(attr.outputs['Fac'],      ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'],    emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


# ── GN helpers ────────────────────────────────────────────────────────────────
def _n(ng, t):   return ng.nodes.new(t)
def _lk(ng, s, d): ng.links.new(s, d)

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

def _store(ng, g, nm, val, dtype='FLOAT'):
    nd = _n(ng, 'GeometryNodeStoreNamedAttribute')
    nd.data_type = dtype; nd.domain = 'POINT'
    nd.inputs['Name'].default_value = nm
    _lk(ng, g, nd.inputs['Geometry']); _lk(ng, val, nd.inputs['Value'])
    return nd.outputs['Geometry']

def _blur(ng, val, iters=1):
    nd = _n(ng, 'GeometryNodeBlurAttribute'); nd.data_type = 'FLOAT'
    _lk(ng, val, nd.inputs['Value'])
    nd.inputs['Iterations'].default_value = iters
    nd.inputs['Weight'].default_value = 1.0
    return nd.outputs['Value']

def _sep(ng, v):
    nd = _n(ng, 'ShaderNodeSeparateXYZ'); _lk(ng, v, nd.inputs[0])
    return nd.outputs['X'], nd.outputs['Y'], nd.outputs['Z']

def _comb(ng, x, y, z):
    nd = _n(ng, 'ShaderNodeCombineXYZ')
    for i, v in enumerate([x, y, z]):
        if isinstance(v, (int, float)): nd.inputs[i].default_value = float(v)
        else: _lk(ng, v, nd.inputs[i])
    return nd.outputs[0]

def _pos(ng):   return _n(ng, 'GeometryNodeInputPosition').outputs['Position']

def _setpos(ng, g, p):
    nd = _n(ng, 'GeometryNodeSetPosition')
    _lk(ng, g, nd.inputs['Geometry']); _lk(ng, p, nd.inputs['Position'])
    return nd.outputs['Geometry']

def _maprange(ng, val, fmin, fmax, tmin=0.0, tmax=1.0):
    nd = _n(ng, 'ShaderNodeMapRange'); nd.clamp = True
    _lk(ng, val, nd.inputs['Value'])
    nd.inputs['From Min'].default_value = fmin
    nd.inputs['From Max'].default_value = fmax
    nd.inputs['To Min'].default_value   = tmin
    nd.inputs['To Max'].default_value   = tmax
    return nd.outputs['Result']


def build_vdp_tree(obj):
    """
    Sim Zone body per vertex per frame:
      Read vdp_x, vdp_v → Van der Pol step →
      BlurAttribute coupling → SetPosition (Z = x × Z_SCALE) → Store x, v
    """
    mod = obj.modifiers.new('VdpGN', 'NODES')
    ng  = bpy.data.node_groups.new('VanDerPolGN', 'GeometryNodeTree')
    mod.node_group = ng
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    gi    = _n(ng, 'NodeGroupInput');  gi.location  = (-700, 0)
    go    = _n(ng, 'NodeGroupOutput'); go.location  = (1700, 0)
    sim_i = _n(ng, 'GeometryNodeSimulationInput');  sim_i.location = (-400, 0)
    sim_o = _n(ng, 'GeometryNodeSimulationOutput'); sim_o.location = (1200, 0)
    sim_i.pair_with_output(sim_o)
    _lk(ng, gi.outputs['Geometry'], sim_i.inputs['Geometry'])
    geo = sim_i.outputs['Geometry']

    x = _na(ng, 'vdp_x')
    v = _na(ng, 'vdp_v')

    # ── Van der Pol acceleration ──────────────────────────────────────────────
    # WHY: (1 − x²) reverses sign at |x| = 1 — negative damping inside the
    # unit circle injects energy; positive damping outside removes it.  The
    # zero-crossing of (1 − x²) × v is a nullcline of the phase plane.
    x_sq  = _math(ng, 'MULTIPLY', x, x)
    one_m = _math(ng, 'SUBTRACT', 1.0, x_sq)
    accel = _math(ng, 'SUBTRACT',
                  _math(ng, 'MULTIPLY', _math(ng, 'MULTIPLY', MU, one_m), v),
                  x)

    # Explicit Euler: use OLD v for position update (avoids half-step phase error)
    new_v = _math(ng, 'ADD', v, _math(ng, 'MULTIPLY', DT, accel))
    new_x = _math(ng, 'ADD', x, _math(ng, 'MULTIPLY', DT, v))

    # ── Huygens coupling: diffuse x toward 4-neighbour mean ──────────────────
    # WHY BlurAttribute: computes edge-connected mean in one pass.
    # (blur − self) is the diffusion flux; COUPLING weight scales its strength.
    # At COUPLING = 0 every oscillator is independent.
    # As COUPLING → 1 all oscillators collapse to the same phase (full lock).
    blur_x    = _blur(ng, new_x, BLUR_ITER)
    coupled_x = _math(ng, 'ADD', new_x,
                      _math(ng, 'MULTIPLY', COUPLING,
                            _math(ng, 'SUBTRACT', blur_x, new_x)))

    # Store state, then lift Z to make oscillation visible as a 3-D surface
    geo = _store(ng, geo, 'vdp_x', coupled_x)
    geo = _store(ng, geo, 'vdp_v', new_v)
    cur_pos    = _pos(ng)
    cx, cy, _  = _sep(ng, cur_pos)
    new_z      = _math(ng, 'MULTIPLY', coupled_x, Z_SCALE)
    geo = _setpos(ng, geo, _comb(ng, cx, cy, new_z))
    _lk(ng, geo, sim_o.inputs['Geometry'])

    # Outside zone: map x to [0,1] for colour material
    x_post = _na(ng, 'vdp_x')
    x_01   = _maprange(ng, x_post, -AMP_MAX, AMP_MAX)
    final  = _store(ng, sim_o.outputs['Geometry'], 'x_01', x_01)
    _lk(ng, final, go.inputs['Geometry'])


def setup_scene(obj):
    centre = (N - 1) * CELL / 2.0
    bpy.context.scene.frame_end = FRAME_END
    bpy.context.scene.frame_set(1)
    cam_d = bpy.data.cameras.new('VdpCam')
    cam_d.type = 'PERSP'; cam_d.lens = 35.0
    cam = bpy.data.objects.new('Camera', cam_d)
    bpy.context.collection.objects.link(cam)
    cam.location = (centre - N * CELL * 0.25,
                    centre - N * CELL * 0.90,
                    N * CELL * 0.65)
    cam.rotation_euler = (math.radians(58), 0, math.radians(15))
    bpy.context.scene.camera = cam
    if bpy.context.scene.world is None:
        bpy.context.scene.world = bpy.data.worlds.new('World')
    bpy.context.scene.world.use_nodes = False
    bpy.context.scene.world.color = (0, 0, 0)
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'


def main():
    purge()
    obj = make_grid()
    mat = make_material()
    obj.data.materials.append(mat)
    obj["holoflow:facet"] = False
    build_vdp_tree(obj)
    setup_scene(obj)
    print(f"[hf] {SLUG} ready — press Space to simulate.")


if __name__ == "__main__":
    main()

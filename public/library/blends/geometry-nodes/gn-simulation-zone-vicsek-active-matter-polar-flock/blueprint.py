"""
GN Simulation Zone — Vicsek Self-Propelled Particles:
Active-Matter Phase Transition & Poi Murmuration Trails (Blender 5.1)
======================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

Tamás Vicsek (1995) showed that point particles moving at constant speed
in the average direction of neighbours — plus a small noise term η — undergo
a continuous phase transition at a critical noise η_c.  Below η_c a single
macroscopic velocity direction spontaneously locks in across the whole flock;
above it the particles wander randomly.  That transition is a second-order
phase transition in the same universality class as a ferromagnet — the Ising
model's cousin, but for active matter.

Grid discretisation (this blueprint):
  θ defined per vertex on a 56 × 56 square grid.
  Interaction: each vertex averages the heading angle of its edge-connected
  neighbours using the circular mean (atan2 of blurred sin/cos components).
  Equivalent to the XY spin model with added uniform noise:
    θᵢ(t+1) = atan2( ⟨sin θ⟩_r , ⟨cos θ⟩_r ) + ηᵢ
  where ηᵢ ∈ [−η/2, η/2] is uniform random noise.

Cooling schedule:
  η starts at ETA_HOT (disordered flock, rainbow noise) and decreases linearly
  to ETA_COLD (ordered flock, single-colour domain) over FRAME_END frames.
  The viewer watches long-range order crystallise in real time.

Outside sources:
  T. Vicsek et al. — "Novel Type of Phase Transition in a System of
    Self-Driven Particles" (1995)  Public Domain academic preprint
    https://arxiv.org/abs/cond-mat/9507055
    related: Santa Fe Institute, Journal of Physics A — active matter
  Blender Foundation — Simulation Zone reference  CC-BY-SA 4.0
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html
    related: projects.blender.org/blender/blender-manual
"""

import bpy, bmesh, random, array, math

# ── Parameters ────────────────────────────────────────────────────────────────
N          = 56          # vertices per side; 56×56 = 3136 points
CELL       = 0.12        # metres per grid step → 6.72 m lattice
ETA_HOT    = 2.20        # high-noise start (> π/3 ≈ 1.05: well above η_c)
ETA_COLD   = 0.10        # low-noise end   (< η_c: ordered phase)
FRAME_END  = 280
BLUR_ITER  = 1           # 1 = 4-neighbour averaging; increase for larger r
SEED       = 42
SLUG       = "gn-simulation-zone-vicsek-active-matter-polar-flock"


def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for c in (bpy.data.meshes, bpy.data.materials, bpy.data.node_groups,
              bpy.data.cameras, bpy.data.lights):
        for b in list(c): c.remove(b, do_unlink=True)


def make_grid() -> bpy.types.Object:
    """N×N vertex grid; per-vertex 'theta' FLOAT attribute, uniform-random."""
    mesh = bpy.data.meshes.new('vicsek_mesh')
    obj  = bpy.data.objects.new('hf_vicsek', mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    bm = bmesh.new()
    for r in range(N):
        for c in range(N):
            bm.verts.new((c * CELL, r * CELL, 0.0))
    bm.verts.ensure_lookup_table()
    for r in range(N - 1):
        for c in range(N - 1):
            i = r * N + c
            bm.edges.new([bm.verts[i], bm.verts[i + 1]])
            bm.edges.new([bm.verts[i], bm.verts[i + N]])
        bm.edges.new([bm.verts[r * N + N - 1], bm.verts[(r + 1) * N + N - 1]])
    for c in range(N - 1):
        bm.edges.new([bm.verts[(N - 1) * N + c], bm.verts[(N - 1) * N + c + 1]])
    bm.to_mesh(mesh); bm.free(); mesh.update()

    rng   = random.Random(SEED)
    theta = array.array('f', [rng.uniform(-math.pi, math.pi) for _ in range(N * N)])
    a     = mesh.attributes.new('theta', 'FLOAT', 'POINT')
    a.data.foreach_set('value', theta)
    return obj


def make_material() -> bpy.types.Material:
    """theta_01 ∈ [0,1] → full colour wheel via 6-stop rainbow ValToRGB."""
    mat = bpy.data.materials.new('hf_vicsek_mat')
    mat.use_nodes = True
    nt  = mat.node_tree; nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = 'theta_01'; attr.attribute_type = 'GEOMETRY'

    emit.inputs['Strength'].default_value = 5.5
    cr = ramp.color_ramp; cr.interpolation = 'LINEAR'
    while len(cr.elements) < 7:
        cr.elements.new(0.5)
    for el, (pos, col) in zip(cr.elements, [
        (0.000, (1.0, 0.0, 0.0, 1.0)), (0.167, (1.0, 1.0, 0.0, 1.0)),
        (0.333, (0.0, 1.0, 0.0, 1.0)), (0.500, (0.0, 1.0, 1.0, 1.0)),
        (0.667, (0.0, 0.0, 1.0, 1.0)), (0.833, (1.0, 0.0, 1.0, 1.0)),
        (1.000, (1.0, 0.0, 0.0, 1.0)),
    ]):
        el.position = pos; el.color = col
    nt.links.new(attr.outputs['Fac'],      ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'],    emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


# ── GN helpers ────────────────────────────────────────────────────────────────
def _n(ng, t):
    return ng.nodes.new(t)

def _lk(ng, s, d):
    ng.links.new(s, d)

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

def _store(ng, geo, nm, val, domain='POINT'):
    nd = _n(ng, 'GeometryNodeStoreNamedAttribute')
    nd.data_type = 'FLOAT'; nd.domain = domain
    nd.inputs['Name'].default_value = nm
    _lk(ng, geo, nd.inputs['Geometry']); _lk(ng, val, nd.inputs['Value'])
    return nd.outputs['Geometry']

def _blur(ng, val, iters=1):
    nd = _n(ng, 'GeometryNodeBlurAttribute'); nd.data_type = 'FLOAT'
    _lk(ng, val, nd.inputs['Value'])
    nd.inputs['Iterations'].default_value = iters
    nd.inputs['Weight'].default_value = 1.0
    return nd.outputs['Value']


def build_vicsek_tree(obj: bpy.types.Object):
    """
    Sim zone body:
      theta (FLOAT POINT) ──▶ cos/sin ──▶ Blur ──▶ atan2 ──▶ + noise ──▶ theta
    """
    mod = obj.modifiers.new('VicsekGN', 'NODES')
    ng  = bpy.data.node_groups.new('VicsekModelGN', 'GeometryNodeTree')
    mod.node_group = ng
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    gi    = _n(ng, 'NodeGroupInput');  gi.location  = (-600, 0)
    go    = _n(ng, 'NodeGroupOutput'); go.location  = (1400, 0)
    sim_i = _n(ng, 'GeometryNodeSimulationInput');  sim_i.location = (-300, 0)
    sim_o = _n(ng, 'GeometryNodeSimulationOutput'); sim_o.location = ( 900, 0)
    sim_i.pair_with_output(sim_o)
    _lk(ng, gi.outputs['Geometry'], sim_i.inputs['Geometry'])
    geo = sim_i.outputs['Geometry']

    # ── Read current theta, decompose into unit vector ──────────────────────
    theta   = _na(ng, 'theta')
    cos_t   = _math(ng, 'COSINE', theta)
    sin_t   = _math(ng, 'SINE',   theta)

    # ── Circular-mean: blur sin and cos independently ───────────────────────
    # WHY: direct angle averaging fails at the ±π wrap (e.g. mean of −π+ε
    # and π−ε gives 0, not ±π).  Blurring the unit-vector components then
    # taking atan2 is the circular mean, alias-free.
    cos_blur = _blur(ng, cos_t, BLUR_ITER)
    sin_blur = _blur(ng, sin_t, BLUR_ITER)

    # ── Compute new heading: atan2(sin_blur, cos_blur) ──────────────────────
    theta_avg = _math(ng, 'ARCTAN2', sin_blur, cos_blur)

    # ── Noise schedule: η decreases from ETA_HOT to ETA_COLD ───────────────
    stime   = _n(ng, 'GeometryNodeInputSceneTime')
    frame_f = stime.outputs['Frame']
    # eta = ETA_HOT − (ETA_HOT−ETA_COLD) × clamp(frame/FRAME_END, 0, 1)
    ratio   = _math(ng, 'DIVIDE', frame_f, float(FRAME_END))
    ratio_c = _math(ng, 'MINIMUM', _math(ng, 'MAXIMUM', ratio, 0.0), 1.0)
    eta_now = _math(ng, 'SUBTRACT', ETA_HOT,
                    _math(ng, 'MULTIPLY', ratio_c, ETA_HOT - ETA_COLD))

    # Uniform noise ηᵢ ∈ [−η/2, η/2]
    rnd = _n(ng, 'FunctionNodeRandomValue'); rnd.data_type = 'FLOAT'
    rnd.inputs['Min'].default_value = 0.0; rnd.inputs['Max'].default_value = 1.0
    _lk(ng, frame_f, rnd.inputs['Seed'])
    # (rnd − 0.5) × eta_now → centred noise
    noise = _math(ng, 'MULTIPLY',
                  _math(ng, 'SUBTRACT', rnd.outputs['Value'], 0.5),
                  eta_now)

    # ── Update theta and store ───────────────────────────────────────────────
    theta_new = _math(ng, 'ADD', theta_avg, noise)
    geo_out   = _store(ng, geo, 'theta', theta_new)
    _lk(ng, geo_out, sim_o.inputs['Geometry'])

    # ── Outside zone: compute theta_01 for colour material ──────────────────
    # theta ∈ [−π, π] → [0, 1]  via  (theta + π) / (2π)
    theta_post = _na(ng, 'theta')
    theta_01   = _math(ng, 'DIVIDE',
                        _math(ng, 'ADD', theta_post, math.pi),
                        2.0 * math.pi)
    final_geo  = _store(ng, sim_o.outputs['Geometry'], 'theta_01', theta_01)
    _lk(ng, final_geo, go.inputs['Geometry'])


def setup_scene(obj: bpy.types.Object):
    centre = N * CELL / 2.0
    bpy.context.scene.frame_end = FRAME_END
    bpy.context.scene.frame_set(1)

    cam_d = bpy.data.cameras.new('VicsekCam')
    cam_d.type = 'ORTHO'; cam_d.ortho_scale = N * CELL * 1.05
    cam = bpy.data.objects.new('Camera', cam_d)
    bpy.context.collection.objects.link(cam)
    cam.location = (centre, centre, 12.0)
    cam.rotation_euler = (0.0, 0.0, 0.0)
    bpy.context.scene.camera = cam

    if bpy.context.scene.world is None:
        bpy.context.scene.world = bpy.data.worlds.new('World')
    bpy.context.scene.world.use_nodes = False
    bpy.context.scene.world.color = (0.0, 0.0, 0.0)
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'


def main():
    purge()
    obj = make_grid()
    mat = make_material()
    obj.data.materials.append(mat)
    obj["holoflow:facet"] = False
    build_vicsek_tree(obj)
    setup_scene(obj)
    print(f"[hf] {SLUG} ready — press Space to simulate, record.py to render.")


if __name__ == "__main__":
    main()

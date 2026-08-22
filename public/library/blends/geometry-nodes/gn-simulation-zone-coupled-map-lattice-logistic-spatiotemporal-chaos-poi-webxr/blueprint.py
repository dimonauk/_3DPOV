"""
GN Simulation Zone — Coupled Map Lattice (Kaneko 1989):
Logistic Map, Spatiotemporal Chaos & Synchronisation Windows for Poi Ring (Blender 5.1)
========================================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

A Coupled Map Lattice (CML) replaces the continuous time of an ODE with discrete map
iteration.  Each of N sites on a ring carries a state φᵢ ∈ (0,1) and evolves by:

    φᵢ(t+1) = (1−ε)·f(φᵢ(t))  +  ε·½·[f(φᵢ₋₁(t)) + f(φᵢ₊₁(t))]

where f(x) = r·x·(1−x) is the logistic map (r = 3.8 → fully chaotic individual maps).
The coupling ε ∈ [0,1] interpolates between:
  ε ≈ 0.05 — spatiotemporal chaos: every site chaotic, uncorrelated
  ε ≈ 0.50 — travelling kink–antikink waves and localised turbulence
  ε ≈ 0.95 — synchronised chaos: all sites lock to the same chaotic orbit

GN implementation note:
  BlurAttribute on a 2-connected ring (each vertex has exactly 2 edge-neighbours)
  computes  B_i = ½·(φᵢ₋₁ + φᵢ₊₁) — the exact neighbour mean for Kaneko's formula.
  This is WHY a 1D ring mesh is used instead of a 2D grid.

Poi framing:
  64 poi heads arranged on a 3 m ring.  Their elevation (z) = φᵢ × 2 m and
  emission hue = φᵢ.  Watch the ring flash chaotically (ε low), then ripple in
  organised waves (ε mid), then pulse as a single coherent body (ε high).

Outside sources:
  Kaneko, K. (1984) "Period-doubling of kink-antikink patterns, quasiperiodicity
    in antiferro-like structures and spatial intermittency in coupled logistic lattice"
    Prog. Theor. Phys. 72:480–486  · Public Domain academic preprint
    related: http://chaos.c.u-tokyo.ac.jp/papers/  (Kaneko group archive)
  Blender Foundation — Simulation Zone  CC-BY-SA 4.0
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html
    related: projects.blender.org/blender/blender-manual
"""

import bpy, bmesh, math, array, random

# ── Parameters ────────────────────────────────────────────────────────────────
N         = 64      # ring sites; even so period-2 orbits split evenly R/B
R_LOG     = 3.8     # logistic r; 3.57 < r ≤ 4 is fully chaotic per site
R_RING    = 3.0     # ring radius in metres for positioning
HEIGHT    = 2.0     # phi → z scale (metres above ring plane)
POI_R     = 0.06    # poi sphere radius (metres)
FRAME_END = 180     # 60 frames each for ε=0.05, 0.50, 0.95
SEED      = 137
SLUG      = "gn-simulation-zone-coupled-map-lattice-logistic-spatiotemporal-chaos-poi-webxr"


def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for pool in (bpy.data.meshes, bpy.data.materials, bpy.data.node_groups,
                 bpy.data.cameras, bpy.data.lights):
        for blk in list(pool):
            pool.remove(blk, do_unlink=True)


def make_ring() -> bpy.types.Object:
    """
    Build a closed 1D ring of N vertices connected by edges.
    WHY edges-only (no faces): BlurAttribute on a POINT domain averages over
    edge-neighbours.  A face-bearing mesh would include face-corner adjacency,
    changing the coupling stencil.  Pure edge-graph gives exactly Kaneko's formula.
    """
    mesh = bpy.data.meshes.new('cml_ring')
    obj  = bpy.data.objects.new('hf_cml_ring', mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    bm = bmesh.new()
    for i in range(N):
        a = 2.0 * math.pi * i / N
        bm.verts.new((R_RING * math.cos(a), R_RING * math.sin(a), 0.0))
    bm.verts.ensure_lookup_table()
    for i in range(N):
        bm.edges.new([bm.verts[i], bm.verts[(i + 1) % N]])
    bm.to_mesh(mesh); bm.free(); mesh.update()

    # Seed phi in (0.15, 0.85): avoid the degenerate fixed points φ=0 and φ=0.5.
    # The logistic map at r=3.8 has an unstable fixed point near 0.737; random
    # initial conditions quickly diverge from it into the full chaotic attractor.
    rng = random.Random(SEED)
    phi = array.array('f', [rng.uniform(0.15, 0.85) for _ in range(N)])
    a   = mesh.attributes.new('phi', 'FLOAT', 'POINT')
    a.data.foreach_set('value', phi)
    return obj


def make_material() -> bpy.types.Material:
    """
    Emission hue cycles through the full spectrum as phi: 0→blue, 0.5→yellow, 1→red.
    A diverging-ish scheme so the two lobes of the chaotic attractor (phi < 0.5
    and phi > 0.5) produce cool vs warm colours — the period-2 skeleton is visible
    even inside the chaos.
    """
    mat = bpy.data.materials.new('hf_cml_mat')
    mat.use_nodes = True
    nt  = mat.node_tree; nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = 'phi'; attr.attribute_type = 'GEOMETRY'

    emit.inputs['Strength'].default_value = 6.0
    cr = ramp.color_ramp; cr.interpolation = 'LINEAR'
    while len(cr.elements) < 6:
        cr.elements.new(0.5)
    stops = [
        (0.00, (0.05, 0.05, 0.9, 1.0)),   # deep blue  → φ near 0
        (0.20, (0.0,  0.8,  0.9, 1.0)),   # cyan
        (0.40, (0.1,  0.9,  0.1, 1.0)),   # green
        (0.60, (0.9,  0.9,  0.0, 1.0)),   # yellow
        (0.80, (0.9,  0.3,  0.0, 1.0)),   # orange
        (1.00, (0.9,  0.05, 0.05, 1.0)),  # deep red   → φ near 1
    ]
    for el, (pos, col) in zip(cr.elements, stops):
        el.position = pos; el.color = col

    nt.links.new(attr.outputs['Fac'],      ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'],    emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


# ── GN node-tree helpers ──────────────────────────────────────────────────────
def _n(ng, t):   return ng.nodes.new(t)
def _lk(ng, s, d): ng.links.new(s, d)

def _math(ng, op, a, b=None):
    nd = _n(ng, 'ShaderNodeMath'); nd.operation = op; nd.use_clamp = False
    for i, v in enumerate([a, b]):
        if v is None: continue
        if isinstance(v, (int, float)): nd.inputs[i].default_value = float(v)
        else: _lk(ng, v, nd.inputs[i])
    return nd.outputs[0]

def _na(ng, name):
    nd = _n(ng, 'GeometryNodeInputNamedAttribute')
    nd.data_type = 'FLOAT'; nd.inputs['Name'].default_value = name
    return nd.outputs['Attribute']

def _store(ng, geo, name, val):
    nd = _n(ng, 'GeometryNodeStoreNamedAttribute')
    nd.data_type = 'FLOAT'; nd.domain = 'POINT'
    nd.inputs['Name'].default_value = name
    _lk(ng, geo, nd.inputs['Geometry']); _lk(ng, val, nd.inputs['Value'])
    return nd.outputs['Geometry']

def _blur(ng, val, iters=1):
    nd = _n(ng, 'GeometryNodeBlurAttribute'); nd.data_type = 'FLOAT'
    nd.inputs['Iterations'].default_value = iters
    nd.inputs['Weight'].default_value    = 1.0
    _lk(ng, val, nd.inputs['Value'])
    return nd.outputs['Value']

def _xyz(ng, x, y, z):
    nd = _n(ng, 'ShaderNodeCombineXYZ')
    for i, v in enumerate([x, y, z]):
        if isinstance(v, (int, float)): nd.inputs[i].default_value = float(v)
        else: _lk(ng, v, nd.inputs[i])
    return nd.outputs['Vector']


def build_cml_tree(obj: bpy.types.Object, mat: bpy.types.Material):
    """
    Full GN tree:
      Ring vertices ──▶ SimZone [CML step] ──▶ Set Position ──▶ Instance on Points ──▶ Out

    Inside SimZone (per frame):
      φ  ──▶  F = r·φ·(1−φ)  ──▶  store "lmap"
      "lmap" ──▶  Blur(1)  ──▶  blur_F   # = ½·(F_{i−1}+F_{i+1}) on 2-connected ring
      EPS(frame)  [step function: 0.05 / 0.50 / 0.95]
      φ_new = (1−ε)·F + ε·blur_F
      clamp φ_new to (0.001, 0.999)
      store "phi" ←── φ_new
    """
    mod = obj.modifiers.new('CML_GN', 'NODES')
    ng  = bpy.data.node_groups.new('CMLRingGN', 'GeometryNodeTree')
    mod.node_group = ng
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    gi    = _n(ng, 'NodeGroupInput');  gi.location  = (-700, 0)
    go    = _n(ng, 'NodeGroupOutput'); go.location  = (1500, 0)
    sim_i = _n(ng, 'GeometryNodeSimulationInput');  sim_i.location = (-400, 0)
    sim_o = _n(ng, 'GeometryNodeSimulationOutput'); sim_o.location = (700, 0)
    sim_i.pair_with_output(sim_o)
    _lk(ng, gi.outputs['Geometry'], sim_i.inputs['Geometry'])
    geo_in = sim_i.outputs['Geometry']

    # ── Read current phi, compute logistic map F ──────────────────────────────
    phi   = _na(ng, 'phi')
    omph  = _math(ng, 'SUBTRACT', 1.0, phi)          # 1 − φ
    pprod = _math(ng, 'MULTIPLY', phi, omph)          # φ·(1−φ)
    F     = _math(ng, 'MULTIPLY', R_LOG, pprod)       # r·φ·(1−φ) = f(φ)

    # Store F as "lmap" so BlurAttribute can average it across edge-neighbours.
    # WHY store first: BlurAttribute needs the attribute on the geometry before
    # it can propagate values across the edge graph.  Without this intermediate
    # store, there is no "lmap" attribute to blur.
    geo_lmap = _store(ng, geo_in, 'lmap', F)

    # ── Blur the stored logistic-map values (= Kaneko's neighbour coupling) ───
    lmap_field = _na(ng, 'lmap')
    blur_F     = _blur(ng, lmap_field, 1)

    # ── EPS schedule: step function using SceneTime ───────────────────────────
    # ε = 0.05 for frames 1–60, 0.50 for 61–120, 0.95 for 121–180.
    # GREATER_THAN returns 1.0 when true, 0.0 when false — perfect for steps.
    frame   = _n(ng, 'GeometryNodeInputSceneTime').outputs['Frame']
    step1   = _math(ng, 'GREATER_THAN', frame, 60.0)    # 1 when frame > 60
    step2   = _math(ng, 'GREATER_THAN', frame, 120.0)   # 1 when frame > 120
    eps_add = _math(ng, 'ADD',
                    _math(ng, 'MULTIPLY', step1, 0.45),
                    _math(ng, 'MULTIPLY', step2, 0.45))
    eps     = _math(ng, 'ADD', 0.05, eps_add)           # 0.05 / 0.50 / 0.95

    # ── CML update: φ_new = (1−ε)·F + ε·blur_F ──────────────────────────────
    one_minus_eps = _math(ng, 'SUBTRACT', 1.0, eps)
    term1         = _math(ng, 'MULTIPLY', one_minus_eps, F)
    term2         = _math(ng, 'MULTIPLY', eps, blur_F)
    phi_raw       = _math(ng, 'ADD', term1, term2)

    # Clamp strictly away from 0 and 1: the logistic map has degenerate fixed
    # points at exactly 0 (the absorbing state f(0)=0) and 1.0 (f(1)=0 next step).
    phi_new = _math(ng, 'MINIMUM',
                    _math(ng, 'MAXIMUM', phi_raw, 0.001),
                    0.999)

    # Store updated phi and pass geometry to SimOutput
    geo_out = _store(ng, geo_lmap, 'phi', phi_new)
    _lk(ng, geo_out, sim_o.inputs['Geometry'])

    # ── Position ring vertices from Index and phi ─────────────────────────────
    geo_sim    = sim_o.outputs['Geometry']
    phi_out    = _na(ng, 'phi')
    idx_node   = _n(ng, 'GeometryNodeInputIndex')
    idx_f      = _math(ng, 'DIVIDE', idx_node.outputs['Index'], float(N))
    angle      = _math(ng, 'MULTIPLY', idx_f, 2.0 * math.pi)
    px         = _math(ng, 'MULTIPLY', _math(ng, 'COSINE', angle), R_RING)
    py         = _math(ng, 'MULTIPLY', _math(ng, 'SINE',   angle), R_RING)
    pz         = _math(ng, 'MULTIPLY', phi_out, HEIGHT)

    set_pos = _n(ng, 'GeometryNodeSetPosition')
    _lk(ng, geo_sim,          set_pos.inputs['Geometry'])
    _lk(ng, _xyz(ng, px, py, pz), set_pos.inputs['Position'])
    geo_positioned = set_pos.outputs['Geometry']

    # ── Instance a small sphere (poi head) at each vertex ────────────────────
    sphere = _n(ng, 'GeometryNodeMeshUVSphere')
    sphere.inputs['Rings'].default_value    = 6
    sphere.inputs['Segments'].default_value = 8
    sphere.inputs['Radius'].default_value   = POI_R

    set_mat_sphere = _n(ng, 'GeometryNodeSetMaterial')
    _lk(ng, sphere.outputs['Mesh'], set_mat_sphere.inputs['Geometry'])
    set_mat_sphere.inputs['Material'].default_value = mat

    iop = _n(ng, 'GeometryNodeInstanceOnPoints')
    _lk(ng, geo_positioned,               iop.inputs['Points'])
    _lk(ng, set_mat_sphere.outputs['Geometry'], iop.inputs['Instance'])

    _lk(ng, iop.outputs['Instances'], go.inputs['Geometry'])


def make_camera_light():
    cam_d = bpy.data.cameras.new('Cam')
    cam_o = bpy.data.objects.new('Cam', cam_d)
    bpy.context.collection.objects.link(cam_o)
    cam_o.location = (0.0, -7.5, 4.0)
    cam_o.rotation_euler = (math.radians(60), 0.0, 0.0)
    bpy.context.scene.camera = cam_o

    light_d = bpy.data.lights.new('Sun', 'SUN')
    light_d.energy = 3.0
    light_o = bpy.data.objects.new('Sun', light_d)
    bpy.context.collection.objects.link(light_o)
    light_o.rotation_euler = (math.radians(40), 0.0, math.radians(30))


def main():
    purge()
    bpy.context.scene.frame_end = FRAME_END
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'

    ring = make_ring()
    mat  = make_material()
    build_cml_tree(ring, mat)
    make_camera_light()

    # Enable EEVEE bloom so the emission halos are visible in viewport
    bpy.context.scene.eevee.use_bloom     = True
    bpy.context.scene.eevee.bloom_radius  = 3.0
    bpy.context.scene.eevee.bloom_intensity = 0.5

    print(f"[{SLUG}] Scene built — {N} poi heads, FRAME_END={FRAME_END}")
    print("Press Space in the viewport to start the Simulation Zone.")


main()

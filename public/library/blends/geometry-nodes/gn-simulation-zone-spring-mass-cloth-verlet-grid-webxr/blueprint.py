"""
GN Simulation Zone — 2-D Spring-Mass Cloth: Verlet + Laplacian Springs
=======================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

A 20×16 vertex quad mesh in the XZ plane (top row pinned) is evolved each
frame by Verlet position integration, with spring forces approximated by
two BlurAttribute passes acting as a discrete graph Laplacian:

  structural springs (iter=1)  F_s = K_STRUCT × (blur₁ – pos)
  bending springs    (iter=3)  F_b = K_BEND   × (blur₃ – pos)
  Verlet update:   pos_next = pos_curr + (pos_curr – pos_prev)×(1–DAMPING)
                             + (F_s + F_b + gravity + wind) × DT²
  Anchor:          pos_next = mix(pos_next, pos_curr, is_pinned)

Why BlurAttribute approximates a spring Laplacian:
  For a vertex v with d edge-adjacent neighbours n₁…n_d, BlurAttribute
  computes mean(nᵢ).  Therefore:
    blur – v = (1/d) × Σ(nᵢ – v) ≈ (1/d) × Laplacian(v)
  Multiplying by K × d recovers Σ kᵢ(nᵢ–v) — exactly Hooke's law over
  all incident edges with spring constant k.  We absorb the 1/d factor
  into K_STRUCT, so K_STRUCT already acts as 'spring constant per edge
  connection times (1/4)' for interior vertices.

  iter=1 reaches immediate neighbours (structural springs).
  iter=3 spreads three hops outward, coupling vertices 2–3 edges apart
  and resisting bending curvature without needing explicit angle springs.

Stability bound:  K × DT² < 1
  K_STRUCT × DT² = 250 × (1/24)² ≈ 0.434  ✓   (< 1, stable)
  K_BEND   × DT² = 18  × (1/24)² ≈ 0.031  ✓

State stored as named FLOAT_VECTOR attributes on POINT domain:
  'pos_prev'  — position at frame t−1
  'pos_curr'  — position at frame t
  'is_pinned' — FLOAT: 1.0 = anchored, 0.0 = free (set once at mesh creation)

Contrast: rope tutorial = 1-D Verlet chain; native cloth tutorial = Blender
physics modifier.  This tutorial uses only GN → deterministic bake, GLB-ready.

Outside sources:
  Blender Manual — Simulation Zone  CC-BY-SA 4.0  Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html
  Thomas Jakobsen — 'Advanced Character Physics', GDC 2001 (public domain)
    https://resources.mtu.edu/courses/cs5621/papers/AdvancedCharPhys.pdf
  David Baraff & Andrew Witkin — 'Large Steps in Cloth Simulation', SIGGRAPH 1998
    https://www.cs.cmu.edu/~baraff/papers/sig98.pdf
"""

import bpy
import bmesh
import math
import array

# ── Parameters ────────────────────────────────────────────────────────────────
GRID_COLS = 20           # vertices along X; 20 columns = 20×16 mesh
GRID_ROWS = 16           # vertices along Z; row 0 is pinned at top
GRID_W    = 1.2          # cloth width  (metres)
GRID_H    = 1.0          # cloth height (metres)
K_STRUCT  = 250.0        # structural-spring coefficient (s⁻²) — blur iter=1
K_BEND    = 18.0         # bending-spring coefficient   (s⁻²) — blur iter=3
DAMPING   = 0.018        # velocity-damping fraction per frame
GRAVITY   = -9.81        # gravitational acceleration (m s⁻²)
WIND_X    = 1.4          # horizontal wind acceleration (+X, m s⁻²)
DT        = 1.0 / 24.0  # seconds per frame at 24 fps
FRAME_END = 200

DT2     = DT * DT        # ≈ 0.001736 — appears in every Verlet offset
GRAV_Z  = GRAVITY * DT2  # per-frame gravity displacement in Z
WIND_DX = WIND_X  * DT2  # per-frame wind displacement in X


# ── Scene helpers ─────────────────────────────────────────────────────────────
def purge_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.node_groups):
        for blk in list(col):
            col.remove(blk, do_unlink=True)


def make_cloth_mesh() -> bpy.types.Object:
    """
    Build a GRID_COLS × GRID_ROWS quad mesh in the XZ plane (Y=0).

    Row 0 is at Z = +GRID_H/2 (top, pinned); row GRID_ROWS is at Z = −GRID_H/2.
    A tiny sinusoidal Y perturbation (≤5 mm) on free vertices breaks
    the degenerate flat-plane initial condition so the cloth oscillates
    naturally from frame 1 without numerical stiffness waiting to kick in.

    Three named attributes are initialised on POINT domain:
      'pos_prev'   FLOAT_VECTOR — Verlet state: position at t−1
      'pos_curr'   FLOAT_VECTOR — Verlet state: position at t
      'is_pinned'  FLOAT        — 1.0 for top-row vertices, 0.0 elsewhere
    """
    mesh = bpy.data.meshes.new('cloth_mesh')
    obj  = bpy.data.objects.new('cloth_grid', mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    bm = bmesh.new()
    cols = GRID_COLS + 1
    rows = GRID_ROWS + 1
    for row in range(rows):
        frac_r = row / GRID_ROWS
        z = (0.5 - frac_r) * GRID_H
        for col in range(cols):
            frac_c = col / GRID_COLS
            x = (frac_c - 0.5) * GRID_W
            # sinusoidal Y nudge on free vertices to seed dynamics
            y = 0.005 * math.sin(frac_c * math.pi) * frac_r if row > 0 else 0.0
            bm.verts.new((x, y, z))
    bm.verts.ensure_lookup_table()
    for row in range(GRID_ROWS):
        for col in range(GRID_COLS):
            i = row * cols + col
            bm.faces.new([bm.verts[i], bm.verts[i + 1],
                          bm.verts[i + cols + 1], bm.verts[i + cols]])
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    total = rows * cols
    # Initialise Verlet state attributes from vertex positions
    flat_pos = array.array('f',
                           [c for v in mesh.vertices for c in v.co])
    for name in ('pos_prev', 'pos_curr'):
        attr = mesh.attributes.new(name, 'FLOAT_VECTOR', 'POINT')
        attr.data.foreach_set('vector', flat_pos)

    pin_vals = array.array('f',
                           [1.0 if i < cols else 0.0 for i in range(total)])
    pin_attr = mesh.attributes.new('is_pinned', 'FLOAT', 'POINT')
    pin_attr.data.foreach_set('value', pin_vals)

    mesh.shade_smooth()
    return obj


def make_material(obj: bpy.types.Object):
    """Warm-red fabric: Principled BSDF, high roughness, double-sided."""
    mat = bpy.data.materials.new('cloth_mat')
    mat.use_nodes           = True
    mat.use_backface_culling = False
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.75, 0.10, 0.06, 1.0)
    bsdf.inputs['Roughness'].default_value  = 0.88
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    obj.data.materials.append(mat)


# ── GN node-tree helpers ──────────────────────────────────────────────────────
def _n(ng, typ):
    return ng.nodes.new(typ)


def _lk(ng, src, dst):
    ng.links.new(src, dst)


def _vm_add(ng, a, b):
    nd = _n(ng, 'ShaderNodeVectorMath'); nd.operation = 'ADD'
    _lk(ng, a, nd.inputs[0]); _lk(ng, b, nd.inputs[1]); return nd.outputs[0]


def _vm_sub(ng, a, b):
    nd = _n(ng, 'ShaderNodeVectorMath'); nd.operation = 'SUBTRACT'
    _lk(ng, a, nd.inputs[0]); _lk(ng, b, nd.inputs[1]); return nd.outputs[0]


def _vm_scale(ng, vec, fac):
    """VectorMath SCALE — fac may be a float constant or output socket."""
    nd = _n(ng, 'ShaderNodeVectorMath'); nd.operation = 'SCALE'
    _lk(ng, vec, nd.inputs[0])
    if isinstance(fac, float): nd.inputs['Scale'].default_value = fac
    else: _lk(ng, fac, nd.inputs['Scale'])
    return nd.outputs[0]


def _vm_add_const(ng, vec, xyz):
    nd = _n(ng, 'ShaderNodeVectorMath'); nd.operation = 'ADD'
    _lk(ng, vec, nd.inputs[0]); nd.inputs[1].default_value = xyz
    return nd.outputs[0]


def _sm_sub(ng, av, bv=None, bsock=None):
    """ScalarMath SUBTRACT — av may be a float literal or output socket."""
    nd = _n(ng, 'ShaderNodeMath'); nd.operation = 'SUBTRACT'
    nd.inputs[0].default_value = float(av) if isinstance(av, (int, float)) else 0.0
    if not isinstance(av, (int, float)): _lk(ng, av, nd.inputs[0])
    if bsock: _lk(ng, bsock, nd.inputs[1])
    elif bv is not None: nd.inputs[1].default_value = float(bv)
    return nd.outputs[0]


def _na_vec(ng, name):
    nd = _n(ng, 'GeometryNodeInputNamedAttribute')
    nd.data_type = 'FLOAT_VECTOR'; nd.inputs['Name'].default_value = name
    return nd.outputs['Attribute']


def _na_flt(ng, name):
    nd = _n(ng, 'GeometryNodeInputNamedAttribute')
    nd.data_type = 'FLOAT'; nd.inputs['Name'].default_value = name
    return nd.outputs['Attribute']


def _blur(ng, vec, iters):
    """BlurAttribute FLOAT_VECTOR — acts as discrete graph Laplacian."""
    nd = _n(ng, 'GeometryNodeBlurAttribute'); nd.data_type = 'FLOAT_VECTOR'
    _lk(ng, vec, nd.inputs['Value'])
    nd.inputs['Iterations'].default_value = iters
    nd.inputs['Weight'].default_value     = 1.0
    return nd.outputs['Value']


def _store_vec(ng, geo, name, val):
    nd = _n(ng, 'GeometryNodeStoreNamedAttribute')
    nd.data_type = 'FLOAT_VECTOR'; nd.domain = 'POINT'
    nd.inputs['Name'].default_value = name
    _lk(ng, geo, nd.inputs['Geometry']); _lk(ng, val, nd.inputs['Value'])
    return nd.outputs['Geometry']


# ── GN Simulation Zone ────────────────────────────────────────────────────────
def build_cloth_tree(obj: bpy.types.Object):
    """
    Geometry Nodes Simulation Zone implementing Verlet spring-mass cloth.

    Simulation Zone anatomy:
      GroupInput.Geometry → SimulationInput → [zone body] → SimulationOutput
      → SetPosition → GroupOutput.Geometry

    State lives in named attributes carried on the geometry through
    SimulationOutput → SimulationInput each frame.  The SetPosition node
    deforms the visible mesh but does NOT affect the next frame's
    spring-force calculation — that reads from pos_curr attribute.
    """
    mod = obj.modifiers.new('ClothGN', 'NODES')
    ng  = bpy.data.node_groups.new('ClothVerletGN', 'GeometryNodeTree')
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

    # ── Read Verlet state from current geometry ───────────────────────────
    pos_prev  = _na_vec(ng, 'pos_prev')
    pos_curr  = _na_vec(ng, 'pos_curr')
    is_pinned = _na_flt(ng, 'is_pinned')

    # ── Spring forces via BlurAttribute (discrete graph Laplacian) ────────
    # blur₁ − pos_curr ≈ (1/degree) × Laplacian(pos) → structural springs
    blur1       = _blur(ng, pos_curr, 1)
    struct_offs = _vm_scale(ng, _vm_sub(ng, blur1, pos_curr),
                            K_STRUCT * DT2)

    # blur₃ − pos_curr captures 3-hop curvature → bending resistance
    blur3      = _blur(ng, pos_curr, 3)
    bend_offs  = _vm_scale(ng, _vm_sub(ng, blur3, pos_curr),
                           K_BEND * DT2)

    # ── Verlet velocity term: (pos_curr − pos_prev) × (1 − DAMPING) ──────
    velocity = _vm_scale(ng, _vm_sub(ng, pos_curr, pos_prev),
                         1.0 - DAMPING)

    # ── Integrate: pos_next = pos_curr + velocity + forces × DT² ─────────
    # Gravity (0, 0, GRAV_Z) and wind (WIND_DX, 0, 0) baked as constants
    pos_next_raw = _vm_add_const(
        ng,
        _vm_add_const(
            ng,
            _vm_add(ng, _vm_add(ng, pos_curr, velocity), struct_offs),
            bend_offs),
        (WIND_DX, 0.0, GRAV_Z))

    # ── Anchor constraint: mix(pos_next_raw, pos_curr, is_pinned) ─────────
    # Avoid ShaderNodeMix ambiguity; use explicit (1−pin)×free + pin×curr
    inv_pin     = _sm_sub(ng, 1.0, bsock=is_pinned)
    free_part   = _vm_scale(ng, pos_next_raw, inv_pin)
    pinned_part = _vm_scale(ng, pos_curr, is_pinned)
    pos_next    = _vm_add(ng, free_part, pinned_part)

    # ── Advance Verlet state: shift curr→prev, write next→curr ───────────
    geo2 = _store_vec(ng, geo,  'pos_prev', pos_curr)   # old curr → prev
    geo3 = _store_vec(ng, geo2, 'pos_curr', pos_next)   # computed next → curr

    # ── Deform mesh: SetPosition so renderer sees updated shape ───────────
    set_pos = _n(ng, 'GeometryNodeSetPosition')
    _lk(ng, geo3,    set_pos.inputs['Geometry'])
    _lk(ng, pos_next, set_pos.inputs['Position'])

    _lk(ng, set_pos.outputs['Geometry'], sim_o.inputs['Geometry'])
    _lk(ng, sim_o.outputs['Geometry'],   go.inputs['Geometry'])


# ── Entry point ───────────────────────────────────────────────────────────────
def main():
    purge_scene()
    bpy.context.scene.frame_end   = FRAME_END
    bpy.context.scene.render.fps  = 24
    obj = make_cloth_mesh()
    make_material(obj)
    build_cloth_tree(obj)
    bpy.ops.wm.save_mainfile(filepath='//hf_cloth_verlet.blend')
    print("Cloth scene ready.  "
          "Object → Geometry Nodes Cache → Bake All, then scrub the timeline.")


if __name__ == '__main__':
    main()

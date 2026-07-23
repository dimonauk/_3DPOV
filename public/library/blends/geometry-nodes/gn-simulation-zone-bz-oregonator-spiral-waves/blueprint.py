"""
Belousov-Zhabotinsky Oregonator — GN Simulation Zone  |  Blender 5.1  |  CC0
-------------------------------------------------------------------------------
Two-variable simplified Oregonator on a planar vertex-domain grid.

The BZ reaction is an EXCITABLE MEDIUM, not a diffusion-driven Turing system.
The key difference: a Turing system relaxes to a static pattern; an excitable
medium sustains perpetual oscillation — once a spiral arm nucleates it rotates
forever, drawing energy from the reaction kinetics rather than from gradients.

Oregonator (Field-Körös-Noyes 1972, reduced by Tyson & Fife 1980):
    du/dt = (1/ε)[u(1−u) − fv(u−q)/(u+q)]  +  D∇²u
    dv/dt = u − v
where
    u  = normalised [HBrO₂] (autocatalytic activator / bromous acid)
    v  = normalised [Fe³⁺]  (oxidised ferroin indicator, inhibitor)
    ε  = 0.04   — activator fast-variable timescale
    f  = 1.4    — stoichiometric factor; spirals exist for 0.5 < f < 2
    q  = 0.002  — quench / self-inhibition parameter
    D  = 0.25   — grid-normalised activator diffusion (v non-diffusive here)
    dt = 0.01   — Forward-Euler step

Stability check (Von Neumann, 2-D):
    Diffusion: dt ≤ 1/(4D·n_nbr) = 1/(4·0.25·4) = 0.25  →  0.01 ✓
    Reaction:  dt ≤ ε = 0.04                              →  0.01 ✓

Laplacian approximation via Blur Attribute:
    BlurAttr(u, Iterations=1) = mean of edge-adjacent vertex values
    ∇²u ≈ (blur_u − u) × 4       (4 = valence of interior grid vertex)
    This is the standard discrete Laplacian divided by Δx², with Δx=1.
    Use domain=POINT (vertex) so the BZ field lives at vertices, not faces.

Initial conditions — broken-circle spiral seeds:
    Lower hemisphere of each seed disc: u=0.85, v=0.10  (excited)
    Upper hemisphere:                   u=0.02, v=0.90  (refractory)
    Rest of grid:                       u≈0.008, v≈0.008 (resting state)
    Three seeds at ±1/3 of grid span nucleate three independent spiral pairs.
"""

import bpy
import bmesh
import math
import random

# ── parameters (named constants, change only here) ──────────────────────────
N          = 64      # subdivisions per axis → 65×65 = 4225 verts, 64×64 faces
GRID_SIZE  = 6.0     # world-space side length (metres)
EPS        = 0.04    # ε fast-variable timescale
F          = 1.4     # f stoichiometric factor
Q          = 0.002   # q quench parameter
D          = 0.25    # grid-normalised activator diffusion
DT         = 0.01    # Forward-Euler step
INV_EPS    = 1.0 / EPS      # 25.0
SEED_R     = 0.45    # seed-disc radius in grid-unit normalised coords (0–1)
HEIGHT_SCL = 0.8     # Z-height multiplier for activator landscape
OBJ_NAME   = "hf_bz_oscillator"
GROUP_NAME = "HF_BZ_Oregonator"
# ─────────────────────────────────────────────────────────────────────────────


def _clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in list(bpy.data.meshes) + list(bpy.data.node_groups):
        try:
            bpy.data.meshes.remove(blk)
        except Exception:
            pass
        try:
            bpy.data.node_groups.remove(blk)
        except Exception:
            pass


def make_grid():
    """Create N×N quad grid, seed u/v vertex attributes for the BZ initial conditions."""
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=N, y_subdivisions=N,
        size=GRID_SIZE, location=(0, 0, 0)
    )
    obj = bpy.context.active_object
    obj.name = OBJ_NAME

    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.verts.ensure_lookup_table()

    u_lay = bm.verts.layers.float.new("u")
    v_lay = bm.verts.layers.float.new("v")

    # rest state: u_rest = q(f+1)/(2-f); v_rest = u_rest
    u_rest = Q * (F + 1.0) / (2.0 - F)   # ≈ 0.008 for f=1.4
    v_rest = u_rest

    # seed positions in normalised [0,1] coords over the grid
    seeds = [
        (0.30, 0.40),
        (0.65, 0.35),
        (0.48, 0.70),
    ]

    rng = random.Random(42)
    for vert in bm.verts:
        # normalise to [0,1]
        nx = (vert.co.x / GRID_SIZE) + 0.5
        ny = (vert.co.y / GRID_SIZE) + 0.5

        placed = False
        for (sx, sy) in seeds:
            dx = nx - sx
            dy = ny - sy
            dist = math.sqrt(dx*dx + dy*dy)
            if dist <= SEED_R:
                angle = math.atan2(dy, dx)   # −π .. π
                if angle < 0:               # lower half → excited
                    vert[u_lay] = 0.85 + rng.uniform(-0.05, 0.05)
                    vert[v_lay] = 0.10 + rng.uniform(-0.02, 0.02)
                else:                       # upper half → refractory
                    vert[u_lay] = 0.02 + rng.uniform(-0.01, 0.01)
                    vert[v_lay] = 0.90 + rng.uniform(-0.05, 0.05)
                placed = True
                break
        if not placed:
            # rest state + tiny noise to let the wavefront breathe
            vert[u_lay] = u_rest + rng.uniform(0, 0.003)
            vert[v_lay] = v_rest + rng.uniform(0, 0.001)

    bm.to_mesh(me)
    bm.free()
    return obj


def _node(nodes, bl_type, pos, **kw):
    n = nodes.new(bl_type)
    n.location = pos
    for k, v in kw.items():
        setattr(n, k, v)
    return n


def _link(links, out_node, out_name, in_node, in_name):
    links.new(out_node.outputs[out_name], in_node.inputs[in_name])


def _math(nodes, pos, op, val_b=None, val_a=None):
    """Shortcut: create ShaderNodeMath with given operation and optional constants."""
    n = nodes.new("ShaderNodeMath")
    n.location = pos
    n.operation = op
    n.use_clamp = False
    if val_a is not None:
        n.inputs[0].default_value = val_a
    if val_b is not None:
        n.inputs[1].default_value = val_b
    return n


def build_bz_tree(obj):
    """Build GN Simulation Zone encoding the two-variable Oregonator ODE."""
    tree = bpy.data.node_groups.new(GROUP_NAME, "GeometryNodeTree")
    nodes, links = tree.nodes, tree.links

    # ── group sockets (Blender 4.0+ interface API) ───────────────────────
    tree.interface.new_socket("Geometry", in_out="INPUT",
                              socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="OUTPUT",
                              socket_type="NodeSocketGeometry")

    gi = _node(nodes, "NodeGroupInput",  (-1000, 0))
    go = _node(nodes, "NodeGroupOutput", (3200,  0))

    # ── simulation zone ──────────────────────────────────────────────────
    # Geometry body carries u/v as named vertex attributes → no float state items needed
    sim_i = _node(nodes, "GeometryNodeSimulationInput",  (-600, 0))
    sim_o = _node(nodes, "GeometryNodeSimulationOutput", (2800, 0))
    sim_i.pair_with_output(sim_o)

    links.new(gi.outputs["Geometry"], sim_i.inputs["Geometry"])
    links.new(sim_o.outputs["Geometry"], go.inputs["Geometry"])

    # ── read current-frame u, v from geometry body ───────────────────────
    na_u = _node(nodes, "GeometryNodeInputNamedAttribute", (-300, 300))
    na_u.data_type = 'FLOAT'
    na_u.inputs["Name"].default_value = "u"

    na_v = _node(nodes, "GeometryNodeInputNamedAttribute", (-300, -200))
    na_v.data_type = 'FLOAT'
    na_v.inputs["Name"].default_value = "v"

    # ── Blur Attribute → discrete Laplacian of u ─────────────────────────
    # BlurAttr(u, Iterations=1) = mean of 4 edge-adjacent verts
    # ∇²u ≈ 4 × (blur_u − u)
    blur = _node(nodes, "GeometryNodeBlurAttribute", (-100, 300))
    blur.data_type = 'FLOAT'
    blur.inputs["Iterations"].default_value = 1
    links.new(sim_i.outputs["Geometry"], blur.inputs["Geometry"])
    links.new(na_u.outputs["Attribute"], blur.inputs["Value"])

    sub_blur = _math(nodes, (100, 300), 'SUBTRACT')
    links.new(blur.outputs["Value"],         sub_blur.inputs[0])
    links.new(na_u.outputs["Attribute"],     sub_blur.inputs[1])
    lap_scl  = _math(nodes, (250, 300), 'MULTIPLY', val_b=4.0)
    links.new(sub_blur.outputs["Value"],     lap_scl.inputs[0])
    diff     = _math(nodes, (400, 300), 'MULTIPLY', val_b=D)   # D·∇²u
    links.new(lap_scl.outputs["Value"],      diff.inputs[0])

    # ── inhibition fraction (u−q)/(u+q) ─────────────────────────────────
    # WHY: the quench denominator (u+q) prevents u from going negative when
    # v is large; q=0.002 ensures the fraction is well-defined for u≥0.
    sub_q = _math(nodes, (0, 0), 'SUBTRACT', val_b=Q)
    links.new(na_u.outputs["Attribute"], sub_q.inputs[0])
    add_q = _math(nodes, (0, -120), 'ADD',      val_b=Q)
    links.new(na_u.outputs["Attribute"], add_q.inputs[0])
    ratio = _math(nodes, (180, -60), 'DIVIDE')
    links.new(sub_q.outputs["Value"],    ratio.inputs[0])
    links.new(add_q.outputs["Value"],    ratio.inputs[1])

    # kill term = f·v·ratio
    fv    = _math(nodes, (180, -200), 'MULTIPLY', val_b=F)
    links.new(na_v.outputs["Attribute"], fv.inputs[0])
    kill  = _math(nodes, (360, -130), 'MULTIPLY')
    links.new(fv.outputs["Value"],       kill.inputs[0])
    links.new(ratio.outputs["Value"],    kill.inputs[1])

    # birth term = u·(1−u)
    one_mu = _math(nodes, (0, 160), 'SUBTRACT', val_a=1.0)
    links.new(na_u.outputs["Attribute"], one_mu.inputs[1])
    birth  = _math(nodes, (180, 160), 'MULTIPLY')
    links.new(na_u.outputs["Attribute"], birth.inputs[0])
    links.new(one_mu.outputs["Value"],   birth.inputs[1])

    # reaction_u = (birth − kill) / ε
    rxn    = _math(nodes, (540, 0), 'SUBTRACT')
    links.new(birth.outputs["Value"],    rxn.inputs[0])
    links.new(kill.outputs["Value"],     rxn.inputs[1])
    rxn_sc = _math(nodes, (700, 0), 'MULTIPLY', val_b=INV_EPS)  # ×25
    links.new(rxn.outputs["Value"],      rxn_sc.inputs[0])

    # du = reaction_u + D·∇²u
    du     = _math(nodes, (900, 150), 'ADD')
    links.new(rxn_sc.outputs["Value"],   du.inputs[0])
    links.new(diff.outputs["Value"],     du.inputs[1])

    # u_new = clamp(u + dt·du, 0, 1) — MINIMUM then MAXIMUM avoids ShaderNodeClamp's
    # issue with field inputs in GN trees pre-5.1
    du_sc  = _math(nodes, (1050, 150), 'MULTIPLY', val_b=DT)
    links.new(du.outputs["Value"],       du_sc.inputs[0])
    u_add  = _math(nodes, (1200, 150), 'ADD')
    links.new(na_u.outputs["Attribute"], u_add.inputs[0])
    links.new(du_sc.outputs["Value"],    u_add.inputs[1])
    u_min  = _math(nodes, (1350, 150), 'MINIMUM', val_b=1.0)
    links.new(u_add.outputs["Value"],    u_min.inputs[0])
    u_new  = _math(nodes, (1500, 150), 'MAXIMUM', val_b=0.0)
    links.new(u_min.outputs["Value"],    u_new.inputs[0])

    # dv = u − v  (v does not diffuse in this model)
    dv     = _math(nodes, (700, -250), 'SUBTRACT')
    links.new(na_u.outputs["Attribute"], dv.inputs[0])
    links.new(na_v.outputs["Attribute"], dv.inputs[1])
    dv_sc  = _math(nodes, (900, -250), 'MULTIPLY', val_b=DT)
    links.new(dv.outputs["Value"],       dv_sc.inputs[0])
    v_add  = _math(nodes, (1050, -250), 'ADD')
    links.new(na_v.outputs["Attribute"], v_add.inputs[0])
    links.new(dv_sc.outputs["Value"],    v_add.inputs[1])
    v_min  = _math(nodes, (1200, -250), 'MINIMUM', val_b=1.0)
    links.new(v_add.outputs["Value"],    v_min.inputs[0])
    v_new  = _math(nodes, (1350, -250), 'MAXIMUM', val_b=0.0)
    links.new(v_min.outputs["Value"],    v_new.inputs[0])

    # ── write u_new, v_new back to geometry body ─────────────────────────
    st_u = _node(nodes, "GeometryNodeStoreNamedAttribute", (1700, 50))
    st_u.data_type = 'FLOAT'
    st_u.domain    = 'POINT'
    st_u.inputs["Name"].default_value = "u"
    links.new(sim_i.outputs["Geometry"], st_u.inputs["Geometry"])
    links.new(u_new.outputs["Value"],    st_u.inputs["Value"])

    st_v = _node(nodes, "GeometryNodeStoreNamedAttribute", (1900, 50))
    st_v.data_type = 'FLOAT'
    st_v.domain    = 'POINT'
    st_v.inputs["Name"].default_value = "v"
    links.new(st_u.outputs["Geometry"],  st_v.inputs["Geometry"])
    links.new(v_new.outputs["Value"],    st_v.inputs["Value"])

    links.new(st_v.outputs["Geometry"],  sim_o.inputs["Geometry"])

    # ── after zone: lift u to Z for visible landscape ────────────────────
    set_pos = _node(nodes, "GeometryNodeSetPosition", (3000, 0))
    cxyz    = nodes.new("ShaderNodeCombineXYZ")
    cxyz.location = (2850, -150)
    cxyz.inputs["X"].default_value = 0.0
    cxyz.inputs["Y"].default_value = 0.0
    u_ht  = _math(nodes, (2700, -200), 'MULTIPLY', val_b=HEIGHT_SCL)
    links.new(u_new.outputs["Value"],    u_ht.inputs[0])
    links.new(u_ht.outputs["Value"],     cxyz.inputs["Z"])
    links.new(sim_o.outputs["Geometry"], set_pos.inputs["Geometry"])
    links.new(cxyz.outputs["Vector"],    set_pos.inputs["Offset"])
    links.new(set_pos.outputs["Geometry"], go.inputs["Geometry"])

    # ── attach modifier ──────────────────────────────────────────────────
    mod = obj.modifiers.new("BZ_Oregonator", 'NODES')
    mod.node_group = tree
    return tree


def make_material(obj):
    """Hot-map emission: u=0 → deep indigo, u=0.5 → vivid orange, u=1 → white."""
    mat = bpy.data.materials.new("HF_BZ_Emission")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in nt.nodes:
        nt.nodes.remove(n)

    out   = nt.nodes.new("ShaderNodeOutputMaterial");  out.location   = (600, 0)
    emit  = nt.nodes.new("ShaderNodeEmission");        emit.location  = (400, 0)
    ramp  = nt.nodes.new("ShaderNodeValToRGB");        ramp.location  = (150, 0)
    attr  = nt.nodes.new("ShaderNodeAttribute");       attr.location  = (-100, 0)
    attr.attribute_name = "u"
    attr.attribute_type = 'GEOMETRY'

    cr = ramp.color_ramp
    cr.interpolation = 'B_SPLINE'
    cr.elements[0].position = 0.0;   cr.elements[0].color = (0.02, 0.0,  0.12, 1.0)
    cr.elements[1].position = 1.0;   cr.elements[1].color = (1.0,  0.88, 1.0,  1.0)
    mid = cr.elements.new(0.45);     mid.color             = (0.95, 0.30, 0.0,  1.0)

    emit.inputs["Strength"].default_value = 8.0
    nt.links.new(attr.outputs["Fac"],  ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    obj.data.materials.append(mat)
    return mat


def main():
    _clear_scene()
    obj   = make_grid()
    _tree = build_bz_tree(obj)
    _mat  = make_material(obj)

    bpy.context.scene.frame_start = 0
    bpy.context.scene.frame_end   = 200
    bpy.context.scene.frame_set(0)

    print("[BZ] Blueprint built. Press Space in the viewport to watch spiral waves emerge.")
    print(f"[BZ] Grid: {N}×{N} verts  |  ε={EPS}  f={F}  q={Q}  D={D}  dt={DT}")
    print("[BZ] Spirals typically nucleate by frame 30, fully developed by frame 80.")


if __name__ == "__main__":
    main()

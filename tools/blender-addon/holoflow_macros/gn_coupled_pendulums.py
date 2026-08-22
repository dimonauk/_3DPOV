"""
holoflow_macros/gn_coupled_pendulums.py
Reusable helper: build a coupled-pendulums Simulation Zone on any point cloud.

Usage (in Blender scripting console):
    import importlib, sys
    sys.path.insert(0, '/path/to/tools/blender-addon')
    from holoflow_macros.gn_coupled_pendulums import build_coupled_pendulums
    build_coupled_pendulums(bpy.context.active_object, n=20, k_couple=5.0)

Licence: CC0  ·  Blender 5.1
"""

import bpy
import math

# Defaults match the tutorial blueprint
_DEF = dict(
    n=20, L=0.25, D=0.30, g=9.81, k_couple=5.0,
    damping=0.012, dt=1.0/24.0, drive_amp=0.15, bob_radius=0.04,
)


def _math(tree, op, loc, label=""):
    nd = tree.nodes.new("ShaderNodeMath")
    nd.operation, nd.location, nd.label, nd.use_clamp = op, loc, label, False
    return nd


def _lk(tree, a, ao, b, bi):
    tree.links.new(a.outputs[ao], b.inputs[bi])


def build_coupled_pendulums(
    obj: bpy.types.Object,
    *,
    n: int = _DEF["n"],
    L: float = _DEF["L"],
    D: float = _DEF["D"],
    g: float = _DEF["g"],
    k_couple: float = _DEF["k_couple"],
    damping: float = _DEF["damping"],
    dt: float = _DEF["dt"],
    drive_amp: float = _DEF["drive_amp"],
    bob_radius: float = _DEF["bob_radius"],
) -> bpy.types.NodesModifier:
    """
    Attach a coupled-pendulums GN Simulation Zone to *obj*.

    The object must already have FLOAT named attributes 'theta' and 'omega'
    on its POINT domain (N points = N pendulums).

    Returns the added NODES modifier.
    """
    omega0_sq  = g / L
    drive_freq = math.sqrt(omega0_sq) / (2.0 * math.pi)

    name = "CoupledPendulumsGN"
    tree = bpy.data.node_groups.new(name, "GeometryNodeTree")
    nodes, links = tree.nodes, tree.links

    tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    gi = nodes.new("NodeGroupInput");  gi.location = (-800, 0)
    go = nodes.new("NodeGroupOutput"); go.location = (1200, 0)
    si = nodes.new("GeometryNodeSimulationInput");  si.location = (-500, 0)
    so = nodes.new("GeometryNodeSimulationOutput"); so.location = (1000, 0)
    si.pair_with_output(so)
    _lk(tree, gi, "Geometry", si, "Geometry")

    def na(attr_name, loc):
        nd = nodes.new("GeometryNodeInputNamedAttribute")
        nd.data_type, nd.location = "FLOAT", loc
        nd.inputs["Name"].default_value = attr_name
        return nd

    na_th = na("theta", (-300, 100))
    na_om = na("omega", (-300,   0))
    idx   = nodes.new("GeometryNodeInputIndex"); idx.location = (-500, -120)

    # neighbour indices
    sub1 = _math(tree, "SUBTRACT", (-300, -200), "i-1"); sub1.inputs[1].default_value = 1.0
    add1 = _math(tree, "ADD",      (-300, -320), "i+1"); add1.inputs[1].default_value = 1.0
    _lk(tree, idx, "Index", sub1, 0); _lk(tree, idx, "Index", add1, 0)

    def samp(loc, idx_src):
        nd = nodes.new("GeometryNodeSampleIndex")
        nd.data_type, nd.domain, nd.location = "FLOAT", "POINT", loc
        _lk(tree, si, "Geometry", nd, "Geometry")
        _lk(tree, na_th, "Attribute", nd, "Value")
        _lk(tree, idx_src, 0, nd, "Index")
        return nd

    sp = samp((-100, -200), sub1)
    sn = samp((-100, -320), add1)

    # coupling: K·(prev + next − 2θ)
    pns = _math(tree, "ADD",      (100, -240), "p+n"); _lk(tree, sp, "Value", pns, 0); _lk(tree, sn, "Value", pns, 1)
    t2  = _math(tree, "MULTIPLY", (100, -360), "2θ");  _lk(tree, na_th, "Attribute", t2, 0); t2.inputs[1].default_value = 2.0
    lap = _math(tree, "SUBTRACT", (260, -300), "Δ");   _lk(tree, pns, 0, lap, 0); _lk(tree, t2, 0, lap, 1)
    cpl = _math(tree, "MULTIPLY", (400, -300), "Kθ");  _lk(tree, lap, 0, cpl, 0); cpl.inputs[1].default_value = k_couple

    # Mathieu driving
    st = nodes.new("GeometryNodeInputSceneTime"); st.location = (-500, 300)
    sc = _math(tree, "MULTIPLY", (-300, 300), "2πf·t"); sc.inputs[1].default_value = 2.0*math.pi*drive_freq; _lk(tree, st, "Seconds", sc, 0)
    si2 = _math(tree, "SINE", (-100, 300), "sin"); _lk(tree, sc, 0, si2, 0)
    em  = _math(tree, "MULTIPLY", (100, 300), "2ε·s"); em.inputs[1].default_value = 2.0*drive_amp; _lk(tree, si2, 0, em, 0)
    om2 = _math(tree, "MULTIPLY", (260, 300), "Ω·ε"); om2.inputs[1].default_value = omega0_sq; _lk(tree, em, 0, om2, 0)
    omt = _math(tree, "ADD",      (400, 300), "Ω²(t)"); omt.inputs[1].default_value = omega0_sq; _lk(tree, om2, 0, omt, 0)

    # restoring: −Ω²(t)·sin(θ)
    sth = _math(tree, "SINE",     (100, 120), "sinθ"); _lk(tree, na_th, "Attribute", sth, 0)
    gr  = _math(tree, "MULTIPLY", (260, 200), "Ω·s");  _lk(tree, omt, 0, gr, 0); _lk(tree, sth, 0, gr, 1)
    gf  = _math(tree, "SUBTRACT", (400, 200), "−g"); gf.inputs[0].default_value = 0.0; _lk(tree, gr, 0, gf, 1)
    df  = _math(tree, "MULTIPLY", (260,   0), "−γω"); df.inputs[1].default_value = -damping; _lk(tree, na_om, "Attribute", df, 0)

    a1  = _math(tree, "ADD", (560, 250), "α1"); _lk(tree, gf, 0, a1, 0); _lk(tree, cpl, 0, a1, 1)
    al  = _math(tree, "ADD", (560, 100), "α");  _lk(tree, a1, 0, al, 0); _lk(tree, df, 0, al, 1)

    adt = _math(tree, "MULTIPLY", (700, 100), "α·dt"); adt.inputs[1].default_value = dt; _lk(tree, al, 0, adt, 0)
    own = _math(tree, "ADD",      (700,   0), "ω+1"); _lk(tree, na_om, "Attribute", own, 0); _lk(tree, adt, 0, own, 1)
    odt = _math(tree, "MULTIPLY", (700,-120), "ω·dt"); odt.inputs[1].default_value = dt; _lk(tree, own, 0, odt, 0)
    thn = _math(tree, "ADD",      (700,-240), "θ+1"); _lk(tree, na_th, "Attribute", thn, 0); _lk(tree, odt, 0, thn, 1)

    def store(attr, val_src, geo_src, loc):
        nd = nodes.new("GeometryNodeStoreNamedAttribute")
        nd.data_type, nd.domain, nd.location = "FLOAT", "POINT", loc
        nd.inputs["Name"].default_value = attr
        _lk(tree, geo_src, "Geometry" if hasattr(geo_src.outputs.get("Geometry", None), "name") else 0, nd, "Geometry")
        _lk(tree, val_src, 0, nd, "Value")
        return nd

    stt = nodes.new("GeometryNodeStoreNamedAttribute")
    stt.data_type, stt.domain, stt.location = "FLOAT", "POINT", (820, 0)
    stt.inputs["Name"].default_value = "theta"
    _lk(tree, si, "Geometry", stt, "Geometry"); _lk(tree, thn, 0, stt, "Value")

    sto = nodes.new("GeometryNodeStoreNamedAttribute")
    sto.data_type, sto.domain, sto.location = "FLOAT", "POINT", (820, -120)
    sto.inputs["Name"].default_value = "omega"
    _lk(tree, stt, "Geometry", sto, "Geometry"); _lk(tree, own, 0, sto, "Value")

    # bob position
    ixf = _math(tree, "MULTIPLY", (700, -400), "i·D"); ixf.inputs[1].default_value = D; _lk(tree, idx, "Index", ixf, 0)
    sn2 = _math(tree, "SINE",     (700, -520), "sinθn"); _lk(tree, thn, 0, sn2, 0)
    cn2 = _math(tree, "COSINE",   (700, -600), "cosθn"); _lk(tree, thn, 0, cn2, 0)
    bxo = _math(tree, "MULTIPLY", (820, -520), "L·s"); bxo.inputs[1].default_value = L; _lk(tree, sn2, 0, bxo, 0)
    bzo = _math(tree, "MULTIPLY", (820, -600), "-L·c"); bzo.inputs[1].default_value = -L; _lk(tree, cn2, 0, bzo, 0)
    bx  = _math(tree, "ADD",      (940, -520), "bx"); _lk(tree, ixf, 0, bx, 0); _lk(tree, bxo, 0, bx, 1)
    cxy = nodes.new("ShaderNodeCombineXYZ"); cxy.location = (960, -560); cxy.inputs["Y"].default_value = 0.0
    _lk(tree, bx, 0, cxy, "X"); _lk(tree, bzo, 0, cxy, "Z")

    sp2 = nodes.new("GeometryNodeSetPosition"); sp2.location = (940, -80)
    _lk(tree, sto, "Geometry", sp2, "Geometry"); _lk(tree, cxy, "Vector", sp2, "Position")

    sph = nodes.new("GeometryNodeMeshIcoSphere"); sph.location = (800, -720)
    sph.inputs["Radius"].default_value = bob_radius; sph.inputs["Subdivisions"].default_value = 2
    ion = nodes.new("GeometryNodeInstanceOnPoints"); ion.location = (1080, -200)
    _lk(tree, sp2, "Geometry", ion, "Points"); _lk(tree, sph, "Mesh", ion, "Instance")
    _lk(tree, ion, "Instances", so, "Geometry"); _lk(tree, so, "Geometry", go, "Geometry")

    mod = obj.modifiers.new(name, "NODES")
    mod.node_group = tree
    return mod

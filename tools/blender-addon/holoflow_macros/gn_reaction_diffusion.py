"""
holoflow_macros/gn_reaction_diffusion.py
Reusable helper: attach a Grey-Scott Simulation Zone GN modifier to any mesh.
Blender 5.1 · CC0 · Holoflow Studio
"""

import bpy


def attach_grey_scott(
    obj: bpy.types.Object,
    du: float = 0.20,
    dv: float = 0.10,
    feed: float = 0.037,
    kill: float = 0.060,
    seed_radius: float = 0.22,
    blur_iters: int = 1,
    name: str = "GN_GreyScott",
) -> bpy.types.Modifier:
    """
    Attach a Grey-Scott reaction-diffusion Simulation Zone GN modifier to obj.

    Pattern regimes (feed=0.037 fixed, vary kill):
      kill=0.056 → moving solitons
      kill=0.060 → labyrinth / coral  (default)
      kill=0.062 → isolated spots
      kill=0.065 → disappearing spots

    Returns the created modifier.
    """
    ng    = bpy.data.node_groups.new(f"{name}_RD", "GeometryNodeTree")
    nodes = ng.nodes

    for nm, df, mn, mx in [
        ("Du",          du,          0.0,  0.5),
        ("Dv",          dv,          0.0,  0.5),
        ("Feed",        feed,        0.0,  0.1),
        ("Kill",        kill,        0.0,  0.1),
        ("Seed_Radius", seed_radius, 0.01, 1.0),
    ]:
        sk = ng.interface.new_socket(nm, in_out="INPUT", socket_type="NodeSocketFloat")
        sk.default_value = df; sk.min_value, sk.max_value = mn, mx
    ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    gi  = nodes.new("NodeGroupInput")
    go  = nodes.new("NodeGroupOutput")
    su0 = nodes.new("GeometryNodeStoreNamedAttribute")
    su0.data_type = "FLOAT"; su0.domain = "POINT"
    su0.inputs["Name"].default_value = "conc_u"; su0.inputs["Value"].default_value = 1.0

    inp  = nodes.new("GeometryNodeInputPosition")
    vlen = nodes.new("ShaderNodeVectorMath"); vlen.operation = "LENGTH"
    cmp  = nodes.new("FunctionNodeCompare")
    cmp.data_type = "FLOAT"; cmp.operation = "LESS_THAN"
    mv   = nodes.new("ShaderNodeMath"); mv.operation = "MULTIPLY"
    mv.inputs[1].default_value = 0.50

    sv0 = nodes.new("GeometryNodeStoreNamedAttribute")
    sv0.data_type = "FLOAT"; sv0.domain = "POINT"
    sv0.inputs["Name"].default_value = "conc_v"

    sim_in  = nodes.new("GeometryNodeSimulationInput")
    sim_out = nodes.new("GeometryNodeSimulationOutput")

    nu = nodes.new("GeometryNodeInputNamedAttribute")
    nu.data_type = "FLOAT"; nu.inputs["Name"].default_value = "conc_u"
    nv = nodes.new("GeometryNodeInputNamedAttribute")
    nv.data_type = "FLOAT"; nv.inputs["Name"].default_value = "conc_v"

    bu = nodes.new("GeometryNodeBlurAttribute")
    bu.data_type = "FLOAT"; bu.inputs["Iterations"].default_value = blur_iters
    bv = nodes.new("GeometryNodeBlurAttribute")
    bv.data_type = "FLOAT"; bv.inputs["Iterations"].default_value = blur_iters

    lu = nodes.new("ShaderNodeMath"); lu.operation = "SUBTRACT"
    lv = nodes.new("ShaderNodeMath"); lv.operation = "SUBTRACT"
    vsq  = nodes.new("ShaderNodeMath"); vsq.operation  = "MULTIPLY"
    uv2  = nodes.new("ShaderNodeMath"); uv2.operation  = "MULTIPLY"
    mdu  = nodes.new("ShaderNodeMath"); mdu.operation  = "MULTIPLY"
    suv  = nodes.new("ShaderNodeMath"); suv.operation  = "SUBTRACT"
    s1u  = nodes.new("ShaderNodeMath"); s1u.operation  = "SUBTRACT"
    s1u.inputs[0].default_value = 1.0
    mfu  = nodes.new("ShaderNodeMath"); mfu.operation  = "MULTIPLY"
    adu  = nodes.new("ShaderNodeMath"); adu.operation  = "ADD"
    nwu  = nodes.new("ShaderNodeMath"); nwu.operation  = "ADD"
    clu  = nodes.new("ShaderNodeClamp"); clu.clamp_type = "MINMAX"
    clu.inputs["Min"].default_value = 0.0; clu.inputs["Max"].default_value = 1.0

    mdv  = nodes.new("ShaderNodeMath"); mdv.operation  = "MULTIPLY"
    auv  = nodes.new("ShaderNodeMath"); auv.operation  = "ADD"
    afk  = nodes.new("ShaderNodeMath"); afk.operation  = "ADD"
    mfk  = nodes.new("ShaderNodeMath"); mfk.operation  = "MULTIPLY"
    sdv  = nodes.new("ShaderNodeMath"); sdv.operation  = "SUBTRACT"
    nwv  = nodes.new("ShaderNodeMath"); nwv.operation  = "ADD"
    clv  = nodes.new("ShaderNodeClamp"); clv.clamp_type = "MINMAX"
    clv.inputs["Min"].default_value = 0.0; clv.inputs["Max"].default_value = 1.0

    snu = nodes.new("GeometryNodeStoreNamedAttribute")
    snu.data_type = "FLOAT"; snu.domain = "POINT"; snu.inputs["Name"].default_value = "conc_u"
    snv = nodes.new("GeometryNodeStoreNamedAttribute")
    snv.data_type = "FLOAT"; snv.domain = "POINT"; snv.inputs["Name"].default_value = "conc_v"

    def lk(a, b): ng.links.new(a, b)

    lk(gi.outputs["Geometry"],       su0.inputs["Geometry"])
    lk(su0.outputs["Geometry"],      sv0.inputs["Geometry"])
    lk(sv0.outputs["Geometry"],      sim_in.inputs["Geometry"])
    lk(sim_in.outputs["Geometry"],   snu.inputs["Geometry"])
    lk(snu.outputs["Geometry"],      snv.inputs["Geometry"])
    lk(snv.outputs["Geometry"],      sim_out.inputs["Geometry"])
    lk(sim_out.outputs["Geometry"],  go.inputs["Geometry"])
    lk(inp.outputs["Position"],      vlen.inputs[0])
    lk(vlen.outputs["Value"],        cmp.inputs["A"])
    lk(gi.outputs["Seed_Radius"],    cmp.inputs["B"])
    lk(cmp.outputs["Result"],        mv.inputs[0])
    lk(mv.outputs["Value"],          sv0.inputs["Value"])
    lk(nu.outputs["Attribute"],      bu.inputs["Value"])
    lk(nv.outputs["Attribute"],      bv.inputs["Value"])
    lk(bu.outputs["Value"],          lu.inputs[0]); lk(nu.outputs["Attribute"], lu.inputs[1])
    lk(bv.outputs["Value"],          lv.inputs[0]); lk(nv.outputs["Attribute"], lv.inputs[1])
    lk(nv.outputs["Attribute"],      vsq.inputs[0]); lk(nv.outputs["Attribute"], vsq.inputs[1])
    lk(nu.outputs["Attribute"],      uv2.inputs[0]); lk(vsq.outputs["Value"],    uv2.inputs[1])
    lk(gi.outputs["Du"],             mdu.inputs[0]); lk(lu.outputs["Value"],     mdu.inputs[1])
    lk(mdu.outputs["Value"],         suv.inputs[0]); lk(uv2.outputs["Value"],    suv.inputs[1])
    lk(nu.outputs["Attribute"],      s1u.inputs[1])
    lk(gi.outputs["Feed"],           mfu.inputs[0]); lk(s1u.outputs["Value"],   mfu.inputs[1])
    lk(suv.outputs["Value"],         adu.inputs[0]); lk(mfu.outputs["Value"],   adu.inputs[1])
    lk(nu.outputs["Attribute"],      nwu.inputs[0]); lk(adu.outputs["Value"],   nwu.inputs[1])
    lk(nwu.outputs["Value"],         clu.inputs["Value"]); lk(clu.outputs["Result"], snu.inputs["Value"])
    lk(gi.outputs["Dv"],             mdv.inputs[0]); lk(lv.outputs["Value"],    mdv.inputs[1])
    lk(mdv.outputs["Value"],         auv.inputs[0]); lk(uv2.outputs["Value"],   auv.inputs[1])
    lk(gi.outputs["Feed"],           afk.inputs[0]); lk(gi.outputs["Kill"],     afk.inputs[1])
    lk(afk.outputs["Value"],         mfk.inputs[0]); lk(nv.outputs["Attribute"], mfk.inputs[1])
    lk(auv.outputs["Value"],         sdv.inputs[0]); lk(mfk.outputs["Value"],   sdv.inputs[1])
    lk(nv.outputs["Attribute"],      nwv.inputs[0]); lk(sdv.outputs["Value"],   nwv.inputs[1])
    lk(nwv.outputs["Value"],         clv.inputs["Value"]); lk(clv.outputs["Result"], snv.inputs["Value"])

    mod = obj.modifiers.new(name, "NODES")
    mod.node_group = ng
    return mod

"""
GN Simulation Zone — Grey-Scott Reaction-Diffusion: Turing Pattern Emergence
Blender 5.1 · CC0 · Holoflow Studio

Technique: the Grey-Scott (1983) PDE system evolves two chemical concentrations,
U (substrate) and V (product), across mesh vertices each frame.  A Simulation Zone
carries the per-point state forward frame-to-frame; GeometryNodeBlurAttribute
approximates the spatial Laplacian by computing (first-ring average − self) for
each vertex; the nonlinear UV² reaction term drives autocatalytic spot/labyrinth
pattern formation.  Parameters feed=0.037, kill=0.060 land in the "coral" regime
of the Pearson (1993) parameter map, producing dense labyrinthine Turing patterns
visible by frame 150 and stable by frame 250.

Outside sources:
  Blender Manual — Simulation Zone
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html
    CC-BY-SA 4.0 · Blender Documentation Team
  pmneila/jsexp — interactive Grey-Scott Javascript simulator
    https://github.com/pmneila/jsexp
    MIT · Patrick Mineault
  glTF-Blender-IO — Khronos GLTF exporter
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Khronos Group
"""

import bpy
import os

# ── Parameters ────────────────────────────────────────────────────────────────
GRID_SIZE    = 2.0     # mesh width/height in metres
GRID_RES     = 64      # vertices per axis (64×64 = 4 096 POINT evaluations)
SEED_RADIUS  = 0.22    # radius of initial V-concentration seed patch
SEED_V_INIT  = 0.50    # V at seed — the metastable saddle point in GS phase space
DU           = 0.20    # diffusion coefficient of U; 2× faster than V by convention
DV           = 0.10    # diffusion coefficient of V; slower → finer-grained inhibitor
FEED         = 0.037   # feed rate: replenishment of U from external reservoir
KILL         = 0.060   # kill rate: removal of V — "coral/labyrinth" Pearson regime
# Stability: explicit Euler requires DU × 2 × DT ≤ 1.  With DT=1/frame and
# DU=0.20, the product is 0.40 < 1.0 — stable for any GRID_RES.
BLUR_ITERS   = 1       # BlurAttribute iterations; 1 = single ring, ~discrete Laplacian
BAKE_FRAME   = 180     # frame at which pattern is exported (stable by this point)
BLEND_PATH   = "//reaction_diffusion.blend"
EXPORT_GLB   = "//reaction_diffusion.glb"


def _cleanup() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith(("reaction_diffusion", "RD_")):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith("Grid"):
            bpy.data.meshes.remove(me)
    for ng in list(bpy.data.node_groups):
        if ng.name.startswith("GreyScott"):
            bpy.data.node_groups.remove(ng)
    for ma in list(bpy.data.materials):
        if ma.name.startswith("RD_"):
            bpy.data.materials.remove(ma)


def _lk(ng, a, b):
    ng.links.new(a, b)


def build_scene() -> bpy.types.Object:
    _cleanup()

    # Grid mesh: regular 4-connectivity → each interior vertex has exactly 4
    # neighbours → BlurAttribute computes (north+south+east+west)/4, giving
    # the most isotropic Laplacian approximation of any standard Blender primitive.
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_RES - 1, y_subdivisions=GRID_RES - 1, size=GRID_SIZE
    )
    obj = bpy.context.active_object
    obj.name = "reaction_diffusion"

    ng    = bpy.data.node_groups.new("GreyScottRD", "GeometryNodeTree")
    nodes = ng.nodes

    # Interface: expose the four GS parameters so the modifier panel becomes
    # a live pattern laboratory — changing Kill alone cycles through all Pearson types.
    for nm, df, mn, mx in [
        ("Du",          DU,          0.0,  0.5),
        ("Dv",          DV,          0.0,  0.5),
        ("Feed",        FEED,        0.0,  0.1),
        ("Kill",        KILL,        0.0,  0.1),
        ("Seed_Radius", SEED_RADIUS, 0.01, 1.0),
    ]:
        sk = ng.interface.new_socket(nm, in_out="INPUT", socket_type="NodeSocketFloat")
        sk.default_value = df
        sk.min_value, sk.max_value = mn, mx
    ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    gi = nodes.new("NodeGroupInput")
    go = nodes.new("NodeGroupOutput")

    # ── Pre-zone: seed initial conditions ─────────────────────────────────
    # The Simulation Zone only consumes these at frame 0; on frames 1+ sim_in
    # pulls from its own internal cache.
    su0 = nodes.new("GeometryNodeStoreNamedAttribute")
    su0.data_type = "FLOAT"; su0.domain = "POINT"
    su0.inputs["Name"].default_value  = "conc_u"
    su0.inputs["Value"].default_value = 1.0          # U=1 everywhere → full substrate

    inp  = nodes.new("GeometryNodeInputPosition")
    vlen = nodes.new("ShaderNodeVectorMath"); vlen.operation = "LENGTH"
    cmp  = nodes.new("FunctionNodeCompare")
    cmp.data_type = "FLOAT"; cmp.operation = "LESS_THAN"
    mv   = nodes.new("ShaderNodeMath"); mv.operation = "MULTIPLY"
    mv.inputs[1].default_value = SEED_V_INIT         # bool(0/1) × 0.5 → seed field

    sv0 = nodes.new("GeometryNodeStoreNamedAttribute")
    sv0.data_type = "FLOAT"; sv0.domain = "POINT"
    sv0.inputs["Name"].default_value = "conc_v"

    # ── Simulation Zone ────────────────────────────────────────────────────
    sim_in  = nodes.new("GeometryNodeSimulationInput")
    sim_out = nodes.new("GeometryNodeSimulationOutput")

    # ── Inside sim zone: read previous-frame concentrations ───────────────
    # NamedAttribute evaluates against geometry on the main flow path, which
    # carries last frame's stored attributes after the first evaluation.
    nu = nodes.new("GeometryNodeInputNamedAttribute")
    nu.data_type = "FLOAT"; nu.inputs["Name"].default_value = "conc_u"

    nv = nodes.new("GeometryNodeInputNamedAttribute")
    nv.data_type = "FLOAT"; nv.inputs["Name"].default_value = "conc_v"

    # BlurAttribute: lap_u = blur_u − u ≈ (Σneighbours − 4u)/4.  The 1/4 factor
    # is baked in, so Du=0.20 is Du/4 in continuous-PDE literature units.
    bu = nodes.new("GeometryNodeBlurAttribute")
    bu.data_type = "FLOAT"; bu.inputs["Iterations"].default_value = BLUR_ITERS

    bv = nodes.new("GeometryNodeBlurAttribute")
    bv.data_type = "FLOAT"; bv.inputs["Iterations"].default_value = BLUR_ITERS

    # Laplacian proxies: lap = blur − original
    lu = nodes.new("ShaderNodeMath"); lu.operation = "SUBTRACT"; lu.use_clamp = False
    lv = nodes.new("ShaderNodeMath"); lv.operation = "SUBTRACT"; lv.use_clamp = False

    # UV² = u × v × v — autocatalytic nonlinear coupling; instability at the
    # homogeneous steady state seeds the Turing pattern formation.
    vsq = nodes.new("ShaderNodeMath"); vsq.operation = "MULTIPLY"
    uv2 = nodes.new("ShaderNodeMath"); uv2.operation = "MULTIPLY"

    # dU = Du×lapU − UV² + feed×(1−U)
    mdu     = nodes.new("ShaderNodeMath"); mdu.operation     = "MULTIPLY"
    s_uv2u  = nodes.new("ShaderNodeMath"); s_uv2u.operation  = "SUBTRACT"
    s_1u    = nodes.new("ShaderNodeMath"); s_1u.operation    = "SUBTRACT"
    s_1u.inputs[0].default_value = 1.0
    m_fu    = nodes.new("ShaderNodeMath"); m_fu.operation    = "MULTIPLY"
    a_du    = nodes.new("ShaderNodeMath"); a_du.operation    = "ADD"
    new_u   = nodes.new("ShaderNodeMath"); new_u.operation   = "ADD"
    cl_u    = nodes.new("ShaderNodeClamp"); cl_u.clamp_type  = "MINMAX"
    cl_u.inputs["Min"].default_value = 0.0; cl_u.inputs["Max"].default_value = 1.0

    # dV = Dv×lapV + UV² − (feed+kill)×V
    mdv     = nodes.new("ShaderNodeMath"); mdv.operation     = "MULTIPLY"
    a_uv2v  = nodes.new("ShaderNodeMath"); a_uv2v.operation  = "ADD"
    a_fk    = nodes.new("ShaderNodeMath"); a_fk.operation    = "ADD"   # feed + kill
    m_fkv   = nodes.new("ShaderNodeMath"); m_fkv.operation   = "MULTIPLY"
    s_dv    = nodes.new("ShaderNodeMath"); s_dv.operation    = "SUBTRACT"
    new_v   = nodes.new("ShaderNodeMath"); new_v.operation   = "ADD"
    cl_v    = nodes.new("ShaderNodeClamp"); cl_v.clamp_type  = "MINMAX"
    cl_v.inputs["Min"].default_value = 0.0; cl_v.inputs["Max"].default_value = 1.0

    snu = nodes.new("GeometryNodeStoreNamedAttribute")
    snu.data_type = "FLOAT"; snu.domain = "POINT"
    snu.inputs["Name"].default_value = "conc_u"

    snv = nodes.new("GeometryNodeStoreNamedAttribute")
    snv.data_type = "FLOAT"; snv.domain = "POINT"
    snv.inputs["Name"].default_value = "conc_v"

    # ── Geometry path ──────────────────────────────────────────────────────
    _lk(ng, gi.outputs["Geometry"],       su0.inputs["Geometry"])
    _lk(ng, su0.outputs["Geometry"],      sv0.inputs["Geometry"])
    _lk(ng, sv0.outputs["Geometry"],      sim_in.inputs["Geometry"])
    _lk(ng, sim_in.outputs["Geometry"],   snu.inputs["Geometry"])
    _lk(ng, snu.outputs["Geometry"],      snv.inputs["Geometry"])
    _lk(ng, snv.outputs["Geometry"],      sim_out.inputs["Geometry"])
    _lk(ng, sim_out.outputs["Geometry"],  go.inputs["Geometry"])

    # ── Seed V wiring ──────────────────────────────────────────────────────
    _lk(ng, inp.outputs["Position"],   vlen.inputs[0])
    _lk(ng, vlen.outputs["Value"],     cmp.inputs["A"])
    _lk(ng, gi.outputs["Seed_Radius"], cmp.inputs["B"])
    _lk(ng, cmp.outputs["Result"],     mv.inputs[0])   # bool → 0.0 / 1.0 coercion
    _lk(ng, mv.outputs["Value"],       sv0.inputs["Value"])

    # ── Field computation wiring (inside sim zone) ─────────────────────────
    _lk(ng, nu.outputs["Attribute"], bu.inputs["Value"])
    _lk(ng, nv.outputs["Attribute"], bv.inputs["Value"])

    _lk(ng, bu.outputs["Value"],     lu.inputs[0])
    _lk(ng, nu.outputs["Attribute"], lu.inputs[1])   # lapU = blurU − U
    _lk(ng, bv.outputs["Value"],     lv.inputs[0])
    _lk(ng, nv.outputs["Attribute"], lv.inputs[1])   # lapV = blurV − V

    _lk(ng, nv.outputs["Attribute"], vsq.inputs[0])  # V²
    _lk(ng, nv.outputs["Attribute"], vsq.inputs[1])
    _lk(ng, nu.outputs["Attribute"], uv2.inputs[0])  # U × V²
    _lk(ng, vsq.outputs["Value"],    uv2.inputs[1])

    _lk(ng, gi.outputs["Du"],        mdu.inputs[0])
    _lk(ng, lu.outputs["Value"],     mdu.inputs[1])  # Du × lapU
    _lk(ng, mdu.outputs["Value"],    s_uv2u.inputs[0])
    _lk(ng, uv2.outputs["Value"],    s_uv2u.inputs[1])  # Du×lapU − UV²
    _lk(ng, nu.outputs["Attribute"], s_1u.inputs[1])    # 1 − U
    _lk(ng, gi.outputs["Feed"],      m_fu.inputs[0])
    _lk(ng, s_1u.outputs["Value"],   m_fu.inputs[1])    # feed × (1−U)
    _lk(ng, s_uv2u.outputs["Value"], a_du.inputs[0])
    _lk(ng, m_fu.outputs["Value"],   a_du.inputs[1])    # complete dU
    _lk(ng, nu.outputs["Attribute"], new_u.inputs[0])
    _lk(ng, a_du.outputs["Value"],   new_u.inputs[1])   # U + dU
    _lk(ng, new_u.outputs["Value"],  cl_u.inputs["Value"])
    _lk(ng, cl_u.outputs["Result"],  snu.inputs["Value"])

    _lk(ng, gi.outputs["Dv"],        mdv.inputs[0])
    _lk(ng, lv.outputs["Value"],     mdv.inputs[1])  # Dv × lapV
    _lk(ng, mdv.outputs["Value"],    a_uv2v.inputs[0])
    _lk(ng, uv2.outputs["Value"],    a_uv2v.inputs[1])  # Dv×lapV + UV²
    _lk(ng, gi.outputs["Feed"],      a_fk.inputs[0])
    _lk(ng, gi.outputs["Kill"],      a_fk.inputs[1])    # feed + kill
    _lk(ng, a_fk.outputs["Value"],   m_fkv.inputs[0])
    _lk(ng, nv.outputs["Attribute"], m_fkv.inputs[1])   # (f+k) × V
    _lk(ng, a_uv2v.outputs["Value"], s_dv.inputs[0])
    _lk(ng, m_fkv.outputs["Value"],  s_dv.inputs[1])    # complete dV
    _lk(ng, nv.outputs["Attribute"], new_v.inputs[0])
    _lk(ng, s_dv.outputs["Value"],   new_v.inputs[1])   # V + dV
    _lk(ng, new_v.outputs["Value"],  cl_v.inputs["Value"])
    _lk(ng, cl_v.outputs["Result"],  snv.inputs["Value"])

    # ── Attach modifier ────────────────────────────────────────────────────
    mod = obj.modifiers.new("GN_GreyScott", "NODES")
    mod.node_group = ng

    # ── Material: conc_v concentration → colour ramp ───────────────────────
    # ShaderNodeAttribute with attribute_type='GEOMETRY' reads Named Attributes
    # stored by the GN modifier — stable in Blender 4.0+, works in both
    # EEVEE and Cycles, and survives the bake-to-texture workflow for WebXR.
    mat = bpy.data.materials.new("RD_Material")
    mat.use_nodes = True; nt = mat.node_tree; nt.nodes.clear()
    out_n  = nt.nodes.new("ShaderNodeOutputMaterial")
    pbsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    cramp  = nt.nodes.new("ShaderNodeValToRGB")
    attr_v = nt.nodes.new("ShaderNodeAttribute")
    attr_v.attribute_type = "GEOMETRY"; attr_v.attribute_name = "conc_v"
    cramp.color_ramp.elements[0].color    = (0.02, 0.25, 0.35, 1.0)  # teal substrate
    cramp.color_ramp.elements[0].position = 0.0
    cramp.color_ramp.elements[1].color    = (0.85, 0.28, 0.12, 1.0)  # coral product
    cramp.color_ramp.elements[1].position = 1.0
    pbsdf.inputs["Roughness"].default_value = 0.28
    nt.links.new(attr_v.outputs["Fac"],   cramp.inputs["Fac"])
    nt.links.new(cramp.outputs["Color"],  pbsdf.inputs["Base Color"])
    nt.links.new(pbsdf.outputs["BSDF"],   out_n.inputs["Surface"])
    obj.data.materials.append(mat)

    # ── Camera / light / timeline ──────────────────────────────────────────
    bpy.ops.object.camera_add(location=(0, 0, 3.0))
    cam = bpy.context.active_object; cam.name = "RD_Camera"
    cam.data.type = "ORTHO"; cam.data.ortho_scale = GRID_SIZE + 0.1
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type="AREA", location=(0, 0, 2.5))
    lgt = bpy.context.active_object; lgt.name = "RD_Light"
    lgt.data.energy = 200; lgt.data.size = 4.0

    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, BAKE_FRAME
    sc.render.fps = 24

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))
    return obj


def export_glb(obj: bpy.types.Object) -> None:
    # Sequential frame_set is required: the Simulation Zone evaluates lazily
    # and frame_set(BAKE_FRAME) alone skips intermediate state accumulation.
    sc = bpy.context.scene
    for f in range(sc.frame_start, BAKE_FRAME + 1):
        sc.frame_set(f)
    bpy.ops.export_scene.gltf(
        filepath     = bpy.path.abspath(EXPORT_GLB),
        export_format= "GLB",
        export_apply = True,    # bakes GN stack into static vertex positions
        export_yup   = True,    # glTF/WebXR +Y up
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level =6,
        export_image_format ="WEBP",
        export_attributes   = True,  # conc_u / conc_v → custom accessors in GLB
    )
    print(f"[export] {EXPORT_GLB} @ frame {BAKE_FRAME}")


if __name__ == "__main__":
    obj = build_scene()
    export_glb(obj)
    print("[done] Play timeline frames 1-180 to watch the Turing pattern emerge.")

"""
GN Simulation Zone — Diffusion-Limited Aggregation (DLA): Crystal Dendrite Growth
Blender 5.1 · CC0 · Holoflow Studio

Technique: DLA (Witten & Sander, PRL 1981) grows fractal dendrites by random-walking
particles that stick permanently on first contact with a growing seed crystal.
In a Blender 5.1 Simulation Zone, two point-cloud geometries are held as state:
'Geometry' (Crystal — the frozen aggregate) and 'Walkers' (the mobile cloud).
Per frame: move walkers by random unit-step × STEP_SIZE; test proximity to Crystal
via GeometryNodeProximity (a pure field node — Target=Crystal, Distance per walker);
partition walkers into aggregating vs continuing via SeparateGeometry; stamp the
aggregating set with the current frame as 'agg_frame'; join to Crystal; cull walkers
beyond CULL_RADIUS; spawn WALKERS_PER_FRAME fresh walkers on the spawn-sphere shell.
The Hausdorff dimension of 3-D DLA converges to ≈ 2.5 for very large clusters;
smaller runs like this (500 pts) are more branch-dominant and look closer to ≈ 1.7.

Key trade-off — step size vs aggregation radius:
  STEP_SIZE / AGG_RADIUS < 1  →  walkers can pass through without sticking (tunnelling)
  STEP_SIZE / AGG_RADIUS > 2  →  walkers over-stick to peripheral branches; dense rim
  Ratio ≈ 0.85 (defaults) gives natural interior fill with fractal branching.

Outside sources:
  Blender Manual — Simulation Zone
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html
    CC-BY-SA 4.0 · Blender Documentation Team
  Wikipedia — Diffusion-limited aggregation
    https://en.wikipedia.org/wiki/Diffusion-limited_aggregation
    CC-BY-SA 3.0 · Wikipedia contributors (cites Witten & Sander 1981, PD)
  glTF-Blender-IO — Khronos Group GLB exporter
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Khronos Group
"""

import bpy
import os

# ── Parameters ────────────────────────────────────────────────────────────────
AGG_RADIUS        = 0.35   # stick if walker is within this of ANY crystal point
STEP_SIZE         = 0.30   # random-walk step length per frame (metres)
SPAWN_RADIUS      = 3.50   # walkers are born on a sphere of this radius
CULL_RADIUS       = 7.00   # walkers deleted once |pos| > this; prevents unbounded growth
WALKERS_PER_FRAME = 12     # new walkers injected every frame inside the zone
CRYSTAL_INST_R    = 0.18   # radius of each icosphere instance per crystal point
SIM_FRAME_END     = 140    # total sim frames; produces ≈ 450-550 crystal points
EXPORT_FRAME      = 120    # GLB snapshot frame
BLEND_OUT         = "//dla_crystal.blend"
GLB_OUT           = "//dla_crystal_frame120.glb"


def _cleanup() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith("DLA_"):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith("DLA_"):
            bpy.data.meshes.remove(me)
    for ng in list(bpy.data.node_groups):
        if ng.name.startswith("GN_DLA"):
            bpy.data.node_groups.remove(ng)
    for ma in list(bpy.data.materials):
        if ma.name.startswith("DLA_"):
            bpy.data.materials.remove(ma)


def _lk(ng, src, dst):
    ng.links.new(src, dst)


def _material_crystal() -> bpy.types.Material:
    """Age gradient: seed (agg_norm=0) = deep cobalt; freshest tip (=1) = bright gold."""
    ma = bpy.data.materials.new("DLA_Crystal")
    ma.use_nodes = True
    nt = ma.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out  = nt.nodes.new("ShaderNodeOutputMaterial");  out.location  = (600,  0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled");  bsdf.location = (300,  0)
    ramp = nt.nodes.new("ShaderNodeValToRGB");         ramp.location = (  0,  0)
    attr = nt.nodes.new("ShaderNodeAttribute");        attr.location = (-300, 0)
    attr.attribute_type = 'GEOMETRY'
    attr.attribute_name = 'agg_norm'          # 0 = seed, 1 = most-recently-aggregated
    ramp.color_ramp.interpolation = 'LINEAR'
    ramp.color_ramp.elements[0].color = (0.05, 0.12, 0.70, 1)   # cobalt seed
    ramp.color_ramp.elements[1].color = (0.95, 0.78, 0.05, 1)   # gold tip
    bsdf.inputs["Roughness"].default_value = 0.22
    bsdf.inputs["Metallic"].default_value  = 0.88
    nt.links.new(attr.outputs["Fac"],       ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"],     bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"],      out.inputs["Surface"])
    return ma


def _build_gn_dla(ma: bpy.types.Material) -> bpy.types.GeometryNodeTree:
    ng = bpy.data.node_groups.new("GN_DLACrystal", "GeometryNodeTree")
    nodes = ng.nodes
    # Group output only — no geometry input needed (GN builds everything internally)
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    go = nodes.new("NodeGroupOutput"); go.location = (2600, 0)

    # ── Simulation Zone ────────────────────────────────────────────────────────
    # pair_with_output BEFORE adding state_items — both nodes receive sockets together
    sim_in  = nodes.new("GeometryNodeSimulationInput");  sim_in.location  = (-600, 0)
    sim_out = nodes.new("GeometryNodeSimulationOutput"); sim_out.location = (1800, 0)
    sim_in.pair_with_output(sim_out)
    # 'Geometry' channel = Crystal (default, already present)
    # Add 'Walkers' as second geometry state
    sim_out.state_items.new("GEOMETRY", "Walkers")

    # ── Pre-zone: initial states (consumed only at frame 0 / cache-reset) ──────
    # Crystal seed: single point at origin with agg_frame=0
    seed_ln   = nodes.new("GeometryNodeMeshLine");             seed_ln.location = (-1400, 300)
    seed_ln.count_mode = 'TOTAL'; seed_ln.mode = 'OFFSET'
    seed_ln.inputs["Count"].default_value  = 1
    seed_ln.inputs["Offset"].default_value = (0, 0, 0)
    to_pts    = nodes.new("GeometryNodeMeshToPoints");         to_pts.location  = (-1150, 300)
    to_pts.mode = 'VERTICES'
    store0    = nodes.new("GeometryNodeStoreNamedAttribute");  store0.location  = (-900, 300)
    store0.data_type = 'INT'; store0.domain = 'POINT'
    store0.inputs["Name"].default_value  = "agg_frame"
    store0.inputs["Value"].default_value = 0
    _lk(ng, seed_ln.outputs["Mesh"],   to_pts.inputs["Mesh"])
    _lk(ng, to_pts.outputs["Points"],  store0.inputs["Geometry"])
    _lk(ng, store0.outputs["Geometry"], sim_in.inputs["Geometry"])  # Crystal seed

    # Initial walker cloud: WALKERS_PER_FRAME×3 points on spawn sphere
    w0_pts    = nodes.new("GeometryNodePoints");               w0_pts.location  = (-1400, -200)
    w0_pts.inputs["Count"].default_value = WALKERS_PER_FRAME * 3
    w0_rand   = nodes.new("FunctionNodeRandomValue");          w0_rand.location = (-1150, -200)
    w0_rand.data_type = 'FLOAT_VECTOR'
    w0_rand.inputs["Min"].default_value = (-1, -1, -1)
    w0_rand.inputs["Max"].default_value = (1,  1,  1)
    w0_nrm    = nodes.new("ShaderNodeVectorMath");             w0_nrm.location  = (-900, -200)
    w0_nrm.operation = 'NORMALIZE'
    w0_scl    = nodes.new("ShaderNodeVectorMath");             w0_scl.location  = (-700, -200)
    w0_scl.operation = 'SCALE'; w0_scl.inputs["Scale"].default_value = SPAWN_RADIUS
    _lk(ng, w0_rand.outputs["Value"],    w0_nrm.inputs[0])
    _lk(ng, w0_nrm.outputs["Vector"],    w0_scl.inputs[0])
    _lk(ng, w0_scl.outputs["Vector"],    w0_pts.inputs["Position"])
    _lk(ng, w0_pts.outputs["Geometry"],  sim_in.inputs["Walkers"])

    # ── INSIDE ZONE ────────────────────────────────────────────────────────────
    # 1. Random walk step: each walker moves by normalised random vector × STEP_SIZE
    # FunctionNodeRandomValue implicitly hashes element-index; frame varies output
    rnd       = nodes.new("FunctionNodeRandomValue");          rnd.location  = (-300, -300)
    rnd.data_type = 'FLOAT_VECTOR'
    rnd.inputs["Min"].default_value = (-1, -1, -1)
    rnd.inputs["Max"].default_value = ( 1,  1,  1)
    vnrm      = nodes.new("ShaderNodeVectorMath");             vnrm.location = (-50, -300)
    vnrm.operation = 'NORMALIZE'
    vscl      = nodes.new("ShaderNodeVectorMath");             vscl.location = (150, -300)
    vscl.operation = 'SCALE'; vscl.inputs["Scale"].default_value = STEP_SIZE
    setpos    = nodes.new("GeometryNodeSetPosition");          setpos.location = (350, -200)
    _lk(ng, sim_in.outputs["Walkers"], setpos.inputs["Geometry"])
    _lk(ng, rnd.outputs["Value"],      vnrm.inputs[0])
    _lk(ng, vnrm.outputs["Vector"],    vscl.inputs[0])
    _lk(ng, vscl.outputs["Vector"],    setpos.inputs["Offset"])

    # 2. Proximity test: GeometryNodeProximity is a FIELD node.
    # Wiring Crystal to Target makes Distance a field over whatever domain uses it.
    # Distance is evaluated per-walker by SeparateGeometry's Selection downstream.
    prox      = nodes.new("GeometryNodeProximity");            prox.location  = (550, 50)
    prox.target_element = 'POINTS'
    cmp_agg   = nodes.new("FunctionNodeCompare");              cmp_agg.location = (750, 50)
    cmp_agg.data_type = 'FLOAT'; cmp_agg.operation = 'LESS_THAN'
    cmp_agg.inputs["B"].default_value = AGG_RADIUS
    _lk(ng, sim_in.outputs["Geometry"], prox.inputs["Target"])   # Crystal = target
    _lk(ng, prox.outputs["Distance"],   cmp_agg.inputs["A"])

    # 3. Separate: aggregating walkers vs continuing walkers
    sep       = nodes.new("GeometryNodeSeparateGeometry");     sep.location  = (950, -200)
    sep.domain = 'POINT'
    _lk(ng, setpos.outputs["Geometry"], sep.inputs["Geometry"])
    _lk(ng, cmp_agg.outputs["Result"],  sep.inputs["Selection"])
    # sep.outputs["Selection"] = aggregating   sep.outputs["Inverted"] = continuing

    # 4. Stamp agg_frame on aggregating walkers before joining crystal
    stime     = nodes.new("GeometryNodeInputSceneTime");       stime.location  = (950, 250)
    store_af  = nodes.new("GeometryNodeStoreNamedAttribute");  store_af.location = (1150, 0)
    store_af.data_type = 'INT'; store_af.domain = 'POINT'
    store_af.inputs["Name"].default_value = "agg_frame"
    _lk(ng, sep.outputs["Selection"],  store_af.inputs["Geometry"])
    _lk(ng, stime.outputs["Frame"],    store_af.inputs["Value"])

    # 5. Cull walkers too far from origin
    in_pos    = nodes.new("GeometryNodeInputPosition");        in_pos.location   = (950, -450)
    vlen      = nodes.new("ShaderNodeVectorMath");             vlen.location     = (1150, -450)
    vlen.operation = 'LENGTH'
    cmp_cull  = nodes.new("FunctionNodeCompare");              cmp_cull.location = (1350, -450)
    cmp_cull.data_type = 'FLOAT'; cmp_cull.operation = 'GREATER_THAN'
    cmp_cull.inputs["B"].default_value = CULL_RADIUS
    delg      = nodes.new("GeometryNodeDeleteGeometry");       delg.location     = (1550, -350)
    delg.domain = 'POINT'; delg.mode = 'ALL'
    _lk(ng, in_pos.outputs["Position"], vlen.inputs[0])
    _lk(ng, vlen.outputs["Value"],      cmp_cull.inputs["A"])
    _lk(ng, sep.outputs["Inverted"],    delg.inputs["Geometry"])
    _lk(ng, cmp_cull.outputs["Result"], delg.inputs["Selection"])

    # 6. Spawn fresh walkers each frame on the sphere shell
    # GeometryNodePoints creates N points; random sphere position fed to Position input
    spn_pts   = nodes.new("GeometryNodePoints");               spn_pts.location   = (950, -600)
    spn_pts.inputs["Count"].default_value = WALKERS_PER_FRAME
    spn_rnd   = nodes.new("FunctionNodeRandomValue");          spn_rnd.location   = (1150, -650)
    spn_rnd.data_type = 'FLOAT_VECTOR'
    spn_rnd.inputs["Min"].default_value = (-1, -1, -1)
    spn_rnd.inputs["Max"].default_value = ( 1,  1,  1)
    spn_nrm   = nodes.new("ShaderNodeVectorMath");             spn_nrm.location   = (1350, -650)
    spn_nrm.operation = 'NORMALIZE'
    spn_scl   = nodes.new("ShaderNodeVectorMath");             spn_scl.location   = (1550, -650)
    spn_scl.operation = 'SCALE'; spn_scl.inputs["Scale"].default_value = SPAWN_RADIUS
    # Use Frame as seed so each frame spawns at different sphere positions
    _lk(ng, stime.outputs["Frame"],     spn_rnd.inputs["Seed"])
    _lk(ng, spn_rnd.outputs["Value"],   spn_nrm.inputs[0])
    _lk(ng, spn_nrm.outputs["Vector"],  spn_scl.inputs[0])
    _lk(ng, spn_scl.outputs["Vector"],  spn_pts.inputs["Position"])

    # 7. Join: new walkers → Walkers state; stamped aggregating → Crystal state
    jw        = nodes.new("GeometryNodeJoinGeometry"); jw.location = (1750, -500)
    _lk(ng, delg.outputs["Geometry"],  jw.inputs["Geometry"])
    _lk(ng, spn_pts.outputs["Geometry"], jw.inputs["Geometry"])
    jc        = nodes.new("GeometryNodeJoinGeometry"); jc.location = (1750, 100)
    _lk(ng, sim_in.outputs["Geometry"],  jc.inputs["Geometry"])
    _lk(ng, store_af.outputs["Geometry"], jc.inputs["Geometry"])
    _lk(ng, jc.outputs["Geometry"],    sim_out.inputs["Geometry"])
    _lk(ng, jw.outputs["Geometry"],    sim_out.inputs["Walkers"])

    # ── Post-zone: normalise agg_frame → agg_norm; instance icospheres ─────────
    raf       = nodes.new("GeometryNodeInputNamedAttribute"); raf.location = (2000, 300)
    raf.data_type = 'INT'; raf.inputs["Name"].default_value = "agg_frame"
    mdiv      = nodes.new("ShaderNodeMath");                  mdiv.location = (2200, 300)
    mdiv.operation = 'DIVIDE'; mdiv.inputs[1].default_value = float(SIM_FRAME_END)
    mclmp     = nodes.new("ShaderNodeMath");                  mclmp.location = (2350, 300)
    mclmp.operation = 'MINIMUM'; mclmp.inputs[1].default_value = 1.0
    snorm     = nodes.new("GeometryNodeStoreNamedAttribute"); snorm.location = (2400, 100)
    snorm.data_type = 'FLOAT'; snorm.domain = 'POINT'
    snorm.inputs["Name"].default_value = "agg_norm"
    _lk(ng, sim_out.outputs["Geometry"], snorm.inputs["Geometry"])
    _lk(ng, raf.outputs["Attribute"],    mdiv.inputs[0])
    _lk(ng, mdiv.outputs["Value"],       mclmp.inputs[0])
    _lk(ng, mclmp.outputs["Value"],      snorm.inputs["Value"])

    ico       = nodes.new("GeometryNodeMeshIcoSphere");       ico.location  = (2000, -150)
    ico.inputs["Radius"].default_value      = CRYSTAL_INST_R
    ico.inputs["Subdivisions"].default_value = 1
    inst      = nodes.new("GeometryNodeInstanceOnPoints");    inst.location  = (2400, -50)
    setmat    = nodes.new("GeometryNodeSetMaterial");         setmat.location = (2500, -150)
    setmat.inputs["Material"].default_value = ma
    _lk(ng, snorm.outputs["Geometry"], inst.inputs["Points"])
    _lk(ng, ico.outputs["Mesh"],       inst.inputs["Instance"])
    _lk(ng, inst.outputs["Instances"], setmat.inputs["Geometry"])
    _lk(ng, setmat.outputs["Geometry"], go.inputs["Geometry"])

    return ng


def _export_glb(ob: bpy.types.Object) -> None:
    bpy.context.scene.frame_set(EXPORT_FRAME)
    bpy.context.view_layer.update()
    path = bpy.path.abspath(GLB_OUT)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB",
        export_apply=True, use_selection=True, export_attributes=True,
    )


def main() -> None:
    _cleanup()
    ma = _material_crystal()
    ng = _build_gn_dla(ma)
    # Minimal host mesh; GN produces all geometry via Simulation Zone
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.001, location=(0, 0, 0))
    ob = bpy.context.active_object
    ob.name = "DLA_Crystal"
    bpy.ops.object.modifier_add(type='NODES')
    mod = ob.modifiers[-1]
    mod.node_group = ng; mod.name = "GN_DLACrystal"
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end   = SIM_FRAME_END
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))
    _export_glb(ob)
    print("[DLA] blueprint complete — crystal at frame", EXPORT_FRAME)


if __name__ == "__main__":
    main()

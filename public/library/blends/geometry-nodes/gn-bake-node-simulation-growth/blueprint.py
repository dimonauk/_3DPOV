"""
GN Bake Node — Simulation Growth Cache: Crystal-Spread Frozen to Disk
Blender 5.1  ·  CC0  ·  Holoflow Studio

Technique: a flood-fill activation simulation spreads from a north-pole seed vertex
across a UV sphere using GeometryNodeSimulationInput/Output and
GeometryNodeBlurAttribute.  A GeometryNodeBake node sits downstream of the
Simulation Zone and captures the full animated geometry to disk at every frame,
enabling instant playback scrubbing without re-evaluating 60 frames of simulation
history.

The tutorial concentrates on WHY the Bake node exists, WHERE it lives in the tree,
HOW to trigger and invalidate a bake, and WHAT cache files land on disk — the
flood-fill animation is only the demonstration vehicle.

Outside sources
  Blender Manual — Bake Node (Geometry Nodes)
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/bake.html
    CC-BY-SA 4.0 · Blender Documentation Team
  Blender Manual — Simulation Zone
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html
    CC-BY-SA 4.0 · Blender Documentation Team
  blender-scripting — Nicolas Janakiev
    https://github.com/njanakiev/blender-scripting
    MIT
"""

import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────
SPHERE_SEGMENTS  = 24      # UV sphere longitude segments (24 = clean hex-ring topology)
SPHERE_RINGS     = 16      # UV sphere latitude rings  (16 rows → ~17 vertex rings)
SPHERE_RADIUS    = 1.0     # metres — world-unit sphere
SEED_Z_THRESHOLD = 0.96    # vertices with Z ≥ this are set activated=1.0 at init
                           # cos(arccos(0.96)) = 16° cap → ~4 seed vertices at top
SPREAD_THRESHOLD = 0.15    # BlurAttribute output must exceed this to flip a vertex
                           # 0.15 < 1/neighbours ≈ 0.25 → spreads ~1 ring/frame
BLUR_ITERATIONS  = 1       # topology rings traversed per simulation step
FRAME_END        = 60      # animation length; full sphere activates by ~frame 25
ANIM_FPS         = 24

DORMANT_COLOUR  = (0.02, 0.02, 0.08, 1.0)   # near-black — unactivated
ACTIVE_COLOUR   = (0.10, 0.85, 1.00, 1.0)   # bright cyan — activated
EMIT_STRENGTH   = 4.0    # >1.0 → KHR_materials_emissive_strength in exported GLB
EXPORT_FRAME    = 22     # frame at which roughly half the sphere is activated


def _cleanup() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith(("crystal_sphere", "CS_")):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith("UVSphere"):
            bpy.data.meshes.remove(me)
    for ng in list(bpy.data.node_groups):
        if ng.name.startswith("CrystalSpread"):
            bpy.data.node_groups.remove(ng)
    for ma in list(bpy.data.materials):
        if ma.name.startswith("CS_"):
            bpy.data.materials.remove(ma)


def _lk(ng, a, b):
    ng.links.new(a, b)


def _N(ns, bl_id, x, y):
    n = ns.new(bl_id)
    n.location = (x, y)
    return n


def build_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("CS_CrystalActivation")
    mat.use_nodes = True
    mat.surface_render_method = 'FORWARD'
    ns = mat.node_tree.nodes
    ns.clear()

    out   = _N(ns, 'ShaderNodeOutputMaterial',   400, 0)
    pbsdf = _N(ns, 'ShaderNodeBsdfPrincipled',   100, 0)
    attr  = _N(ns, 'ShaderNodeAttribute',        -400, 0)
    ramp  = _N(ns, 'ShaderNodeValToRGB',         -150, 0)
    mul_e = _N(ns, 'ShaderNodeMath',             -150, -250)

    attr.attribute_name = "activated"
    attr.attribute_type = 'GEOMETRY'

    ramp.color_ramp.interpolation = 'LINEAR'
    ramp.color_ramp.elements[0].color = DORMANT_COLOUR
    ramp.color_ramp.elements[1].color = ACTIVE_COLOUR
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[1].position = 1.0

    mul_e.operation = 'MULTIPLY'
    mul_e.inputs[1].default_value = EMIT_STRENGTH

    lks = mat.node_tree.links
    lks.new(attr.outputs['Fac'],       ramp.inputs['Fac'])
    lks.new(ramp.outputs['Color'],     pbsdf.inputs['Emission Color'])
    lks.new(attr.outputs['Fac'],       mul_e.inputs[0])
    lks.new(mul_e.outputs['Value'],    pbsdf.inputs['Emission Strength'])
    lks.new(pbsdf.outputs['BSDF'],     out.inputs['Surface'])
    return mat


def build_gn_tree() -> bpy.types.NodeTree:
    ng    = bpy.data.node_groups.new("CrystalSpreadBake", "GeometryNodeTree")
    ng.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    ns = ng.nodes

    gi  = _N(ns, 'NodeGroupInput',  -1400,  0)
    go  = _N(ns, 'NodeGroupOutput',  1600,  0)

    # ── Pre-zone: seed activated = 1.0 for north-pole cap ─────────────────
    # The Simulation Zone only reads this init geometry at frame 0; on frames 1+
    # sim_in replays its own cached geometry from the previous step.
    pos    = _N(ns, 'GeometryNodeInputPosition', -1200,  120)
    sep    = _N(ns, 'ShaderNodeSeparateXYZ',    -1000,  120)
    cmp    = _N(ns, 'FunctionNodeCompare',       -800,  120)
    cmp.data_type  = 'FLOAT'
    cmp.operation  = 'GREATER_THAN'
    cmp.inputs['B'].default_value = SEED_Z_THRESHOLD

    coerce = _N(ns, 'ShaderNodeMath', -600, 120)
    coerce.operation = 'MULTIPLY'
    coerce.inputs[1].default_value = 1.0   # bool(0/1) → float 0.0 or 1.0

    seed_store = _N(ns, 'GeometryNodeStoreNamedAttribute', -400, 0)
    seed_store.data_type = 'FLOAT'
    seed_store.domain    = 'POINT'
    seed_store.inputs['Name'].default_value = 'activated'

    _lk(ng, gi.outputs['Geometry'],    seed_store.inputs['Geometry'])
    _lk(ng, pos.outputs['Position'],   sep.inputs['Vector'])
    _lk(ng, sep.outputs['Z'],          cmp.inputs['A'])
    _lk(ng, cmp.outputs['Result'],     coerce.inputs[0])
    _lk(ng, coerce.outputs['Value'],   seed_store.inputs['Value'])

    # ── Simulation Zone ────────────────────────────────────────────────────
    sim_in  = _N(ns, 'GeometryNodeSimulationInput',  -200,  0)
    sim_out = _N(ns, 'GeometryNodeSimulationOutput',  800,  0)
    _lk(ng, seed_store.outputs['Geometry'], sim_in.inputs['Geometry'])

    # Inside zone: read last frame's 'activated', blur it, compare > threshold,
    # and store back.  Reading via NamedAttribute gives the previous-frame value
    # carried on the geometry flowing through the zone.
    na_act = _N(ns, 'GeometryNodeInputNamedAttribute', 0, -200)
    na_act.data_type = 'FLOAT'
    na_act.inputs['Name'].default_value = 'activated'

    blur   = _N(ns, 'GeometryNodeBlurAttribute', 200, -200)
    blur.data_type = 'FLOAT'
    blur.inputs['Iterations'].default_value = BLUR_ITERATIONS
    # WHY iterations=1: Blender's BlurAttribute computes (sum-of-ring-neighbours)/count
    # in a single topology hop.  With 1 iteration the activated front advances
    # by exactly one vertex ring each frame — visually clean, predictable timing.

    max_mn = _N(ns, 'ShaderNodeMath', 400, -200)
    max_mn.operation = 'MAXIMUM'
    # MAX(blur_output, original) prevents deactivation: once activated a vertex
    # can never go back to 0.  Without this, a vertex surrounded by newly-activated
    # neighbours would read blur=1.0 at frame N but blur < threshold at frame N+1
    # when all its neighbours are also 1.0 (sum/count = 1.0, still passes threshold,
    # so in practice this never fires — but the explicit MAX makes the intent clear).

    cmp2   = _N(ns, 'FunctionNodeCompare', 400, -450)
    cmp2.data_type = 'FLOAT'
    cmp2.operation = 'GREATER_THAN'
    cmp2.inputs['B'].default_value = SPREAD_THRESHOLD

    coerce2 = _N(ns, 'ShaderNodeMath', 600, -450)
    coerce2.operation = 'MULTIPLY'
    coerce2.inputs[1].default_value = 1.0

    act_store = _N(ns, 'GeometryNodeStoreNamedAttribute', 600, -200)
    act_store.data_type = 'FLOAT'
    act_store.domain    = 'POINT'
    act_store.inputs['Name'].default_value = 'activated'

    _lk(ng, sim_in.outputs['Geometry'],  blur.inputs['Geometry'])
    _lk(ng, na_act.outputs['Attribute'], blur.inputs['Value'])
    _lk(ng, blur.outputs['Value'],       max_mn.inputs[0])
    _lk(ng, na_act.outputs['Attribute'], max_mn.inputs[1])
    _lk(ng, max_mn.outputs['Value'],     cmp2.inputs['A'])
    _lk(ng, cmp2.outputs['Result'],      coerce2.inputs[0])
    _lk(ng, coerce2.outputs['Value'],    act_store.inputs['Value'])
    _lk(ng, blur.outputs['Geometry'],    act_store.inputs['Geometry'])
    _lk(ng, act_store.outputs['Geometry'], sim_out.inputs['Geometry'])

    # ── Bake Node ──────────────────────────────────────────────────────────
    # Placed AFTER the Simulation Zone so it captures the FINAL per-frame
    # geometry state — positions + 'activated' attribute — to disk.
    # Placing the Bake node INSIDE the zone would bake intermediate state
    # during each frame's multi-pass evaluation, which is not what we want.
    bake = _N(ns, 'GeometryNodeBake', 1000, 0)
    # bake.bake_items: in Blender 5.1 the Bake node automatically bakes the
    # Geometry socket.  Additional named attributes are added via the node's
    # UI panel (Properties › Modifier › <name> › Bake section).

    _lk(ng, sim_out.outputs['Geometry'], bake.inputs[0])
    _lk(ng, bake.outputs[0],            go.inputs['Geometry'])

    return ng


def build_scene() -> bpy.types.Object:
    _cleanup()

    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=SPHERE_SEGMENTS, ring_count=SPHERE_RINGS,
        radius=SPHERE_RADIUS, location=(0, 0, 0)
    )
    obj = bpy.context.active_object
    obj.name = "crystal_sphere"
    bpy.ops.object.shade_smooth()

    mat = build_material()
    obj.data.materials.append(mat)

    ng  = build_gn_tree()
    mod = obj.modifiers.new("CrystalSpreadBake", 'NODES')
    mod.node_group = ng

    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end   = FRAME_END
    sc.render.fps  = ANIM_FPS

    sc.eevee.use_bloom     = True
    sc.eevee.bloom_threshold = 0.8

    return obj


def export_snapshot_glb(obj: bpy.types.Object) -> None:
    """Advance to EXPORT_FRAME, snapshot via depsgraph, export as GLB."""
    sc = bpy.context.scene
    for fr in range(1, EXPORT_FRAME + 1):
        sc.frame_set(fr)
        bpy.context.view_layer.update()

    dg       = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(dg)
    snap_me  = bpy.data.meshes.new_from_object(eval_obj, depsgraph=dg)
    snap_ob  = bpy.data.objects.new("crystal_sphere_snap", snap_me)
    sc.collection.objects.link(snap_ob)

    bpy.ops.export_scene.gltf(
        filepath="//crystal_spread_growth.glb",
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_apply=True,
    )

    sc.collection.objects.unlink(snap_ob)
    bpy.data.objects.remove(snap_ob)
    bpy.data.meshes.remove(snap_me)


if __name__ == "__main__":
    obj = build_scene()
    export_snapshot_glb(obj)
    print("crystal_sphere ready.  Bake the simulation via:")
    print("  Properties › Modifier › CrystalSpreadBake › Bake section › [Bake]")
    print("  or via: Object › Geometry Node Bake (Blender 5.1 header menu)")

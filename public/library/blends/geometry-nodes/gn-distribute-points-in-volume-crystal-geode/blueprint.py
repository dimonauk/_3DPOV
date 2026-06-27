"""
GN Distribute Points in Volume — Crystalline Geode Interior
Blender 5.1 · CC0 · Holoflow Studio

GeometryNodeDistributePointsInVolume scatters a PointCloud inside a VDB fog
volume.  Volume geometry has NO point/edge/face domain — field nodes silently
return zero inside a volume context.  Pipeline: Mesh → MeshToVolume (Volume)
→ DistributePointsInVolume (PointCloud) → attribute work (POINT domain).
interior_band_width ≫ radius fills the entire enclosed interior with density.
DENSITY_RANDOM: probability ∝ density_field × Density multiplier (organic).
DENSITY_GRID: point at every voxel centre > Threshold (regular lattice).

Outside sources:
  Blender Manual — Distribute Points in Volume Node (CC-BY-SA 4.0)
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/point/distribute_points_in_volume.html
  Blender Manual — Mesh to Volume Node (CC-BY-SA 4.0)
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/mesh_to_volume.html
  njanakiev/blender-scripting MIT · Nicolas Janakiev
    https://github.com/njanakiev/blender-scripting
  KhronosGroup/glTF-Blender-IO Apache-2.0 · Khronos Group
    https://github.com/KhronosGroup/glTF-Blender-IO
"""

import bpy
import bmesh
import math
import mathutils
import os

# ── Parameters ─────────────────────────────────────────────────────────────────
SHELL_SUBDIVS       = 3        # icosphere subdivisions → 320 triangular faces
SHELL_RADIUS        = 1.5      # geode outer radius (m)
NOISE_SCALE         = 0.85     # bump noise frequency (applied to vertex coords)
NOISE_STRENGTH      = 0.22     # bump displacement amplitude (m)
VOXEL_SIZE          = 0.065    # MeshToVolume voxel resolution (m)
VOL_INTERIOR_BAND   = 8.0      # large band → fill entire interior with density 1.0
VOL_DENSITY         = 1.0      # density written into interior voxels
VOL_DENSITY_FACTOR  = 4.5      # DistributePointsInVolume density multiplier
VOL_SEED            = 17       # scatter RNG seed
MIN_CRYSTAL_DEPTH   = 0.20     # min distance from inner surface for crystal (m)
CRYSTAL_SIDES       = 6        # hexagonal bipyramid
CRYSTAL_TOP_H       = 1.0      # top apex height (normalised; scale applied per-inst)
CRYSTAL_BOT_H       = 0.30     # bottom apex height
CRYSTAL_RING_R      = 0.22     # equatorial ring radius
CRYSTAL_RING_Z      = 0.18     # equatorial ring elevation (asymmetric: facets larger on top)
SCALE_MIN           = 0.060    # smallest crystal instance uniform scale
SCALE_MAX           = 0.200    # largest crystal instance uniform scale
SCALE_SEED          = 7
ROTATION_SEED       = 42
OBJ_SHELL           = "GD_Shell"
OBJ_CRYSTAL         = "GD_Crystal"
MA_SHELL            = "GD_MatShell"
MA_CRYSTAL          = "GD_MatCrystal"
NG_NAME             = "GN_DistributeVolumeGeode"
BLEND_OUT           = "//crystal_geode.blend"
GLB_OUT             = "//crystal_geode.glb"


def _lk(ng, out, inp):
    ng.links.new(out, inp)


def _cleanup():
    for ob in list(bpy.data.objects):
        if ob.name.startswith("GD_"):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith("GD_"):
            bpy.data.meshes.remove(me)
    for ng in list(bpy.data.node_groups):
        if ng.name.startswith("GN_DistributeVolume"):
            bpy.data.node_groups.remove(ng)
    for ma in list(bpy.data.materials):
        if ma.name.startswith("GD_"):
            bpy.data.materials.remove(ma)


def _make_materials():
    ma_shell = bpy.data.materials.new(MA_SHELL)
    ma_shell.use_nodes = True
    nt = ma_shell.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial"); out.location  = (300, 0)
    pbr  = nt.nodes.new("ShaderNodeBsdfPrincipled"); pbr.location  = (0, 0)
    pbr.inputs["Base Color"].default_value    = (0.55, 0.48, 0.44, 1.0)  # warm grey
    pbr.inputs["Roughness"].default_value     = 0.85
    pbr.inputs["Metallic"].default_value      = 0.0
    nt.links.new(pbr.outputs["BSDF"], out.inputs["Surface"])

    ma_cryst = bpy.data.materials.new(MA_CRYSTAL)
    ma_cryst.use_nodes = True
    nt2 = ma_cryst.node_tree
    nt2.nodes.clear()
    out2  = nt2.nodes.new("ShaderNodeOutputMaterial"); out2.location  = (300, 0)
    emit  = nt2.nodes.new("ShaderNodeEmission");       emit.location  = (0, 0)
    emit.inputs["Color"].default_value    = (0.55, 0.95, 1.0, 1.0)  # icy cyan
    emit.inputs["Strength"].default_value = 1.8
    nt2.links.new(emit.outputs["Emission"], out2.inputs["Surface"])
    return ma_shell, ma_cryst


def _build_shell(ma_shell):
    me = bpy.data.meshes.new(OBJ_SHELL)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=SHELL_SUBDIVS, radius=SHELL_RADIUS)
    bm.normal_update()
    for v in bm.verts:
        n_val = mathutils.noise.noise(v.co * NOISE_SCALE, noise_basis='PERLIN_ORIGINAL')
        v.co += v.normal * (n_val * NOISE_STRENGTH)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    me.update()
    me.materials.append(ma_shell)
    ob = bpy.data.objects.new(OBJ_SHELL, me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    return ob


def _build_crystal(ma_cryst):
    """Hexagonal bipyramid: 6-sided equatorial ring, one top apex, one bottom apex."""
    verts = [(0.0, 0.0, CRYSTAL_TOP_H), (0.0, 0.0, -CRYSTAL_BOT_H)]
    for i in range(CRYSTAL_SIDES):
        a = (i / CRYSTAL_SIDES) * 2.0 * math.pi
        verts.append((math.cos(a) * CRYSTAL_RING_R, math.sin(a) * CRYSTAL_RING_R, CRYSTAL_RING_Z))
    faces = []
    for i in range(CRYSTAL_SIDES):
        ni = (i + 1) % CRYSTAL_SIDES
        faces.append((0, 2 + i, 2 + ni))    # upper cone (top apex → ring)
        faces.append((1, 2 + ni, 2 + i))    # lower cone (bottom apex → ring, inverted winding)
    me = bpy.data.meshes.new(OBJ_CRYSTAL)
    me.from_pydata(verts, [], faces)
    me.update()
    me.materials.append(ma_cryst)
    ob = bpy.data.objects.new(OBJ_CRYSTAL, me)
    # Move prototype far off-scene; ObjectInfo still resolves from bpy.data
    ob.location = (50.0, 0.0, 0.0)
    bpy.context.collection.objects.link(ob)
    return ob


def _build_gn_tree(shell_ob, crystal_ob):
    """
    Node graph (abbreviated):
      GroupInput[shell_geo]
        ├─→ MeshToVolume → DistributePointsInVolume → DeleteGeometry
        │                                                  ↑ Selection
        │   GroupInput[shell_geo] → GeometryProximity.Distance > MIN_DEPTH
        │
        │   InstanceOnPoints(crystal_ob, random rotation, random scale)
        │     → RealizeInstances → crystals
        └─→ JoinGeometry([shell_geo, crystals]) → GroupOutput
    """
    ng    = bpy.data.node_groups.new(NG_NAME, 'GeometryNodeTree')
    nodes = ng.nodes

    gi = nodes.new("NodeGroupInput");  gi.location  = (-1400, 0)
    go = nodes.new("NodeGroupOutput"); go.location  = (1100, 0)

    # ── Convert shell mesh to fog volume ─────────────────────────────────────
    # WHY large interior_band_width: MeshToVolume fills a band of voxels
    # starting from the mesh surface inward.  A band ≥ mesh radius fills the
    # entire enclosed interior with density=VOL_DENSITY.  A small band (e.g.
    # 0.1 m) creates a hollow thin-wall volume — useful for surface scatter
    # but NOT for volumetric interior distribution.
    mtv = nodes.new("GeometryNodeMeshToVolume"); mtv.location = (-1050, -150)
    mtv.resolution_mode = 'VOXEL_SIZE'
    mtv.inputs["Voxel Size"].default_value         = VOXEL_SIZE
    mtv.inputs["Density"].default_value            = VOL_DENSITY
    mtv.inputs["Interior Band Width"].default_value = VOL_INTERIOR_BAND
    _lk(ng, gi.outputs[0], mtv.inputs["Mesh"])

    # ── Distribute random points inside the volume ────────────────────────────
    # DENSITY_RANDOM: each voxel centre is accepted with probability
    #   p = density_field_value × (Density input).
    # Our density_field is 1.0 everywhere inside → Density input acts as a
    # plain multiplier controlling points-per-unit-volume.
    # Expected output for a 1.5-m radius sphere (≈14 m³): with Density=4.5
    # and voxel_size=0.065 m, roughly 300–600 scattered points.
    dpv = nodes.new("GeometryNodeDistributePointsInVolume"); dpv.location = (-750, -150)
    dpv.mode = 'DENSITY_RANDOM'
    dpv.inputs["Density"].default_value = VOL_DENSITY_FACTOR
    dpv.inputs["Seed"].default_value    = VOL_SEED
    _lk(ng, mtv.outputs["Volume"], dpv.inputs["Volume"])

    # ── Surface proximity filter — exclude the rim zone ───────────────────────
    # After scatter, some points land very close to the inner shell surface.
    # At instance scale SCALE_MAX=0.20 m, a crystal whose root is only 0.05 m
    # from the surface will clip through.  Proximity distance > MIN_CRYSTAL_DEPTH
    # guarantees each crystal fits entirely inside the cavity.
    prox = nodes.new("GeometryNodeProximity"); prox.location = (-600, -350)
    prox.target_element = 'FACES'
    _lk(ng, gi.outputs[0], prox.inputs["Target"])
    # prox.Distance evaluates per POINT of the flowing geometry (dpv point cloud)
    # because DeleteGeometry.Selection is downstream of it.

    cmp = nodes.new("FunctionNodeCompare"); cmp.location = (-380, -350)
    cmp.data_type = 'FLOAT'
    cmp.operation = 'GREATER_THAN'
    cmp.inputs["B"].default_value = MIN_CRYSTAL_DEPTH
    _lk(ng, prox.outputs["Distance"], cmp.inputs["A"])

    del_geo = nodes.new("GeometryNodeDeleteGeometry"); del_geo.location = (-400, -150)
    del_geo.domain    = 'POINT'
    del_geo.mode      = 'ALL'
    _lk(ng, dpv.outputs["Points"],     del_geo.inputs["Geometry"])
    _lk(ng, cmp.outputs["Result"],     del_geo.inputs["Selection"])

    # ── Random rotation (full 3-axis Euler, uniform) ──────────────────────────
    rv_rot = nodes.new("FunctionNodeRandomValue"); rv_rot.location = (-200, -350)
    rv_rot.data_type = 'FLOAT_VECTOR'
    rv_rot.inputs["Min"].default_value = (0.0, 0.0, 0.0)
    rv_rot.inputs["Max"].default_value = (6.2832, 6.2832, 6.2832)
    rv_rot.inputs["Seed"].default_value = ROTATION_SEED

    # ── Random uniform scale ──────────────────────────────────────────────────
    rv_s = nodes.new("FunctionNodeRandomValue"); rv_s.location = (-200, -500)
    rv_s.data_type = 'FLOAT'
    rv_s.inputs["Min"].default_value  = SCALE_MIN
    rv_s.inputs["Max"].default_value  = SCALE_MAX
    rv_s.inputs["Seed"].default_value = SCALE_SEED
    # InstanceOnPoints.Scale expects a VECTOR; combine float uniformly
    cxyz = nodes.new("ShaderNodeCombineXYZ"); cxyz.location = (50, -500)
    _lk(ng, rv_s.outputs[1], cxyz.inputs["X"])
    _lk(ng, rv_s.outputs[1], cxyz.inputs["Y"])
    _lk(ng, rv_s.outputs[1], cxyz.inputs["Z"])

    # ── ObjectInfo for crystal prototype ──────────────────────────────────────
    obj_info = nodes.new("GeometryNodeObjectInfo"); obj_info.location = (-200, -650)
    obj_info.transform_space = 'RELATIVE'
    obj_info.inputs["Object"].default_value = crystal_ob

    # ── Instance and realize ──────────────────────────────────────────────────
    iop = nodes.new("GeometryNodeInstanceOnPoints"); iop.location = (200, -200)
    _lk(ng, del_geo.outputs["Geometry"],    iop.inputs["Points"])
    _lk(ng, obj_info.outputs["Geometry"],   iop.inputs["Instance"])
    _lk(ng, rv_rot.outputs[0],             iop.inputs["Rotation"])
    _lk(ng, cxyz.outputs["Vector"],        iop.inputs["Scale"])

    ri = nodes.new("GeometryNodeRealizeInstances"); ri.location = (500, -200)
    _lk(ng, iop.outputs["Instances"], ri.inputs["Geometry"])

    # ── Join shell + crystals ─────────────────────────────────────────────────
    join = nodes.new("GeometryNodeJoinGeometry"); join.location = (750, 0)
    _lk(ng, gi.outputs[0],       join.inputs["Geometry"])
    _lk(ng, ri.outputs["Mesh"],  join.inputs["Geometry"])
    _lk(ng, join.outputs["Geometry"], go.inputs[0])

    mod = shell_ob.modifiers.new("GN_GeodeInterior", 'NODES')
    mod.node_group = ng


def _export_glb(shell_ob):
    bpy.context.view_layer.update()
    path = bpy.path.abspath(GLB_OUT)
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    shell_ob.select_set(True)
    bpy.context.view_layer.objects.active = shell_ob
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,       # bake GN modifier (DistributePointsInVolume + RealizeInstances)
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )


def main():
    _cleanup()
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
    ma_shell, ma_cryst = _make_materials()
    shell_ob  = _build_shell(ma_shell)
    crystal_ob = _build_crystal(ma_cryst)
    _build_gn_tree(shell_ob, crystal_ob)
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))
    _export_glb(shell_ob)
    print(f"[geode] done — {BLEND_OUT}, {GLB_OUT}")


main()

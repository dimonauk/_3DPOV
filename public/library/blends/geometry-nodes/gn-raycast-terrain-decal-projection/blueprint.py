"""
GN Raycast — Terrain Decal Projection: Surface-Following Stamps with Normal Alignment
Blender 5.1 · CC0 · Holoflow Studio

GeometryNodeRaycast fires a directed ray from each source point and tests
intersection against a target geometry, returning:
  Is Hit      — Boolean: did the ray meet the target within Ray Length?
  Hit Position— Vector: world-space position of the intersection
  Hit Normal  — Vector: face normal at the hit point
  Hit Distance— Float: travel distance to the intersection
  Hit Index   — Int: face index on the target (use for attribute look-up via Field at Index)

Contrast with Sample Nearest Surface (SampleNearestSurface node):
  Raycast   — directional; tests intersection along a specific ray;
               returns the FIRST hit within Ray Length; correct for
               "snap to ground" / "line-of-sight" queries
  SNS       — omnidirectional; returns the CLOSEST surface point;
               correct for "stick to surface" / attribute-transfer queries

This blueprint:
  1. Constructs a sine-wave displaced terrain (RC_Terrain) with bmesh.
  2. Adds an RC_Stamps GN modifier that:
       · Generates a flat 15×15 candidate grid raised to GRID_HEIGHT.
       · Raycasts each grid point straight down onto the terrain.
       · Deletes misses (ray never hit terrain — off the edge).
       · Snaps survivors to the exact hit position (SetPosition ← Hit Position).
       · Deletes stamps on slopes steeper than SLOPE_MIN_COS (dot < 0.35).
       · Scales stamps by slope cosine: flat terrain → larger stamp.
       · Colour-codes: green (flat) → amber → red (near threshold).
       · Orients each hex to the terrain face normal (AlignEulerToVector, Z axis).
  3. Saves terrain_decal.blend and exports terrain_decal.glb (Draco 6, WebP).

Source Position defaults to InputPosition (per-element position field) when no
socket is connected — this is the correct implicit wiring for "ray from each
stamp grid point". Wiring an explicit position overrides it.

Outside sources:
  Blender Manual — Raycast node (CC-BY-SA 4.0, Blender Foundation)
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/sample/raycast.html
  polygonrunway/blender-geometry-nodes-tutorials MIT · Polygon Runway
    https://github.com/polygonrunway/blender-geometry-nodes
    sibling: polygonrunway/blender-node-groups (MIT, reusable GN setups)
  KhronosGroup/glTF-Blender-IO Apache-2.0 · Khronos Group
    https://github.com/KhronosGroup/glTF-Blender-IO
"""

import bpy
import bmesh
import math
import os

# ── Parameters ──────────────────────────────────────────────────────────────────
TERRAIN_SIZE    = 8.0     # terrain full extent (m)
TERRAIN_SUBDIV  = 12      # grid subdivisions per axis — (12+1)² = 169 verts
DISPLACE_SCALE  = 0.80    # max bump height (m)

GRID_COLS       = 15      # stamp candidate columns
GRID_ROWS       = 15      # stamp candidate rows  (225 candidates total)
GRID_SIZE       = 7.0     # stamp grid extent (m)  — slightly less than terrain
GRID_HEIGHT     = 5.0     # initial Z above origin; rays fire downward
RAY_LENGTH      = 20.0    # max ray travel distance (m)

SLOPE_MIN_COS   = 0.35    # cos(≈70°): stamps on steeper slopes deleted
STAMP_RADIUS    = 0.20    # hex stamp inscribed radius (m)
STAMP_HEIGHT    = 0.05    # hex extrusion depth (m)
SCALE_MIN       = 0.40    # stamp scale at threshold slope
SCALE_MAX       = 1.00    # stamp scale on dead-flat terrain

OBJ_TERRAIN     = "RC_Terrain"
OBJ_STAMPS      = "RC_Stamps"
NG_STAMPS       = "HS_RC_TerrainDecal"
MAT_TERRAIN     = "RC_TerrainMat"
MAT_STAMP       = "RC_StampMat"

_DIR     = os.path.dirname(os.path.abspath(__file__))
OUT_BLEND = os.path.join(_DIR, "terrain_decal.blend")
OUT_GLB   = os.path.join(_DIR, "terrain_decal.glb")


def _purge():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for ng in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(ng)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)


def _make_terrain():
    """Sine-wave displaced terrain — deterministic, no external noise needed."""
    bm = bmesh.new()
    bmesh.ops.create_grid(
        bm, x_segments=TERRAIN_SUBDIV, y_segments=TERRAIN_SUBDIV,
        size=TERRAIN_SIZE / 2.0,
    )
    for v in bm.verts:
        x, y = v.co.x, v.co.y
        z  = 0.45 * math.sin(x * 0.9 + 0.30) * math.cos(y * 0.70)
        z += 0.28 * math.sin(x * 1.8 - 0.80) * math.sin(y * 2.10 + 1.0)
        z += 0.12 * math.cos(x * 3.5 + 0.50) * math.sin(y * 3.00 - 0.5)
        v.co.z = z * DISPLACE_SCALE
    me = bpy.data.meshes.new(OBJ_TERRAIN)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(OBJ_TERRAIN, me)
    bpy.context.collection.objects.link(ob)
    return ob


def _make_materials(terrain_ob, stamp_ob):
    mt = bpy.data.materials.new(MAT_TERRAIN)
    mt.use_nodes = True
    bsdf = mt.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.12, 0.28, 0.07, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.88
    terrain_ob.data.materials.append(mt)

    ms = bpy.data.materials.new(MAT_STAMP)
    ms.use_nodes = True
    nt   = ms.node_tree
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name  = "stamp_col"
    attr.attribute_type  = 'GEOMETRY'
    nt.links.new(attr.outputs["Color"],
                 nt.nodes["Principled BSDF"].inputs["Base Color"])
    nt.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.22
    stamp_ob.data.materials.append(ms)


def _build_gn_tree(terrain_ob):
    ng    = bpy.data.node_groups.new(NG_STAMPS, 'GeometryNodeTree')
    nodes = ng.nodes
    lnk   = ng.links

    def N(idname, lbl=None, **kw):
        nd = nodes.new(idname)
        if lbl:
            nd.label = lbl
        for k, v in kw.items():
            setattr(nd, k, v)
        return nd

    def L(src, dst):
        lnk.new(src, dst)

    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    N('NodeGroupInput')
    out = N('NodeGroupOutput')

    # ── Terrain reference ───────────────────────────────────────────────────────
    obj_info = N('GeometryNodeObjectInfo', 'Terrain Ref', transform_space='ORIGINAL')
    obj_info.inputs[0].default_value = terrain_ob

    # ── Candidate stamp grid ────────────────────────────────────────────────────
    grid = N('GeometryNodeMeshGrid', 'Candidates')
    grid.inputs['Size X'].default_value     = GRID_SIZE
    grid.inputs['Size Y'].default_value     = GRID_SIZE
    grid.inputs['Vertices X'].default_value = GRID_COLS
    grid.inputs['Vertices Y'].default_value = GRID_ROWS

    cvec_up = N('ShaderNodeCombineXYZ', 'Raise Z')
    cvec_up.inputs['Z'].default_value = GRID_HEIGHT
    set_up  = N('GeometryNodeSetPosition', 'Raise to Fire Height')
    L(grid.outputs['Mesh'],       set_up.inputs['Geometry'])
    L(cvec_up.outputs['Vector'],  set_up.inputs['Offset'])

    # ── Raycast — straight down ─────────────────────────────────────────────────
    down_dir = N('ShaderNodeCombineXYZ', 'Ray Down')
    down_dir.inputs['Z'].default_value = -1.0
    ray = N('GeometryNodeRaycast', 'Down-Cast')
    ray.data_type = 'FLOAT'
    ray.inputs['Ray Length'].default_value = RAY_LENGTH
    L(obj_info.outputs['Geometry'],  ray.inputs['Target Geometry'])
    L(down_dir.outputs['Vector'],    ray.inputs['Ray Direction'])
    # Source Position implicitly uses InputPosition field (no wiring needed)

    # ── Delete misses ───────────────────────────────────────────────────────────
    bool_not = N('FunctionNodeBooleanMath', 'NOT Is Hit')
    bool_not.operation = 'NOT'
    L(ray.outputs['Is Hit'],         bool_not.inputs[0])
    del_miss = N('GeometryNodeDeleteGeometry', 'Delete Misses')
    del_miss.domain = 'POINT'
    del_miss.mode   = 'ALL'
    L(set_up.outputs['Geometry'],    del_miss.inputs['Geometry'])
    L(bool_not.outputs['Boolean'],   del_miss.inputs['Selection'])

    # ── Snap to terrain surface ─────────────────────────────────────────────────
    set_snap = N('GeometryNodeSetPosition', 'Snap to Surface')
    L(del_miss.outputs['Geometry'],  set_snap.inputs['Geometry'])
    L(ray.outputs['Hit Position'],   set_snap.inputs['Position'])

    # ── Slope cosine: dot(hit_normal, Z_UP) ────────────────────────────────────
    z_up = N('ShaderNodeCombineXYZ', 'Z Up')
    z_up.inputs['Z'].default_value = 1.0
    dot = N('ShaderNodeVectorMath', 'Slope Cos')
    dot.operation = 'DOT_PRODUCT'
    L(ray.outputs['Hit Normal'],     dot.inputs[0])
    L(z_up.outputs['Vector'],        dot.inputs[1])
    # dot.outputs['Value'] == 1.0 on flat, 0.0 on vertical

    # ── Delete too-steep ────────────────────────────────────────────────────────
    cmp = N('FunctionNodeCompare', 'Too Steep?')
    cmp.data_type  = 'FLOAT'
    cmp.operation  = 'LESS_THAN'
    cmp.inputs['B'].default_value = SLOPE_MIN_COS
    L(dot.outputs['Value'],          cmp.inputs['A'])
    del_steep = N('GeometryNodeDeleteGeometry', 'Delete Steep')
    del_steep.domain = 'POINT'
    del_steep.mode   = 'ALL'
    L(set_snap.outputs['Geometry'],  del_steep.inputs['Geometry'])
    L(cmp.outputs['Result'],         del_steep.inputs['Selection'])

    # ── Map slope to scale ──────────────────────────────────────────────────────
    mrange = N('ShaderNodeMapRange', 'Slope → Scale')
    mrange.clamp = True
    mrange.inputs['From Min'].default_value = SLOPE_MIN_COS
    mrange.inputs['From Max'].default_value = 1.0
    mrange.inputs['To Min'].default_value   = SCALE_MIN
    mrange.inputs['To Max'].default_value   = SCALE_MAX
    L(dot.outputs['Value'],          mrange.inputs['Value'])
    cscale = N('ShaderNodeCombineXYZ', 'Scale Vec')
    cscale.inputs['Z'].default_value = 1.0     # don't scale stamp depth
    L(mrange.outputs['Result'],      cscale.inputs['X'])
    L(mrange.outputs['Result'],      cscale.inputs['Y'])

    # ── Colour ramp: red → amber → green ────────────────────────────────────────
    cramp = N('ShaderNodeValToRGB', 'Slope Colour')
    cramp.color_ramp.elements[0].position = 0.0
    cramp.color_ramp.elements[0].color    = (0.82, 0.08, 0.05, 1.0)  # red
    cramp.color_ramp.elements[1].position = 1.0
    cramp.color_ramp.elements[1].color    = (0.05, 0.75, 0.15, 1.0)  # green
    amber = cramp.color_ramp.elements.new(0.5)
    amber.color = (0.95, 0.58, 0.05, 1.0)                             # amber
    L(mrange.outputs['Result'],      cramp.inputs['Fac'])

    store_col = N('GeometryNodeStoreNamedAttribute', 'stamp_col')
    store_col.data_type = 'FLOAT_COLOR'
    store_col.domain    = 'POINT'
    store_col.inputs['Name'].default_value = "stamp_col"
    L(del_steep.outputs['Geometry'], store_col.inputs['Geometry'])
    L(cramp.outputs['Color'],        store_col.inputs['Value'])

    # ── Orient stamp Z to terrain normal ────────────────────────────────────────
    align = N('FunctionNodeAlignEulerToVector', 'Align Z → Normal')
    align.axis       = 'Z'
    align.pivot_axis = 'AUTO'
    align.inputs['Factor'].default_value = 1.0
    L(ray.outputs['Hit Normal'],     align.inputs['Vector'])

    # ── Hex stamp shape ─────────────────────────────────────────────────────────
    hex_mesh = N('GeometryNodeMeshCylinder', 'Hex Stamp')
    hex_mesh.fill_type = 'NGON'
    hex_mesh.inputs['Vertices'].default_value      = 6
    hex_mesh.inputs['Radius'].default_value        = STAMP_RADIUS
    hex_mesh.inputs['Depth'].default_value         = STAMP_HEIGHT
    hex_mesh.inputs['Side Segments'].default_value = 1
    hex_mesh.inputs['Fill Segments'].default_value = 1

    # ── Instance on surviving points ────────────────────────────────────────────
    inst = N('GeometryNodeInstanceOnPoints', 'Place Stamps')
    L(store_col.outputs['Geometry'], inst.inputs['Points'])
    L(hex_mesh.outputs['Mesh'],      inst.inputs['Instance'])
    L(align.outputs['Rotation'],     inst.inputs['Rotation'])
    L(cscale.outputs['Vector'],      inst.inputs['Scale'])

    # ── Realize and output ──────────────────────────────────────────────────────
    realize = N('GeometryNodeRealizeInstances', 'Realize')
    L(inst.outputs['Instances'],     realize.inputs['Geometry'])
    L(realize.outputs['Geometry'],   out.inputs['Geometry'])

    return ng


def main():
    _purge()
    terrain_ob = _make_terrain()

    stamps_me = bpy.data.meshes.new(OBJ_STAMPS)
    stamp_ob  = bpy.data.objects.new(OBJ_STAMPS, stamps_me)
    bpy.context.collection.objects.link(stamp_ob)

    _make_materials(terrain_ob, stamp_ob)

    mod           = stamp_ob.modifiers.new(NG_STAMPS, 'NODES')
    mod.node_group = _build_gn_tree(terrain_ob)

    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 40.0
    cam_ob = bpy.data.objects.new("Camera", cam_data)
    cam_ob.location       = (0.0, -10.0, 7.0)
    cam_ob.rotation_euler = (math.radians(46), 0.0, 0.0)
    bpy.context.collection.objects.link(cam_ob)
    bpy.context.scene.camera = cam_ob

    sun = bpy.data.lights.new("Sun", 'SUN')
    sun.energy = 3.5
    sun_ob = bpy.data.objects.new("Sun", sun)
    sun_ob.location = (4.0, -3.0, 9.0)
    bpy.context.collection.objects.link(sun_ob)

    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format='GLB',
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
        export_attributes=True,
        export_colors=True,
    )
    print(f"[RC-blueprint] blend → {OUT_BLEND}")
    print(f"[RC-blueprint] glb   → {OUT_GLB}")


if __name__ == "__main__":
    main()

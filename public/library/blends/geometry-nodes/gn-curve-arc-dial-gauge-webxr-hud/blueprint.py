"""
GN Curve Arc — Parametric Dial Gauge for WebXR HUD
Blender 5.1  ·  CC0  ·  Holoflow Studio

Technique
─────────
GeometryNodeCurveArc (RADIUS mode) generates mathematically exact circular arcs
without needing a base mesh. A dial gauge uses three arcs:

  1. Full 360° arc → Curve to Mesh (circular cross-section) → the outer border ring.
  2. Partial arc driven by a Group Input Value (0–1) with connect_center = True
     → Set Spline Cyclic → Fill Curve → Extrude Mesh → the progress pie sector.
  3. Partial arc (same sweep as the gauge face) at TICK_COUNT-1 resolution
     → Resample Curve → Instance on Points (thin quad) → tick marks.

connect_center is the key node parameter: it adds two line segments from each arc
endpoint back to the arc centre, forming a closed pie-slice spline in-tree — no
manual vertex weld or merge step needed before Fill Curve.

The Group Input "Value" socket (Float, 0–1) drives the sector's End Angle in real
time. It can be keyed, driven by a custom property, or wired to a bpy.driver from
an external sensor, making the gauge live-readable inside a WebXR scene.

Outside sources
───────────────
  Blender Manual — Curve Arc node
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/curve/primitives/arc.html
    CC-BY-SA 4.0 · Blender Documentation Team
    Related in same section: Curve Circle, Curve Line, Curve Spiral

  njanakiev/blender-scripting
    https://github.com/njanakiev/blender-scripting
    MIT · Nicolas Janakiev
    Sibling: https://github.com/njanakiev/blender-scripting/tree/master/scripts

  KhronosGroup/glTF-Blender-IO
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Khronos Group
    Sibling: https://github.com/KhronosGroup/glTF-Sample-Assets (CC0)
"""

import bpy
import math
import os

# ── Parameters ────────────────────────────────────────────────────────────────
GAUGE_RADIUS   = 1.00   # main arc radius (metres)
RING_WIDTH     = 0.055  # radius of the outer-ring tube cross-section
FILL_DEPTH     = 0.035  # extrusion depth of the progress sector (towards +Z)
TICK_COUNT     = 11     # tick marks along the gauge face (start + 9 major + end)
TICK_WIDTH     = 0.030  # radial extent of each tick quad
TICK_HEIGHT    = 0.007  # circumferential extent of each tick quad

# Gauge arc: 270° sweep from bottom-left to bottom-right via 12 o'clock.
# Blender angles are CCW from +X.  A 5 o'clock position = −45° = −π/4.
# A 7 o'clock position = 225° = 5π/4.  Sweep CCW from −π/4 to 5π/4 = 270°.
GAUGE_START  = -math.pi / 4          # 5 o'clock (gauge FULL reading)
GAUGE_END    = 5 * math.pi / 4       # 7 o'clock (gauge ZERO reading)
GAUGE_SWEEP  = GAUGE_END - GAUGE_START   # 270°, i.e. 3π/2

VALUE_INIT   = 0.65    # starting gauge reading (0.0–1.0) for the scene

RING_COL     = (0.06, 0.06, 0.10, 1.0)   # near-black casing
SECTOR_COL   = (0.10, 0.85, 0.40, 1.0)   # green progress fill
TICK_COL     = (0.92, 0.92, 0.92, 1.0)   # off-white ticks
EMIT_STR     = 3.0                         # emission strength (sector + ticks)

OUTPUT_DIR   = "//output"


# ── Scene setup ───────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for blk in list(bpy.data.meshes):      bpy.data.meshes.remove(blk)
    for blk in list(bpy.data.curves):      bpy.data.curves.remove(blk)
    for blk in list(bpy.data.node_groups): bpy.data.node_groups.remove(blk)
    for blk in list(bpy.data.materials):   bpy.data.materials.remove(blk)
    for blk in list(bpy.data.objects):     bpy.data.objects.remove(blk)


def make_emission_mat(name: str, col: tuple, strength: float) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    for nd in list(nt.nodes): nt.nodes.remove(nd)
    out  = nt.nodes.new('ShaderNodeOutputMaterial'); out.location  = (300, 0)
    emit = nt.nodes.new('ShaderNodeEmission');       emit.location = (80, 0)
    emit.inputs['Color'].default_value    = col
    emit.inputs['Strength'].default_value = strength
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


def make_metallic_mat(name: str, col: tuple, metal=0.0, rough=0.5) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = col
        bsdf.inputs['Metallic'].default_value   = metal
        bsdf.inputs['Roughness'].default_value  = rough
    return mat


def make_tick_quad() -> bpy.types.Object:
    """Thin XY quad (Width=TICK_WIDTH, Height=TICK_HEIGHT) used as the tick instance.
    Instance on Points + AlignEulerToVector orients it radially at each sample."""
    me = bpy.data.meshes.new("__tick_quad__")
    hw, hh = TICK_WIDTH / 2, TICK_HEIGHT / 2
    me.from_pydata(
        [(-hw, -hh, 0), (hw, -hh, 0), (hw, hh, 0), (-hw, hh, 0)],
        [],
        [(0, 1, 2, 3)],
    )
    me.update()
    obj = bpy.data.objects.new("__tick_quad__", me)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ── GN tree ───────────────────────────────────────────────────────────────────
def build_gn(host: bpy.types.Object, tick_obj: bpy.types.Object,
             mat_ring, mat_sector, mat_ticks):
    ng  = bpy.data.node_groups.new("GN_DialGauge", 'GeometryNodeTree')
    mod = host.modifiers.new("GN_DialGauge", 'NODES')
    mod.node_group = ng

    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    val_sock = ng.interface.new_socket('Value', in_out='INPUT', socket_type='NodeSocketFloat')
    val_sock.default_value = VALUE_INIT
    val_sock.min_value, val_sock.max_value = 0.0, 1.0

    nd, lk = ng.nodes, ng.links

    def n(tp, loc=(0, 0)):
        node = nd.new(tp); node.location = loc; return node

    gin  = n('NodeGroupInput',  (-1700, 0))
    gout = n('NodeGroupOutput', ( 1100, 0))

    # End Angle = GAUGE_START + Value × GAUGE_SWEEP  →  linear 0–1 gauge mapping
    mul_sweep = n('ShaderNodeMath', (-1400, -200))
    mul_sweep.operation = 'MULTIPLY'
    mul_sweep.inputs[1].default_value = GAUGE_SWEEP
    lk.new(gin.outputs['Value'], mul_sweep.inputs[0])

    add_start = n('ShaderNodeMath', (-1200, -200))
    add_start.operation = 'ADD'
    add_start.inputs[1].default_value = GAUGE_START
    lk.new(mul_sweep.outputs[0], add_start.inputs[0])

    # ── 1. Outer border ring (full 360°) ──────────────────────────────────
    ring_arc = n('GeometryNodeCurveArc', (-1400, 300))
    ring_arc.mode = 'RADIUS'
    ring_arc.inputs['Resolution'].default_value  = 64
    ring_arc.inputs['Radius'].default_value      = GAUGE_RADIUS
    ring_arc.inputs['Start Angle'].default_value = 0.0
    ring_arc.inputs['End Angle'].default_value   = math.tau   # 2π = full circle

    ring_prof = n('GeometryNodeCurvePrimitiveCircle', (-1200, 200))
    ring_prof.mode = 'RADIUS'
    ring_prof.inputs['Resolution'].default_value = 8
    ring_prof.inputs['Radius'].default_value     = RING_WIDTH

    ring_c2m = n('GeometryNodeCurveToMesh', (-1000, 300))
    ring_c2m.inputs['Fill Caps'].default_value = False
    lk.new(ring_arc.outputs['Curve'],    ring_c2m.inputs['Curve'])
    lk.new(ring_prof.outputs['Curve'],   ring_c2m.inputs['Profile Curve'])

    ring_smat = n('GeometryNodeSetMaterial', (-800, 300))
    ring_smat.inputs['Material'].default_value = mat_ring
    lk.new(ring_c2m.outputs['Mesh'], ring_smat.inputs['Geometry'])

    # ── 2. Progress sector (connect_center → pie slice → Fill → Extrude) ─
    # connect_center adds arc_end→centre + centre→arc_start radii; SetSplineCyclic
    # closes the junction; FillCurve triangulates the pie without a Merge step.
    sector_arc = n('GeometryNodeCurveArc', (-1400, 0))
    sector_arc.mode = 'RADIUS'
    sector_arc.inputs['Resolution'].default_value  = 48
    sector_arc.inputs['Radius'].default_value      = GAUGE_RADIUS - RING_WIDTH * 2.2
    sector_arc.inputs['Start Angle'].default_value = GAUGE_START
    sector_arc.inputs['Connect Center'].default_value = True
    lk.new(add_start.outputs[0], sector_arc.inputs['End Angle'])

    sector_cyc = n('GeometryNodeSetSplineCyclic', (-1150, 0))
    sector_cyc.inputs['Cyclic'].default_value = True
    lk.new(sector_arc.outputs['Curve'], sector_cyc.inputs['Curve'])

    sector_fill = n('GeometryNodeFillCurve', (-950, 0))
    sector_fill.mode = 'TRIANGLES'
    lk.new(sector_cyc.outputs['Curve'], sector_fill.inputs['Curve'])

    sector_ext = n('GeometryNodeExtrudeMesh', (-750, 0))
    sector_ext.mode = 'FACES'
    sector_ext.inputs['Offset'].default_value       = (0.0, 0.0, FILL_DEPTH)
    sector_ext.inputs['Offset Scale'].default_value = 1.0
    lk.new(sector_fill.outputs['Mesh'], sector_ext.inputs['Mesh'])

    sector_smat = n('GeometryNodeSetMaterial', (-550, 0))
    sector_smat.inputs['Material'].default_value = mat_sector
    lk.new(sector_ext.outputs['Mesh'], sector_smat.inputs['Geometry'])

    # ── 3. Tick marks (270° arc → Resample COUNT → Instance on Points) ───
    # Resample COUNT gives exactly TICK_COUNT points; arc Resolution is irrelevant
    # (segment count ≠ point count, error-prone to match manually).
    tick_arc = n('GeometryNodeCurveArc', (-1400, -300))
    tick_arc.mode = 'RADIUS'
    tick_arc.inputs['Resolution'].default_value  = 48
    tick_arc.inputs['Radius'].default_value      = GAUGE_RADIUS + RING_WIDTH * 0.5
    tick_arc.inputs['Start Angle'].default_value = GAUGE_START
    tick_arc.inputs['End Angle'].default_value   = GAUGE_END

    tick_resamp = n('GeometryNodeResampleCurve', (-1150, -300))
    tick_resamp.mode = 'COUNT'
    tick_resamp.inputs['Count'].default_value = TICK_COUNT
    lk.new(tick_arc.outputs['Curve'], tick_resamp.inputs['Curve'])

    tick_info = n('GeometryNodeObjectInfo', (-1150, -500))
    tick_info.inputs['Object'].default_value         = tick_obj
    tick_info.transform_space                         = 'ORIGINAL'

    tick_iop = n('GeometryNodeInstanceOnPoints', (-900, -300))
    lk.new(tick_resamp.outputs['Points'],    tick_iop.inputs['Points'])
    lk.new(tick_info.outputs['Geometry'],    tick_iop.inputs['Instance'])
    # Tangent → AlignEulerToVector(X,Z) rotates each tick radially outward
    align = n('FunctionNodeAlignEulerToVector', (-1000, -480))
    align.axis       = 'X'
    align.pivot_axis = 'Z'
    lk.new(tick_resamp.outputs['Tangent'], align.inputs['Vector'])
    lk.new(align.outputs['Rotation'],     tick_iop.inputs['Rotation'])

    tick_real = n('GeometryNodeRealizeInstances', (-700, -300))
    lk.new(tick_iop.outputs['Instances'], tick_real.inputs['Geometry'])

    tick_smat = n('GeometryNodeSetMaterial', (-550, -300))
    tick_smat.inputs['Material'].default_value = mat_ticks
    lk.new(tick_real.outputs['Geometry'], tick_smat.inputs['Geometry'])

    # ── Join all geometry + holoflow:facet flag ────────────────────────────
    join = n('GeometryNodeJoinGeometry', (-350, 150))
    lk.new(ring_smat.outputs['Geometry'],   join.inputs['Geometry'])
    lk.new(sector_smat.outputs['Geometry'], join.inputs['Geometry'])
    lk.new(tick_smat.outputs['Geometry'],   join.inputs['Geometry'])

    store = n('GeometryNodeStoreNamedAttribute', (-150, 150))
    store.domain    = 'FACE'
    store.data_type = 'FLOAT'
    store.inputs['Name'].default_value  = 'holoflow:facet'
    store.inputs['Value'].default_value = 1.0
    lk.new(join.outputs['Geometry'], store.inputs['Geometry'])
    lk.new(store.outputs['Geometry'], gout.inputs[0])

    # expose Value as a modifier input so it can be keyed on the timeline
    mod['Value'] = VALUE_INIT


# ── Export ────────────────────────────────────────────────────────────────────
def export_glb(host):
    out = bpy.path.abspath(OUTPUT_DIR + "/dial_gauge.glb")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.context.view_layer.objects.active = host
    bpy.ops.object.select_all(action='DESELECT')
    host.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"Exported → {out}")


def main():
    clear_scene()

    mat_ring   = make_metallic_mat("MAT_Ring",   RING_COL,   metal=0.9, rough=0.2)
    mat_sector = make_emission_mat("MAT_Sector", SECTOR_COL, EMIT_STR)
    mat_ticks  = make_emission_mat("MAT_Ticks",  TICK_COL,   EMIT_STR * 0.6)

    tick_obj = make_tick_quad()

    # Host: an empty mesh; the GN tree generates all geometry procedurally.
    me_host = bpy.data.meshes.new("gauge_host")
    host = bpy.data.objects.new("dial_gauge", me_host)
    bpy.context.scene.collection.objects.link(host)
    bpy.context.view_layer.objects.active = host

    build_gn(host, tick_obj, mat_ring, mat_sector, mat_ticks)
    export_glb(host)
    print("Blueprint complete — dial_gauge.glb ready for WebXR.")


if __name__ == "__main__":
    main()

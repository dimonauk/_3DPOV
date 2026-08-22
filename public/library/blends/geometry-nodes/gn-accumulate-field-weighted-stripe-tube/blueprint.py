"""
GN Accumulate Field — Noise-Weighted Arc-Length Stripe Tube
Blender 5.1  ·  CC0  ·  Holoflow Studio

Technique
─────────
GeometryNodeAccumulateField (bl_idname 'GeometryNodeAccumulateField') computes a
prefix sum of a field across all elements of a domain in one GN pass — no Repeat
Zone required. Three outputs:

  Leading   (EXCLUSIVE prefix sum) — total of all PREVIOUS elements, 0 for element 0
  Trailing  (INCLUSIVE prefix sum) — total including current element
  Total     (full group sum) — same value on every element in the group

The Group ID input (INT field) isolates accumulation per group; wiring
GeometryNodeInputSplineIndex makes each spline accumulate independently in
multi-spline curves.

Project: a Bezier S-curve resampled to 64 points. Each point carries a
noise-driven weight (0.5 .. 1.5). AccumulateField sums these weights from
point 0 to point 63. Normalising Leading by Total gives a UV parameter where
high-weight segments get wide stripes and low-weight segments get narrow stripes
— impossible to compute without the prefix-sum primitive.

Contrast with GeometryNodeRepeatZone: a Repeat Zone can also accumulate, but
evaluates the body N×M times (N iterations × M points) — O(N·M). AccumulateField
is O(M) within a single node evaluation; no topology overhead.

Outside sources
───────────────
  Blender Manual — Accumulate Field Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/field/accumulate_field.html
    CC-BY-SA 4.0 · Blender Documentation Team
    Related nodes: Field at Index, Evaluate on Domain, Spline Parameter

  njanakiev/blender-scripting
    https://github.com/njanakiev/blender-scripting
    MIT · Nicolas Janakiev
    Reference for bpy node-tree construction patterns used throughout.

  KhronosGroup/glTF-Blender-IO
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Khronos Group
    GLB exporter; export_colors=True promotes FLOAT_COLOR → COLOR_0.
    Sibling: https://github.com/KhronosGroup/glTF-Sample-Assets (CC0)
"""

import bpy
import os

# ── Parameters ────────────────────────────────────────────────────────────────
CURVE_SCALE        = 2.0    # half-span of the S-path in metres
RESAMPLE_COUNT     = 64     # sample points; must be ≥ 2×NUM_STRIPES for legible bands
WEIGHT_NOISE_SCALE = 3.5    # oscillation cycles of the weight noise across the path
WEIGHT_MIN         = 0.40   # lower bound of per-point stripe weight
WEIGHT_MAX         = 1.60   # upper bound; ratio Max/Min controls stripe-width variance
NUM_STRIPES        = 8      # alternating colour repetitions along the tube
PROFILE_RADIUS     = 0.07   # tube cross-section radius in metres (WebXR scale)
EMISSION_STRENGTH  = 2.5    # shader emission multiplier
EXPORT_FRAME       = 1
OUTPUT_DIR         = "//output"


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for blk in list(bpy.data.meshes):      bpy.data.meshes.remove(blk)
    for blk in list(bpy.data.curves):      bpy.data.curves.remove(blk)
    for blk in list(bpy.data.node_groups): bpy.data.node_groups.remove(blk)
    for blk in list(bpy.data.materials):   bpy.data.materials.remove(blk)


def build_s_curve() -> bpy.types.Object:
    """Bezier S-path with two handle pairs giving an inflected curve in XZ."""
    bpy.ops.curve.primitive_bezier_curve_add(radius=1.0, enter_editmode=False)
    obj = bpy.context.active_object
    obj.name = "weighted_stripe_curve"
    sp = obj.data.splines[0]
    p0, p1 = sp.bezier_points[0], sp.bezier_points[1]
    p0.co            = (-CURVE_SCALE, 0.0, -CURVE_SCALE)
    p0.handle_left   = (-CURVE_SCALE - 0.8, 0.0, -CURVE_SCALE)
    p0.handle_right  = (-CURVE_SCALE + 1.5, 0.0,  0.0)
    p1.co            = ( CURVE_SCALE, 0.0,  CURVE_SCALE)
    p1.handle_left   = ( CURVE_SCALE - 1.5, 0.0,  0.0)
    p1.handle_right  = ( CURVE_SCALE + 0.8, 0.0,  CURVE_SCALE)
    return obj


def build_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("MAT_WeightedStripe")
    mat.use_nodes = True
    nt = mat.node_tree
    for nd in list(nt.nodes): nt.nodes.remove(nd)
    out  = nt.nodes.new('ShaderNodeOutputMaterial'); out.location  = (400, 0)
    emit = nt.nodes.new('ShaderNodeEmission');       emit.location = (180, 0)
    emit.inputs['Strength'].default_value = EMISSION_STRENGTH
    attr = nt.nodes.new('ShaderNodeAttribute');      attr.location = (-100, 0)
    attr.attribute_type = 'GEOMETRY'
    attr.attribute_name = 'weighted_stripe'
    nt.links.new(attr.outputs['Color'],       emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'],    out.inputs['Surface'])
    return mat


def build_gn_tree(obj: bpy.types.Object):
    ng  = bpy.data.node_groups.new("GN_AccumulateField_WeightedStripe", 'GeometryNodeTree')
    mod = obj.modifiers.new("GN_WeightedStripe", 'NODES')
    mod.node_group = ng
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    nd = ng.nodes
    lk = ng.links

    def n(tp, loc=(0, 0)):
        node = nd.new(tp); node.location = loc; return node

    gin  = n('NodeGroupInput',  (-1900, 0))
    gout = n('NodeGroupOutput', ( 1000, 0))

    # ── 1. Resample curve to equal arc-length points ──────────────────────────
    resample = n('GeometryNodeResampleCurve', (-1600, 0))
    resample.mode = 'COUNT'
    resample.inputs['Count'].default_value = RESAMPLE_COUNT
    lk.new(gin.outputs[0], resample.inputs['Curve'])

    # ── 2. Per-point weight via 1-D noise sampled at arc-length position ──────
    # SplineParameter.Factor is the arc-length fraction 0..1 per resampled point.
    # Using it as noise coordinate gives weight that varies with position, not index.
    spline_param = n('GeometryNodeSplineParameter', (-1300, -250))

    noise = n('ShaderNodeTexNoise', (-1050, -250))
    noise.noise_dimensions = '1D'
    noise.inputs['Scale'].default_value = WEIGHT_NOISE_SCALE
    lk.new(spline_param.outputs['Factor'], noise.inputs['W'])

    map_w = n('ShaderNodeMapRange', (-800, -250))
    map_w.inputs['From Min'].default_value = 0.0
    map_w.inputs['From Max'].default_value = 1.0
    map_w.inputs['To Min'].default_value   = WEIGHT_MIN
    map_w.inputs['To Max'].default_value   = WEIGHT_MAX
    lk.new(noise.outputs['Fac'], map_w.inputs['Value'])
    # map_w.Result  →  per-point weight in [WEIGHT_MIN, WEIGHT_MAX]

    # ── 3. Accumulate Field — running sum of weights per spline ───────────────
    # Group ID = SplineIndex: each spline's prefix sum is independent.
    spline_idx = n('GeometryNodeInputSplineIndex', (-1050, -450))

    acc = n('GeometryNodeAccumulateField', (-550, -250))
    acc.domain    = 'POINT'
    acc.data_type = 'FLOAT'
    lk.new(map_w.outputs['Result'],     acc.inputs['Value'])
    lk.new(spline_idx.outputs[0],       acc.inputs['Group ID'])
    # Sort Index left unwired → defaults to element index (natural 0..N-1 order).
    # acc.outputs['Leading'] = sum of weights for points 0 .. i-1 (exclusive)
    # acc.outputs['Trailing'] = sum for points 0 .. i (inclusive)
    # acc.outputs['Total'] = total weight of this spline

    # ── 4. Normalised weighted UV = Leading / Total ───────────────────────────
    # Leading/Total gives UV ∈ [0, 1) — each stripe's LEFT edge, proportional to weight.
    # High-weight points own wider UV intervals → wider rendered stripes.
    div_uv = n('ShaderNodeMath', (-280, -250))
    div_uv.operation = 'DIVIDE'
    lk.new(acc.outputs['Leading'], div_uv.inputs[0])
    lk.new(acc.outputs['Total'],   div_uv.inputs[1])

    # ── 5. Stripe index = floor(UV × N) mod 2 → alternating 0 / 1 ───────────
    scale_uv = n('ShaderNodeMath', (-50, -250))
    scale_uv.operation = 'MULTIPLY'
    scale_uv.inputs[1].default_value = float(NUM_STRIPES)
    lk.new(div_uv.outputs['Value'], scale_uv.inputs[0])

    floor_uv = n('ShaderNodeMath', (170, -250))
    floor_uv.operation = 'FLOOR'
    lk.new(scale_uv.outputs['Value'], floor_uv.inputs[0])

    mod_uv = n('ShaderNodeMath', (380, -250))
    mod_uv.operation = 'MODULO'
    mod_uv.inputs[1].default_value = 2.0
    lk.new(floor_uv.outputs['Value'], mod_uv.inputs[0])

    # ── 6. ColorRamp: 0 = warm coral,  1 = deep cobalt ───────────────────────
    ramp = n('ShaderNodeValToRGB', (580, -250))
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color    = (0.94, 0.33, 0.18, 1.0)   # coral
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color    = (0.17, 0.42, 0.88, 1.0)   # cobalt
    lk.new(mod_uv.outputs['Value'], ramp.inputs['Fac'])

    # ── 7. Store weighted_stripe on curve POINT domain ────────────────────────
    # Placed on the RESAMPLED curve (not the original Bezier).
    # CurveToMesh transfers POINT-domain attributes to each vertex ring of the tube.
    store_col = n('GeometryNodeStoreNamedAttribute', (-1300, 0))
    store_col.domain    = 'POINT'
    store_col.data_type = 'FLOAT_COLOR'
    store_col.inputs['Name'].default_value = 'weighted_stripe'
    lk.new(resample.outputs['Curve'], store_col.inputs['Geometry'])
    lk.new(ramp.outputs['Color'],     store_col.inputs['Value'])

    # ── 8. Profile circle + Curve to Mesh ────────────────────────────────────
    profile = n('GeometryNodeCurvePrimitiveCircle', (-1000, 200))
    profile.mode = 'RADIUS'
    profile.inputs['Resolution'].default_value = 8
    profile.inputs['Radius'].default_value     = PROFILE_RADIUS

    c2m = n('GeometryNodeCurveToMesh', (-700, 0))
    c2m.inputs['Fill Caps'].default_value = True
    lk.new(store_col.outputs['Geometry'], c2m.inputs['Curve'])
    lk.new(profile.outputs['Curve'],      c2m.inputs['Profile Curve'])

    lk.new(c2m.outputs['Mesh'], gout.inputs[0])


def export_glb(obj: bpy.types.Object):
    bpy.context.scene.frame_set(EXPORT_FRAME)
    out_path = bpy.path.abspath(OUTPUT_DIR + "/weighted_stripe_tube.glb")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_colors=True,
        export_attributes=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"Exported → {out_path}")


def main():
    clear_scene()
    obj = build_s_curve()
    mat = build_material()
    build_gn_tree(obj)
    obj.data.materials.append(mat)
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
    bpy.context.scene.eevee.use_bloom = True
    export_glb(obj)
    print("Blueprint complete — weighted stripe tube built.")


if __name__ == "__main__":
    main()

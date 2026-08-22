#!/usr/bin/env python3
"""
GN Spline Parameter — Procedural Vine Tendril (Blender 5.1)
Holoflow Studio | CC0 | 2026-06-02

Technique: SplineParameter.Factor (0→1 along each spline) drives two
behaviours simultaneously via a single stored named attribute:

  1. Profile taper  — thick bark at root → needle-thin at tip, using
                      StoreNamedAttribute + MapRange + SetCurveRadius
  2. Leaf instancing — diamond leaves only where Factor > LEAF_THRESHOLD,
                      using CurveToPoints + NamedAttribute + InstanceOnPoints

Key insight: SplineParameter is a CURVE-domain field.  After CurveToPoints
the domain shifts to POINTS — the field value must be frozen first with
StoreNamedAttribute (domain=POINT), then read back with InputNamedAttribute
("vine_t") in the points context.  Reading the GN output socket directly
past a domain change yields 0 everywhere.

ResampleCurve(COUNT=64) must precede StoreNamedAttribute: Bezier control
points are NOT uniformly spaced in arc-length parameter, so Factor at raw
control points clusters near handles.  Resampling gives equal-arc-length
points and a linear 0→(N-1)/N factor ladder.
"""

import bpy
import bmesh
import math
import random

# ── Parameters ────────────────────────────────────────────────────────────────
N_CURVES         = 5        # tendril strands
RESAMPLE_COUNT   = 64       # uniform points per spline after resampling
STEM_RADIUS_BASE = 0.035    # profile radius at Factor = 0 (root)
STEM_RADIUS_TIP  = 0.004    # profile radius at Factor = 1 (needle tip)
STEM_PROFILE_RES = 6        # hexagonal cross-section (circle at studio distances)
LEAF_THRESHOLD   = 0.80     # leaves spawn where vine_t > this value
LEAF_SPACING     = 0.10     # CurveToPoints LENGTH mode: one point every 10 cm
LEAF_HALF_W      = 0.06     # diamond leaf half-width
LEAF_HALF_H      = 0.11     # diamond leaf half-height (tip to base)
SEED             = 42
BLEND_OUT        = "//vine_tendril.blend"
GLB_OUT          = "//vine_tendril.glb"


# ── Scene reset ───────────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 24
    bpy.context.scene.frame_set(1)


# ── Materials ─────────────────────────────────────────────────────────────────
def make_materials():
    """Bark-brown stem, forest-green leaf.  Toon-friendly flat colours."""
    mat_stem = bpy.data.materials.new("VineStem")
    mat_stem.use_nodes = True
    bsdf = mat_stem.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.28, 0.18, 0.06, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.85
    bsdf.inputs["Metallic"].default_value   = 0.0
    mat_stem.diffuse_color = (0.28, 0.18, 0.06, 1.0)

    mat_leaf = bpy.data.materials.new("VineLeaf")
    mat_leaf.use_nodes = True
    bsdf2 = mat_leaf.node_tree.nodes["Principled BSDF"]
    bsdf2.inputs["Base Color"].default_value = (0.08, 0.48, 0.12, 1.0)
    bsdf2.inputs["Roughness"].default_value  = 0.55
    bsdf2.inputs["Metallic"].default_value   = 0.0
    mat_leaf.diffuse_color = (0.08, 0.48, 0.12, 1.0)

    return mat_stem, mat_leaf


# ── Leaf template mesh ────────────────────────────────────────────────────────
def make_leaf_mesh() -> bpy.types.Object:
    """Diamond-shaped flat leaf: 4 verts, 2 tris.  Not linked to scene."""
    me = bpy.data.meshes.new("LeafMesh")
    bm = bmesh.new()
    v = [
        bm.verts.new(( 0.0,         0.0,  LEAF_HALF_H)),   # tip
        bm.verts.new(( LEAF_HALF_W, 0.0,  0.0        )),   # right
        bm.verts.new(( 0.0,         0.0, -LEAF_HALF_H)),   # base
        bm.verts.new((-LEAF_HALF_W, 0.0,  0.0        )),   # left
    ]
    bm.faces.new([v[0], v[1], v[2]])
    bm.faces.new([v[0], v[2], v[3]])
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("LeafTemplate", me)
    # Intentionally unlinked: GN ObjectInfo accesses it without scene membership.
    return ob


# ── Bezier vine curves ────────────────────────────────────────────────────────
def make_vine_curves(n: int, seed: int) -> bpy.types.Object:
    """
    Fan of n Bezier splines rising from origin.  Each has 3 control points:
    root (ground), mid (lateral drift), tip (curling outward).
    """
    random.seed(seed)
    cu = bpy.data.curves.new("VineCurves", type="CURVE")
    cu.dimensions  = "3D"
    cu.resolution_u = 12   # smoothness for viewport; resampled in GN anyway

    for i in range(n):
        angle = (i / n) * math.tau * 0.60 - math.pi * 0.28
        dx = math.sin(angle) * 0.25

        sp = cu.splines.new("BEZIER")
        sp.bezier_points.add(2)   # 3 total: root, mid, tip
        pts = sp.bezier_points

        # Root — ground, slight outward placement
        pts[0].co = (dx * 0.3, 0.0, 0.0)
        pts[0].handle_left  = (dx * 0.3 - 0.04, 0.0, -0.08)
        pts[0].handle_right = (dx * 0.3 + 0.04, 0.0,  0.20)
        pts[0].handle_left_type  = "FREE"
        pts[0].handle_right_type = "FREE"

        # Mid — lateral drift and depth variation
        drift = random.uniform(-0.20, 0.20)
        pts[1].co = (
            dx + drift * 0.5,
            random.uniform(-0.08, 0.08),
            random.uniform(0.55, 0.85),
        )
        pts[1].handle_left_type  = "AUTO"
        pts[1].handle_right_type = "AUTO"

        # Tip — upper curl
        pts[2].co = (
            dx * 1.5 + random.uniform(-0.12, 0.12),
            random.uniform(-0.04, 0.04),
            random.uniform(1.25, 1.65),
        )
        pts[2].handle_left_type  = "AUTO"
        pts[2].handle_right_type = "AUTO"

    ob = bpy.data.objects.new("VineStrands", cu)
    bpy.context.scene.collection.objects.link(ob)
    return ob


# ── Geometry Nodes ────────────────────────────────────────────────────────────
def build_gn_tree(mat_stem, mat_leaf, leaf_ob) -> bpy.types.GeometryNodeTree:
    """
    Abbreviated node graph:

    GroupInput ──→ ResampleCurve(64)
                   → StoreNamedAttribute("vine_t", Factor)
                   ├─[A]→ MapRange(vine_t → BASE→TIP radius)
                   │       → SetCurveRadius → CurveToMesh ← Circle(6)
                   │       → SetMaterial(VineStem) → JoinGeometry
                   └─[B]→ CurveToPoints(LENGTH=0.10)
                           → InstanceOnPoints(
                               Selection = NamedAttribute("vine_t") > Leaf_Threshold
                               Instance  = LeafTemplate )
                           → SetMaterial(VineLeaf) → JoinGeometry
    → GroupOutput
    """
    nt    = bpy.data.node_groups.new("VineTendrilGN", "GeometryNodeTree")
    nodes = nt.nodes
    links = nt.links

    # Interface sockets
    nt.interface.new_socket("Geometry",       in_out="OUTPUT", socket_type="NodeSocketGeometry")
    nt.interface.new_socket("Geometry",       in_out="INPUT",  socket_type="NodeSocketGeometry")
    sk = nt.interface.new_socket("Leaf Threshold", in_out="INPUT",  socket_type="NodeSocketFloat")
    sk.default_value = LEAF_THRESHOLD
    sk.min_value, sk.max_value = 0.0, 1.0

    def N(bl_type, x, y):
        n = nodes.new(bl_type)
        n.location = (x, y)
        return n

    ni     = N("NodeGroupInput",                   -1600,  100)
    no     = N("NodeGroupOutput",                   1100,  100)

    resamp = N("GeometryNodeResampleCurve",         -1300,  100)
    resamp.mode = "COUNT"
    resamp.inputs["Count"].default_value = RESAMPLE_COUNT

    sp_par = N("GeometryNodeSplineParameter",       -1300, -100)

    store  = N("GeometryNodeStoreNamedAttribute",  -1000,  100)
    store.data_type = "FLOAT"
    store.domain    = "POINT"
    store.inputs["Name"].default_value = "vine_t"

    # Branch A — taper → stem mesh
    na_a   = N("GeometryNodeInputNamedAttribute",   -750,  250)
    na_a.data_type = "FLOAT"
    na_a.inputs["Name"].default_value = "vine_t"

    mrange = N("ShaderNodeMapRange",                -550,  250)
    mrange.clamp = True
    mrange.inputs["From Min"].default_value = 0.0
    mrange.inputs["From Max"].default_value = 1.0
    mrange.inputs["To Min"].default_value   = STEM_RADIUS_BASE
    mrange.inputs["To Max"].default_value   = STEM_RADIUS_TIP

    s_rad  = N("GeometryNodeSetCurveRadius",        -350,  150)
    circle = N("GeometryNodeCurvePrimitiveCircle",  -350,   -50)
    circle.inputs["Resolution"].default_value = STEM_PROFILE_RES
    circle.inputs["Radius"].default_value     = 1.0  # driven by SetCurveRadius

    c2m    = N("GeometryNodeCurveToMesh",           -100,  150)
    c2m.inputs["Fill Caps"].default_value = False

    sm_st  = N("GeometryNodeSetMaterial",            100,  150)
    sm_st.inputs["Material"].default_value = mat_stem

    # Branch B — leaf instancing
    c2p    = N("GeometryNodeCurveToPoints",         -750,  -200)
    c2p.mode = "LENGTH"
    c2p.inputs["Length"].default_value = LEAF_SPACING

    na_b   = N("GeometryNodeInputNamedAttribute",   -550,  -350)
    na_b.data_type = "FLOAT"
    na_b.inputs["Name"].default_value = "vine_t"

    cmp    = N("FunctionNodeCompare",               -350,  -350)
    cmp.data_type = "FLOAT"
    cmp.operation = "GREATER_THAN"

    oinfo  = N("GeometryNodeObjectInfo",            -550,  -550)
    oinfo.inputs["Object"].default_value    = leaf_ob
    oinfo.transform_space = "ORIGINAL"

    iop    = N("GeometryNodeInstanceOnPoints",      -100,  -350)
    sm_lf  = N("GeometryNodeSetMaterial",            100,  -350)
    sm_lf.inputs["Material"].default_value = mat_leaf

    join   = N("GeometryNodeJoinGeometry",           500,   100)

    # Wire Branch A (stem)
    links.new(ni.outputs["Geometry"],             resamp.inputs["Curve"])
    links.new(resamp.outputs["Curve"],            store.inputs["Geometry"])
    links.new(sp_par.outputs["Factor"],           store.inputs["Value"])
    links.new(na_a.outputs["Attribute"],          mrange.inputs["Value"])
    links.new(mrange.outputs["Result"],           s_rad.inputs["Radius"])
    links.new(store.outputs["Geometry"],          s_rad.inputs["Curve"])
    links.new(s_rad.outputs["Curve"],             c2m.inputs["Curve"])
    links.new(circle.outputs["Curve"],            c2m.inputs["Profile Curve"])
    links.new(c2m.outputs["Mesh"],                sm_st.inputs["Geometry"])
    links.new(sm_st.outputs["Geometry"],          join.inputs["Geometry"])

    # Wire Branch B (leaves)
    links.new(store.outputs["Geometry"],          c2p.inputs["Curve"])
    links.new(na_b.outputs["Attribute"],          cmp.inputs["A"])
    links.new(ni.outputs["Leaf Threshold"],       cmp.inputs["B"])
    links.new(c2p.outputs["Points"],              iop.inputs["Points"])
    links.new(cmp.outputs["Result"],              iop.inputs["Selection"])
    links.new(oinfo.outputs["Geometry"],          iop.inputs["Instance"])
    links.new(iop.outputs["Instances"],           sm_lf.inputs["Geometry"])
    links.new(sm_lf.outputs["Geometry"],          join.inputs["Geometry"])

    links.new(join.outputs["Geometry"],           no.inputs["Geometry"])
    return nt


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    reset_scene()
    mat_stem, mat_leaf = make_materials()
    leaf_ob   = make_leaf_mesh()
    curve_ob  = make_vine_curves(N_CURVES, SEED)
    nt        = build_gn_tree(mat_stem, mat_leaf, leaf_ob)

    mod = curve_ob.modifiers.new("GNVineTendril", "NODES")
    mod.node_group = nt

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_OUT),
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_yup=True,
    )
    print("✓ Vine tendril complete →", GLB_OUT)


if __name__ == "__main__":
    main()

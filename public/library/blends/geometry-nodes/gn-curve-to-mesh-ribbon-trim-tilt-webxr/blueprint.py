"""
GN Curve to Mesh — Trim, Tilt & Radius Ramp: Light Ribbon Prop
Blender 5.1 | Holoflow Studio | CC0 1.0 Universal

Technique: a Bezier S-curve is (1) radius-ramped to taper base→tip,
(2) tilt-twisted to spin the cross-section profile along its length,
(3) trimmed via a [0,1] factor pair — animate Trim End 0→1 for a clean
grow-on reveal without any Simulation Zone, (4) arc-length resampled so
vertices are evenly spaced even after trimming, (5) extruded via Curve to
Mesh with a faceted circular profile. A `ribbon_t` float attribute (stored
by GN, read by the material Attribute node) drives an indigo→amber emission
colour ramp per vertex.

Outputs: hf_light_ribbon.blend + hf_light_ribbon.glb
Source:  docs.blender.org/manual/en/5.1/modeling/geometry_nodes/curve/
Licence: CC-BY-SA 4.0 (Blender Foundation docs); this code CC0 1.0
"""

import bpy
import math

# ── PARAMETERS ─────────────────────────────────────────────────────────────
OBJECT_NAME       = "hf_light_ribbon"
GN_TREE_NAME      = "HF_LightRibbon"
MAT_NAME          = "hf_ribbon_emission"

# Bezier S-curve definition (POSITION mode, world-space coords in metres)
BEZIER_START      = (0.0,  0.0, 0.0)
BEZIER_H1         = (1.4,  0.0, 0.7)   # handle1: pulls base toward +X
BEZIER_H2         = (-1.4, 0.0, 2.1)   # handle2: mirror S-inflection at tip
BEZIER_END        = (0.0,  0.0, 2.8)   # tip 2.8 m above base

# Profile cross-section
PROFILE_VERTS     = 8      # octagonal: faceted but reads as round from distance
RADIUS_BASE       = 0.060  # tube outer radius at spline start (metres)
RADIUS_TIP        = 0.016  # tube outer radius at spline end  (tapers to ~27%)

# Twist: the cross-section profile rotates this many full turns end-to-end
TILT_TURNS        = 1.5    # 1.5 turns = 540° spiral

# Trim: [0,1] range — animate Trim_End from 0.0 to 1.0 to grow the ribbon on
TRIM_START_DEF    = 0.0
TRIM_END_DEF      = 1.0

# Resampling: uniform arc-length spacing AFTER trim
RESAMPLE_COUNT    = 80     # higher = smoother but heavier GLB

# Material
COLOR_BASE_LIN    = (0.09, 0.00, 0.55, 1.0)   # deep indigo  (linear RGB)
COLOR_TIP_LIN     = (1.00, 0.58, 0.00, 1.0)   # warm amber   (linear RGB)
EMISSION_STR      = 4.5

OUTPUT_GLB        = "//hf_light_ribbon.glb"
# ── END PARAMETERS ──────────────────────────────────────────────────────────


def purge():
    bpy.ops.outliner.orphans_purge(do_recursive=True)


def make_material() -> bpy.types.Material:
    """Emission shader reading `ribbon_t` (0..1 along ribbon) via Attribute node."""
    mat = bpy.data.materials.get(MAT_NAME)
    if mat:
        bpy.data.materials.remove(mat)
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial"); out.location  = (600, 0)
    emit = nt.nodes.new("ShaderNodeEmission");        emit.location = (380, 0)
    ramp = nt.nodes.new("ShaderNodeValToRGB");        ramp.location = (140, 0)
    attr = nt.nodes.new("ShaderNodeAttribute");       attr.location = (-140, 0)

    # ribbon_t is a FLOAT stored per POINT by the GN tree; Attribute.Fac reads it
    attr.attribute_name = "ribbon_t"
    attr.attribute_type = "GEOMETRY"

    ramp.color_ramp.elements[0].color = COLOR_BASE_LIN
    ramp.color_ramp.elements[1].color = COLOR_TIP_LIN
    ramp.color_ramp.interpolation = "LINEAR"

    emit.inputs["Strength"].default_value = EMISSION_STR
    mat.blend_method  = "OPAQUE"
    mat.shadow_method = "NONE"  # emission-only: no shadow casting

    nt.links.new(attr.outputs["Fac"],      ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"],    emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def build_gn_tree(mat: bpy.types.Material) -> bpy.types.GeometryNodeTree:
    ng    = bpy.data.node_groups.new(GN_TREE_NAME, "GeometryNodeTree")
    nodes = ng.nodes
    links = ng.links

    def n(bl_type: str, x: float, y: float):
        nd = nodes.new(bl_type)
        nd.location = (x, y)
        return nd

    # ── Interface: group inputs / output ────────────────────────────────────
    ng.interface.new_socket("Geometry",     in_out="OUTPUT", socket_type="NodeSocketGeometry")
    s_ts  = ng.interface.new_socket("Trim Start",    in_out="INPUT", socket_type="NodeSocketFloat")
    s_te  = ng.interface.new_socket("Trim End",      in_out="INPUT", socket_type="NodeSocketFloat")
    s_tt  = ng.interface.new_socket("Tilt Turns",    in_out="INPUT", socket_type="NodeSocketFloat")
    s_pv  = ng.interface.new_socket("Profile Verts", in_out="INPUT", socket_type="NodeSocketInt")
    s_rc  = ng.interface.new_socket("Resample Count",in_out="INPUT", socket_type="NodeSocketInt")
    s_ts.default_value  = TRIM_START_DEF
    s_te.default_value  = TRIM_END_DEF
    s_tt.default_value  = TILT_TURNS
    s_pv.default_value  = PROFILE_VERTS
    s_rc.default_value  = RESAMPLE_COUNT

    gi = n("NodeGroupInput",  -1700, 200)
    go = n("NodeGroupOutput",  1700, 200)

    # ── 1. Bezier S-curve source ─────────────────────────────────────────────
    # POSITION mode: Start, Start Handle, End Handle, End are world-space coords.
    # Resolution=8 is the internal Bezier subdivision used BEFORE ResampleCurve.
    # Keep it modest — ResampleCurve handles the final spacing.
    bezier = n("GeometryNodeCurvePrimitiveBezierSegment", -1400, 200)
    bezier.mode = "POSITION"
    bezier.inputs["Resolution"].default_value      = 8
    bezier.inputs["Start"].default_value           = BEZIER_START
    bezier.inputs["Start Handle"].default_value    = BEZIER_H1
    bezier.inputs["End Handle"].default_value      = BEZIER_H2
    bezier.inputs["End"].default_value             = BEZIER_END

    # ── 2. SplineParameter → radius ramp (applied BEFORE trim) ──────────────
    # WHY before trim: SetCurveRadius bakes a radius value on each control point.
    # TrimCurve interpolates these values when it slices the spline. If you set
    # radius AFTER trim, SplineParameter restarts 0..1 on the trimmed domain —
    # the taper always runs base→tip regardless of where the trim window sits.
    # Setting it before preserves the intended taper in the full-length texture,
    # so a mid-ribbon trim still shows the correct intermediate radius.
    sp_r = n("GeometryNodeSplineParameter", -1100, 400)

    mr = n("ShaderNodeMapRange", -850, 400)
    mr.data_type = "FLOAT"
    mr.inputs["From Min"].default_value = 0.0
    mr.inputs["From Max"].default_value = 1.0
    mr.inputs["To Min"].default_value   = RADIUS_BASE
    mr.inputs["To Max"].default_value   = RADIUS_TIP

    set_r = n("GeometryNodeSetCurveRadius", -600, 200)

    # ── 3. SplineParameter → tilt twist (also applied before trim) ──────────
    # Tilt is an angle in radians stored per spline point. CurveToMesh rotates
    # the profile cross-section by the tilt at each point, creating the spiral
    # twist. Factor × Tilt_Turns × 2π gives the tilt angle in radians (0 at
    # base, Tilt_Turns×2π at tip).
    sp_t  = n("GeometryNodeSplineParameter", -600, 0)
    mt1   = n("ShaderNodeMath", -350, 0)
    mt1.operation = "MULTIPLY"
    mt1.inputs[1].default_value = 2.0 * math.pi   # normalise: Factor→radians for 1 full turn

    mt2   = n("ShaderNodeMath", -100, 0)
    mt2.operation = "MULTIPLY"                      # scale by Tilt_Turns group input

    set_t = n("GeometryNodeSetCurveTilt", -100, 200)

    # ── 4. Trim Curve — parametric [0,1] reveal ──────────────────────────────
    # FACTOR mode: Start and End are normalised 0..1 arc-length fractions.
    # Animate Trim_End from 0.0 to 1.0 for a grow-on without Simulation Zone.
    # Trim Start > 0 simultaneously erases the base — useful for a "snake" that
    # has both a leading head and a retreating tail.
    trim = n("GeometryNodeTrimCurve", 160, 200)
    trim.mode = "FACTOR"

    # ── 5. Resample — uniform arc-length spacing on the TRIMMED curve ────────
    # WHY after trim: a Bezier segment's control-point spacing is uneven (denser
    # near inflection). ResampleCurve after trim gives evenly-spaced vertices on
    # exactly the visible portion, preventing texture stretching near the S-bend.
    resample = n("GeometryNodeResampleCurve", 420, 200)
    resample.mode = "COUNT"

    # ── 6. Store ribbon_t for the material colour ramp ───────────────────────
    # SplineParameter AFTER resample: Factor is now 0..1 across the uniformly
    # spaced resampled spline (not the original unevenly-spaced Bezier points).
    # This means the colour gradient is visually even along the tube length.
    sp_c  = n("GeometryNodeSplineParameter", 420, 0)
    store = n("GeometryNodeStoreNamedAttribute", 680, 200)
    store.inputs["Name"].default_value = "ribbon_t"
    store.data_type = "FLOAT"
    store.domain    = "POINT"

    # ── 7. Profile circle — octagonal cross-section ──────────────────────────
    profile = n("GeometryNodeCurvePrimitiveCircle", 420, -250)
    profile.mode = "POINTS"
    # In POINTS mode, the circle has Vertices (int) and Radius (float) inputs.
    # Radius=1.0 here (unit circle): SetCurveRadius values act as the absolute
    # tube radius in metres because CurveToMesh scales the profile by the
    # per-point radius attribute.
    profile.inputs["Vertices"].default_value = PROFILE_VERTS
    profile.inputs["Radius"].default_value   = 1.0

    # ── 8. Curve to Mesh ─────────────────────────────────────────────────────
    ctm = n("GeometryNodeCurveToMesh", 940, 200)
    # Fill Caps = True inserts a filled polygon at each open end of the trimmed
    # curve. Internally Blender runs a FillCurve on the profile boundary.
    ctm.inputs["Fill Caps"].default_value = True

    # ── 9. Material ──────────────────────────────────────────────────────────
    set_mat = n("GeometryNodeSetMaterial", 1200, 200)
    set_mat.inputs["Material"].default_value = mat

    # ── Wire ─────────────────────────────────────────────────────────────────
    # Radius path
    links.new(bezier.outputs["Curve"],        set_r.inputs["Curve"])
    links.new(sp_r.outputs["Factor"],         mr.inputs["Value"])
    links.new(mr.outputs["Result"],           set_r.inputs["Radius"])
    # Tilt path
    links.new(set_r.outputs["Curve"],         set_t.inputs["Curve"])
    links.new(sp_t.outputs["Factor"],         mt1.inputs[0])
    links.new(mt1.outputs["Value"],           mt2.inputs[1])
    links.new(gi.outputs["Tilt Turns"],       mt2.inputs[0])
    links.new(mt2.outputs["Value"],           set_t.inputs["Tilt"])
    # Trim
    links.new(set_t.outputs["Curve"],         trim.inputs["Curve"])
    links.new(gi.outputs["Trim Start"],       trim.inputs["Start"])
    links.new(gi.outputs["Trim End"],         trim.inputs["End"])
    # Resample
    links.new(trim.outputs["Curve"],          resample.inputs["Curve"])
    links.new(gi.outputs["Resample Count"],   resample.inputs["Count"])
    # Store ribbon_t
    links.new(resample.outputs["Curve"],      store.inputs["Geometry"])
    links.new(sp_c.outputs["Factor"],         store.inputs["Value"])
    # Profile inputs
    links.new(gi.outputs["Profile Verts"],    profile.inputs["Vertices"])
    # CurveToMesh
    links.new(store.outputs["Geometry"],      ctm.inputs["Curve"])
    links.new(profile.outputs["Curve"],       ctm.inputs["Profile Curve"])
    # Output
    links.new(ctm.outputs["Mesh"],            set_mat.inputs["Geometry"])
    links.new(set_mat.outputs["Geometry"],    go.inputs["Geometry"])

    return ng


def build_scene():
    purge()
    mat = make_material()
    ng  = build_gn_tree(mat)

    mesh_data = bpy.data.meshes.new(OBJECT_NAME)
    obj = bpy.data.objects.new(OBJECT_NAME, mesh_data)
    bpy.context.scene.collection.objects.link(obj)

    mod = obj.modifiers.new("HF_LightRibbon", "NODES")
    mod.node_group = ng

    bpy.context.scene.render.fps   = 30
    bpy.context.scene.frame_start  = 1
    bpy.context.scene.frame_end    = 120

    print(f"[gn-curve-to-mesh-ribbon] Built — {OBJECT_NAME} with {GN_TREE_NAME}.")
    return obj


def export_glb(obj: bpy.types.Object):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_yup=True,
        export_animations=False,
    )
    print(f"[gn-curve-to-mesh-ribbon] Exported → {OUTPUT_GLB}")


if __name__ == "__main__":
    obj = build_scene()
    # Uncomment after reviewing the ribbon in the 3D Viewport:
    # export_glb(obj)

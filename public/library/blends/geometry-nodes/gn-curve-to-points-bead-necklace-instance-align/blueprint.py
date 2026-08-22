"""
GN Curve to Points — Parametric Bead Necklace
Count-Mode Arc-Length Sampling + Instance Alignment on Curve Tangent
Blender 5.1  |  CC0  |  Holoflow Studio

TECHNIQUE
  GeometryNodeCurveToPoints (mode=COUNT) divides a closed Bezier curve
  into N arc-length-uniform points.  Each point carries Tangent, Normal,
  and Rotation fields.  FunctionNodeAlignEulerToVector (axis=Y) rotates
  an Euler frame so the instance's Y axis follows the string tangent, so
  barrel, teardrop, or crystal beads thread correctly.  A parallel branch
  passes the same curve through GeometryNodeCurveToMesh with a 6-vertex
  circle profile to build the silk cord.  JoinGeometry merges both.

WHY COUNT over LENGTH mode?
  LENGTH emits one point every N metres — the bead count drifts as the
  necklace radius changes.  COUNT guarantees exactly BEAD_COUNT beads
  regardless of curve size, preserving the 40-bead visual rhythm.  Use
  LENGTH when designing to a physical spec (e.g. 8mm between centres).

WHY ResampleCurve before CurveToPoints?
  A Bezier Circle stores 4 control points; its internal evaluation
  resolution defaults to 12 steps per segment (48 evaluated points for a
  4-segment circle).  At BEAD_COUNT > 48 the arc-length basis clusters
  beads near bezier knots.  ResampleCurve (EVALUATED, Resolution=64)
  raises the poly resolution to 256 points, giving CurveToPoints a
  smooth, cluster-free basis for any bead count up to ~200.

WHY AlignEulerToVector instead of CurveToPoints.Rotation directly?
  CurveToPoints.Rotation is the Frenet-Serret frame (+Y=tangent,
  +Z=principal normal).  For a UV sphere bead the choice is invisible
  (spheres look the same from all angles).  AlignEulerToVector with
  axis=Y makes the threading intent explicit and survives a bead-shape
  swap — swap in a barrel or teardrop mesh and the hole axis stays
  aligned with the string without any node changes.

Outside sources:
  Blender Manual — Curve to Points Node (CC-BY-SA-4.0 — documentation
  reference only, content not reproduced verbatim)
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/
          curve/operations/curve_to_points.html

  blender-scripting (MIT) — Nikolai Janakiev
  https://github.com/njanakiev/blender-scripting
  Bezier curve object construction patterns referenced for bpy setup.
"""

import bpy
import math

# ── Parameters ───────────────────────────────────────────────────────────────
BEAD_COUNT       = 40
BEAD_RADIUS      = 0.08    # BU (scene unit = 1 m → 8 cm bead ≈ 6mm pearl at 0.01 m scale)
STRING_RADIUS    = 0.005   # 5 mm cord cross-section
NECKLACE_RADIUS  = 1.0     # Bezier Circle radius
SCALE_MIN        = 0.75    # random bead scale floor
SCALE_MAX        = 1.25    # random bead scale ceiling
SCALE_SEED       = 7
OUTPUT_GLB       = "//bead_necklace.glb"


def clean():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for ng in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(ng)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)


def make_materials():
    # Pearl — near-white with coat layer for lustre
    mp = bpy.data.materials.new("Mat_Pearl")
    mp.use_nodes = True
    bsdf = mp.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value         = (0.95, 0.92, 0.88, 1.0)
    bsdf.inputs["Roughness"].default_value          = 0.10
    bsdf.inputs["Subsurface Weight"].default_value  = 0.12
    bsdf.inputs["Subsurface Radius"].default_value  = (0.80, 0.70, 0.60)
    bsdf.inputs["Coat Weight"].default_value        = 0.30
    bsdf.inputs["Coat Roughness"].default_value     = 0.05

    # Cord — dark silk, high diffuse roughness
    mc = bpy.data.materials.new("Mat_Cord")
    mc.use_nodes = True
    cord = mc.node_tree.nodes["Principled BSDF"]
    cord.inputs["Base Color"].default_value = (0.04, 0.03, 0.02, 1.0)
    cord.inputs["Roughness"].default_value  = 0.82

    return mp, mc


def _build_gn_tree(mat_pearl, mat_cord):
    ng = bpy.data.node_groups.new("BeadNecklace", 'GeometryNodeTree')

    # ── Interface ─────────────────────────────────────────────────────────────
    ng.interface.new_socket("Geometry",  in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket("Geometry",  in_out='OUTPUT', socket_type='NodeSocketGeometry')

    s_cnt = ng.interface.new_socket("Bead Count",    in_out='INPUT', socket_type='NodeSocketInt')
    s_cnt.default_value, s_cnt.min_value, s_cnt.max_value = BEAD_COUNT, 4, 200

    s_br = ng.interface.new_socket("Bead Radius",   in_out='INPUT', socket_type='NodeSocketFloat')
    s_br.default_value, s_br.min_value, s_br.max_value = BEAD_RADIUS, 0.01, 0.50

    s_sr = ng.interface.new_socket("String Radius", in_out='INPUT', socket_type='NodeSocketFloat')
    s_sr.default_value, s_sr.min_value, s_sr.max_value = STRING_RADIUS, 0.001, 0.05

    ns = ng.nodes
    lk = ng.links

    def N(idname, x, y, **kw):
        nd = ns.new(idname)
        nd.location = (x, y)
        for k, v in kw.items():
            setattr(nd, k, v)
        return nd

    gi = N('NodeGroupInput',  -1100,   0)
    go = N('NodeGroupOutput',  1300,   0)

    # ── String branch ─────────────────────────────────────────────────────────
    # ResampleCurve for smooth arc-length distribution before CurveToMesh
    rs_str = N('GeometryNodeResampleCurve', -800, -250)
    rs_str.mode = 'EVALUATED'
    rs_str.inputs['Resolution'].default_value = 64
    lk.new(gi.outputs['Geometry'], rs_str.inputs['Curve'])

    # Hexagonal cord profile — 6 verts balances round look vs WebXR tri budget
    profile = N('GeometryNodeCurvePrimitiveCircle', -800, -450)
    profile.mode = 'RADIUS'
    profile.inputs['Resolution'].default_value = 6
    lk.new(gi.outputs['String Radius'], profile.inputs['Radius'])

    c2m = N('GeometryNodeCurveToMesh', -450, -350)
    c2m.inputs['Fill Caps'].default_value = False
    lk.new(rs_str.outputs['Curve'],   c2m.inputs['Curve'])
    lk.new(profile.outputs['Curve'],  c2m.inputs['Profile Curve'])

    sm_cord = N('GeometryNodeSetMaterial', -150, -350)
    sm_cord.inputs['Material'].default_value = mat_cord
    lk.new(c2m.outputs['Mesh'], sm_cord.inputs['Geometry'])

    # ── Bead branch ───────────────────────────────────────────────────────────
    # Second ResampleCurve — bead branch shares source curve but needs
    # independent evaluation so modifier inputs don't alias across branches
    rs_bead = N('GeometryNodeResampleCurve', -800, 300)
    rs_bead.mode = 'EVALUATED'
    rs_bead.inputs['Resolution'].default_value = 64
    lk.new(gi.outputs['Geometry'], rs_bead.inputs['Curve'])

    # CurveToPoints COUNT — arc-length-uniform bead positions
    c2p = N('GeometryNodeCurveToPoints', -450, 300)
    c2p.mode = 'COUNT'
    lk.new(rs_bead.outputs['Curve'],     c2p.inputs['Curve'])
    lk.new(gi.outputs['Bead Count'],     c2p.inputs['Count'])

    # Bead template — low-poly UV Sphere (8×6 = 48 verts, 48 quads)
    bead = N('GeometryNodeMeshUVSphere', -450, 550)
    bead.inputs['Segments'].default_value = 8
    bead.inputs['Rings'].default_value    = 6
    lk.new(gi.outputs['Bead Radius'], bead.inputs['Radius'])

    # Align Y axis to string tangent — makes threading axis explicit
    # pivot_axis=Z prevents gimbal flip on highly curved sections
    align = N('FunctionNodeAlignEulerToVector', -150, 450)
    align.axis        = 'Y'
    align.pivot_axis  = 'Z'
    lk.new(c2p.outputs['Tangent'], align.inputs['Vector'])

    # Per-bead random uniform scale (0.75 – 1.25×) seeds from Blender's
    # built-in element ID so variation is deterministic across frame changes
    rand = N('FunctionNodeRandomValue', -150, 300)
    rand.data_type = 'FLOAT'
    rand.inputs['Min'].default_value  = SCALE_MIN
    rand.inputs['Max'].default_value  = SCALE_MAX
    rand.inputs['Seed'].default_value = SCALE_SEED

    # Broadcast scalar scale to XYZ for uniform (non-deforming) instance scale
    cxyz = N('ShaderNodeCombineXYZ', 100, 300)
    lk.new(rand.outputs['Value'], cxyz.inputs['X'])
    lk.new(rand.outputs['Value'], cxyz.inputs['Y'])
    lk.new(rand.outputs['Value'], cxyz.inputs['Z'])

    iop = N('GeometryNodeInstanceOnPoints', 350, 380)
    lk.new(c2p.outputs['Points'],      iop.inputs['Points'])
    lk.new(bead.outputs['Mesh'],       iop.inputs['Instance'])
    lk.new(align.outputs['Rotation'],  iop.inputs['Rotation'])
    lk.new(cxyz.outputs['Vector'],     iop.inputs['Scale'])

    sm_bead = N('GeometryNodeSetMaterial', 600, 500)
    sm_bead.inputs['Material'].default_value = mat_pearl
    lk.new(iop.outputs['Instances'], sm_bead.inputs['Geometry'])

    # RealizeInstances collapses the instance tree to real geometry
    # Required for GLB export and for SetMaterial to reach instance faces
    real = N('GeometryNodeRealizeInstances', 850, 400)
    lk.new(sm_bead.outputs['Geometry'], real.inputs['Geometry'])

    # ── Merge ─────────────────────────────────────────────────────────────────
    join = N('GeometryNodeJoinGeometry', 1050, 0)
    lk.new(real.outputs['Geometry'],       join.inputs['Geometry'])
    lk.new(sm_cord.outputs['Geometry'],    join.inputs['Geometry'])
    lk.new(join.outputs['Geometry'],       go.inputs['Geometry'])

    return ng


def build_scene():
    clean()
    mat_pearl, mat_cord = make_materials()

    # Bezier Circle — necklace path, rotated to hang in the XZ plane
    bpy.ops.curve.primitive_bezier_circle_add(radius=NECKLACE_RADIUS)
    path = bpy.context.active_object
    path.name = "NecklacePath"
    path.rotation_euler.x = math.radians(90)
    bpy.ops.object.transform_apply(rotation=True)

    ng = _build_gn_tree(mat_pearl, mat_cord)
    mod = path.modifiers.new("BeadNecklaceGN", 'NODES')
    mod.node_group = ng

    # Camera
    bpy.ops.object.camera_add(location=(0, -4.5, 0.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(80), 0, 0)
    bpy.context.scene.camera = cam

    # HDRI-style sun light
    bpy.ops.object.light_add(type='SUN', location=(3, -2, 4))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.rotation_euler = (math.radians(45), 0, math.radians(30))

    return path


def export_glb():
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format='GLB',
        use_selection=False,
        export_apply=True,           # bake GN modifier — required for GLB
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_normals=True,
        export_materials='EXPORT',
        export_yup=True,
    )
    print(f"[holoflow] {OUTPUT_GLB} exported")


if __name__ == "__main__":
    build_scene()
    export_glb()

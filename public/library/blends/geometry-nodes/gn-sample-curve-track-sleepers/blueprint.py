"""
GN Sample Curve Node — Arc-Length Equidistant Track Sleepers on a Bezier Oval
Blender 5.1  ·  CC0  ·  Holoflow Studio

Technique: GeometryNodeSampleCurve evaluates a Bezier oval at explicit arc-length
positions (mode='LENGTH'), returning a Rotation socket (quaternion, Blender 4.x+)
that encodes tangent + normal + binormal.  Wiring that Rotation output directly into
GeometryNodeInstanceOnPoints.Rotation places 36 railway sleepers at physically
equidistant arc-length positions with mathematically correct track-facing orientation
— no Align-Euler-to-Vector node needed.

WHY Sample Curve and NOT Resample Curve + Instance on Points:
  Resample Curve(count=36) distributes 36 points evenly in PARAMETER space, not
  arc-length.  On a curve with non-uniform curvature (like an oval: tight at the
  short-axis bends, loose along the long sides) parameter-space sampling clusters
  more points into tight bends and spreads them out on the long straights.
  Sample Curve(mode='LENGTH') samples at EQUAL arc-length distances: each sleeper
  is exactly SLEEPER_SPACING metres from the next along the rail, regardless of
  local curvature.  This matches physical track geometry and avoids the visual
  "accordion" compression artefact.

WHY Sample Curve and NOT Curve to Mesh:
  Curve to Mesh sweeps a profile geometry along the curve, creating ONE connected
  mesh.  It cannot produce separate instances with per-sleeper orientation.
  Sample Curve produces per-sample data (Position, Rotation) that feeds Instance
  on Points — each sleeper is an independent instance, efficient for GLB instancing.

Is Valid socket: Sample Curve returns Is Valid=False for any sample position that
falls outside [0, curve_length].  The blueprint uses 40 sample points and removes
the 2–3 out-of-range ones via DeleteGeometry(Selection=Is Valid), making the
count parameter forgiving without manual perimeter arithmetic.

Outside sources:
  Blender Manual — Sample Curve Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/sample/sample_curve.html
    CC-BY-SA 4.0 · Blender Documentation Team
  blender-scripting — curve + GN scripting patterns
    https://github.com/njanakiev/blender-scripting
    MIT · Nicolas Janakiev
"""

import bpy
import math

# ── Parameters ─────────────────────────────────────────────────────────────────
TRACK_RADIUS_X   = 4.0      # oval semi-axis X (long side, metres)
TRACK_RADIUS_Y   = 2.5      # oval semi-axis Y (short side, metres)
SLEEPER_SPACING  = 0.56     # arc-length between sleeper centres (metres); ~HO 1:87 scale
SLEEPER_COUNT    = 40       # point pool — slightly overshoots perimeter; Is Valid clips excess
SLEEPER_WIDTH    = 2.40     # cross-track long axis (perpendicular to travel, metres)
SLEEPER_HEIGHT   = 0.14     # sleeper depth top-to-bottom (metres)
SLEEPER_DEPTH    = 0.22     # along-track slim face (metres)

WOOD_COL   = (0.28, 0.16, 0.09, 1.0)   # dark weathered oak
ROUGH      = 0.88
OBJ_PREFIX = "SL_"


# ── Helpers ────────────────────────────────────────────────────────────────────
def _cleanup() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith(OBJ_PREFIX) or ob.name.startswith("track_"):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith(OBJ_PREFIX) or me.name.startswith("SleepersOut"):
            bpy.data.meshes.remove(me)
    for crv in list(bpy.data.curves):
        if crv.name.startswith("track_") or crv.name.startswith(OBJ_PREFIX):
            bpy.data.curves.remove(crv)
    for ng in list(bpy.data.node_groups):
        if ng.name.startswith("TrackSleeper"):
            bpy.data.node_groups.remove(ng)
    for ma in list(bpy.data.materials):
        if ma.name.startswith(OBJ_PREFIX):
            bpy.data.materials.remove(ma)


def _nd(ng, bl_id, label, x, y):
    n = ng.nodes.new(bl_id)
    n.label = label
    n.location = (x, y)
    return n


def _lk(ng, a, b):
    ng.links.new(a, b)


# ── Oval Bezier curve ──────────────────────────────────────────────────────────
def build_oval_track() -> bpy.types.Object:
    """4-control-point Bezier ellipse via the 0.5523 cubic approximation."""
    crv = bpy.data.curves.new("track_oval", 'CURVE')
    crv.dimensions = '3D'
    crv.resolution_u = 16
    crv.bevel_depth = 0.0      # no pipe extrusion on the track curve itself

    spl = crv.splines.new('BEZIER')
    spl.use_cyclic_u = True

    H = 0.5522847498  # cubic Bezier circle-approximation constant

    # (co, handle_left, handle_right) for each of the 4 cardinal points
    rx, ry = TRACK_RADIUS_X, TRACK_RADIUS_Y
    pts = [
        # right
        ((rx,  0,  0), (rx,  -H*ry, 0), (rx,   H*ry, 0)),
        # top
        ((0,  ry,  0), (H*rx,  ry,  0), (-H*rx, ry,  0)),
        # left
        ((-rx, 0,  0), (-rx,  H*ry, 0), (-rx, -H*ry, 0)),
        # bottom
        ((0, -ry,  0), (-H*rx, -ry, 0), (H*rx, -ry,  0)),
    ]
    spl.bezier_points.add(3)   # adds 3 → total 4
    for bpt, (co, hl, hr) in zip(spl.bezier_points, pts):
        bpt.co             = co
        bpt.handle_left    = hl
        bpt.handle_right   = hr
        bpt.handle_left_type  = 'FREE'
        bpt.handle_right_type = 'FREE'

    obj = bpy.data.objects.new("track_oval_curve", crv)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ── Wood material ──────────────────────────────────────────────────────────────
def build_sleeper_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(f"{OBJ_PREFIX}WoodSleeper")
    mat.use_nodes = True
    mat.surface_render_method = 'FORWARD'
    ns = mat.node_tree.nodes
    ns.clear()

    n_out  = ns.new('ShaderNodeOutputMaterial');  n_out.location  = (300, 0)
    n_bsdf = ns.new('ShaderNodeBsdfPrincipled');  n_bsdf.location = (0, 0)
    n_bsdf.inputs['Base Color'].default_value = WOOD_COL
    n_bsdf.inputs['Roughness'].default_value  = ROUGH
    mat.node_tree.links.new(n_bsdf.outputs['BSDF'], n_out.inputs['Surface'])
    return mat


# ── Geometry Nodes track sleeper tree ─────────────────────────────────────────
def build_gn_track(track_obj: bpy.types.Object,
                   mat: bpy.types.Material) -> bpy.types.Object:
    me  = bpy.data.meshes.new("SleepersOut")
    ob  = bpy.data.objects.new(f"{OBJ_PREFIX}TrackSleepers", me)
    bpy.context.scene.collection.objects.link(ob)

    mod     = ob.modifiers.new("TrackSleepers", 'NODES')
    ng      = bpy.data.node_groups.new("TrackSleeperGN", 'GeometryNodeTree')
    mod.node_group = ng

    ni   = ng.interface
    ns   = ng.nodes
    lks  = ng.links

    ni.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    def nd(bl_id, lbl, x, y): return _nd(ng, bl_id, lbl, x, y)
    def lk(a, b):             return _lk(ng, a, b)

    go = nd('NodeGroupOutput', 'Out', 1200, 0)

    # ── ObjectInfo: pull curve geometry into the tree ──────────────────────────
    # transform_space='ORIGINAL' preserves the curve's world-space shape exactly.
    # 'RELATIVE' would re-evaluate the curve relative to the GN object origin,
    # shifting every sample position if the two objects are not co-located.
    n_obj = nd('GeometryNodeObjectInfo', 'Oval Curve', -1400, 100)
    n_obj.inputs[0].default_value = track_obj
    n_obj.transform_space = 'ORIGINAL'

    # ── MeshLine: N point pool, all at origin ──────────────────────────────────
    # WHY N=SLEEPER_COUNT not exactly floor(perimeter/spacing):
    # We overshoot slightly so Is Valid at the end clips the excess automatically.
    # No manual perimeter arithmetic needed.
    n_ml = nd('GeometryNodeMeshLine', 'Point Pool', -1200, 0)
    n_ml.mode       = 'OFFSET'
    n_ml.count_mode = 'TOTAL'
    n_ml.inputs['Count'].default_value  = SLEEPER_COUNT
    n_ml.inputs['Offset'].default_value = (0.0, 0.0, 0.0)

    # ── Arc-length per point: Index × SLEEPER_SPACING ─────────────────────────
    n_idx = nd('GeometryNodeInputIndex', 'Index', -1200, -200)
    n_mul = nd('ShaderNodeMath',         'Arc Len', -1000, -200)
    n_mul.operation = 'MULTIPLY'
    n_mul.inputs[1].default_value = SLEEPER_SPACING
    lk(n_idx.outputs['Index'], n_mul.inputs[0])

    # ── Sample Curve: evaluate oval at each arc-length position ───────────────
    # mode='LENGTH': inputs[2] is arc-length in metres (not 0-1 parameter).
    # Rotation output (index 4): Rotation socket type (quaternion, Blender 5.1).
    #   Convention: +Z aligned to tangent, +Y to curve normal, +X to binormal.
    #   Sleeper cube is built Width×Height×Depth = X×Y×Z, so when the Rotation
    #   aligns +X to the binormal (perpendicular to track), the 2.4m long face
    #   spans the full gauge width — exactly what a railway sleeper should do.
    # Is Valid output (index 7): False when arc_length > total_curve_length.
    n_sc = nd('GeometryNodeSampleCurve', 'Sample Curve', -800, 100)
    n_sc.data_type = 'FLOAT'
    n_sc.mode      = 'LENGTH'
    lk(n_obj.outputs['Geometry'], n_sc.inputs['Curves'])
    lk(n_mul.outputs['Value'],   n_sc.inputs[2])  # index 2 = 'Length' in LENGTH mode

    # ── Set Position: move MeshLine points to their curve sample positions ─────
    n_sp = nd('GeometryNodeSetPosition', 'Set Pos', -600, 0)
    lk(n_ml.outputs['Mesh'],         n_sp.inputs['Geometry'])
    lk(n_sc.outputs['Position'],     n_sp.inputs['Position'])

    # ── DeleteGeometry: cull out-of-range samples ──────────────────────────────
    # Is Valid=False → position is undefined (typically (0,0,0)), rotation is
    # identity.  Keeping them would spike random sleepers to world origin.
    # Selection socket: True = keep, False = delete.
    n_del = nd('GeometryNodeDeleteGeometry', 'Cull Invalid', -400, 0)
    n_del.domain = 'POINT'
    n_del.mode   = 'ALL'
    lk(n_sp.outputs['Geometry'],    n_del.inputs['Geometry'])
    lk(n_sc.outputs[7],             n_del.inputs['Selection'])  # Is Valid

    # ── Sleeper cross-section mesh ─────────────────────────────────────────────
    # Size = (Width, Height, Depth) → cube from -Size/2 to +Size/2 in each axis.
    # X = 2.4m (cross-track, long face), Y = 0.14m (up), Z = 0.22m (along track).
    # When Sample Curve Rotation maps +X → binormal: the 2.4m axis is perpendicular
    # to the track, Y faces upward, Z faces the direction of travel — correct.
    n_cub = nd('GeometryNodeMeshCube', 'Sleeper Box', -600, -300)
    n_cub.inputs[0].default_value = (SLEEPER_WIDTH, SLEEPER_HEIGHT, SLEEPER_DEPTH)

    # ── Instance on Points: place sleepers with curve rotation ─────────────────
    # Rotation input (index 5 in Blender 5.x): NodeSocketRotation — accepts the
    # quaternion directly from SampleCurve.Rotation.  Prior to Blender 4.0 this
    # socket accepted only Euler vectors and required an Align Euler to Vector
    # intermediary node.  The Rotation socket type eliminates that workaround.
    n_iop = nd('GeometryNodeInstanceOnPoints', 'Instance', -200, 0)
    lk(n_del.outputs['Geometry'],   n_iop.inputs['Points'])
    lk(n_cub.outputs['Mesh'],       n_iop.inputs['Instance'])
    lk(n_sc.outputs[4],             n_iop.inputs[5])  # Rotation → Rotation

    # ── Set Material + Realise ─────────────────────────────────────────────────
    n_sma = nd('GeometryNodeSetMaterial', 'Wood Mat', 0, 0)
    n_sma.inputs[2].default_value = mat
    lk(n_iop.outputs['Instances'], n_sma.inputs['Geometry'])

    # RealizeInstances required for GLB export: Draco compresses vertex buffers
    # of realized meshes only; instanced geometry is referenced by transform list
    # and left uncompressed unless realized first.
    n_rl = nd('GeometryNodeRealizeInstances', 'Realise', 200, 0)
    lk(n_sma.outputs['Geometry'],  n_rl.inputs['Geometry'])
    lk(n_rl.outputs['Geometry'],   go.inputs['Geometry'])

    return ob


# ── Camera + scene setup ───────────────────────────────────────────────────────
def _setup_scene(track_obj: bpy.types.Object) -> None:
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.frame_start, scene.frame_end = 1, 120
    scene.render.fps = 24

    if 'Camera' not in bpy.data.objects:
        bpy.ops.object.camera_add(location=(0, -14, 9))
    cam = bpy.data.objects['Camera']
    cam.rotation_euler = (math.radians(50), 0, 0)
    scene.camera = cam

    if 'Light' not in bpy.data.objects:
        bpy.ops.object.light_add(type='SUN', location=(4, -4, 10))
    sun = bpy.data.objects.get('Light') or bpy.data.objects['Sun']
    sun.data.energy = 4.0


# ── Entry point ────────────────────────────────────────────────────────────────
def main() -> None:
    _cleanup()
    track_obj = build_oval_track()
    mat       = build_sleeper_material()
    ob        = build_gn_track(track_obj, mat)
    _setup_scene(track_obj)
    track_obj.hide_viewport = True   # hide the guide curve — sleepers are the output
    track_obj.hide_render   = True
    print(f"[SampleCurve] Done — '{ob.name}' in scene.")


if __name__ == '__main__':
    main()

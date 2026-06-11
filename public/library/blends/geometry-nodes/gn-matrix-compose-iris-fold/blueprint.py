"""
GN Compose Matrix — Procedural Iris Fold (N-Petal Fan)  (Blender 5.1)
blueprint.py — run via Text Editor ▸ Run Script, or:
               blender --background --python blueprint.py

WHY MATRIX NODES OVER ROTATE INSTANCES
  Blender 4.3 promoted the Matrix socket from experimental to stable, giving
  Geometry Nodes a proper 4×4 homogeneous transform.  The earlier
  RotateInstances node works only with Euler/quaternion rotations applied
  relative to the instance pivot — you cannot compose two successive rotations
  in different frames without nested groups or cunning pivots.  With
  Compose Matrix + Multiply Matrices you express M_i = M_azim × M_fold in a
  single wire; matrix multiplication handles the frame-change algebra that
  would otherwise require two rotation nodes and a CombineXYZ gymnastics act.

IRIS FOLD GEOMETRY
  N flat rectangular panels share a common root edge at the world origin.
  Panel i is oriented at azimuthal angle φ_i = 2π × i / N around the Z axis
  and folds upward by θ around the panel's local X axis (the fold hinge runs
  along local ±X, which passes through the world origin for all panels).

  Per-instance transform M_i (matrix product, right-to-left application):
    M_fold  = ComposeMatrix( Rotation = AxisAngleToRotation( (1,0,0), θ ) )
    M_azim  = ComposeMatrix( Rotation = AxisAngleToRotation( (0,0,1), φ_i ) )
    M_i     = M_azim × M_fold   ← fold first, then orient radially

  Why M_azim × M_fold and not the reverse?  Matrix multiplication is NOT
  commutative.  M_azim × M_fold reads: "first apply M_fold in the current
  frame, then apply M_azim in the resulting frame."  We want the fold to
  happen in the panel's LOCAL frame (before any radial rotation), so M_fold
  goes on the right.  Reversing the order folds around the WORLD X axis
  (all panels tip in the same world direction — wrong for an iris shape).

OUTSIDE SOURCES
  Blender Manual — Matrix Nodes (Geometry Nodes)
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/matrix/
    CC-BY-SA 4.0 · Blender Foundation
  glTF 2.0 Specification — Node Hierarchy Transforms
    https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#transformations
    Apache-2.0 · Khronos Group
  blender-scripting — MIT  Nicolas Janakiev
    https://github.com/njanakiev/blender-scripting
"""

import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────
N_PANELS     = 8       # number of petals (8 is visually balanced; power of 2)
PANEL_W      = 0.06    # panel width (local X extent), m
PANEL_L      = 0.50    # panel length root→tip, m
FOLD_START   = 0.0     # fold angle at frame 1 (radians)
FOLD_END     = math.pi / 2.0   # fold angle at end frame (iris fully closed)
ANIM_FRAMES  = 60      # 2.5 s at 24 fps

OUTPUT_BLEND = "//iris_fold.blend"
OUTPUT_GLB   = "//iris_fold.glb"

# Matrix node type strings — stable in Blender 4.3+ / 5.x.
# If a node is missing, Blender will raise RuntimeError; verify names via
# Geometry Nodes editor Add menu ▸ Utilities ▸ Matrix.
_T_AXIS_ANGLE  = 'FunctionNodeAxisAngleToRotation'
_T_COMPOSE_MAT = 'GeometryNodeComposeMatrix'
_T_MULT_MAT    = 'GeometryNodeMultiplyMatrices'
_T_SET_XFORM   = 'GeometryNodeSetInstanceTransform'
# ─────────────────────────────────────────────────────────────────────────────


def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.node_groups, bpy.data.materials):
        for item in list(pool):
            pool.remove(item)


def make_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("PetalMat")
    mat.use_nodes = True
    pb = mat.node_tree.nodes.get("Principled BSDF")
    pb.inputs['Base Color'].default_value = (0.88, 0.72, 0.30, 1.0)  # warm gold
    pb.inputs['Roughness'].default_value  = 0.45
    pb.inputs['Metallic'].default_value   = 0.0
    return mat


def build_gn_tree() -> bpy.types.GeometryNodeTree:
    """
    Self-contained GN tree — no Geometry input, builds everything internally.

    Node pipeline:
      MeshGrid(W, L) + TransformGeometry(Y=L/2)
            ↓ panel geometry (root at local origin)
      Points(Count=N)
            ↓ N points at world origin
      InstanceOnPoints(Instance=panel, Points=points)
            ↓ N instances, all at origin / identity transform
      [per-instance field chain: Index → phi → M_azim, FOLD_ANGLE → M_fold
       → MultiplyMatrices → M_i]
      SetInstanceTransform(Transform=M_i)
            ↓
      SetMaterial → RealizeInstances → GroupOutput
    """
    ng  = bpy.data.node_groups.new("iris_fold_gn", 'GeometryNodeTree')
    ni  = ng.interface
    nds = ng.nodes
    lks = ng.links

    # ── Group interface ──────────────────────────────────────────────────────
    s_n    = ni.new_socket("N Panels",   in_out='INPUT',  socket_type='NodeSocketInt')
    s_fold = ni.new_socket("Fold Angle", in_out='INPUT',  socket_type='NodeSocketFloat')
    s_mat  = ni.new_socket("Material",   in_out='INPUT',  socket_type='NodeSocketMaterial')
    ni.new_socket("Geometry",            in_out='OUTPUT', socket_type='NodeSocketGeometry')
    s_n.default_value    = N_PANELS
    s_fold.default_value = FOLD_START
    # Subtype for Fold Angle: ANGLE so the Group Properties slider shows degrees.
    # In Blender 4.x NodeSocketFloat supports subtype via interface attribute.
    try:
        s_fold.subtype = 'ANGLE'
    except AttributeError:
        pass  # non-critical; slider still works as radians

    def nd(t, lbl="", loc=(0, 0)):
        n = nds.new(t); n.label = lbl; n.location = loc; return n

    def math_nd(op, loc, val_b=None):
        n = nd('ShaderNodeMath', op.title(), loc)
        n.operation = op
        if val_b is not None:
            n.inputs[1].default_value = val_b
        return n

    # ── Group Input / Output ────────────────────────────────────────────────
    n_in  = nd('NodeGroupInput',  loc=(-1400, 0))
    n_out = nd('NodeGroupOutput', loc=(1400, 0))

    # ── Panel mesh (built inside the tree) ──────────────────────────────────
    # Grid centred at origin (Y: -L/2..+L/2); shift +L/2 so root is at Y=0.
    n_grid = nd('GeometryNodeMeshGrid', 'Panel Mesh', loc=(-1100, 300))
    n_grid.inputs['Size X'].default_value     = PANEL_W
    n_grid.inputs['Size Y'].default_value     = PANEL_L
    n_grid.inputs['Vertices X'].default_value = 2
    n_grid.inputs['Vertices Y'].default_value = 4  # subdivide for smooth fold preview

    n_xf = nd('GeometryNodeTransformGeometry', 'Root→Origin', loc=(-880, 300))
    n_xf.inputs['Translation'].default_value = (0.0, PANEL_L / 2.0, 0.0)

    # ── Point cloud: N points all at origin ─────────────────────────────────
    n_pts = nd('GeometryNodePoints', 'N Points', loc=(-880, 0))
    # Count driven by Group Input socket; set local default as fallback.
    n_pts.inputs['Count'].default_value  = N_PANELS
    n_pts.inputs['Radius'].default_value = 0.001

    # ── InstanceOnPoints ─────────────────────────────────────────────────────
    n_iop = nd('GeometryNodeInstanceOnPoints', 'Place Panels', loc=(-560, 0))

    # ── Index → phi (azimuthal angle per instance) ───────────────────────────
    # Index is integer; ShaderNodeMath DIVIDE promotes to float implicitly.
    n_idx = nd('GeometryNodeInputIndex', 'Index', loc=(-1100, -200))
    n_div = math_nd('DIVIDE', loc=(-880, -200), val_b=float(N_PANELS))
    n_tau = math_nd('MULTIPLY', loc=(-660, -200), val_b=math.tau)  # 2π

    # ── Fold rotation: AxisAngle(X, θ) → ComposeMatrix ──────────────────────
    n_aa_fold = nd(_T_AXIS_ANGLE, 'Fold AA', loc=(-880, -400))
    n_aa_fold.inputs['Axis'].default_value  = (1.0, 0.0, 0.0)  # local X = fold hinge

    n_cm_fold = nd(_T_COMPOSE_MAT, 'M_fold', loc=(-560, -400))
    # Translation and Scale default to (0,0,0) and (1,1,1) — pure rotation matrix.

    # ── Azimuth rotation: AxisAngle(Z, phi) → ComposeMatrix ─────────────────
    n_aa_azim = nd(_T_AXIS_ANGLE, 'Azim AA', loc=(-440, -200))
    n_aa_azim.inputs['Axis'].default_value  = (0.0, 0.0, 1.0)  # world Z

    n_cm_azim = nd(_T_COMPOSE_MAT, 'M_azim', loc=(-200, -200))

    # ── M_i = M_azim × M_fold ────────────────────────────────────────────────
    n_mm = nd(_T_MULT_MAT, 'M_i = M_azim×M_fold', loc=(60, -200))

    # ── SetInstanceTransform ─────────────────────────────────────────────────
    n_sit = nd(_T_SET_XFORM, 'Set Transform', loc=(300, 0))

    # ── Material + Realise ───────────────────────────────────────────────────
    n_smat = nd('GeometryNodeSetMaterial', 'Set Mat', loc=(600, 0))
    n_real = nd('GeometryNodeRealizeInstances', 'Realise', loc=(900, 0))

    # ── Wires: panel mesh chain ──────────────────────────────────────────────
    lks.new(n_grid.outputs['Mesh'], n_xf.inputs['Geometry'])
    lks.new(n_xf.outputs['Geometry'], n_iop.inputs['Instance'])

    # ── Wires: point cloud ───────────────────────────────────────────────────
    lks.new(n_in.outputs['N Panels'], n_pts.inputs['Count'])
    lks.new(n_pts.outputs['Geometry'], n_iop.inputs['Points'])

    # ── Wires: phi field chain ───────────────────────────────────────────────
    lks.new(n_idx.outputs['Index'], n_div.inputs[0])
    lks.new(n_in.outputs['N Panels'], n_div.inputs[1])
    lks.new(n_div.outputs['Value'], n_tau.inputs[0])
    lks.new(n_tau.outputs['Value'], n_aa_azim.inputs['Angle'])

    # ── Wires: fold matrix chain ─────────────────────────────────────────────
    lks.new(n_in.outputs['Fold Angle'], n_aa_fold.inputs['Angle'])
    lks.new(n_aa_fold.outputs['Rotation'], n_cm_fold.inputs['Rotation'])

    # ── Wires: azimuth matrix chain ──────────────────────────────────────────
    lks.new(n_aa_azim.outputs['Rotation'], n_cm_azim.inputs['Rotation'])

    # ── Wires: multiply matrices ─────────────────────────────────────────────
    # Sockets by index: input[0]=first matrix, input[1]=second matrix.
    lks.new(n_cm_azim.outputs['Matrix'], n_mm.inputs[0])
    lks.new(n_cm_fold.outputs['Matrix'], n_mm.inputs[1])

    # ── Wires: geometry path ─────────────────────────────────────────────────
    lks.new(n_iop.outputs['Instances'], n_sit.inputs['Instances'])
    lks.new(n_mm.outputs['Matrix'], n_sit.inputs['Transform'])
    lks.new(n_sit.outputs['Instances'], n_smat.inputs['Geometry'])
    lks.new(n_in.outputs['Material'], n_smat.inputs[2])
    lks.new(n_smat.outputs['Geometry'], n_real.inputs[0])
    lks.new(n_real.outputs['Geometry'], n_out.inputs['Geometry'])

    return ng


def make_scaffold_object(ng: bpy.types.GeometryNodeTree,
                         mat: bpy.types.Material) -> bpy.types.Object:
    me  = bpy.data.meshes.new("IrisFold")
    obj = bpy.data.objects.new("IrisFold", me)
    bpy.context.collection.objects.link(obj)
    mod = obj.modifiers.new("IrisFold", 'NODES')
    mod.node_group = ng
    mod["Input_3"] = mat   # Material socket — index may vary; fallback below
    try:
        mod["Material"] = mat
    except Exception:
        pass
    return obj


def keyframe_fold(obj: bpy.types.Object) -> None:
    """Animate Fold Angle socket from FOLD_START to FOLD_END."""
    mod = obj.modifiers["IrisFold"]
    # The socket identifier is the panel-order index (Input_2 = Fold Angle).
    # In Blender 4.x node groups, modifier inputs are keyed by socket identifier.
    fold_id = None
    for item in obj.modifiers["IrisFold"].node_group.interface.items_tree:
        if item.name == "Fold Angle":
            fold_id = item.identifier
            break
    if fold_id is None:
        print("WARNING: could not locate 'Fold Angle' socket identifier.")
        return

    scene = bpy.context.scene
    scene.frame_set(1)
    mod[fold_id] = FOLD_START
    mod.keyframe_insert(data_path=f'["{fold_id}"]', frame=1)

    scene.frame_set(ANIM_FRAMES)
    mod[fold_id] = FOLD_END
    mod.keyframe_insert(data_path=f'["{fold_id}"]', frame=ANIM_FRAMES)

    # Ease-in/ease-out: set interpolation to BEZIER on both keys.
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'


def export_glb() -> None:
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format='GLB',
        export_apply=True,
        export_animations=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )


def main() -> None:
    clear_scene()

    mat = make_material()
    ng  = build_gn_tree()
    obj = make_scaffold_object(ng, mat)
    keyframe_fold(obj)

    scene = bpy.context.scene
    scene.frame_start, scene.frame_end = 1, ANIM_FRAMES
    scene.frame_set(1)

    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
    export_glb()
    print("✓ iris_fold.blend  ✓ iris_fold.glb")


if __name__ == "__main__":
    main()

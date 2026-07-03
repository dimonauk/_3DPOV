"""
GN Index of Nearest — 1-NN Circuit Board Panel (Blender 5.1)

Technique: Index of Nearest (GeometryNodeIndexOfNearest) runs inside the
POINT domain of a Distribute Points on Faces scatter. For each scatter
point P_i it returns the index of the nearest other scatter point P_j.
Evaluate at Index reads P_j's position. A unit Mesh Line instance is then
stamped at P_i, stretched along X by distance(P_i, P_j) and rotated by
Align Euler to Vector so its tip lands exactly at P_j. Realize Instances
materialises the edge set; Mesh to Curve → Curve to Mesh sweeps an
octagonal tube profile. ICO sphere pads at each P_i complete the board.

WHY unit-line instancing:
  Instancing on Points applies:  world_pos = P_i + R @ (scale * local_pos)
  With scale = (dist, 1, 1) and R aligning +X to direction:
    local_pos (0,0,0) → P_i        (tail of edge) ✓
    local_pos (1,0,0) → P_i + dist * direction = P_j  (head) ✓

Parameter table at top — change here, nowhere else.
"""

import bpy
import math
import os

# ── Parameters ────────────────────────────────────────────────────────────────
PLANE_SIZE     = 2.0      # substrate width/height, metres
PLANE_CUTS     = 4        # subdivide cuts before distribute (= 16² = 256 source faces)
POINT_DENSITY  = 160.0    # points/m² → ~640 points on 2×2 plane
POINT_SEED     = 42
MIN_DIST_SKIP  = 0.0002   # metres: skip self in Index of Nearest (< average spacing)
TUBE_RADIUS    = 0.005    # trace tube radius, metres
TUBE_SIDES     = 6
PAD_RADIUS     = 0.018    # node-pad sphere radius, metres
PAD_SUBDIV     = 2        # ICO sphere subdivision
EMIT_COLOUR    = (0.05, 0.95, 0.28, 1.0)   # circuit-green RGBA
EMIT_STRENGTH  = 3.5
EXPORT_PATH    = "//output/circuit_board_panel.glb"
DRACO_LEVEL    = 6


# ── Scene helpers ─────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in (bpy.data.meshes, bpy.data.materials,
                bpy.data.node_groups, bpy.data.curves):
        for item in list(col):
            col.remove(item, do_unlink=True)


def make_emission_mat(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    ns = mat.node_tree.nodes
    lk = mat.node_tree.links
    ns.clear()
    out  = ns.new('ShaderNodeOutputMaterial')
    emit = ns.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value    = EMIT_COLOUR
    emit.inputs['Strength'].default_value = EMIT_STRENGTH
    lk.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


# ── GN tree ───────────────────────────────────────────────────────────────────
def _n(tree, ntype, x, y):
    """Add node, set position, return it."""
    nd = tree.nodes.new(ntype)
    nd.location = (x, y)
    return nd


def _lk(tree, src, si, dst, di):
    tree.links.new(src.outputs[si], dst.inputs[di])


def build_knn_tree():
    """
    Build a Geometry Nodes tree that produces a K=1 NN connection web.

    Node structure (left to right):
      GroupInput
        → DistributePointsOnFaces
            → [field branch] IndexOfNearest → EvaluateAtIndex
                              VectorMath(SUB) → VectorMath(LEN)
                                             → VectorMath(NOR)
                                                 → AlignEulerToVector
                              CombineXYZ(dist, 1, 1)
              → InstanceOnPoints(unit_line, rotation, scale)
                  → RealizeInstances → MeshToCurve
                      → CurveToMesh ──────────────────────┐
            → InstanceOnPoints(ico_sphere)                │
                  → RealizeInstances ────────────────────┐│
      JoinGeometry ←──────────────────────────────────── ┘┘
        → GroupOutput
    """
    tree  = bpy.data.node_groups.new("HF_KNNCircuit", 'GeometryNodeTree')
    ns    = tree.nodes
    lk    = tree.links

    # Blender 5.1 interface API (replaces deprecated inputs/outputs.new)
    tree.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    tree.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    gi   = _n(tree, 'NodeGroupInput',  -900,   0)
    go   = _n(tree, 'NodeGroupOutput', 1400,   0)

    # ── Distribute Points on Faces ────────────────────────────────────────────
    dist = _n(tree, 'GeometryNodeDistributePointsOnFaces', -600, 0)
    dist.distribute_method = 'RANDOM'
    dist.inputs['Density'].default_value = POINT_DENSITY
    dist.inputs['Seed'].default_value    = POINT_SEED
    lk.new(gi.outputs[0], dist.inputs['Mesh'])

    # ── Field: current position of each scatter point ─────────────────────────
    pos  = _n(tree, 'GeometryNodeInputPosition', -600, -200)

    # ── Index of Nearest ──────────────────────────────────────────────────────
    # Min Distance > 0 so it skips the point itself (distance = 0 to self).
    # The node evaluates on whatever domain the downstream node is on — here
    # the POINT domain of dist, because InstanceOnPoints drives evaluation.
    inn  = _n(tree, 'GeometryNodeIndexOfNearest', -300, 100)
    inn.inputs['Min Distance'].default_value = MIN_DIST_SKIP
    # Position socket uses current point position by default; no extra link needed.

    # ── Evaluate at Index: position of nearest point ──────────────────────────
    evp  = _n(tree, 'GeometryNodeEvaluateAtIndex', -300, -100)
    evp.data_type = 'FLOAT_VECTOR'
    evp.domain    = 'POINT'
    lk.new(inn.outputs['Index'], evp.inputs['Index'])
    lk.new(pos.outputs[0],       evp.inputs['Value'])    # field to sample

    # ── Delta: nn_pos - current_pos ───────────────────────────────────────────
    sub  = _n(tree, 'ShaderNodeVectorMath',  0, 0)
    sub.operation = 'SUBTRACT'
    lk.new(evp.outputs['Value'], sub.inputs[0])
    lk.new(pos.outputs[0],        sub.inputs[1])

    # ── Length and normalised direction of delta ──────────────────────────────
    lenv = _n(tree, 'ShaderNodeVectorMath', 200, -100)
    lenv.operation = 'LENGTH'
    lk.new(sub.outputs[0], lenv.inputs[0])

    norv = _n(tree, 'ShaderNodeVectorMath', 200, 100)
    norv.operation = 'NORMALIZE'
    lk.new(sub.outputs[0], norv.inputs[0])

    # ── Align +X to direction → per-instance rotation euler ───────────────────
    aln  = _n(tree, 'FunctionNodeAlignEulerToVector', 400, 100)
    aln.axis       = 'X'
    aln.pivot_axis = 'Z'
    lk.new(norv.outputs[0], aln.inputs['Vector'])

    # ── Scale vector (dist, 1, 1) — stretches unit line to exact edge length ──
    sxyz = _n(tree, 'ShaderNodeCombineXYZ', 400, -100)
    sxyz.inputs['Y'].default_value = 1.0
    sxyz.inputs['Z'].default_value = 1.0
    lk.new(lenv.outputs['Value'], sxyz.inputs['X'])

    # ── Unit Mesh Line: (0,0,0) → (1,0,0) ────────────────────────────────────
    ml   = _n(tree, 'GeometryNodeMeshLine', 200, -300)
    ml.mode = 'END_POINTS'
    ml.inputs['Count'].default_value = 2
    ml.inputs['Start Location'].default_value  = (0.0, 0.0, 0.0)
    ml.inputs['End Location'].default_value    = (1.0, 0.0, 0.0)

    # ── Instance unit line on each scatter point ──────────────────────────────
    il   = _n(tree, 'GeometryNodeInstanceOnPoints', 600, 0)
    lk.new(dist.outputs['Points'], il.inputs['Points'])
    lk.new(ml.outputs[0],          il.inputs['Instance'])
    lk.new(aln.outputs[0],         il.inputs['Rotation'])
    lk.new(sxyz.outputs[0],        il.inputs['Scale'])

    ri   = _n(tree, 'GeometryNodeRealizeInstances', 800, 0)
    lk.new(il.outputs[0], ri.inputs[0])

    # ── Mesh to Curve → Curve to Mesh (tube cross-section) ───────────────────
    m2c  = _n(tree, 'GeometryNodeMeshToCurve', 900, 0)
    lk.new(ri.outputs[0], m2c.inputs['Mesh'])

    prof = _n(tree, 'GeometryNodeCurvePrimitiveCircle', 900, -200)
    prof.mode = 'RADIUS'
    prof.inputs['Resolution'].default_value = TUBE_SIDES
    prof.inputs['Radius'].default_value     = TUBE_RADIUS

    c2m  = _n(tree, 'GeometryNodeCurveToMesh', 1050, 0)
    lk.new(m2c.outputs['Curve'],     c2m.inputs['Curve'])
    lk.new(prof.outputs['Curve'],    c2m.inputs['Profile Curve'])

    # ── ICO sphere pad + instances at each scatter point ─────────────────────
    ico  = _n(tree, 'GeometryNodeMeshIcoSphere', 200, -500)
    ico.inputs['Subdivisions'].default_value = PAD_SUBDIV
    ico.inputs['Radius'].default_value       = PAD_RADIUS

    ip   = _n(tree, 'GeometryNodeInstanceOnPoints', 600, -300)
    lk.new(dist.outputs['Points'], ip.inputs['Points'])
    lk.new(ico.outputs[0],         ip.inputs['Instance'])

    rip  = _n(tree, 'GeometryNodeRealizeInstances', 800, -300)
    lk.new(ip.outputs[0], rip.inputs[0])

    # ── Join all geometry ─────────────────────────────────────────────────────
    jn   = _n(tree, 'GeometryNodeJoinGeometry', 1200, 0)
    lk.new(c2m.outputs[0],  jn.inputs[0])
    lk.new(rip.outputs[0],  jn.inputs[0])

    lk.new(jn.outputs[0], go.inputs[0])
    return tree


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    clear_scene()

    bpy.ops.mesh.primitive_plane_add(size=PLANE_SIZE)
    plane = bpy.context.active_object
    plane.name = "HF_CircuitSubstrate"

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.subdivide(number_cuts=PLANE_CUTS)
    bpy.ops.object.mode_set(mode='OBJECT')

    gn_tree = build_knn_tree()
    mod = plane.modifiers.new("KNNCircuit", 'NODES')
    mod.node_group = gn_tree

    mat = make_emission_mat("HF_CircuitEmit")
    plane.data.materials.append(mat)

    out_dir = bpy.path.abspath("//output")
    os.makedirs(out_dir, exist_ok=True)

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_PATH),
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LEVEL,
        export_apply=True,
        use_selection=True,
        export_image_format='WEBP',
    )
    print("✓ circuit_board_panel.glb exported.")


if __name__ == "__main__":
    main()

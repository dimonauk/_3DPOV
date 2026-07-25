"""
GN Matrix Nodes — Articulated Poi Staff: FK Chain via Compound Matrix
Multiplication (Blender 5.1)
====================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

TECHNIQUE
Blender 5.1 adds a suite of 4×4 Matrix nodes to Geometry Nodes:
  Combine Matrix   — assemble a 4×4 affine matrix from translation +
                     Euler rotation + scale
  Multiply Matrices — M_world = M_parent × M_local  (right-to-left: local
                      first, then parent frame)
  Decompose Matrix  — extract translation, rotation, scale from a 4×4 matrix
  Transform Point   — apply a matrix to a position vector
  Transform Direction — apply a matrix (upper 3×3) to a direction vector

WHY MATRIX NODES OVER ROTATION NODES
The Rotation nodes added in Blender 4.2 handle pure orientations efficiently
(no translation, no scale).  They use quaternion/Euler/axis-angle internally
and are ideal when you only need to spin geometry in place.  The moment you
need to COMPOSE translation + rotation + scale into one operation — or accumulate
a chain of rigid transforms where each parent offsets the child's origin — you
need 4×4 matrices.  FK kinematics is the canonical case: each joint's world
transform is parent_M × local_M, and "local_M" encodes BOTH the rotation of this
joint AND the translation along the previous link.  One Multiply Matrices node
replaces two AlignEulerToVector + two TransformGeometry + origin offsets.

FK CHAIN ACCUMULATION
The Repeat Zone threads `accum_M` (Matrix) and `joints` (Geometry) across
NUM_SEGS iterations:

  Iter 0:  accum_M = identity
           local_M = Combine Matrix(T=(0,0,0), R=joint_angle[0], S=(1,1,1))
           new_accum_M = identity × local_M = local_M
           tip_pos = Transform Point(origin, new_accum_M)
           joints += single point at tip_pos with rotation attr

  Iter 1:  accum_M = M_0
           local_M = Combine Matrix(T=(0, SEG_LENGTH, 0), R=angle[1])
           new_accum_M = M_0 × local_M
           tip_pos = Transform Point(origin, new_accum_M)
           joints += point at tip_pos

  ...so on for NUM_SEGS iterations.

The translation T=(0, SEG_LENGTH, 0) in `local_M` moves the child joint's
origin SEG_LENGTH units along the parent's local +Y before applying the
rotation.  This is the standard FK encoding.

After the Repeat Zone, joints is a point cloud of NUM_SEGS tip positions in
world space.  Mesh Line connects consecutive points; CurveToMesh extrudes a
faceted cylinder profile along it.  DecomposeMatrix at each joint gives the
rotation quaternion for instancing a sphere "knuckle" prop.

POI CONNECTION
A poi handle chain is physically this: N rigid links, each attached to the
previous link's tip, rotated by the wrist/forearm/body input at that joint.
The FK forward-pass computes where the poi head is given the joint angles.
In light-painting rigs this is the actual physical model: the poi path is
the integral of the FK tip position over time.

Outside sources:
  Blender Foundation — Geometry Nodes Matrix Utilities  CC-BY-SA 4.0
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/utilities/matrix/
    related: https://projects.blender.org/blender/blender
             https://projects.blender.org/blender/blender-manual
  Three.js authors (Mr.doob et al.) — Matrix4 class (MIT)
    https://threejs.org/docs/#api/en/math/Matrix4
    related: https://github.com/mrdoob/three.js
             https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
"""

import bpy, bmesh, math, array

# ── Parameters ─────────────────────────────────────────────────────────────
NUM_SEGS    = 8        # number of chain links
SEG_LENGTH  = 0.28     # metres per segment
JOINT_ANGLE = 0.30     # base resting angle per joint (radians, ≈ 17°)
NOISE_SCALE = 0.55     # noise amplitude multiplier on joint angle
TUBE_VERTS  = 6        # hexagonal cross-section (faceted)
TUBE_RADIUS = 0.035    # segment cylinder radius
KNUCKLE_R   = 0.055    # joint sphere radius
FRAME_END   = 120
SLUG        = "gn-matrix-nodes-fk-chain-articulated-poi-staff"


# ── Helpers ─────────────────────────────────────────────────────────────────
def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes) + list(bpy.data.curves) + \
                 list(bpy.data.node_groups) + list(bpy.data.materials):
        bpy.data.batch_remove(ids=[block]) if hasattr(bpy.data, 'batch_remove') \
            else None
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def new_node(ng, bl_type, location=(0, 0)):
    n = ng.nodes.new(bl_type)
    n.location = location
    return n


def link(ng, out_socket, in_socket):
    ng.links.new(out_socket, in_socket)


# ── Emission material ────────────────────────────────────────────────────────
def make_material():
    mat = bpy.data.materials.new("hf_poi_staff")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in nt.nodes:
        nt.nodes.remove(n)

    out   = new_node(nt, 'ShaderNodeOutputMaterial', (400, 0))
    em    = new_node(nt, 'ShaderNodeEmission',        (200, 0))
    attr  = new_node(nt, 'ShaderNodeAttribute',       (0, 0))
    attr.attribute_name = "seg_t"   # float 0..1 per segment, set below
    ramp  = new_node(nt, 'ShaderNodeValToRGB',        (0, -200))
    ramp.color_ramp.elements[0].color = (0.05, 0.05, 0.35, 1)   # deep indigo
    ramp.color_ramp.elements[1].color = (0.9,  0.4,  0.05, 1)   # amber
    mult  = new_node(nt, 'ShaderNodeMath',            (200, -200))
    mult.operation = 'MULTIPLY'
    mult.inputs[1].default_value = 2.5                           # emission strength
    link(nt, attr.outputs['Fac'], ramp.inputs[0])
    link(nt, ramp.outputs[0], em.inputs['Color'])
    link(nt, attr.outputs['Fac'], mult.inputs[0])
    link(nt, mult.outputs[0], em.inputs['Strength'])
    link(nt, em.outputs[0], out.inputs['Surface'])
    return mat


# ── GN tree ──────────────────────────────────────────────────────────────────
def build_gn_tree(obj, mat):
    """
    Build the Geometry Nodes modifier that:
    1. Creates a single anchor point at world origin.
    2. Uses a Repeat Zone to accumulate NUM_SEGS FK matrices, growing a
       point cloud 'joints' and storing each joint's accumulated_M
       rotation as a Vector attribute for later instancing.
    3. Connects the joint positions into a Mesh Line, extrudes the faceted
       tube, instances knuckle spheres at the joints.
    4. Colours each segment 0..1 along the chain via 'seg_t' attribute.
    """
    mod = obj.modifiers.new("HF_FK_Chain", 'NODES')
    ng  = bpy.data.node_groups.new("hf_poi_staff_fk", 'GeometryNodeTree')
    mod.node_group = ng

    # ── Outputs (interface) ──────────────────────────────────────────────────
    ng.interface.new_socket('Geometry', in_out='OUTPUT',
                            socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Segments',  in_out='INPUT',
                            socket_type='NodeSocketInt')
    ng.interface.new_socket('Seg Length', in_out='INPUT',
                            socket_type='NodeSocketFloat')
    ng.interface.new_socket('Joint Angle', in_out='INPUT',
                            socket_type='NodeSocketFloat')

    gn_in  = new_node(ng, 'NodeGroupInput',  (-1800, 0))
    gn_out = new_node(ng, 'NodeGroupOutput', (2200, 0))
    mod["Input_1"] = NUM_SEGS
    mod["Input_2"] = SEG_LENGTH
    mod["Input_3"] = JOINT_ANGLE

    # ── Repeat Zone ─────────────────────────────────────────────────────────
    # Blender 5.1: GeometryNodeRepeatInput / GeometryNodeRepeatOutput
    rep_in  = new_node(ng, 'GeometryNodeRepeatInput',  (-400, 0))
    rep_out = new_node(ng, 'GeometryNodeRepeatOutput', (1400, 0))
    rep_in.pair_with_output(rep_out)
    # Wire iteration count
    link(ng, gn_in.outputs['Segments'], rep_in.inputs['Iterations'])

    # Add repeat items: accumulated matrix + growing joint geometry
    # MATRIX socket type added in Blender 5.0 for Repeat/Simulation Zones
    rep_out.repeat_items.new('MATRIX',   'accum_M')
    rep_out.repeat_items.new('GEOMETRY', 'joints')
    # 'accum_M' starts as identity (zero inputs to CombineMatrix = identity)
    # 'joints' starts as empty geometry (no wire = empty)

    # ── Inside the Repeat Zone body ─────────────────────────────────────────
    #
    # Step 1: Get current iteration index
    iter_sock = rep_in.outputs['Iteration']  # INT, 0-based

    # Step 2: Compute joint angle for this iteration using White Noise Texture
    # noise(index) gives pseudo-random float in [0,1]; scale by NOISE_SCALE
    wn   = new_node(ng, 'ShaderNodeTexWhiteNoise', (100, -300))
    wn.noise_dimensions = '1D'
    itf  = new_node(ng, 'FunctionNodeFloatToInt',  (-100, -350))  # cast not needed
    # Actually we just use iteration directly as float for the texture
    # Blender TextureWhiteNoise in 1D takes a Float socket
    link(ng, iter_sock, wn.inputs['W'])

    # angle_factor: JOINT_ANGLE + noise * NOISE_SCALE
    add_ang = new_node(ng, 'ShaderNodeMath', (300, -300))
    add_ang.operation = 'ADD'
    add_ang.inputs[0].default_value = JOINT_ANGLE
    mul_ns = new_node(ng, 'ShaderNodeMath', (150, -380))
    mul_ns.operation = 'MULTIPLY'
    mul_ns.inputs[1].default_value = NOISE_SCALE
    link(ng, wn.outputs['Value'], mul_ns.inputs[0])
    link(ng, mul_ns.outputs[0], add_ang.inputs[1])
    joint_angle_val = add_ang.outputs[0]   # float: angle in radians

    # Step 3: Build local_M = Combine Matrix(T=(0, SEG_LENGTH, 0), R=(angle,0,0))
    # GeometryNodeCombineMatrix — new in Blender 5.0
    # Inputs:  Translation (Vector), Rotation (Rotation / Euler), Scale (Vector)
    comb_loc = new_node(ng, 'GeometryNodeCombineMatrix', (600, -200))

    # Translation vector: (0, SEG_LENGTH, 0)
    xyz_t = new_node(ng, 'ShaderNodeCombineXYZ', (300, -150))
    xyz_t.inputs['X'].default_value = 0.0
    xyz_t.inputs['Z'].default_value = 0.0
    link(ng, gn_in.outputs['Seg Length'], xyz_t.inputs['Y'])
    link(ng, xyz_t.outputs[0], comb_loc.inputs['Translation'])

    # Rotation (Euler X = joint_angle, Y=0, Z=0) — use AxisAngleToRotation
    # or CombineEuler if available, or direct Euler socket
    # In Blender 5.x, CombineMatrix accepts a 'Rotation' type socket
    # Use FunctionNodeEulerToRotation if available, or AxisAngleToRotation
    euler_to_rot = new_node(ng, 'FunctionNodeEulerToRotation', (400, -400))
    # Inputs: Euler (Vector) → x=joint_angle, y=0, z=0
    cxyz_r = new_node(ng, 'ShaderNodeCombineXYZ', (200, -500))
    cxyz_r.inputs['Y'].default_value = 0.0
    cxyz_r.inputs['Z'].default_value = 0.0
    link(ng, joint_angle_val, cxyz_r.inputs['X'])
    link(ng, cxyz_r.outputs[0], euler_to_rot.inputs['Euler'])
    link(ng, euler_to_rot.outputs['Rotation'], comb_loc.inputs['Rotation'])

    # Scale: (1, 1, 1) — default, leave unconnected (defaults to 1,1,1)

    local_M_out = comb_loc.outputs['Matrix']

    # Step 4: Multiply: new_accum = accum_M_in × local_M
    # GeometryNodeMultiplyMatrices — new in Blender 5.0
    mul_m = new_node(ng, 'GeometryNodeMultiplyMatrices', (900, -100))
    link(ng, rep_in.outputs['accum_M'], mul_m.inputs[0])   # first input = left matrix
    link(ng, local_M_out,               mul_m.inputs[1])   # second input = right matrix
    new_accum_M = mul_m.outputs['Matrix']

    # Step 5: Extract joint tip world position
    # Transform Point(point=(0,0,0), matrix=new_accum_M) → world pos
    # GeometryNodeTransformPoint — new in Blender 5.0
    t_pt = new_node(ng, 'GeometryNodeTransformPoint', (1100, 0))
    # Input 'Point' defaults to (0,0,0) — the joint tip in local frame
    t_pt.inputs['Point'].default_value = (0.0, 0.0, 0.0)
    link(ng, new_accum_M, t_pt.inputs['Matrix'])
    joint_world_pos = t_pt.outputs['Point']

    # Step 6: Also extract orientation for instancing knuckle spheres
    # DecomposeMatrix → (Translation, Rotation, Scale)
    # GeometryNodeDecomposeMatrix — new in Blender 5.0
    decomp = new_node(ng, 'GeometryNodeDecomposeMatrix', (1100, -300))
    link(ng, new_accum_M, decomp.inputs['Matrix'])
    joint_rotation = decomp.outputs['Rotation']   # Rotation type

    # Step 7: Create a single point at joint_world_pos, store rotation attr
    pts1 = new_node(ng, 'GeometryNodePoints', (900, 300))
    pts1.inputs['Count'].default_value = 1
    pts1.inputs['Radius'].default_value = 0.01
    set_pos = new_node(ng, 'GeometryNodeSetPosition', (1100, 300))
    link(ng, pts1.outputs['Geometry'], set_pos.inputs['Geometry'])
    link(ng, joint_world_pos, set_pos.inputs['Position'])
    # Store rotation as a named attribute on this point
    store_rot = new_node(ng, 'GeometryNodeStoreNamedAttribute', (1250, 300))
    store_rot.inputs['Name'].default_value = 'joint_rot'
    store_rot.data_type = 'QUATERNION'
    store_rot.domain = 'POINT'
    link(ng, set_pos.outputs['Geometry'], store_rot.inputs['Geometry'])
    link(ng, joint_rotation, store_rot.inputs['Value'])

    # Step 8: Join new point into growing joints geometry
    join = new_node(ng, 'GeometryNodeJoinGeometry', (1400, 300))
    link(ng, rep_in.outputs['joints'],     join.inputs['Geometry'])
    link(ng, store_rot.outputs['Geometry'], join.inputs['Geometry'])

    # Wire repeat zone outputs
    link(ng, new_accum_M,          rep_out.inputs['accum_M'])
    link(ng, join.outputs[0],      rep_out.inputs['joints'])

    # ── Post-Repeat Zone: build tube + knuckles ──────────────────────────────
    joints_out = rep_out.outputs['joints']   # point cloud of NUM_SEGS tips

    # Convert the sequential point cloud to a poly curve
    # (points are ordered 0..N-1 since we accumulated them in order)
    # Use Mesh Line equivalent: Instance on Points won't give us a curve directly.
    # Instead: MeshLine over indices, then SetPosition to joint positions
    # via SampleIndex to pull position from the joints point cloud.
    mesh_line = new_node(ng, 'GeometryNodeMeshLine', (1600, 0))
    link(ng, gn_in.outputs['Segments'], mesh_line.inputs['Count'])
    mesh_line.inputs['Length'].default_value = SEG_LENGTH
    mesh_line.mode = 'OFFSET'

    set_pos2 = new_node(ng, 'GeometryNodeSetPosition', (1800, 0))
    link(ng, mesh_line.outputs['Mesh'], set_pos2.inputs['Geometry'])

    # SampleIndex to get position from joints point cloud by vertex index
    samp = new_node(ng, 'GeometryNodeSampleIndex', (1700, -200))
    samp.data_type = 'FLOAT_VECTOR'
    samp.domain = 'POINT'
    link(ng, joints_out, samp.inputs['Geometry'])
    # Named Attribute to get stored position
    na_pos = new_node(ng, 'GeometryNodeInputNamedAttribute', (1500, -300))
    na_pos.inputs['Name'].default_value = 'position'
    na_pos.data_type = 'FLOAT_VECTOR'
    link(ng, na_pos.outputs['Attribute'], samp.inputs['Value'])
    # Index from mesh line vertex index
    vi = new_node(ng, 'GeometryNodeInputIndex', (1600, -400))
    link(ng, vi.outputs[0], samp.inputs['Index'])
    link(ng, samp.outputs['Value'], set_pos2.inputs['Position'])

    # Mesh to Curve, then Curve to Mesh with hexagonal profile
    m2c = new_node(ng, 'GeometryNodeMeshToCurve', (2000, 0))
    link(ng, set_pos2.outputs['Geometry'], m2c.inputs['Mesh'])
    resamp = new_node(ng, 'GeometryNodeResampleCurve', (2050, 0))
    resamp.mode = 'EVALUATED'
    link(ng, m2c.outputs['Curve'], resamp.inputs['Curve'])

    # Hex profile circle
    prof = new_node(ng, 'GeometryNodeCurvePrimitiveCircle', (2000, -300))
    prof.mode = 'RADIUS'
    prof.inputs['Resolution'].default_value = TUBE_VERTS
    prof.inputs['Radius'].default_value = TUBE_RADIUS
    c2m = new_node(ng, 'GeometryNodeCurveToMesh', (2200, 0))
    link(ng, resamp.outputs['Curve'], c2m.inputs['Curve'])
    link(ng, prof.outputs['Curve'], c2m.inputs['Profile Curve'])
    c2m.inputs['Fill Caps'].default_value = True

    # Set seg_t attribute: 0..1 along chain for colour ramp
    na_seg = new_node(ng, 'GeometryNodeStoreNamedAttribute', (2350, 0))
    na_seg.inputs['Name'].default_value = 'seg_t'
    na_seg.data_type = 'FLOAT'
    na_seg.domain = 'POINT'
    link(ng, c2m.outputs['Mesh'], na_seg.inputs['Geometry'])
    spline_p = new_node(ng, 'GeometryNodeSplineParameter', (2150, -200))
    link(ng, spline_p.outputs['Factor'], na_seg.inputs['Value'])

    # Knuckle spheres at joint positions
    ico = new_node(ng, 'GeometryNodeMeshIcoSphere', (1600, 500))
    ico.inputs['Subdivisions'].default_value = 1
    ico.inputs['Radius'].default_value = KNUCKLE_R
    iop = new_node(ng, 'GeometryNodeInstanceOnPoints', (1800, 400))
    link(ng, joints_out, iop.inputs['Points'])
    link(ng, ico.outputs['Mesh'], iop.inputs['Instance'])
    # Rotation from stored quaternion attribute
    samp_rot = new_node(ng, 'GeometryNodeSampleIndex', (1700, 600))
    samp_rot.data_type = 'QUATERNION'
    samp_rot.domain = 'POINT'
    link(ng, joints_out, samp_rot.inputs['Geometry'])
    na_rot_r = new_node(ng, 'GeometryNodeInputNamedAttribute', (1500, 700))
    na_rot_r.inputs['Name'].default_value = 'joint_rot'
    na_rot_r.data_type = 'QUATERNION'
    link(ng, na_rot_r.outputs['Attribute'], samp_rot.inputs['Value'])
    link(ng, vi.outputs[0], samp_rot.inputs['Index'])
    link(ng, samp_rot.outputs['Value'], iop.inputs['Rotation'])

    real = new_node(ng, 'GeometryNodeRealizeInstances', (2000, 400))
    link(ng, iop.outputs['Instances'], real.inputs['Geometry'])

    # Merge seg_t tube + knuckle spheres
    join_final = new_node(ng, 'GeometryNodeJoinGeometry', (2500, 0))
    link(ng, na_seg.outputs['Geometry'], join_final.inputs['Geometry'])
    link(ng, real.outputs['Geometry'],   join_final.inputs['Geometry'])

    # Assign material
    set_mat = new_node(ng, 'GeometryNodeSetMaterial', (2600, 0))
    mat_val = new_node(ng, 'GeometryNodeInputMaterial', (2400, -200))
    mat_val.material = mat
    link(ng, join_final.outputs[0], set_mat.inputs['Geometry'])
    link(ng, mat_val.outputs[0], set_mat.inputs['Material'])

    link(ng, set_mat.outputs['Geometry'], gn_out.inputs['Geometry'])


# ── Main ────────────────────────────────────────────────────────────────────
def main():
    purge()
    mat = make_material()

    # Anchor mesh (single vert — GN will replace it)
    mesh = bpy.data.meshes.new("hf_poi_staff")
    bm   = bmesh.new()
    bm.verts.new((0, 0, 0))
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("hf_poi_staff", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    build_gn_tree(obj, mat)

    # Timeline
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end   = FRAME_END

    print(f"[{SLUG}] Blueprint built — {NUM_SEGS} FK segments.")


main()

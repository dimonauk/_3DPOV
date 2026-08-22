import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Before Blender 4.2, Geometry Nodes rotated geometry by piping a{" "}
        <code>CombineXYZ</code> output directly into{" "}
        <code>TransformGeometry.Rotation</code>. Blender treated that Vector as
        an Euler triplet (X, Y, Z degrees), which worked fine for a single
        rotation. The moment you wanted to <em>compose</em> two rotations — say,
        yaw the whole assembly, then pitch the upper arm in the yawed frame —
        you had to convert to matrix, multiply, convert back. Done in node
        graphs it was three or four maths nodes per axis, and the result was
        gimbal-locked at ±90° pitch regardless.
      </p>
      <p>
        Blender 4.2 introduced the first-class{" "}
        <strong>Rotation socket type</strong> (the orange sockets in the Add →
        Utilities → Rotation sub-menu) backed by a unit quaternion. Quaternions
        represent orientation without a preferred axis order, so gimbal lock
        cannot occur. The new node suite includes{" "}
        <code>Axis Angle to Rotation</code>, which takes an intuitive
        axis-vector and radian angle rather than an Euler triplet, and{" "}
        <code>Rotate Rotation</code>, which composes two Rotation values. See
        the clockwork modifier in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-scene-time-rotation-mechanical-clockwork"
          className={lk}
        >
          GN Scene Time — Mechanical Clockwork
        </Link>{" "}
        for the simpler single-axis case using{" "}
        <code>Euler to Rotation</code>, which is the gentle on-ramp before
        chaining two rotations here.
      </p>
      <p>
        The three-joint arm demonstrates the FK composition rule via{" "}
        <code>Rotate Rotation</code> in{" "}
        <strong>LOCAL space</strong>. LOCAL means the second rotation is applied
        in the frame established by the first: mathematically, the result is{" "}
        R&#8322; = R&#8321; &times; R&#8322; (right-multiply). Setting the
        node to GLOBAL would apply the second rotation in world space before the
        first, breaking the FK chain — at GLOBAL, pitching the arm would always
        bend in world Y regardless of what the base yaw is. Compare this with
        the matrix approach in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-matrix-compose-iris-fold"
          className={lk}
        >
          GN Matrix Compose — Iris Fold
        </Link>
        , which achieves the same composition via{" "}
        <code>Compose Matrix</code> and{" "}
        <code>Multiply Matrices</code> instead of the Rotation socket type.
        Rotation nodes are preferable when you only need orientation (no
        scale/skew); Matrix nodes are preferable when you need to compose
        translation + rotation + scale in one transform.
      </p>
      <p>
        Part positions are the subtler problem. The elbow is not simply at{" "}
        <code>(0, 0, BASE_H + LOWER_ARM_L)</code>; after a 60° pitch, the
        lower arm extends at 60° from vertical, so the elbow&rsquo;s world
        position is the rotated version of the offset{" "}
        <code>(0, 0, LOWER_ARM_L)</code> added to the shoulder position.{" "}
        <code>Rotate Vector</code> (the{" "}
        <code>FunctionNodeRotateVector</code> orange node, not the old grey{" "}
        <code>Vector Rotate</code>) handles this exactly: it takes a Vector and
        a Rotation socket and returns the vector rotated by that rotation. A{" "}
        <code>Vector Math → Add</code> then appends the result to the shoulder
        world position. The same pattern repeats for the wrist and gripper,
        each chaining one level deeper into the FK tree. This is analogous to
        the spatial query chain in{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-geometry-kdtree-bvhtree-spatial"
          className={lk}
        >
          Python mathutils — KDTree &amp; BVHTree Spatial Queries
        </Link>
        , where transforms are also composed in chain before a final position
        lookup.
      </p>
      <p>
        The exported GLB captures the arm in its current pose (baked by{" "}
        <code>export_apply=True</code>). To animate the arm across YAW, PITCH,
        and ROLL axes in a WebXR scene, keyframe the GN modifier&rsquo;s group
        sockets — the same socket-keyframing pattern taught in{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-action-slots-multi-id-shared"
          className={lk}
        >
          Animation Action Slots — Multi-ID Shared
        </Link>
        . Each keyframe bakes a fresh pose; a sequence of baked GLBs can be
        interpolated at runtime via morph targets or swapped as separate meshes
        for a fully articulated WebXR robot.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-rotation-nodes-axis-angle-fk-robot-arm",
  title:
    "GN Rotation Nodes — Axis-Angle FK Robot Arm: Gimbal-Free Compound Rotation in Geometry Nodes (Blender 5.1)",
  date: "2026-07-02",
  kind: "tutorial",
  excerpt:
    "Use FunctionNodeAxisAngleToRotation and FunctionNodeRotateRotation(LOCAL) to build a three-joint FK robot arm entirely in Geometry Nodes — no armature, no Euler stacking, no gimbal lock. Exports as fk_robot_arm.glb for WebXR.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "an afternoon",
    difficulty: "intermediate",
    cost: "open-source",
    supplies: [
      {
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "FunctionNodeAxisAngleToRotation, FunctionNodeRotateRotation, and FunctionNodeRotateVector require Blender 4.2 or later. The TransformGeometry ROTATION socket (orange) requires Blender 4.3+. All tested in 5.1.",
      },
    ],
    steps: [
      {
        title: "Create the GN group interface with Yaw, Pitch, Roll sockets",
        body: "import bpy, math\n\nng    = bpy.data.node_groups.new('HS_FKArm', 'GeometryNodeTree')\nni    = ng.interface\nnodes = ng.nodes\nlinks = ng.links\n\n# Three Float inputs clamped to sensible degree ranges.\n# Radians conversion happens inside the graph so the modifier panel\n# shows human-readable degree values.\nni.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')\nsy = ni.new_socket('Yaw',   in_out='INPUT', socket_type='NodeSocketFloat')\nsp = ni.new_socket('Pitch', in_out='INPUT', socket_type='NodeSocketFloat')\nsr = ni.new_socket('Roll',  in_out='INPUT', socket_type='NodeSocketFloat')\nsy.default_value, sy.min_value, sy.max_value = 30.0, -180.0, 180.0\nsp.default_value, sp.min_value, sp.max_value = 40.0,  -90.0,  90.0\nsr.default_value, sr.min_value, sr.max_value = 20.0, -180.0, 180.0\n\ng_in  = nodes.new('NodeGroupInput');  g_in.location  = (-1600, 0)\ng_out = nodes.new('NodeGroupOutput'); g_out.location = ( 1600, 0)",
      },
      {
        title: "Convert degrees to radians, build AxisAngleToRotation × 3",
        body: "DEG2RAD = math.pi / 180.0\n\n# Math(MULTIPLY) nodes convert degrees → radians.\n# All trig and rotation nodes in GN use radians; degrees only appear\n# in the modifier panel UI (the socket default_value is in degrees,\n# matching the slider, but the wire carries radians after the multiply).\nmy = nodes.new('ShaderNodeMath'); my.operation = 'MULTIPLY'\nmp = nodes.new('ShaderNodeMath'); mp.operation = 'MULTIPLY'\nmr = nodes.new('ShaderNodeMath'); mr.operation = 'MULTIPLY'\nmy.inputs[1].default_value = DEG2RAD   # second input is the constant\nmp.inputs[1].default_value = DEG2RAD\nmr.inputs[1].default_value = DEG2RAD\nlinks.new(g_in.outputs['Yaw'],   my.inputs[0])\nlinks.new(g_in.outputs['Pitch'], mp.inputs[0])\nlinks.new(g_in.outputs['Roll'],  mr.inputs[0])\n\n# FunctionNodeAxisAngleToRotation: Axis (Vector, default=(0,0,1)) + Angle (Float, radians)\n#   → Rotation (orange socket, quaternion-backed)\n# WHY axis-angle instead of Euler:\n#   Euler requires choosing a decomposition order (XYZ, YXZ, etc.),\n#   is order-dependent, and can gimbal-lock at ±90° on the middle axis.\n#   Axis-angle specifies a single rotation around a chosen axis — no order,\n#   no singularity, and trivially readable: 'rotate 45° around world Z'.\naa_y = nodes.new('FunctionNodeAxisAngleToRotation')\naa_p = nodes.new('FunctionNodeAxisAngleToRotation')\naa_r = nodes.new('FunctionNodeAxisAngleToRotation')\naa_y.inputs['Axis'].default_value = (0.0, 0.0, 1.0)  # +Z: yaw axis\naa_p.inputs['Axis'].default_value = (0.0, 1.0, 0.0)  # +Y: pitch axis\naa_r.inputs['Axis'].default_value = (1.0, 0.0, 0.0)  # +X: roll axis\nlinks.new(my.outputs['Value'], aa_y.inputs['Angle'])\nlinks.new(mp.outputs['Value'], aa_p.inputs['Angle'])\nlinks.new(mr.outputs['Value'], aa_r.inputs['Angle'])",
      },
      {
        title: "Compose rotations with RotateRotation(LOCAL) — the FK rule",
        body: "# FunctionNodeRotateRotation:\n#   Inputs: Rotation (parent), Rotate By (child), Rotation Space (GLOBAL | LOCAL)\n#   Output: Rotation (composed)\n#\n# LOCAL space: result = Rotation · Rotate_By  (right-multiply = FK rule)\n#   The child rotation is applied in the coordinate frame of the parent.\n#   After yawing 45°, pitching 30° bends the arm in the YAWED local Y,\n#   not in world Y — which is exactly what a physical joint does.\n#\n# GLOBAL space: result = Rotate_By · Rotation  (pre-multiply)\n#   The child is applied in world space FIRST, before the parent —\n#   breaks FK: pitch would always bend in world Y, ignoring the yaw.\n\n# Stage 1: shoulder = yaw composed with pitch\nrr_yp = nodes.new('FunctionNodeRotateRotation')\nrr_yp.rotation_space = 'LOCAL'\nlinks.new(aa_y.outputs['Rotation'],  rr_yp.inputs['Rotation'])\nlinks.new(aa_p.outputs['Rotation'],  rr_yp.inputs['Rotate By'])\n\n# Stage 2: wrist = shoulder composed with roll\nrr_full = nodes.new('FunctionNodeRotateRotation')\nrr_full.rotation_space = 'LOCAL'\nlinks.new(rr_yp.outputs['Rotation'],  rr_full.inputs['Rotation'])\nlinks.new(aa_r.outputs['Rotation'],   rr_full.inputs['Rotate By'])\n\n# Verification: at Yaw=0, Pitch=0, Roll=0:\n#   rr_yp  → identity rotation (arm stands vertical)\n#   rr_full → identity rotation (gripper faces up)\n# At Yaw=0, Pitch=90, Roll=0:\n#   rr_yp  → 90° around world Y (arm horizontal, pointing +X)\n#   rr_full → 90° around world Y (gripper faces +X)\n# At Yaw=90, Pitch=90, Roll=0:\n#   rr_yp  → arm horizontal, pointing −Y (yawed 90° first, then pitched)\n#   This is the FK result — different from applying rotations in GLOBAL order",
      },
      {
        title: "Compute world-space positions with RotateVector + VectorMath",
        body: "# FunctionNodeRotateVector: takes a Vector and a Rotation, outputs the\n# rotated vector.  Use this wherever an arm segment's world-space position\n# depends on the accumulated rotation of its parent joints.\n#\n# Pattern for each joint:\n#   local_offset = CombineXYZ(0, 0, segment_length)  # segment extends along local Z\n#   world_offset = RotateVector(local_offset, parent_rotation)\n#   world_pos    = VectorMath(ADD, world_offset, parent_world_pos)\n\n# Shoulder = (0, 0, BASE_H) — no rotation changes Z-column positions\nc_sh = nodes.new('ShaderNodeCombineXYZ')\nc_sh.inputs['Z'].default_value = 0.300  # BASE_H metres\n\n# Elbow = RotateVec((0,0,0.25), R_yp) + shoulder\nc_la = nodes.new('ShaderNodeCombineXYZ')\nc_la.inputs['Z'].default_value = 0.250  # LOWER_ARM_L\nrv_el = nodes.new('FunctionNodeRotateVector')\nvm_el = nodes.new('ShaderNodeVectorMath'); vm_el.operation = 'ADD'\nlinks.new(c_la.outputs['Vector'],         rv_el.inputs['Vector'])\nlinks.new(rr_yp.outputs['Rotation'],      rv_el.inputs['Rotation'])\nlinks.new(rv_el.outputs['Vector'],        vm_el.inputs[0])\nlinks.new(c_sh.outputs['Vector'],         vm_el.inputs[1])\n# vm_el.outputs['Vector'] = elbow world position\n\n# Wrist = RotateVec((0,0,0.20), R_full) + elbow\nc_ua = nodes.new('ShaderNodeCombineXYZ')\nc_ua.inputs['Z'].default_value = 0.200  # UPPER_ARM_L\nrv_wr = nodes.new('FunctionNodeRotateVector')\nvm_wr = nodes.new('ShaderNodeVectorMath'); vm_wr.operation = 'ADD'\nlinks.new(c_ua.outputs['Vector'],         rv_wr.inputs['Vector'])\nlinks.new(rr_full.outputs['Rotation'],    rv_wr.inputs['Rotation'])\nlinks.new(rv_wr.outputs['Vector'],        vm_wr.inputs[0])\nlinks.new(vm_el.outputs['Vector'],        vm_wr.inputs[1])\n\n# Each arm-segment CENTRE = RotateVec(half_length_offset, rotation) + parent_pos\n# Lower arm centre:\nc_la2 = nodes.new('ShaderNodeCombineXYZ'); c_la2.inputs['Z'].default_value = 0.125\nrv_la = nodes.new('FunctionNodeRotateVector')\nvm_la = nodes.new('ShaderNodeVectorMath'); vm_la.operation = 'ADD'\nlinks.new(c_la2.outputs['Vector'],        rv_la.inputs['Vector'])\nlinks.new(rr_yp.outputs['Rotation'],      rv_la.inputs['Rotation'])\nlinks.new(rv_la.outputs['Vector'],        vm_la.inputs[0])\nlinks.new(c_sh.outputs['Vector'],         vm_la.inputs[1])\n# Upper arm centre:\nc_ua2 = nodes.new('ShaderNodeCombineXYZ'); c_ua2.inputs['Z'].default_value = 0.100\nrv_ua = nodes.new('FunctionNodeRotateVector')\nvm_ua = nodes.new('ShaderNodeVectorMath'); vm_ua.operation = 'ADD'\nlinks.new(c_ua2.outputs['Vector'],        rv_ua.inputs['Vector'])\nlinks.new(rr_full.outputs['Rotation'],    rv_ua.inputs['Rotation'])\nlinks.new(rv_ua.outputs['Vector'],        vm_ua.inputs[0])\nlinks.new(vm_el.outputs['Vector'],        vm_ua.inputs[1])",
      },
      {
        title:
          "Build mesh segments with TransformGeometry, set materials, export GLB",
        body: "# GeometryNodeTransformGeometry: Geometry + Translation (Vector) + Rotation (orange)\n#   Rotation now accepts the ROTATION socket directly in Blender 4.3+ —\n#   no need for EulerToRotation as a bridge node when you already have\n#   a composed Rotation value.\n#\n# Each mesh primitive is centred at its local origin; TransformGeometry\n# places it at the computed world position and applies the joint's rotation.\n\n# Base column (fixed — no rotation)\nn_base = nodes.new('GeometryNodeMeshCylinder')\nn_base.inputs['Vertices'].default_value = 24\nn_base.inputs['Radius'].default_value   = 0.042\nn_base.inputs['Depth'].default_value    = 0.300\nc_base = nodes.new('ShaderNodeCombineXYZ')\nc_base.inputs['Z'].default_value = 0.150          # cylinder centred at half-height\ntf_base = nodes.new('GeometryNodeTransformGeometry')\nlinks.new(n_base.outputs[0],          tf_base.inputs['Geometry'])\nlinks.new(c_base.outputs['Vector'],   tf_base.inputs['Translation'])\n\n# Shoulder disc — rotates with aa_y (base yaw only)\nn_sh = nodes.new('GeometryNodeMeshCylinder')\nn_sh.inputs['Vertices'].default_value = 32\nn_sh.inputs['Radius'].default_value   = 0.067     # 1.6 × BASE_R\nn_sh.inputs['Depth'].default_value    = 0.030\ntf_sh = nodes.new('GeometryNodeTransformGeometry')\nlinks.new(n_sh.outputs[0],            tf_sh.inputs['Geometry'])\nlinks.new(c_sh.outputs['Vector'],     tf_sh.inputs['Translation'])\nlinks.new(aa_y.outputs['Rotation'],   tf_sh.inputs['Rotation'])\n\n# Lower arm\nn_la = nodes.new('GeometryNodeMeshCube')\nn_la.inputs['Size'].default_value = (0.040, 0.040, 0.250)\ntf_la = nodes.new('GeometryNodeTransformGeometry')\nlinks.new(n_la.outputs[0],            tf_la.inputs['Geometry'])\nlinks.new(vm_la.outputs['Vector'],    tf_la.inputs['Translation'])\nlinks.new(rr_yp.outputs['Rotation'],  tf_la.inputs['Rotation'])\n\n# Elbow joint (icosphere)\nn_el = nodes.new('GeometryNodeMeshIcoSphere')\nn_el.inputs['Radius'].default_value = 0.030; n_el.inputs['Subdivisions'].default_value = 2\ntf_el = nodes.new('GeometryNodeTransformGeometry')\nlinks.new(n_el.outputs[0],            tf_el.inputs['Geometry'])\nlinks.new(vm_el.outputs['Vector'],    tf_el.inputs['Translation'])\n\n# Upper arm\nn_ua = nodes.new('GeometryNodeMeshCube')\nn_ua.inputs['Size'].default_value = (0.032, 0.032, 0.200)\ntf_ua = nodes.new('GeometryNodeTransformGeometry')\nlinks.new(n_ua.outputs[0],            tf_ua.inputs['Geometry'])\nlinks.new(vm_ua.outputs['Vector'],    tf_ua.inputs['Translation'])\nlinks.new(rr_full.outputs['Rotation'], tf_ua.inputs['Rotation'])\n\n# Wrist + gripper (both use rr_full)\nn_wr = nodes.new('GeometryNodeMeshIcoSphere')\nn_wr.inputs['Radius'].default_value = 0.024; n_wr.inputs['Subdivisions'].default_value = 2\ntf_wr = nodes.new('GeometryNodeTransformGeometry')\nlinks.new(n_wr.outputs[0], tf_wr.inputs['Geometry'])\nlinks.new(vm_wr.outputs['Vector'], tf_wr.inputs['Translation'])\n\nn_gr = nodes.new('GeometryNodeMeshCube')\nn_gr.inputs['Size'].default_value = (0.100, 0.014, 0.060)\nc_gr = nodes.new('ShaderNodeCombineXYZ'); c_gr.inputs['Z'].default_value = 0.030\nrv_gr = nodes.new('FunctionNodeRotateVector')\nvm_gr = nodes.new('ShaderNodeVectorMath'); vm_gr.operation = 'ADD'\nlinks.new(c_gr.outputs['Vector'],      rv_gr.inputs['Vector'])\nlinks.new(rr_full.outputs['Rotation'], rv_gr.inputs['Rotation'])\nlinks.new(rv_gr.outputs['Vector'],     vm_gr.inputs[0])\nlinks.new(vm_wr.outputs['Vector'],     vm_gr.inputs[1])\ntf_gr = nodes.new('GeometryNodeTransformGeometry')\nlinks.new(n_gr.outputs[0], tf_gr.inputs['Geometry'])\nlinks.new(vm_gr.outputs['Vector'], tf_gr.inputs['Translation'])\nlinks.new(rr_full.outputs['Rotation'], tf_gr.inputs['Rotation'])\n\n# SetMaterial + JoinGeometry\ndef sm(tf, mat):\n    s = nodes.new('GeometryNodeSetMaterial'); s.inputs['Material'].default_value = mat\n    links.new(tf.outputs['Geometry'], s.inputs['Geometry']); return s\n\nmat_arm   = bpy.data.materials['arm_metal']\nmat_joint = bpy.data.materials['joint_orange']\nmat_grip  = bpy.data.materials['gripper_alum']\njoin = nodes.new('GeometryNodeJoinGeometry')\nfor sg in (sm(tf_base,mat_arm), sm(tf_sh,mat_joint), sm(tf_la,mat_arm),\n           sm(tf_el,mat_joint), sm(tf_ua,mat_arm), sm(tf_wr,mat_joint), sm(tf_gr,mat_grip)):\n    links.new(sg.outputs['Geometry'], join.inputs['Geometry'])\nlinks.new(join.outputs['Geometry'], g_out.inputs['Geometry'])\n\n# Attach modifier and export\nmesh = bpy.data.meshes.new('fk_robot_arm')\nobj  = bpy.data.objects.new('fk_robot_arm', mesh)\nbpy.context.scene.collection.objects.link(obj)\nmod = obj.modifiers.new('HS_FKArm', 'NODES'); mod.node_group = ng\n\nbpy.ops.export_scene.gltf(\n    filepath='//output/fk_robot_arm.glb',\n    export_format='GLB', export_apply=True,\n    export_yup=True,\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n)",
      },
    ],
    finalResult:
      "A three-joint FK robot arm driven by Yaw, Pitch, and Roll sliders in the Geometry Nodes modifier panel. Each joint rotates in its parent's local frame (no gimbal lock). Exports as fk_robot_arm.glb (Draco 6, Y-up, ~25 KB) for direct use in Three.js or @react-three/fiber WebXR scenes.",
    variations: [
      "Continuous FK chain: extend to a 5-joint tentacle by adding UPPER_WRIST and FINGER joints. Each new joint adds one RotateRotation(LOCAL) and one RotateVector+Add pair for its position. The pattern scales linearly — N joints = N AxisAngleToRotation nodes, N-1 RotateRotation nodes, and N RotateVector+Add pairs.",
      "Inverse kinematics via GN: while true IK requires iterative solving (not natural in GN fields), a 2-joint arm can use the law of cosines to derive shoulder pitch analytically from a target position input. See the Armature IK Robot Arm tutorial for the solver-based alternative.",
      "Animated pose baking: wire SceneTime.Frame into Math nodes that drive each angle as a sine/cosine function. The arm then rotates continuously without any keyframes — useful for a mechanical prop in a WebXR environment loop. Pair with the GN Bake Node to cache the simulation output once.",
    ],
    troubleshooting: [
      {
        symptom:
          "Upper arm ignores yaw — pitching moves it in world Y regardless of base rotation",
        cause:
          "RotateRotation Rotation Space is set to GLOBAL instead of LOCAL. GLOBAL pre-multiplies the child rotation in world frame, so pitch always bends around world Y.",
        fix:
          "Select the RotateRotation node for the shoulder (rr_yp) and set Rotation Space to LOCAL. Verify by setting Yaw=90°: the arm should now fold toward world −X when Pitch increases, not toward world +Y.",
      },
      {
        symptom:
          "Arm segments detach — elbow is floating in the wrong position",
        cause:
          "The RotateVector node is connected to the wrong Rotation output (e.g., R_full instead of R_yp for the lower arm centre), or the VectorMath Add is adding to the wrong parent position.",
        fix:
          "Follow the FK tree strictly: lower-arm centre uses rr_yp, upper-arm centre uses rr_full. Elbow position uses rr_yp applied to the full lower-arm offset, not the half-length offset.",
      },
      {
        symptom:
          "'FunctionNodeAxisAngleToRotation' causes RuntimeError: node type not found",
        cause:
          "Blender version is earlier than 4.2, which introduced the Rotation socket type and this node family.",
        fix:
          "Help → About Blender: confirm version ≥ 4.2. In 4.1 and earlier, use FunctionNodeAlignEulerToVector + CombineXYZ as a partial substitute, or upgrade to 5.1 for the full Rotation socket API.",
      },
      {
        symptom:
          "GLB exports an empty mesh (0 vertices in gltf-validator)",
        cause:
          "export_apply=False (the default). The GN modifier is not baked before export, so the underlying empty mesh object is exported instead of the generated arm geometry.",
        fix:
          "Add export_apply=True to the bpy.ops.export_scene.gltf() call. In the UI: File → Export → glTF 2.0 → Data → tick Apply Modifiers. Expected vertex count after export: ~800 verts (7 mesh primitives, low-subdiv).",
      },
    ],
  },
  base,
);

export { entry };

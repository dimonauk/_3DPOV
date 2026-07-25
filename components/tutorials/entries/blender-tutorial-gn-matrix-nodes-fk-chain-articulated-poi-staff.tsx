import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender 4.x Geometry Nodes already had Rotation nodes —{" "}
        <code>Combine Rotation</code>, <code>Rotate Rotation</code>,{" "}
        <code>Axis Angle to Rotation</code> — that composed orientations without
        gimbal lock. They worked beautifully for spinning geometry in place.
        What they could not do was express a transform that simultaneously
        translates a child to its parent&apos;s tip <em>and</em> then rotates it
        in the parent&apos;s frame, in one socket. For that you need a full
        4×4 affine matrix.
      </p>
      <p>
        Blender 5.0 added exactly that: a suite of Matrix nodes to Geometry
        Nodes, culminating in five nodes that together form a complete
        kinematics toolkit:
      </p>
      <ul>
        <li>
          <strong>Combine Matrix</strong> — assemble a 4×4 matrix from a
          translation vector, a Rotation value, and a scale vector.
        </li>
        <li>
          <strong>Multiply Matrices</strong> — <code>M_world = M_parent × M_local</code>.
          Right-to-left convention: the local rotation happens first (in the
          parent&apos;s frame), then the parent&apos;s own transform applies.
        </li>
        <li>
          <strong>Decompose Matrix</strong> — extract translation, Rotation, and
          scale back out of a 4×4 matrix; useful for placing instance geometry at
          each joint.
        </li>
        <li>
          <strong>Transform Point</strong> — apply a 4×4 matrix to a position
          vector (full affine: rotation + translation + scale).
        </li>
        <li>
          <strong>Transform Direction</strong> — apply only the upper 3×3 of a
          4×4 matrix to a direction vector (no translation contribution).
        </li>
      </ul>
      <p>
        This blueprint threads these nodes through a Repeat Zone to build an
        8-segment articulated poi staff using forward kinematics. Each iteration
        accumulates one more joint:
      </p>
      <pre>{`accum_M[0] = identity
accum_M[i] = accum_M[i-1] × local_M[i]
local_M[i] = Combine Matrix(
  T = (0, SEG_LENGTH, 0),   ← translate along parent's +Y
  R = Euler(angle[i], 0, 0) ← then rotate around parent's X
)`}</pre>
      <p>
        After the Repeat Zone, <code>Transform Point((0,0,0), accum_M[i])</code>{" "}
        extracts each joint&apos;s world-space tip position. A Mesh Line resampled to
        those positions becomes the curve skeleton; <code>Curve to Mesh</code> with
        a hexagonal profile extrudes the faceted tube. Icosphere knuckles at each
        joint complete the prop, coloured indigo→amber along the chain.
      </p>
      <p>
        The whole staff is a single Blender object — one GN modifier, one draw
        call, directly exportable as a GLB for WebXR.
      </p>

      <h2>What 4×4 matrices actually do that Rotation nodes cannot</h2>
      <p>
        A Rotation value in Blender is a pure orientation — it tells you{" "}
        <em>which way</em> something faces, carrying no information about where its
        origin sits. Composing two Rotations gives you a combined orientation but
        the origin remains fixed at (0,0,0) in the local frame. This is fine for
        turntables, spin animatics, and normal-vector manipulations.
      </p>
      <p>
        An FK chain needs more: after rotating joint 0 by 30°, joint 1&apos;s origin
        must be at the <em>tip</em> of joint 0, not at the scene origin.
        The translation component — carried only in the 4×4 matrix, not in a
        Rotation value — is what moves the child&apos;s origin to the parent&apos;s tip.
        Each <code>Multiply Matrices(parent, local)</code> simultaneously carries
        forward both the accumulated orientation AND the accumulated position. One
        socket does the work of AlignEulerToVector + TransformGeometry + SetPosition
        + manual pivot offset, which in 4.x required five or more extra nodes per
        joint.
      </p>
      <p>
        Three.js — the MIT-licensed WebGL library this studio exports to — uses
        exactly the same column-major 4×4 convention in{" "}
        <code>Matrix4.multiply()</code>. A transform computed in the GN matrix chain
        round-trips to WebXR without any coordinate-system surprise. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-matrix-transform-compose-decompose-webxr"
          className={lk}
        >
          Python mathutils matrix tutorial
        </Link>{" "}
        walks the same algebra from the Python side; this tutorial is the node-graph
        equivalent.
      </p>

      <h2>Repeat Zone as a matrix accumulator</h2>
      <p>
        The Repeat Zone in Blender 5.1 supports a <code>Matrix</code> socket type
        on its persistent items — a capability added alongside the Matrix nodes in
        5.0. Each iteration receives the previous iteration&apos;s accumulated matrix
        and returns the next. It is a functional fold:
      </p>
      <pre>{`accum = reduce(
  lambda M, local: multiply_matrices(M, local),
  [local_M(i) for i in range(NUM_SEGS)],
  identity_matrix
)`}</pre>
      <p>
        In pure node-graph form this is a loop that processes one joint per
        iteration, threading the matrix state forward. The result after N
        iterations is the world transform of the Nth joint — no per-frame caching
        required, no simulation zone needed. Scrubbing the <code>Joint Angle</code>{" "}
        modifier input updates all joints simultaneously in one depsgraph pass.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-antenna-webxr"
          className={lk}
        >
          Repeat Zone Crystal Antenna tutorial
        </Link>{" "}
        used a similar pattern to accumulate branching geometry across iterations.
        There, the loop state was a Geometry socket (the growing branch mesh).
        Here the loop state is a Matrix socket — a lighter, more precise
        representation when you only need the transform, not the geometry itself.
      </p>

      <h2>FK versus IK: when to use each</h2>
      <p>
        Forward kinematics (FK) drives joints from root to tip: you specify each
        joint&apos;s angle and the chain computes where the tip ends up.{" "}
        <em>Inverse</em> kinematics (IK) works in reverse: you specify the tip
        target and the solver distributes angles along the chain to reach it.
      </p>
      <p>
        FK is the right model for poi performance: the performer drives each joint
        (wrist, elbow, shoulder) consciously. The poi path emerges from those
        deliberate angle choices — it is not solved backward from a target. FK is
        also the correct model for any prop whose shape is pre-designed rather than
        constrained (a segmented staff, a chain fan, a satellite antenna array).
      </p>
      <p>
        IK becomes necessary when the tip must land at a specific world position
        (e.g., a hand grasping a door handle, a robot arm picking an object). The{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-ik-robot-arm"
          className={lk}
        >
          Armature IK tutorial
        </Link>{" "}
        covers that case using Blender&apos;s built-in armature solver. GN matrix
        nodes do not yet expose an IK solver natively; FK is their native
        domain.
      </p>

      <h2>Connecting to poi light-painting physics</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting"
          className={lk}
        >
          Spring-Pendulum Poi tutorial
        </Link>{" "}
        modelled poi dynamics as a physical simulation: a spring-pendulum solving
        equations of motion per frame. This blueprint approaches the same prop from
        the opposite direction — a kinematic skeleton driven by artist-controlled
        angles, no physics, fully deterministic. The two are complementary: physics
        simulation for organic motion, FK chain for precise choreography animation
        or procedural shape design.
      </p>
      <p>
        In a full production pipeline you might use the FK chain to define the{" "}
        <em>resting pose</em> of a segmented poi handle, export the GLB, and then
        drive that handle&apos;s bones with a physics simulation in the final render.
        The FK blueprint gives you the correct default orientation for every segment
        so the initial pose is physically reasonable before simulation begins.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-25",
  title:
    "GN Matrix Nodes — Articulated Poi Staff: FK Chain via Compound Matrix Multiplication (Blender 5.1)",
  lede: "Blender 5.1's new Matrix nodes — Combine Matrix, Multiply Matrices, Decompose Matrix, Transform Point — enable a full 4×4 affine transform pipeline in Geometry Nodes; a Repeat Zone accumulates accum_M = accum_M × local_M(joint_angle) across 8 FK joints, Transform Point extracts each joint's world position, and Curve to Mesh with a hexagonal profile extrudes the faceted staff tube, coloured indigo→amber along the chain and exported as a single GLB prop for WebXR.",
  body: Body,
  libraryPath:
    "blends/geometry-nodes/gn-matrix-nodes-fk-chain-articulated-poi-staff/",
  steps: [
    {
      title: "Run blueprint.py — anchor mesh, GN tree, Repeat Zone",
      body: "Open Blender 5.1 → **Scripting** workspace. Load `blueprint.py` and press **Run Script**.\n\n`purge()` clears the scene. A single-vertex anchor mesh `hf_poi_staff` is created — GN replaces it entirely so the anchor geometry never appears. The `build_gn_tree()` call constructs the full node tree in four phases:\n\n1. **Group interface**: two INPUT sockets (`Segments` INT, `Seg Length` FLOAT, `Joint Angle` FLOAT) wired to modifier inputs. Default values match the parameters at the top of the script.\n2. **Repeat Zone**: `GeometryNodeRepeatInput` + `GeometryNodeRepeatOutput` paired with `pair_with_output()`. Two repeat items registered: `accum_M` (MATRIX) and `joints` (GEOMETRY). `accum_M` starts as the identity (Combine Matrix with all-zero inputs yields M = I). `joints` starts empty.\n3. **Inside the zone body**: White Noise Texture at dimension 1D takes the `Iteration` socket as `W` → pseudo-random joint angle variation. Combine Matrix builds `local_M` from `(0, SEG_LENGTH, 0)` translation and `Euler(angle, 0, 0)` rotation (via `FunctionNodeEulerToRotation`). Multiply Matrices gives `new_accum_M`. Transform Point extracts world tip. Store Named Attribute writes `joint_rot` (QUATERNION from Decompose Matrix) onto a single-point geometry at that tip, which is joined into `joints`.\n4. **Post-zone**: a Mesh Line is resampled to the joint positions using SampleIndex into the `joints` point cloud; Curve to Mesh extrudes the hex profile; knuckle spheres instance at joint positions using the stored `joint_rot`.\n\nThe console should print: `[gn-matrix-nodes-fk-chain-articulated-poi-staff] Blueprint built — 8 FK segments.`",
    },
    {
      title: "Inspect the Matrix socket type on the Repeat Zone",
      body: "With `hf_poi_staff` selected, open the Geometry Nodes editor. Locate the Repeat Zone (blue input / output box pair).\n\nHover over the `accum_M` socket on the **Repeat Input** node. The tooltip reads **Matrix** — this socket type was added alongside the Matrix nodes in Blender 5.0. It carries a full 4×4 column-major matrix per element. In Blender 4.x this socket type does not exist; attempting to create a `repeat_items.new('MATRIX', ...)` item will raise a `ValueError` because `MATRIX` is not in the socket type enum.\n\nCompare with the `joints` socket — type **Geometry**. The Repeat Zone supports both scalar types (Float, Int, Vector, Rotation, **Matrix**) and Geometry, making it possible to thread arbitrary transform state through an iterative loop alongside growing geometry.\n\nInside the zone body, trace:\n- **Combine Matrix** inputs: a CombineXYZ feeding Translation (T=(0, SEG_LENGTH, 0)), FunctionNodeEulerToRotation feeding Rotation, no Scale (defaults to (1,1,1)).\n- **Multiply Matrices** left input ← `accum_M` from RepeatInput; right input ← Combine Matrix output. Output: `new_accum_M` (the updated accumulated matrix).\n- **Transform Point** input `Matrix` ← `new_accum_M`; `Point` = (0,0,0) default. Output: world-space tip position.",
    },
    {
      title: "Vary Joint Angle and observe the FK chain",
      body: "In **Modifier Properties** for `hf_poi_staff`, expand `HF_FK_Chain`. You will see three inputs: Segments (8), Seg Length (0.28), Joint Angle (0.30).\n\nDrag **Joint Angle** slowly from 0.0 to 1.5 rad and watch the 3D Viewport:\n\n- **0.0 rad**: all joints have zero rotation angle — the chain extends straight up along +Y. All 8 segments are colinear.\n- **0.30 rad (default)**: each joint bends 0.30 + noise(i)×0.55 rad from the previous, producing a gently curved staff that fans out in the XY plane.\n- **0.75 rad**: each segment bends roughly 45°; the chain curves strongly and the 4th segment is nearly perpendicular to the first.\n- **1.57 rad** (π/2): each joint bends 90° — the chain spirals tightly. After 4 joints at 90° each, the tip is pointing back down toward the root.\n\nThis real-time response (no cache invalidation, no modal operator) is why matrix accumulation in a Repeat Zone is superior to a Simulation Zone for this use case: the Sim Zone bakes one frame per playback frame. The Repeat Zone evaluates all 8 iterations in a single depsgraph pass.\n\nFor light-painting choreography, try **Joint Angle ≈ 0.52 rad** (≈ 30°) with **Noise Scale 0.8** — this produces the natural asymmetric arc of a well-weighted staff mid-spin.",
    },
    {
      title: "Examine Decompose Matrix for knuckle orientation",
      body: "Inside the Repeat Zone body, locate the **Decompose Matrix** node connected to `new_accum_M`. It has three outputs: Translation, Rotation, Scale.\n\nThe Rotation output (type Rotation) is stored as a `joint_rot` QUATERNION named attribute on each joint point geometry via Store Named Attribute. After the Repeat Zone, **Instance on Points** uses this attribute — sampled back from the `joints` point cloud via `SampleIndex` — to orient the icosphere knuckle at each joint.\n\nWhy bother? A sphere instanced with zero rotation looks correct because a sphere is rotationally symmetric. But if you replace the icosphere with a faceted gem, the gem must align its longest axis with the segment direction. Decompose Matrix provides the correct joint-space rotation so the gem orients itself to match the FK chain at that joint.",
    },
    {
      title: "Export as GLB for WebXR",
      body: "File → **Export → glTF 2.0 (.glb/.gltf)**.\n\nSettings:\n- **Format**: GLB (binary)\n- **Apply Modifiers**: ON — this evaluates the GN tree and bakes the geometry (tube + knuckle spheres) into real mesh data\n- **Geometry > Draco Compression**: Level 6 (Holoflow convention)\n- **Images**: WebP\n- **Transform > +Y Up**: ON\n- **Object Name**: `hf_poi_staff` → root node name in the GLB will be `hf_poi_staff`\n\nThe resulting `.glb` contains one mesh node with the full 8-segment staff geometry, the emission material with `seg_t` colour ramp, and no animation data (the animation comes from the armature in the WebXR runtime).\n\nTo bake the animation (Joint Angle keyframe 0.30 → 1.10 over 120 frames) into the GLB, use the Python bpy Action + NLA FCurve approach from the FCurve Keyframe Insertion tutorial: build an Action, insert keyframes for the modifier input at frames 1 and 120, then export with the `bake_animation=True` gltf export flag.",
    },
  ],
  finalResult:
    "An 8-segment articulated poi staff with full forward-kinematics using Blender 5.1 Matrix nodes: a Repeat Zone accumulates accum_M = accum_M × local_M(joint_angle) across 8 iterations, Transform Point extracts each joint's world position, Curve to Mesh extrudes a hexagonal (TUBE_VERTS=6) tube of radius 0.035 m along the FK spine, and icosphere knuckles (r=0.055 m) instance at each joint. The seg_t float attribute (0..1 along the chain) drives an indigo→amber emission colour ramp. Modifier inputs (Segments, Seg Length, Joint Angle) are fully parametric — drag Joint Angle 0..1.57 rad and the whole chain updates in real-time. Saved as hf_poi_staff.blend; exported as hf_poi_staff.glb (single object, one draw call) for WebXR.",
  variations: [
    "Replace the White Noise Texture angle variation with a Driver connected to a custom Blender Action (keyframed per-joint). Animate the `Input_3` socket per joint index by assigning separate modifier inputs for each joint angle. This turns the FK chain into a fully rigged poi staff where each bend is independently keyframeable — poi choreography made procedural.",
    "Replace the icosphere knuckle with the faceted crystal gem from the GN Faceted Gem tutorial. The gem's own GN modifier applies after instancing; Decompose Matrix gives the correct joint rotation so each gem aligns its longest axis with the segment direction. Result: a glittering crystal-jointed staff for light-sculpture performance.",
    "Extend NUM_SEGS to 16 and add a second Repeat Zone that traverses the joint positions in reverse (from tip to root) to build a mirrored second arm. Join the two chains at a shared root to create a double-ended poi staff. The accumulated matrices from the forward pass are stored as a named attribute on the joints geometry and sampled by the reverse pass.",
    "Use Transform Direction instead of Transform Point on the segment axis vector (0,1,0) to extract a pure direction for the segment from each accumulated matrix. Feed these directions into Curve Tangent-driven AlignEulerToVector to orient flat panel geometry (like a twisted ribbon) instead of round tubes. Result: a segmented ribbon staff matching the Curve Tangent tutorial's ribbon technique.",
    "Replace the explicit Euler rotation in Combine Matrix with a Rotation driven by Scene Time — `RotateByAngle(Euler(0,0,0), axis=(0,0,1), angle=Scene.Frame × 0.04)` — so each joint spins at a different rate as the timeline advances. Without any simulation, the FK chain self-animates as a kinematic clock, each link a different gear ratio of the timeline.",
  ],
  troubleshooting: [
    {
      symptom:
        "RuntimeError: bpy.data.node_groups ... 'MATRIX' is not a valid socket type",
      cause:
        "The script is running on Blender 4.x or earlier, where the Matrix socket type on Repeat Zone items does not exist.",
      fix: "Upgrade to Blender 5.1. The Matrix nodes (GeometryNodeCombineMatrix, GeometryNodeMultiplyMatrices, GeometryNodeDecomposeMatrix, GeometryNodeTransformPoint) and the MATRIX repeat item type are 5.0+ exclusive features.",
    },
    {
      symptom: "The staff appears as a straight line regardless of Joint Angle",
      cause:
        "The FunctionNodeEulerToRotation node is not available or is misnamed in the installed Blender version, so the Rotation input to Combine Matrix defaults to zero (identity rotation) for every joint.",
      fix: "Open the GN editor, locate Combine Matrix inside the Repeat Zone, and manually check the Rotation input socket. If it is disconnected, create an AxisAngleToRotation node (axis=(1,0,0), angle=joint_angle_val) and connect its Rotation output to Combine Matrix's Rotation input instead.",
    },
    {
      symptom: "Knuckle spheres are not visible or are all at the scene origin",
      cause:
        "The SampleIndex node reading joint_rot from the joints geometry is using an index outside the point count range, returning zero/identity for all joints.",
      fix: "Verify that the Index input of SampleIndex is wired from the mesh line's vertex index (GeometryNodeInputIndex), not a constant. The Mesh Line has NUM_SEGS vertices indexed 0..NUM_SEGS-1, matching the joints point cloud which also has NUM_SEGS points. If the Mesh Line's count is not wired to the Segments group input, it may have a different count than the joints cloud.",
    },
    {
      symptom: "The tube segment between joint 0 and joint 1 is missing",
      cause:
        "The Mesh Line starts at the anchor origin (joint 0) and the first Repeat Zone iteration places its tip at joint 1. If joint 0 position is not included in the joints geometry, the Mesh Line SampleIndex lookup for index 0 returns zero (scene origin) rather than the actual first joint position.",
      fix: "Add a single point at the world origin (the staff root / joint 0) before the Repeat Zone and join it as the starting element of the joints geometry. Increase the Mesh Line count to NUM_SEGS+1 to account for the extra root point.",
    },
  ],
  externalLinks: [
    {
      label:
        "Blender 5.1 Manual — Geometry Nodes Matrix Utilities (CC-BY-SA 4.0, Blender Foundation)",
      href: "https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/utilities/matrix/",
    },
    {
      label:
        "Three.js — Matrix4 class: column-major 4×4 affine transforms (MIT, Mr.doob et al.)",
      href: "https://threejs.org/docs/#api/en/math/Matrix4",
    },
  ],
  relatedTutorials: [
    {
      label:
        "GN Rotation Nodes — Axis-Angle FK Robot Arm (prior Rotation-type FK tutorial)",
      href: "/tutorials/blender-tutorial-gn-rotation-nodes-axis-angle-fk-robot-arm",
    },
    {
      label:
        "GN Repeat Zone — Iterative L-System Crystal Antenna (Repeat Zone geometry accumulation pattern)",
      href: "/tutorials/blender-tutorial-gn-repeat-zone-crystal-antenna-webxr",
    },
    {
      label:
        "Python mathutils.Matrix — Transform Compose & Decompose for WebXR (Python-side matrix ops)",
      href: "/tutorials/blender-tutorial-python-mathutils-matrix-transform-compose-decompose-webxr",
    },
    {
      label:
        "GN Simulation Zone — Spring-Pendulum Poi: Lissajous Light-Painting (physics-based poi chain)",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-matrix-nodes-fk-chain-articulated-poi-staff",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "geometry-nodes",
      "matrix-nodes",
      "forward-kinematics",
      "repeat-zone",
      "blender-5x",
      "poi",
      "webxr",
    ],
    body: Body,
  },
  data,
);

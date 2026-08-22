import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const data = {
  title:
    "GN — Analytical 2-Joint IK: Law of Cosines Solver in a Geometry Nodes Modifier (Blender 5.1)",
  lede: "Build a closed-form two-link inverse kinematics solver entirely in Geometry Nodes — no Simulation Zone, no iteration, no Python at solve time — using the law of cosines to drive a planar poi arm rig.",
  date: "2026-07-26",
  externalSources: [
    {
      label: "Blender 5.1 Manual — Geometry Nodes: Math & Vector Math",
      url: "https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/utilities/math/",
      licence: "CC-BY-SA 4.0",
      author: "Blender Foundation",
    },
    {
      label: "OpenUSD UsdSkel — skeletal kinematics reference (Apache 2.0)",
      url: "https://github.com/PixarAnimationStudios/OpenUSD/tree/release/pxr/usd/usdSkel",
      licence: "Apache-2.0",
      author: "Pixar Animation Studios",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Every IK solver faces the same inversion problem: given where you{" "}
        <em>want</em> the end effector to be, what joint angles get it there?
        Iterative solvers (CCD, FABRIK) approach the answer frame-by-frame —
        they need a Simulation Zone to carry state. For a two-link planar arm
        the answer is algebraically exact: one <code>ARCTAN2</code>, two{" "}
        <code>ARCCOSINE</code> calls, and the joints snap to the correct pose
        in a single GN evaluation pass.
      </p>
      <p>
        This is the canonical poi reach model: shoulder at the origin, wrist at
        the end of L1 + L2, the poi head at the wrist. Move the target Empty
        and the arm tracks in real time — no simulation cache, no bake button.
        The GN modifier is pure data-flow from target location to output mesh.
        Compare it with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-matrix-nodes-fk-chain-articulated-poi-staff"
          className={lk}
        >
          FK chain tutorial
        </Link>{" "}
        (which does the forward pass: given angles → find end effector) and the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-ik-robot-arm"
          className={lk}
        >
          armature IK tutorial
        </Link>{" "}
        (Blender&rsquo;s built-in bone IK constraint).
      </p>

      <h2>The maths in 60 seconds</h2>
      <p>
        Root R at origin, target T = (tx, ty, 0), upper arm L1, lower arm L2.
      </p>
      <pre>{`d  = sqrt(tx² + ty²)                   // reach distance

// Elbow angle (interior angle at joint B)
cos θ_e = (L1² + L2² − d²) / (2·L1·L2)    // law of cosines
θ_e     = arccos( clamp(cos θ_e, −1, 1) )

// Shoulder angle (angle from +X to upper arm)
α = atan2(ty, tx)                       // raw direction to target
cos β = (d² + L1² − L2²) / (2·d·L1)   // angle correction at shoulder
φ₁ = α − β                             // elbow-up solution

// Lower arm world angle
φ₂ = φ₁ + π − θ_e                     // completes the triangle`}</pre>
      <p>
        Clamping <code>cos θ_e</code> to [−1, 1] handles both singularities:
        when <code>d &gt; L1 + L2</code> (over-reach) it clips to −1 and{" "}
        <code>θ_e = π</code>, so <code>φ₂ = φ₁</code> — arm fully extended.
        A 1 mm floor on <code>d</code> prevents division by zero in the β
        denominator when the target sits exactly at the root.
      </p>

      <h2>Elbow-up vs elbow-down</h2>
      <p>
        The law of cosines gives two valid poses for every reachable target.{" "}
        <code>φ₁ = α − β</code> places the elbow above the shoulder–target
        line (elbow-up, natural for overhead poi throws).{" "}
        <code>φ₁ = α + β</code> gives the elbow-down solution. In the
        blueprint, change <code>ELBOW_SIGN = -1.0</code> to <code>+1.0</code>{" "}
        and replace the <code>SUBTRACT</code> node connecting α and β with an{" "}
        <code>ADD</code> node.
      </p>

      <h2>Building the GN tree in Python</h2>
      <p>
        The blueprint constructs the entire node tree at script time so it is
        diff-able and reproducible.{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-gn-tree-from-python-index-switch-poi-head-webxr"
          className={lk}
        >
          GN Tree from Python
        </Link>{" "}
        covers the interface API in depth; the key points here are:
      </p>
      <pre>{`ng  = bpy.data.node_groups.new("HF_2JointIK", "GeometryNodeTree")
itf = ng.interface
itf.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
itf.new_socket("Target",   in_out="INPUT",  socket_type="NodeSocketObject")`}</pre>
      <p>
        The <code>Target</code> socket accepts any Object. Wiring it to an
        Empty and setting <code>transform_space = &quot;RELATIVE&quot;</code>{" "}
        on the Object Info node makes the IK self-relative — move the arm
        object and the local target offsets stay correct.
      </p>

      <h2>Key node chain (elbow angle)</h2>
      <pre>{`SepXYZ → tx² + ty² → d² → SQRT → d → d_safe(≥0.001)

L1² + L2²
         \\
          SUBTRACT → numer_e
         /                  \\
        d²                   DIVIDE → cos_θe → clamp(−1,1) → ARCCOSINE → θ_e
                             /
           2·L1·L2 ─────────`}</pre>
      <p>
        The same pattern repeats for β (swap L1²−L2²+d² in the numerator and
        2·d·L1 in the denominator). Two MINIMUM + MAXIMUM pairs handle the
        clamp without needing a ShaderNodeClamp (safe across Blender versions).
      </p>

      <h2>Geometry output</h2>
      <p>
        Positions in hand, the geometry is straightforward:
      </p>
      <pre>{`elbow_pos = CombineXYZ(L1·cos φ₁, L1·sin φ₁, 0)
wrist_pos = CombineXYZ(elbow_x + L2·cos φ₂, elbow_y + L2·sin φ₂, 0)

CurveLine(start=(0,0,0), end=elbow_pos) → CurveToMesh(profile_circle)
CurveLine(start=elbow_pos, end=wrist_pos) → CurveToMesh(profile_circle)

Points(1) → SetPosition(elbow_pos) → InstanceOnPoints(IcoSphere) → Realize
Points(1) → SetPosition(wrist_pos) → InstanceOnPoints(PoiSphere) → Realize

JoinGeometry`}</pre>
      <p>
        A single 8-vertex circle profile is shared by both tube segments — one{" "}
        <code>GeometryNodeCurvePrimitiveCircle</code> node, two{" "}
        <code>GeometryNodeCurveToMesh</code> links. The profile is not instanced
        (it&rsquo;s referenced, not copied), so changing its radius on the node
        updates both segments simultaneously.
      </p>

      <h2>Poi performance connection</h2>
      <p>
        In flow arts the performer&rsquo;s arm is physically this rig: shoulder
        (R), wrist (B), poi tether attachment (T). Analytical 2R IK lets you
        bake the <em>arm pose required</em> to place the poi at any recorded
        world position — useful for planning cue points against a spatial audio
        track or for checking whether a throw trajectory stays within the
        performer&rsquo;s reach envelope. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting"
          className={lk}
        >
          spring-pendulum poi tutorial
        </Link>{" "}
        for the physical simulation counterpart and the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-fk-ik-switch-custom-property-driver"
          className={lk}
        >
          FK/IK switch tutorial
        </Link>{" "}
        for blending between FK and IK in a standard armature rig.
      </p>

      <h2>Extending to 3D</h2>
      <p>
        The planar formulation here constrains the arm to the XY plane. To lift
        it to full 3D: project the target onto the plane defined by the current
        shoulder-forward axis, solve the 2R IK in that plane, then rotate the
        shoulder around the world Z axis to face the target. That outer rotation
        is a single <code>ARCTAN2</code> node on the (tx, ty) pair before the
        IK solve — the inner planar logic is unchanged.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-rotation-math-analytical-2joint-ik-law-cosines-poi-arm",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "geometry-nodes",
      "inverse-kinematics",
      "analytical-ik",
      "law-of-cosines",
      "math-nodes",
      "blender-5x",
      "poi",
      "rigging",
    ],
    body: Body,
  },
  data,
);

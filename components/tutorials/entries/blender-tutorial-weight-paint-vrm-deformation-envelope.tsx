import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function WeightPaintVrmBody() {
  return (
    <>
      <p>
        Weight painting is the invisible contract between a skeleton and its
        skin: each vertex stores a float between 0 and 1 for every bone that
        should influence it, and the renderer sums those weighted
        bone-transformed positions at every frame. Get the weights wrong and
        you get the candy-wrapper elbow twist, volume collapse at the shoulder,
        or a waist that folds flat — artefacts that no amount of shape-key
        correction will fully hide. Get them right and the character moves as
        if the skin actually grew around the skeleton.
      </p>

      <p className="mt-3">
        This tutorial covers the full clean-up pipeline: Blender 5.1&rsquo;s
        heat-diffusion automatic weights as a starting point, followed by
        Smooth → Normalise → Limit Total (4) → Mirror X in that exact order,
        then a manual brush pass on problem joints. The final GLB export carries
        skinning data within the glTF 2.0 <code>JOINTS_0</code> /&nbsp;
        <code>WEIGHTS_0</code> attribute pair, ready for{" "}
        <a
          href="https://github.com/pixiv/three-vrm"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          @pixiv/three-vrm
        </a>{" "}
        in WebXR.
      </p>

      <p className="mt-3">
        Weight painting sits between the armature work in the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-bbone-cartoon-spine-vrm"
          className={lk}
        >
          B-Bone cartoon spine tutorial
        </Link>{" "}
        and the deformation fixup in the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-corrective-shape-keys-driver"
          className={lk}
        >
          corrective shape keys tutorial
        </Link>
        . Clean weights are the prerequisite for both: a corrective shape key
        can only correct what the weight field leaves bent, not what it gets
        entirely wrong.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Heat diffusion vs Envelope
      </h2>
      <p>
        <code>Parent → Armature → Automatic Weights</code> runs a Laplacian
        heat-diffusion solve on the mesh dual graph. Each bone is a
        constant-temperature source; Blender iterates the heat equation until
        steady state, then normalises the per-bone fields per vertex. The result
        respects topology — a bone inside a hollow mesh will not bleed influence
        through the wall the way the older Envelope mode does. Envelope wraps
        each bone in a capsule and assigns weight by Euclidean distance to the
        capsule surface, which is faster but topology-blind. Use Envelope only
        as a last resort on meshes where heat diffusion stalls (non-manifold
        geometry, highly disconnected islands).
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The clean-up sequence and why the order matters
      </h2>
      <p>
        After automatic weights: open <em>Object Mode</em>, select the mesh,
        then run these four operators in order:
      </p>
      <ol className="list-decimal list-inside mt-2 space-y-2 text-sm">
        <li>
          <strong>Vertex Groups → Smooth</strong> — runs a Laplacian pass
          across the vertex adjacency graph. Do this first, before any
          truncation: if you limit to 4 influences first, you smooth a mixture
          of real values and freshly-zeroed slots, pushing the remaining weights
          away from their correct sum.
        </li>
        <li>
          <strong>Vertex Groups → Normalise All</strong> — forces the sum of
          all influences per vertex to exactly 1.0. Linear Blend Skinning (LBS)
          implicitly expects this; unnormalised weights inflate or deflate volume
          in proportion to their excess or deficit.
        </li>
        <li>
          <strong>Vertex Groups → Limit Total (4)</strong> — the glTF 2.0 spec
          stores influences in <code>JOINTS_0</code> / <code>WEIGHTS_0</code>,
          both <code>vec4</code>. GPU skinning hardware enforces the same limit.
          Exceeding 4 causes silent truncation at export: the exporter drops the
          smallest influences and does not renormalise, producing subtle but
          non-trivial volume errors on dense rigs.
        </li>
        <li>
          <strong>Vertex Groups → Mirror</strong> (<code>flip_group_names=True</code>)
          — copies weight values across the X-symmetry plane from <code>.L</code>{" "}
          vertex groups to matching <code>.R</code> groups. Mirror after
          smoothing so the smoothed values propagate rather than the raw
          heat-diffusion output. Requires: (a) X-symmetric topology within
          mirror tolerance, (b) <code>.L</code> / <code>.R</code> suffix
          convention on bone names.
        </li>
      </ol>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Manual brush workflow
      </h2>
      <p>
        Switch to <em>Weight Paint</em> mode (<kbd>Ctrl+Tab</kbd>). Activate a
        vertex group in the Properties sidebar. The viewport shows a blue
        (0.0) → green (0.5) → red (1.0) heat map per vertex. Key brushes:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
        <li>
          <strong>Draw</strong> — adds weight up to the brush value; hold{" "}
          <kbd>Ctrl</kbd> to subtract.
        </li>
        <li>
          <strong>Blur</strong> — Gaussian-style averaging across neighbours;
          essential for softening the joint seam between shoulder and upper arm.
        </li>
        <li>
          <strong>Average</strong> — sets all vertices under the brush to the
          mean weight within the stroke radius; useful for flattening
          inconsistent patches.
        </li>
        <li>
          <strong>Gradient</strong> (<kbd>G</kbd> in Weight Paint mode) — linear
          or radial fill between two endpoints; fastest way to set an
          influence ramp along a limb.
        </li>
      </ul>
      <p className="mt-3">
        Enable <em>Pose Mode</em> preview while painting: select the armature,
        enter Pose Mode, then <kbd>Shift-click</kbd> the mesh — you can now
        pose bones with <kbd>R</kbd> while the weight paint overlay stays
        active, watching deformation update in real time.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        VRM-specific considerations
      </h2>
      <p>
        The{" "}
        <a
          href="https://github.com/vrm-c/vrm-specification"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          VRM specification
        </a>{" "}
        (MIT) maps bones to a fixed humanoid skeleton via <code>humanBones</code>{" "}
        — for example <code>upperArm</code>, <code>lowerArm</code>,{" "}
        <code>spine</code>. Every joint in that chain is subject to the same
        4-influence limit and the same LBS pipeline as standard glTF. The
        additional constraint is spring bones: VRM&rsquo;s{" "}
        <code>VRMCSpringBone</code> extension (covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          spring bones tutorial
        </Link>
        ) attaches dynamic chains to specific humanoid bones — if the weight
        painting on those attachment vertices is ambiguous (split between the
        spring bone root and its parent), the spring motion reads incorrectly
        at runtime in <code>@pixiv/three-vrm</code>.
      </p>
      <p className="mt-3">
        The FK/IK switch described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-fk-ik-switch-custom-property-driver"
          className={lk}
        >
          FK/IK tutorial
        </Link>{" "}
        uses a <em>mechanism</em> layer of non-deforming bones alongside the
        actual deform bones. Only deform bones should ever appear as vertex
        groups in the final export: set <code>bone.use_deform = False</code> on
        all control and mechanism bones, or use{" "}
        <code>Vertex Groups → Clean</code> with a limit of 0.001 to remove
        effectively-zero contributions from non-deform groups before export.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc list-inside space-y-2 text-sm">
        <li>
          <strong>Heat diffusion fails / produces all-zero weights</strong> —
          the mesh has non-manifold edges or disconnected faces adjacent to the
          bone. Run <em>Mesh → Clean Up → Fill Holes</em> and{" "}
          <em>Merge by Distance</em> first, then re-parent.
        </li>
        <li>
          <strong>Mirror produces identical weights on both sides</strong> —
          bone names lack <code>.L</code> / <code>.R</code> suffix. Rename in
          Edit Mode and re-run Mirror with <code>flip_group_names=True</code>.
        </li>
        <li>
          <strong>GLB export raises &ldquo;max influences exceeded&rdquo;</strong> —
          Limit Total (4) was not run before export. Run it from Object Mode
          with all vertex groups selected.
        </li>
        <li>
          <strong>Volume collapse at shoulder in three-vrm</strong> — the
          Normalise step was skipped. Non-normalised weights cause the LBS
          weighted sum to deviate from 1.0, shrinking or inflating the skinned
          geometry.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Outside references
      </h2>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          Blender Documentation Team —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/sculpt_paint/weight_paint/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual: Weight Paint Mode
          </a>{" "}
          (CC-BY-SA-4.0). Related: Blender Manual{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/animation/armatures/skinning/parenting.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Armature Parenting
          </a>
          .
        </li>
        <li>
          VRM Consortium —{" "}
          <a
            href="https://github.com/vrm-c/vrm-specification"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            vrm-specification
          </a>{" "}
          (MIT). Related: pixiv —{" "}
          <a
            href="https://github.com/pixiv/three-vrm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            three-vrm
          </a>{" "}
          (MIT).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "2–3 hours",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1", "A rigged mesh (or run blueprint.py)"],
      tools: ["Weight Paint brush set", "Pose Mode preview"],
    },
    steps: [
      {
        title: "Parent with automatic weights",
        body: "Select mesh + armature, set armature active, run Object → Parent → Armature → Automatic Weights. Inspect the vertex groups created — one per bone.",
      },
      {
        title: "Smooth vertex groups",
        body: "Object Mode → Object → Vertex Groups → Smooth. Factor 0.5, Repeat 5. Removes sharp heat-diffusion boundaries at bone intersections.",
      },
      {
        title: "Normalise All",
        body: "Object → Vertex Groups → Normalise All. Enforces sum-to-1 per vertex for correct Linear Blend Skinning.",
      },
      {
        title: "Limit Total to 4",
        body: "Object → Vertex Groups → Limit Total. Set limit to 4. Required by glTF JOINTS_0 / WEIGHTS_0 vec4 spec.",
      },
      {
        title: "Mirror to right side",
        body: "Object → Vertex Groups → Mirror. Enable flip_group_names. Copies .L weights to .R on the mirrored vertices.",
      },
      {
        title: "Manual fixup in Weight Paint",
        body: "Switch to Weight Paint mode. Activate each joint group in turn. Use Blur brush at seams, Gradient for limb ramps. Test in live Pose Mode preview.",
      },
      {
        title: "Export GLB with skinning",
        body: "File → Export → glTF 2.0. Enable Skinning. Draco level 6. Apply transforms. Confirm JOINTS_0/WEIGHTS_0 appear in the glTF JSON block.",
      },
    ],
  },
  {
    slug: "blender-tutorial-weight-paint-vrm-deformation-envelope",
    title:
      "Weight Painting — Automatic Weights, Gradient, Mirror & Smooth: Deformation Envelope for VRM",
    date: "2026-06-19",
    kind: "tutorial",
    excerpt:
      "Heat-diffusion auto-weights, then Smooth → Normalise → Limit 4 → Mirror X — the correct clean-up order for glTF-ready skinning on a VRM character mesh in Blender 5.1.",
    Body: WeightPaintVrmBody,
  },
);

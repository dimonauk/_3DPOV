import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function BboneCartoonSpineBody() {
  return (
    <>
      <p>
        Every bone in Blender deforms its surrounding vertices with a linear
        interpolation between head and tail — fine for rigid limbs, wrong for a
        spine. A cartoon character&rsquo;s back is a compound Bézier curve, not a
        stack of rigid rods. Bendy Bones (B-Bones) solve this by subdividing
        each bone into <code>bbone_segments</code> cubic sub-segments along a
        Bézier spline. The mesh deforms to the curve instead of straight
        segments, and the Bézier handles are controllable bones in their own
        right.
      </p>

      <p className="mt-3">
        The technique sits directly beside the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-fk-ik-switch-custom-property-driver"
          className={lk}
        >
          FK/IK switch tutorial
        </Link>{" "}
        in the studio rigging pipeline: once the B-Bone spine holds its curve
        correctly, layering an IK solver on top of a TANGENT-handle rig is the
        natural next step. The spring bones used for VRM hair in the{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          VRM spring bones tutorial
        </Link>{" "}
        follow a structurally identical parent–child chain logic — the only
        difference is that spring bones are physics-driven in the runtime rather
        than animator-driven at bake time.
      </p>

      <p className="mt-3">
        Named bone collections, built in the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-bone-collections-custom-shapes"
          className={lk}
        >
          bone collections tutorial
        </Link>
        , are the recommended way to organise the resulting rig: one collection
        for deform bones (<code>spine_NN</code>), one for handle controls
        (<code>bbone_handle_root</code>, <code>bbone_handle_tip</code>), and
        optionally one for non-deforming body control bones. Corrective shape
        keys for extreme spine poses — covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-corrective-shape-keys-driver"
          className={lk}
        >
          corrective shape keys tutorial
        </Link>{" "}
        — are the next production step after weight painting is settled.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        AUTO vs TANGENT handles
      </h2>
      <p>
        B-Bones offer four handle types: <code>AUTO</code>, <code>ABSOLUTE</code>,{" "}
        <code>RELATIVE</code>, and <code>TANGENT</code>. AUTO is the default and
        averages the directions of adjacent bones to estimate the Bézier
        tangent, which works passably for mid-chain bones. TANGENT reads an
        explicit custom handle bone&rsquo;s local <code>-Y</code> axis as the
        tangent vector. This distinction matters at the chain root and tip: AUTO
        flattens both ends, producing a tight &lsquo;C&rsquo; with no control
        over entry angle. TANGENT on both ends lets the animator steer the
        pelvis tilt and shoulder lean independently — the minimum requirement
        for a credible cartoon walk cycle.
      </p>
      <p className="mt-3">
        The root handle in this blueprint is <em>unparented</em>: it stays in
        world space while the spine deforms above it, modelling the pelvis bone
        that anchors the spine. The tip handle is parented to{" "}
        <code>spine_06</code> and connected, so it travels with the chest and
        extends the exit tangent naturally.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Mesh density and the GLB bake
      </h2>
      <p>
        On glTF export, Blender bakes each B-Bone&rsquo;s Bézier curve into{" "}
        <code>bbone_segments</code> standard linear bones. A six-bone spine at
        four segments exports as 24 spine bones. Plan the torso mesh density to
        match: one edge loop per sub-segment (24 loops for this rig) ensures
        each linear bone deforms exactly one ring of vertices — no staircase
        artefacts on shallow bends. Enable{" "}
        <strong>Armature → Export Deformation Bones Only</strong> in the glTF
        export dialog to exclude the non-deforming handle bones; they would
        bloat the armature and confuse a VRM skeleton mapper.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/animation/armatures/bones/properties/bendy_bones.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Bendy Bones
          </a>{" "}
          &mdash; CC-BY-SA-4.0, Blender Documentation Team. Segment count,
          handle types (AUTO / ABSOLUTE / RELATIVE / TANGENT), ease-in/out
          controls, and the bbone_curveinx/y pose-space offsets used for
          procedural animation. Related:{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.Bone.html#bpy.types.Bone.bbone_segments"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.Bone.bbone_segments API
          </a>{" "}
          and the{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/files/import_export/gltf2.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF 2.0 exporter documentation
          </a>
          .
        </li>
        <li>
          <a
            href="https://studio.blender.org/films/sprite-fright/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Studio &mdash; Sprite Fright (Open Movie)
          </a>{" "}
          &mdash; CC BY 4.0, Blender Studio. The Sprite Fright character rigs
          use B-Bones extensively for the cartoon-style spine and neck on every
          character. The production files are available as a reference for
          handle placement, segment counts, and corrective shape key
          integration. Related:{" "}
          <a
            href="https://studio.blender.org/films/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Studio open movies
          </a>{" "}
          (Charge, Cosmos Laundromat, Wing It On) which share the same
          rigging conventions.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/rigging/rigging-bbone-cartoon-spine-vrm",
    time: "30 to 45 minutes",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: [
        "Scripting workspace — Text Editor",
        "3D Viewport in Pose Mode",
        "Properties panel ▸ Bone ▸ Bendy Bones section",
        "Graph Editor (optional — for checking keyframe interpolation)",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Scripting workspace → open blueprint.py → Run Script. A tapered cylindrical torso skinned to a six-bone spine appears. The armature displays as a 3-D BBONE ribbon, not sticks — the bendy-bone segments are visible as a swept tube. The Info bar shows 'Applied parent' confirming Automatic Weights ran.",
      },
      {
        title: "Inspect the Bendy Bones settings",
        body: "Tab into Pose Mode. Select spine_03. In Properties ▸ Bone ▸ Bendy Bones: Segments = 4, Handle Start type = AUTO (mid-chain default), Handle End type = AUTO. Note that spine_01's Handle Start type reads TANGENT pointing to bbone_handle_root, and spine_06's Handle End type reads TANGENT pointing to bbone_handle_tip.",
      },
      {
        title: "Pose a 'C' lean",
        body: "Select all spine bones (A). Press R X, drag to approximately 70° total. Hold Ctrl to snap at 10° increments. Release. The torso follows a smooth curve with no kinks at the bone boundaries — that is bbone_segments doing the interpolation. Press Alt+R to reset the pose.",
      },
      {
        title: "Pose an 'S' curve",
        body: "Select spine_01 and spine_02. Press R X 15 Enter — lower spine rotates 15° forward. Then select spine_05 and spine_06. Press R X -15 Enter — upper spine rotates 15° backward. The torso forms a full S-curve. This is impossible with standard linear bones without far more bone count.",
      },
      {
        title: "Steer the entry tangent with the handle bone",
        body: "Select bbone_handle_root (the control below the pelvis). Press R Y, drag. Watch the bottom of the spine: the entry curve changes direction without moving any spine bone. This is the TANGENT handle overriding the Bézier start tangent — the pelvis tilt is now independent of the lumbar rotation. Reset with Alt+R.",
      },
      {
        title: "Record and export",
        body: "Scripting workspace → open record.py → Run Script. Four poses animate across 120 frames and render to public/library/videos/rigging/rigging-bbone-cartoon-spine-vrm/viewport.mp4. For GLB: File ▸ Export ▸ glTF 2.0, enable Armature ▸ Export Deformation Bones Only, disable Include ▸ Custom Properties. The exported armature has 24 spine bones from the bbone_segments bake.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Automatic Weights fails with 'Heat Weighting: Failed' error",
        cause:
          "The torso mesh intersects the armature bones, or the mesh has disconnected geometry. Heat diffusion requires a manifold (watertight) shell with bones strictly inside it.",
        fix: "In Object Mode, select torso, Tab into Edit Mode, press M to merge by distance (removes duplicate verts). Check for interior faces. Also verify the armature origin is at world origin (not offset inside the mesh) by pressing Ctrl+A ▸ All Transforms on the armature before running the parent operator.",
      },
      {
        symptom: "B-Bone ribbon is invisible — bones display as plain sticks",
        body: "display_type = 'BBONE' is set on the armature data block, but the viewport shading or Overlay panel overrides it.",
        fix: "In the 3D Viewport header ▸ Viewport Overlays dropdown, enable 'Bones'. Also confirm arm_data.display_type == 'BBONE' in the Properties ▸ Object Data panel ▸ Viewport Display ▸ Display As dropdown. The BBONE mode only displays in Pose and Object modes; in Edit Mode bones always show as octahedra.",
      },
      {
        symptom:
          "GLB shows only 6 spine bones, not 24 — B-Bone segments were not baked",
        cause:
          "The Armature export option 'Export Deformation Bones Only' was enabled, but the B-Bone sub-bone bake setting was left off. The exporter does not bake B-Bones by default if the armature has no animation data.",
        fix: "Keyframe at least one spine bone pose, then re-export. Alternatively, in the glTF export dialog, Armature section, enable 'Apply Pose' and check that 'Armature → Export All Bone Influences' is on. B-Bone baking only activates when the exporter detects an animated armature or when Apply Pose is used.",
      },
    ],
    finalResult:
      "A six-bone B-Bones spine rig with TANGENT handle controls at root and tip, skinned to a 24-loop tapered torso. The rig demonstrates smooth 'C' and 'S' Bézier deformation. A 120-frame viewport recording cycles through neutral, forward lean, S-curve, and lateral sway.",
  },
  {
    slug: "blender-tutorial-rigging-bbone-cartoon-spine-vrm",
    title:
      "Rigging: B-Bones Cartoon Spine — Segmented Bézier Deformation for VRM Characters (Blender 5.1)",
    date: "2026-06-18",
    kind: "tutorial",
    excerpt:
      "Use Bendy Bones (bbone_segments=4) with TANGENT custom handle bones to build a six-vertebra cartoon spine that holds smooth 'C' and 'S' curves — and understand how the Bézier deformation bakes to 24 standard linear bones on glTF export for VRM compatibility.",
    tags: [
      "blender",
      "rigging",
      "armature",
      "bbone",
      "bendy-bones",
      "cartoon",
      "vrm",
      "spine",
    ],
    Body: BboneCartoonSpineBody,
  },
);

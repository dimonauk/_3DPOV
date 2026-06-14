import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CorrectiveShapeKeysBody() {
  return (
    <>
      <p>
        Automatic skinning is linear. Each vertex&rsquo;s final position is the
        weighted average of every contributing bone&rsquo;s transformation matrix
        applied to that vertex. At a joint where two bones pull in very different
        directions &mdash; an elbow bent at 90&deg; is the classic case &mdash;
        the blended result moves <em>inward</em> toward the chord between the two
        bone endpoints. Volume is lost. The mesh pinches. This is not a
        weight-painting error; it is an unavoidable consequence of linear blend
        skinning (LBS) and cannot be fixed by redistribution of weights alone.
      </p>

      <p className="mt-3">
        A corrective shape key exploits the order in which Blender evaluates a
        mesh: first shape keys are applied (blending vertex positions toward the
        key&rsquo;s stored coordinates), then the armature modifier deforms the
        result. The corrective key&rsquo;s job is to push the elbow-region
        vertices outward in <em>rest space</em> &mdash; before the bones do their
        work &mdash; so that after the armature collapses them inward, the net
        result is the correct volume. It is pre-compensation, not post-fix.
      </p>

      <p className="mt-3">
        This tutorial builds on the weight-painting and skinning knowledge from
        the{" "}
        <Link href="/tutorials/blender-tutorial-armature-weight-paint" className={lk}>
          armature and weight-paint tutorial
        </Link>{" "}
        and extends the shape-key fundamentals from the{" "}
        <Link href="/tutorials/blender-tutorial-shape-keys-morph-targets" className={lk}>
          shape keys and morph targets tutorial
        </Link>
        . The driver setup complements the parametric-animation drivers in the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
          className={lk}
        >
          animation drivers tutorial
        </Link>
        . The finished rig feeds directly into the VRM pipeline covered in the{" "}
        <Link href="/tutorials/blender-tutorial-nla-action-clips-vrm" className={lk}>
          NLA action clips tutorial
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why LBS collapses at joints
      </h2>
      <p>
        Linear Blend Skinning computes each vertex&rsquo;s final world position as
        the weighted sum of bone-transformed positions:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`p_final = Σ_i  w_i · M_i · p_rest

# At 90° elbow bend:
#   M_upper = identity (unchanged)
#   M_forearm = rotated −90° around local X
# A 50/50-weighted vertex lands BETWEEN those two transformed positions —
# inside the mesh, not on its surface.  Collapse depth ≈ sin(θ/2) × bone_length.
# At 90° that is ~29% of bone length inward.`}</pre>

      <p className="mt-3">
        No weight redistribution fixes this because the collapse is geometric.
        Dual Quaternion Skinning (DQS) reduces it but does not eliminate it at
        large angles. A corrective shape key adds back the lost volume explicitly.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Pipeline order: why the key must live in rest space
      </h2>
      <p>
        Blender&rsquo;s mesh evaluation pipeline runs in this fixed order:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`1. Basis vertex positions
2. Shape keys: p = Basis + Σ_k  value_k · (key_k − Basis)
3. Armature deform (LBS / DQS)  ← shape keys finish BEFORE this
4. Additional modifiers (Subdivision Surface, etc.)
5. World transform`}</pre>

      <p className="mt-3">
        Because shape keys run before skinning, the corrective key cannot be
        authored in the deformed (bent) pose. It must express, in rest
        coordinates, the extra geometry that &mdash; after LBS collapses
        it &mdash; yields the correct deformed shape. For an elbow resting along
        +Y, this means pushing posterior-elbow vertices toward +Z in rest space.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Vertex selection: the blend-weight band
      </h2>
      <p>
        Not all vertices collapse equally. Only those with a balanced blend
        between two bones pinch inward. The blueprint reads each vertex&rsquo;s
        weight in both vertex groups and computes a blend fraction:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`forearm_fraction = w_forearm / (w_upper + w_forearm)

# Only vertices in the band [0.20, 0.80] receive a correction.
# Vertices owned >80% by one bone deform cleanly under LBS.
# The parabolic blend-strength term concentrates correction at the apex:
blend_strength = 1.0 - abs(forearm_fraction - 0.5) * 2.0

# A Gaussian falloff along Y keeps the correction local to the elbow:
falloff = math.exp(-((dist_y / (ARM_HALF_LENGTH * 0.15)) ** 2))

delta = CORRECTION_MAGNITUDE * falloff * blend_strength`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        TRANSFORMS driver in LOCAL_SPACE
      </h2>
      <p>
        The shape key value is wired to the forearm bone&rsquo;s local-X rotation
        via a{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/animation/drivers/introduction.html"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          TRANSFORMS driver variable
        </a>{" "}
        (Blender Documentation Team, CC-BY-SA-4.0). Three design choices matter:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`var.type             = 'TRANSFORMS'
tgt.bone_target      = "forearm"
tgt.transform_type   = 'ROT_X'
tgt.transform_space  = 'LOCAL_SPACE'
drv.expression       = "max(0.0, min(1.0, -var / 1.5708))"

# LOCAL_SPACE  — measures angle between forearm and its parent.
#   WORLD_SPACE would fire if the whole character turned; LOCAL_SPACE
#   fires only on actual elbow flex.
#
# TRANSFORMS vs SINGLE_PROP — a SINGLE_PROP on rotation_euler[0]
#   silently returns 0 if the animator later switches the bone to
#   QUATERNION mode.  TRANSFORMS is mode-agnostic.
#
# Negation in expression — forearm flexion is negative X rotation.
#   Without negation the driver fires on extension, not flexion.
#   1.5708 = π/2 = 90°; replace with the radian angle of worst collapse.`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Failure modes</h2>
      <ul className="list-disc list-inside text-sm space-y-2 mt-2">
        <li>
          <strong>Shape key value stays at 0 always.</strong> Likely the bone
          rotation mode was changed to <code>QUATERNION</code> after setup. Open
          the driver (right-click key value &rarr; Edit Driver) and confirm the
          variable type is <code>TRANSFORMS</code>, not <code>SINGLE_PROP</code>.
        </li>
        <li>
          <strong>Correction fires in wrong direction.</strong> The rest-pose arm
          points in a different axis than assumed. Check the arm mesh&rsquo;s local
          axes in the N-panel and update the correction Vector from{" "}
          <code>(0, 0, delta)</code> to the actual posterior axis.
        </li>
        <li>
          <strong>Corrective over-fires at angles less than 90&deg;.</strong>{" "}
          Replace <code>1.5708</code> in the expression with the radian angle where
          collapse is worst on your rig (e.g. <code>1.047</code> for 60&deg;). Or
          use a two-point F-curve driver instead of a scripted expression.
        </li>
        <li>
          <strong>Blueprint errors: no shape key in Properties panel.</strong> Run
          the script in a clean scene; <code>clear_scene()</code> is called at
          the top. A name collision with an existing &ldquo;arm_mesh&rdquo; object
          will silently redirect operations.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Extending to knee, shoulder, and wrist
      </h2>
      <p>
        The same pattern scales to any joint. Knee flexion is positive X rotation
        (replace <code>-var</code> with <code>var</code> in the expression). The
        shoulder needs two corrective keys driven by two driver variables (ROT_X
        and ROT_Z) summed additively. Wrist is usually unnecessary unless the
        character has close-up hand shots. For VRM avatars, corrective key names
        following the <code>Fcl_ARM_L_Elbow</code> convention keep the shape key
        panel readable; see the{" "}
        <Link href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain" className={lk}>
          VRM spring-bones tutorial
        </Link>{" "}
        for how these live alongside physics-driven hair keys.
      </p>

      <p className="mt-3">
        For GLB export, bake the driver to keyframes via Object &rarr; Animation
        &rarr; Bake Action with Visual Keying enabled. The driver does not
        export &mdash; glTF has no driver concept &mdash; but the baked shape key
        values export as morph target weight animations. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-ik-robot-arm"
          className={lk}
        >
          IK robot arm tutorial
        </Link>{" "}
        for how baked actions interact with IK constraints on export.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/animation/shape_keys/introduction.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Shape Keys
          </a>{" "}
          — CC-BY-SA-4.0, Blender Documentation Team. Pipeline order, Relative vs
          Absolute modes, data path for key_block.data[vi].co. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/animation/shape_keys/shape_keys_panel.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Shape Keys Panel
          </a>{" "}
          and the{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.ShapeKey.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            ShapeKey Python API
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/animation/drivers/introduction.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Drivers
          </a>{" "}
          — CC-BY-SA-4.0, Blender Documentation Team. TRANSFORMS variable type,
          transform space semantics, scripted expression evaluation. Related:{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.DriverVariable.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            DriverVariable API
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/nielsvaes/SkinningTools"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            SkinningTools (MIT, Niels Vaes)
          </a>{" "}
          &mdash; per-vertex weight inspection utilities for Blender and Maya.
          The blend-zone selection logic in this blueprint is informed by the
          library&rsquo;s weight-analysis functions. Related:{" "}
          <a
            href="https://github.com/nielsvaes/CONSTANTS"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            nielsvaes/CONSTANTS
          </a>{" "}
          (companion library, MIT).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/rigging/rigging-corrective-shape-keys-driver",
    time: "one to two hours",
    difficulty: "advanced",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: [
        "Scripting workspace — Text Editor",
        "Properties ▸ Object Data ▸ Shape Keys panel",
        "Graph Editor ▸ Drivers sidebar",
        "Pose Mode for driver testing",
        "Weight Paint Mode for blend-zone inspection",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Scripting workspace → open blueprint.py → Run Script. The Info bar confirms the corrective shape key was added and the driver wired. A cylindrical arm with an elbow bent at −90° appears in the viewport. Properties ▸ Object Data ▸ Shape Keys shows 'Basis' and 'elbow_corrective' with a purple driver icon on the value field.",
      },
      {
        title: "Inspect the weight distribution",
        body: "Select arm_mesh, switch to Weight Paint Mode, click vertex group 'upper_arm'. The gradient runs from deep red at the shoulder end to blue at the wrist. Vertices in the elbow band (0.20–0.80 blend fraction) appear in yellow-green — these are the only ones the corrective key modifies.",
      },
      {
        title: "Verify the shape key geometry",
        body: "In Object Mode, select arm_mesh. Properties ▸ Object Data ▸ Shape Keys — set 'elbow_corrective' value to 1.0 manually while the armature is in rest pose. The posterior elbow (back of joint) should push outward in +Z. Reset value to 0 after inspection.",
      },
      {
        title: "Test the driver",
        body: "Select arm_rig. Pose Mode → select forearm bone → press R X (rotate around local X) and drag. Watch the Shape Keys panel: the elbow_corrective value should increase as you rotate toward −90° and decrease as you return to 0°. The driver expression clamps to [0, 1] so values outside the rotation range have no effect.",
      },
      {
        title: "Inspect the driver setup",
        body: "Right-click the elbow_corrective value → Edit Driver. Confirm: type = Scripted Expression, expression = 'max(0.0, min(1.0, -var / 1.5708))'. Variable 'var': type = Transform, ID = arm_rig, bone = forearm, type = X Rotation, space = Local Space.",
      },
      {
        title: "Compare corrected vs uncorrected",
        body: "In the Shape Keys panel, right-click elbow_corrective value → Delete Driver. Manually set value to 0.0. Pose the forearm to −90°. Observe the elbow pinch. Then undo, re-add the driver, and compare — the corrective should visibly fill the collapse.",
      },
      {
        title: "Record the viewport animation",
        body: "Scripting workspace → open record.py → Run Script. The recording animates frames 1–90: straight arm (0–30), bending 0° → −90° (30–60), held at 90° (61–90). Output lands at public/library/videos/rigging/rigging-corrective-shape-keys-driver/viewport.mp4.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Shape key value stays at 0 during pose rotation",
        cause:
          "Bone rotation_mode was changed to QUATERNION after the driver was created. SINGLE_PROP on rotation_euler[0] silently returns 0 in quaternion mode.",
        fix: "Open the driver (right-click value → Edit Driver). Change variable type to TRANSFORMS, select bone = forearm, type = X Rotation, space = Local Space. TRANSFORMS is mode-agnostic.",
      },
      {
        symptom: "Correction bulges forward (toward the palm) instead of backward",
        cause:
          "The rest-pose arm points in a different direction, so +Z is not the posterior elbow in your rig's coordinate system.",
        fix: "In Object Mode, N-panel → Item → Rotation, read the arm's local axes. Identify the axis pointing toward the olecranon (back of elbow) and change the correction Vector in blueprint.py from (0,0,delta) to the correct axis.",
      },
      {
        symptom: "Corrective fires fully at 60° instead of 90°",
        cause:
          "The driver expression uses 1.5708 (90°) as the full-flex constant, but the mesh collapses worst before that angle.",
        fix: "Replace 1.5708 with the radian measure of your worst-collapse angle. 60° = 1.047, 45° = 0.785. Or add a two-point custom F-curve driver for non-linear remapping.",
      },
    ],
    finalResult:
      "A two-bone cylindrical arm rig with automatic skinning, a TRANSFORMS-driven corrective shape key that fills the elbow collapse at 90° flexion, and a 90-frame viewport recording showing the correction animating in sync with the pose.",
  },
  {
    slug: "blender-tutorial-rigging-corrective-shape-keys-driver",
    title:
      "Rigging: Corrective Shape Keys + Rotation-Driven Driver Expression (Blender 5.1)",
    date: "2026-06-14",
    kind: "tutorial",
    excerpt:
      "Fix elbow and knee joint collapse in automatic skinning: add a corrective shape key in rest space, then drive its value from the forearm bone's local rotation angle with a TRANSFORMS driver and a remap expression — plus a full explanation of why LOCAL_SPACE and TRANSFORMS type are mandatory for production rigs.",
    Body: CorrectiveShapeKeysBody,
  },
);

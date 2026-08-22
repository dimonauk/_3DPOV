import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A shape key value sits inert until something changes it.  Keyframing
        works for pre-authored clips, but a <strong>driver</strong> makes the
        value react live: rotate a bone and the face morphs in the viewport
        without touching a slider.  This tutorial wires four shape keys —{" "}
        <code>brow_raise_l</code>, <code>brow_raise_r</code>,{" "}
        <code>cheek_puff</code>, and a corrective{" "}
        <code>sad_corrective</code> — to armature bone rotations using
        scripted drivers built entirely in Python.  Because GLB does not carry
        Blender drivers, a <code>bake_sk_drivers()</code> pass samples the
        live depsgraph value on every frame and inserts explicit morph-weight
        keyframes before export.
      </p>
      <p>
        This is the canonical last step before a VRM facial rig leaves
        Blender.  VRM 1.0{" "}
        <code>VRMC_vrm.expressions</code> maps expression names (happy, blink,
        sad…) directly to shape key weights; three-vrm reads those weights and
        the baked animation tracks together, letting you play the clip or
        override individual expressions at runtime.  Compare this with the
        IK→FK bake taught in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nla-bake-ik-fk-action-push"
          className={lk}
        >
          NLA bake tutorial
        </Link>
        : bone baking converts constraint-evaluated transforms to keyframes;
        shape key baking converts driver-evaluated morph weights to keyframes
        — both solve the same fundamental problem of GLB not evaluating
        Blender&apos;s live systems.
      </p>
      <p>
        The corrective shape key uses a product-of-clamps driver expression
        (<code>max(0, -rot_l/hp) * max(0, -rot_r/hp)</code>) so it only fires
        when both brows drop simultaneously, not when one moves alone.  This
        pattern extends directly to shoulder correctives in a full VRM body
        rig — the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-stretchy-ik-volume-preserve-vrm"
          className={lk}
        >
          stretchy IK volume-preserve tutorial
        </Link>{" "}
        shows where corrective keys slot into the overall VRM rigging workflow.
        Spring-bone chains built in the{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          spring bones tutorial
        </Link>{" "}
        then complement the facial rig, adding secondary motion to hair and
        accessories without further driver work.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-shape-key-driver-rig-vrm-facial",
  title:
    "Python — Shape Key Driver Rig: Bone Rotation to Morph Target for VRM Facial Animation (Blender 5.1)",
  date: "2026-06-27",
  kind: "tutorial",
  excerpt:
    "Wire bone local-rotation channels to shape key values using scripted drivers built in Python. Covers single-bone clamped expressions, a two-bone product-of-clamps corrective key, per-frame depsgraph baking for GLB export, and the VRM 1.0 expressions schema that maps named emotions to morph weights at runtime.",
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/scripting/python-shape-key-driver-rig-vrm-facial/",
    time: "2–3 hours",
    difficulty: "advanced",
    cost: "free",
    software: [
      {
        name: "Blender",
        version: "≥ 5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Comfortable adding shape keys via Properties → Object Data → Shape Keys",
      "Basic armature creation — edit bones, pose mode, rotation channels",
      "Python scripting in Blender — Text Editor, bpy.data, bpy.ops",
      "Completed the shape keys morph targets tutorial",
    ],
    overview:
      "Shape key drivers link a shape key's value float to any animatable " +
      "property in the scene — most commonly a bone rotation channel. " +
      "Blender evaluates drivers each frame through the dependency graph; " +
      "rotating the bone immediately updates the morph without keyframing. " +
      "The scripted driver type gives full Python-expression power: " +
      "clamp, remap, multi-bone products, and conditional logic all fit in " +
      "one expression line.",
    goal:
      "Build a face mesh with four shape keys, create an armature with brow " +
      "and cheek bones, attach scripted drivers in Python, animate the rig " +
      "through 90 frames, bake the live driver output to keyframes, and " +
      "export a GLB with functioning morph target animation tracks.",
    steps: [
      {
        title: "Understand shape key maths",
        body:
          "Shape keys store vertex position DELTAS from the Basis key — not " +
          "absolute positions. Blender evaluates them as:\n\n" +
          "  result_co = basis_co + Σ (sk.value × (sk.data[i].co − basis_co))\n\n" +
          "Basis must always be index 0 and stay at value 0.0. Every other key " +
          "is a weighted blend of its delta against Basis. Keys are additive by " +
          "default; the 'relative' toggle (Properties → Shape Keys → Relative) " +
          "controls whether each key blends from Basis (relative=True, default) " +
          "or forms a chain of poses (relative=False, legacy VRM 0.x style).\n\n" +
          "In the blueprint: obj.shape_key_add(name='Basis', from_mix=False) " +
          "must be the FIRST call. Subsequent add() calls inherit the current " +
          "geometry as their starting delta (from_mix=False = copy Basis exactly, " +
          "then sculpt/nudge the desired delta).",
      },
      {
        title: "Add shape keys in Python",
        body:
          "  obj.shape_key_add(name='Basis', from_mix=False)\n" +
          "  sk = obj.shape_key_add(name='brow_raise_l', from_mix=False)\n\n" +
          "Nudge verts on the shape key by writing to sk.data[i].co directly:\n\n" +
          "  basis_co = [v.co.copy() for v in obj.data.vertices]\n" +
          "  co = basis_co[0].copy()\n" +
          "  co.z += 0.18          # brow moves up 18 cm\n" +
          "  sk.data[0].co = co\n\n" +
          "For production: sculpt the deltas in Edit mode with the shape key " +
          "selected in the Shape Keys panel, then export. Programmatic nudging " +
          "here is enough to make the driver visible on screen.",
      },
      {
        title: "Build the scripted driver",
        body:
          "  fc  = shape_key.driver_add('value')\n" +
          "  drv = fc.driver\n" +
          "  drv.type = 'SCRIPTED'\n\n" +
          "Add a TRANSFORMS variable pointing to a bone rotation channel:\n\n" +
          "  v = drv.variables.new()\n" +
          "  v.name, v.type = 'rot', 'TRANSFORMS'\n" +
          "  t = v.targets[0]\n" +
          "  t.id, t.bone_target = arm_obj, 'brow_l'\n" +
          "  t.transform_type  = 'ROT_X'        # radians in local space\n" +
          "  t.transform_space = 'LOCAL_SPACE'\n\n" +
          "Add π/2 as a SINGLE_PROP variable from a scene custom property — " +
          "the driver sandbox cannot import math:\n\n" +
          "  bpy.context.scene['hp'] = math.pi / 2\n" +
          "  v_hp = drv.variables.new()\n" +
          "  v_hp.name = 'hp'\n" +
          "  v_hp.type = 'SINGLE_PROP'\n" +
          "  v_hp.targets[0].id_type   = 'SCENE'\n" +
          "  v_hp.targets[0].id        = bpy.context.scene\n" +
          "  v_hp.targets[0].data_path = '[\"hp\"]'\n\n" +
          "Expression: clamp(-rot/hp, 0.0, 1.0)\n" +
          "  −rot because brow bone rotating backward (tip toward viewer) is " +
          "negative ROT_X in local space. Dividing by π/2 maps the full quarter " +
          "circle to [0,1]. clamp() prevents overshoot at extreme poses.",
      },
      {
        title: "Corrective shape key — product-of-clamps",
        body:
          "  drv.expression = 'max(0.0, -rot_l/hp) * max(0.0, -rot_r/hp)'\n\n" +
          "Two bone variables (rot_l, rot_r) both pointing to their respective " +
          "brow bones, both using ROT_X LOCAL_SPACE. Each max() independently " +
          "clamps to [0,1] so a single-brow pose gives partial activation " +
          "(0.25 when each is at −45°). The product is 1.0 ONLY when both " +
          "bones are simultaneously at −90°, which is the definition of the " +
          "sad corrective. This pattern extends naturally to shoulder correctives: " +
          "replace brow bones with arm and forearm, and the corrective fires " +
          "only when the full arm fold is reached.",
      },
      {
        title: "Animate the rig",
        body:
          "Keyframe bone rotation_euler on the armature in Pose Mode:\n\n" +
          "  pb = arm_obj.pose.bones['brow_l']\n" +
          "  pb.rotation_mode     = 'XYZ'\n" +
          "  pb.rotation_euler[0] = -math.pi/2    # 90° raise\n" +
          "  pb.keyframe_insert('rotation_euler', frame=30)\n\n" +
          "Three-beat arc: neutral(1) → raise(30) → hold(60) → sad(90). " +
          "Rotating both brows to +ROT_X at frame 90 drives rot > 0, so " +
          "−rot < 0 → clamped to 0, and BOTH brows drooping triggers " +
          "sad_corrective via the product expression.",
      },
      {
        title: "Bake driver values to keyframes",
        body:
          "GLB does not evaluate Blender drivers — the runtime has no access " +
          "to the armature or expression. Sample the live value each frame:\n\n" +
          "  for f in range(1, 91):\n" +
          "      scene.frame_set(f)\n" +
          "      bpy.context.view_layer.update()    # flush depsgraph\n" +
          "      sk.keyframe_insert('value', frame=f)\n\n" +
          "view_layer.update() is mandatory — without it, frame_set() moves " +
          "the cursor but does not re-evaluate drivers, so every keyframe " +
          "gets the same stale value. The baked F-curves on the mesh object " +
          "become glTF animation.samplers targeting the morph weight accessors.",
      },
      {
        title: "Export GLB",
        body:
          "  bpy.ops.export_scene.gltf(\n" +
          "      filepath     = bpy.path.abspath('//face_driver_rig.glb'),\n" +
          "      export_morph = True,         # shape keys → morph targets\n" +
          "      export_animations = True,    # morph weight F-curves → tracks\n" +
          "      export_apply = False,        # False = keep mesh live\n" +
          "      export_draco_mesh_compression_enable = True,\n" +
          "      export_draco_mesh_compression_level  = 6,\n" +
          "      export_image_format = 'WEBP',\n" +
          "      export_yup = True,\n" +
          "  )\n\n" +
          "Verify with gltf.report: under Animations, the morph weight sampler " +
          "should list 90 keyframes for each shape key. In Three.js, access them " +
          "as mesh.morphTargetInfluences[i] — use AnimationMixer.clipAction() " +
          "to play the baked animation.",
      },
    ],
    finalResult:
      "Running blueprint.py produces face_driver_rig.blend and " +
      "face_driver_rig.glb. The blend file has four live-driver shape keys; " +
      "the GLB has four morph targets with baked 90-frame weight animation " +
      "tracks. Three.js AnimationMixer plays them directly, and three-vrm " +
      "can override individual expression weights at runtime on top of the " +
      "baked animation.",
    variations: [
      "Quaternion bone rotation: set pb.rotation_mode = 'QUATERNION' and use " +
        "transform_type = 'ROT_W' / 'ROT_X' etc. Quaternions avoid gimbal lock " +
        "on wide-range jaw rotations (open mouth past 90°).",
      "Remap range driver: replace clamp(-rot/hp, 0,1) with a linear remap " +
        "bpy.data.node_groups construct — gives fine control over activation " +
        "threshold and plateau without changing the bone keyframes.",
      "Multi-clip bake: bake frames 1-30 for expression_happy, 31-60 for " +
        "expression_sad, then push each to a separate NLA strip before export " +
        "with export_nla_strips=True for named glTF animations.",
    ],
    troubleshooting: [
      {
        symptom: "Shape key value stays 0.0 — driver appears wired but does nothing",
        cause:
          "fc.update() was not called after setting drv.expression. Without " +
          "update(), Blender does not register the F-curve for evaluation.",
        fix:
          "Call fc.update() immediately after setting drv.expression. Also " +
          "check that the bone target ID is the armature OBJECT (bpy.types.Object), " +
          "not the armature DATA (bpy.types.Armature) — t.id must be the Object.",
      },
      {
        symptom: "Baked GLB has static morph weights — no animation",
        cause:
          "bpy.context.view_layer.update() was omitted inside the bake loop. " +
          "The depsgraph did not evaluate the driver, so every frame baked the " +
          "same stale value.",
        fix:
          "Add bpy.context.view_layer.update() immediately after scene.frame_set(f) " +
          "inside the bake loop. Verify by printing sk.value after update() — " +
          "it should vary across frames.",
      },
      {
        symptom: "sad_corrective fires when only one brow moves",
        cause:
          "The expression used addition (rot_l + rot_r) instead of multiplication. " +
          "Sum reaches 1.0 when either bone is at −90°; product requires both.",
        fix:
          "Use: max(0.0, -rot_l/hp) * max(0.0, -rot_r/hp). Test: with only " +
          "brow_l at −90° and brow_r at 0°, the value should be 0.0.",
      },
      {
        symptom: "Driver expression error: name 'math' is not defined",
        cause:
          "The driver sandbox does not load Python modules. Using math.pi or " +
          "math.radians() directly in the expression string fails.",
        fix:
          "Store numeric constants as scene or object custom properties and " +
          "reference them as SINGLE_PROP variables. The blueprint uses " +
          "bpy.context.scene['hp'] = math.pi / 2 in the setup code, then " +
          "references 'hp' as a variable inside the expression.",
      },
    ],
    voiceMode: "aura",
  },
  base,
);

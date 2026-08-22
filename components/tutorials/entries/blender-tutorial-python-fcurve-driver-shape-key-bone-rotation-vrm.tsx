import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        When a VRM character bends its elbow, the skin mesh collapses at the
        crease unless you supply a corrective blend shape that bows the inner
        joint outward to compensate.  In Blender 5.1, wiring that correction to
        a bone angle is a three-line Python job using{" "}
        <code>driver_add()</code>: attach a Driver FCurve to the shape
        key&apos;s RNA value path, add a <code>TRANSFORMS</code> variable
        reading the forearm&apos;s <code>LOCAL_SPACE ROT_X</code>, and write a
        clamped ramp expression.  Blender evaluates the expression every
        depsgraph update — no keyframes needed while authoring, and no
        manual scrubbing of shape key sliders.  See the{" "}
        <Link
          href="/tutorials/blender-tutorial-shape-keys-morph-targets"
          className={lk}
        >
          shape keys and morph targets tutorial
        </Link>{" "}
        for the foundational shape key workflow this driver sits on top of.
      </p>

      <p className="mt-4">
        The catch: the GLTF exporter does not call{" "}
        <code>bpy.context.evaluated_depsgraph_get()</code> internally when
        walking shape key values for morph target export.  It reads only
        keyframed FCurves.  So after setting up the driver you must bake it —
        walk every frame, read the evaluated value from the depsgraph, and write
        an explicit keyframe — then remove the live driver before exporting.
        The bake loop is five lines of Python and produces a clean morph
        animation clip in the exported GLB.  This same bake-before-export
        pattern appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-pose-bone-constraint-management-export-bake"
          className={lk}
        >
          constraint NLA bake tutorial
        </Link>
        .
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Why the Key ID block, not the Object
      </h2>
      <p className="mt-2">
        Shape keys live on a <code>bpy.types.Key</code> data block accessed
        via <code>mesh_obj.data.shape_keys</code>.  The <code>Key</code> type
        inherits from <code>bpy.types.ID</code>, which provides{" "}
        <code>driver_add(path)</code>.  The path argument is relative to the
        Key block:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 px-4 py-3 text-sm text-neutral-100">
{`key_id = mesh_obj.data.shape_keys
fc     = key_id.driver_add('key_blocks["elbow_corrective"].value')
drv    = fc.driver
drv.type = 'SCRIPTED'`}
      </pre>
      <p className="mt-2">
        If you call <code>driver_add</code> on the Object instead and attempt a
        fully qualified path starting with <code>&apos;data.shape_keys&apos;</code>,
        Blender rejects it at runtime — the Object&apos;s RNA driver path does not
        traverse into its mesh&apos;s Key block.  Always target the{" "}
        <code>Key</code> ID directly.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        LOCAL_SPACE vs WORLD_SPACE for joint drivers
      </h2>
      <p className="mt-2">
        The <code>TRANSFORMS</code> variable type lets you choose the evaluation
        space.  <strong>LOCAL_SPACE</strong> returns the bone&apos;s rotation
        relative to its parent — which is the elbow joint angle you want.{" "}
        <strong>WORLD_SPACE</strong> accumulates all ancestor transforms; a
        tilted shoulder or scaled armature object changes the forearm&apos;s
        world rotation even when the elbow is perfectly straight, producing
        false corrective activation.  Joint drivers should almost always use{" "}
        <code>LOCAL_SPACE</code>.  Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-vrm-eye-look-at-damped-track"
          className={lk}
        >
          VRM eye look-at rig
        </Link>
        , where Damped Track targets a world-space object — that is one of the
        rare cases where world-space evaluation is correct.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        The SCRIPTED expression
      </h2>
      <p className="mt-2">
        The four built-in driver types — <code>AVERAGE</code>, <code>SUM</code>,{" "}
        <code>MIN</code>, <code>MAX</code> — produce a blend of variable values
        but cannot remap a range.  <code>SCRIPTED</code> runs an{" "}
        <code>eval()</code>-ed Python expression every depsgraph update, with
        each named variable injected as a local.  The ramp expression:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 px-4 py-3 text-sm text-neutral-100">
{`drv.expression = "max(0.0, min(1.0, (bend - REST) / (FULL - REST)))"`}
      </pre>
      <p className="mt-2">
        maps <code>bend</code> (the forearm&apos;s LOCAL ROT_X in radians) from
        the rest angle to the full-bend angle, clamping outside that range to
        keep the shape key value strictly in <code>[0, 1]</code>.  The
        constants <code>REST</code> and <code>FULL</code> are baked into the
        string at build time — driver expressions cannot reference Python
        constants by name, only the variables you register via{" "}
        <code>drv.variables.new()</code>.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Baking: evaluated_get() at each frame
      </h2>
      <p className="mt-2">
        The evaluated depsgraph gives you the fully resolved state of every
        object after modifiers, constraints, and drivers.{" "}
        <code>mesh_obj.evaluated_get(dg)</code> returns a temporary evaluated
        copy; reading its <code>shape_keys.key_blocks[SK_NAME].value</code>{" "}
        gives the driven value.  Write that to the original (non-evaluated)
        shape key and call <code>keyframe_insert</code>:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 px-4 py-3 text-sm text-neutral-100">
{`for frame in range(1, 61):
    scene.frame_set(frame)
    dg        = bpy.context.evaluated_depsgraph_get()
    eval_obj  = mesh_obj.evaluated_get(dg)
    baked_val = eval_obj.data.shape_keys.key_blocks[SK_NAME].value
    sk.value  = baked_val
    sk.keyframe_insert(data_path='value', frame=frame)
key_id.driver_remove(f'key_blocks["{SK_NAME}"].value')`}
      </pre>
      <p className="mt-2">
        Call <code>driver_remove()</code> afterwards.  If both a driver and
        keyframes exist simultaneously on the same property, the driver wins at
        runtime — the keyframes are invisible to the exporter.  Removing the
        driver makes the baked FCurve the sole source of truth.  This mirrors
        the approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr"
          className={lk}
        >
          Cycles batch bake pipeline
        </Link>
        , where the baked texture replaces the procedural material rather than
        sitting alongside it.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Failure modes</h2>
      <p className="mt-2">
        <strong>Shape key value never changes in the GLB player.</strong>{" "}
        The most common cause is exporting before baking — the live driver
        exists but no keyframed FCurves are present.  Check:{" "}
        <code>print(len(mesh_obj.data.shape_keys.animation_data.action.fcurves))</code>{" "}
        after the bake; it should be ≥ 1.  If zero, the{" "}
        <code>keyframe_insert</code> loop did not run or the action was not
        created automatically.  Force action creation with{" "}
        <code>key_id.animation_data_create()</code> before the bake loop.
      </p>
      <p className="mt-2">
        <strong>Corrective fires with the arm in rest pose.</strong> The
        expression uses <code>BEND_REST</code> as the zero-crossing.  If
        <code>BEND_REST</code> is more negative than the actual rest-pose angle,
        the driver returns a positive value at rest.  Print the forearm&apos;s
        local ROT_X at frame 1:{" "}
        <code>print(arm_obj.pose.bones[&apos;forearm&apos;].rotation_euler.x)</code>{" "}
        and use that value or slightly above it as <code>BEND_REST</code>.
      </p>
      <p className="mt-2">
        <strong>driver_add() raises AttributeError on the Key block.</strong>{" "}
        Shape keys only exist after at least one shape key is added.  Calling{" "}
        <code>driver_add</code> before <code>shape_key_add()</code> means{" "}
        <code>mesh_obj.data.shape_keys</code> is <code>None</code>.  Always add
        the Basis key first, then the corrective key, then the driver.
      </p>
      <p className="mt-2">
        <strong>
          TRANSFORMS variable reads 0.0 regardless of bone angle.
        </strong>{" "}
        Check <code>tgt.id</code> — it must be the armature{" "}
        <em>Object</em>, not the Armature data block, and not the PoseBone.
        The <code>bone_target</code> string must match the exact pose bone name
        (case-sensitive).  Verify with{" "}
        <code>print(arm_obj.pose.bones.keys())</code>.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-fcurve-driver-shape-key-bone-rotation-vrm",
  title:
    "Python Driver API — Bone-Rotation-to-Shape-Key Corrective Blend Shape for VRM (Blender 5.1)",
  date: "2026-07-03",
  kind: "tutorial",
  excerpt:
    "Drive a corrective shape key from a forearm bone's LOCAL ROT_X using bpy.types.Driver and a SCRIPTED ramp expression, then bake the driven values to explicit FCurve keyframes via evaluated_get(depsgraph) so the GLTF exporter can write them as morph targets in a Draco-6 GLB.",
  tags: [
    "blender",
    "scripting",
    "python",
    "driver",
    "shape-keys",
    "vrm",
    "rigging",
    "morph-targets",
  ],
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/scripting/python-fcurve-driver-shape-key-bone-rotation-vrm/",
    time: "an hour",
    difficulty: "intermediate",
    cost: "open-source",
    supplies: {
      tools: [
        {
          name: "Blender 5.1",
          url: "https://www.blender.org/download/releases/5-1/",
          note: "Driver API unchanged since 2.8; 5.1 GLTF exporter includes morph target export_morph parameter.",
        },
        { name: "Graph Editor (Drivers mode)" },
        { name: "Python scripting console (blueprint.py runner)" },
      ],
    },
    prerequisites: [
      "Knows how to add shape keys in Blender and scrub their sliders",
      "Comfortable writing Python functions and running them in the Scripting workspace",
      "Has created a basic armature and posed it in Pose Mode at least once",
    ],
    steps: [
      {
        title: "Understand the Driver RNA path target",
        body: "Shape keys live on a bpy.types.Key ID block, not on the Object or the\nmesh.  Access it via:\n\n  key_id = mesh_obj.data.shape_keys\n  fc     = key_id.driver_add('key_blocks[\"elbow_corrective\"].value')\n\nThe path string is relative to the Key block.  Calling driver_add on the\nObject with a longer path will fail at runtime.\n\nCheck the Key block exists before calling:\n  assert mesh_obj.data.shape_keys is not None\n  # (will be None if no shape keys have been added yet)",
      },
      {
        title: "Configure the SCRIPTED driver expression",
        body: "Set the driver type and expression:\n\n  drv      = fc.driver\n  drv.type = 'SCRIPTED'\n  REST, FULL = -0.20, -1.5708     # radians (BEND_REST, BEND_FULL from blueprint)\n  drv.expression = f\"max(0.0, min(1.0, (bend - {REST}) / ({FULL} - {REST})))\"\n\nThe expression string is eval()d by Blender each depsgraph update.  Named\nvariables (here: 'bend') are injected as locals.  Constants must be baked\ninto the string — they cannot reference outer Python names at evaluation time.",
      },
      {
        title: "Add the TRANSFORMS variable",
        body: "Create a variable that reads the forearm's LOCAL_SPACE ROT_X:\n\n  var                 = drv.variables.new()\n  var.name            = 'bend'         # matches the expression variable name\n  var.type            = 'TRANSFORMS'\n  tgt                 = var.targets[0]\n  tgt.id              = arm_obj        # armature Object (not data, not PoseBone)\n  tgt.bone_target     = 'forearm'      # exact pose bone name, case-sensitive\n  tgt.transform_type  = 'ROT_X'\n  tgt.transform_space = 'LOCAL_SPACE'\n\nLOCAL_SPACE returns rotation relative to parent bone (the joint angle).\nWORLD_SPACE folds in all ancestors — wrong for joint drivers.",
      },
      {
        title: "Animate the forearm and verify the driver",
        body: "Keyframe the forearm pose bone:\n\n  pb              = arm_obj.pose.bones['forearm']\n  pb.rotation_mode = 'XYZ'\n  for frame, angle in [(1, 0.0), (30, -math.pi/2), (60, -math.pi/2)]:\n      bpy.context.scene.frame_set(frame)\n      pb.rotation_euler.x = angle\n      pb.keyframe_insert(data_path='rotation_euler', index=0, frame=frame)\n\nAfter this, scrub the timeline.  The driver expression should fire:\n  bpy.context.scene.frame_set(30)\n  dg = bpy.context.evaluated_depsgraph_get()\n  ev = mesh_obj.evaluated_get(dg)\n  print(ev.data.shape_keys.key_blocks['elbow_corrective'].value)  # → ~1.0",
      },
      {
        title: "Bake driver values to explicit keyframes",
        body: "Walk every frame, read the evaluated value, keyframe the original:\n\n  sk = mesh_obj.data.shape_keys.key_blocks['elbow_corrective']\n  for frame in range(1, 61):\n      bpy.context.scene.frame_set(frame)\n      dg        = bpy.context.evaluated_depsgraph_get()\n      eval_obj  = mesh_obj.evaluated_get(dg)\n      baked_val = eval_obj.data.shape_keys.key_blocks['elbow_corrective'].value\n      sk.value  = baked_val\n      sk.keyframe_insert(data_path='value', frame=frame)\n\n  # Remove live driver after baking — keyframes are now canonical\n  mesh_obj.data.shape_keys.driver_remove('key_blocks[\"elbow_corrective\"].value')\n\nIf both driver and keyframes exist simultaneously, the driver wins and\nkeyframes are invisible to the GLB exporter.  Always remove after baking.",
      },
      {
        title: "Export with morph targets enabled",
        body: "bpy.ops.export_scene.gltf(\n    filepath=bpy.path.abspath('//elbow_corrective_rig_baked.glb'),\n    export_format='GLB',\n    export_apply=False,       # keep armature modifier — bones travel with mesh\n    export_yup=True,\n    export_morph=True,        # shape keys → morph targets\n    export_morph_normal=False,\n    export_animations=True,\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    use_selection=False,\n)\n\nValidate in gltf-validator: the GLB should report:\n  meshes[0].primitives[0].targets → 1 morph target (elbow_corrective)\n  animations[0].channels → ROT_X + shape key value tracks",
      },
    ],
    finalResult:
      "A two-bone VRM arm rig with a 56-vertex elbow skin mesh whose 'elbow_corrective' shape key fires automatically via a SCRIPTED Driver reading LOCAL_SPACE ROT_X. The driven values are baked to 60 explicit keyframes and exported as a Draco-6 GLB (< 12 KB) with a morph animation clip.",
    variations: [
      "Multiple correctives from one armature: add 'shoulder_corrective' and 'wrist_corrective' shape keys, call driver_add for each, and use separate TRANSFORMS variables targeting the appropriate bones. All three drivers can be baked in the same frame loop without extra passes.",
      "Non-linear corrective curve: replace the linear ramp with a smoothstep expression: 't = max(0.0, min(1.0, (bend - REST) / (FULL - REST))); drv.expression = \"3*t**2 - 2*t**3\"'. Smoothstep eases in and out of the corrective rather than activating abruptly at REST.",
      "ROTATION_DIFF variable for two-bone relative angle: if upper_arm can also rotate and you want the corrective to respond to the relative angle between upper and lower arm (regardless of shoulder orientation), use var.type = 'ROTATION_DIFF'. Set targets[0] to upper_arm and targets[1] to forearm — the driver reads the angle between them rather than absolute LOCAL_SPACE rotation.",
    ],
    troubleshooting: [
      {
        symptom: "Shape key value stays 0.0 in the GLB morph animation",
        cause:
          "The live driver was not baked to keyframes before export. The GLTF exporter reads only keyframed FCurves.",
        fix:
          "After running bake_driver(), check: print(len(mesh_obj.data.shape_keys.animation_data.action.fcurves)). Should be ≥ 1. If 0, the keyframe_insert loop did not run. Add key_id.animation_data_create() before the loop to force action creation.",
      },
      {
        symptom: "driver_add() raises AttributeError: 'NoneType' object has no attribute 'driver_add'",
        cause:
          "mesh_obj.data.shape_keys is None because no shape keys have been added to the mesh yet.",
        fix:
          "Call mesh_obj.shape_key_add(name='Basis', from_mix=False) then mesh_obj.shape_key_add(name=SK_NAME, from_mix=False) before any driver_add() call.",
      },
      {
        symptom: "Driver expression evaluates correctly in Blender but exports wrong",
        cause:
          "The driver_remove() call was skipped, leaving both a driver and keyframes on the property. The driver wins at runtime; the exporter sees only keyframes but the driver shadows them.",
        fix:
          "Verify removal: print(len(key_id.animation_data.drivers)) — should be 0 after calling driver_remove(). If > 0, call key_id.driver_remove(f'key_blocks[\"{SK_NAME}\"].value') again.",
      },
      {
        symptom: "TRANSFORMS variable always returns 0.0 regardless of bone angle",
        cause:
          "tgt.id is set to the armature data (bpy.data.armatures['vrm_arm']) rather than the armature Object (bpy.data.objects['vrm_arm']).",
        fix:
          "tgt.id must be the bpy.types.Object, not bpy.types.Armature. Use: tgt.id = bpy.data.objects['vrm_arm']. Also verify tgt.bone_target exactly matches the pose bone name: print(arm_obj.pose.bones.keys()).",
      },
    ],
  },
  base,
);

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The animation system in Blender 4.x had a constraint that most users
        never consciously hit until they tried to build a complex character
        performance: one Action data-block for one ID type. Assign the same
        Action to both a character&apos;s armature and their handheld prop, and
        every FCurve in that Action becomes visible — and writable — on both
        objects. The result is either channel-name collisions in the Dope Sheet
        or two separate Actions, two separate NLA strips, and the constant work
        of keeping them synchronised. Blender 5.0 resolves this with{" "}
        <strong>Action Slots</strong>.
      </p>

      <p>
        A slot is a named, typed container within an Action data-block, tagged
        to one animatable ID via an <code>id_type</code> string (
        <code>&ldquo;OBJECT&rdquo;</code>,{" "}
        <code>&ldquo;KEY&rdquo;</code>,{" "}
        <code>&ldquo;MATERIAL&rdquo;</code> &hellip;). An object&apos;s{" "}
        <code>animation_data.action_slot</code> property routes that object to
        exactly one slot. FCurves in every other slot are invisible to it.
        Three objects can therefore share a single Action while each reading
        only their own channels — one NLA strip carries the whole performance,
        and muting or time-scaling that strip affects everything at once.
      </p>

      <p>
        The blueprint builds a minimal demonstration: a 2-bone forearm
        armature, a prop cube (sword stand-in), and a face mesh with{" "}
        <code>jaw_open</code> and <code>brow_raise</code> shape keys. All three
        are keyframed inside one Action called <code>perf_01</code> using three
        slots. The{" "}
        <Link
          href="/tutorials/blender-tutorial-nla-action-clips-vrm"
          className={lk}
        >
          NLA Action Clips — VRM
        </Link>{" "}
        tutorial covers the downstream consumer of this pattern: pushing
        multi-slot Actions into the NLA so that takes can be stacked, blended,
        and re-used non-destructively.
      </p>

      <h2>Why the KEY slot type is different</h2>
      <p>
        When you animate a shape key in Blender, the FCurve does not live on
        the mesh object — it lives on the{" "}
        <code>bpy.types.Key</code> data-block, accessible as{" "}
        <code>face_obj.data.shape_keys</code>. This matters for slot assignment:
        you set <code>animation_data</code> on the{" "}
        <em>Key data-block</em>, not on the mesh object.
      </p>
      <pre>
        <code>{`key_block = face_obj.data.shape_keys   # bpy.types.Key
key_block.animation_data_create()
key_block.animation_data.action      = action
key_block.animation_data.action_slot = slot_key`}</code>
      </pre>
      <p>
        Skipping this and assigning the slot to{" "}
        <code>face_obj.animation_data</code> instead creates an{" "}
        <code>OBJECT</code>-type slot that cannot hold shape-key value curves —
        the Dope Sheet will show the curves as orphaned or refuse to insert them.
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-shape-key-driver-rig-vrm-facial"
          className={lk}
        >
          Shape Key Driver Rig — VRM Facial
        </Link>{" "}
        tutorial explains the Key data-block in detail; once you understand
        that, the reason for the separate slot type is immediately obvious.
      </p>

      <h2>keyframe_insert() is slot-aware automatically</h2>
      <p>
        The most important ergonomic win in the slot design: you do not change
        how you insert keyframes. Once <code>animation_data.action_slot</code>{" "}
        is set, every <code>obj.keyframe_insert()</code> call routes the new
        FCurve to the correct slot&apos;s ChannelBag automatically. There is no
        extra <code>slot_handle</code> argument to pass at insert time.
      </p>
      <pre>
        <code>{`# Routes automatically to slot_arm because arm_obj.animation_data.action_slot = slot_arm
arm_obj.pose.bones["forearm"].keyframe_insert("rotation_euler", frame=30)

# Routes automatically to slot_prop because prop_obj.animation_data.action_slot = slot_prop
prop_obj.keyframe_insert("location", frame=20)`}</code>
      </pre>
      <p>
        The routing resolution lives in the animation evaluation pipeline, not
        in the insert call. This preserves backward compatibility: add-ons that
        already call <code>keyframe_insert()</code> without slots will continue
        to work, with all FCurves landing in a single default slot.
      </p>

      <h2>Inspecting slots in the Python Console</h2>
      <p>
        The fastest way to verify slot routing on a running scene is to inspect
        the action in the Python Console:
      </p>
      <pre>
        <code>{`action = bpy.data.actions["perf_01"]
for sl in action.slots:
    print(sl.name, sl.handle, sl.identifier)
# Output:
#   body_rig    1  OBbody_rig
#   sword_prop  2  OBsword_prop
#   face_mesh_keys  3  KEface_mesh_keys

# Check which slot an object is using
arm = bpy.data.objects["body_rig"]
print(arm.animation_data.action_slot.name)   # "body_rig"`}</code>
      </pre>
      <p>
        The <code>identifier</code> field prefixes the slot name with a 2-char
        type code: <code>OB</code> for <code>OBJECT</code>,{" "}
        <code>KE</code> for <code>KEY</code>,{" "}
        <code>MA</code> for <code>MATERIAL</code>. This identifier is stable
        across file saves and is what Blender uses internally to resolve slot
        ownership after an undo or file reload.
      </p>

      <h2>NLA integration: one strip for the whole performance</h2>
      <p>
        Push <code>perf_01</code> down to the NLA on each of the three objects
        (Object menu → Animation → Push Down Action). Each object gets its own
        NLA strip labelled <code>perf_01</code>, but they all reference the
        same Action data-block — not copies. This means editing the Action in
        the Action Editor updates every strip simultaneously.{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nla-bake-ik-fk-action-push"
          className={lk}
        >
          Python NLA Bake IK→FK + Action Push
        </Link>{" "}
        covers the push-down step in script form so you can automate it across
        all objects in a scene without touching the NLA Editor manually.
      </p>
      <p>
        The NLA strips are independent at the track level — you can solo or
        mute the prop strip without affecting the armature — but at the
        Action level they share a single source of truth. This is the design
        win: the choreography between body, prop, and face is authored once and
        then distributed, not duplicated.
      </p>

      <h2>Action Constraints and slot routing</h2>
      <p>
        Action Constraints (the constraint type that drives a secondary rig
        from an Action&apos;s FCurves) in Blender 5.1 have a corresponding{" "}
        <strong>Action Slot</strong> field so that the constraint reads from a
        specific slot rather than the whole Action. The{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-action-constraint-expression-dial-vrm"
          className={lk}
        >
          Action Constraint Expression Dial — VRM
        </Link>{" "}
        tutorial predates the slot system but the technique maps directly:
        create a dedicated slot in the driven Action, point the constraint at
        that slot, and the driver reads only those channels. This prevents a
        body-animation slot from accidentally contaminating a dial-driven slot.
      </p>

      <h2>Holoflow export consideration</h2>
      <p>
        The <code>holoflow_webxr_exporter</code> add-on exports GLBs per
        object. When an object&apos;s animation data uses a slotted Action, the
        exporter must respect the slot assignment to avoid including unrelated
        FCurves in the GLB animation track. The{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-fk-ik-switch-custom-property-driver"
          className={lk}
        >
          FK/IK Switch — Custom Property Driver
        </Link>{" "}
        tutorial covers driver-based switching inside the same action, which
        benefits from isolation via slots: the FK/IK switch FCurve lives in
        the armature slot and never contaminates the prop or shape-key slots.
      </p>

      <h2>Outside References</h2>
      <ul>
        <li>
          <a
            href="https://wiki.blender.org/wiki/Reference/Release_Notes/5.0/Animation_And_Rigging"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender 5.0 Release Notes — Animation &amp; Rigging
          </a>{" "}
          (Blender Foundation, CC-BY-SA 4.0) — official announcement of Action
          Slots, layers, and strips. The release notes link directly to the
          developer tasks so you can trace the design decisions. Related:
          the Blender Foundation&apos;s{" "}
          <a
            href="https://wiki.blender.org/wiki/Process/Animation_Rigs"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Animation Rigs process doc
          </a>{" "}
          which describes the motivation behind the slot architecture.
        </li>
        <li>
          <a
            href="https://docs.blender.org/api/current/bpy.types.Action.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.Action — Python API Reference
          </a>{" "}
          (Blender Foundation, CC-BY-SA 4.0) — full slot, channelbag, and
          FCurve access documentation. If any of the API calls in blueprint.py
          behave differently on your build, verify{" "}
          <code>Action.slots</code> and{" "}
          <code>AnimData.action_slot</code> here first. Sibling reference:{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.AnimData.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.AnimData
          </a>{" "}
          for the full animation data routing surface.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-animation-action-slots-multi-id-shared",
  title:
    "Animation Action Slots — One Action Driving Armature, Prop, and Shape Keys Simultaneously (Blender 5.1)",
  date: "2026-06-29",
  kind: "tutorial",
  excerpt:
    "Blender 5.0 introduced Action Slots: a single Action data-block can now carry FCurves for multiple IDs simultaneously via typed slot containers. One NLA strip can therefore contain a complete character performance — body armature, handheld prop, and facial shape keys — all independently routed via AnimData.action_slot.",
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/animation/animation-action-slots-multi-id-shared/",
    time: "one focused hour",
    difficulty: "advanced",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable running bpy Python scripts in the Scripting workspace",
      "Understands Blender animation basics: keyframes, FCurves, the Dope Sheet",
      "Has used the NLA Editor at least once (Push Down Action)",
      "Familiar with shape keys: adding Basis + blend keys, adjusting vertex positions",
    ],
    steps: [
      {
        title: "Build the scene objects",
        body: `Clear the default scene and build three objects from scratch:

  bpy.ops.object.select_all(action="SELECT")
  bpy.ops.object.delete()

  # 2-bone armature: shoulder at origin, forearm child at z=0.4
  bpy.ops.object.armature_add(enter_editmode=True)
  arm_obj = bpy.context.active_object
  arm_obj.name = "body_rig"
  # … add forearm bone in Edit Mode …
  bpy.ops.object.mode_set(mode="OBJECT")

  # Prop cube offset from the hand tip
  bpy.ops.mesh.primitive_cube_add(size=0.12, location=(0.15, 0.0, 0.8))
  prop_obj = bpy.context.active_object
  prop_obj.name = "sword_prop"

  # Face plane with jaw_open + brow_raise shape keys
  bpy.ops.mesh.primitive_plane_add(size=0.4, location=(0.0, -0.6, 0.4))
  face_obj = bpy.context.active_object
  face_obj.name = "face_mesh"
  face_obj.shape_key_add(name="Basis")
  face_obj.shape_key_add(name="jaw_open")
  face_obj.shape_key_add(name="brow_raise")

The armature and prop are both OBJECT types; the shape keys are a KEY type because they live on the Key data-block (face_obj.data.shape_keys), not on the mesh object itself.`,
      },
      {
        title: "Create the Action and three slots",
        body: `One action, three slots, each tagged to its ID type:

  action = bpy.data.actions.new("perf_01")

  slot_arm  = action.slots.new("OBJECT", "body_rig")
  slot_prop = action.slots.new("OBJECT", "sword_prop")
  slot_key  = action.slots.new("KEY",    "face_mesh_keys")

action.slots.new() takes an id_type string (RNA short name) and a human label.  The id_type determines what RNA paths are valid for FCurves in that slot — an OBJECT slot accepts location/rotation/scale and custom property paths; a KEY slot accepts shape_key.key_blocks[*].value paths.  Mixing them (adding a pose-bone path to a KEY slot) will silently fail at keyframe insertion: the path resolver returns None and no fcurve is created.`,
      },
      {
        title: "Route each ID to its slot via AnimData",
        body: `Route the armature object to slot_arm:

  arm_obj.animation_data_create()
  arm_obj.animation_data.action      = action
  arm_obj.animation_data.action_slot = slot_arm

Route the prop object to slot_prop:

  prop_obj.animation_data_create()
  prop_obj.animation_data.action      = action
  prop_obj.animation_data.action_slot = slot_prop

Route the shape keys to slot_key.  Critically: assign to the Key data-block, not to face_obj:

  key_block = face_obj.data.shape_keys          # bpy.types.Key, not bpy.types.Object
  key_block.animation_data_create()
  key_block.animation_data.action      = action
  key_block.animation_data.action_slot = slot_key

At this point all three IDs share a single Action data-block but each reads a completely separate set of channels.  Open the Dope Sheet → Action Editor, set the action to "perf_01", and the channel list shows slot headers with the ID-type icon beside each name.`,
      },
      {
        title: "Insert armature keyframes",
        body: `With the slot routed, keyframe_insert() writes directly into slot_arm's ChannelBag:

  bpy.context.view_layer.objects.active = arm_obj
  bpy.ops.object.mode_set(mode="POSE")
  bone = arm_obj.pose.bones["forearm"]
  bone.rotation_mode = "XYZ"

  for frame, angle_deg in [(1, 0.0), (30, 60.0), (60, 0.0)]:
      bpy.context.scene.frame_set(frame)
      bone.rotation_euler[2] = math.radians(angle_deg)
      bone.keyframe_insert("rotation_euler", frame=frame)

  bpy.ops.object.mode_set(mode="OBJECT")

No slot_handle argument is needed in keyframe_insert().  The routing is resolved by Blender's animation evaluation pipeline from arm_obj.animation_data.action_slot.  This is the same code you would write for a pre-5.0 single-slot action — the slot system is additive, not a breaking change to the insert API.`,
      },
      {
        title: "Insert prop keyframes",
        body: `Prop rises 0.4 m on frame 20 and returns by frame 50:

  base_z = prop_obj.location.z
  for frame, z_off in [(1, 0.0), (20, 0.4), (50, 0.4), (60, 0.0)]:
      bpy.context.scene.frame_set(frame)
      prop_obj.location.z = base_z + z_off
      prop_obj.keyframe_insert("location", frame=frame)

The plateau at frames 20–50 (same value, two keyframes) is the correct way to author a "hold" in Blender.  Bezier handles auto-flatten between identical adjacent keyframe values, giving a smooth ease-in/ease-out to the hold without requiring a linear interpolation override.  Slot_prop is completely independent of slot_arm — the forearm rotation and the prop rise can have different frame ranges, different interpolation modes, and different total frame counts within the same Action.`,
      },
      {
        title: "Insert shape key keyframes",
        body: `Shape key values animate on the Key data-block:

  kb = face_obj.data.shape_keys.key_blocks

  def kf(name, frame, value):
      kb[name].value = value
      kb[name].keyframe_insert("value", frame=frame)

  kf("jaw_open",  1,  0.0)
  kf("jaw_open",  25, 1.0)
  kf("jaw_open",  40, 0.0)

  kf("brow_raise", 1,  0.0)
  kf("brow_raise", 45, 1.0)
  kf("brow_raise", 60, 0.0)

kb[name].keyframe_insert() resolves the Key data-block's animation_data.action_slot, which is slot_key.  The resulting FCurve data path is 'key_blocks["jaw_open"].value' — note the path is relative to the Key data-block, not the mesh object.  This is why opening the Dope Sheet with face_obj selected shows no shape-key curves: you must select the Key data-block (or use the Action Editor) to see them.`,
      },
      {
        title: "Verify in the Dope Sheet and export the prop GLB",
        body: `Open Dope Sheet → Action Editor, select action "perf_01".  Toggle the Show Only Selected Objects filter off to see all three slot groups simultaneously.  Scrub frame 1–60 and verify:

• Slot "body_rig"       — forearm rotation_euler curves
• Slot "sword_prop"     — location.z curve with a visible plateau
• Slot "face_mesh_keys" — jaw_open.value and brow_raise.value curves

Export the prop GLB with its baked location animation:

  bpy.ops.object.select_all(action="DESELECT")
  prop_obj.select_set(True)
  bpy.context.view_layer.objects.active = prop_obj
  bpy.ops.export_scene.gltf(
      filepath="//output/sword_prop_anim.glb",
      use_selection=True, export_animations=True,
      export_yup=True, export_apply=True,
      export_draco_mesh_compression_enable=True,
      export_draco_mesh_compression_level=6,
  )

The exported GLB contains only the prop's location animation — the armature and shape-key slots are not included because only the selected object is exported.  In Three.js, AnimationMixer will pick up the location track automatically from the root node.`,
      },
    ],
    troubleshooting: [
      {
        symptom:
          "AttributeError: 'Action' object has no attribute 'slots'",
        cause:
          "Running on Blender 4.x or earlier. Action.slots is a 5.0+ API addition.",
        fix:
          "Upgrade to Blender 5.0 or later. In a pinch, remove the action_slot assignments and let all FCurves land in the default single slot — the animation will still play but all objects share the same channel namespace.",
      },
      {
        symptom:
          "keyframe_insert() inserts no curve — nothing appears in the Dope Sheet",
        cause:
          "The action_slot was not set before calling keyframe_insert(), so Blender has no slot to route to and silently drops the insert.",
        fix:
          "Always set animation_data.action_slot = slot_X before any keyframe_insert() calls. Verify by printing arm_obj.animation_data.action_slot.name in the Python Console.",
      },
      {
        symptom:
          "Shape-key curves appear on the mesh object slot, not the KEY slot",
        cause:
          "Animation data was set on face_obj (the mesh Object) instead of face_obj.data.shape_keys (the Key data-block).",
        fix:
          "key_block = face_obj.data.shape_keys; key_block.animation_data_create(); key_block.animation_data.action = action; key_block.animation_data.action_slot = slot_key. The mesh object itself should have no action assigned unless it has its own object-level transforms to animate.",
      },
      {
        symptom:
          "NLA push-down creates three separate Actions instead of three strips on one Action",
        cause:
          "Each object was assigned a different Action data-block. Action Slots require all objects to share the same Action (same bpy.data.actions entry).",
        fix:
          "Verify: arm_obj.animation_data.action is prop_obj.animation_data.action should return True. If they differ, re-run build_multi_slot_action() — it creates one Action and assigns it to all three IDs.",
      },
      {
        symptom:
          "GLB export includes no animation track for the prop",
        cause:
          "export_animations=True was not passed, or the prop was not the active object during export.",
        fix:
          "Use the exact export call from Step 7. Confirm the GLB contains an animations[] array by opening it in the glTF Validator at https://github.khronos.org/glTF-Validator/ before loading into Three.js.",
      },
    ],
  },
  base,
);

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender 5.0 restructured the Action data-block with a four-level
        hierarchy: <strong>Action → Layer → Strip → ChannelBag → FCurves</strong>.
        A Layer&apos;s <code>blend_mode</code> determines how its FCurves combine
        with the layers beneath it — <code>REPLACE</code> overwrites the current
        result, <code>ADD</code> accumulates on top. The practical consequence
        is that a breathing cycle, an idle sway, and a blink can live as
        independent additive layers in one Action, driven at different
        frequencies, with individual influence sliders that animators can dial
        without rebaking.
      </p>
      <p>
        This blueprint constructs three layers in Python directly via the{" "}
        <code>ChannelBag.fcurves</code> API — the lowest-level, most explicit
        path — so the architecture is legible in code rather than hidden behind
        keyframe insertion routing. Read the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-action-slots-multi-id-shared"
          className={lk}
        >
          Action Slots tutorial
        </Link>{" "}
        first; the Slot system (also 5.0+) is a prerequisite — every ChannelBag
        belongs to exactly one Slot, and a Slot must exist before you can
        request a ChannelBag for it.
      </p>

      <h2>Layer → Strip → ChannelBag → FCurve</h2>
      <p>
        The hierarchy from top to bottom:
      </p>
      <pre>
        <code>{`action = bpy.data.actions.new("char_idle_layered")

# Slots define which ID type owns each ChannelBag
slot_arm = action.slots.new("OBJECT", "character_body")
slot_key = action.slots.new("KEY",    "face_keys")

# Layer — owns blend mode + influence
layer = action.layers.new(name="additive_breath")
layer.blend_mode = "ADD"   # REPLACE | ADD | COMBINE | SUBTRACT | MULTIPLY
layer.influence  = 0.8

# Strip — temporal container (KEYFRAME is the standard type)
strip = layer.strips.new(type="KEYFRAME")

# ChannelBag — per-slot FCurve container inside the strip
bag = strip.channelbag_for_slot(slot_arm)
if bag is None:              # freshly created strips may have no bag yet
    bag = strip.channelbags.new(slot=slot_arm)

# FCurve — the actual animation curve
fc = bag.fcurves.new(data_path='pose.bones["ribcage"].scale', index=2)
fc.keyframe_points.insert(frame=0.0, value=0.04)`}</code>
      </pre>

      <h2>Blend modes in practice</h2>
      <p>
        <code>REPLACE</code> is the default mode and behaves like a traditional
        Action — it writes the result directly, overwriting lower layers.
        Use it for the base pose or locomotion cycle.
      </p>
      <p>
        <code>ADD</code> adds this layer&apos;s value to whatever is below it.
        Channels that are <em>not keyed</em> in the ADD layer contribute zero —
        they leave the lower layers untouched. This is why breathing (ribcage
        Z-scale offset ±0.04) and blink (shape-key value 0→1→0) can each live
        in their own ADD layer without declaring the 200-odd other channels they
        don&apos;t care about.
      </p>
      <p>
        <code>COMBINE</code> uses proper quaternion or Euler combination
        mathematics for rotation channels, preventing gimbal-lock artefacts that
        naive ADD can introduce when rotation values sum past 180°. Prefer
        COMBINE for additive head-look-at or corrective bone rigs on the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-action-constraint-expression-dial-vrm"
          className={lk}
        >
          VRM expression dial rig
        </Link>
        .
      </p>

      <h2>KEY slot: shape-key FCurves belong to the Key data-block</h2>
      <p>
        Shape-key animation does not live on the mesh object&apos;s{" "}
        <code>animation_data</code>. It lives on the{" "}
        <code>bpy.types.Key</code> data-block accessible as{" "}
        <code>face_obj.data.shape_keys</code>. Assigning the action and slot
        to the Key data-block, not the mesh object, is mandatory:
      </p>
      <pre>
        <code>{`key_block = face_obj.data.shape_keys   # bpy.types.Key
key_block.animation_data_create()
key_block.animation_data.action      = action
key_block.animation_data.action_slot = slot_key

# FCurve path is relative to Key, not Object
fc = bag.fcurves.new(data_path='key_blocks["blink"].value', index=0)`}</code>
      </pre>

      <h2>GLB export bakes all layers into one track</h2>
      <p>
        The Blender GLTF exporter evaluates the fully composited animation —
        all layers blended — and writes a single{" "}
        <code>AnimationClip</code> into the GLB named after the Action.
        Three.js <code>AnimationMixer</code> picks this up automatically;
        no special handling is needed on the web side. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-object-instances-gn-scatter-glb-export"
          className={lk}
        >
          depsgraph GLB export tutorial
        </Link>{" "}
        covers the evaluated-object approach for more complex export pipelines.
      </p>
      <p>
        Additive layers give animators per-layer influence sliders in the
        Action Editor while keeping the GLB delivery a clean single clip. For
        cases where you genuinely want multiple independent clips in one GLB,
        push the action to the{" "}
        <Link
          href="/tutorials/blender-tutorial-nla-action-clips-vrm"
          className={lk}
        >
          NLA Editor
        </Link>{" "}
        and export with <code>export_nla_strips=True</code>.
      </p>

      <p className="text-xs text-neutral-400 mt-6">
        Outside sources:{" "}
        <a
          href="https://wiki.blender.org/wiki/Reference/Release_Notes/5.0/Animation_And_Rigging"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          Blender 5.0 Release Notes — Animation &amp; Rigging
        </a>{" "}
        CC-BY-SA-4.0 Blender Foundation · sibling{" "}
        <a
          href="https://github.com/blender/blender"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          github.com/blender/blender
        </a>
        {" · "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.Action.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          bpy.types.Action Python API
        </a>{" "}
        CC-BY-SA-4.0 Blender Foundation · sibling{" "}
        <a
          href="https://github.com/blender/blender-addons"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          blender-addons
        </a>
        {" · "}
        <a
          href="https://github.com/njanakiev/blender-scripting"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          njanakiev/blender-scripting
        </a>{" "}
        MIT Nicolas Janakiev · sibling{" "}
        <a
          href="https://github.com/njanakiev/blender-jupyter"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          blender-jupyter
        </a>
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-animation-layered-action-layers-strips-blending",
  title:
    "Animation Layered Actions — Additive Layer Blending for VRM Idle Animation (Blender 5.1)",
  date: "2026-06-29",
  kind: "tutorial",
  excerpt:
    "Blender 5.0 restructured Actions with a Layer → Strip → ChannelBag hierarchy. A base REPLACE layer drives idle sway; ADD layers stack an independent breathing cycle and face blink on top. All three share one Action and export as a single baked AnimationClip in GLB — no NLA required.",
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/animation/animation-layered-action-layers-strips-blending/",
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
      "Has completed the Action Slots tutorial — understands slot id_type and AnimData.action_slot",
      "Familiar with FCurves: knows what data_path and index mean on a keyframe curve",
      "Knows how shape keys work: Basis + blend keys, Key data-block vs mesh object",
    ],
    steps: [
      {
        title: "Reset scene and build a stand-in character",
        body: `Clear everything and create a two-bone armature plus a face sphere with a blink shape key:

  bpy.ops.object.select_all(action="SELECT")
  bpy.ops.object.delete()

  bpy.ops.object.armature_add(enter_editmode=False)
  arm_obj = bpy.context.object
  arm_obj.name = "character_body"
  # enter Edit Mode to add a ribcage child bone, then return to Object
  bpy.ops.object.mode_set(mode="EDIT")
  rib = arm_obj.data.edit_bones.new("ribcage")
  rib.head, rib.tail = (0,0,0.45), (0,0,0.85)
  rib.parent = arm_obj.data.edit_bones["Bone"]
  bpy.ops.object.mode_set(mode="OBJECT")

  bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(0,0,1.12))
  face_obj = bpy.context.object
  face_obj.shape_key_add(name="Basis")
  face_obj.shape_key_add(name="blink")

Set all pose bone rotation modes to XYZ Euler before creating any FCurves — the default QUATERNION mode requires a different data_path ("rotation_quaternion") and four index slots.`,
      },
      {
        title: "Create the Action and Slots",
        body: `One Action data-block, two Slots — one per ID type:

  action   = bpy.data.actions.new("char_idle_layered")
  slot_arm = action.slots.new("OBJECT", "character_body")
  slot_key = action.slots.new("KEY",    "face_keys")

The KEY slot targets the Key data-block (bpy.types.Key), not the mesh object. Using id_type="OBJECT" for shape-key FCurves silently creates an OBJECT slot with key_blocks paths that the evaluator cannot resolve — curves appear orphaned in the Dope Sheet.`,
      },
      {
        title: "Build Layer 0: base idle sway (REPLACE)",
        body: `The bottom layer sets the ground truth.  REPLACE means its values are authoritative — nothing below it is read.

  l0 = action.layers.new(name="base_idle_sway")
  l0.blend_mode = "REPLACE"
  l0.influence  = 1.0
  s0  = l0.strips.new(type="KEYFRAME")
  bag = s0.channelbag_for_slot(slot_arm)
  if bag is None:
      bag = s0.channelbags.new(slot=slot_arm)

  fc = bag.fcurves.new(
      data_path='pose.bones["root"].rotation_euler', index=1)
  for f in range(0, 121, 3):
      fc.keyframe_points.insert(
          frame=float(f),
          value=math.sin(f / 60 * math.tau) * 0.08)
  fc.update()

index=1 is Y-rotation in XYZ Euler — a gentle side-to-side nod.  Sampling every 3 frames gives smooth Bezier interpolation without an excessive keyframe count.`,
      },
      {
        title: "Build Layer 1: additive breathing (ADD)",
        body: `ADD layers contribute their keyed value on top of the layers below.  Channels absent from the ADD layer contribute zero — the base sway is unaffected.

  l1 = action.layers.new(name="additive_breath")
  l1.blend_mode = "ADD"
  l1.influence  = 0.8
  s1  = l1.strips.new(type="KEYFRAME")
  bag = s1.channelbag_for_slot(slot_arm)
  if bag is None:
      bag = s1.channelbags.new(slot=slot_arm)

  fc = bag.fcurves.new(
      data_path='pose.bones["ribcage"].scale', index=2)
  for f in range(0, 121, 2):
      fc.keyframe_points.insert(
          frame=float(f),
          value=math.sin(f / 12 * math.tau) * 0.04)
  fc.update()

ribcage.scale index 2 is Z-scale — upward chest expansion.  The breathing frequency (every 12 frames = 2 breaths per second at 24fps) is independent of the sway (every 60 frames).  Dragging l1.influence to 0 removes breathing without touching the base.`,
      },
      {
        title: "Build Layer 2: additive blink (ADD on KEY slot)",
        body: `The blink targets the face Key data-block via slot_key.  It is a three-keyframe snap: open → closed → open over 4 frames.

  l2 = action.layers.new(name="additive_blink")
  l2.blend_mode = "ADD"
  l2.influence  = 1.0
  s2  = l2.strips.new(type="KEYFRAME")
  bag = s2.channelbag_for_slot(slot_key)
  if bag is None:
      bag = s2.channelbags.new(slot=slot_key)

  fc = bag.fcurves.new(data_path='key_blocks["blink"].value', index=0)
  for f, v in [(58, 0.0), (60, 1.0), (62, 0.0)]:
      fc.keyframe_points.insert(frame=float(f), value=v)
  fc.update()

For ADD mode: value 0.0 throughout (no blink) = no contribution; value 1.0 at frame 60 = full blink closes on top of base pose.  A second blink at frame 90 simply adds more keyframes to the same FCurve.`,
      },
      {
        title: "Assign animation data and verify",
        body: `Wire each ID to its slot so the evaluator routes correctly:

  arm_obj.animation_data_create()
  arm_obj.animation_data.action      = action
  arm_obj.animation_data.action_slot = slot_arm

  key_block = face_obj.data.shape_keys
  key_block.animation_data_create()
  key_block.animation_data.action      = action
  key_block.animation_data.action_slot = slot_key

Verify in the Python Console:
  a = bpy.data.actions["char_idle_layered"]
  for l in a.layers:
      print(l.name, l.blend_mode, l.influence)
  # base_idle_sway   REPLACE  1.0
  # additive_breath  ADD      0.8
  # additive_blink   ADD      1.0

Press Space to play — the character sways, breathes, and blinks simultaneously from a single Action.`,
      },
      {
        title: "Export as GLB",
        body: `The GLTF exporter bakes the fully composited result — all layers merged at evaluation time — into a single AnimationClip:

  bpy.ops.export_scene.gltf(
      filepath=bpy.path.abspath("//output/vrm_layered_idle.glb"),
      use_selection=True,
      export_animations=True,
      export_nla_strips=False,   # direct action, not NLA bake
      export_yup=True,
      export_apply=False,
      export_draco_mesh_compression_enable=True,
      export_draco_mesh_compression_level=6,
  )

Three.js AnimationMixer.clipAction() picks this up as one clip.  To deliver multiple independent clips in one GLB, push the action to the NLA Editor and export with export_nla_strips=True instead.`,
      },
    ],
    troubleshooting: [
      {
        symptom: "AttributeError: 'Action' object has no attribute 'layers'",
        cause: "Running on Blender 4.x or earlier. Action.layers is a 5.0+ API addition.",
        fix: "Upgrade to Blender 5.0 or later. In 4.x, all FCurves live directly on action.fcurves with no layer hierarchy — the animation still plays but you cannot set blend modes.",
      },
      {
        symptom:
          "channelbag_for_slot() returns None and channelbags.new() raises TypeError",
        cause:
          "The slot argument does not belong to this action — it came from a different action object.",
        fix:
          "Always call slot = action.slots.new(...) on the same action you then call strip.channelbags.new(slot=slot) on. Slots are not transferable between actions.",
      },
      {
        symptom: "ADD layer appears to have no effect on playback",
        cause:
          "The ADD layer's FCurves return 0.0 for all frames because the curve extrapolation extends the first/last keyframe value, not zero.",
        fix:
          "Ensure the ADD FCurve has keyframes at frame 0 and frame_end with value 0.0 so CONSTANT extrapolation returns zero outside the active region. Or set fc.extrapolation = 'CONSTANT' and add boundary zero keyframes.",
      },
      {
        symptom: "Shape key blink missing in GLB / no KEY slot FCurves exported",
        cause:
          "Animation was assigned to face_obj.animation_data instead of face_obj.data.shape_keys.animation_data.",
        fix:
          "key_block = face_obj.data.shape_keys; key_block.animation_data_create(); key_block.animation_data.action = action; key_block.animation_data.action_slot = slot_key. The mesh object's animation_data should be unused if it has no object-level transforms to animate.",
      },
      {
        symptom: "Values double at frame 60 on channels present in both REPLACE and ADD layers",
        cause:
          "The same data_path+index was keyed in both the REPLACE and ADD layer for the same slot.",
        fix:
          "Each channel should live in only one layer. The REPLACE layer owns the base value; ADD layers own the offsets. If a channel appears in the ADD layer, its contribution is added on top of the REPLACE value — keying 0.08 in REPLACE and 0.08 in ADD gives 0.16 on that frame.",
      },
    ],
  },
  base,
);

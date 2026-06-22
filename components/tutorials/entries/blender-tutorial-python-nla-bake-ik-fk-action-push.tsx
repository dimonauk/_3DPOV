import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        An IK constraint that looks perfect in the Blender viewport produces a
        completely static pose in a GLB. The glTF 2.0 format carries keyframe
        channels, not constraint definitions — so when{" "}
        <a
          href="https://github.com/pixiv/three-vrm"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          three-vrm
        </a>{" "}
        or Babylon.js loads the file, it finds the bones at their rest positions
        and nothing moves. The fix is{" "}
        <code>bpy.ops.nla.bake(visual_keying=True)</code>: a single operator
        call that walks every frame, reads the evaluated (constraint-resolved)
        world transform from the dependency graph, and writes explicit rotation
        and location F-curves for each selected bone. The result is a clean
        Action that reproduces IK motion without needing the IK constraint at
        runtime — the mandatory last step before any rigged animation leaves
        Blender for WebXR or VRM.
      </p>

      <p>
        The operator lives in the NLA editor context, which is why it is
        prefixed <code>nla.</code> rather than <code>pose.</code>. In Blender
        5.1 you invoke it via{" "}
        <code>bpy.context.temp_override(active_object=arm, mode=&apos;POSE&apos;)</code>{" "}
        so it runs on the correct object regardless of which editor is
        currently open. Compare this with the deprecated dict-override pattern
        (<code>bpy.ops.nla.bake({"{"}...{"}"}</code>) that was removed in 4.x —
        <code>temp_override</code> is the only supported path in 5.1. The
        Scripting workspace tutorial in this library demonstrates{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          a similar context-safe batch pattern
        </Link>{" "}
        for collection-per-GLB export.
      </p>

      <p>
        After baking, the correct next step is{" "}
        <code>bpy.ops.nla.action_pushdown()</code> to move the baked action
        from the object&apos;s active action slot into an NLA track as a named
        strip. This mirrors the workflow taught in the{" "}
        <Link href="/tutorials/blender-tutorial-nla-action-clips-vrm" className={lk}>
          NLA action clips tutorial
        </Link>{" "}
        and makes the animation addressable by name in glTF: exporting with{" "}
        <code>export_nla_strips=True</code> turns every strip into a separate
        glTF animation that three-vrm can play via{" "}
        <code>VRMAnimationClip</code>. The{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Khronos glTF-Blender-IO exporter
        </a>{" "}
        (Apache-2.0) handles the NLA-strip-to-glTF-animation mapping; the
        baked Action is the clean input it expects.
      </p>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-nla-bake-ik-fk-action-push",
  title:
    "Python: bpy.ops.nla.bake() — IK-Constrained Pose to FK Keyframes for VRM/WebXR GLB",
  date: "2026-06-22",
  kind: "tutorial" as const,
  excerpt:
    "Use bpy.ops.nla.bake(visual_keying=True, clear_constraints=True) to convert IK-driven armature animation into clean FK keyframes, push the baked action to an NLA strip, and export as a GLB whose animations play correctly in three-vrm and Babylon.js without Blender constraints.",
  tags: ["blender", "scripting", "python", "rigging", "animation", "nla", "vrm", "webxr", "glb"],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Build a 3-bone IK arm and animate the target",
        body:
          "Create armature in Edit Mode with three connected bones: shoulder (root, fixed), upper_arm, forearm. The shoulder does NOT participate in the IK chain — chain_count=2 means only upper_arm and forearm are solved.\n\n  arm = bpy.data.armatures.new('ik_arm')\n  obj = bpy.data.objects.new('ik_arm', arm)\n  bpy.context.scene.collection.objects.link(obj)\n\nAdd an Empty (type='SPHERE') at the forearm tip to act as the IK target. Attach an IK constraint to the forearm pose bone:\n\n  bpy.ops.object.mode_set(mode='POSE')\n  pb = obj.pose.bones['forearm']\n  c  = pb.constraints.new('IK')\n  c.target      = tgt_empty\n  c.chain_count = 2\n\nAnimate the Empty's location across 5 keyframes in a wide arc. Five waypoints with varying X/Y/Z ensure the solver produces non-trivial elbow angles on every frame — the more varied the arc, the more clearly the baked F-curves differ from a rest-pose constant.\n\nAdd CYCLES modifiers to the Empty's F-curves so the resulting action loops seamlessly (frame 1 == frame 60):\n\n  for fc in tgt.animation_data.action.fcurves:\n      mod = fc.modifiers.new('CYCLES')\n      mod.mode_before = mod.mode_after = 'REPEAT'",
      },
      {
        title: "Select bones and enter Pose Mode before baking",
        body:
          "bpy.ops.nla.bake(only_selected=True) restricts baking to bones that are SELECTED in Pose Mode at the moment the operator runs. This is the correct approach in a full character rig where you want to bake only the IK-driven limb and leave facial drivers untouched.\n\n  bpy.context.view_layer.objects.active = arm_obj\n  bpy.ops.object.mode_set(mode='POSE')\n  bpy.ops.pose.select_all(action='SELECT')\n  # Do NOT switch back to Object mode here.\n  # nla.bake reads bone selection in Pose Mode.\n\nIf you set only_selected=False, every pose bone on every selected object gets baked — fine for a simple arm, but expensive and action-polluting on a 70-bone VRM rig. Prefer only_selected=True and a deliberate selection of the bones you're converting.\n\nAlternative: select by bone group (layer in older Blender, bone collection in 4.x+) to bake a named subset:\n\n  for pb in arm_obj.pose.bones:\n      pb.bone.select = pb.bone.collections[0].name == 'IK_Arm'",
      },
      {
        title: "bpy.ops.nla.bake() — full parameter breakdown",
        body:
          "  with bpy.context.temp_override(\n      active_object    = arm_obj,\n      selected_objects = [arm_obj],\n      mode             = 'POSE',\n  ):\n      bpy.ops.nla.bake(\n          frame_start        = 1,\n          frame_end          = 60,\n          only_selected      = True,\n          visual_keying      = True,   # ← THE critical flag\n          clear_constraints  = True,\n          clear_parents      = False,\n          use_current_action = False,\n          bake_types         = {'POSE'},\n      )\n\nvisual_keying=True: samples arm_obj.evaluated_get(depsgraph) at each frame, reading the FINAL world transform AFTER IK constraint evaluation. False reads raw bone channels before constraints — every frame would be the rest pose.\n\nclear_constraints=True: removes the IK constraint from baked bones after the loop. Without this, playback re-applies IK on top of the FK keyframes, doubling the rotation. Set False only when you intend to iterate (bake, inspect, adjust, re-bake).\n\nclear_parents=False: preserves the bone parent chain. True would detach bones, destroying the skeleton hierarchy required by glTF skins and VRM HumanoidBones. Never set True for VRM export.\n\nuse_current_action=False: creates a NEW action rather than overwriting the IK target's keyframe action. Rename it immediately after baking:\n  arm_obj.animation_data.action.name = 'arm_ik_baked_fk'\n\nbake_types={'POSE'}: bakes armature pose channels (bone rotations, locations, scales). 'OBJECT' bakes the armature object's own world transform — wrong for rigs where you want individual bone channels.",
      },
      {
        title: "Inspect the baked action in the Action Editor",
        body:
          "After baking, open the Dope Sheet (switch any panel to Dope Sheet → Action Editor). Select the ik_arm object and choose the action 'arm_ik_baked_fk' from the dropdown. You should see:\n\n  shoulder        — no keyframes (it has no IK constraint; rest pose is constant)\n  upper_arm.rot   — keyframes on every frame in the bake range (dense, no gaps)\n  forearm.rot     — same; the IK target moving in 3D space drives varying rotations\n\nThe keyframes will be spaced 1 frame apart (the default step). This produces the largest GLB but the highest-fidelity bake. If you can tolerate slight easing artefacts, re-bake with step=2 or step=3 to halve or third the keyframe count. For a 60-frame clip at step=1, a 3-bone arm produces ~180 rotation keyframes (3 bones × 3 Euler channels × 60 frames = 540 channels, but Blender optimises constant channels).\n\nFor even leaner output after baking:\n  bpy.ops.action.clean(threshold=0.001)  # removes redundant keyframes\n  # Run from Dope Sheet context with the action selected.\n\nThis reduces keyframe count by 40–60 % on smooth curves without visible interpolation error.",
      },
      {
        title: "Push the baked action to an NLA strip",
        body:
          "The NLA Editor stacks actions as named strips on separate tracks. Pushing to NLA is important for GLB export: each strip becomes a separate glTF animation object that runtimes can play by name.\n\n  arm_obj.animation_data.action = baked_action\n\n  with bpy.context.temp_override(\n      active_object    = arm_obj,\n      selected_objects = [arm_obj],\n  ):\n      bpy.ops.nla.action_pushdown(channel_index=0)\n\nAfter push-down:\n  arm_obj.animation_data.action  → None (active slot cleared)\n  arm_obj.animation_data.nla_tracks[0].strips[0].action → baked_action\n\nName the strip for glTF discoverability:\n  strip = arm_obj.animation_data.nla_tracks[0].strips[0]\n  strip.name       = 'arm_ik_baked_fk'\n  strip.use_cyclic = True   # loop flag carried into glTF animation.extras\n\nIn three-vrm you can then address this animation by name:\n  const clip = vrm.expressionManager.getAnimationClip('arm_ik_baked_fk')\n  mixer.clipAction(clip).play()\n\nMultiple actions (idle, wave, walk) become multiple NLA tracks on the same armature. Each pushdown adds a new track. See the NLA action clips tutorial for the multi-animation VRM workflow.",
      },
      {
        title: "GLB export with animations intact",
        body:
          "  bpy.ops.export_scene.gltf(\n      filepath                            = bpy.path.abspath('//ik_arm_baked.glb'),\n      use_selection                       = True,\n      export_format                       = 'GLB',\n      export_animations                   = True,\n      export_nla_strips                   = True,\n      export_apply                        = False,   # MUST be False for rigs\n      export_skins                        = True,\n      export_draco_mesh_compression_enable = True,\n      export_draco_mesh_compression_level  = 6,\n      export_image_format                 = 'WEBP',\n      export_yup                          = True,\n  )\n\nexport_apply=False is critical for skinned rigs. True would flatten the entire skeleton into a static mesh, destroying bone hierarchy and vertex weights. Always False when exporting armatures.\n\nexport_nla_strips=True: each NLA strip on each animated object becomes a separate glTF animation. Without this flag, only the active action is exported (which is None after push-down, meaning NO animation is exported).\n\nexport_skins=True: exports the bone hierarchy as a glTF skin definition — needed for any skinned mesh deformation by three-vrm or Babylon.js. The arm blueprint has no mesh, but when you attach a skin mesh to the armature it will deform correctly at runtime.\n\nexport_yup=True: rotates +Z-up (Blender) to +Y-up (glTF spec). The Holoflow WebXR loader expects +Y-up assets. Without this flag, characters appear lying on their back in the WebXR scene.",
      },
    ],
    finalResult:
      "Running blueprint.py from the Scripting workspace produces ik_arm_baked.glb in the same directory as the .blend. The GLB contains one armature with one glTF animation named 'arm_ik_baked_fk' that plays the original IK-driven arc as FK keyframes, loopable, with no Blender constraints required at runtime. three-vrm and Babylon.js load and play it without modification.",
    variations: [
      "Quaternion bake: switch all bones to Quaternion rotation mode before baking (pose.bones['x'].rotation_mode = 'QUATERNION') to avoid Euler gimbal-lock artefacts on wide-range shoulder rotations. Quaternion keyframes are larger but numerically stable across full 360° rotations.",
      "Step baking: increase step to 2 or 3 (bpy.ops.nla.bake(step=2)) to reduce keyframe density by half or two-thirds. Follow with bpy.ops.action.clean(threshold=0.001) to prune redundant keyframes from smooth arcs. Reduces GLB animation chunk size by 30–50 %.",
      "Partial bake: select only the upper_arm and forearm bones (leave shoulder unselected) with only_selected=True. The shoulder keeps its rest pose in the baked action, saving keyframe storage when the shoulder never animates in the IK clip.",
      "Multi-clip pipeline: run bake() three times on different frame ranges (idle: 1–60, wave: 61–120, walk: 121–200) with use_current_action=False each time. Push each resulting action to a separate NLA track. Export once with export_nla_strips=True to produce a single GLB with three named glTF animations.",
    ],
    troubleshooting: [
      {
        symptom: "Bake produces no action (arm_obj.animation_data.action is None after bake)",
        cause:
          "The bones were not selected in Pose Mode before bake(), or only_selected=True was set with no bones selected. The operator silently exits without writing keyframes.",
        fix:
          "Ensure bpy.ops.object.mode_set(mode='POSE') and bpy.ops.pose.select_all(action='SELECT') are called before bpy.ops.nla.bake(). Verify with: print([pb.bone.select for pb in arm_obj.pose.bones]).",
      },
      {
        symptom: "Baked arm plays correctly in Blender but is static in the GLB",
        cause:
          "export_nla_strips=True was not set, or the action was pushed to NLA before export with export_animations=True but the active slot (animation_data.action) is None. The exporter exported no animations.",
        fix:
          "Confirm export_nla_strips=True in the export call. Check that the NLA track is visible (not muted) and not excluded. Open the exported GLB in gltf-viewer.donmccurdy.com to verify the Animations panel shows the clip name.",
      },
      {
        symptom: "Double-transformation: baked arm rotates twice as far as expected",
        cause:
          "clear_constraints=False was used, leaving the IK constraint active. During playback, Blender evaluates both the FK keyframes AND the IK constraint — the IK target is now at rest so it pulls the arm back to rest, but the FK keyframes push it to the baked position simultaneously.",
        fix:
          "Re-bake with clear_constraints=True. If you need to keep the constraint for iterative editing, use clear_constraints=False but set the IK constraint's influence to 0.0 before export via: pb.constraints['IK_to_target'].influence = 0.0.",
      },
      {
        symptom: "Euler gimbal lock: arm flips 180° at frame 30",
        cause:
          "The bone's rotation_mode is 'XYZ' Euler and the IK solver crossed a gimbal singularity (e.g., shoulder rotated past 90° in X while Y was near 0). The baked Euler values jump by ±180° at that frame.",
        fix:
          "Switch the affected bone to rotation_mode = 'QUATERNION' before baking. Quaternion interpolation is gimbal-free. Re-bake. The resulting F-curves will show W/X/Y/Z channels instead of Euler channels — three-vrm handles quaternion bone rotations correctly.",
      },
    ],
  },
  base,
);

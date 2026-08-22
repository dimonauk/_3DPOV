import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The Non-Linear Animation editor treats <code>bpy.types.Action</code>{" "}
        objects as reusable clips — the same idea as a compositing layer stack,
        but for poses. Each <code>NlaTrack</code> holds one or more{" "}
        <code>NlaStrip</code>s that reference an Action by pointer; tracks
        evaluate bottom-to-top, and each strip&rsquo;s{" "}
        <code>blend_type</code> governs how it combines with the result of all
        tracks below it. For a VRM character&rsquo;s pose library this means
        you can author an idle baseline, a shoulder-raise layer, and a full-arm
        reach layer as independent Actions and crossfade between them by
        animating <code>strip.influence</code> — without duplicating any bone
        data. Compare this with the corrective driver approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-driver-bone-rotation-shape-key-corrective-blend"
          className={lk}
        >
          Bone-Rotation Driver tutorial
        </Link>
        : drivers correct shape-key deformation on a single mesh, while NLA
        blending assembles whole-body poses from authored clips.
      </p>

      <p>
        The <code>COMBINE</code> blend type is the critical choice for layered
        animation. Unlike <code>REPLACE</code> — which simply overwrites the
        evaluation result of every track beneath it — <code>COMBINE</code>{" "}
        quaternion-multiplies rotation channels and vector-adds locations. This
        means a raise layer that rotates the shoulder 45° around X will compose
        correctly with a reach layer that rotates it a further 60°, producing
        105° total without gimbal lock. The same principle governs the spring
        bone chain in the{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          VRM Spring Bones tutorial
        </Link>
        : secondary motion accumulates across the chain because each bone&rsquo;s
        constraint contribution composes on top of the parent bone&rsquo;s
        evaluated rotation — the same stacking mathematics the NLA uses.
      </p>

      <p>
        Single-frame Actions are the sharpest tool in the VRM pose library:
        each Action holds exactly one <code>CONSTANT</code>-interpolated
        keyframe at frame 1, which means the strip always reads the same pose
        regardless of its position on the timeline. The strip&rsquo;s{" "}
        <code>extrapolation = &apos;HOLD&apos;</code> extends that frame-1 pose
        across the strip&rsquo;s full duration. Crossfading is then entirely
        controlled by <code>strip.influence</code>, which can be keyframed
        directly in the NLA Editor&rsquo;s N-panel or driven by a custom
        property — the same property-driver pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-fcurve-keyframe-insert-procedural-animation-turntable"
          className={lk}
        >
          FCurve Keyframe tutorial
        </Link>{" "}
        for procedural turntable timing. The armature construction here mirrors
        the spine chain from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-armature-edit-bones-vrm-spine-chain"
          className={lk}
        >
          EditBone Chain tutorial
        </Link>
        , so both blueprints can be combined into a single rigged character in
        one script.
      </p>

      <p>
        Flattening the NLA stack for export uses{" "}
        <code>bpy.ops.nla.bake()</code>, which evaluates the blended result at
        every frame in the range and writes it as bone FCurves on a fresh
        Action. The operator requires Pose Mode and selected bones — it polls
        the active object&rsquo;s pose, not the NLA editor. After baking,{" "}
        <code>ad.action</code> holds the flattened result and the NLA tracks
        are left intact on the object. The GLB exporter then picks up the
        baked Action via <code>export_anim_mode=&apos;ACTIONS&apos;</code>,
        producing a single animation clip suitable for{" "}
        <code>THREE.AnimationMixer</code> in WebXR without any NLA-specific
        runtime.
      </p>

      <p>
        <strong>Outside sources.</strong>{" "}
        Blender Foundation —{" "}
        <em>bpy.types.NlaTrack API Reference (5.1)</em>{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.NlaTrack.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.NlaTrack.html
        </a>{" "}
        CC-BY-4.0 — documents <code>mute</code>, <code>lock</code>,{" "}
        <code>is_solo</code>, <code>strips</code> collection, and{" "}
        <code>nla_tracks.new()</code> / <code>.remove()</code>; sibling repo{" "}
        <a
          href="https://projects.blender.org/blender/blender-extensions"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          blender/blender-extensions
        </a>{" "}
        (Apache-2.0) — the extensions platform hosting add-ons such as Rig
        Tools and Animation Layers that automate multi-track NLA workflows.{" "}
        Blender Foundation —{" "}
        <em>bpy.types.NlaStrip API Reference (5.1)</em>{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.NlaStrip.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.NlaStrip.html
        </a>{" "}
        CC-BY-4.0 — full listing of <code>blend_type</code>,{" "}
        <code>influence</code>, <code>extrapolation</code>,{" "}
        <code>use_auto_blend</code>, <code>repeat</code>, <code>scale</code>,
        and the <code>action_frame_start</code> /{" "}
        <code>action_frame_end</code> clip-trimming properties; related project{" "}
        <a
          href="https://projects.blender.org/blender/blender-addons"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          blender/blender-addons
        </a>{" "}
        — legacy add-on repository containing the Pose Library add-on which
        uses the same Action + NlaStrip architecture to store and recall poses.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-nla-track-strip-action-library-vrm-pose-blend",
  title:
    "Python bpy.types.NlaTrack + NlaStrip — Non-Linear Animation: Action Library, Strip Blending & VRM Pose-Morphing Rig (Blender 5.1)",
  date: "2026-07-05",
  kind: "tutorial",
  excerpt:
    "The NLA editor treats Actions as reusable pose clips — one Action per pose, one NlaTrack per layer. COMBINE blend type quaternion-multiplies rotations so partial poses compose without gimbal lock. Single-frame Actions with HOLD extrapolation keep poses frozen across strip duration; strip.influence cross-fades between them. bpy.ops.nla.bake() flattens the stack to a single GLB-ready Action. Covers the direct FCurve API for headless keyframing and the ad.action = None rule that prevents the action slot double-applying on top of the NLA.",
  tags: [
    "blender",
    "python",
    "scripting",
    "nla",
    "animation",
    "action",
    "vrm",
    "pose-library",
    "webxr",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-nla-track-strip-action-library-vrm-pose-blend",
    time: "forty-five minutes",
    difficulty: "intermediate",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable writing bpy Python scripts in the Scripting workspace",
      "Has built at least one armature in Edit Mode (see EditBone Chain tutorial)",
      "Understands bpy.types.Action and FCurves at a basic level",
    ],
    steps: [
      {
        title:
          "Understand the NLA data model — AnimData, NlaTrack, NlaStrip, Action",
        body: "ob.animation_data      — bpy.types.AnimData; must be created via animation_data_create()\n  .action              — the 'action slot': evaluates IN ADDITION to NLA tracks\n  .nla_tracks          — bpy_prop_collection of NlaTrack\n\nNlaTrack\n  .name, .mute, .lock, .is_solo\n  .strips              — bpy_prop_collection of NlaStrip\n\nNlaStrip\n  .frame_start, .frame_end    — timeline position\n  .action_frame_start/end     — which portion of the Action to read (clip trimming)\n  .blend_type                 — 'REPLACE' | 'COMBINE' | 'ADD' | 'SUBTRACT' | 'MULTIPLY'\n  .influence                  — 0.0–1.0, multiplies into the blend\n  .extrapolation              — 'NOTHING' | 'HOLD' | 'HOLD_FORWARD'\n  .repeat                     — float; 2.0 loops the action twice\n  .scale                      — time scale; 2.0 plays at half speed\n  .use_auto_blend             — auto blend_in/out from adjacent strips\n\nAction\n  .fcurves                    — keyed channel data\n  .frame_range                — (first_key, last_key) read-only\n  .use_fake_user              — keep action alive without being assigned\n\nCritical rule: ad.action evaluates BEFORE the NLA stack.  If ad.action is set\nand NLA tracks also exist, Blender adds both contributions — the action slot\nappears as an unlocked 'stacked' action on top of the NLA.  Always set\nad.action = None when you want pure NLA evaluation.",
      },
      {
        title:
          "Create one Action per pose using the direct FCurve API",
        body: "# Context-free approach — works headless and in the Text Editor.\nimport bpy, math\n\narm_ob = bpy.data.objects['vrm_arm_rig']\narm_ob.animation_data_create()\n\npose_idle = bpy.data.actions.new('pose_idle')\npose_idle.use_fake_user = True   # survive without assignment\n\n# Write a zero rotation for every bone at frame 1.\nfor i in range(3):\n    bone_name = f'bone_{i:02d}'\n    arm_ob.pose.bones[bone_name].rotation_mode = 'XYZ'\n    data_path = f'pose.bones[\"{bone_name}\"].rotation_euler'\n    for axis in range(3):\n        fc = pose_idle.fcurves.new(data_path, index=axis, action_group=bone_name)\n        kp = fc.keyframe_points.insert(1, 0.0)\n        kp.interpolation = 'CONSTANT'  # snap — the NLA strip handles fading\n\n# Repeat for pose_raise (shoulder 45°, elbow -30°) and pose_reach (shoulder 60°, etc.)\n# See blueprint.py build_actions() for the full rotation table.\n\n# WHY CONSTANT interpolation:\n#   Each Action is a static pose — you want to hold the pose for the strip's\n#   entire duration, not interpolate toward the next keyframe.  The NLA's\n#   strip.influence is what fades between poses, not the Action's own curves.",
      },
      {
        title:
          "Push Actions onto NLA Tracks — strips.new(), frame_end, and extrapolation",
        body: "ad = arm_ob.animation_data\nad.action = None   # CRITICAL — clear slot before relying on NLA only\n\n# Remove any previous NLA tracks (re-run safety).\nfor track in list(ad.nla_tracks):\n    ad.nla_tracks.remove(track)\n\n# Push the idle Action as the base REPLACE track.\ntrack_idle = ad.nla_tracks.new()\ntrack_idle.name = 'pose_idle'\nstrip_idle = track_idle.strips.new('pose_idle', 1, pose_idle)\n\n# strips.new() auto-sets frame_end from action.frame_range.\n# For a single-frame action, frame_range == (1.0, 1.0),\n# so frame_end == frame_start == 1 — a zero-length strip.\n# Fix: explicitly set the span you want on the timeline.\nstrip_idle.frame_start       = 1\nstrip_idle.frame_end         = 90\nstrip_idle.action_frame_start = 1.0\nstrip_idle.action_frame_end   = 1.0  # always read frame 1 of the action\nstrip_idle.extrapolation      = 'HOLD'  # hold pose beyond strip_end\nstrip_idle.blend_type         = 'REPLACE'\nstrip_idle.use_auto_blend     = False\nstrip_idle.influence          = 1.0\n\n# WHY HOLD extrapolation:\n#   Without it the strip produces no output beyond frame_end — the rig\n#   reverts to its rest pose, which breaks blending mid-crossfade.",
      },
      {
        title:
          "Set blend_type COMBINE on additive layers — quaternion composition",
        body: "# Add the raise layer ABOVE the idle track.\ntrack_raise = ad.nla_tracks.new()\ntrack_raise.name = 'pose_raise'\nstrip_raise = track_raise.strips.new('pose_raise', 1, pose_raise)\nstrip_raise.frame_start        = 1\nstrip_raise.frame_end          = 90\nstrip_raise.action_frame_start = 1.0\nstrip_raise.action_frame_end   = 1.0\nstrip_raise.extrapolation      = 'HOLD'\nstrip_raise.blend_type         = 'COMBINE'  # <— quaternion-multiplies with layers below\nstrip_raise.influence          = 0.0        # starts invisible; fade in via influence keys\n\n# Similarly for track_reach / strip_reach.\n\n# COMBINE vs REPLACE:\n#   REPLACE: this track's full rotation value overrides everything below.\n#   COMBINE: rotation channels quaternion-multiply with the accumulated result.\n#            Shoulder in idle = 0°; raise adds 45°; reach adds 60°;\n#            COMBINE gives 105° total — correct.  REPLACE would give only 60°.\n# ADD/SUBTRACT: useful for blending raw values (location offsets, shape keys)\n#               but produces wrong results for rotations over 180° — avoid.\n# MULTIPLY: element-wise multiply — rarely used for bone channels.",
      },
      {
        title:
          "Animate strip.influence to crossfade between poses",
        body: "# strip.influence is a regular Python float property on the strip object.\n# To keyframe it via the Python API you need an FCurve in the object's\n# AnimData action slot — but ad.action must be None for pure NLA evaluation.\n#\n# The cleanest production approach: use a frame_change_pre handler that sets\n# influence procedurally each frame, then bake.  See record.py for this pattern.\n#\n# Alternatively: set influence statically and swap in-editor.\n# Or: add a Custom Property to the armature and drive strip.influence via a driver.\n#\n# Driver approach (edit in Graph Editor → Drivers):\n#   1. Right-click strip Influence → Add Driver\n#   2. Set driver type: SCRIPTED, expression: var\n#   3. Variable: OBJECT, armature ob, data_path: '[\"pose_blend\"]'\n#   4. Animate the custom property '[\"pose_blend\"]' on the armature.\n#\n# This lets you expose a single 0–1 slider in the Properties panel that\n# controls pose crossfading without touching NLA internals at runtime.\n# The driver_namespace / load_post pattern from the Scripting Driver tutorial\n# is the right place to register a custom expression function if you want\n# non-linear mapping (ease-in, ease-out) on that blend slider.",
      },
      {
        title:
          "Bake the NLA stack to a single Action and export GLB",
        body: "# bpy.ops.nla.bake() polls for POSE mode and selected bones.\nbpy.context.view_layer.objects.active = arm_ob\nbpy.ops.object.mode_set(mode='POSE')\nbpy.ops.pose.select_all(action='SELECT')\n\nbpy.ops.nla.bake(\n    frame_start       = 1,\n    frame_end         = 90,\n    only_selected     = True,\n    visual_keying     = True,   # captures post-constraint evaluated pose\n    clear_constraints = False,\n    clear_parents     = False,\n    bake_types        = {'POSE'},\n)\nbpy.ops.object.mode_set(mode='OBJECT')\n\n# ad.action now holds the baked FCurves.  The NLA tracks are still present\n# but the baked action in the slot takes priority.\nbpy.ops.export_scene.gltf(\n    filepath          = bpy.path.abspath('//vrm_pose_lib.glb'),\n    export_format     = 'GLB',\n    export_animations = True,\n    export_anim_mode  = 'ACTIONS',\n    export_draco_mesh_compression_enable = True,\n    export_draco_mesh_compression_level  = 6,\n    export_image_format = 'WEBP',\n)\n\n# TROUBLESHOOTING:\n#   Bake produces only T-pose: strip.influence is 0 on all tracks;\n#     check track_raise.strips[0].influence before baking.\n#   Bake gives doubled rotation: ad.action was not None before baking;\n#     set ad.action = None, then undo the bake, then re-bake.\n#   GLB animation is missing: export_anim_mode='NLA_TRACKS' exports\n#     per-strip clips instead; use 'ACTIONS' to get the baked single clip.\n#   Strips vanish after bake: bake() with clear_constraints=True also\n#     clears NLA data on some Blender builds — use clear_constraints=False.",
      },
    ],
  },
  base
);

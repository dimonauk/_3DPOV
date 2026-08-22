import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A BVH file is a hierarchical motion capture recording: joint rotations
        sampled at a fixed rate, organised as a skeleton tree. Blender&apos;s
        built-in BVH importer turns it into an armature object in seconds. The
        challenge is that the source skeleton — usually from the CMU database or
        an acrobatics session via Kinect / Leap — has entirely different bone
        names, rest-pose orientation, and possibly a different frame rate than
        the VRM armature you want to drive. This tutorial solves that pipeline
        in pure Python: import, remap, constrain, bake, export.
      </p>
      <p>
        The key design decision is <em>LOCAL → LOCAL COPY_ROTATION</em>. By
        choosing local space on both the target and source sides, each VRM bone
        copies the <em>relative</em> rotation its matched BVH bone makes against
        its own parent — independent of skeleton scale, global offset, or rest
        pose orientation. This is what allows the same script to work whether
        your VRM character is in T-pose or A-pose, whether the BVH source is 50
        cm tall or 2 m tall.
      </p>

      <h2>Why BVH?</h2>
      <p>
        BVH (Biovision Hierarchy) is the lingua franca of motion capture
        distribution. The{" "}
        <a
          href="http://mocap.cs.cmu.edu/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          CMU Graphics Lab database
        </a>{" "}
        contains thousands of clips — walks, dances, acrobatics, martial arts —
        released to the public domain. Each clip is a single text file: a
        hierarchy block defining the skeleton, followed by a frame block with
        one line of joint angles per frame. Blender 5.1 reads it natively via{" "}
        <code>bpy.ops.import_anim.bvh()</code> with no add-on required.
      </p>

      <h2>Import parameters that matter</h2>
      <pre>{`bpy.ops.import_anim.bvh(
    filepath     = str(BVH_PATH),
    target       = 'ARMATURE',
    global_scale = 0.01,          # CMU is in centimetres
    use_fps_scale = False,        # keep native BVH fps; retime in NLA
    rotate_mode  = 'QUATERNION',  # avoid Euler gimbal on shoulder/wrist
)`}</pre>
      <p>
        Two of these deserve explanation. <code>global_scale=0.01</code>{" "}
        converts the CMU data from centimetres to metres; the importer applies
        this to the root translation FCurves and to bone lengths in Edit Mode,
        so your VRM hips will be at the right world height. If you use Mixamo
        BVH (which is already in metres), set this to{" "}
        <code>1.0</code>.
      </p>
      <p>
        <code>rotate_mode=&apos;QUATERNION&apos;</code> tells the importer to
        bake each frame&apos;s Euler channel triplet into a quaternion keyframe
        rather than storing the raw Euler values. This prevents gimbal lock
        artifacts in shoulder and wrist channels that rotate through large
        combined angles during a poi spin or a full overhead reach.{" "}
        <code>rotate_mode=&apos;NATIVE&apos;</code> preserves the original
        channel order (ZXY for CMU hips), which is fine for inspection but
        breaks during constraint baking because the {" "}
        <code>visual_keying</code> pass samples world-space matrices and writes
        quaternions regardless.
      </p>

      <h2>Bone name mapping</h2>
      <p>
        CMU names the skeleton in PascalCase; VRM-for-Blender uses camelCase
        matching the VRM spec&apos;s humanoid bone list. A dict is the right
        data structure — linear scan through a dict is negligible for 24 bones,
        and a dict is self-documenting in a way that parallel lists are not.
      </p>
      <pre>{`CMU_TO_VRM = {
    "Hips":           "hips",
    "LowerBack":      "spine",    # CMU splits lumbar/thoracic
    "Spine1":         "chest",
    "Neck1":          "neck",
    "Head":           "head",
    "LeftShoulder":   "leftShoulder",
    "LeftArm":        "leftUpperArm",
    "LeftForeArm":    "leftLowerArm",
    "LeftHand":       "leftHand",
    "LeftUpLeg":      "leftUpperLeg",
    "LeftLeg":        "leftLowerLeg",
    "LeftFoot":       "leftFoot",
    # ... mirror for right side
}`}</pre>
      <p>
        If the BVH source uses different names, run this after import to see
        what you actually have:
      </p>
      <pre>{`src = bpy.data.objects["your_bvh_armature"]
print(list(src.pose.bones.keys()))`}</pre>

      <h2>LOCAL/LOCAL COPY_ROTATION</h2>
      <pre>{`rot_c = vrm_pbone.constraints.new('COPY_ROTATION')
rot_c.target       = src_obj
rot_c.subtarget    = bvh_bone_name
rot_c.space        = 'LOCAL'      # evaluate VRM bone in its parent's space
rot_c.target_space = 'LOCAL'      # evaluate BVH bone in its parent's space
rot_c.mix_mode     = 'REPLACE'`}</pre>
      <p>
        This is the crux of the whole technique. When space is{" "}
        <code>LOCAL</code> on both sides, Blender reads the rotation the BVH
        bone makes relative to its parent, and writes the <em>same</em>{" "}
        rotation onto the VRM bone relative to its parent. Because both skeletons
        share the same kinematic topology (hips → spine → chest → etc.), the
        result is a faithful reproduction of the performer&apos;s motion even if
        the skeletons have wildly different proportions or rest-pose orientations.
      </p>
      <p>
        The exception is the hips root, which carries absolute world-space
        translation. For hips, add a companion <code>COPY_LOCATION</code>{" "}
        constraint in <code>WORLD</code> space with the same target:
      </p>
      <pre>{`if vrm_name == "hips":
    loc_c = vrm_pbone.constraints.new('COPY_LOCATION')
    loc_c.target       = src_obj
    loc_c.subtarget    = bvh_bone_name
    loc_c.space        = 'WORLD'
    loc_c.target_space = 'WORLD'`}</pre>

      <h2>When rest poses differ (T vs A pose)</h2>
      <p>
        LOCAL/LOCAL is rest-pose-agnostic for <em>pure rotation</em>. If your
        BVH source sits at its own rest pose (usually T-pose, arms out level)
        and your VRM character is rigged in A-pose (arms angled 45° down), the
        character&apos;s arms will appear at -45° when the performer stands
        naturally. Fix this by computing a one-time rest-pose delta per bone:
      </p>
      <pre>{`src_rest  = src_obj.data.bones[bvh_name].matrix_local
tgt_rest  = tgt_obj.data.bones[vrm_name].matrix_local
delta = src_rest.inverted() @ tgt_rest
rot_c.euler_rotation = delta.to_euler()`}</pre>
      <p>
        This offset is baked into the constraint, not computed per frame, so it
        costs nothing at bake time. For CMU → a T-pose VRM armature, no offset
        is needed because both use T-pose as rest.
      </p>

      <h2>Visual keying bake</h2>
      <pre>{`bpy.ops.nla.bake(
    frame_start       = 1,
    frame_end         = scene.frame_end,
    only_selected     = False,
    visual_keying     = True,    # resolve constraint stack before sampling
    clear_constraints = True,    # remove constraints in the same pass
    bake_types        = {'POSE'},
)`}</pre>
      <p>
        <code>visual_keying=True</code> is non-negotiable. Without it, Blender
        reads the FCurves on the target armature directly — which are flat,
        because all the motion lives on the source BVH armature. With it,
        Blender forces a full depsgraph evaluation at every frame, samples the
        world-space matrices of the constrained bones, and converts those to
        local-space quaternion keyframes. This is slower (it triggers a full
        scene solve per frame) but it is the only path that produces correct
        output.
      </p>
      <p>
        <code>clear_constraints=True</code> removes all retarget constraints
        from the target armature once baking is complete. You do not need a
        second cleanup loop.
      </p>

      <h2>Linearise FCurves after bake</h2>
      <p>
        The bake writes one keyframe per frame with <code>BEZIER</code>{" "}
        interpolation. Blender tries to fit smooth handles across the dense
        keyframes but the handles are computed independently per channel — they
        do not know about the quaternion unit-sphere constraint. The result is
        subtle arc artifacts in limbs that rotate through large angles. Switching
        all keypoints to <code>LINEAR</code> removes the handles and makes the
        FCurve a faithful piecewise-linear reconstruction of the bvh data:
      </p>
      <pre>{`for fc in baked_action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'`}</pre>
      <p>
        If you want smoothing, apply a <code>SMOOTH</code> FCurve modifier to
        the whole curve rather than per-keypoint, so the smoothing respects
        quaternion continuity.
      </p>

      <h2>NLA strip and GLB export</h2>
      <pre>{`tgt.animation_data.action = None     # detach direct action
track = tgt.animation_data.nla_tracks.new()
strip = track.strips.new(action_name, FRAME_START, baked_action)
strip.blend_type = 'REPLACE'

bpy.ops.export_scene.gltf(
    filepath                     = str(output_path),
    use_selection                = True,
    export_nla_strips            = True,
    export_nla_strips_merged_animation_name = "dance_retarget",
    export_yup                   = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
)`}</pre>
      <p>
        Setting <code>animation_data.action = None</code> before pushing to NLA
        is critical: if a direct action is still set, Blender evaluates it on
        top of the NLA, and some frames will show the T-pose overriding the
        retargeted motion. Removing it makes the NLA the sole animation source.
      </p>

      <h2>Frame rate mismatch</h2>
      <p>
        CMU BVH data is typically captured at 120 fps. Blender defaults to 24
        fps. Setting <code>use_fps_scale=False</code> in the importer preserves
        the BVH&apos;s own frame count (one keyframe per capture frame). The
        importer sets the scene frame rate to match the BVH; reset it to 24 fps
        after import and adjust the NLA strip&apos;s <code>scale</code>{" "}
        property:
      </p>
      <pre>{`# After import:
bpy.context.scene.render.fps = 24
# Scale the NLA strip to retime 120→24 fps (5× slow):
strip.scale = 5.0          # or 1/5 to speed up`}</pre>
      <p>
        Alternatively, keep the scene at 120 fps and let the WebXR export
        consumer retime. GLB animations carry their own frame timestamps (in
        seconds), so the playback speed is determined by the animation duration,
        not the export-time fps.
      </p>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-mathutils-quaternion-slerp-squad-vrm-retarget"
            className={lk}
          >
            Quaternion SLERP &amp; SQUAD for VRM Retarget
          </Link>{" "}
          — the maths behind rotation space conversion and interpolation used
          during constraint baking.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-nla-bake-ik-fk-action-push"
            className={lk}
          >
            NLA Bake: IK → FK Action Push
          </Link>{" "}
          — covers <code>bpy.ops.nla.bake()</code> in the context of IK chain
          resolution; the same bake flags apply here.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr"
            className={lk}
          >
            Python bpy Action &amp; NLA — Poi Performance FCurve Pipeline
          </Link>{" "}
          — NLA strip stacking, REPLACE blend type, and the batch keyframe
          insertion pattern.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-posebone-matrix-world-space-ik-bake-vrm"
            className={lk}
          >
            Pose Bone World-Space Matrix &amp; IK Bake for VRM
          </Link>{" "}
          — direct matrix operations on pose bones; useful when you need to
          post-process the baked keyframes.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="http://mocap.cs.cmu.edu/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            CMU Graphics Lab Motion Capture Database
          </a>{" "}
          — Public Domain · Carnegie Mellon University · thousands of BVH clips
          covering dance, acrobatics, sports, and everyday motion. Sibling org:{" "}
          <a
            href="https://github.com/CMU-Perceptual-Computing-Lab/openpose"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            CMU-Perceptual-Computing-Lab/openpose
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/vrm-c/vrm-spec"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            VRM Specification 1.0
          </a>{" "}
          — MIT · VRM Consortium · canonical humanoid bone name list and
          constraints for VRM character models. Sibling repo:{" "}
          <a
            href="https://github.com/vrm-c/UniVRM"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            vrm-c/UniVRM
          </a>
          .
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <pre>{`# Target armature does not move during playback
→ visual_keying=False was used, or bake ran before constraints were applied.
  Re-apply constraints, then re-bake with visual_keying=True.

# Arms are stuck 45° from rest after retarget
→ Source is T-pose, target is A-pose. Compute rest-pose delta per bone and
  set rot_c.euler_rotation. See "When rest poses differ" above.

# GLB plays in Blender but is static in three.js / WebXR
→ export_nla_strips=False (the default). Set it to True.
  Verify: open GLB in Babylon.js Sandbox → Animations tab must show the clip.

# BVH import creates the armature but bone count is wrong
→ Print list(src_obj.pose.bones.keys()) to verify names.
  CMU subject 05 uses 'Hips', 'LowerBack', etc.; subject 87 may differ.
  Update CMU_TO_VRM keys accordingly.

# Root hips drift or stutter
→ Location constraint is WORLD/WORLD but VRM hips bone has a parent offset.
  Change hips loc_c.space='LOCAL' and add an offset for the skeleton height
  difference, or simply zero out the VRM hips location keyframes after bake
  and let the bone animate in local space from (0,0,0).`}</pre>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-bvh-import-vrm-bone-remap-nla-bake-retarget",
  title:
    "Python bpy — BVH Import → VRM Bone Remap → NLA Bake: Dance & Poi Motion Capture Retargeting Pipeline (Blender 5.1)",
  subtitle:
    "bpy.ops.import_anim.bvh(); CMU→VRM name mapping dict; LOCAL/LOCAL COPY_ROTATION; visual_keying bake; NLA strip push; GLB export with NLA strips.",
  description:
    "Retarget CMU-format BVH motion capture (dancer, poi performer, acrobat) onto a VRM armature using LOCAL/LOCAL COPY_ROTATION constraints, bake with visual_keying=True to resolve the full constraint stack, push the result to an NLA strip, and export an animated GLB for WebXR. Covers BVH import parameters, bone name mapping, rest-pose delta compensation for T-vs-A pose, FCurve linearisation, frame-rate mismatch handling, and cleanup.",
  date: "2026-07-25",
  tags: [
    "blender",
    "python",
    "animation",
    "bvh",
    "mocap",
    "motion-capture",
    "retarget",
    "vrm",
    "nla",
    "bake",
    "constraints",
    "glb",
    "webxr",
    "scripting",
    "rigging",
    "poi",
    "dance",
  ],
  body: Body,
  libraryPath:
    "blends/scripting/python-bpy-bvh-import-vrm-bone-remap-nla-bake-retarget",
});

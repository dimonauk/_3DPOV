import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function NlaActionClipsVrmBody() {
  return (
    <>
      <p>
        A VRM avatar does not play one monolithic animation. It layers
        independent clips simultaneously &mdash; a walking cycle on the bones,
        a blink on the left eyelid, a smile on the cheeks, an &lsquo;aa&rsquo;
        phoneme on the jaw &mdash; each driven by a different system at its own
        weight. That runtime model requires the GLB to contain separately-named
        glTF Animation objects, not a single merged track. This tutorial wires
        up the Blender NLA editor to produce exactly that output.
      </p>

      <p>
        The prerequisite is the{" "}
        <Link href="/tutorials/blender-tutorial-shape-keys-morph-targets" className={lk}>
          shape keys and morph targets tutorial
        </Link>
        , which builds the face proxy mesh and five VRM expressions. Here we
        keep the same mesh and shape key setup, then add a layer above it: each
        expression gets its own <code>bpy.data.Action</code>, which stores the
        keyframes that drive its shape key value from 0 to 1 and back. Each
        action is pushed to a named NLA strip. Blender&rsquo;s glTF exporter
        writes each strip as a separate glTF Animation with the strip name as
        its <code>name</code> field.
      </p>

      <p>
        The critical subtlety that breaks most first attempts: shape key
        animation data lives on <code>obj.data.shape_keys</code> (a{" "}
        <code>bpy.types.Key</code> object), not on <code>obj</code> itself.
        Setting <code>obj.animation_data.action</code> drives location,
        rotation, and scale &mdash; the shape key sliders are unaffected.
        Setting <code>obj.data.shape_keys.animation_data.action</code> drives
        the shape keys. The NLA tracks likewise live on the Key&rsquo;s
        animation data. Getting this wrong produces a GLB with morph targets
        that never animate, with no error or warning from the exporter.
      </p>

      <p>
        The export flag is <code>export_nla_strips=True</code>. With it set,
        each NLA strip becomes an independently-named glTF Animation. Without
        it, Blender either exports only the active action or merges all actions
        into a single clip &mdash; neither of which is usable for per-expression
        control. In Three.js the clips surface as{" "}
        <code>gltf.animations</code>, addressable by name via{" "}
        <code>AnimationMixer.clipAction()</code>. See the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          Blender-to-site asset pipeline
        </Link>{" "}
        for how these clips are loaded into the framework&rsquo;s animation
        controller and blended at runtime.
      </p>

      <p>
        Draco compression remains disabled for the same reason as the
        shape-keys tutorial: <code>KHR_draco_mesh_compression</code> and{" "}
        <code>KHR_mesh_morph_targets</code> are spec-incompatible. The{" "}
        <Link href="/tutorials/blender-addon-vrm-format" className={lk}>
          VRM format add-on tutorial
        </Link>{" "}
        covers the final packaging step where these named clips are mapped to
        VRM 1.0 expression presets and the file is repackaged as a{" "}
        <code>.vrm</code>. The{" "}
        <Link href="/tutorials/blender-tutorial-armature-weight-paint" className={lk}>
          armature and weight painting tutorial
        </Link>{" "}
        shows how bone animations can occupy separate NLA tracks in the same
        GLB alongside shape key clips, playing simultaneously without conflict.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-nla-action-clips-vrm",
  title: "NLA editor: per-expression animation clips for VRM in Blender 5.1",
  date: "2026-05-21",
  kind: "tutorial",
  excerpt:
    "How to wrap each VRM shape-key expression in its own bpy.data.Action, push it to a named NLA strip, and export a GLB where each strip is a separate, independently-addressable glTF Animation — the clip model that Three.js AnimationMixer and VRM 1.0 runtimes expect for simultaneous expression blending.",
  Body: NlaActionClipsVrmBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-shape-keys-morph-targets",
      label: "Tutorial — Shape keys and morph targets",
      note: "Builds the face mesh and VRM expressions that this tutorial animates.",
    },
    {
      href: "/tutorials/blender-tutorial-armature-weight-paint",
      label: "Tutorial — Armature and weight painting",
      note: "Bone animations occupy NLA tracks alongside shape key clips in the same GLB.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "Loading the multi-animation GLB and driving clips via AnimationMixer.",
    },
    {
      href: "/tutorials/blender-addon-vrm-format",
      label: "Tutorial — VRM format add-on",
      note: "Maps clip names to VRM 1.0 expression presets and packages the .vrm file.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/editors/nla/index.html",
      label: "Blender Manual — NLA Editor (CC BY — Blender Documentation Team)",
      note: "Reference for the action-push workflow, strip blend modes, influence weights, and the evaluated result that the exporter reads. Covers the difference between solo, muted, and active-action override modes.",
    },
    {
      href: "https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#animations",
      label: "glTF 2.0 Spec — Animations §7.1 (Apache-2.0 — The Khronos Group)",
      note: "Normative definition of the Animation object, Channel, Sampler, and the name field that Blender writes from the NLA strip name. Explains why animations are parallel by default and how runtimes are expected to blend them.",
    },
    {
      href: "https://github.com/mrdoob/three.js/blob/dev/src/animation/AnimationMixer.js",
      label: "Three.js AnimationMixer source (MIT — mrdoob and contributors)",
      note: "The clipAction() → play() → setWeight() pattern for mixing named clips. Reading the source clarifies why pausing vs stopping a clip matters for VRM expression blending and how to crossfade between a smile and a neutral pose.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "two to three hours",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Completed the shape keys and morph targets tutorial, or comfortable with bpy.data.Key and shape key creation.",
      "Blender 5.1 installed and able to run a headless blueprint.py script.",
      "Basic familiarity with the NLA editor interface (action push, track visibility).",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Uses BLENDER_EEVEE_NEXT for the record.py render step.",
      },
    ],
    steps: [
      {
        title: "Understand the glTF animation model: clips, actions, and NLA strips",
        body: "A glTF file can contain multiple Animation objects. Each is a named, self-contained set of time-value curves. They are parallel by default — the runtime is expected to play any subset simultaneously at independent weights. This matches the VRM 1.0 expression model exactly: a runtime may drive blinkLeft at weight 0.9, happy at weight 0.4, and aa at weight 0.7 all in the same frame without any of them interfering.\n\nIn Blender the three-layer hierarchy is: Action → NLA Strip → NLA Track. An Action stores the F-curves (keyframe data). An NLA Strip plays that action between two timeline positions and at a given weight. An NLA Track is a lane in the NLA editor that holds one or more strips.\n\nThe Blender glTF exporter with export_nla_strips=True writes each NLA strip as a separate glTF Animation, using the strip name as the animation name. The strip name is therefore the value you'll use in Three.js: AnimationClip.findByName( gltf.animations, 'blink_L' ).\n\nWhen export_nla_strips is False (the default), the exporter merges all action data into a single animation, or exports only the active action. Neither is useful for per-expression VRM blending.",
      },
      {
        title: "Animation data on the Key object, not the mesh object",
        body: "Every Blender object that can be animated has an animation_data property. The trap: there are two relevant animation_data objects in play when animating shape keys, and they animate different things.\n\nbpy.data.objects['face_nla_vrm'].animation_data — this drives the object's own properties: location, rotation, scale, custom properties on the object. F-curves here with data_path='location' or 'rotation_euler' will keyframe the object moving through space.\n\nbpy.data.objects['face_nla_vrm'].data.shape_keys.animation_data — this is the animation_data of the Key object (the bpy.types.Key that stores the shape key values). F-curves here with data_path='key_blocks[\"Fcl_EYE_Close_L\"].value' keyframe the shape key sliders.\n\nYou must call shape_keys.animation_data_create() before any of this works. A freshly created Key has animation_data = None. Calling .animation_data_create() returns the new AnimData object and sets it in place.\n\nIn the blueprint, the NLA tracks are added to shape_keys.animation_data.nla_tracks, and the export sees them there. If you accidentally set obj.animation_data.nla_tracks, the shape key strips are invisible to the morph target export pipeline.",
      },
      {
        title: "Create per-expression Actions with F-curves",
        body: "bpy.data.actions.new(name) creates a bare Action and registers it in bpy.data.actions. It is not yet linked to anything — that happens when you assign it to animation_data.action or when you create an NLA strip from it.\n\naction.fcurves.new(data_path, index=0) creates an F-curve targeting the given data path. The data_path is a Python-like path string relative to the object that owns the AnimData. For shape keys on the Key object: 'key_blocks[\"Fcl_EYE_Close_L\"].value'. The quotes inside the brackets must match exactly — Blender parses this string at runtime to resolve the property. A typo in the key name produces a curve that drives nothing, again silently.\n\nfc.keyframe_points.add(count) pre-allocates N keyframe point slots. The slots are uninitialised — set .co and .interpolation before calling fc.update(). The .co is a (frame, value) Vector2: pts[0].co = (0.0, 0.0), pts[1].co = (10.0, 1.0), pts[2].co = (20.0, 0.0) for a 20-frame in-out arc.\n\nfc.update() is mandatory. It rebuilds the internal keyframe index that Blender uses for playback and export evaluation. Skipping it leaves the curve in a partially-constructed state — it may appear correct in the UI but produce wrong values when evaluated by the exporter.",
      },
      {
        title: "Push Actions to NLA strips",
        body: "shape_keys.animation_data.nla_tracks.new() creates a new NLA track at the top of the track stack and returns it. Set track.name to the expression name — this name appears in the NLA editor UI but does NOT become the glTF animation name.\n\ntrack.strips.new(name, start_frame, action) creates a strip that plays 'action' starting at 'start_frame'. The 'name' parameter becomes the glTF animation name when exported with export_nla_strips=True. So this is the name you want to match in Three.js: track.strips.new('blink_L', 1, action).\n\nIn the blueprint all strips start at frame 1 (the parallel layout). This is correct for the exported GLB — Three.js treats each animation as starting at its own time=0.0 regardless of what frame the NLA strip starts at in Blender. The start_frame in NLA space only affects the Blender viewport playback, not the exported glTF sample times.\n\nAfter building all strips, set shape_keys.animation_data.action = None. An active action (the one shown in the Action Editor) overrides the NLA evaluation for that ID. If you leave one set, the exporter may include it as a duplicate or the NLA strips may read the active action's values at frame 0 instead of the strip's evaluated values. Clearing it forces the exporter to read exclusively from the NLA.",
      },
      {
        title: "Export with export_nla_strips=True — what the GLB contains",
        body: "The bpy.ops.export_scene.gltf() call adds export_animations=True and export_nla_strips=True alongside the morph target flags from the shape-keys tutorial.\n\nThe resulting GLB's JSON chunk contains an 'animations' array with one entry per NLA strip. Each entry has a 'name' field matching the strip name, a 'samplers' array of time-value pairs, and a 'channels' array binding each sampler to a morph target weight via the accessor path '/weights'.\n\nVerify in gltf-viewer.donmccurdy.com: drag the GLB in, open the Animations panel on the right, and confirm five entries: blink_L, blink_R, happy, angry, aa. Click Play on each individually. The face should deform matching the shape keys from the shape-keys tutorial. If you see only one animation or an animation named 'face_nla_vrm', the export_nla_strips flag was not applied — re-export.\n\nexport_apply=False remains non-negotiable. A mesh with shape keys cannot have modifiers applied (the resulting mesh would have a different vertex count than the stored key data). The exporter will error or silently drop the keys if export_apply=True is set.",
      },
      {
        title: "Load and blend named clips in Three.js",
        body: "The AnimationMixer pattern for a VRM face loaded from this GLB:\n\n  const mixer = new THREE.AnimationMixer( gltf.scene );\n  const clips  = gltf.animations;  // [{ name: 'blink_L' }, ...]\n\n  const blink  = THREE.AnimationClip.findByName( clips, 'blink_L' );\n  const happy  = THREE.AnimationClip.findByName( clips, 'happy'   );\n\n  const blinkAction = mixer.clipAction( blink ).play();\n  const happyAction = mixer.clipAction( happy ).play();\n  // Both run simultaneously at full weight.\n\n  // Drive by face tracking:\n  blinkAction.setEffectiveWeight( blinkScore );  // 0.0 – 1.0\n  happyAction.setEffectiveWeight( emotionScore );\n\nThe mixer evaluates all active actions and sums their weight-scaled morph target influences each frame. Because glTF animations write the full morph weight curve (0 → 1 → 0 over 20 frames at 24 fps), you can either play the clip once (action.setLoop(THREE.LoopOnce)) or continuously override the weight each frame via setEffectiveWeight without playing the clip at all — treating the animation purely as a keyframe lookup table.",
      },
    ],
    finalResult:
      "A GLB containing the VRM face proxy with five independently-named glTF Animation clips (blink_L, blink_R, happy, angry, aa) alongside the five morph targets from the shape-keys tutorial. Each clip can be played, stopped, or weight-blended independently by a Three.js AnimationMixer or any VRM 1.0-compliant runtime — enabling real-time simultaneous expression blending from face tracking, speech phoneme classifiers, or keyframe data.",
    variations: [
      "Add clip duration variation: the blink clips run 10 frames (a fast mechanical blink), happy and angry run 30 frames (a slow emotional transition), and aa runs 6 frames (a tight phoneme snap). Set CLIP_FRAMES per-expression rather than as a global constant; adjust strip.frame_end and action_frame_end accordingly.",
      "Layer bone animations in the same GLB: the armature tutorial's four-bone rig can be added to this scene and its walk cycle pushed to an NLA track on obj.animation_data (the object's AnimData, not the Key's). The GLB exporter will collect both the shape key strips (from shape_keys.animation_data.nla_tracks) and the bone strips (from obj.animation_data.nla_tracks) into the same animations array.",
      "Use a driver to link a shape key to a bone rotation: add a Blender Driver on the Fcl_MTH_A value, pointing to a jaw bone's X rotation. This creates an implicit 'jaw open' animation that follows the bone automatically. The driver exports as an additional sampler in the aa animation — the jaw bone rotation and the morph target weight animate in sync without separate scripting in Three.js.",
    ],
    troubleshooting: [
      {
        symptom: "GLB shows morph targets but no animations in gltf-viewer",
        cause: "export_nla_strips=False (the default), or export_animations=False was set in the export call.",
        fix: "Add export_animations=True and export_nla_strips=True to the bpy.ops.export_scene.gltf() call. Re-export and check the gltf-viewer Animations panel.",
      },
      {
        symptom: "gltf-viewer shows one animation named 'face_nla_vrm' instead of five clips",
        cause: "shape_keys.animation_data.action was not cleared before export. The active action overrides the NLA and the exporter exports it as a single merged clip.",
        fix: "Set shape_keys.animation_data.action = None before the export call. All animation data should then come exclusively from the NLA strips.",
      },
      {
        symptom: "F-curve exists in bpy.data.actions but the shape key does not animate during export",
        cause: "fc.update() was not called after setting keyframe_points.co values, leaving the curve's internal index invalid.",
        fix: "Call fc.update() after setting all keyframe_points values. This is required any time you build or modify keyframe_points via the Python API — the exporter reads the evaluated curve, not the raw point list.",
      },
      {
        symptom: "Only the shape key for the last expression in the loop animates; earlier ones are static",
        cause: "shape_keys.animation_data.action was set to each new action in sequence inside the loop, with the final assignment overwriting all previous ones. The NLA strips reference the correct actions but the active action lock prevents evaluation.",
        fix: "Never assign animation_data.action inside the loop. Create all Actions, push all NLA strips, then clear animation_data.action = None once at the end. The make_action() helper in the blueprint does not touch animation_data.action at all — it builds the action purely via bpy.data.actions.new and fcurves.new.",
      },
    ],
  },
  base,
);

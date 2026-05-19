import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function MixamoRigBody() {
  return (
    <>
      <p>
        Adobe&rsquo;s Mixamo is a free online auto-rigger and animation
        library &mdash; you upload an FBX humanoid, pick from a few
        thousand pre-built animations, download the rigged + animated
        FBX. The catch is that the rig that comes back is a bare bone
        chain with no IK, no control shapes, nothing you&rsquo;d
        actually want to pose by hand. The Mixamo Rig extension is the
        bridge: import the Mixamo FBX, run one operator, get a full
        IK-equipped control rig with foot rolls, hand controls, hip /
        chest space switching, ready to retarget into.
      </p>

      <p>
        The studio uses it for the cast of side-characters in the
        WebXR Game Framework where authoring full bespoke rigs is
        overkill but you still need posability. The goal of this
        tutorial: take a Mixamo FBX, run the Mixamo Rig add-on, pose
        the character in 30 seconds, export back to glTF for the
        framework.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-addon-mixamo-rig",
  title: "Mixamo Rig — turn a Mixamo skeleton into a posable IK rig",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Thirty minutes. Import a Mixamo FBX, run the Mixamo Rig extension's one-click rig generation, pose the character with proper IK + foot rolls, export back to glTF for the WebXR Game Framework.",
  Body: MixamoRigBody,
  related: [
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "Where the rigged character ends up on the website.",
    },
    {
      href: "/tutorials/blender-addon-vrm-format",
      label: "Tutorial — VRM format add-on",
      note: "The avatar-specific cousin to this workflow.",
    },
  ],
  furtherReading: [
    {
      href: "https://extensions.blender.org/add-ons/mixamo-rig/",
      label: "Mixamo Rig — extensions.blender.org",
      note: "Official extension listing.",
    },
    {
      href: "https://www.mixamo.com/",
      label: "Mixamo — Adobe",
      note: "The auto-rigger + animation library this extension consumes.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "30 minutes",
    difficulty: "intermediate",
    cost: "free — Mixamo is free with an Adobe account",
    prerequisites: [
      "Blender 4.2+ (the extension declares 5.5.999 maximum, so this works on 5.1).",
      "Mixamo Rig extension installed via Get Extensions.",
      "An Adobe ID to use Mixamo. The site is free, the account is one-click.",
      "An FBX humanoid model to upload — or use one of Mixamo's pre-rigged characters as a starting point.",
    ],
    supplies: {
      tools: [
        {
          name: "A character FBX (or a Mixamo pre-rigged character)",
          note: "Any humanoid FBX with reasonable proportions. Mixamo prefers T-pose at upload.",
        },
      ],
    },
    software: [
      {
        name: "Blender",
        version: "4.2+ (5.1 on the studio bench)",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
      {
        name: "Mixamo Rig (Blender extension)",
        version: "1.1.9+",
        url: "https://extensions.blender.org/add-ons/mixamo-rig/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
      {
        name: "Mixamo (web)",
        url: "https://www.mixamo.com/",
        cost: "free — requires an Adobe account",
        platforms: ["web"],
      },
    ],
    steps: [
      {
        title: "Get a Mixamo FBX",
        body: "Go to mixamo.com, sign in. Either upload your own FBX (drag-and-drop, follow the auto-rigger's joint-placement wizard) or pick a Mixamo character from the catalogue.\n\nIn the Animations tab, pick an animation that matches what you'll pose — Mixamo bundles the rig + the animation in the same FBX, so this is just to get the skeleton in motion. 'T-Pose' is the cleanest starting point.\n\nDownload as FBX, format 'FBX for Unity (.fbx)', skin = 'With Skin', frames per second = 30.",
      },
      {
        title: "Import the FBX into Blender",
        body: "File > Import > FBX. Select the Mixamo file. Blender imports the mesh + a bare-bones skeleton with Mixamo's bone names (mixamorig:Hips, mixamorig:Spine, mixamorig:LeftFoot, etc.).\n\nThe character appears at scale 0.01 — Mixamo uses centimetres internally and Blender treats the FBX scale literally. Select the armature + meshes, Object > Apply > All Transforms to normalise.",
      },
      {
        title: "Run the Mixamo Rig generator",
        body: "Select the imported armature. The Mixamo Rig panel appears in View3D > Sidebar (N) > Mixamo Rig.\n\nClick 'Generate Rig'. The add-on inspects the Mixamo bone naming, builds IK chains for the arms and legs, adds foot-roll setups, adds pole targets for the elbows and knees, adds control shapes (the colourful Bezier curves) for every controllable bone.\n\nWhat you have now is a Mixamo-bone skeleton wrapped in a Blender-friendly control rig. The original Mixamo bones are the deformers; the new control bones drive them via constraints.",
      },
      {
        title: "Pose the character",
        body: "Switch to Pose Mode. Select the foot control — large blue square at the foot — and translate it. The leg IK chain follows; the foot stays planted.\n\nSelect the hand control, translate. The arm IK chain follows. Pose the head, the spine, the hips with their respective controls. The whole rig responds the way a film rig responds — IK where you want it, FK where you want it.\n\nFor a 30-second pose, key the controls (I > Whole Character at frame 1, modify, key again at frame 30). Animation is now bipedal-rig animation, not bone-by-bone.",
      },
      {
        title: "Bake before export",
        body: "glTF doesn't understand control rigs — it only understands deformer-bone animation. Pose > Bake Action, set Visual Keying = on, Clear Constraints = off (we want the bake to capture the result of the IK, not delete the rig), Only Deformer Bones = on.\n\nThe deformer bones now carry the animation directly; the control rig still exists but is unnecessary for export.",
      },
      {
        title: "Export to glTF",
        body: "File > Export > glTF 2.0 (.glb/.gltf). Format = .glb (single file binary), Include = Selected Objects + Custom Properties, Transform = +Y Up, Animation = Use Current Frame > unchecked, all animations included.\n\nThe .glb is now ready for the WebXR Game Framework — it goes into public/models/<scene>/<character>.glb and registers in the scene catalogue like any other glTF asset.",
      },
    ],
    finalResult:
      "A Mixamo character with a proper IK control rig in Blender, posed and animated through the IK controls rather than bone-by-bone, baked to deformer-only for glTF export, dropped into the WebXR Game Framework as a fully animated character asset. Saves the hours of manual rigging the framework would otherwise need per side-character.",
    variations: [
      "Re-target multiple Mixamo animations onto the same rig — download walk, run, idle FBX files separately, copy the action data, combine into a single NLA strip stack before export.",
      "Use the rig for VRM authoring — pose the character, then export via the VRM add-on instead of glTF.",
      "Layer additive animations (a head turn on top of a walk cycle) using Blender's NLA editor — both bake out into a single glTF animation track.",
    ],
    troubleshooting: [
      {
        symptom: "Generate Rig button greyed out",
        cause: "Selected object isn't an armature, or armature bone names don't match Mixamo's mixamorig:* convention.",
        fix: "Confirm the armature is selected (not a child mesh) and that bones are named with the mixamorig: prefix. If they aren't, the FBX wasn't a Mixamo export — re-download from Mixamo.",
      },
      {
        symptom: "IK foot doesn't plant — heel slides during translation",
        cause: "Pole target isn't pointing forward; the knee tries to bend backwards.",
        fix: "Select the knee pole target (small triangle in front of the knee), move it further out in front of the character. The IK solver now knows which way the knee should bend.",
      },
      {
        symptom: "After bake-and-export, the glTF animates the wrong bones",
        cause: "'Only Deformer Bones' wasn't ticked during the bake — the control rig animations were keyed onto the export.",
        fix: "Undo the bake, re-bake with 'Only Deformer Bones' on. The export now carries deformer animation only, which is what glTF understands.",
      },
    ],
  },
  base,
);

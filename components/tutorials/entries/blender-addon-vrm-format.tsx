import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function VrmBody() {
  return (
    <>
      <p>
        VRM is the file format the studio leans on for every avatar
        that walks into a WebXR scene. It is glTF 2.0 with a humanoid-rig
        appendix bolted on the side: the bones are named to a
        standard, the spring-bones are declared in metadata, the
        morph targets are tagged for expressions. The studio uses it
        because every consumer-grade avatar pipeline &mdash; VRoid
        Studio, ReadyPlayerMe-VRM exports, the Aura nanny.vrm itself
        &mdash; speaks it natively, and the runtime three-vrm loader
        handles the spring physics for free.
      </p>

      <p>
        The official VRM add-on for Blender is the cleanest way to
        import a .vrm, fix something about it, and export it again
        without losing the metadata that makes it a VRM rather than a
        plain glTF. This tutorial walks the loop: import nanny.vrm,
        adjust a spring-bone setting, fix the classic floor-glitch
        that bites every VRM in three.js, and export it back out. An
        evening at the bench.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-addon-vrm-format",
  title: "VRM format add-on — round-trip a .vrm through Blender",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "An evening loop. Import a .vrm avatar into Blender with the official VRM add-on, fix the floor-glitch that plagues VRMs in three.js, adjust a spring-bone, and export back out without losing the humanoid metadata that makes it a VRM.",
  Body: VrmBody,
  related: [
    {
      href: "/articles/cohesive-low-poly-cell-shaded-vrm-worlds",
      label: "Article — Cohesive low-poly cell-shaded VRM worlds",
      note: "The wider art direction the VRM pipeline serves.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "The sibling pipeline for non-VRM glTF assets.",
    },
  ],
  furtherReading: [
    {
      href: "https://vrm-addon-for-blender.info",
      label: "VRM Add-on for Blender — official site",
      note: "Author documentation, format spec, troubleshooting.",
    },
    {
      href: "https://vrm.dev/en/",
      label: "VRM Consortium — vrm.dev",
      note: "The spec itself; useful when you need to know what a metadata field actually means.",
    },
    {
      href: "https://github.com/pixiv/three-vrm",
      label: "three-vrm on GitHub",
      note: "The runtime loader the studio uses for VRMs in the browser.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "an evening — 2 to 3 hours",
    difficulty: "intermediate",
    cost: "free — the add-on is MIT / GPL",
    prerequisites: [
      "Blender 4.2+ with the VRM format extension installed (extensions.blender.org).",
      "A .vrm file to test with — nanny.vrm from the studio's VRM pool, or any free VRoid Studio sample.",
      "Comfortable with armatures and pose mode. The metadata side is the new bit, but the bone manipulation is standard Blender.",
    ],
    supplies: {
      tools: [
        {
          name: "A .vrm to round-trip",
          note: "Start with a known-good one. nanny.vrm from the studio pool is documented; VRoid Studio's sample avatars are also clean references.",
          suppliers: [
            {
              name: "VRoid Hub — free avatars",
              url: "https://hub.vroid.com/en/",
              price: "free (per-creator licence)",
            },
          ],
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
        name: "VRM format (Blender extension)",
        version: "3.26.3+",
        url: "https://extensions.blender.org/add-ons/vrm/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Install via Edit > Preferences > Get Extensions, search 'VRM'.",
      },
    ],
    steps: [
      {
        title: "Import the .vrm",
        body: "File > Import > VRM (.vrm). Pick your file. The add-on parses the glTF, reconstructs the armature with VRM-standard bone names (Hips, Spine, UpperArm.L, Hand.R, etc.), and rebuilds the spring-bone setup from the metadata appendix.\n\nThe avatar lands at world origin. The armature is named with the VRM humanoid mapping intact — you can verify by selecting any bone and reading its name in the properties panel.",
      },
      {
        title: "Read the VRM metadata",
        body: "Open the Object Data Properties (the armature data tab). Scroll to the VRM 0.x / VRM 1.0 panel. The add-on surfaces the metadata: title, author, allowed user, commercial use, sexual use, violence flag, licence URL.\n\nThis is where you confirm what the avatar is licensed for before doing anything else. The studio rule: do not modify and re-distribute an avatar whose licence forbids it.",
      },
      {
        title: "Fix the floor-glitch",
        body: "VRMs exported by some authoring tools place the armature's root at the head, not at the feet. In three.js this produces an avatar that sinks halfway into the floor — the studio's recurring floor-glitch bug.\n\nThe fix in Blender: select the armature in Object Mode, set its origin to the lowest point ('Object > Set Origin > Origin to 3D Cursor' after snapping the cursor to the toe vertex), then clear the parent of any meshes to keep the offset. Re-parent meshes to the armature with Object > Parent > Armature Deform. The avatar now sits with feet on the floor in three.js.",
      },
      {
        title: "Adjust a spring-bone",
        body: "The VRM panel exposes the spring-bone groups — usually hair, skirt, scarves. Pick a hair strand group, tweak the 'stiffness' (0.0 floppy, 1.0 rigid) and the 'drag force' (0.0 endless oscillation, 1.0 critically damped).\n\nGood starting points: 0.4 stiffness, 0.6 drag for shoulder-length hair; 0.2 / 0.4 for long hair you want to swing; 0.8 / 0.8 for braids or anything that should feel weighty.\n\nThe in-Blender preview won't simulate physics; you'll only see it move once the .vrm is re-exported and loaded by three-vrm at runtime.",
      },
      {
        title: "Verify in Pose mode",
        body: "Switch to Pose mode and rotate Spine, UpperArm, and Hand bones in turn. Confirm the mesh deforms cleanly without finger-cracking or shoulder-collapse. Spot anything ugly, fix the weights in Weight Paint mode before exporting.\n\nUndo your test poses before exporting — you want the export to capture the rest pose, not your rotated arms.",
      },
      {
        title: "Export as .vrm",
        body: "File > Export > VRM (.vrm). The add-on writes the glTF + the humanoid + spring-bone + metadata appendix back into a single binary.\n\nOpen the new .vrm in any VRM viewer — vrm-viewer.glitch.me works in a browser — to confirm the round-trip preserved the metadata, the bone names, and the spring physics. If it loads, lights, and the hair swings on a head-nod, the round-trip succeeded.",
      },
    ],
    finalResult:
      "A round-tripped .vrm with the floor-glitch corrected and a spring-bone tuned. Loads cleanly into three-vrm at runtime, sits with feet on the ground rather than mid-shin, hair swings to the rhythm you authored. The pattern for every avatar adjustment the studio makes.",
    variations: [
      "Convert a glTF rigged avatar into VRM by importing as glTF, then mapping bones to the VRM humanoid in the add-on's panel before exporting.",
      "Bake a custom expression — Edit > Shape Keys > new key, sculpt the face, then assign it to a VRM blendshape preset like 'Happy' or 'Sorrow'.",
      "Reduce poly count with the Decimate modifier before re-export; the runtime cost drops linearly with vertex count and most VRMs ship with more polys than the framework needs.",
    ],
    troubleshooting: [
      {
        symptom: "Avatar imports with the head facing the floor",
        cause: "VRM 1.0 vs VRM 0.x axis-convention mismatch; the add-on is detecting the wrong version.",
        fix: "Use the VRM 0.x / VRM 1.0 toggle in the import dialog explicitly, or re-export the avatar from its source authoring tool to the version Blender expects.",
      },
      {
        symptom: "Spring-bone parameters edit fine in Blender but never take effect in three-vrm",
        cause: "The export step did not include the spring-bone extension.",
        fix: "Re-export with 'Include Spring Bone Extension' ticked. The add-on defaults to off if it detects the spring-bone data was synthesised from a non-VRM source.",
      },
      {
        symptom: "Hair clips through shoulders at high stiffness",
        cause: "Spring bones don't collide with the skin mesh by default.",
        fix: "Add collider spheres to the chest / shoulder bones via the VRM panel's 'Collider Group' section, then re-export. Hair now bounces off the collider mesh instead of intersecting it.",
      },
    ],
  },
  base,
);

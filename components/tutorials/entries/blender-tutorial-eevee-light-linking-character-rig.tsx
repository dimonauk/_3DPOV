import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function EeveeLightLinkingCharacterRigBody() {
  return (
    <>
      <p>
        Every light in EEVEE-Next illuminates every object by default.  That
        sentence sounds obvious until you are lighting a portrait and the rim
        spot you positioned to wrap the character&apos;s silhouette also blasts
        the backdrop directly behind them — turning a carefully neutral grey
        cyclorama into a blown-out oval of white that destroys the sense of
        depth you were building.  The traditional fix was separate render
        layers composited in post, a pipeline with meaningful overhead.  Light
        Linking, introduced in Blender 4.0 with EEVEE Next and extended through
        5.x, makes it a property on the light object itself.
      </p>

      <p>
        The mechanism is a Collection.  Each light can be assigned a{" "}
        <strong>Receiver Collection</strong>: only objects inside that
        collection receive illumination from the light.  A companion property,{" "}
        <strong>Shadow Linking</strong>, takes a separate{" "}
        <strong>Blocker Collection</strong> that controls which objects can
        cast shadows for that specific light.  The two collections are
        independent — a character can receive the key light AND block a shadow
        on the floor, while the backdrop receives neither.  These assignments
        are evaluated per-light at render time; they carry no overhead outside
        the lights that use them, and they compose correctly when multiple
        linked lights overlap on the same surface.
      </p>

      <p>
        This tutorial builds a three-light hero rig around a low-poly character
        figure on a studio floor with a gradient cyclorama backdrop.  The{" "}
        <strong>key</strong> (warm area, left-high) illuminates the character
        and floor, casting hard character shadow downward.  The{" "}
        <strong>fill</strong> (cool area, right-low) illuminates everything —
        it is deliberately unlinked because its job is a soft ambient wrap that
        should reach all surfaces.  The <strong>rim</strong> (white spot,
        back-high) is linked to the character collection only, so its bright
        halo traces the silhouette edge without any backdrop spill.  Compare
        the control this gives with the environment baking approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-irradiance-sphere-probe"
          className={lk}
        >
          EEVEE Next Irradiance Volume tutorial
        </Link>
        {" "}— baking encodes accumulated indirect light into a cache, while
        light linking controls which primary-illumination contributions reach
        which surfaces entirely at evaluation time.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-volumetric-light-cone"
          className={lk}
        >
          volumetric light cone tutorial
        </Link>{" "}
        uses a similar spatial-restriction intuition but via mesh geometry
        rather than collection membership; light linking is strictly more
        precise because it operates on object identity rather than spatial
        overlap.
      </p>

      <p>
        The Python API places both linking properties on the <em>light
        object</em> (not on <code>bpy.data.lights</code>, the light data block):
        <code>light_obj.light_linking.receiver_collection</code> and{" "}
        <code>light_obj.shadow_linking.blocker_collection</code>.  The
        collection must be linked to the scene collection tree before
        assignment, or EEVEE cannot traverse it.  When{" "}
        <code>receiver_collection</code> is <code>None</code> the light
        behaves as if all objects are included — which is the default for any
        newly added light.  For WebXR export, light linking is render-only and
        does not survive GLB export; the equivalent in Three.js is{" "}
        <code>Object3D.layers</code> combined with{" "}
        <code>Light.layers</code>, which the{" "}
        <Link href="/atelier" className={lk}>
          Atelier spatial viewer
        </Link>{" "}
        uses for its multi-layer illumination.  See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-hair-bsdf-vrm"
          className={lk}
        >
          Principled Hair BSDF VRM tutorial
        </Link>{" "}
        for the full character asset that this lighting rig was designed to
        showcase — hair BSDFs respond dramatically to rim separation because
        the TRT lobe (transmit-reflect-transmit back scatter) fires precisely
        at the silhouette edge where the rim wraps.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-eevee-light-linking-character-rig",
  title: "EEVEE-Next Light Linking + Shadow Linking — Three-Light Character Hero Rig",
  date: "2026-06-12",
  kind: "tutorial",
  excerpt:
    "EEVEE-Next per-light receiver and blocker collections: rim spot constrained to character only, key shadow limited to character blocker, fill unlinked for full-scene wrap. bpy API on light objects, collection tree requirements, Three.js layer-mask equivalent for WebXR. Blender 5.1.",
  Body: EeveeLightLinkingCharacterRigBody,
};

export const entry = buildInstructable(
  {
    time: "45 minutes",
    difficulty: "intermediate",
    cost: "free — Blender 5.1 (EEVEE-Next), no add-ons",
    supplies: {
      materials: [
        "Blender 5.1 with EEVEE-Next renderer",
        "blueprint.py from public/library/blends/lighting/eevee-light-linking-character-rig/",
      ],
      tools: [
        "3D Viewport › Rendered shading mode",
        "Properties › Object Properties › Light Linking panel",
        "Scripting workspace (Python console)",
        "Outliner (to inspect collection membership)",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py and switch to Rendered mode",
        content: `Open Blender 5.1.  Go to the Scripting workspace, open blueprint.py,
and click Run Script.  The script creates a studio scene: a low-poly four-part
character figure (head + torso + two arm cylinders) on a grey floor plane with
a gradient cyclorama backdrop, plus the three lights and the camera.

Switch the 3D Viewport to Rendered mode: Z key → Rendered, or click the
sphere icon in the viewport header shading selector.

Look at the backdrop: it should appear in subdued tones — lit only by the
fill light.  The character has a warm key contribution from the left, a cool
fill from the right, and a bright rim halo wrapping the right edge of the
torso and head.  The backdrop does NOT show the rim flare.

If the backdrop looks equally bright under the rim spot, EEVEE may have
lost the receiver collection reference.  Select light_rim, open Properties →
Object Properties → Light Linking → confirm col_rim_recv is shown.`,
      },
      {
        title: "Verify light linking in Object Properties",
        content: `Select the rim light object (click it in the viewport or find
light_rim in the Outliner).

In the Properties editor, open Object Properties (the orange square icon).
Scroll to the Light Linking section.  You will see two sub-sections:

  Light Linking: Receiver → col_rim_recv
  Shadow Linking: Blocker  → (empty — Use Shadow is disabled on this light)

Select light_key.  You will see:
  Light Linking: Receiver → col_key_recv (contains char_head, char_torso,
                                          char_arm_l, char_arm_r, env_floor)
  Shadow Linking: Blocker  → col_key_blk  (contains character parts only)

Select light_fill.  Both sections are empty → all objects.

This is the design intent: rim = silhouette only, key = character + floor with
character-only shadow, fill = everything (broad ambient wrap).`,
      },
      {
        title: "Break and restore a link to see the difference",
        content: `With light_rim selected, in Object Properties → Light Linking →
Receiver Collection, click the X button to clear col_rim_recv.

The rim light now illuminates everything.  Watch the backdrop: a hot oval
appears directly behind the character.  The sense of depth collapses —
character and backdrop appear equidistant.

Click the collection picker icon and select col_rim_recv to restore it.  The
backdrop drops dark again and the silhouette halo reappears.

This before/after is the core lesson: light linking separates a single render
pass into what would previously require compositing multiple layers.

Optional: temporarily add env_backdrop to col_rim_recv by opening the
collection in the Outliner and dragging env_backdrop into it.  The backdrop
immediately catches the rim.  Remove env_backdrop to restore.`,
      },
      {
        title: "Explore shadow linking on the key light",
        content: `Select light_key.  In Properties → Object Properties → Shadow Linking →
Blocker Collection: currently col_key_blk contains only the character parts.

What this means: only the character casts a shadow under the key light.
The floor (env_floor) is in the receiver collection (it is lit by the key),
but it is not in the blocker collection (it does not block the key's shadow
rays).  A flat floor casting a shadow onto itself would be invisible anyway, but
in a more complex scene — a pillar on the floor, a prop near the character —
you might want to exclude specific objects from blocking to prevent unwanted
shadow shapes.

Add env_backdrop to col_key_blk in the Outliner.  The backdrop is nearly
perpendicular to the floor so its shadow is a thin crescent near the back.
Even that subtle mark is usually undesirable for a clean portrait.  Remove
env_backdrop from col_key_blk.

Rule of thumb: blocker collections should contain only objects whose shadow
serves a narrative purpose at that light angle.  Everything else is noise.`,
      },
      {
        title: "Inspect and modify via the Python console",
        content: `Open the Python console (Scripting workspace › Python Console tab, or
change one area's editor type to Python Console).

Print the current receiver collection for the rim:
  bpy.data.objects['light_rim'].light_linking.receiver_collection
  # → bpy.data.collections['col_rim_recv']

Print the blocker collection for the key:
  bpy.data.objects['light_key'].shadow_linking.blocker_collection
  # → bpy.data.collections['col_key_blk']

List objects in the rim receiver:
  list(bpy.data.collections['col_rim_recv'].objects)
  # → [Object("char_head"), Object("char_torso"), ...]

Add the floor to the rim receiver and observe the viewport:
  bpy.data.collections['col_rim_recv'].objects.link(bpy.data.objects['env_floor'])
  # Floor now catches the rim spot — visible in Rendered mode immediately.

Remove it:
  bpy.data.collections['col_rim_recv'].objects.unlink(bpy.data.objects['env_floor'])

The EEVEE-Next renderer responds to collection changes in real-time.
No bake or cache clear is needed — light linking is evaluated per frame.`,
      },
      {
        title: "WebXR layer-mask equivalent in Three.js",
        content: `Light Linking is an EEVEE render-time property.  glTF 2.0 has no
concept of receiver collections — the GLB exporter silently discards the
light_linking and shadow_linking assignments.  In a Three.js WebXR scene the
equivalent mechanism is Object3D.layers (a bitmask of 32 channels).

Workflow:
  1. Export the scene as GLB (File → Export → glTF 2.0, export lights enabled).
  2. In your Three.js loader callback:

     // Rim light — character only
     rimLight.layers.set(0);    // disable layer 0 (all)
     rimLight.layers.enable(1); // enable layer 1 (character channel)

     characterParts.forEach(mesh => {
       mesh.layers.enable(1);   // character also on layer 1
     });

     // Fill and key — default layer 0 (all objects)
     // No change needed; fill illuminates everything by default.

  3. Set the renderer to evaluate all layers: renderer.layers.enableAll().
  4. The rim light now only illuminates meshes on layer 1.

This is the pattern used in the Atelier spatial viewer for multi-subject
studio shots where rim lights per figure must not interfere with adjacent
figures or the background plane.`,
      },
    ],
    finalResult:
      "A Blender 5.1 studio portrait scene with a three-light hero rig: warm key casting a clean character shadow onto the floor, cool fill wrapping the full scene softly, and a white rim spot constrained to the character silhouette only via light linking. Shadow linking keeps the key's blocker collection character-only. Python API demonstrated live. Three.js layer-mask equivalent documented for WebXR export.",
    variations: [
      "Per-character multi-figure rig: for a scene with two characters, create col_char_a and col_char_b. Give each character their own rim light linked to their collection. The key and fill can remain global. Now each figure has an individual rim halo with no cross-character spill — critical when the characters are at different depths and a shared rim would make the nearer figure appear closer-lit than the further.",
      "Shadow-only light: set a fill light's energy to near-zero (0.1 W) and its shadow_linking.blocker_collection to a single object. This gives you a freestanding shadow caster that contributes almost no illumination — useful for casting a soft 'ground contact shadow' under a character independently of all scene lights, without the characteristic double-shadow artefact that appears when a real fill also casts.",
      "Linked emission planes: create a flat plane with an Emission shader behind the character as a pseudo-area light replacement for HDRI. Link it to nothing (no light linking). Then add a real Area light with light_linking.receiver_collection = character collection. The emission plane provides consistent background illumination while the linked area light gives the character specular highlights the emission plane cannot. This is the Holoflow standard for studio WebXR scene assembly where HDRIs are replaced by geometry for export.",
    ],
    troubleshooting: [
      {
        symptom:
          "Light Linking section does not appear in Object Properties for the selected light",
        cause:
          "The active render engine is not EEVEE-Next. The Light Linking panel only appears when Properties → Render → Render Engine is set to EEVEE. Cycles and Workbench do not support light linking.",
        fix: "Open Properties → Render (camera icon). Set Render Engine to EEVEE. The Light Linking section will appear immediately in Object Properties for all light objects. Note: Cycles has a separate per-object visibility system under Object Properties → Visibility → Ray Visibility, but it is not equivalent — it controls global ray type visibility rather than per-light receiver linking.",
      },
      {
        symptom:
          "After assigning a receiver collection the light still illuminates all objects",
        cause:
          "The collection assigned to receiver_collection is not linked to the scene collection hierarchy. EEVEE cannot traverse a free-floating collection (one that exists in bpy.data.collections but is not reachable from scene.collection.children). The linking appears to succeed in Python with no error but has no effect.",
        fix: "After creating the collection, call bpy.context.scene.collection.children.link(col) before assigning it to receiver_collection. Verify in the Outliner (header icon = two overlapping circles) that the collection appears in the scene tree. If the collection appears greyed-out or absent, drag it into the scene root in the Outliner.",
      },
      {
        symptom:
          "Light linking works in Rendered mode but disappears in the final render output",
        cause:
          "The receiver collection contains objects from a View Layer collection that is excluded from the active View Layer. EEVEE evaluates light linking against the View Layer, not the master collection. Excluded collections are not evaluated even if the object appears linked.",
        fix: "Open the Outliner in View Layer mode (top-right toggle). Expand the scene tree and confirm the character collection (col_character) has a checkbox ticked, not an X. Click the checkbox to include it. Re-render. Note: objects can be hidden from the viewport (H key) and still be in a linked receiver collection — but if their View Layer collection is excluded, they are omitted from both rendering and light-link evaluation.",
      },
    ],
  },
  base,
);

export { entry };

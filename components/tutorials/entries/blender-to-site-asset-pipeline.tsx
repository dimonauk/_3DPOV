import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";

function BlenderToSiteBody() {
  return (
    <>
      <p>
        Every asset that ends up in one of the studio&rsquo;s WebXR
        scenes started life as something in a Blender viewport. The
        sculpture on the plinth, the wall relief on the back wall, the
        prop the splat-walker stops to look at &mdash; all of them are
        glTF binaries sitting under <code>public/models/</code> and
        loaded by a catalogue file the scene reads at boot. The
        Holoflow WebXR Game Framework expects those assets to follow
        a small set of conventions, and the studio has codified those
        conventions into a Blender add-on so an author can run the
        whole pipeline from one panel on the right-hand side of the
        viewport. This tutorial is the workshop walkthrough.
      </p>

      <p>
        The goal: a single low-poly mesh authored in Blender, exported
        as a <code>.glb</code> with the framework&rsquo;s conventions
        baked in, dropped into <code>public/models/sculpture-gallery/</code>,
        registered in the catalogue, and rendered live at{" "}
        <code>/atelier/sculpture-gallery/&lt;your-mesh&gt;</code> within
        an hour from a cold start. The constraints: Blender 4.0 or
        newer, a local checkout of the Holoflow repo, and at least one
        prior low-poly model under your belt so the modelling step is
        the easy bit. Everything else &mdash; the export settings, the
        Y-up axis flip, the embedded textures, the bounding-box sanity
        check &mdash; is the add-on&rsquo;s job. The Test Chamber
        sheet below has the steps; the prose here is where the bench
        intuition lives.
      </p>

      <p>
        The companion article{" "}
        <Link href="/articles/low-poly-high-facet-shading" className={ext}>
          Low-poly, high-facet shading
        </Link>{" "}
        argues for the visual register the framework leans into; the{" "}
        <Link href="/articles/cohesive-low-poly-cell-shaded-vrm-worlds" className={ext}>
          Cohesive low-poly cell-shaded VRM worlds
        </Link>{" "}
        piece walks through the wider art-direction decisions the
        framework is built on. Read either as background, or push on
        if you already have the mesh and just want it in the browser.
      </p>

      <p>
        A note on the add-on. The studio ships{" "}
        <code>tools/blender-addon/holoflow_webxr_exporter/</code> as
        an opt-in. You can do the entire pipeline by hand from
        Blender&rsquo;s built-in glTF exporter &mdash; the add-on
        doesn&rsquo;t do anything you couldn&rsquo;t do yourself with
        the right boxes ticked &mdash; but it codifies five years of
        the studio&rsquo;s defaults so you don&rsquo;t have to
        remember every one of them. If you skip the add-on, the
        Troubleshooting block at the foot of the sheet has the manual
        settings the add-on would otherwise apply. Either path lands
        the same file.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-to-site-asset-pipeline",
  title:
    "Blender to site — exporting a low-poly mesh into the Holoflow framework",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "An hour, end to end. Model a low-poly mesh in Blender, push it through the studio's WebXR exporter add-on, drop the .glb into public/models/, register it in the scene's catalogue, and watch it render live in the gallery. The hands-on companion to the WebXR Game Framework's authoring conventions.",
  Body: BlenderToSiteBody,
  related: [
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly, high-facet shading",
      note: "The aesthetic case the framework's visual register is built on.",
    },
    {
      href: "/articles/cohesive-low-poly-cell-shaded-vrm-worlds",
      label: "Article — Cohesive low-poly cell-shaded VRM worlds",
      note: "The wider art-direction conversation the framework lives inside.",
    },
    {
      href: "/atelier/sculpture-gallery",
      label: "Atelier — Sculpture gallery (live)",
      note: "Where your finished mesh will end up. Walk through it to confirm.",
    },
    {
      href: "/tutorials/tutorial-dragon-scale-wall-relief",
      label: "Tutorial — Dragon-Scale Wall Relief",
      note: "A sibling Test Chamber tutorial from the bench, fabrication side.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.blender.org/download/releases/4-0/",
      label: "Blender 4.0 release notes",
      note: "The release that brought the modernised glTF exporter and the principled BSDF tidy-up the framework relies on.",
    },
    {
      href: "https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html",
      label: "Khronos glTF 2.0 specification",
      note: "The ground-truth spec for everything the .glb file contains. Read sections 3.4-3.7 when you want to know what the exporter is actually writing.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Sample-Models",
      label: "Khronos glTF Sample Models",
      note: "A library of canonical glTF assets to compare your exports against when something looks wrong in the browser.",
    },
    {
      href: "https://google.github.io/draco/",
      label: "Draco geometry compression — Google",
      note: "What the framework's optional Draco compression pass uses. Lossless for indices, near-lossless for positions; cuts file size by 60-80% on most meshes.",
    },
    {
      href: "https://docs.blender.org/manual/en/4.0/addons/import_export/scene_gltf2.html",
      label: "Blender glTF 2.0 import/export docs",
      note: "Official documentation for the underlying exporter the add-on wraps. Read this if you ever want to step outside the add-on's presets.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "about an hour, end to end — ~15 min modelling, ~5 min export, ~10 min wiring, the rest spent looking at it",
    difficulty: "intermediate",
    cost: "free — Blender is free, the framework is open source, the repo you already have",
    prerequisites: [
      "Blender 4.0 or newer installed and launched at least once.",
      "You've modelled at least one low-poly thing in Blender before — you know Edit mode, you can extrude a face without panicking.",
      "You can find your way around a Next.js codebase — specifically, you can open a .tsx file and add an object to an array without breaking the import line above it.",
      "You've cloned the Holoflow repo locally and have `pnpm dev` working from the root.",
    ],
    supplies: {
      materials: [
        {
          name: "A low-poly mesh",
          note: "Suzanne the monkey works for a first run — she ships with Blender. A faceted icosphere, a hand-modelled cairn, a chunky chair: anything under about 5,000 triangles will fly. The framework's mobile-quest hard-deck is 50k tris per scene, so a single hero piece at 5-10k is the sweet spot.",
        },
        {
          name: "The Holoflow framework checkout",
          note: "The repo you're reading this tutorial inside. Make sure your working tree is on a branch you don't mind committing into.",
        },
      ],
      tools: [
        {
          name: "A code editor",
          note: "VS Code, Cursor, Zed, Neovim — anything that opens a .tsx file. You'll spend two minutes in it to register the model.",
        },
      ],
      provisions: [
        {
          name: "A reference image",
          isOptional: true,
          note: "If you're modelling from a photograph or a sketch, set it as a background image in Blender first. Saves you redoing the proportions later.",
        },
      ],
    },
    software: [
      {
        name: "Blender",
        version: "≥ 4.0",
        url: "https://www.blender.org/download/",
        cost: "free",
        platforms: ["windows", "macos", "linux"],
        note: "The framework's glTF conventions assume the 4.x exporter behaviour. 3.x will mostly work but the auto-smooth angle handling changed.",
      },
      {
        name: "Holoflow WebXR Exporter (Blender add-on)",
        version: "0.1.0",
        url: "https://github.com/holoflow/_3DPOV/tree/main/tools/blender-addon",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Ships in the repo at `tools/blender-addon/holoflow_webxr_exporter/`. Zip the folder and install via Blender's preferences. See `docs/BLENDER-ADDON.md` when it lands for the full reference.",
      },
      {
        name: "VS Code (or any editor)",
        url: "https://code.visualstudio.com/",
        cost: "free",
        platforms: ["windows", "macos", "linux"],
        note: "Only used for the two-line catalogue edit. Any text editor will do.",
      },
    ],
    dependencies: [],
    steps: [
      {
        title: "Open Blender and prepare the mesh",
        body: "Open Blender, delete the default cube, and bring in your mesh — either modelled fresh or imported from disk. With the mesh selected, run Object → Apply → All Transforms. This bakes the object's position, rotation and scale into the mesh data itself so the exporter ships the geometry sitting at the world origin with unit scale.\n\nThis one habit prevents three-quarters of the “why is my model floating ten metres above the floor” problems you'll otherwise meet in the browser. The framework's scene-graph assumes meshes arrive clean.",
      },
      {
        title: "Pick the shading look — flat or smooth",
        body: "Two paths, depending on the aesthetic you want.\n\nFor the high-facet look the studio leans into — every triangle visible as a discrete face, the mesh reading as a hand-cut crystal — select the mesh, right-click in the viewport, Shade Flat. Every face gets its own normal and the silhouette stays crisp.\n\nFor the smooth-curve look — organic forms, characters, anything that should read as continuous surface — Shade Smooth, then in the Object Data Properties (the green triangle icon) enable Auto Smooth and set the angle to about 30°. Faces sharper than that stay faceted; gentler than that get smoothed.\n\nA workshop note: a low-poly mesh shaded smooth without the auto-smooth angle will read as soggy in the browser. A low-poly mesh shaded flat will read as architectural. The framework supports both; the choice is yours and your scene's.",
      },
      {
        title: "Install the Holoflow exporter add-on",
        body: "From a fresh shell, zip the add-on folder: zip `tools/blender-addon/holoflow_webxr_exporter/` into a `holoflow_webxr_exporter.zip` somewhere you can find again.\n\nIn Blender, Edit → Preferences → Add-ons → Install… → pick the zip. Tick the checkbox next to “Holoflow WebXR Game Framework Exporter” to enable it. Close preferences. You'll know it worked when the N-panel on the right of the 3D viewport has a new “Holoflow” tab.\n\nIf the Add-ons list shows the entry but the tab doesn't appear, make sure your Blender is 4.0 or newer — the add-on's `bl_info` pins that minimum and earlier Blenders will silently fail to register the panel.",
      },
      {
        title: "Open the Holoflow N-panel",
        body: "Press N in the 3D viewport to toggle the side panel on if it's not already showing. Click the Holoflow tab on its right edge.\n\nFour sections greet you: Scene preset, Facet mode, Mesh validation, Export. You'll touch them in that order. The panel reads its state from properties stored on the Scene itself, so closing and reopening the file preserves every choice you make here.",
      },
      {
        title: "Pick the right scene preset",
        body: "From the Scene preset dropdown, choose the destination for this asset. Five options ship today:\n\n• Sculpture gallery piece — floor pieces for /atelier/sculpture-gallery, tighter bounds, high-facet aesthetic.\n• Sculpture gallery wall relief — belt-printed wall reliefs, flat depth budget.\n• Splat-walker prop — hero props in the splat walker scenes, full PBR.\n• SceneStage demo prop — generic SceneStage prop, middling budget.\n• Generic glTF — no preset overrides, just canonical defaults.\n\nThe preset drives every downstream choice: the tri-count budget the validator checks against, the texture size cap, whether the flat-normals trick runs on export. For this tutorial pick Sculpture gallery piece.",
      },
      {
        title: "Run the validator",
        body: "Click “Validate for Holoflow”. The add-on walks the active scene and reports back: triangle count vs the preset's hard-deck, material slot count, texture sizes, naming-convention check, and a bounding-box sanity check (the gallery layout function expects pieces to fit inside roughly a 1×1×1 metre box).\n\nFix anything that comes back as a warning before you proceed. Common warnings on a first run: “Mesh exceeds 10k triangles” (decimate or rebuild), “Object name contains a space” (rename), “Mesh is 3.4m on its longest axis” (scale down in Edit mode — not Object mode — so the bake stays at unit scale).\n\nThe validator is opt-in advice, not a hard gate. You can export over its objections. The studio's bench rule is: if you ignore a warning, leave yourself a note in the catalogue's `note` field so the next person knows you did it on purpose.",
      },
      {
        title: "Export to .glb",
        body: "Click “Export to .glb”. The add-on suggests a target path under `public/models/<scene>/<active>.glb` when it can detect the repo root from the .blend file's location — that's the convention the catalogue assumes. Accept the suggestion, or browse to your own path under `public/models/`.\n\nThe exporter ships with the framework's defaults baked in: Y-up axis (glTF's native, not Blender's Z-up), single .glb binary (not .gltf + .bin + textures), embedded textures, Draco compression on (for meshes over 5k triangles — below that the compression header outweighs the savings), and forced flat normals for any object marked with the `holoflow:facet` custom property.\n\nA progress bar runs across the bottom of the Blender window for a few seconds. When it clears, the file is on disk. Cancel if you change your mind — nothing else has been touched.",
      },
      {
        title: "Register the model in the scene's catalogue",
        body: "Open `lib/sculpture-gallery/catalogue.ts` in your editor. The file is a flat array of entries; the gallery layout function maps each entry to a plinth on the floor. Append a new entry with the slug, title, year, modelUrl pointing at the file you just exported, an accent colour, a blurb, and a workshop-Dimona note:\n\n```ts\n{\n  slug: \"your-mesh\",\n  title: \"Your mesh\",\n  year: 2026,\n  modelUrl: \"/models/sculpture-gallery/your-mesh.glb\",\n  accent: \"#f4a8b8\",\n  blurb: \"A short catalogue-mode description. One or two sentences. What the piece is, materially.\",\n  note: \"Workshop-Dimona note. How it was made, why it looks the way it does, what the bench was thinking.\",\n}\n```\n\nSave the file. TypeScript will check the shape at build time; the schema lives at the top of the same file if you need to refer to it. The slug must be URL-safe (lowercase, hyphens, no spaces); the modelUrl is relative to `/public/`.",
      },
      {
        title: "Run the dev server and walk to the piece",
        body: "From the repo root, `pnpm dev`. Wait for the Next.js banner. Open the browser at `http://localhost:3000/atelier/sculpture-gallery/your-mesh` — the gallery layout function will have placed your piece on its own plinth at a stable position derived from the slug.\n\nWalk around it (WASD on desktop, controllers in VR). The plinth's accent light tints to the colour you set. The placard reads the title, blurb and note. If the mesh shows up the right way up, the right scale, and shaded the way you intended in Blender — the pipeline worked.",
      },
      {
        title: "Commit and push",
        body: "If the gallery is rendering the mesh correctly, you're done. From the repo root: `git add public/models/sculpture-gallery/your-mesh.glb lib/sculpture-gallery/catalogue.ts`, then a commit message that names the piece and points at the source .blend if it's checked in alongside.\n\nThe .glb is the on-site asset; the .blend, if you commit it, lives under a parallel `art/blends/` folder so the binaries don't bloat the tree. The studio's house rule is: every shipped .glb has a discoverable .blend somewhere, even if it's in a separate repo. Future-you wants to be able to edit the piece.",
      },
    ],
    finalResult:
      "A custom mesh authored in Blender, exported through the studio's WebXR conventions, rendered live in the sculpture gallery at /atelier/sculpture-gallery/<your-slug>. The first one is the proof the pipeline works; the second is faster because you know the route. By the fifth you'll have it under fifteen minutes door to door.",
    variations: [
      "With animation. In Blender, animate the object with an Action; bake to 30fps before export; the add-on packs the action into the glTF's animation track. Reference the animation name in the catalogue entry's `note` for now — a structured `animationName` field is on the framework roadmap.",
      "With multiple materials. Use Blender's per-face material slots; each slot maps to a glTF material on export. The framework's WebXR renderer respects up to four material slots per mesh; beyond that, split the mesh.",
      "With Draco compression off. For very small meshes (under ~5k triangles) the Draco header outweighs the geometric savings. Toggle the “Draco compression” switch off in the N-panel before exporting; the file will be larger but loads faster on weak GPUs.",
      "With a custom collision shape. Add a second mesh in Blender named `<your-mesh>_collision` — the framework reads it as a simplified collision proxy and uses the visible mesh purely for rendering. Keep the collision mesh under 200 triangles.",
    ],
    troubleshooting: [
      {
        symptom: "Mesh appears smooth-shaded in the browser when you wanted faceted",
        cause:
          "Blender shipped vertex-averaged normals that the glTF exporter respected. The high-facet look needs custom-split flat normals baked in.",
        fix: "In the N-panel, mark the object with the `holoflow:facet` custom property (the panel's Facet mode toggle does this), and tick “Force flat normals on facet objects” before re-exporting. Or, manually: Object Data Properties → Normals → Add Custom Split Normals Data, then Mesh → Normals → Reset Vectors.",
      },
      {
        symptom: "Mesh appears upside-down or rotated 90° in the browser",
        cause:
          "Y-up / Z-up conversion got bypassed. Blender is Z-up; glTF is Y-up. The exporter should handle this but the conversion fails silently if you skipped Apply All Transforms.",
        fix: "Back in Blender, select the object, Object → Apply → All Transforms, then re-export. If the problem persists, check the exporter's “Y-up” toggle in the underlying glTF settings is enabled (the add-on enforces this, but if you're exporting manually it's the default Blender setting that bites you).",
      },
      {
        symptom: "Texture is missing in the browser — the mesh is grey or magenta",
        cause:
          "The texture path inside the .blend was absolute (an `F:\\art\\textures\\` path, say), and the exporter couldn't find the file at that path on the target machine, so it shipped without the texture.",
        fix: "In Blender, File → External Data → Pack All Into Blend before exporting, or move the textures into the same folder as the .blend and re-link them with relative paths. The add-on's export pass packs textures into the .glb as embedded binaries, but only if Blender can resolve them at export time.",
      },
      {
        symptom: "Mesh looks correct but the plinth spotlight is tinted the wrong colour",
        cause:
          "The `accent` field in the catalogue is a CSS colour string used to tint the plinth spot — a typo there ships the wrong tint.",
        fix: "Open `lib/sculpture-gallery/catalogue.ts`, find your entry, and adjust the `accent` string. Anything CSS parses works (`#f4a8b8`, `oklch(0.8 0.1 20)`, `hsl(340 50% 75%)`); save and the dev server hot-reloads.",
      },
      {
        symptom:
          "Mesh fills the gallery (or vanishes into a corner) — the bounds are wildly wrong",
        cause:
          "The gallery layout function assumes pieces fit roughly inside a 1×1×1 metre box. A mesh exported at architectural scale (say, modelled with each unit = one centimetre) or microscopic scale will break the layout.",
        fix: "In Blender, with the object selected, check the dimensions in the N-panel (also press N in object mode) — they should read in metres and the longest axis should be in the 0.3-2.0 range. Scale in Edit mode (select all vertices, S to scale) so the bake at Apply All Transforms preserves unit scale at the object level. Re-export.",
      },
      {
        symptom: "Manual export, no add-on — what settings does the add-on apply?",
        cause:
          "You're exporting via Blender's built-in glTF exporter directly and want to mirror the studio's defaults.",
        fix: "File → Export → glTF 2.0 (.glb/.gltf). Format: glTF Binary (.glb). Include: Selected Objects (if exporting a single piece) or Visible Objects (for the whole scene). Transform: +Y Up ticked. Geometry: Apply Modifiers on, UVs on, Normals on, Tangents on if the material uses normal maps. Material: Export Materials on, Images Automatic. Animation: Use Current Frame off, Export Animations on (Sampling 30 fps). Compression: Draco mesh compression on for meshes over 5k triangles. Save as `<your-mesh>.glb` under `public/models/<scene>/`.",
      },
    ],
    voiceMode: "aura",
  },
  base,
);

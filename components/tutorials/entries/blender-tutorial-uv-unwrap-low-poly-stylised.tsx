import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function UvUnwrapBody() {
  return (
    <>
      <p>
        There is a common assumption about low-poly work: fewer polygons
        means the UV layout matters less. The opposite is true. With a
        faceted mesh, every polygon is a large, clearly visible face.
        Misaligned UVs smear the texture across that face at an oblique
        angle — the painted colour arrives as a gradient instead of a
        flat wash. Getting the UV layout right means each face maps to
        an axis-aligned rectangle on the atlas, and the artist paints
        what they paint.
      </p>
      <p>
        For the studio&apos;s cel and stylised pipeline specifically,
        clean UV layout is load-bearing: toon-shading ramps need a
        consistent UV V-direction per face, texture seams should land on
        hard edges that are already visually distinct, and pixel-aligned
        UV borders prevent 1-pixel bleed in bilinear filtering. This
        tutorial walks the seam-placement strategy, the Angle-Based
        Unwrap algorithm, island packing, and checker-material
        verification — the complete workflow from raw mesh to
        export-ready UVs.
      </p>
      <p>
        For the wider material pipeline this UV layout feeds, see{" "}
        <Link href="/articles/advanced-cell-shading-techniques">
          Advanced cell-shading techniques
        </Link>{" "}
        and the studio&apos;s treatment of the aesthetic in{" "}
        <Link href="/articles/low-poly-high-facet-shading">
          Low-poly high-facet shading
        </Link>
        . The mesh this tutorial unwraps is built in{" "}
        <Link href="/tutorials/blender-tutorial-faceted-gemstone-geonodes">
          Faceted gemstone with Geometry Nodes
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-uv-unwrap-low-poly-stylised",
  title: "UV unwrapping for low-poly stylised meshes in Blender 5.1",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Low-poly meshes need the most careful UV layouts, not the least. This tutorial covers the studio's seam-placement strategy for faceted props — placing seams on hard edges, running the Angle-Based Unwrap, packing islands, and verifying with a checker material — producing clean, paintable UVs for cel textures and glTF export.",
  Body: UvUnwrapBody,
  related: [
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly high-facet shading",
      note: "The aesthetic this UV workflow serves.",
    },
    {
      href: "/articles/advanced-cell-shading-techniques",
      label: "Article — Advanced cell-shading techniques",
      note: "How the UV layout feeds into toon-shading material ramps.",
    },
    {
      href: "/articles/cohesive-low-poly-cell-shaded-vrm-worlds",
      label: "Article — Cohesive low-poly cell-shaded VRM worlds",
      note: "The wider visual language UV layout belongs to.",
    },
    {
      href: "/tutorials/blender-tutorial-faceted-gemstone-geonodes",
      label: "Tutorial — Faceted gemstone with Geometry Nodes",
      note: "The mesh this tutorial unwraps.",
    },
    {
      href: "/tutorials/blender-tutorial-low-poly-faceted-hard-surface",
      label: "Tutorial — Low-poly faceted hard-surface panel",
      note: "Another mesh that needs the same UV treatment.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "How UVs survive the glTF export and load in the WebXR runtime.",
    },
    {
      href: "/codex/mtoon",
      label: "Codex — MToon",
      note: "The VRM shader that reads UVs for expression and texture maps.",
    },
    {
      href: "/codex/inverted-hull-outline",
      label: "Codex — Inverted hull outline",
      note: "The NPR edge technique that relies on consistent UV islands to avoid outline bleeds.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/editors/uv/index.html",
      label: "Blender Manual — UV Editor (docs.blender.org)",
      note:
        "Authoritative 5.1 reference for every UV operator: Unwrap, Project From View, Smart UV Project, Pack Islands. Licence: CC BY (Blender Foundation).",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label: "glTF-Blender-IO — KhronosGroup on GitHub",
      note:
        "Apache-2.0 exporter that writes TEXCOORD_0 accessors from the active UV map. Relevant when verifying that UV islands export without distortion. Author: Khronos Group / Julien Duroure. Related: github.com/KhronosGroup/glTF (spec), github.com/KhronosGroup/glTF-Sample-Models (CC0 reference assets).",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "1–2 hours",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Blender 5.1 installed.",
      "A low-poly mesh to work with — the faceted gem from the 'Faceted gemstone with Geometry Nodes' tutorial, or any prop with clearly defined flat faces.",
      "Comfortable entering Edit Mode and selecting edges. No prior UV experience needed — this tutorial starts from scratch.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    supplies: { tools: [] },
    steps: [
      {
        title: "Understand what UVs do",
        body: `Every vertex in a 3D mesh has a 3D position (X, Y, Z). It may also have a UV position (U, V) — a 2D coordinate in the 0–1 texture space. When the renderer draws a pixel, it looks up the UV coordinate for that point on the surface, reads the corresponding pixel from the texture image, and uses that colour.

The job of UV unwrapping is to assign every vertex a (U, V) position such that the mesh's surface maps flat onto the texture image without gaps, overlaps, or severe distortion.

For a low-poly faceted mesh, the goal is simple: every face should map to a flat, non-rotated polygon in UV space. When a face is flat in UV space, a brush stroke on the texture paints exactly what shows on the mesh. When a face is rotated or skewed in UV space, the brush stroke arrives at a different orientation on the mesh — confusing to paint and confusing to read.`,
      },
      {
        title: "Set up: open the UV Editor alongside the 3D view",
        body: `Open your mesh in Blender. The UV Editor lives at the top of the UV workspace — switch to it by clicking the workspace tabs across the top of the screen (UV Editing).

Alternatively: hover over the 3D viewport divider on the right, right-click, and choose 'Split Vertical'. In the new area, use the editor-type button (top-left corner) to switch from 3D Viewport to UV Editor.

Both views need to be visible at the same time. When you select a face in Edit Mode, its UV island highlights in the UV Editor — real-time feedback on what the unwrap actually looks like. Working with one view is working blind.`,
      },
      {
        title: "Plan your seams",
        body: `Before placing a single seam, stand back from the mesh and ask: where would you cut this object if you had to unfold it flat like a cardboard box?

The studio's rule for faceted low-poly props: every hard edge is a seam candidate. Hard edges — where the dihedral angle between two faces is large — are already visually distinct in the viewport. A UV seam on a hard edge is invisible because the visual boundary is already there. A UV seam on a smooth, gently-curved transition would produce visible texture stretching and a discontinuity in the shading.

For a gem or crystal form: every silhouette edge between a top face and a side face is a seam. The bottom face can be a separate island — it usually won't be seen at runtime. Each facet of the gem's girdle is a separate island, or can share one long, narrow strip island if they are the same height.

For a hard-surface panel: every face-group at a different orientation is a separate island — top, front, sides. Where two faces are coplanar or at less than 10°, keep them joined and unwrap together.`,
      },
      {
        title: "Mark seams",
        body: `Tab into Edit Mode. Switch to Edge Select mode (press 2 or click the edge-select icon in the header).

Select the edges you identified as seam candidates. You can do this one by one (clicking edges), or use Select → All by Trait → Sharp Edges (which selects edges above Blender's sharpness threshold — the same logic as the Auto Smooth modifier). For a gem, both the manual and automatic approaches produce similar results.

With your seam edges selected: Ctrl+E → Mark Seam. The edges turn orange — a visual cue that they are seam boundaries. The mesh is now divided into UV islands along those edges.

To test whether the seam layout will produce a good unwrap: select all faces (A), switch the UV Editor view, and run Unwrap (U → Unwrap). You should see each island as a separate cluster of faces. If any island is very long and thin or wraps around itself, that island needs more seams. Add them and re-run Unwrap.`,
      },
      {
        title: "Run the Angle-Based Unwrap",
        body: `Select all faces in Edit Mode (A). Press U → Unwrap. Blender uses the 'Angle-Based' algorithm by default — this minimises angular distortion, meaning each island preserves the relative angles of its faces as closely as possible. For flat-faced low-poly meshes this is effectively a flat projection per island.

In the UV Editor you should now see all islands arranged in the 0-1 UV space (the orange square). Each island corresponds to one contiguous group of faces delimited by your seams.

Check the results:
  - Each island should look like a recognisable flat version of its faces.
  - Islands should not overlap.
  - Faces within an island should have roughly the same scale (no tiny face squashed next to a huge one).

If an island looks distorted, go back to Edit Mode, add a seam to break it smaller, and re-run Unwrap.`,
      },
      {
        title: "Pack islands",
        body: `At this point the islands are placed wherever Blender put them after the unwrap. Most will be in the 0-1 space but positioned inefficiently — large empty gaps between them.

In the UV Editor, go to UV (top menu) → Pack Islands. Set the margin to 0.005 (this leaves a 2-pixel gap on a 256×256 texture, preventing bilinear filtering bleed). Click OK.

Blender rearranges all islands to fill the 0-1 space as densely as possible. The islands do not change shape or size relative to each other — Pack Islands only translates and rotates them.

Inspect the packed layout. A well-packed UV map uses 70–90% of the 0-1 space. If you see large empty corners, either your mesh has very irregular island shapes (consider re-unwrapping some islands) or the mesh's face areas vary wildly (expected for a gem with both large top faces and narrow girdle faces).`,
      },
      {
        title: "Apply a checker material and verify",
        body: `The checker material is the final verification step. A correctly-unwrapped mesh shows uniform checker squares of identical size, with their grid lines parallel to the UV axes, and no visible seam boundaries except at hard edges.

In the Properties panel → Material, add a new material. Open the node editor (Shader Editor tab). Add a Texture Coordinate node (Shift+A → Input → Texture Coordinate) and a Checker Texture node (Shift+A → Texture → Checker Texture). Wire: UV socket from Texture Coordinate → Vector on Checker Texture → Color → Base Color on Principled BSDF.

Switch the 3D viewport to Material Preview (Z → Material Preview). You should now see the blue-and-white checker grid on the mesh.

What to look for:
  - All squares are the same size → consistent texel density across the mesh.
  - Grid lines are axis-aligned on each face → no UV rotation.
  - No squares are stretched into rectangles → no distortion.
  - Hard edges match UV seam positions → seams are correctly placed.

If you see stretched squares: the island containing that face needs more seams or a re-unwrap. If the squares are different sizes between faces: either the face areas are very different (acceptable) or the UV islands are scaled unevenly (fix by selecting all islands in the UV Editor and running UV → Average Island Scale, then Pack Islands again).`,
      },
      {
        title: "Export-ready: verify in glTF",
        body: `When the checker looks correct, the mesh is ready for the studio's glTF export step.

File → Export → glTF 2.0. In the export dialog, under Geometry, confirm 'UVs' is ticked (it is by default). The exporter writes the active UV map as TEXCOORD_0 in the glTF mesh accessor. Any texture you assign will read this TEXCOORD_0 at runtime.

To verify: open the exported .glb in a glTF viewer (Khronos glTF Sample Viewer at https://github.khronos.org/glTF-Sample-Viewer-Release/ works in any browser). Apply the same checker texture. If it looks the same as in Blender, the UV data made the round-trip intact.

The studio's holoflow_webxr_exporter wrapper locks in Y-up and Draco compression but leaves UVs alone — whatever you authored is what the WebXR runtime receives.`,
      },
    ],
    finalResult:
      "A low-poly faceted mesh with a clean UV layout: seams placed on hard edges, Angle-Based Unwrap applied per island, islands packed efficiently in the 0-1 space, and verified with a checker material. The mesh is ready for hand-painting, procedural cel textures, normal map baking, or direct export to glTF for the WebXR runtime.",
    variations: [
      "Smart UV Project: Mesh → UV → Smart UV Project is a one-click alternative that places automatic seams and unwraps without any manual work. Good for non-hero props where speed matters more than paintability. The islands will be less predictably shaped, but the output is valid for baking AO or cavity maps.",
      "Project From View: for a face that should tile a flat texture (a floor, a wall panel), select that face in Edit Mode, look at it straight-on, and use UV → Project From View. This gives a pixel-perfect flat projection — the texel lines up exactly with the face. Combine with manual Unwrap for the remaining faces.",
      "Average Island Scale: after packing, select all islands and run UV → Average Island Scale. This equalises the UV scale so every face has the same texel density. Useful when a texture is applied that should look uniform across the whole mesh — e.g. a stone or wood grain that should tile consistently.",
      "Align islands to pixel grid: for a 256×256 texture atlas, you want UV island edges to land on pixel boundaries (multiples of 1/256 ≈ 0.0039). Select an island in the UV Editor, use UV → Snap to Pixels. This eliminates the 1-pixel bleed that bilinear filtering causes at island edges.",
    ],
    troubleshooting: [
      {
        symptom: "The UV Editor shows nothing after running Unwrap",
        cause:
          "No faces were selected when Unwrap ran, or the mesh has no UV map yet.",
        fix: "In Edit Mode, press A to select all faces, then run U → Unwrap again. If the UV Editor is still blank, check that the mesh has a UV map: Properties → Object Data → UV Maps. If the list is empty, click + to add one, then run Unwrap.",
      },
      {
        symptom:
          "Islands overlap after Unwrap — faces stacked on top of each other in the UV Editor",
        cause:
          "Not enough seams: the unwrap could not flatten the islands without overlap.",
        fix: "In Edit Mode, select the edges at the fold points (where the overlap occurs — usually edges between faces at significantly different angles). Mark them as seams (Ctrl+E → Mark Seam) and re-run Unwrap. Each additional seam cuts an island into two, giving each half more freedom to flatten.",
      },
      {
        symptom: "Checker squares are stretched on some faces",
        cause:
          "Those faces have UV distortion — the UV island for them is not a true flat projection.",
        fix: "Select the stretched faces in the UV Editor (they show elongated checker squares), press P → Select Linked to isolate their island. Scale it to even out the stretch (S → X or S → Y), or go back to Edit Mode and re-unwrap that island with additional seams.",
      },
      {
        symptom: "Checker squares look correct in Blender but the texture looks wrong in the browser",
        cause:
          "The glTF exporter wrote the wrong UV map, or the runtime is reading TEXCOORD_1 instead of TEXCOORD_0.",
        fix: "In Object Data Properties → UV Maps, confirm the active UV map (the one with the camera icon) is the one you unwrapped. The exporter writes the active map as TEXCOORD_0. If you have multiple UV maps, the wrong one may be active.",
      },
    ],
  },
  base,
);

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function FacetedGemBody() {
  return (
    <>
      <p>
        Two meshes can carry the same triangle count and read as completely
        different objects. One is a faceted jewel, every plane catching light
        at its own angle. The other is a smooth-shaded pebble that reads as
        unfinished. The geometry is identical. The difference is one loop in
        Python: <code>for poly in mesh.polygons: poly.use_smooth = False</code>.
        When every face carries its own perpendicular normal, adjacent faces
        diverge &mdash; each catches light independently. That is the fire of a
        gemstone, and the core of the Holoflow high-facet aesthetic.
        See the{" "}
        <Link href="/articles/low-poly-high-facet-shading" className="underline underline-offset-4 hover:text-pink-200">
          Low-poly high-facet shading article
        </Link>{" "}
        for the full theory.
      </p>

      <p>
        The blueprint uses the <code>bmesh</code> API rather than{" "}
        <code>bpy.ops</code> for a deliberate reason: <code>bpy.ops</code>{" "}
        operators poll against the active window and space type, silently
        no-oping (or raising <code>RuntimeError</code>) when called from a
        headless <code>--background</code> process, a Geometry Nodes Python
        Script node, or any context that does not match their poll. The{" "}
        <code>bmesh</code> API is pure data &mdash; no context required. The
        same script runs identically in the UI, headless, and inside a GN
        node tree.
      </p>

      <p>
        Blender 5.1 removed <code>mesh.use_auto_smooth</code> (it went in
        4.1). Mixed smooth/flat surfaces are now handled by the "Smooth by
        Angle" modifier, which leaves flat the faces whose dihedral angle
        exceeds the threshold and smooths the rest. For a gem that is{" "}
        <em>entirely</em> faceted we skip the modifier: the per-polygon loop
        is all that is needed, and it survives every context.
      </p>

      <p>
        Once the gem is built and exported as a GLB, it moves into the
        WebXR scene via the standard asset pipeline &mdash; see{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className="underline underline-offset-4 hover:text-pink-200">
          Blender to site asset pipeline
        </Link>
        . The same blueprint, with a wall-thickness check added, doubles as
        a 3D-print prep starting point &mdash; see{" "}
        <Link href="/tutorials/blender-addon-3d-print-toolbox" className="underline underline-offset-4 hover:text-pink-200">
          3D Print Toolbox
        </Link>
        . A compact reusable macro lives at{" "}
        <code>tools/blender-addon/holoflow_macros/faceted_gem.py</code> for
        scripting gems into larger scenes without copy-pasting the full
        blueprint.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-faceted-gem-flat-normals",
  title: "Faceted gem: bmesh polyhedron and flat normals in Blender 5.1",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Build an 8-sided gem from scratch using Blender's bmesh API, apply flat per-face normals for the Holoflow high-facet aesthetic, set up an EEVEE Next glass material, and export a production-ready GLB. Two to three hours at the bench.",
  Body: FacetedGemBody,
  related: [
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly high-facet shading",
      note: "The aesthetic theory underpinning flat normals and why they matter.",
    },
    {
      href: "/articles/cohesive-low-poly-cell-shaded-vrm-worlds",
      label: "Article — Cohesive low-poly cell-shaded VRM worlds",
      note: "Studio art direction: where faceted meshes sit in the wider visual language.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "How the .glb from this entry moves from Blender into the WebXR scene.",
    },
    {
      href: "/tutorials/blender-addon-3d-print-toolbox",
      label: "Tutorial — 3D Print Toolbox add-on",
      note: "Add wall-thickness checks to this gem blueprint for print preparation.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/api/current/bmesh.html",
      label: "Blender Manual — bmesh API",
      note: "Author: Blender Foundation · Licence: CC-BY-SA-4.0. Canonical reference for every bmesh operator and type used in this tutorial.",
    },
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/meshes/properties/object_data.html#normals",
      label: "Blender Manual — Mesh normals",
      note: "Author: Blender Foundation · Licence: CC-BY-SA-4.0. Documents the shift from use_auto_smooth (removed 4.1) to the Smooth by Angle modifier in 5.x.",
    },
    {
      href: "https://github.com/dfelinto/blender-manual",
      label: "Blender Manual source — GitHub",
      note: "Author: Blender Foundation contributors · Licence: CC-BY-SA-4.0. Useful for diffing what changed between versions in the normals pipeline.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "two to three hours",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Blender 5.1 installed. The flat-normals technique works in 4.2+ but the API changed in 4.1.",
      "Comfortable opening the Scripting workspace and running a Text Editor script.",
      "Basic 3D viewport navigation: orbit, zoom, material preview mode (Z).",
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
    steps: [
      {
        title: "Open the Scripting workspace",
        body: "Switch to the Scripting workspace tab at the top of Blender. Click New in the Text Editor to open a blank script. Open blueprint.py via Text > Open and navigate to public/library/blends/faceted-mesh/faceted-gem/blueprint.py.\n\nLeave the 3D viewport visible in the top-left split so you can watch the gem appear without switching workspaces.",
      },
      {
        title: "Run blueprint.py",
        body: "Press ▶ (Run Script) or Alt+P. The script clears the default scene, builds the gem mesh via bmesh, sets up the material and 3-point lighting, exports a GLB, and saves the .blend — all in one pass.\n\nIf you see a Python error mentioning 'context', a conflicting add-on may be overriding the data context. Restart Blender with --factory-startup and re-run.",
      },
      {
        title: "Inspect the flat normals",
        body: "In the 3D viewport press Z → Material Preview. Orbit around the gem. Each facet should show as a distinct colour plane with no gradient blending to its neighbours.\n\nTo verify technically: Overlays → Face Orientation. Every face shows a single blue arrow perpendicular to its own plane. If any faces show inward-pointing (red) normals, run Mesh > Normals > Recalculate Outside in Edit Mode.",
      },
      {
        title: "Understand the flat-normals code path",
        body: "Scroll the Text Editor to approximately line 170:\n\n    for poly in mesh.polygons:\n        poly.use_smooth = False\n    mesh.update()\n\nThis loop is the entire flat-shading switch. In Blender 4.0 and earlier it was mediated through mesh.use_auto_smooth. In 4.1 that property was removed. Per-polygon use_smooth is now the direct toggle. The 'Smooth by Angle' modifier is the new canonical path for mixed surfaces, but for a fully-faceted gem this loop is all that is needed.",
      },
      {
        title: "Adjust the material",
        body: "In Properties → Material Properties, find GemCrystal. The Principled BSDF's Transmission Weight dial controls the glass quality. At 0.95 the gem is nearly fully refractive. Try 0.5 for a semi-opaque crystal, or 0.0 for a painted-toy read.\n\nIOR values: 1.77 (cubic zirconia / diamond simulant), 1.52 (common glass), 2.42 (synthetic ruby). EEVEE Next approximates refraction with screen-space rays — accurate enough for the WebXR frame budget.",
      },
      {
        title: "Export the GLB",
        body: "The script exports automatically, but you can re-export manually via File > Export > glTF 2.0.\n\nExport panel settings: Format → glTF Binary (.glb), Geometry → Compression enabled, Level 6, Transform → +Y Up: ON, Materials → Export.\n\nThese match the Holoflow WebXR exporter conventions at tools/blender-addon/holoflow_webxr_exporter/ — the gem will load without orientation surprises in the browser.",
      },
      {
        title: "Verify in a glTF viewer",
        body: "Open https://gltf-viewer.donmccurdy.com in a browser (MIT licence, Don McCurdy) and drag the .glb onto it. Confirm:\n- The gem sits point-down, table (flat face) upward\n- Each facet reads as a flat colour plane, not a smooth gradient\n- The glass refraction approximates under the viewer's IBL\n\nIf faces appear black or inverted, the winding order has flipped. In Edit Mode, select all, then Mesh > Normals > Recalculate Outside (Shift+N).",
      },
    ],
    finalResult:
      "An 8-sided faceted gem in both .blend and .glb form. Flat normals make every face its own light-catching plane — the Holoflow facet aesthetic at its most distilled. The GLB loads into the WebXR scene via the standard asset pipeline and renders correctly in EEVEE Next, Cycles, and every browser-side glTF viewer.",
    variations: [
      "Increase SIDES to 16 for a rounder, more brilliant-cut silhouette. The flat-normals loop is unchanged — more sides means more facets, each still distinct.",
      "Set Transmission Weight to 0 and Roughness to 0.6 for a matte ceramic or painted-resin read — same geometry, completely different material.",
      "Add a Geometry Nodes modifier (Add > Modifier > Geometry Nodes → new group) and drive SIDES and CROWN_HEIGHT as group inputs, so you can scrub the gem shape live. The GN equivalent of the flat-normals loop is a 'Set Shade Smooth' node with Smooth = false.",
      "Duplicate the gem, apply a Mirror modifier across Z, and parent both to an empty. This gives a double-ended dipyramid — a more alien crystal form used as spatial markers in the Aura Test Chamber.",
    ],
    troubleshooting: [
      {
        symptom: "Script runs but the scene still has the default cube",
        cause: "bpy.ops.wm.read_factory_settings requires window context and may silently fail.",
        fix: "The script's _clear_scene() uses the data API directly and should handle this. If not, manually delete the default cube before running, or restart Blender with --factory-startup.",
      },
      {
        symptom: "Faces appear black or inside-out in the viewport",
        cause: "Vertex winding order is clockwise from outside, so face normals point inward.",
        fix: "In Edit Mode, select all (A), then Mesh > Normals > Recalculate Outside (Shift+N). Some Blender builds flip the bmesh winding convention depending on the version.",
      },
      {
        symptom: "GLB shows smooth shading in the glTF viewer despite flat normals in Blender",
        cause: "The glTF exporter may be baking smooth normals from a 'Smooth by Angle' modifier higher in the stack.",
        fix: "Delete any Smooth by Angle modifier on the gem object before exporting. Also check Object Data Properties → Normals — if 'Custom Split Normals Data' is present, it overrides per-polygon use_smooth. Clear it via Mesh > Clear Custom Split Normals Data.",
      },
      {
        symptom: "EEVEE Next renders the gem as a solid opaque block",
        cause: "Transmission Weight > 0 requires EEVEE Next, not legacy EEVEE.",
        fix: "Render Properties → confirm Render Engine = EEVEE. In Blender 5.x, EEVEE Next is the only EEVEE variant. On 4.x, also tick 'Screen Space Refraction' in the material's surface properties.",
      },
    ],
  },
  base,
);

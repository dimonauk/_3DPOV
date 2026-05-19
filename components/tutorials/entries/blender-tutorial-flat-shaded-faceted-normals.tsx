import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function FlatShadedNormalsBody() {
  return (
    <>
      <p>
        Every cel-shading setup reduces to a single question: where does the
        lighting calculation say a surface is lit, and where does it say it is
        in shadow? The answer lives in the vertex normals. Point all the normals
        straight out from each face and you get hard polygon edges — the look
        people call &ldquo;low-poly&rdquo;. Point them all toward the sphere
        centroid and you get a smooth gradient that hides the geometry entirely.
        The studio&rsquo;s preferred mode is neither: it is <em>silhouette-blend</em>,
        where outer-edge loops keep a smooth normal (preserving the contour read)
        and interior loops carry the raw face normal (forcing the cel bands to
        land on polygon edges). Blender 5.1 gives you the API to set this at
        the loop level without adding a single extra polygon.
      </p>

      <p>
        This walkthrough covers the theory, the three shading modes Blender
        offers in 5.1 (flat, smooth, smooth-by-angle), and the custom split
        normals API that lets you go further than any of them. The material
        side is just as important: a Shader to RGB node feeding a Color Ramp
        in CONSTANT interpolation is the cel-shading skeleton, and the shape of
        those bands is entirely determined by the normals underneath.
      </p>

      <h3>Related studio writing</h3>

      <ul>
        <li>
          <Link href="/articles/low-poly-high-facet-shading">
            Article — Low-poly high-facet shading
          </Link>{" "}
          — the art-direction rationale behind the technique this tutorial implements.
        </li>
        <li>
          <Link href="/articles/advanced-cell-shading-techniques">
            Article — Advanced cel-shading techniques
          </Link>{" "}
          — outlines the node strategies; this tutorial is the Blender implementation.
        </li>
        <li>
          <Link href="/codex/ramp-shading">
            Codex — Ramp shading
          </Link>{" "}
          — vocabulary entry for the colour-band posterisation technique.
        </li>
        <li>
          <Link href="/tutorials/blender-to-site-asset-pipeline">
            Tutorial — Blender to site asset pipeline
          </Link>{" "}
          — where the GLB produced by this tutorial ends up.
        </li>
        <li>
          <Link href="/codex/mtoon">
            Codex — MToon
          </Link>{" "}
          — the VRM cel-shading material format that the same normal strategy
          supports at runtime.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-flat-shaded-faceted-normals",
  title: "Custom split normals for flat-faceted cel-shading — Blender 5.1",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "How Blender 5.1 handles per-loop normals after the auto_smooth removal, and how to use normals_split_custom_set() to get hard cel-shading bands on interior faces while keeping a smooth silhouette — the studio's silhouette-blend technique.",
  Body: FlatShadedNormalsBody,
  related: [
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly high-facet shading",
      note: "The art-direction rationale the technique serves.",
    },
    {
      href: "/articles/advanced-cell-shading-techniques",
      label: "Article — Advanced cel-shading techniques",
      note: "Broader node strategies; this tutorial is the implementation.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "Where the resulting GLB goes after export.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/normals.html",
      label: "Blender Manual — Custom Split Normals",
      note: "Official reference for the normals panel and API. Author: Blender Foundation. Licence: CC-BY-SA-4.0.",
    },
    {
      href: "https://github.com/blender/blender/blob/main/scripts/addons_core/mesh_looptools.py",
      label: "LoopTools add-on — Blender source",
      note: "Reference implementation of loop-level mesh operations in bpy. Author: Bart Crouch, Blender Foundation. Licence: Apache-2.0.",
    },
    {
      href: "https://developer.blender.org/docs/release_notes/4.1/python_api/",
      label: "Blender 4.1 Python API changes",
      note: "Documents the removal of use_auto_smooth and what replaced it. Author: Blender Foundation. Licence: CC-BY-SA-4.0.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon — 3 to 4 hours",
    difficulty: "intermediate",
    cost: "free — all tools are open-source",
    prerequisites: [
      "Blender 5.1 installed. The technique uses no add-ons.",
      "Basic familiarity with Blender's 3D viewport, material slots, and the Scripting workspace.",
      "Understanding of what a vertex normal is (a direction vector perpendicular to the surface at a point). The tutorial explains the rest.",
    ],
    supplies: {
      tools: [],
    },
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
        title: "Understand normals in Blender 5.1",
        body: "Blender removed mesh.use_auto_smooth in version 4.1. Before 4.1, you had to toggle that flag before custom split normals would be read. In 5.x, custom normals are always active — call normals_split_custom_set() and they take effect immediately.\n\nThree shading modes still exist as user-facing operations:\n• Shade Flat — sets polygon.use_smooth = False for every face. Blender uses the geometric face normal for every loop in that face. Hard polygon edges everywhere.\n• Shade Smooth — sets polygon.use_smooth = True. Blender averages adjacent face normals at each vertex. Smooth gradient everywhere.\n• Shade Smooth by Angle — smooth operator with a dihedral-angle threshold. Edges whose adjacent faces meet at an angle above the threshold stay hard; those below are smoothed.\n\nCustom split normals sit outside all three: you supply an explicit (x, y, z) per loop. The polygon must be use_smooth = True or Blender ignores the custom data and falls back to the face normal.",
      },
      {
        title: "Create a test UV sphere",
        body: "Shift+A → Mesh → UV Sphere. In the operator panel at the bottom-left of the viewport, set Segments: 12, Rings: 8, Radius: 1.0.\n\nThese low counts are intentional — the facets need to be large enough to see clearly in Material Preview. A higher-poly sphere would make the normal differences invisible to the eye.\n\nIn the N-panel (press N), confirm the scale is 1,1,1 and location is 0,0,0. If you moved or scaled it during creation, apply transforms with Ctrl+A → All Transforms before touching normals. Custom normals are stored in object space; unapplied transforms will shear them.",
      },
      {
        title: "Apply the cel-shade material",
        body: "In the Properties panel, add a new material slot. Rename it cel_faceted.\n\nOpen the Shader Editor. Delete the default Principled BSDF. Build this graph:\n\n1. Add a Diffuse BSDF node (Shift+A → Shader → Diffuse BSDF). Set colour to a warm orange (0.8, 0.3, 0.1).\n2. Add Shader to RGB (Shift+A → Converter → Shader to RGB). Wire the Diffuse BSDF output into its Shader input.\n3. Add a ColorRamp node (Shift+A → Converter → ColorRamp). Set Interpolation: CONSTANT — this is what makes it a cel-shader rather than just a gradient. Wire Color from Shader to RGB into the Fac input.\n4. Edit the ramp stops: three bands at positions 0.0 (near-black blue), 0.35 (dark rust), 0.72 (warm ochre).\n5. Add an Emission node (Shift+A → Shader → Emission). Wire the ColorRamp Color output into Emission Color. Set Strength: 1.0.\n6. Wire Emission into the Material Output Surface socket.\n\nSwitch the viewport to Rendered view. The sphere should show three hard colour bands.",
      },
      {
        title: "See why flat normals help the cel-shader",
        body: "Right-click the sphere → Shade Flat. Watch the cel bands. They now snap to polygon boundaries — the three bands sit inside polygonal outlines that make the sphere read as constructed rather than calculated.\n\nRight-click → Shade Smooth. The bands become sweeping curved stripes; the hard polygon structure is gone. This can be right for some work, but it loses the studio's faceted-craft aesthetic.\n\nRight-click → Shade Smooth by Angle, threshold 30°. The equator edge (where rings meet at a sharp angle) stays hard; the rest blends. A useful middle ground but the logic is driven by dihedral angle, not artistic intent.\n\nThe problem with Shade Flat: look at the silhouette of the sphere. The outer contour is stepped — the low-poly shape reads as an accident. For a 12-segment sphere on a white background this reads as unfinished.\n\nCustom split normals let us fix that.",
      },
      {
        title: "Apply custom split normals — silhouette-blend",
        body: "Open the Scripting workspace (top menu bar → Scripting). Create a new text block and paste the following:\n\n```python\nimport bpy\nimport bmesh\nfrom mathutils import Vector\n\ndef silhouette_blend(obj, segs=12):\n    me = obj.data\n    me.update()\n    \n    bm = bmesh.new()\n    bm.from_mesh(me)\n    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)\n    vn = {v.index: v.normal.copy() for v in bm.verts}\n    bm.free()\n    \n    vc = {}\n    for loop in me.loops:\n        vc[loop.vertex_index] = vc.get(loop.vertex_index, 0) + 1\n    poles = {vi for vi, c in vc.items() if c >= segs - 2}\n    \n    ln = [None] * len(me.loops)\n    for poly in me.polygons:\n        fn = poly.normal.copy()\n        for li in poly.loop_indices:\n            vi = me.loops[li].vertex_index\n            ln[li] = vn[vi] if vi in poles else fn\n    \n    me.normals_split_custom_set(ln)\n    for poly in me.polygons:\n        poly.use_smooth = True\n    me.update()\n\nsilhouette_blend(bpy.context.active_object)\n```\n\nWith the sphere selected, click Run Script (Alt+P or the triangle play button). Switch back to the 3D viewport in Rendered mode.\n\nThe cel bands now fall on interior face edges — hard and deliberate — while the outer silhouette reads as a smooth curve. This is the silhouette-blend: the outer-ring vertices get a vertex-averaged normal (smooth), all inner vertices get the face normal (hard).\n\nThe logic: vertices that appear in many loops (pole and near-pole vertices on a UV sphere) are detected by their high loop count. Those get the smooth normal; everyone else gets the face normal.",
      },
      {
        title: "Adjust the normal blend threshold",
        body: "The silhouette-blend script uses segs - 2 as the loop-count threshold for identifying near-pole vertices. For a 12-segment sphere that is 10 — only the true poles and the first latitude ring qualify.\n\nTo extend the smooth region further down the sphere (a softer silhouette, more interior bands), lower the threshold:\n\n```python\n# Replace the poles line:\npoles = {vi for vi, c in vc.items() if c >= segs // 2}\n```\n\nHalf the segment count is a useful starting point for a gentle blend. Re-run the script after any change.\n\nYou can also target specific faces rather than using the vertex-count heuristic — select faces in Edit Mode, then in the script filter by polygon index. This lets you apply face-normal shading to the equatorial belt while blending the poles and top-cap, for example.",
      },
      {
        title: "Export as GLB",
        body: "File → Export → glTF 2.0 (.glb/.gltf).\n\nIn the export panel:\n• Format: GLB\n• Transform → +Y Up: enabled\n• Data → Apply Modifiers: enabled (Apply Transformations)\n• Mesh → Compression: enabled, Level 6\n• Material → Images → Format: WebP\n\nSave to public/library/glbs/shading/flat-shaded-faceted-normals/faceted_sphere.glb relative to your repo root.\n\nThe custom normals travel in the GLB as the NORMAL accessor in the vertex buffer. Three.js honours them at import; the cel-shading material you wire in the site's TSL layer will see the same silhouette-blend on the same bands.",
      },
    ],
    finalResult:
      "A UV sphere at 12×8 resolution with per-loop custom normals: smooth at the silhouette, hard at interior face edges. A cel-shade material with three hard colour bands driven by Shader to RGB. A GLB ready for the Holoflow site pipeline, carrying the custom normals in the vertex buffer.",
    variations: [
      "Apply silhouette_blend to a low-poly character head mesh. The same logic works on any connected mesh — the pole-detection heuristic just needs tuning to the vert topology. Use the face-index filter variant for precise region control.",
      "Add a Fresnel node after the cel ramp to tint the silhouette a contrasting hue — a rim-light effect in the shader rather than a second light source.",
      "Bake the lighting result to a texture at low resolution (128×128) for export to WebXR targets where Shader to RGB is unsupported. The baked texture carries the band positions without needing the Eevee/CYCLES Shader to RGB node.",
      "Use the same material but swap Diffuse BSDF for a Principled BSDF with metallic = 1 to see how the bands behave on a specular surface — useful for sci-fi armour or drone shell cel-shading.",
    ],
    troubleshooting: [
      {
        symptom: "Running normals_split_custom_set() raises AttributeError: 'Mesh' object has no attribute 'normals_split_custom_set'",
        cause: "The script is running against a Blender version older than 2.80, or the mesh data block is not a bpy.types.Mesh.",
        fix: "Confirm the active object is a mesh (obj.type == 'MESH') and that Blender version is 5.1. Print type(obj.data) in the scripting console to verify.",
      },
      {
        symptom: "Custom normals applied but the cel bands look identical to Shade Smooth — no hard polygon edges inside.",
        cause: "The polygons were left with use_smooth = False. When use_smooth is False, Blender ignores the custom normals and computes the face normal itself.",
        fix: "After calling normals_split_custom_set(), set poly.use_smooth = True for every polygon and call me.update(). The script above does this; check the paste was complete.",
      },
      {
        symptom: "Silhouette still looks stepped after applying silhouette_blend.",
        cause: "The pole vertex threshold (segs - 2) matched no vertices — e.g., the sphere has no high-loop-count vertices because it is not a UV sphere but an icosphere.",
        fix: "Icospheres have uniform vertex topology; every vertex has five or six neighbours. The loop-count heuristic does not apply. Use an explicit face-index set instead: select the outer-edge faces in Edit Mode, get their indices, and assign vertex normals to those faces only.",
      },
      {
        symptom: "GLB loads in the browser but normals appear wrong — the faceted shading is gone, the sphere looks smooth.",
        cause: "The glTF export did not include custom normals. This happens when Export Normals is disabled in the exporter settings.",
        fix: "In the glTF export panel, under Data → Mesh, enable Custom Normals. It is off by default in some Blender versions. With it on, the NORMAL accessor in the GLB will carry the per-vertex normals you set.",
      },
    ],
  },
  base,
);

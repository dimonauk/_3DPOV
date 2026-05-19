import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";
import Link from "next/link";

function Body() {
  return (
    <>
      <p>
        The Holoflow high-facet aesthetic lives or dies on how normals
        survive the pipeline from Blender to the browser. Every polygon
        must read as a discrete geometric plane — a face catching its own
        share of light, independent of its neighbours. In Blender&apos;s
        viewport, right-clicking and choosing Shade Flat gets you there
        instantly. The problem begins the moment you export to GLB.
      </p>

      <p>
        The glTF exporter does not read the{" "}
        <code>polygon.use_smooth</code> flag. It reads the NORMAL vectors
        stored in the mesh&apos;s loop data. If no custom normals are
        present, the exporter recomputes normals from geometry — which
        means averaging across shared vertices, which means your faceted
        sculpture arrives in Three.js looking like a smooth sphere. This
        tutorial walks the fix: baking per-face normals into the custom
        split normals data layer in Blender 5.1, then verifying the round-
        trip in a GLB viewer.
      </p>

      <p>
        This is the technique the{" "}
        <code>holoflow_webxr_exporter</code> add-on&apos;s{" "}
        <code>holoflow:facet</code> flag automates. Understanding it
        manually means you can apply it to any mesh outside the add-on,
        and you&apos;ll know exactly what to look for when the look breaks.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-faceted-custom-split-normals",
  title: "Faceted custom split normals — baking flat normals for WebXR",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Shade Flat does not survive the GLB export. This tutorial shows why, and walks the Blender 5.1 custom-split-normals API that actually does — the same technique the holoflow:facet flag automates inside the studio exporter.",
  Body,
  related: [
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly high-facet shading",
      note: "The aesthetic context: what faceted shading looks like and why the studio uses it.",
    },
    {
      href: "/articles/advanced-cell-shading-techniques",
      label: "Article — Advanced cell-shading techniques",
      note: "The shader side of the same look — toon ramps and outline passes that pair with faceted geometry.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "The full export pipeline this technique feeds into.",
    },
    {
      href: "/tutorials/blender-addon-vrm-format",
      label: "Tutorial — VRM format add-on",
      note: "Custom normals matter for VRM avatars too — the same principle applied to humanoid rigs.",
    },
  ],
  furtherReading: [
    {
      href: "https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html",
      label: "KhronosGroup — glTF 2.0 Specification (Apache-2.0)",
      note: "§3.7.2 defines the NORMAL accessor. Understanding it explains why hard edges force vertex duplication in the exported GLB.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label: "KhronosGroup — glTF-Blender-IO, the bundled exporter (Apache-2.0)",
      note: "The io_scene_gltf2 source. The _gather_normals() function in mesh/primitives/ is exactly the branch this tutorial exercises — it checks has_custom_normals first.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Sample-Models",
      label: "KhronosGroup — glTF Sample Models (Apache-2.0 / various)",
      note: "Reference GLBs for comparing your own export against known-good normals output.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "45 minutes for the manual walk; 10 minutes if you run blueprint.py",
    difficulty: "intermediate",
    cost: "free — Blender is open-source, io_scene_gltf2 is bundled",
    prerequisites: [
      "Blender 5.1 installed.",
      "Comfortable with the Scripting workspace — you need to run a Python script.",
      "Read 'Low-poly high-facet shading' first if you want the aesthetic context.",
    ],
    supplies: {
      tools: [
        {
          name: "blueprint.py from the library",
          note: "The full procedural script. Copy it from public/library/blends/low-poly-shading/faceted-custom-split-normals/ into a Blender text block and run it.",
          suppliers: [
            {
              name: "Holoflow Library — blueprint.py",
              url: "https://github.com/dimonauk/_3dpov/blob/main/public/library/blends/low-poly-shading/faceted-custom-split-normals/blueprint.py",
              price: "free",
            },
          ],
        },
      ],
    },
    software: [
      {
        name: "Blender",
        version: "5.1 (the technique works back to 4.2 — use_auto_smooth was removed in 4.2)",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
      {
        name: "glTF viewer (optional, for round-trip verification)",
        version: "any",
        url: "https://gltf-viewer.donmccurdy.com",
        cost: "free (browser-based)",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    steps: [
      {
        title: "Understand what the glTF exporter reads",
        body: "Open a new Blender file. Add an ICO Sphere (subdivisions 1 — 80 triangles). Right-click → Shade Flat. The viewport shows the facets clearly.\n\nNow open the Python Console (Header → Editor Type → Python Console). Type:\n\n    bpy.context.object.data.has_custom_normals\n\nIt returns False. This is the key: Shade Flat is a viewport display flag, stored in polygon.use_smooth. The glTF exporter (io_scene_gltf2) does not read use_smooth. It reads the CD_CUSTOMLOOPNORMAL data layer — which only exists when has_custom_normals is True.\n\nIf you exported this sphere to GLB right now, the exporter would compute normals from geometry (averaged vertex normals), and the facets would disappear at runtime.",
      },
      {
        title: "Open the Scripting workspace",
        body: "Switch to the Scripting workspace (top header tab). You should see the ICO Sphere still in the scene.\n\nCreate a new Text block. Copy blueprint.py into it, or load it from disk (Text → Open, navigate to public/library/blends/low-poly-shading/faceted-custom-split-normals/blueprint.py).\n\nBefore running, read the parameter block at the top:\n\n    SUBDIVISIONS = 1          # 1 → 80 tris\n    SPHERE_RADIUS = 1.0\n    OUTPUT_GLB = '//../../glbs/low-poly-shading/...'\n\nThe script assumes the text block is saved inside the .blend file at its intended library location. If you're running ad-hoc, change OUTPUT_GLB to an absolute path on disk.",
      },
      {
        title: "Run the script — phase by phase",
        body: "Run the script (Alt+P or the ▶ button). Watch the Info bar and the system console for output:\n\n    [faceted] has_custom_normals: True\n    [faceted] loops: 240, polygons: 80\n    [smooth]  has_custom_normals: False\n    [analysis] tris: 80 → expected GLB vertices ≈ 240 (shared Blender verts: 42)\n\nThe script creates two objects: faceted_icosphere (left) and smooth_icosphere (right). Select the faceted one. In the Properties panel → Mesh Data tab → Custom Split Normals: the section now appears. On the smooth sphere it's absent.\n\nThe vertex analysis line is worth studying: Blender internally uses 42 vertices for a subdivision-1 icosphere. The GLB will contain ~240 — one per loop, because every edge is a hard edge and the exporter must duplicate vertices at each split point.",
      },
      {
        title: "Inspect the custom split normals",
        body: "With faceted_icosphere selected, enable Viewport Overlays → Normals → Face (the tick that shows blue arrows on face centres). Every arrow points straight out from its face — perfectly perpendicular to the polygon surface.\n\nSelect smooth_icosphere. The face normals look similar visually, but the underlying split normals fan out, averaging across each vertex's adjacent faces. Hover over the mesh in Edit Mode with the normals overlay on to see per-loop normals (the tiny cyan lines) — they fan on the smooth sphere, they are parallel on the faceted one.\n\nThe custom_split_normals API in Blender 5.1:\n\n    # Blender 5.1 — no use_auto_smooth needed\n    loop_normals = [(0.0, 0.0, 0.0)] * len(mesh.loops)\n    for poly in mesh.polygons:\n        fn = (poly.normal.x, poly.normal.y, poly.normal.z)\n        for li in poly.loop_indices:\n            loop_normals[li] = fn\n    mesh.normals_split_custom_set(loop_normals)\n\nThree points worth remembering:\n• mesh.loops is indexed the same way as poly.loop_indices — allocate the full array up front.\n• poly.normal is the face normal; it's computed from the signed area of the polygon in 3D space.\n• normals_split_custom_set() normalises the vectors internally — you do not need to normalise fn before inserting.",
      },
      {
        title: "Export to GLB and verify",
        body: "The script calls bpy.ops.export_scene.gltf() with export_normals=True explicitly. That flag matters: without it the exporter omits normals from the NORMAL accessor and the runtime renderer computes them from position data — which is always smooth.\n\nIf you want to export manually: File → Export → glTF 2.0. In the Include section, tick 'Normals'. In Transform, tick '+Y Up'. Format: GLB. Only the faceted_icosphere should be selected.\n\nOnce the GLB is on disk, drag it into gltf-viewer.donmccurdy.com. Compare it against a plain sphere exported without custom normals. The facets should be visually identical to the Blender viewport. If they look smooth, the normals were not included — re-export with export_normals=True.\n\nAlternately, open the GLB in a hex editor or glTF Validator (validator.khronos.org) and confirm the normals accessor is present and not null.",
      },
      {
        title: "Apply the technique to your own mesh",
        body: "The helper function in tools/blender-addon/holoflow_macros/faceted_normals.py lets you call this from any script:\n\n    from holoflow_macros.faceted_normals import apply_faceted_normals\n    loops_processed = apply_faceted_normals(bpy.context.object.data)\n\nFor the holoflow_webxr_exporter add-on, mark the object with the holoflow_facet property (visible in the Holoflow panel in the Properties sidebar) and the export operator calls _apply_flat_facets() automatically before writing the GLB.\n\nOne mesh-topology note: the technique works best on triangulated meshes. Quads and n-gons have polygon normals too, but the split-vertex cost is higher (more loops per polygon). For a fully faceted low-poly object, triangulating before baking is a good habit.",
      },
    ],
    finalResult:
      "A faceted icosphere in Blender and a matching GLB at public/library/glbs/low-poly-shading/faceted-custom-split-normals/faceted_icosphere.glb — each face reads as a discrete plane at runtime in Three.js, identical to the Blender viewport. The technique is reusable via holoflow_macros/faceted_normals.py and is what the holoflow:facet exporter flag automates.",
    variations: [
      "Apply the technique to an existing sculpted mesh: Object Mode, apply all modifiers first (Apply as Shape Key if you have shape keys), then run apply_faceted_normals() on the data.",
      "Partial faceting: run the loop manually but only set face normals on selected polygon indices (poly.select == True) — lets you mix smooth and faceted zones on one mesh.",
      "Geometry Nodes version: add a 'Set Shade Smooth' node with Shade Smooth = False and plug it into the Group Output. This is Blender's UI-driven equivalent for non-scripted workflows, though it requires baking to custom normals before export (Object → Apply → Visual Geometry to Mesh, then run the script).",
      "Subdivision Surface + faceted normals: apply the SubD modifier first (Object → Apply → Modifier), then bake normals. You get a denser faceted mesh — useful for 3D-print export where you want tight facets on a curved surface.",
    ],
    troubleshooting: [
      {
        symptom:
          "has_custom_normals is still False after calling normals_split_custom_set()",
        cause:
          "The mesh was in Edit Mode when the call was made, or the normals sequence was empty.",
        fix: "Ensure the mesh object is in Object Mode (bpy.ops.object.mode_set(mode='OBJECT') before the call). Also confirm len(mesh.loops) > 0 — an empty mesh has no loops to set.",
      },
      {
        symptom: "GLB loads with smooth shading despite custom normals",
        cause: "export_normals was False or omitted in the export call.",
        fix: "Always pass export_normals=True to bpy.ops.export_scene.gltf(). Alternatively, in the manual export dialog, expand 'Include' and tick 'Normals'.",
      },
      {
        symptom:
          "The facets look correct in gltf-viewer but wrong in Three.js on the site",
        cause:
          "The Three.js material is using a FlatShading flag on the client side that overrides the normals from the GLB.",
        fix: "In the studio's SceneStage loader, check that the mesh material's flatShading property is not being set to true programmatically. The GLB normals should be the source of truth; flatShading = false in Three.js lets the per-vertex normals from the GLB drive the shading.",
      },
      {
        symptom:
          "Vertex count in the GLB is much higher than expected",
        cause:
          "Expected. A fully faceted mesh must duplicate every vertex at every hard edge so that each duplicate can carry a different normal. For 80 triangles, 240 GLB vertices is correct and normal.",
        fix: "No fix needed. Reduce tri count if the file size is a concern — subdivision=1 (80 tris) is already compact. The Draco-compressed GLB for this asset is under 5 kB.",
      },
    ],
  },
  base,
);

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";
import Link from "next/link";

function Body() {
  return (
    <>
      <p>
        Geometry Nodes is Blender&rsquo;s procedural geometry graph — a
        modifier that describes what the mesh should look like as a network
        of nodes rather than a sequence of edit operations. The graph
        evaluates at render time and on every parameter change: no destructive
        baking, no UV ceremony, no sculpting session that ends with an
        unsalvageable mesh. For terrain specifically, that live feedback loop
        is the whole workflow.
      </p>

      <p>
        Flat shading is what makes the faceted aesthetic land. A
        noise-displaced grid with smooth normals looks like a lumpy pillow;
        the same grid with flat normals reads as geological strata. The
        correct path in Blender 5.1 is the{" "}
        <strong>Set Shade Smooth</strong> node inside the GN tree, not the
        Object Data Properties toggle. The Object Data flag is reset on every
        modifier re-evaluation; the node is durable. The displacement must
        happen <em>before</em> flat normals are computed so the facets reflect
        the final vertex positions, not the pre-displaced base grid.
      </p>

      <p>
        The result is a parametric terrain that stays editable until the
        moment you apply the modifier for export. It drops straight into the
        studio&rsquo;s WebXR pipeline via{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline">
          the Blender-to-site asset pipeline
        </Link>
        , and the faceted look pairs directly with the cel-shading techniques
        documented in{" "}
        <Link href="/articles/low-poly-high-facet-shading">
          Low-poly + high-facet shading
        </Link>
        . For a printable variant the same mesh, once applied, passes straight
        through the{" "}
        <Link href="/tutorials/blender-addon-3d-print-toolbox">
          3D Print Toolbox
        </Link>{" "}
        validator with no additional preparation.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-geometry-nodes-low-poly-terrain",
  title: "Geometry Nodes — procedural low-poly faceted terrain in Blender 5.1",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Build a procedural faceted terrain from scratch using Geometry Nodes in Blender 5.1: Grid → flat shading → noise displacement → GLB export. No add-ons. No UVs. No sculpting. Expert walkthrough of the node graph, why each node was chosen, and the holoflow export flags.",
  Body,
  related: [
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly + high-facet shading",
      note: "The aesthetic rationale: why flat normals read better in XR and how to push the look with materials.",
    },
    {
      href: "/articles/cohesive-low-poly-cell-shaded-vrm-worlds",
      label: "Article — Cohesive low-poly cell-shaded VRM worlds",
      note: "How terrain, avatars, and the cel-shading pipeline sit together in the studio's visual language.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "The full GLB-to-WebXR handoff: Draco compression, WebP textures, Y-up, transform bake.",
    },
    {
      href: "/tutorials/blender-addon-3d-print-toolbox",
      label: "Tutorial — 3D Print Toolbox",
      note: "Validate the same terrain mesh for FDM printing — manifold, wall thickness, overhang checks.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/",
      label: "Blender Manual — Geometry Nodes",
      note: "Blender Foundation · CC BY-SA 4.0. The authoritative node reference, field-system explanation, and domain walkthrough.",
    },
    {
      href: "https://polyhaven.com/hdris",
      label: "Poly Haven — HDRI library",
      note: "Poly Haven contributors · CC0. Free equirectangular HDRIs for lighting terrain renders and the screen recording.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label: "glTF-Blender-IO — Khronos Group",
      note: "Apache-2.0. The exporter the studio's add-on wraps. Reading its README explains the Draco and Y-up flags used in blueprint.py.",
    },
  ],
};

export const entry = buildInstructable(
  {
    time: "two to three hours",
    difficulty: "intermediate",
    cost: "free — Blender core only, no add-ons",
    prerequisites: [
      "Blender 5.1. The glTF 2.0 I/O extension is enabled by default.",
      "Comfortable in the 3D Viewport: Numpad views, G/R/S transforms, Tab for Edit Mode.",
      "Geometry Nodes: aware of what a node graph is. Prior GN experience is not required — the tutorial builds the tree from an empty file.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "The entire tutorial runs inside the core application — no extensions needed.",
      },
    ],
    steps: [
      {
        title: "Open a clean file",
        body: "File → New → General. Delete the default cube, camera, and light (A → X → Delete). Save immediately as terrain_faceted.blend in public/library/blends/geometry-nodes/low-poly-terrain/ — the blueprint.py export path (//) resolves relative to this location.",
      },
      {
        title: "Add a Grid mesh",
        body: "Shift + A → Mesh → Grid. Press F9 to reopen the operator panel. Set X Subdivisions and Y Subdivisions to 47 (giving 48 verts per side = 4 608 triangles). Set Size to 10 m. 48 verts/side sits under the studio's 5 000-tri budget for a WebXR terrain patch while giving enough facets for the geological strata look to read.\n\nWHY Grid not a subdivided Plane: Grid sets the count directly in the operator with no extra steps.",
      },
      {
        title: "Add a Geometry Nodes modifier and open the editor",
        body: "With the Grid selected: Properties panel (wrench icon) → Add Modifier → Generate → Geometry Nodes. Click New to create a blank tree. Split the 3D Viewport by dragging the top-right corner left; set the new area's editor type to Geometry Node Editor. You will see Group Input and Group Output connected by a Geometry socket — the identity pass.",
      },
      {
        title: "Add Set Shade Smooth — toggle flat shading",
        body: "Shift + A → Geometry → Set Shade Smooth. Place it between Group Input and Group Output. Wire: Group Input Geometry → Set Shade Smooth Geometry → Group Output Geometry. In the node's properties, set Domain to Face and untick Shade Smooth. The viewport grid immediately renders faceted.\n\nWHY inside the GN tree: the Object Data Properties → Normals → Flat flag is overridden on every modifier re-evaluation in Blender 5.1. The node is the only durable path.",
      },
      {
        title: "Add a Position node and a Noise Texture",
        body: "Shift + A → Input → Position. This outputs the XYZ world position of each vertex as a field — it evaluates once per point. Shift + A → Texture → Noise Texture. Set Dimensions to 3D. Wire Position → Noise Texture Vector. Set Scale to 3.2, Detail to 4.0, Roughness to 0.65.\n\nWHY 3D noise at vertex positions: the noise field evaluates continuously at each vertex's location, giving coherent landforms rather than independent per-vertex random values. The Fac output is the 0..1 scalar you want.",
      },
      {
        title: "Map the noise to a displacement height",
        body: "Shift + A → Converter → Map Range. Set From Min/Max to 0.0/1.0 (the Noise Fac output range). Set To Min to 0.0, To Max to 1.6 (1.6 m peak height). Wire Noise Texture Fac → Map Range Value. You now have a per-vertex height scalar in metres.",
      },
      {
        title: "Apply the displacement via Set Position",
        body: "Shift + A → Utilities → Combine XYZ. Wire Map Range Result → Combine XYZ Z. Leave X and Y at 0.0. Shift + A → Geometry → Set Position. Wire Combine XYZ Vector → Set Position Offset. Complete the chain: Set Shade Smooth Geometry → Set Position Geometry → Group Output. The terrain displaces in the viewport.\n\nWHY Offset not Position: Position replaces the absolute XYZ of each vertex. Offset adds to current XY. Using Offset with X=0 Y=0 keeps the horizontal grid positions intact.",
      },
      {
        title: "Tune the terrain",
        body: "In the 3D Viewport, use Numpad 1 (front) + Numpad 5 (perspective) to read the silhouette. Adjust Noise Texture Scale: 1.5–2.0 gives broad plateaus, 5.0+ gives high-frequency choppy terrain. Roughness above 0.75 introduces noisy facets; below 0.5 the landforms are too gentle. 3.2 / 4.0 / 0.65 is the studio baseline.",
      },
      {
        title: "Set the holoflow export flag",
        body: "Select the terrain. Object Properties (the orange square icon) → Custom Properties → Add. Name: holoflow:facet, Type: Boolean, Value: True. This tells the studio's exporter to skip smooth-normal baking and export raw face normals — which is what flat shading requires.",
      },
      {
        title: "Apply transforms and the modifier, then export GLB",
        body: "Object → Apply → All Transforms (Ctrl + A). Then Object → Apply → All Modifiers. This realises the GN output as a plain mesh. The apply step is destructive — save a copy of the .blend with the modifier intact first.\n\nFile → Export → glTF 2.0. Format: GLB. Enable Draco (level 6). Image format: WebP. Enable Y Up. Use Selection only. Export as terrain_faceted.glb in this folder. If the holoflow_webxr_exporter add-on is installed, use its single-click Export button instead — it sets all flags automatically.",
      },
      {
        title: "Load the GLB into a WebXR scene",
        body: "Place terrain_faceted.glb in public/models/. In the WebXR Game Framework scene component, load it with useGLTF(). The mesh carries flat normals in the binary; three.js will render it faceted without any shader adjustment. See the Blender-to-site asset pipeline tutorial for the full handoff including the Draco loader hook.",
      },
    ],
    finalResult:
      "A procedural Blender 5.1 Geometry Nodes terrain that produces the studio's signature faceted look — parametric until the export step, then a Draco-compressed GLB ready for WebXR scenes, cel-shaded materials, or FDM printing.",
    variations: [
      "Set QUANTISE_STEPS to a positive value (e.g. 0.2) in blueprint.py to add a Math → Snap node after Map Range, snapping heights to discrete steps and giving a voxel-stepped look.",
      "Replace ShaderNodeTexNoise with ShaderNodeTexVoronoi for a cracked-earth or tiled-stone silhouette rather than rolling terrain.",
      "Add a second Set Position node after the first with a smaller noise at higher Scale (8.0+) for micro-surface detail on top of the macro landforms.",
      "In record.py, change FRAME_MORPH_END to 36 for a faster eruption cut, or extend FRAME_END to 240 for a slower camera orbit suitable for a loop background.",
    ],
    troubleshooting: [
      {
        symptom: "Terrain looks smooth, not faceted",
        cause: "Shade flat was applied via Object Data Properties, not the GN node, and was reset by a modifier re-evaluation.",
        fix: "Ensure the Set Shade Smooth node is in the GN tree with Shade Smooth = False and Domain = Face. Remove any flat-shade setting from Object Data Properties.",
      },
      {
        symptom: "Noise Texture shows a flat grey output — no variation across the terrain",
        cause: "The Position node is not wired into Noise Texture's Vector input. Without it, the texture evaluates at the world origin (one fixed value) for every vertex.",
        fix: "Wire GeometryNodeInputPosition → Position → ShaderNodeTexNoise → Vector.",
      },
      {
        symptom: "GLB loads in three.js as a white flat plane with no height",
        cause: "The GN modifier was not applied before export. The modifier evaluates in Blender's viewport but the export captured the base grid.",
        fix: "Object → Apply → All Modifiers before exporting. Alternatively, enable Apply Modifiers in the glTF exporter's Include section.",
      },
      {
        symptom: "bpy.ops.export_scene.gltf raises RuntimeError: context is incorrect",
        cause: "The operator requires an active object and a 3D Viewport context. Running blueprint.py in --background mode may not satisfy this.",
        fix: "Call bpy.ops.object.select_all(action='SELECT') and set bpy.context.view_layer.objects.active = obj before the export call. If running headless, consider the glTF-Blender-IO Python API path directly.",
      },
    ],
  },
  base,
);

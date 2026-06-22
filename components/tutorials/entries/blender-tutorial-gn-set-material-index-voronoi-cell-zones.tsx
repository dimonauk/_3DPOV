import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender assigns one integer per face — the <em>material slot index</em>{" "}
        — that selects which entry in the mesh&rsquo;s{" "}
        <code>materials</code> array renders that face. In Geometry Nodes the{" "}
        <strong>Set Material Index</strong> node accepts any integer field and
        writes it to the face domain in a single pass: fully procedural
        multi-material meshes, no UV atlases, no per-face hand-painting. This
        tutorial builds a flat-shaded ICO-sphere gem where four Principled
        BSDF materials (ruby, topaz, sapphire, obsidian) are distributed
        across Voronoi cell zones and exported as a multi-primitive WebXR GLB.
      </p>

      <h2>Slot stability — the one gotcha</h2>
      <p>
        <strong>
          Out-of-range slot indices are silently clamped to 0 with no error.
        </strong>{" "}
        If your GeoNode outputs index 3 but the mesh has only two material
        slots, every face assigned 3 renders as the first material. Always
        populate all slots on the mesh <em>before</em> adding the GeoNode
        modifier. blueprint.py calls{" "}
        <code>obj.data.materials.append(mat)</code> for all four gem
        materials before <code>obj.modifiers.new()</code>.
      </p>

      <h2>Why Voronoi gives stable integer zones</h2>
      <p>
        Voronoi Texture (3D · F1 · Euclidean) produces a{" "}
        <code>Color</code> output that is <em>constant</em> within each cell,
        seeded from the cell&rsquo;s hash. Extracting Color.X (range 0..1) and
        multiplying by <code>Num Slots</code> then flooring converts that
        continuous scalar into a repeatable slot index per zone. F1 mode
        gives hard-edged cell boundaries; SMOOTH_F1 would bleed gradients
        across them, turning sharp facet zones into blurry bands — wrong for
        this purpose.
      </p>

      <h2>Node pipeline</h2>
      <pre>{`Position → Voronoi (3D, F1, Euclidean, Scale=3)
          → Color → Separate XYZ → X
          → Math MULTIPLY (× Num Slots)
          → Math FLOOR
          → Float to Integer (FLOOR mode)
          → Set Material Index`}</pre>
      <p>
        The <strong>Float to Integer</strong> node (
        <code>FunctionNodeFloatToInt</code> in Blender 4.0+) is required:
        Set Material Index&rsquo;s Material Index socket is strictly typed as
        INT in Blender 5.1 and will flag a socket-type mismatch if you wire a
        Float directly from the FLOOR node.
      </p>

      <h2>GLB / WebXR export note</h2>
      <p>
        With <code>export_apply=True</code> the GLTF exporter splits the
        realised mesh into one primitive per unique material — four materials
        produce four draw calls. For performance-sensitive WebXR scenes, bake
        the four material zones to a single texture atlas after applying the
        modifier, then swap all slots for one atlas material. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-lightmap-bake-webxr-uv2"
          className={lk}
        >
          Cycles Lightmap Baking for WebXR
        </Link>{" "}
        tutorial for the UV2 + bake workflow.
      </p>

      <h2>Related studio tutorials</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-faceted-gem-flat-normals"
            className={lk}
          >
            Faceted Gem: Flat Normals
          </Link>{" "}
          — the base mesh this tutorial extends.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-corners-of-face-vertex-of-corner-faceted-gem-gradient"
            className={lk}
          >
            GN Corners of Face — Per-Face Gradient
          </Link>{" "}
          — corner-domain data on the same ICO gem geometry.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-shader-voronoi-cracked-ceramic-iridescence"
            className={lk}
          >
            Shader: Voronoi Cracked Ceramic &amp; Iridescence
          </Link>{" "}
          — compare Voronoi&rsquo;s Color output behaviour in the shader editor.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-cycles-lightmap-bake-webxr-uv2"
            className={lk}
          >
            Cycles Lightmap Baking — UV2 &amp; GLB Export
          </Link>
          .
        </li>
      </ul>

      <h2>Sources</h2>
      <ul>
        <li>
          Blender Foundation.{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/material/set_material_index.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Set Material Index — GN Manual
          </a>
          . CC0. Related:{" "}
          <a
            href="https://github.com/blender/blender-manual"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender/blender-manual
          </a>
          .
        </li>
        <li>
          Blender Foundation.{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/voronoi.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Voronoi Texture — Shader Nodes Reference
          </a>
          . CC0.
        </li>
        <li>
          Quilez, Inigo.{" "}
          <a
            href="https://iquilezles.org/articles/voronoi/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Voronoi Diagrams
          </a>
          . iquilezles.org, 2013. Free educational use. Explains the F1/F2
          distance-function duality behind Blender&rsquo;s Voronoi feature modes.
          Related: ShaderToy cellular-noise implementations.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-set-material-index-voronoi-cell-zones",
  title:
    "GN Set Material Index — Voronoi Cell Zones: Procedural Multi-Slot Material Masking on a Faceted Gem",
  date: "2026-06-22",
  kind: "tutorial",
  excerpt:
    "Drive Blender 5.1's Set Material Index node with a Voronoi integer field to paint four gem materials across organic cell zones on a flat-shaded ICO sphere — then export as a multi-primitive WebXR GLB.",
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/geometry-nodes/gn-set-material-index-voronoi-cell-zones/",
    time: "45–90 minutes",
    difficulty: "intermediate",
    overview:
      "Build the complete integer-field pipeline — Voronoi Texture → Color.X → Multiply → Floor → Float to Integer → Set Material Index — on a faceted ICO-sphere gem with four Principled BSDF gem materials, then export to WebXR GLB.",
    prerequisites: [
      "Can open Blender 5.1 and run a Python script from the Text Editor.",
      "Familiar with GeoNodes: Group Input/Output and at least one texture node.",
      "Knows how Blender material slots work (Properties → Material panel).",
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
        title: "Run blueprint.py",
        body: "File → New → General. Open the Text Editor (Shift+F11), load blueprint.py, click Run Script. Creates: flat-shaded ICO sphere with four gem materials in its material slots and HF_MatIdx GeoNode modifier applied.",
      },
      {
        title: "Inspect material slots",
        body: "Select voronoi_gem → Properties → Material. Confirm four slots in order: gem_ruby (0), gem_topaz (1), gem_sapphire (2), gem_obsidian (3). The slot order is the append order in blueprint.py. Reordering slots here shifts zone colours.",
      },
      {
        title: "Inspect the GeoNode tree",
        body: "Properties → Modifier → HF_MatIdx → Edit. Pan left-to-right: Position → Voronoi Texture → Separate XYZ → Math MULTIPLY → Math FLOOR → Float to Integer → Set Material Index → Group Output.",
      },
      {
        title: "Adjust Scale and Randomness",
        body: "In the modifier panel, set Scale to 1.0 (larger cells) then 6.0 (more cells). Set Randomness to 0.0 for a regular hexagonal grid, 1.0 for full entropy. Observe live updates in the viewport.",
      },
      {
        title: "Export GLB",
        body: "blueprint.py exports automatically. To re-export: File → Export → glTF 2.0 → enable Apply Modifiers, Draco Level 6, Images WebP → Save. The GLB will contain four mesh primitives (one per material).",
      },
    ],
    troubleshooting: [
      {
        symptom: "All faces show gem_ruby (slot 0)",
        cause:
          "Material slots not populated before the GeoNode modifier was added; out-of-range indices clamped to 0.",
        fix: "Run blueprint.py from a fresh file. In your own script, call obj.data.materials.append() for all materials before obj.modifiers.new().",
      },
      {
        symptom: "FunctionNodeFloatToInt raises AttributeError",
        cause: "Running Blender 3.x where the node ID was 'ShaderNodeFloatToInt'.",
        fix: "Use 'FunctionNodeFloatToInt' on Blender 4.0 and 5.x.",
      },
      {
        symptom: "Set Material Index socket type mismatch — expects INT",
        cause: "FLOOR node output is Float; Set Material Index requires INT in 5.1.",
        fix: "Insert FunctionNodeFloatToInt between FLOOR and Set Material Index.",
      },
      {
        symptom: "mod[socket.identifier] raises KeyError",
        cause: "Socket identifier (e.g. 'Socket_2') differs from assumed order.",
        fix: "Iterate ng.interface.items_tree and match by socket.name, not by assumed identifier. blueprint.py add_modifier() does this correctly.",
      },
      {
        symptom: "GLB has one primitive, all faces gem_ruby",
        cause: "Modifier not applied on export — original mesh has material_index=0 on all faces.",
        fix: "Enable Apply Modifiers in the GLTF export dialog, or apply the modifier manually before exporting.",
      },
    ],
    finalResult:
      "Flat-shaded ICO-sphere gem with four Principled BSDF materials distributed across Voronoi zones, exported as a multi-primitive WebXR GLB with Draco compression and live Scale/Randomness/Num Slots parameters in the modifier panel.",
    variations: [
      "Face-index stripes: replace Voronoi branch with Index → Math MODULO(Num Slots) → Float to Integer → Set Material Index.",
      "Proximity zones: replace Voronoi with Geometry Proximity node — faces near an empty object get one material, far faces another.",
      "Selection mask: wire a Compare node into Set Material Index's Selection input to restrict assignment to specific face regions.",
    ],
  },
  base,
);

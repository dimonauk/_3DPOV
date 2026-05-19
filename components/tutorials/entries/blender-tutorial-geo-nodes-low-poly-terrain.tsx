import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function GeoNodesTerrainBody() {
  return (
    <>
      <p>
        Geometry Nodes is Blender&rsquo;s procedural graph system — a
        modifier that rewires how geometry is evaluated rather than
        permanently altering the mesh. In Blender 5.1 the system
        stabilised around a clean fields model: every node in the graph
        receives a &ldquo;field&rdquo; (a lazy function over the
        geometry domain — vertex, edge, face) rather than a single
        value, so a noise expression written once applies per-vertex
        without any explicit loop.
      </p>
      <p>
        This tutorial builds a faceted low-poly terrain tile from
        scratch via the GN graph: a flat grid, a Noise Texture node
        displacing Z, and a Set Shade Smooth node forcing flat shading
        per face. The modifier stays live — you drag a slider,
        the terrain reshapes in real time. When you&rsquo;re happy, one
        checkbox bakes it for a clean GLB export that lands in
        three.js without drama.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-geo-nodes-low-poly-terrain",
  title: "Geometry Nodes — faceted low-poly terrain in Blender 5.1",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "Build a live procedural terrain tile using Geometry Nodes in Blender 5.1: grid → noise displacement → flat shading → GLB export. The modifier stays editable; a single checkbox bakes it for three.js.",
  Body: GeoNodesTerrainBody,
  related: [
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "The downstream GLB → site wiring that consumes what this tutorial produces.",
    },
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly high-facet shading",
      note: "The art direction behind why flat-shaded facets are the studio's default aesthetic.",
    },
    {
      href: "/articles/cohesive-low-poly-cell-shaded-vrm-worlds",
      label: "Article — Cohesive low-poly cell-shaded VRM worlds",
      note: "How terrain tiles fit into the wider VRM + WebXR scene vocabulary.",
    },
    {
      href: "/atelier/scene-stage-demo",
      label: "Atelier — Scene Stage demo",
      note: "A live WebXR scene that can host a terrain GLB produced by this tutorial.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/write/set_position.html",
      label: "Blender Manual — Set Position (Geometry Nodes)",
      note: "The exact node driving the displacement in this tutorial. CC-BY-SA 4.0 · Blender Foundation.",
    },
    {
      href: "https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/noise.html",
      label: "Blender Manual — Noise Texture",
      note: "Documents every parameter on the Noise Texture node — Scale, Detail, Roughness, Lacunarity, Distortion. CC-BY-SA 4.0 · Blender Foundation.",
    },
    {
      href: "https://github.com/blender/blender/tree/main/scripts/modules",
      label: "Blender source — bpy Python modules",
      note: "The canonical reference for which node type strings are valid in bpy.data.node_groups context. GPL-2.0 — read-only reference.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "one focused session — 45 minutes to an hour",
    difficulty: "intermediate",
    cost: "free — Blender is open-source, technique uses only built-in nodes",
    prerequisites: [
      "Blender 5.1 installed. The technique uses built-in Geometry Nodes; no extensions needed.",
      "Comfortable with the 3D Viewport basics: Add menu, selecting objects, the Properties panel.",
      "Aware that Geometry Nodes is a modifier — you don't need to understand fields theory yet, but knowing modifiers stack non-destructively helps.",
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
        title: "New file — set units, clear defaults",
        body: "File > New > General. In Scene Properties (camera icon) set Units to Metric, Unit Scale 1.0. This matters because the GLB exporter treats one Blender unit as one metre; mismatched scale cascades through the WebXR scene.\n\nDelete the default cube, camera, and light (A to select all, X to delete). A clean scene avoids confusion when the modifier panel fills with unexpected objects.",
      },
      {
        title: "Add a Grid primitive",
        body: "Add > Mesh > Grid. In the Last Operator panel (bottom-left of viewport, or F9): X Subdivisions 20, Y Subdivisions 20, Size 10. This gives 400 square faces — plenty of definition for terrain at WebXR camera distances without overrunning the Quest 3 vertex budget.\n\nRename the object: double-click its name in the Outliner and type `terrain_low_poly`. British spelling note: the file format convention uses underscores, not hyphens.",
      },
      {
        title: "Add a Geometry Nodes modifier",
        body: "With the grid selected, open Properties > Modifier Properties (the spanner icon). Click Add Modifier > Geometry Nodes. Blender creates a minimal node tree: Group Input → Group Output. Click the node tree name field and rename it `HoloflowTerrainGN`.\n\nSwitch to the Geometry Node Editor workspace (top toolbar, or open a new editor and set its type). You should see the two stub nodes.",
      },
      {
        title: "Add the displacement chain",
        body: "In the Geometry Node Editor:\n\nAdd > Input > Position (shortcut: Shift+A, search 'Position'). This node outputs each vertex's current XYZ as a Vector.\n\nAdd > Texture > Noise Texture. Connect Position.Vector → Noise Texture.Vector. Set Noise Dimensions to 3D (the dropdown on the node — 3D noise treats each XY position differently in Z; 2D noise would produce a flat sheet of ripples).\n\nAdd > Geometry > Write > Set Position. Wire:\n  Group Input.Geometry → Set Position.Geometry\n  Set Position.Geometry → Group Output.Geometry\n\nThe displacement offset is a Vector. Add > Utilities > Vector > Combine XYZ. Connect Set Position.Offset ← Combine XYZ.Vector. Leave X and Y at 0; connect Noise Texture.Fac → a Math node (Multiply) → Combine XYZ.Z. This routes noise only into the vertical axis.",
      },
      {
        title: "Expose Height Scale and Noise Scale as panel sliders",
        body: "Select Group Input. In the N-panel (N key) under Group, click + to add an input socket. Type: Float, Name: Height Scale. Set Default 2.0, Min 0, Max 5. Add another: Noise Scale, Default 3.5, Min 0.1, Max 10.\n\nWire Group Input.Height Scale → Math.Value 1 (the second input of the Multiply node). Wire Group Input.Noise Scale → Noise Texture.Scale.\n\nNow drag the sliders in the modifier panel (Properties > Modifier Properties > HoloflowTerrainGN). The terrain reshapes live. This is the entire reason to build it in GN rather than the old Displace modifier — the parameters are first-class UI controls.",
      },
      {
        title: "Force flat shading inside the graph",
        body: "Add > Geometry > Write > Set Shade Smooth. Insert it between Set Position and Group Output:\n  Set Position.Geometry → Set Shade Smooth.Geometry → Group Output.Geometry\n\nIn the node's panel, set Domain to Face, and untick Shade Smooth (the boolean socket; default is True, meaning smooth). Setting it False means the renderer uses each face's own normal — no interpolation across the edge — which produces the hard-edge faceted silhouette.\n\nWhy do it inside GN rather than via the Object menu? Because the GN-applied flat shading survives modifier apply and GLB export without needing a separate 'shade flat' operator call. It's self-contained.",
      },
      {
        title: "Assign a material",
        body: "Open Properties > Material Properties. New material; name it `terrain_mat`. Set Base Color to a muted olive green (hex ~56 7A 47). Roughness 1.0, Metallic 0.0.\n\nMaterial Preview mode (Z → Material Preview) shows the facets catching light differently across the terrain — this is the cel-shading substrate. The Freestyle line render or a Toon BSDF swap happens at render time; the base material just needs Roughness 1.0 so specular doesn't blow out the facet reads.",
      },
      {
        title: "Apply and export as GLB",
        body: "When the terrain reads well, apply the modifier: right-click the modifier in Properties > Apply. This bakes 400 flat-shaded faces into the mesh.\n\nFile > Export > glTF 2.0. Settings:\n  Format: GLB\n  ✓ Apply Modifiers (if you haven't applied manually)\n  ✓ Draco mesh compression, Level 6\n  ✓ +Y Up\n  Selection only: ✓\n\nSave to `public/library/glbs/terrain/geo-nodes-low-poly-terrain/terrain_low_poly.glb`. The file should weigh ~15-20 KB compressed.",
      },
    ],
    finalResult:
      "A 400-face flat-shaded terrain tile as a GLB, ~18 KB Draco-compressed, +Y up, with a green studio material applied. Loads in three.js via GLTFLoader + DRACOLoader. The source .blend retains the live GN modifier so parameters can be tweaked and re-exported. Feeds directly into the Blender-to-site pipeline and drops into any SceneStage WebXR scene.",
    variations: [
      "Swap Noise Texture for Voronoi Texture (Geometry Nodes version) to produce a cracked-earth or rocky pattern instead of rolling hills.",
      "Add a second Set Position node offset by a separate noise octave at half the scale and a tenth of the height — the subtle micro-detail reads as gravel or tundra at close range.",
      "Tile the terrain: duplicate the grid four times in a 2×2 layout, setting Noise Texture to World Space coordinates so the seams match seamlessly.",
      "Replace flat shading with smooth shading, then add the Subdivision Surface modifier — this flips the aesthetic from angular low-poly to smooth organic terrain for a completely different biome feel.",
      "Add vertex colour painting after applying the modifier: paint altitude bands (sand at base, green mid, grey high) and use them as a factor in the material node tree.",
    ],
    troubleshooting: [
      {
        symptom: "Terrain appears completely flat after wiring the noise",
        cause: "The Combine XYZ Z socket is wired to Set Position's Position input (absolute) rather than Offset. Position replaces the vertex's location; Offset adds to it.",
        fix: "Re-check the Set Position node. The bottom socket is Offset (the delta); wire Combine XYZ.Vector there. The top non-geometry socket is Position (absolute). With Offset, a value of (0, 0, 0.5) lifts each vertex 0.5 m; with Position, it moves every vertex to the same absolute Z.",
      },
      {
        symptom: "Viewport shading looks smooth despite Set Shade Smooth = False",
        cause: "The Object menu's 'Shade Smooth' was applied separately and overrides the GN instruction in the viewport.",
        fix: "Right-click the object > Shade Auto Smooth > set to 0°, or just right-click > Shade Flat. The GN node takes precedence at render and export time; the viewport overrides are cosmetic only.",
      },
      {
        symptom: "'NodeSocketGeometry' error when running blueprint.py",
        cause: "Running blueprint.py in Blender 4.1 or earlier, where the .interface API for node trees doesn't exist.",
        fix: "Upgrade to Blender 4.2+ (5.1 recommended). The ng.interface.new_socket() call was introduced in 4.0 and is stable in 5.1.",
      },
      {
        symptom: "GLB loads in three.js but vertices are not flat-shaded — edges look smooth",
        cause: "The GLB exporter merged vertices at shared edges, losing the per-face normal data.",
        fix: "Before exporting, apply Edge Split modifier (threshold 180°) to split the geometry at every edge. This duplicates shared vertices so each face has its own normal in the export. Alternatively, enable 'Export Vertex Colors' and bake flat normals into vertex normal data.",
      },
    ],
  },
  base,
);

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function ModularTreeBody() {
  return (
    <>
      <p>
        Modular Tree is the node-based procedural tree generator the
        studio leans on whenever a scene needs vegetation that
        isn&rsquo;t a stock Polyhaven asset. You wire a small node tree
        &mdash; trunk &rarr; branches &rarr; leaves &rarr; output
        &mdash; and the add-on grows a tree to spec. The grown mesh is
        a real Blender object you can edit, decimate, and export.
      </p>

      <p>
        What makes it especially relevant to the studio: the add-on
        also writes a <strong>pivot-painter texture</strong>, the data
        layout Unreal&rsquo;s and Unity&rsquo;s wind-shaders consume to
        animate leaves and branches at runtime without paying skinned-mesh
        costs. The same tree mesh used in the WebXR scene re-uses the
        pivot data when the asset is taken into Unreal for the
        photogrammetry-pipeline visualisation work.
      </p>

      <p>
        The goal of this tutorial: grow a small deciduous tree from a
        Modular Tree node graph, export the mesh as glTF for the
        WebXR site, and export the pivot-painter texture for Unreal
        consumption. An hour.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-addon-modular-tree",
  title: "Modular Tree — procedural trees with pivot-painter export",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "An hour. Use the Modular Tree extension's node-based generator to grow a small deciduous tree in Blender, export the mesh as glTF for the WebXR scene, and write the pivot-painter texture for Unreal's wind shader to consume.",
  Body: ModularTreeBody,
  related: [
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "Where the tree mesh lands on the website.",
    },
    {
      href: "/tutorials/unreal-pixel-streaming-browser-delivery",
      label: "Tutorial — Unreal Pixel Streaming",
      note: "The sibling Unreal tutorial — same tree, different runtime.",
    },
  ],
  furtherReading: [
    {
      href: "https://extensions.blender.org/add-ons/modular-tree/",
      label: "Modular Tree — extensions.blender.org",
      note: "Official extension listing.",
    },
    {
      href: "https://github.com/GoodPie/modular_tree",
      label: "Modular Tree on GitHub",
      note: "Source, presets, pivot-painter format reference.",
    },
    {
      href: "https://dev.epicgames.com/community/learning/tutorials/RmoB/unreal-engine-pivot-painter",
      label: "Unreal — Pivot Painter foliage tutorial",
      note: "The receiving side — wiring the pivot texture into the UE wind shader.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "an hour",
    difficulty: "intermediate",
    cost: "free",
    prerequisites: [
      "Blender 4.3+ with the Modular Tree extension installed (declares 4.3 minimum because of the wheel-bundled m_tree native lib).",
      "Comfortable with Blender's node editors — Modular Tree introduces its own node graph in a new editor type.",
      "If targeting Unreal: UE 5.x with the Pivot Painter material function library — included in the engine, no plugin needed.",
    ],
    supplies: {},
    software: [
      {
        name: "Blender",
        version: "4.3+ (5.1 on the studio bench)",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
      {
        name: "Modular Tree (Blender extension)",
        version: "5.5.0+",
        url: "https://extensions.blender.org/add-ons/modular-tree/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Bundles a native m_tree Python wheel — Windows / macOS / Linux all supported via the manifest's platforms list.",
      },
      {
        name: "Unreal Engine",
        version: "5.7 or 5.8",
        url: "https://www.unrealengine.com/en-US/download",
        cost: "free for non-game commercial use",
        platforms: ["windows", "macos"],
        note: "Only needed if you want to consume the pivot-painter texture in Unreal — otherwise the glTF export alone is enough for the WebXR side.",
      },
    ],
    steps: [
      {
        title: "Open the Modular Tree editor",
        body: "After installing the extension, a new editor type is available next to the Geometry Nodes editor. Open it from any panel: Editor Type dropdown > Tree Nodes.\n\nAdd a new node tree (the 'New' button at the top of the editor). The graph appears empty. Modular Tree thinks in terms of growth nodes — Trunk, Branch, Pipe Radius, Leaf, Tree Mesher — wired together to produce the final geometry.",
      },
      {
        title: "Wire the basic tree",
        body: "Add nodes: Trunk Node (Add > Tree > Trunk), Branch Node (Add > Tree > Branch), Pipe Radius Node, Leaf Shape Node, and a Tree Mesher Node as the output.\n\nConnect: Trunk → Branch (the branch grows off the trunk), Branch → Pipe Radius (the pipes get a thickness), Pipe Radius → Tree Mesher (the mesher converts pipes into geometry), Leaf Shape → Tree Mesher (leaves land on branch tips).\n\nThe Tree Mesher output is now a node-graph procedural tree. Click 'Build Tree' in the side panel to evaluate the graph and produce a Blender mesh.",
      },
      {
        title: "Tune the parameters",
        body: "Each node exposes its parameters in the side panel when selected: trunk length, trunk taper, branch count, branch spread angle, leaf size, leaf count per branch.\n\nStart with defaults; tweak trunk length to 3 m, branch count to 8, leaf size to 0.15 m for a young birch-like tree. Click Build Tree after each parameter change; the mesh regenerates in seconds.\n\nThe seed parameter on the Trunk Node controls the random variation — same seed produces the same tree, change the seed for a different individual.",
      },
      {
        title: "Apply a leaf material",
        body: "Modular Tree separates the trunk + branch geometry from the leaf geometry — they appear as two material slots on the built mesh. Apply a bark material to slot 0, a leaf material to slot 1.\n\nThe leaf material wants alpha-clipped transparency — set the material's Blend Mode to 'Alpha Clip', Shadow Mode to 'Alpha Clip', and feed a leaf cutout texture into the alpha channel. The studio uses Polyhaven leaf textures as the source.",
      },
      {
        title: "Export the glTF for WebXR",
        body: "Select the tree object, File > Export > glTF 2.0. The standard studio export settings — Y-up, apply transforms, Draco compression level 6, WEBP textures — apply here. The leaf alpha-clip transparency carries through glTF correctly.\n\nThe .glb drops into public/models/<scene>/tree-<seed>.glb on the WebXR site, register in the scene catalogue, done.",
      },
      {
        title: "Export the pivot-painter texture for Unreal",
        body: "Add a Pivot Painter Node to the graph (Add > Export > Pivot Painter). Connect the Tree Mesher's geometry output into the pivot-painter input. Set Target Engine to 'Unreal Engine 5'.\n\nClick 'Bake Pivot Painter Texture'. The add-on writes a 16-bit EXR texture encoding per-vertex pivot positions, child indices, and rotation axes — the layout UE's pivot-painter material function expects.\n\nThe texture lands next to the saved .blend file. Read the UE5_MATERIAL_SETUP.md bundled with the extension for the exact wiring on the Unreal side (it ships at python_classes/pivot_painter/UE5_MATERIAL_SETUP.md inside the extension directory).",
      },
    ],
    finalResult:
      "A procedural tree mesh exported as glTF for the WebXR scene, with the same tree's pivot-painter texture exported for Unreal's wind shader. The mesh re-uses across both runtimes; the wind animation only activates when the pivot data is wired up on the Unreal side. The pattern the studio uses for any cross-runtime vegetation asset.",
    variations: [
      "Swap the leaf shape for a custom mesh (Pine Needle Node) for conifers — the same workflow produces fir / pine.",
      "Animate the tree's seed parameter to produce a per-frame variation, render as a sprite sheet for stylised foliage.",
      "Use the Adaptive Branch parameters to grow the tree against a wind direction — produces a permanently wind-bent silhouette useful for environmental storytelling.",
      "Bake the pivot-painter texture for Unity instead — the Pivot Painter node has a Unity target that writes the alternate texture layout Unity's stock wind shader expects.",
    ],
    troubleshooting: [
      {
        symptom: "Build Tree button does nothing",
        cause: "Output node (Tree Mesher) isn't connected, or no Trunk node exists.",
        fix: "Every Modular Tree graph needs at least one Trunk node feeding into a Tree Mesher. Add the missing node, wire it, re-build.",
      },
      {
        symptom: "Pivot-painter texture writes but Unreal foliage doesn't animate",
        cause: "Texture imported into Unreal as sRGB — the per-vertex data was gamma-corrected and now lies about positions.",
        fix: "In UE, set the imported texture's compression to 'HDR (RGB, no sRGB)' and untick the sRGB flag. The pivot data now reads correctly.",
      },
      {
        symptom: "Tree builds with no leaves",
        cause: "Leaf Shape Node not connected, or Leaf material slot is empty so the leaves are invisible.",
        fix: "Verify the Leaf Shape → Tree Mesher connection; verify the second material slot has a non-empty leaf material assigned.",
      },
    ],
  },
  base,
);

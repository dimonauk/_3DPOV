import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function GnInstanceBody() {
  return (
    <>
      <p>
        The Tissue add-on tessellates a component onto every face of a target
        surface by modifying the mesh topology &mdash; it is a deformation
        operation with a fixed output.  Geometry Nodes&rsquo; Instance on Points
        workflow does the same thing differently: the instances are lightweight
        transform references until <code>Realize Instances</code> collapses
        them, which means you can have a hundred thousand diamonds on a surface
        with the viewport cost of one diamond, and you can change the density,
        the tile shape, and the rotation seed from a modifier panel without
        re-running anything.
      </p>

      <p>
        The pattern is three nodes connected: <code>Distribute Points on
        Faces</code> turns the target surface into a Poisson-distributed point
        cloud; <code>Instance on Points</code> places a reference to the tile
        geometry at each point; <code>Realize Instances</code> collapses the
        tree to real geometry before export.  That&rsquo;s the entirety of the
        graph.  The expertise is in understanding what each node&rsquo;s
        parameters do and why the collapse step is mandatory for GLB.
      </p>

      <p>
        This tutorial builds the graph entirely via the Python data API &mdash;
        no operator calls, so the script runs headlessly without a window
        manager.  The approach is consistent with the GN terrain blueprint:
        build the <code>node_groups</code> tree by writing directly to
        <code>tree.nodes</code> and <code>tree.links</code>.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-instance-on-points",
  title: "Geometry Nodes — Instance on Points: procedural scatter in Blender 5.1",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "An afternoon. Build the Distribute Points on Faces → Instance on Points → Realize Instances graph via the Python data API, scatter a studio tile across a surface with live density and seed controls, and export a production GLB. The procedural alternative to the Tissue add-on for tiling and scatter patterns.",
  Body: GnInstanceBody,
  related: [
    {
      href: "/tutorials/blender-addon-tissue",
      label: "Tutorial — Tissue tessellation",
      note: "The modifier-based tessellation approach. GN Instance on Points is the same goal, different route — GN wins on density and procedural control; Tissue wins on per-face projection accuracy.",
    },
    {
      href: "/tutorials/blender-tutorial-geometry-nodes-low-poly-terrain",
      label: "Tutorial — GN procedural low-poly terrain",
      note: "The sibling GN tutorial. Both build node trees via bpy.data; the terrain tutorial covers displacement, this one covers scattering.",
    },
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly + high-facet shading",
      note: "The studio's aesthetic case for low-poly faceted geometry — the article behind every scatter-tile tutorial.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "Where the exported GLB goes after this tutorial: into the WebXR scene.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/point/distribute_points_on_faces.html",
      label: "Blender Manual — Distribute Points on Faces",
      note: "Official documentation for the Poisson and Random distribution methods, density inputs, and the point-domain output. CC-BY-SA 4.0 · Blender Foundation.",
    },
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "njanakiev/blender-scripting (MIT)",
      note: "MIT-licensed Blender Python scripting examples. The data-API node-tree building patterns used in this tutorial's blueprint are consistent with the style this repository demonstrates. Author: Nikolai Janakiev.",
    },
    {
      href: "https://docs.blender.org/api/current/bpy.types.GeometryNodeTree.html",
      label: "Blender Python API — GeometryNodeTree",
      note: "Full API reference for the GN tree, including interface.new_socket() and the nodes / links collections. CC-BY 4.0 · Blender Foundation.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon — 2 to 3 hours",
    difficulty: "intermediate",
    cost: "free",
    prerequisites: [
      "Blender 5.1 installed. The tutorial uses the 4.0+ GN interface API (tree.interface.new_socket); anything older will fail silently on the socket setup.",
      "Comfortable with the Geometry Node Editor. You do not need to know every node, but you should know how to add nodes (Shift+A), connect sockets, and read the data-flow left-to-right.",
      "The GN terrain tutorial (/tutorials/blender-tutorial-geometry-nodes-low-poly-terrain) is a useful precursor — it covers building a GN tree via bpy.data in the same style used here.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Requires 4.0+ for the tree.interface API. All node type strings are verified against 5.1.",
      },
    ],
    steps: [
      {
        title: "Understand the three-node graph",
        body: "The entire scatter pattern comes from three GN nodes:\n\n1. Distribute Points on Faces — takes a mesh, outputs a point cloud.\n2. Instance on Points — takes a point cloud and a geometry, places one instance of the geometry at each point.\n3. Realize Instances — collapses the instance tree into actual geometry.\n\nOpen Blender, add a Plane (Shift+A > Mesh > Plane), scale it to 8. Go to Properties > Modifier (spanner icon), add a Geometry Nodes modifier. Open the GN Editor (Shift+F3 or the GN workspace).\n\nAdd a Distribute Points on Faces node (Shift+A > Point > Distribute Points on Faces). Wire the Group Input Geometry into its Mesh socket. Add an Instance on Points node (Shift+A > Instances > Instance on Points). Wire the Points output of Distribute into Instance on Points's Points socket. Add a Realize Instances node (Shift+A > Instances > Realize Instances). Wire Instances output → Realize Instances. Wire Realize Instances → Group Output Geometry.\n\nAt this point the modifier chain is complete but you have no instance geometry yet — the 'Instance' socket on Instance on Points is empty.",
      },
      {
        title: "Build and connect the tile geometry",
        body: "You need a piece of geometry to scatter. Add a second object — a UV sphere or icosphere at low resolution (Shift+A > Mesh > Ico Sphere, set Subdivisions to 1). Scale it to 0.2.\n\nBack on the ScatterSurface object, in the GN editor: add an Object Info node (Shift+A > Input > Object Info). Set its Object field to your tile object (click the eyedropper, then click the sphere in the viewport). Set Transform Space to Relative — this keeps the tile at the scale you set on the object rather than world-origin scale.\n\nWire Object Info Geometry → Instance on Points Instance socket.\n\nThe viewport should now show a scattered field of spheres. If it is empty: check that the tile object is in a collection that is visible in the scene, and that the Distribute Points density is above zero.",
      },
      {
        title: "Tune the scatter with Poisson distribution",
        body: "Select the Distribute Points on Faces node. In the left panel (N-key or the node itself), set the method to Poisson Disk.\n\nPoisson Disk uses a minimum-distance algorithm — no two points will be closer than a threshold, so the scatter stays visually uniform without clumping. Random mode produces clusters and voids, which can look unnatural at low density.\n\nSet Density Max to 6 (6 points per square metre). Set Seed to 42. Change the seed to any other integer — the tile positions rerandomise but the density stays the same.\n\nFor the studio's scale-mail at close viewing distance: use density 8–12, Poisson mode. For a loose scattered field at mid-distance: 2–4, either mode.",
      },
      {
        title: "Add random Z rotation",
        body: "A uniform-orientation scatter looks mechanical. Add a Random Value node (Shift+A > Utilities > Random Value). Set Data Type to Float. Set Min to 0, Max to 6.28318 (2π — one full rotation).\n\nAdd a Rotate Instances node (Shift+A > Instances > Rotate Instances). Insert it between Instance on Points and Realize Instances: wire Instance on Points Instances → Rotate Instances Instances, then Rotate Instances Instances → Realize Instances.\n\nWire Random Value Value → Rotate Instances Rotation Z.\n\nThe tiles now each carry a different Z rotation. The Seed on Distribute Points on Faces does not affect the Random Value node independently; for independent seeds, add an Integer input to the GN tree and wire it to Rotate's Rotation input through a second Random Value.",
      },
      {
        title: "Scale instances from the modifier panel",
        body: "The Instance on Points node has a Scale input. Currently it uses a constant (Vector 1, 1, 1). To expose it to the modifier panel:\n\nAdd a Group Input node (or use the existing one). Add a new Vector input: right-click in the node editor sidebar, Add Input > Vector. Name it 'Tile Scale'. Wire it to the Scale socket of Instance on Points.\n\nIn Properties > Modifier > ScatterGN, the Tile Scale field now appears. Set it to (0.25, 0.25, 0.25) for the diamond tiles at the right density.\n\nThis is the live parameter workflow: you iterate on density and scale in the modifier panel without reopening the node editor.",
      },
      {
        title: "Export as GLB",
        body: "The critical step: File > Export > glTF 2.0 (.glb/.gltf).\n\nIn the export panel, under Data > Mesh, ensure 'Apply Modifiers' is ticked. This is what triggers the full GN evaluation including Realize Instances.\n\nWithout 'Apply Modifiers': the exported GLB will be the bare plane geometry — the modifier stack is not baked, the tiles are not in the file.\n\nWith 'Apply Modifiers' but without Realize Instances in the node graph: the GLB exporter receives the Instance geometry tree, which it does not serialise. The file will be empty or contain only the surface plane.\n\nBoth 'Apply Modifiers' and 'Realize Instances' in the graph are required for a correct GLB export of instanced geometry.",
      },
      {
        title: "Verify in the browser",
        body: "Load the GLB into https://gltf.report/. Under the Mesh inspector, you should see a single mesh with vertex count matching (number of tiles × verts per tile). The tiles should be spread across the surface at the density you set.\n\nFor the studio's WebXR pipeline: drop the GLB into public/models/ and reference it via the asset pipeline tutorial (/tutorials/blender-to-site-asset-pipeline). Scale-mail and hex-mail panels exported this way land in the scene at one draw call — the entire scatter is one mesh after Realize Instances.",
      },
    ],
    finalResult:
      "A procedural scatter panel: a flat grid covered with hundreds of tile instances, each randomly rotated, exported as a single-mesh GLB ready for WebXR. The modifier stack stays live — density, seed, tile geometry, and scale are all adjustable parameters. Swap the tile for any geometry to get scale-mail, hex-mail, rivet fields, or any other tiling pattern the studio's print or render pipeline needs.",
    variations: [
      "Scatter on a curved surface: replace the flat grid with a subdivided, shaped mesh. The Distribute Points node handles curved and non-planar surfaces; the point density adapts to the local face area.",
      "Swap the tile at any time: change the Object Info node's Object input to a different object. The entire scatter updates live. Use this to iterate tile designs without rebuilding the graph.",
      "Density masking: add a texture (e.g. a gradient or noise) as a Density attribute input to Distribute Points on Faces. The tiles will appear only where the texture is bright — useful for worn-edge scatter effects or growing-in animations.",
      "Animate the scatter: keyframe the Seed input on Distribute Points. The tiles jump to new positions each frame — animate slowly for a spreading effect or quickly for a particle-burst read.",
      "Weight paint scatter: paint a Vertex Group on the target mesh and pipe it into the Density Factor input of Distribute Points. Tiles concentrate in painted areas, leaving unpainted areas bare.",
    ],
    troubleshooting: [
      {
        symptom: "Exported GLB is an empty flat plane — no tile geometry",
        cause: "Either Realize Instances is missing from the node graph, or 'Apply Modifiers' was not ticked in the export dialog.",
        fix: "Check the node graph ends with Realize Instances → Group Output. Re-export with Apply Modifiers checked.",
      },
      {
        symptom: "tree.interface.new_socket() raises AttributeError",
        cause: "Running blueprint.py on Blender 3.x or early 4.x. The interface API requires 4.0+.",
        fix: "Update to Blender 4.0 minimum. On 5.1 the method is stable.",
      },
      {
        symptom: "Viewport shows instances but they are all at origin, not spread across the surface",
        cause: "The Object Info node's Transform Space is set to 'Original' rather than 'Relative'. Original evaluates the tile at its world-origin transform, not at each point.",
        fix: "In the Object Info node, set Transform Space to Relative.",
      },
      {
        symptom: "Distribute Points on Faces produces no points at Poisson mode",
        cause: "The Density Max value is below the reciprocal of the surface area — the minimum-distance requirement leaves no valid positions.",
        fix: "Increase Density Max, or switch to Random mode for a first test. For an 8 m² surface, a density of 1 should always place at least one point.",
      },
    ],
  },
  base,
);

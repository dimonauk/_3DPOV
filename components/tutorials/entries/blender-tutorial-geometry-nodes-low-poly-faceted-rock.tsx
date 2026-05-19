import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function Body() {
  return (
    <>
      <p>
        A faceted rock is the simplest shape that proves a pipeline. Make one
        procedurally and you have a Geometry Nodes pattern you can apply to any
        organic form — boulders, cliff faces, stylised terrain. The technique is:
        start with a near-uniform icosphere, subdivide it inside a GN modifier,
        displace every vertex along its own surface normal by a noise-driven amount,
        then flat-shade the result so the angular face boundaries read as hard edges.
        Three nodes do the displacement work; one does the aesthetic work.
      </p>

      <p>
        The studio uses this pattern as the first test of a new Blender install.
        The <code>blueprint.py</code> script in{" "}
        <code>public/library/blends/geometry/low-poly-faceted-rock/</code> builds
        the entire GN tree from the data API — no UI wiring needed. Run it once and
        you have a GLB ready for the three.js scene. It also demonstrates the correct
        Blender 5.1 node-group interface API (<code>ng.interface.new_socket</code>),
        which replaced the <code>ng.inputs.new</code> / <code>ng.outputs.new</code>{" "}
        pattern that still appears in most older tutorials online.
      </p>
    </>
  );
}

const base: Entry = {
  slug:  "geometry-nodes-low-poly-faceted-rock",
  title: "Geometry Nodes — procedural low-poly faceted rock",
  date:  "2026-05-19",
  kind:  "tutorial",
  excerpt:
    "Build a procedural faceted rock in Blender 5.1 using a Geometry Nodes modifier: " +
    "icosphere → subdivide → noise-driven normal displacement → flat shading. " +
    "The full node tree is scripted via the bpy data API and exported as a Draco-compressed GLB.",
  Body,
  related: [
    {
      href:  "/articles/low-poly-high-facet-shading",
      label: "Article — Low-poly high-facet shading",
      note:  "The art-direction theory behind why flat shading reads the way it does.",
    },
    {
      href:  "/articles/cohesive-low-poly-cell-shaded-vrm-worlds",
      label: "Article — Cohesive low-poly cell-shaded VRM worlds",
      note:  "How faceted geometry fits into a complete scene aesthetic.",
    },
    {
      href:  "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note:  "Where the exported GLB goes and how it reaches the browser.",
    },
  ],
  furtherReading: [
    {
      href:  "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/",
      label: "Blender Geometry Nodes Reference Manual",
      note:  "CC-BY-SA 4.0, Blender Foundation. The authoritative node reference.",
    },
    {
      href:  "https://docs.blender.org/api/current/bpy.types.GeometryNodeTree.html",
      label: "bpy.types.GeometryNodeTree — Blender Python API",
      note:  "CC-BY-SA 4.0, Blender Foundation. The interface.new_socket docs live here.",
    },
    {
      href:  "https://www.youtube.com/c/IanHubert2",
      label: "Ian Hubert — Lazy Tutorials (CC-BY)",
      note:  "Source for the remap-then-scale-normal displacement pattern used in this blueprint.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time:       "one session — 45 minutes to 2 hours",
    difficulty: "intermediate",
    cost:       "free — Blender 5.1 is open-source (GPL)",
    prerequisites: [
      "Blender 5.1 installed. The GN interface.new_socket API is a 4.0+ feature.",
      "Basic familiarity with the Text Editor and running scripts (Alt+P).",
      "Comfortable with Object Mode, Edit Mode, and the Properties panel tabs.",
    ],
    software: [
      {
        name:      "Blender",
        version:   "5.1",
        url:       "https://www.blender.org/download/",
        cost:      "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    steps: [
      {
        title: "Open the blueprint and read the constants",
        body:  "Open `blueprint.py` in Blender's Text Editor (Text → Open). Read the constants block at the top. `ICO_SUBDIVISIONS = 1` gives 80 triangles before any GN work. `GN_SUBDIVISIONS = 2` multiplies that by four. You end up with ~320 faces after GN subdivision — enough facets to read as a rock without exceeding the LOD budget for a WebXR scene.",
      },
      {
        title: "Run the script",
        body:  "Press Alt+P (or click the ▷ button). The script purges the default scene, adds an icosphere, builds the GN node tree entirely from the data API, applies the modifier, and exports `rock_faceted.glb` relative to the blend path.\n\nIf the blend is unsaved, the export falls back to `//rock_faceted.glb` which Blender will refuse — save the file to a location inside `public/library/blends/geometry/low-poly-faceted-rock/` first.",
      },
      {
        title: "Inspect the Geometry Nodes tree",
        body:  "Select the rock. Open Properties → Modifier Properties (wrench icon). You should see the RockGen modifier with the RockFaceted node group. Click the node-group name to open it in a Geometry Node Editor panel.\n\nThe chain: `GroupInput → SubdivideMesh → SetPosition (Offset) → SetShadeSmooth → GroupOutput`. The Noise Texture node is wired into a Map Range node that remaps its 0..1 output to -0.20..+0.20, then into a VectorMath SCALE node that multiplies the per-vertex normal by that scalar. The result feeds `SetPosition.Offset` — an additive input, so the displacement is always measured from the current vertex position.",
      },
      {
        title: "Understand flat shading",
        body:  "The `SetShadeSmooth` node with `Shade Smooth = False` is the single step that converts a round bumpy mesh into a faceted one. Blender's smooth shading interpolates vertex normals across a face so the face looks curved. Flat shading does not interpolate — every pixel in a face gets the same geometric normal, which is perpendicular to the face plane.\n\nThe result: hard edges appear wherever two faces meet at an angle. The silhouette gains crystalline notches. This is exactly the angular quality the studio's low-poly work relies on.",
      },
      {
        title: "Tune the parameters",
        body:  "Change `NOISE_SCALE` to 0.6 and re-run the script. The lumps become much larger — boulder territory. Change it to 3.5 for a small pebble with fine surface texture.\n\nChange `GN_SUBDIVISIONS` to 3 (320 → 1280 faces). The rock gains a softer silhouette with more but smaller facets. Good for mid-ground props. Use `GN_SUBDIVISIONS = 1` (80 faces) for hero objects in the foreground where each facet needs to read as a deliberate plane.\n\nChange `DISPLACEMENT_STR` to 0.05 for a near-sphere with shallow surface variation — useful as a background stone. Raise it to 0.40 for a spiky crystal form.",
      },
      {
        title: "Export the GLB",
        body:  "The script calls `bpy.ops.export_scene.gltf()` automatically. To re-export after tweaking parameters, either re-run the full script or use File → Export → glTF 2.0 manually with these settings: Format = GLB, +Y up ticked, Apply Modifiers ticked, Draco compression on at level 6.\n\nThe studio convention is +Y up throughout. three.js and the studio's WebXR scene expect it. Draco level 6 gives a good size/quality trade-off: the rock at default parameters compresses to around 10–14 KB.",
      },
      {
        title: "Record the screen (optional but expected)",
        body:  "Open `SCREEN-RECORDING-NOTES.md` alongside this tutorial. It gives exact OBS / Game Bar settings for a 3–5 minute screen recording that walks the workflow. The resulting `screen.mp4` goes to `public/library/videos/geometry/low-poly-faceted-rock/screen.mp4`.\n\nThe `record.py` script renders a 5-second, 30-fps OpenGL viewport spin automatically — run it after `blueprint.py` in the same Blender session. That produces `viewport.mp4`, the library card thumbnail.",
      },
    ],
    finalResult:
      "A faceted rock GLB under 15 KB, produced by a parameterised GN node tree that can generate an unlimited number of variations by changing two numbers. The same displacement pattern scales from thumbnail pebbles to hero boulders. The blueprint.py also demonstrates the Blender 5.1 node-group interface API, which is the pattern needed for any procedural tool in the studio's library.",
    variations: [
      "Add a second Noise Texture at a different scale (0.3) and mix the two Fac outputs with a Math Add node before the Map Range. The large noise sets the boulder shape; the small noise roughens the surface.",
      "Replace the flat material with the studio's cel-shade setup: a Toon BSDF in the shader, or a custom TSL material baked into the GLB's normal map. The faceted geometry already gives you 80% of the cel-shade look for free.",
      "Clone the node group (Shift+D the modifier, then click the node-group shield icon to make a local copy) and change the Noise Scale and Detail per-clone to produce a matching set of rocks at different scales without any additional scripting.",
    ],
    troubleshooting: [
      {
        symptom: "Script runs but `rock_faceted.glb` is not created",
        cause:   "The blend file is unsaved, so `//` resolves to nothing.",
        fix:     "Save the blend file to `public/library/blends/geometry/low-poly-faceted-rock/` first, then re-run the script.",
      },
      {
        symptom: "`AttributeError: 'NodeGroupInterface' object has no attribute 'new_socket'`",
        cause:   "Running the script in Blender 3.x or early 4.x, which used the old `ng.inputs.new()` API.",
        fix:     "This blueprint requires Blender 4.0 or later. The studio bench is on 5.1 — update Blender.",
      },
      {
        symptom: "The rock appears smooth, not faceted",
        cause:   "The `SetShadeSmooth` node was not applied before export, or the GLB viewer is smoothing normals on load.",
        fix:     "Confirm the `Shade Smooth` input is `False` in the node tree. In three.js, set `mesh.material.flatShading = true` and call `mesh.material.needsUpdate = true` after loading if the viewer overrides it.",
      },
      {
        symptom: "Modifier apply fails with a context error",
        cause:   "The script is running without an active view layer context — common when running headless without a display.",
        fix:     "Add `bpy.context.view_layer.objects.active = obj` immediately before the `modifier_apply` call. It is already in the blueprint; confirm it is not being stripped by a copy-paste error.",
      },
    ],
  },
  base,
);

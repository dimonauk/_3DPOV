import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The <strong>Extrude Mesh</strong> node in Geometry Nodes does
        something the modifier-stack equivalent cannot: it exposes two boolean
        field sockets — <code>Top</code> and <code>Side</code> — that
        downstream nodes can use as live selection inputs. <code>Top</code>{" "}
        evaluates to <em>True</em> on every face cap the extrusion created;{" "}
        <code>Side</code> evaluates to <em>True</em> on every side-wall quad.
        This means you can mark edge crease on the hinge edges (Side), nest a
        second extrusion inside the first caps (Top ∩ random), and assign
        materials per tier — all within a single geometry node graph, with no
        post-processing modifier. Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-boolean-hard-surface"
          className={lk}
        >
          GN Mesh Boolean tutorial
        </Link>
        , which reaches hard-surface shapes via CSG subtraction; Extrude Mesh
        is the additive complement, building up relief from a flat base.
      </p>

      <p>
        The tutorial produces a 16 × 16 face grid whose panels are raised in
        two stochastic tiers. A{" "}
        <strong>Random Value</strong> field (evaluated per face) thresholded
        by a <strong>Compare</strong> node provides the first-pass boolean
        selection — the same per-face field technique used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          Distribute Points on Faces tutorial
        </Link>{" "}
        for density masking. The <code>Top</code> socket of the first
        extrusion AND-ed with a second random field selects a subset of those
        caps for the inner tier. A{" "}
        <strong>Set Edge Crease</strong> node on each <code>Side</code> output
        writes crease = 1.0 to the hinge edges; a{" "}
        <strong>Subdivision Surface</strong> modifier stacked above the GN
        modifier reads that attribute and produces fully sharp panel edges with
        rounded non-panel transitions. The entire surface is exported as a
        Draco-compressed GLB for WebXR — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-decimate-lod-webxr-planar-collapse"
          className={lk}
        >
          Decimate LOD for WebXR tutorial
        </Link>{" "}
        for the LOD strategy that follows.
      </p>

      <p>
        The crease workflow merits a close reading. Edge crease in Blender 5.1
        is stored as the named attribute <code>crease_edge</code> on the EDGE
        domain. The Set Edge Crease node writes to this attribute in-graph; the
        SubDiv modifier reads it from the object&apos;s evaluated mesh. Because
        the GN modifier runs first in the modifier stack, the crease data is
        present on the GN-output mesh before SubDiv evaluates. This is the same
        principle explored in the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface"
          className={lk}
        >
          SubDiv Crease + Bevel Weight tutorial
        </Link>
        , but authored entirely in-graph rather than via manual edge-crease
        painting. The Store Named Attribute pattern for wiring GN data to
        shaders is covered in depth in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          Store Named Attribute Shader Data Bridge tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-extrude-mesh-panel-inset-procedural",
  title:
    "GN Extrude Mesh — Procedural Panel Inset: Attribute-Driven Per-Face Extrusion with Edge Crease (Blender 5.1)",
  date: "2026-06-20",
  kind: "tutorial",
  excerpt:
    "Use the Extrude Mesh node's Top and Side field sockets to build a two-tier sci-fi panel surface on a 16×16 grid — random face selection, per-tier edge crease for SubD sharpness, and Draco GLB export for WebXR.",
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/geometry-nodes/gn-extrude-mesh-panel-inset-procedural/",
    time: "one focused session (2–3 hours)",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Comfortable with the Geometry Nodes editor and modifier stack.",
      "Understands boolean fields and how domain context (FACE vs EDGE) affects field evaluation.",
      "Familiar with the Subdivision Surface modifier and edge crease painting.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Extrude Mesh Top/Side sockets and FunctionNodeCompare are stable in Blender 4.0+. The crease_edge attribute written by Set Edge Crease is read by SubDiv modifier from Blender 4.2 onward.",
      },
    ],
    steps: [
      {
        title: "Understand Extrude Mesh — modes, sockets, and the field model",
        body: 'The Extrude Mesh node has three modes: FACES, EDGES, and VERTICES. In FACES mode with Individual Faces = True, each selected face extrudes independently along its own face normal. With Individual Faces = False the selection extrudes as a connected shell — correct for a uniform offset but wrong when you need isolated panels.\n\nCritically, the node outputs two boolean *field* sockets:\n  Top  — evaluates True on each face cap created by the extrusion\n  Side — evaluates True on each side-wall quad created by the extrusion\n\nThese are not geometry outputs; they are lazy field formulas. They can be wired into any downstream node that accepts a boolean selection — Set Edge Crease, another Extrude Mesh, Set Material, Store Named Attribute — and the formula is evaluated on demand in the correct domain context.\n\nThe Offset socket expects a vector field (not a scalar). For per-face normal extrusion, wire: GeometryNodeInputNormal → ShaderNodeVectorMath (SCALE, factor=depth) → Extrude.Offset. A fixed world-space vector (e.g. (0,0,0.03)) would work on a flat grid but fails on a curved surface — the Normal-driven approach generalises to any emitter geometry.',
      },
      {
        title: "Build the grid and first-pass random selection",
        body: 'Create a new Geometry Nodes tree on an empty carrier object.\n\nAdd GeometryNodeMeshGrid. Set Size X = 2.0, Size Y = 2.0. Expose Vertices X and Vertices Y as Group Input sockets (INT, default 18 each → 16×16 = 256 quad faces). More verts = more panels; 18 is the sweet spot between density and visual clarity.\n\nAdd GeometryNodeRandomValue, data_type = "FLOAT". The node evaluates per-element in the domain of its consumer. When wired into the Selection socket of Extrude Mesh (FACE mode), it evaluates once per face, generating a unique random float for every face on the grid.\n\nAdd FunctionNodeCompare (data_type=FLOAT, operation=GREATER_THAN). Wire:\n  RandomValue.Value → Compare.A\n  GroupInput["Panel Threshold"] → Compare.B\n  Compare.Result is now a per-face boolean: True where the random value exceeds the threshold.\n\nExpose Panel Threshold as a Group Input FLOAT, default 0.38 (roughly 62% of faces raised). Moving it to 0 raises no faces; 1.0 raises all of them.',
      },
      {
        title: "First Extrude Mesh and Set Edge Crease on Side",
        body: 'Add GeometryNodeExtrudeMesh. Set mode = "FACES".\n\nWire:\n  MeshGrid.Mesh     → ExtrudeMesh1.Mesh\n  Compare.Result    → ExtrudeMesh1.Selection\n  Normal×Depth vec  → ExtrudeMesh1.Offset\n  Individual Faces socket default = True\n\nNow add GeometryNodeSetEdgeCrease. Wire:\n  ExtrudeMesh1.Mesh → SetEdgeCrease1.Geometry\n  ExtrudeMesh1.Side → SetEdgeCrease1.Selection\n  SetEdgeCrease1.Crease = 1.0\n\nThe Side field identifies exactly the four-edge loop around each raised panel — the "hinge" where the original face perimeter joins the extruded cap. Crease = 1.0 tells the Subdivision Surface modifier (stacked above the GN mod) to treat these edges as infinitely sharp, yielding crisp panel borders with no manual edge loops required.\n\nIMPORTANT: the SetEdgeCrease node does not change the mesh topology — it only writes the crease_edge attribute. This means ExtrudeMesh1.Top and ExtrudeMesh1.Side remain valid field references downstream, even though the geometry has passed through SetEdgeCrease1.',
      },
      {
        title: "Second Extrude Mesh — nested inner tier",
        body: 'Add a second GeometryNodeRandomValue (Seed = 42, different from the outer seed). Add a second FunctionNodeCompare (GREATER_THAN). Wire inner random → compare → one input of FunctionNodeBooleanMath (operation = AND).\n\nWire ExtrudeMesh1.Top → BooleanMath.other input.\n\nThe AND combination means: "faces that are caps of the first extrusion AND whose random value exceeds INNER_THRESHOLD". Roughly 50% of first-tier caps receive the inner extrusion.\n\nAdd GeometryNodeExtrudeMesh (second instance), mode="FACES", Individual Faces=True.\n  SetEdgeCrease1.Geometry → ExtrudeMesh2.Mesh\n  BooleanMath.Boolean     → ExtrudeMesh2.Selection\n  Normal×InnerDepth vec   → ExtrudeMesh2.Offset\n\nAdd a second GeometryNodeSetEdgeCrease:\n  ExtrudeMesh2.Mesh → SetEdgeCrease2.Geometry\n  ExtrudeMesh2.Side → SetEdgeCrease2.Selection\n  Crease = 1.0\n\nThe two-tier result: base grid (unextruded) → first tier panels (PANEL_DEPTH above base) → inner caps on ~50% of panels (PANEL_DEPTH + INNER_DEPTH above base). Three distinct height levels from two Extrude Mesh nodes.',
      },
      {
        title: "Stack the Subdivision Surface modifier and verify crease",
        body: 'In the modifier stack (Properties → Modifier), add a Subdivision Surface modifier BELOW the Geometry Nodes modifier. Blender evaluates modifiers from top to bottom, so the GN mod runs first (produces the two-tier mesh with crease_edge attributes), then SubDiv reads those attributes.\n\n  subdiv.levels        = 1   # viewport quality\n  subdiv.render_levels = 2   # render / export quality\n\nIn the viewport, toggle the SubDiv modifier eye to compare with/without subdivision. With SubDiv off: blocky hard panels. With SubDiv on: rounded transitions on non-panel edges, razor-sharp edges at the panel hinge — exactly what crease = 1.0 achieves.\n\nTo verify in Python:\n  carrier = bpy.data.objects["panel_inset"]\n  # Evaluate the object with modifiers applied\n  import bpy\n  depsgraph = bpy.context.evaluated_depsgraph_get()\n  eval_obj  = carrier.evaluated_get(depsgraph)\n  mesh      = eval_obj.to_mesh()\n  # Inspect the crease_edge attribute\n  attr = mesh.attributes.get("crease_edge")\n  print([attr.data[i].value for i in range(min(20, len(attr.data)))])\n  # Expected: mix of 0.0 (non-hinge edges) and 1.0 (hinge edges)',
      },
      {
        title: "Export GLB with baked modifiers for WebXR",
        body: 'Use export_apply=True in the glTF exporter. This instructs the exporter to evaluate all modifiers — GN + SubDiv — into a final mesh before writing the GLB. The result is a single static mesh with real SubD geometry and sharp creased panel edges, with no modifier dependency at WebXR runtime.\n\n  bpy.ops.export_scene.gltf(\n      filepath="panel_inset.glb",\n      export_format="GLB",\n      use_selection=True,\n      export_apply=True,          # bake GN + SubDiv\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_normals=True,\n      export_materials="EXPORT",\n  )\n\nFor WebXR LOD strategy, pair this with the Decimate modifier pipeline from the Decimate LOD tutorial: keep the full-SubDiv GLB as the near LOD and a Decimate Collapse (ratio 0.15) version as the far LOD.\n\nVerify the GLB in the Khronos glTF Viewer. The panel surface should be visually smooth with sharp panel borders. Inspect the accessor count — Draco level 6 typically achieves 4–6× compression on regular-grid meshes like this panel surface.',
      },
    ],
    finalResult:
      "A Draco-compressed GLB containing a two-tier procedural panel grid — 16×16 base with ~38% of faces raised to first-tier height and ~50% of those raised again to inner-tier height, all panel hinge edges sharp via SubDiv crease. The source .blend retains the live GN modifier with Panel Threshold, Panel Depth, Inner Threshold, and Inner Depth exposed as modifier panel sliders.",
    variations: [
      "Curved emitter: replace the flat MeshGrid with a UV Sphere (Segments=32, Rings=24). Every panel normal now points radially outward — the GN tree is identical, but the result is a spiky sphere where each extruded panel juts perpendicular to the surface. This works because the Offset is driven by the face Normal field, not a fixed world vector.",
      "Material per tier: after the second SetEdgeCrease, add two SetMaterial nodes gated by ExtrudeMesh1.Top (first tier cap material) and ExtrudeMesh2.Top (inner tier material). Wire them in sequence: base material first, then first-tier material on Top1 selection, then inner-tier material on Top2 selection. Later SetMaterial calls override earlier ones for the same faces.",
      "Animated seed: expose the Panel Seed socket as a Group Input INT and keyframe it from 0 to 99 over 100 frames. Each frame regenerates the stochastic panel layout — useful for a transition animation where the panel pattern visibly shuffles.",
    ],
    troubleshooting: [
      {
        symptom:
          "Extrude Mesh produces geometry but SubDiv modifier shows no crease sharpness",
        cause:
          "The crease_edge attribute exists in the GN-evaluated mesh but the Subdivision Surface modifier was placed ABOVE the Geometry Nodes modifier in the stack. Blender evaluates from top to bottom; SubDiv runs on the un-GN-modified carrier and sees no crease data.",
        fix: "In Properties → Modifier, drag the Subdivision Surface modifier below the Geometry Nodes modifier. Re-evaluate by moving any slider — the sharp panel edges appear immediately.",
      },
      {
        symptom: "GLB exports flat with no SubD detail despite correct in-viewport look",
        cause:
          "export_apply=False (the default) exports the raw GN mesh without evaluating the SubDiv modifier.",
        fix: "Add export_apply=True to bpy.ops.export_scene.gltf(). The exported mesh will have the full SubD level-2 geometry — larger file, but correct visual result. Use Draco level 6 to offset the size increase.",
      },
      {
        symptom:
          "Side socket wired to SetEdgeCrease but panel edges still look rounded after SubDiv",
        cause:
          "The crease value is > 0 but < 1.0, or the Crease socket on SetEdgeCrease was left at its default (0.0) rather than set to 1.0.",
        fix: "Set SetEdgeCrease.Crease = 1.0 for fully sharp edges. Values between 0 and 1 produce partial sharpening — intentional if you want a lightly softened hinge.",
      },
      {
        symptom:
          "BooleanMath AND produces empty selection — no inner-tier panels appear",
        cause:
          "ExtrudeMesh1.Top evaluates True only on faces in the extruded cap domain, but the second RandomValue was created with a fixed seed equal to the outer RandomValue seed. Both Random Values generate identical sequences, so inner_random_sel is always True (same as outer) or always False — the AND with Top gives unexpected results.",
        fix: "Ensure the two RandomValue nodes use different Seed values (e.g. 9 for outer, 42 for inner). Different seeds produce independent per-face random sequences.",
      },
    ],
  },
  base,
);

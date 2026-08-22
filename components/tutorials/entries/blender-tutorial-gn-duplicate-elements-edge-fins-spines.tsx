import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The <strong>Duplicate Elements</strong> node is the quiet workhorse of
        Geometry Nodes that most tutorials walk past. It clones topology
        elements — vertices, edges, or faces — as disconnected copies that
        inherit every named attribute from their source. The trick this tutorial
        exploits is the edge domain: duplicating edges produces free-floating
        2-vertex segments with no adjacent faces, which{" "}
        <strong>Extrude Mesh</strong> (Edges mode) immediately sweeps into
        individual fin quads. Each fin is independent of the sphere body,
        occupying its own mesh island and accepting its own material — something
        impossible if you extrude directly on the original mesh.
      </p>

      <p>
        There is one gotcha that defines the entire node chain. The{" "}
        <strong>Normal</strong> node evaluates on the face domain; a mesh of
        bare edges has no faces, so Normal returns zero after duplication. The
        solution: run{" "}
        <strong>Evaluate on Domain</strong> (Face → Edge) to average adjacent
        face normals onto each edge, then{" "}
        <strong>Store Named Attribute</strong> that result as{" "}
        <code>&quot;fin_dir&quot;</code> before any duplication happens.
        Because Duplicate Elements preserves named attributes on the copied
        elements, every cloned edge carries its direction intact. Compare this
        to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          Store Named Attribute → Shader bridge tutorial
        </Link>
        , which uses the same pre-stamp pattern to pass GN data into the
        material graph.
      </p>

      <p>
        The fin height varies spatially via a 3D Noise Texture whose{" "}
        <code>Fac</code> output (0–1) is remapped with a single{" "}
        <strong>Multiply Add</strong> math node to the range 0.25–1.25 — so no
        fin is ever zero-length but the pattern is clearly organic. This is the
        same attribute-mask technique used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          Distribute Points on Faces tutorial
        </Link>{" "}
        for density painting. The remapped scalar then scales the{" "}
        <code>fin_dir</code> vector (VectorMath SCALE) to produce the final
        per-edge extrusion offset. The result is extruded via Extrude Mesh,
        assigned the Fin material, and joined back with the original sphere body
        via{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-collection-info-pick-instance-asset-scatter"
          className={lk}
        >
          Join Geometry
        </Link>{" "}
        — the same join pattern used in the Collection Info scatter tutorial.
        The sphere uses{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-extrude-mesh-panel-inset-procedural"
          className={lk}
        >
          Extrude Mesh&apos;s sibling technique
        </Link>{" "}
        from the panel-inset tutorial, except the extruded elements are
        supplied by Duplicate Elements rather than a selection field on the
        original geometry.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-duplicate-elements-edge-fins-spines",
  title:
    "GN Duplicate Elements — Edge Domain Fins: Geometric Spike Shell (Blender 5.1)",
  date: "2026-06-20",
  kind: "tutorial",
  excerpt:
    "Clone every edge of a low-poly sphere into independent fin quads using Duplicate Elements (Edge domain) + Extrude Mesh. Includes the pre-stamp trick for carrying face normals through a face-free mesh.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "one sitting (45–90 min)",
    difficulty: "intermediate",
    cost: "free — Blender 5.1 is open-source",
    supplies: {
      software: [
        {
          name: "Blender",
          version: "5.1",
          url: "https://www.blender.org/download/",
          cost: "free",
          platforms: ["windows", "macos", "linux"],
        },
      ],
    },
    steps: [
      {
        title: "Understand why Duplicate Elements, not Extrude on original",
        body: 'Two Extrude Mesh alternatives exist and both have problems here.\n\nExtrude Mesh directly on the sphere (EDGES mode) would weld the fin quads to the sphere body: the top edge of each fin shares vertices with the sphere mesh. You cannot assign a separate material per fin without a painful island-select workflow, and the fused topology complicates normals.\n\nExtrude Mesh (FACES mode) on selected faces produces panel geometry but the side walls are still connected to the original face perimeter.\n\nDuplicate Elements (Edge domain) sidesteps both issues: the copies are completely disconnected from the source mesh from the moment they are created. They form their own mesh islands. Extrude Mesh on those isolated edge-segments produces fins that are connected to each other within the fin mesh but share zero vertices with the sphere body — clean material assignment, clean normals, clean GLB export.',
      },
      {
        title:
          "Store the fin direction as a named edge attribute before duplicating",
        body: 'Start with a default scene, delete the default cube, and add a UV Sphere: Add → Mesh → UV Sphere, Segments = 14, Rings = 10.  Press Tab → Edit Mode, then A to select all, then right-click → Shade Flat.  Return to Object Mode.\n\nAdd a Geometry Nodes modifier (Properties → Modifier → Add → Geometry Nodes).  Create a new node tree.\n\nIn the GN editor:\n\n1. Add GeometryNodeInputNormal (Normal).  This node produces a vector field that evaluates on the face domain by default.\n\n2. Add GeometryNodeFieldOnDomain (Evaluate on Domain).\n   data_type = FLOAT_VECTOR\n   domain    = EDGE\n   Wire: Normal.Normal → FieldOnDomain.Value (input slot index 2 for Vector type).\n   This converts the per-face normal field to a per-edge field by averaging the adjacent face normals of each edge.\n\n3. Add GeometryNodeStoreNamedAttribute.\n   data_type = FLOAT_VECTOR\n   domain    = EDGE\n   Wire: Group Input.Geometry → StoreNamedAttribute.Geometry\n   Set: StoreNamedAttribute.Name = "fin_dir"\n   Wire: FieldOnDomain.Value → StoreNamedAttribute.Value\n\nThe stored attribute survives Duplicate Elements because the node copies element data verbatim.  Without this step, NamedAttribute("fin_dir") would return zero after duplication — there are no faces on the copy for Normal to evaluate against.',
      },
      {
        title: "Duplicate Elements (Edge domain) to isolate fin geometry",
        body: 'Add GeometryNodeDuplicateElements.\n   domain = EDGE\n   Amount = 1  (one copy per edge; Amount > 1 would stack fins)\n   Wire: StoreNamedAttribute.Geometry → DuplicateElements.Geometry\n\nThe node has two outputs:\n  • Geometry — the duplicated edges only (no faces, no body)\n  • Duplicate Index — an integer field that maps each copy back to its source edge index (useful for per-copy seeding if you need deterministic variation)\n\nAt this point, the output geometry is a mesh containing 280 disconnected edge segments (14 × 10 × 2 = 280 edges on the sphere).  Each segment sits exactly at the position of its source edge, carrying the "fin_dir" attribute.\n\nVerify: add a GeometryNodeViewer (Viewer) node, wire DuplicateElements.Geometry → Viewer.Geometry, and in the viewport select the GN object.  You should see a point cloud + edge overlay with no faces — a ghostly wireframe of the sphere with every edge doubled.',
      },
      {
        title: "Read the stored fin direction and build the noise-varied height",
        body: 'Add GeometryNodeInputNamedAttribute.\n   data_type = FLOAT_VECTOR\n   Name = "fin_dir"\n   This reads the pre-stamped per-edge vector from the duplicate geometry.\n\nFor height variation:\n\n1. Add ShaderNodeTexNoise (Noise Texture).\n   noise_dimensions = 3D\n   Detail     = 2.0\n   Roughness  = 0.55\n   Wire: Group Input["Noise Scale"] → Noise.Scale\n   The Fac output is 0..1, varying smoothly across world space.\n\n2. Add ShaderNodeMath, operation = MULTIPLY_ADD.\n   This remaps Fac from 0..1 to (NOISE_MIN..NOISE_MAX) in one node:\n     output = Fac × (NOISE_MAX − NOISE_MIN) + NOISE_MIN\n   Set:  Input[1] = 1.0   (= 1.25 − 0.25, the range width)\n         Input[2] = 0.25  (= NOISE_MIN, the floor)\n   Wire: Noise.Fac → MULTIPLY_ADD.Input[0]\n   With these values: quiet areas get 0.25× height, peaks get 1.25× — no fin is ever invisible.\n\n3. Add ShaderNodeMath, operation = MULTIPLY.\n   Wire: MULTIPLY_ADD.Value → Multiply.Input[0]\n         Group Input["Fin Height"] → Multiply.Input[1]\n   This combines the user-controlled base height with the noise variation.\n\n4. Add ShaderNodeVectorMath, operation = SCALE.\n   Wire: NamedAttribute.Attribute → VectorMath.Vector (Input[0])\n         Multiply.Value           → VectorMath.Scale  (Input[3])\n   Output: a per-edge vector pointing in the fin direction with the correct varied magnitude.',
      },
      {
        title: "Extrude Mesh (Edges mode) and assign materials",
        body: 'Add GeometryNodeExtrudeMesh.\n   mode = EDGES\n   Wire: DuplicateElements.Geometry → ExtrudeMesh.Mesh\n         VectorMath.Value            → ExtrudeMesh.Offset\n\nWith mode = EDGES, Extrude Mesh sweeps each selected edge into a quad face.  "Individual" is irrelevant here because the edges are already disconnected — each edge forms its own mesh island.  The Offset vector carries both direction and magnitude, so Offset Scale stays at 1.0.\n\nThe extruded fins need a contrasting material.  Rather than setting a material index slot, we use:\n\n  Add GeometryNodeSetMaterial.\n  Set the Material input to "Mat_SpikeFin" (create a Principled BSDF material with a warm orange colour in the shader workspace).\n  Wire: ExtrudeMesh.Mesh → SetMaterial.Geometry\n\nFinally:\n  Add GeometryNodeJoinGeometry.\n  Wire: Group Input.Geometry          → JoinGeometry  (body)\n        SetMaterial.Geometry          → JoinGeometry  (fins)\n        JoinGeometry.Geometry         → Group Output\n\nThe sphere body retains its original material; fins use the SetMaterial assignment.  Two separate mesh islands, one GLB mesh.',
      },
      {
        title: "Set up modifier panel sliders and inspect in the viewport",
        body: 'In the GN tree, open the node sidebar (N key) → Group tab.  Ensure "Fin Height" and "Noise Scale" are listed as Group Input sockets with sensible min/max ranges:\n  Fin Height:  min 0.0, max 2.0, default 0.30\n  Noise Scale: min 0.1, max 20.0, default 2.5\n\nWith the sphere selected, go to Properties → Modifier.  You should see the "Edge Fin Generator" modifier with Fin Height and Noise Scale sliders.\n\nAdjust Fin Height → 0.05: fins nearly flush with surface, sea-urchin look.\nAdjust Fin Height → 0.60: dramatic spikes, morning-star silhouette.\nAdjust Noise Scale → 0.5: almost uniform height, very regular.\nAdjust Noise Scale → 8.0: high-frequency variation, almost random per-fin.\n\nPress Z → Wireframe to confirm the topology: you should see the sphere body quads plus, for each edge, a thin rectangular fin quad attached at one edge and floating free at the other.\n\nIf fins are invisible: check that FieldOnDomain.domain = EDGE and StoreNamedAttribute.domain = EDGE (both must match).  If fins point inward: the sphere normals are flipped — in Edit Mode, select all, Mesh → Normals → Recalculate Outside.',
      },
      {
        title: "Export GLB with applied GN modifier",
        body: 'File → Export → glTF 2.0 (.glb/.gltf)\n\nSettings:\n  Format:                 GLB\n  Include → Apply Modifiers: ✓  (bakes the GN modifier into final geometry)\n  Geometry → Compression: ✓  Level 6\n  Geometry → Normals:     ✓\n  Materials:              Export\n  Transform → Y Up:       ✓  (WebXR convention)\n\nOr via Python (same as blueprint.py export block):\n  bpy.ops.export_scene.gltf(\n      filepath="gn_edge_fins_spike_sphere.glb",\n      export_format="GLB",\n      use_selection=True,\n      export_apply=True,\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_normals=True,\n      export_materials="EXPORT",\n      export_yup=True,\n  )\n\nVerify in Khronos glTF Sample Viewer (https://github.khronos.org/glTF-Sample-Viewer-Release/).  You should see a two-material mesh: dark body spherical core, orange fins radiating from every edge.  The Draco encoder typically achieves 70–80% size reduction on this topology because the fin quads form a regular grid (one quad per source edge) that compresses very efficiently.',
      },
    ],
    finalResult:
      "A Draco-6 GLB of a two-material spike sphere: 14×10 UV sphere body (280 edges) with one fin quad per edge (280 fins), noise-varied heights between 0.075 BU and 0.375 BU, flat-shaded throughout. The source .blend retains the live GN modifier with Fin Height and Noise Scale sliders. The node chain is reusable on any convex mesh — replace the sphere with a torus, a low-poly character head, or a cube to instantly spike any shape.",
    variations: [
      "Multiple fins per edge: increase DuplicateElements.Amount to 3 and wire DuplicateElements.Duplicate Index into a Math DIVIDE (÷ 3) → NoiseTexture seed offset. Each edge gets three fins at slightly staggered heights — a feathered look.",
      "Face domain fins: switch DuplicateElements.domain to FACE and ExtrudeMesh.mode to FACES. Each face becomes an independent floating plate. With Noise on the offset you get a shattered-glass or scales-peeling-off effect. The FieldOnDomain step is no longer needed (face Normal evaluates directly on face copies).",
      "Tapered fins: after ExtrudeMesh, add a SetPosition node. Wire ExtrudeMesh.Top → SetPosition.Selection. Add a Position node and scale its Z component with a Math MULTIPLY_ADD (0.8 inward). This pulls the top edge of each fin inward, tapering spines to a point without changing the base connection.",
      "Animate growth: expose an additional Group Input Float 'Fin Scale' (0..1). Wire it into VectorMath.Scale instead of the noise-multiplied height. Keyframe 'Fin Scale' from 0 to 1 over 60 frames — fins grow from flush to full height as a growth animation, identical to the Bake Node technique from the Simulation Zone tutorial applied to a static field.",
    ],
    troubleshooting: [
      {
        symptom: "Fins are invisible in viewport but nodes show no errors",
        cause:
          "StoreNamedAttribute.domain or FieldOnDomain.domain is set to FACE rather than EDGE. The face-domain vector is written to the wrong attribute layer; the edge copies read zeros.",
        fix: "Set both FieldOnDomain.domain = EDGE and StoreNamedAttribute.domain = EDGE. The stored attribute must live on the edge domain so DuplicateElements copies it onto the cloned edges.",
      },
      {
        symptom: "Fins point inward (into the sphere rather than outward)",
        cause:
          "The UV sphere normals were recalculated pointing inward, or the sphere was imported with inverted normals.",
        fix: "In Edit Mode, press A to select all, then Mesh → Normals → Recalculate Outside (Shift+N). The Normal field will flip, and fins will radiate outward.",
      },
      {
        symptom:
          "All fins have identical height — noise variation has no effect",
        cause:
          "The Noise Texture is using 2D mode (noise_dimensions = '2D') so it evaluates on a flat UV plane and every edge gets the same noise value, or Noise Scale is so high that all variation is within a single edge's spatial extent and appears uniform.",
        fix: "Set ShaderNodeTexNoise.noise_dimensions = '3D'. The texture then evaluates using the 3D world position of each edge midpoint, ensuring meaningful variation across the sphere.",
      },
      {
        symptom:
          "GLB shows only the sphere body — no fins after export",
        cause:
          "export_apply was left False (the default). The exporter writes the unmodified sphere mesh without evaluating the GN modifier.",
        fix: "Add export_apply=True to bpy.ops.export_scene.gltf(). This evaluates the full modifier stack — GN modifier baked — before writing the GLB. File size will be larger; Draco level 6 offsets this.",
      },
      {
        symptom:
          "NamedAttribute node reports 'Attribute does not exist' warning",
        cause:
          "The Name string in NamedAttribute does not exactly match the string in StoreNamedAttribute (case-sensitive, whitespace-sensitive).",
        fix: "Both must be exactly \"fin_dir\" with no leading/trailing spaces. In Python: node.inputs['Name'].default_value = \"fin_dir\" — copy-paste rather than re-type to avoid invisible whitespace.",
      },
    ],
  },
  base,
);

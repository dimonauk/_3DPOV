import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnCaptureAttributeBody() {
  return (
    <>
      <p>
        In Geometry Nodes, almost every value node is a <strong>field</strong>{" "}
        — a lazy expression that says <em>how</em> to compute a value, not
        what the value is. The <code>Index</code> node does not return a
        number; it returns a recipe that says &ldquo;when evaluated on
        element N, yield N.&rdquo; Fields are re-evaluated at whatever domain
        is active at the moment they are consumed. This is efficient — you only
        compute what you need — but it carries a subtle trap. Scatter 64 points,
        then delete 12 of them; the surviving points are renumbered 0–51.
        Any field expression re-evaluated after that deletion yields different
        values from the ones you computed before it. The{" "}
        <strong>Capture Attribute</strong> node exists precisely to prevent this:
        it forces a field to evaluate <em>right now</em>, at the current domain,
        and stores the concrete result as an attribute that no downstream
        operation can corrupt.
      </p>

      <p>
        This tutorial builds a scatter field of ~64 flat-shaded ico-spheres, each
        a different hue derived from its original scatter-point index. The hue
        is frozen by <code>CaptureAttribute</code> before instancing, written to
        each instance&rsquo;s <code>colour_phase</code> slot by{" "}
        <code>StoreNamedAttribute</code>, then propagated to every vertex of
        each realized sphere. The EEVEE material reads it with{" "}
        <code>ShaderNodeAttribute</code> and passes it through a six-stop rainbow
        ColorRamp. The result is a rainbow cloud — and a foundation for every
        advanced GN pipeline that needs per-element data to survive topology
        changes downstream.
      </p>

      <p>
        The same <code>CaptureAttribute → StoreNamedAttribute</code> chain
        appeared implicitly in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-weight-painted-scatter"
          className={lk}
        >
          weight-painted density scatter tutorial
        </Link>{" "}
        — the weight-paint attribute was already stored on the mesh, so Capture
        was not needed there. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          Instance on Points tutorial
        </Link>{" "}
        covers the InstanceOnPoints node itself; this tutorial focuses on the
        attribute layer that makes per-instance data reliable. The Emission
        material used here is the same design philosophy as the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE toon cel-shader
        </Link>{" "}
        — colour that does not depend on light position, so every facet reads
        cleanly in a WebXR headset.
      </p>

      <p>
        For the WebXR delivery path: <code>export_apply=True</code> bakes the
        entire GN stack and realised instances into real mesh vertices. The{" "}
        <code>colour_phase</code> attribute exports as a custom glTF vertex
        attribute (<code>_COLOUR_PHASE</code>). Three.js exposes it via{" "}
        <code>geometry.attributes._COLOUR_PHASE</code>; you can drive a custom
        ShaderMaterial or a{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          vertex colour channel
        </Link>{" "}
        from it at runtime without any bake step. The same technique powers the
        per-element deformation data discussed in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-geometry-proximity-deform"
          className={lk}
        >
          Geometry Proximity deformation tutorial
        </Link>{" "}
        — a proximity weight stored per-vertex via this exact pipeline drives
        the hover-response colour overlay.
      </p>

      <p>
        Outside sources used in this tutorial:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/capture_attribute.html"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          Blender Manual: Capture Attribute Node
        </a>{" "}
        (CC-BY-SA&nbsp;4.0, Blender Documentation Team) — the authoritative
        reference for domain options, data types, and the field-evaluation
        semantics that distinguish CaptureAttribute from StoreNamedAttribute.{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          KhronosGroup/glTF-Blender-IO
        </a>{" "}
        (Apache-2.0, Khronos Group) — the exporter responsible for mapping
        named GN attributes to custom glTF vertex attribute slots; its sibling
        project is the{" "}
        <a
          href="https://github.com/KhronosGroup/glTF"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          glTF 2.0 specification
        </a>{" "}
        which defines how custom attributes (<code>_*</code> prefix) are encoded
        in the binary buffer.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-capture-attribute-named-attribute",
  title:
    "GN Capture Attribute + Named Attribute — Per-Instance Data Pipelines (Blender 5.1)",
  date: "2026-05-26",
  kind: "tutorial",
  excerpt:
    "Fields in Geometry Nodes are lazy: they re-evaluate at whatever domain is active when consumed. Capture Attribute freezes a field expression at a specific domain so downstream deletions, merges, or reorders cannot corrupt the value. Build a rainbow scatter field of ~64 flat-shaded ico-spheres where each sphere's hue is captured at scatter-point time, stored as 'colour_phase' on the INSTANCE domain, propagated to POINT vertices after RealizeInstances, and read by an Emission material — the complete per-instance data pipeline.",
  Body: GnCaptureAttributeBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable creating Geometry Nodes trees in Python via bpy.data. Know how GroupInput/GroupOutput sockets are wired.",
      "Understand InstanceOnPoints and RealizeInstances — covered in the GN Instance on Points tutorial.",
      "Know what 'domain' means in GN: POINT, EDGE, FACE, CORNER, INSTANCE. Each element in that set gets its own attribute value.",
      "Blender 5.1 installed. Able to run scripts headlessly.",
    ],
    overview:
      "Build an 11-node GN tree that scatters ~64 ico-sphere instances across a 4×4 m plane and assigns each a unique colour derived from its scatter-point index. The key technique: Capture Attribute freezes the per-point random value at POINT domain before InstanceOnPoints, Store Named Attribute writes it to INSTANCE domain, RealizeInstances propagates it to POINT vertices, and ShaderNodeAttribute reads it in the Emission material. Export as a Draco-6 GLB with the colour_phase attribute preserved in the binary.",
    steps: [
      {
        title: "Understand field laziness — the problem Capture Attribute solves",
        body:
          "Every node that outputs a plain value (Index, Position, ID, RandomValue) is actually a FIELD — a functional description of how to compute a value for any element in a geometry set.\n\n  Index:       evaluates to the integer index of each current element\n  Position:    evaluates to the XYZ coordinate of each current element\n  RandomValue: evaluates to hash(id_input, seed) for each current element\n\nFields are evaluated lazily — only when a 'field evaluator' node (SetPosition,\nStoreNamedAttribute, CaptureAttribute, InstanceOnPoints) consumes them.  The\nevaluation happens at the domain of that evaluator.\n\nWhy this matters for scatter + instance pipelines:\n\n  1. You scatter 64 points.  Each has Index 0–63.\n  2. You compute RandomValue(ID=Index) → 64 different values [0,1].\n  3. You delete 12 points that failed a density test.\n  4. You run InstanceOnPoints.\n\nIF you did NOT capture the random value before step 3:\n  The surviving 52 points have indices 0–51 (renumbered after deletion).\n  At InstanceOnPoints, the random value field is re-evaluated at the NEW\n  indices — giving different values from what you computed at step 2.\n  Sphere colour assignments shift whenever you change the deletion threshold.\n\nIF you DID capture before step 3:\n  Each point has a concrete float stored as an attribute.\n  The deletion step removes the attribute entry for deleted points.\n  The surviving points keep their ORIGINAL captured float — indices\n  irrelevant, values locked.\n\nFor the simple pipeline in this tutorial (no deletion), both approaches give\nidentical results.  The capture is DEFENSIVE PRACTICE — insurance against\nany future topology-modifying node you add to the tree.",
      },
      {
        title: "Build the scatter surface with MeshGrid inside the GN tree",
        body:
          "The GN tree creates its own scatter geometry internally — no external mesh object required.\n\n  n_grid = nodes.new('GeometryNodeMeshGrid')\n  n_grid.inputs[0].default_value = GRID_SIZE   # Size X (metres)\n  n_grid.inputs[1].default_value = GRID_SIZE   # Size Y (metres)\n  n_grid.inputs[2].default_value = GRID_DIVS   # Vertices X\n  n_grid.inputs[3].default_value = GRID_DIVS   # Vertices Y\n\nWith GRID_SIZE=4.0 and GRID_DIVS=3, MeshGrid produces a 4×4 m plane with\n3×3=9 vertices and 2×2=4 quad faces.  The face count is intentionally low:\nDistributePointsOnFaces distributes across face AREA, not vertex count, so the\nresult is uniform whether the plane has 4 or 400 quads.\n\n  n_dist = nodes.new('GeometryNodeDistributePointsOnFaces')\n  n_dist.distribute_method = 'RANDOM'\n  # inputs: [0]=Mesh [1]=Selection(hidden) [2]=DensityFactor [3]=DensityMax [4]=Seed\n  n_dist.inputs[2].default_value = 1.0               # use full density max\n  n_dist.inputs[3].default_value = SCATTER_DENSITY   # 4.0 pts/m²\n  n_dist.inputs[4].default_value = SCATTER_SEED      # 42\n  links.new(n_grid.outputs[0], n_dist.inputs[0])\n\nWith density=4.0 on 16 m² (4×4), the expected point count is ~64.  RANDOM mode\nuses a Poisson point process — the actual count varies slightly run-to-run due\nto the stochastic sampling, but is stable for a fixed seed.",
      },
      {
        title: "Compute the per-point colour phase and capture it",
        body:
          "Index provides 0, 1, 2, … for each scatter point.  RandomValue turns\nthose integers into deterministic-but-visually-uniform floats in [0,1].\n\n  n_idx = nodes.new('GeometryNodeInputIndex')\n\n  n_rng = nodes.new('GeometryNodeRandomValue')\n  n_rng.data_type = 'FLOAT'\n  # inputs: [0]=Min [1]=Max [2]=ID (per-element variation) [3]=Seed\n  n_rng.inputs[0].default_value = 0.0\n  n_rng.inputs[1].default_value = 1.0\n  n_rng.inputs[3].default_value = 7   # global offset separates from other rng nodes\n  links.new(n_idx.outputs[0], n_rng.inputs[2])   # Index → ID\n\nNow capture:\n\n  n_cap = nodes.new('GeometryNodeCaptureAttribute')\n  n_cap.data_type = 'FLOAT'\n  n_cap.domain    = 'POINT'\n  # inputs: [0]=Geometry [1]=Value(Float)\n  # outputs: [0]=Geometry [1]=Attribute(Float)\n  links.new(n_dist.outputs[0], n_cap.inputs[0])   # scatter cloud → Geometry\n  links.new(n_rng.outputs[0],  n_cap.inputs[1])   # random float  → Value\n\nAfter this node, n_cap.outputs[1] is a concrete FLOAT attribute — one value per\nscatter point, frozen.  The outputs[0] Geometry is the scatter cloud passed\nthrough unchanged (CaptureAttribute is transparent to the geometry itself;\nit only adds a hidden internal attribute).\n\nCritical: n_cap.outputs[1] is NOT a named attribute yet.  It is an anonymous\ninternal attribute reference.  You cannot read it in the Spreadsheet editor.\nTo make it named (and GLB-exportable), you need StoreNamedAttribute later.",
      },
      {
        title: "Build the instance template with IcoSphere + SetMaterial",
        body:
          "Using GeometryNodeIcoSphere keeps the instance template fully inside the\nGN tree — no external sphere prototype object, no ObjectInfo dependency.\n\n  n_ico = nodes.new('GeometryNodeIcoSphere')\n  n_ico.inputs[0].default_value = SPHERE_RADIUS   # Radius\n  n_ico.inputs[1].default_value = SPHERE_SUBDIVS  # Subdivisions (2 → faceted)\n\nAt 2 subdivisions, the ico-sphere has 80 triangular faces — visible facets\nthat read as low-poly in EEVEE, consistent with the studio&rsquo;s faceted\naesthetic described in the cohesive low-poly world article.\n\nAssign the material before instancing:\n\n  n_smat = nodes.new('GeometryNodeSetMaterial')\n  n_smat.inputs[2].default_value = mat   # ColourPhaseEmission material\n  links.new(n_ico.outputs[0], n_smat.inputs[0])\n\nSetMaterial assigns the material DATA slot — equivalent to dragging a material\nonto the object in the Properties panel.  The material node tree (with\nShaderNodeAttribute reading 'colour_phase') is already authored; the attribute\nwill be populated at RealizeInstances time.  Assigning early is not strictly\nnecessary — you could SetMaterial after RealizeInstances — but assigning on\nthe template is the standard pattern because it keeps the material association\nclose to the geometry it belongs to.",
      },
      {
        title: "InstanceOnPoints and why the attribute stays correct",
        body:
          "InstanceOnPoints places one copy of the Instance geometry at each point\nin the Points geometry:\n\n  n_iop = nodes.new('GeometryNodeInstanceOnPoints')\n  # inputs: [0]=Points [1]=Selection [2]=Instance [3]=PickInstance\n  #         [4]=InstanceIndex [5]=Rotation [6]=Scale\n  links.new(n_cap.outputs[0],  n_iop.inputs[0])   # captured cloud → Points\n  links.new(n_smat.outputs[0], n_iop.inputs[2])   # sphere+mat     → Instance\n\nAfter this node, the output geometry has INSTANCE domain — one element per\nsphere instance (one per scatter point).  The POINT domain (scatter vertices)\nno longer exists in the output.\n\nCritical question: what happened to n_cap.outputs[1] — the captured float?  It\nis not yet in the output geometry at all.  CaptureAttribute stores its value\nas a hidden internal attribute on the Geometry that passed through it\n(n_cap.outputs[0]).  InstanceOnPoints reads POINT-domain attributes from its\nPoints input and promotes them to INSTANCE domain on the output — BUT only for\nALREADY-STORED named attributes.  The anonymous captured attribute is NOT\nautomatically promoted.\n\nThis is why StoreNamedAttribute is the next step: it is the bridge that moves\nthe anonymous captured float into a named INSTANCE-domain attribute.",
      },
      {
        title: "StoreNamedAttribute: give the captured value a name and domain",
        body:
          "  n_store = nodes.new('GeometryNodeStoreNamedAttribute')\n  n_store.data_type = 'FLOAT'\n  n_store.domain    = 'INSTANCE'\n  # inputs: [0]=Geometry [1]=Selection(hidden) [2]=Name [3]=Value(Float)\n  n_store.inputs[2].default_value = 'colour_phase'\n  links.new(n_iop.outputs[0],  n_store.inputs[0])   # Instances → Geometry\n  links.new(n_cap.outputs[1],  n_store.inputs[3])   # CA.Attribute → Value\n\nSetting domain='INSTANCE' is the key decision.  StoreNamedAttribute writes\none float per INSTANCE element — one value per sphere instance.  After\nRealizeInstances, each instance expands into real mesh vertices.  The INSTANCE\nfloat is COPIED to every POINT (vertex) of that instance.  All 80 vertices of\nsphere #k share the same colour_phase value.\n\nThe material's ShaderNodeAttribute reads at POINT domain (that is how EEVEE\nmaterials work — they evaluate per-vertex).  All 80 vertices of sphere #k\nhave the same colour_phase, so the entire sphere renders as a single colour.\n\nIf you instead used domain='POINT' on StoreNamedAttribute after InstanceOnPoints,\nyou would be trying to write a POINT-domain attribute on the INSTANCES geometry,\nwhich has no POINT domain at this stage — the result would be no-op or error.\nINSTANCE domain is the correct choice here.\n\nAfter this node the 'colour_phase' attribute is visible in the Spreadsheet\neditor at INSTANCE domain.  It will also appear in the GLB vertex buffer\nunder the custom attribute name _COLOUR_PHASE after export_apply.",
      },
      {
        title: "RealizeInstances, SetShadeSmooth, and the POINT propagation",
        body:
          "  n_real = nodes.new('GeometryNodeRealizeInstances')\n  links.new(n_store.outputs[0], n_real.inputs[0])\n\nRealizeInstances expands every instance into real mesh vertices.  The INSTANCE-\ndomain attribute 'colour_phase' is PROPAGATED to the POINT domain of the\nexpanded mesh.  Each of the ~64 instances contributes 80 vertices; all 80\nvertices of instance #k receive the float stored on that instance.\n\nAfter this node the Spreadsheet shows POINT domain with ~5 120 rows (64 × 80),\neach row having the colour_phase of its parent instance.\n\n  n_ssm = nodes.new('GeometryNodeSetShadeSmooth')\n  n_ssm.domain = 'FACE'\n  n_ssm.inputs[2].default_value = False   # False = flat shading\n  links.new(n_real.outputs[0], n_ssm.inputs[0])\n\nFlat shading assigns one normal per face rather than interpolating across\nvertices.  Combined with the ico-sphere's triangulated faces and the Emission\nmaterial, each sphere renders as a visible-facet polyhedron — the studio's\nconsistent low-poly aesthetic.\n\nNote the domain='FACE' property on SetShadeSmooth.  In Blender 4.0+, the\nsmoothing model moved from a per-vertex flag to a per-face attribute.  Setting\ndomain='FACE' correctly writes to the FACE shade_smooth attribute rather than\nthe deprecated vertex smooth_group.",
      },
      {
        title: "Material: ShaderNodeAttribute reading 'colour_phase'",
        body:
          "The ColourPhaseEmission material is built outside the GN tree and assigned\nvia GeometryNodeSetMaterial:\n\n  n_attr = nodes_m.new('ShaderNodeAttribute')\n  n_attr.attribute_type = 'GEOMETRY'   # reads from mesh data, not object/instancer\n  n_attr.attribute_name = 'colour_phase'   # must match StoreNamedAttribute string\n\nShaderNodeAttribute outputs:\n  outputs[0]: Color (Vector) — float3 interpolated from the attribute\n  outputs[1]: Vector         — same as Color\n  outputs[2]: Fac (Float)    — scalar value for FLOAT-type attributes\n  outputs[3]: Alpha (Float)  — W component if present\n\nFor a FLOAT attribute (our case), the meaningful output is Fac (outputs[2]).\nColor/Vector will also carry the scalar replicated to XYZ, but connecting Fac\nto the ColorRamp Fac socket is explicit and semantically correct.\n\n  links_m.new(n_attr.outputs[2], n_ramp.inputs[0])   # Fac → ColorRamp Fac\n\nThe ColorRamp maps [0,1] through a 6-stop rainbow: red → yellow → green →\ncyan → blue → magenta.  In EEVEE with an Emission BSDF at strength=3.0, every\nfacet renders at full saturation regardless of light angle — ideal for\nconfirming per-instance attribute correctness in a WebXR scene.\n\nattribute_type options:\n  'GEOMETRY'  — reads from the mesh's own attribute data.  Correct for\n                RealizeInstances output.\n  'OBJECT'    — reads from a named custom property on the object.\n  'INSTANCER' — reads from the instancer (the object that created instances).\n                This is NOT what you want here; it would give all instances\n                the same value.",
      },
      {
        title: "Export: colour_phase survives as a custom GLB attribute",
        body:
          "  bpy.ops.export_scene.gltf(\n      filepath                             = str(GLB_OUT),\n      export_format                        = 'GLB',\n      export_apply                         = True,\n      export_draco_mesh_compression_enable = True,\n      export_draco_mesh_compression_level  = 6,\n      export_image_format                  = 'WEBP',\n      export_yup                           = True,\n  )\n\nexport_apply=True is mandatory.  Without it:\n  - The host mesh has no real geometry (the GN modifier hasn't run)\n  - The 'colour_phase' attribute does not exist on the base mesh\n  - The GLB contains zero vertices\n\nWith export_apply=True, the exporter evaluates the full modifier stack first,\nthen exports the evaluated result.  The 'colour_phase' POINT-domain float\nbecomes a custom glTF vertex attribute.  glTF convention: custom attributes\nuse an underscore prefix, so the attribute exports as _COLOUR_PHASE.\n\nIn Three.js:\n  const mesh = gltf.scene.children[0];\n  const colourPhase = mesh.geometry.attributes._COLOUR_PHASE;\n  // colourPhase.array is a Float32Array of length ~5120 (64 × 80 vertices)\n\nYou can then pass this to a custom ShaderMaterial uniform and reproduce the\nrainbow effect at runtime without baking to a texture.",
      },
    ],
    finalResult:
      "A .blend containing an empty host object with a GN modifier that generates ~64 rainbow-coloured flat-shaded ico-spheres scattered across a 4×4 m plane. Each sphere's hue is derived from its scatter-point index, frozen by CaptureAttribute, stored as 'colour_phase' on the INSTANCE domain, and propagated to every vertex after RealizeInstances. A Draco-6 GLB exports with colour_phase as _COLOUR_PHASE in the vertex buffer. The macro gn_capture_attribute.py packages the capture-store-realize chain for one-line reuse in any GN tree.",
    variations: [
      "Per-instance scale from face area: replace RandomValue with GeometryNodeInputMeshFaceArea (domain=FACE). CaptureAttribute(FLOAT, FACE) freezes the area of each face BEFORE DistributePointsOnFaces. After distribution, each scatter point inherits the captured face area (FACE→POINT interpolation happens automatically). Connect CA.Attribute to InstanceOnPoints.inputs[6] (Scale) — denser, smaller faces produce smaller instances. This demonstrates CaptureAttribute with domain='FACE', a cross-domain capture pattern.",
      "Position-based hue spiral: replace RandomValue with SeparateXYZ(Position) feeding ATAN2(Y, X) → MapRange(−π, π, 0, 1). CaptureAttribute freezes the polar-angle hue. Spheres at the same radius share the same hue; the angle encodes position around the scatter plane. The resulting pattern is more structured than random and clearly visible as a gradient from any camera angle.",
      "Named Attribute readback: after StoreNamedAttribute, add a GeometryNodeInputNamedAttribute(data_type='FLOAT', name='colour_phase') node. Its output is a field that reads from the already-stored named attribute. Connect this to a second StoreNamedAttribute(domain='POINT', name='colour_phase_point') to also write the value at POINT domain before RealizeInstances — useful when you need the attribute readable in the Spreadsheet at multiple stages.",
      "Multiple captured attributes: add a second CaptureAttribute(FLOAT_VECTOR, POINT) capturing Position BEFORE DistributePointsOnFaces. This freezes the scatter-point's position — useful if you later apply a SetPosition noise deformation and need the pre-noise position for a parallax effect or UV generation.",
    ],
    troubleshooting: [
      {
        symptom: "All spheres render the same colour",
        cause:
          "StoreNamedAttribute is wired to GroupInput.Geometry or some other geometry that does not carry the captured attribute — or CaptureAttribute.outputs[1] is not connected to StoreNamedAttribute.inputs[3].",
        fix:
          "Check: links.new(n_cap.outputs[1], n_store.inputs[3]). In the Spreadsheet editor, set the domain to INSTANCE and look for the 'colour_phase' column. If it shows zeros or is missing, the connection is broken. Also verify n_store.domain = 'INSTANCE' — using POINT would attempt to write on a geometry that has no POINT domain at that stage.",
      },
      {
        symptom: "ShaderNodeAttribute renders black — no colour visible",
        cause:
          "attribute_type is 'INSTANCER' instead of 'GEOMETRY', or the attribute name string has a typo (case-sensitive), or the material is not assigned to the sphere geometry.",
        fix:
          "Confirm n_attr.attribute_type = 'GEOMETRY' and n_attr.attribute_name = 'colour_phase' exactly matches the string in StoreNamedAttribute. In the Node Editor, with the host object selected and GN evaluated, switch to Material Properties and check that ColourPhaseEmission is in slot 0. If the Spreadsheet shows colour_phase at POINT domain but the material renders black, the attribute_type is the likely culprit.",
      },
      {
        symptom: "GLB has zero vertices or no geometry at all",
        cause: "export_apply=False (the default) was used.",
        fix:
          "Set export_apply=True in the gltf export call. The base mesh object is empty — the GN modifier supplies all geometry. export_apply=False exports the base mesh as-is, producing an empty GLB. Verify by checking the file size: an empty GLB is under 1 KB.",
      },
      {
        symptom: "Colour assignments shift when I add a DeleteGeometry node to the tree",
        cause:
          "CaptureAttribute was removed or bypassed, so the random value field re-evaluates at the new post-deletion indices.",
        fix:
          "Ensure CaptureAttribute is in the tree BEFORE any deletion node, and that its outputs[1] (not outputs[0]) feeds StoreNamedAttribute's Value input. With CaptureAttribute in place, the concrete attribute values for surviving points are unaffected by any downstream deletion.",
      },
      {
        symptom: "colour_phase is missing from the GLB vertex attributes (_COLOUR_PHASE not present)",
        cause:
          "The attribute was stored at INSTANCE domain but RealizeInstances was not included, so the geometry is still an instances set — not a real mesh.",
        fix:
          "Confirm the node chain includes RealizeInstances AFTER StoreNamedAttribute. In the Spreadsheet after RealizeInstances, switch to POINT domain — colour_phase should appear as a FLOAT column. If it does not appear here, the INSTANCE→POINT propagation failed (check node order). Only POINT-domain attributes are written to the glTF vertex buffer.",
      },
    ],
  },
  base,
);

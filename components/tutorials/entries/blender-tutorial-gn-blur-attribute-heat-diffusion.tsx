import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnBlurAttributeHeatDiffusionBody() {
  return (
    <>
      <p>
        <strong>Blur Attribute</strong> performs iterated weighted averaging
        across mesh topology: on every pass, each element&rsquo;s value is
        replaced by a weighted mean of its edge-adjacent neighbours. Seed a
        sharp binary attribute — 1.0 at the north-pole cap, 0.0 everywhere
        else — and after 12 iterations you have a smooth gradient radiating
        outward from the pole toward the equator, shaped entirely by the mesh
        surface. This tutorial builds a &ldquo;heat diffusion dome&rdquo;: the
        diffused float drives a cold-to-hot colour ramp in EEVEE, displacement
        along vertex normals, and an emissive glow at the hot end. An
        optional equatorial insulation band (the <code>Equator_Resistance</code>{" "}
        socket) slows propagation at Z = 0, making the heat barrier visible
        in the Spreadsheet and in rendered output.
      </p>

      <h2>Topological diffusion vs geometric distance</h2>
      <p>
        Blur Attribute counts <em>edge hops</em>, not metres. On the regular
        UV sphere here (32 rings, 64 segments) each ring is geometrically
        equidistant, so hop-count and geodesic distance agree. On a Dual Mesh
        voronoi sphere — whose faces have wildly unequal areas — the two
        diverge completely: a tiny polar pentagon diffuses to its large
        equatorial hexagon neighbours in one hop, the same as any other
        adjacency, regardless of the face&rsquo;s physical size. This means
        Blur Attribute is the right tool when you want &ldquo;spread along the
        surface connectivity&rdquo;, and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-geometry-proximity-deform"
          className={lk}
        >
          Geometry Proximity
        </Link>{" "}
        is the right tool when you want &ldquo;3-D distance to a target
        object&rdquo;. They are complementary, not interchangeable.
      </p>

      <h2>The two-store architecture</h2>
      <p>
        The pipeline uses two consecutive{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          StoreNamedAttribute
        </Link>{" "}
        nodes in the geometry stream. The first materialises{" "}
        <code>heat</code> (the binary 0/1 seed from the pole-cap Compare).
        The second materialises <code>heat_blurred</code> (the output of
        BlurAttribute). Both stores sit <em>upstream</em> of SetPosition so
        the material Attribute node reads pre-deformation values — the same
        freeze-before-deform discipline used throughout these GN tutorials.
        BlurAttribute, as a field node, reads <code>NamedAttribute("heat")</code>{" "}
        from whatever geometry is incoming to its consumer
        StoreNamedAttribute("heat_blurred"). Because that geometry has already
        passed through StoreNamedAttribute("heat"), the seed is materialised
        and available for all N iterations.
      </p>
      <p>
        Without the first store, BlurAttribute would re-evaluate the raw
        Compare field at every iteration rather than spreading previously
        accumulated values — it would still produce a sharp edge, just at a
        slightly shifted threshold, not a diffusion gradient.
      </p>

      <h2>The equatorial insulation band</h2>
      <p>
        The <code>Weight</code> socket on BlurAttribute accepts a FLOAT field
        in [0, 1] per element. It scales how much this element contributes to
        its neighbours&rsquo; average on the next iteration — 1.0 is normal
        conduction, 0.0 blocks all contribution. The blueprint maps{" "}
        <code>|Z| &lt; EQUATOR_WIDTH</code> to the{" "}
        <code>Equator_Resistance</code> group socket (default 0.3), creating a
        ring where heat slows down. Open the Spreadsheet (Ctrl+Shift+click the
        second StoreNamedAttribute), switch to POINT domain, and watch the
        gradient &ldquo;bunch up&rdquo; at the equatorial band as you raise
        Iterations: values above it climb steadily, values inside the band
        accumulate more slowly. This is the discrete equivalent of a material
        with lower thermal conductivity.
      </p>
      <p>
        The weight field is also the mechanism for painting diffusion barriers
        with a weight-painted texture — a topic covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-weight-painted-scatter"
          className={lk}
        >
          Weight-Painted Scatter tutorial
        </Link>
        . Convert the vertex group to a FLOAT attribute with
        VertexGroupToAttribute, and feed it directly to the Weight socket.
      </p>

      <h2>Iterations and convergence</h2>
      <p>
        At Iterations = 1 only the immediate pole-cap neighbours gain any
        heat. At Iterations ≈ 12 on a 32-ring sphere, the gradient reaches
        the equator. At Iterations ≈ 24 the entire southern hemisphere is
        warm, and further iterations flatten the gradient toward a constant.
        Convergence speed depends on mesh topology: a fine mesh (more rings)
        needs more iterations to cross the same angular distance. The group
        socket range is 1–64; above 30 on this mesh, increasing Iterations
        has negligible visual effect. If you need the gradient to stop exactly
        at a target latitude without over-running, clamp the blurred value
        with a MapRange and set its clamping to True.
      </p>

      <h2>Domain behaviour</h2>
      <p>
        Change <code>data_type="FLOAT"</code> domain to <code>"FACE"</code>{" "}
        and BlurAttribute averages across face-adjacent faces (shared edges),
        producing a sharp faceted look because each face holds a constant
        value. At <code>"POINT"</code> domain the values interpolate smoothly
        across faces via the rasteriser. At <code>"EDGE"</code> domain you
        get a different topology graph (edge–edge adjacency via shared
        vertices) — useful for spreading colour along wireframes or edge-crease
        networks. The{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          Vertex Colour Attributes tutorial
        </Link>{" "}
        covers the POINT vs FACE domain distinction in depth as applied to
        colour painting.
      </p>

      <h2>Material: reading the blurred attribute</h2>
      <p>
        The EEVEE Next material uses <code>ShaderNodeAttribute</code> with{" "}
        <code>attribute_type="GEOMETRY"</code> and{" "}
        <code>attribute_name="heat_blurred"</code>. The <code>Fac</code>{" "}
        output (index [2]) carries the scalar float, which feeds into a
        ColorRamp (cold indigo → hot red-orange) wired to Principled BSDF
        Base Color. An Emission shader wired in parallel uses the same Fac
        as Strength — so emission intensity scales with heat, giving the pole
        a glow without a separate emission attribute. This is the same
        attribute-read pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE Toon Cel Shader
        </Link>{" "}
        tutorial where a GN-stored float drives the two-tone threshold.
      </p>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Blender Documentation Team —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/blur_attribute.html"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Blur Attribute Node
          </a>
          , Blender Manual, CC-BY-SA 4.0. Covers the Value, Iterations, and
          Weight inputs; the <code>data_type</code> property (FLOAT / INT /
          VECTOR / COLOR); domain behaviour; and the note that the node is a
          field evaluator, not a geometry transformer. Related nodes in the
          same Attribute section: <em>Evaluate at Index</em> and{" "}
          <em>Evaluate on Domain</em>.
        </li>
        <li>
          Nicolas Janakiev —{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            blender-scripting
          </a>
          , MIT. Direct bpy data-API scripting examples for primitive
          creation, modifier wiring, and batch export. Related: <em>bpybb</em>{" "}
          (MIT, geometry helpers) and{" "}
          <em>blender-python-gallery</em> (MIT, visual showcase).
        </li>
        <li>
          Khronos Group —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            glTF-Blender-IO
          </a>
          , Apache-2.0. <code>export_apply=True</code> realises the GN
          modifier; <code>export_attributes=True</code> writes{" "}
          <code>heat_blurred</code> as{" "}
          <code>_HEAT_BLURRED</code> in the binary glTF accessor for
          Three.js / Babylon.js consumption.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-blur-attribute-heat-diffusion",
  title: "GN Blur Attribute — Heat Diffusion Dome (Blender 5.1)",
  date: "2026-06-02",
  kind: "tutorial",
  excerpt:
    "Blur Attribute performs iterated topological averaging — each pass replaces every vertex value with a weighted mean of its edge-adjacent neighbours. This tutorial seeds a 1.0/0.0 binary attribute on the north-pole cap of a UV sphere and diffuses it outward over 1–24 iterations, driving a cold-to-hot colour ramp, normal displacement, and an equatorial insulation band via the Weight socket.",
  Body: GnBlurAttributeHeatDiffusionBody,
};

export const entry = buildInstructable(
  {
    goal: "Build a UV sphere with a GN modifier that seeds a 'heat' float attribute at the north-pole cap, blurs it outward via Blur Attribute with a configurable equatorial insulation band, and drives a cold-to-hot colour ramp plus normal displacement. Export a Draco-compressed GLB with 'heat_blurred' as a custom vertex attribute.",
    blenderVersion: "5.1",
    libraryPath: "blends/geometry-nodes/gn-blur-attribute-heat-diffusion",
    time: "1–2 hours",
    difficulty: "intermediate",
    prerequisites: [
      "Blender 5.1 installed",
      "Geometry Nodes modifier basics — adding a GN modifier, navigating the node editor",
      "Familiarity with StoreNamedAttribute and InputNamedAttribute",
      "Python scripting access (Scripting workspace or terminal)",
    ],
    steps: [
      {
        title: "Create the UV sphere",
        body: "bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1.0). Name the object 'heat_dome'. The high ring/segment count gives Blur Attribute a fine topology graph to diffuse across — reducing rings below 16 makes the gradient visibly stair-stepped at low iteration counts.",
      },
      {
        title: "Build the GN tree and group sockets",
        body: "bpy.data.node_groups.new('HeatDiffusion', 'GeometryNodeTree'). Add INPUT/OUTPUT Geometry via ng.interface.new_socket(). Add INPUT 'Iterations' (NodeSocketInt, default=12, min=1, max=64) and INPUT 'Equator_Resistance' (NodeSocketFloat, default=0.3, min=0, max=1). Add NodeGroupInput and NodeGroupOutput.",
      },
      {
        title: "Seed the heat attribute",
        body: "Add GeometryNodeInputPosition → ShaderNodeSeparateXYZ → FunctionNodeCompare(FLOAT, GREATER_THAN, B=0.92). This Boolean field is True for vertices within ~23° of the north pole. Add GeometryNodeStoreNamedAttribute (data_type='FLOAT', domain='POINT', Name='heat'). Wire GroupInput.Geometry → Store_seed.Geometry, Compare.Result → Store_seed.Value. The Boolean auto-casts to 0.0/1.0 float.",
      },
      {
        title: "Build the equatorial weight map",
        body: "From the same SeparateXYZ.Z output, wire to ShaderNodeMath(ABSOLUTE) → FunctionNodeCompare(FLOAT, LESS_THAN, B=0.15). Add GeometryNodeSwitch (input_type='FLOAT', inputs[1]=1.0 (normal band), inputs[2]=GroupInput.Equator_Resistance (insulation band)). Wire Compare.Result → Switch.inputs[0]; Switch.outputs[0] → BlurAttribute.inputs[2] (Weight).",
      },
      {
        title: "Blur the attribute",
        body: "Add GeometryNodeInputNamedAttribute (data_type='FLOAT', Name='heat'). Add GeometryNodeBlurAttribute (data_type='FLOAT'). Wire NamedAttr.Attribute → Blur.inputs[0] (Value), GroupInput.Iterations → Blur.inputs[1]. Add GeometryNodeStoreNamedAttribute (data_type='FLOAT', domain='POINT', Name='heat_blurred'). Wire Store_seed.Geometry → Store_blur.Geometry, Blur.Value → Store_blur.Value.",
      },
      {
        title: "Add displacement along normals",
        body: "Add GeometryNodeInputNamedAttribute (data_type='FLOAT', Name='heat_blurred'). Add ShaderNodeMapRange (From 0→1, To 0→0.18). Add GeometryNodeInputNormal. Add ShaderNodeVectorMath(SCALE): inputs[0]=Normal, inputs[3]=MapRange.Result. Add GeometryNodeSetPosition; wire Store_blur.Geometry → SetPos.Geometry, VectorScale.Vector → SetPos.inputs[3] (Offset). Wire SetPos.Geometry → GroupOutput.",
      },
      {
        title: "Build the heat diffusion material",
        body: "Create a material with ShaderNodeAttribute (attribute_type='GEOMETRY', attribute_name='heat_blurred'). Wire Fac → ShaderNodeValToRGB ColorRamp (element[0] = deep indigo #031259, element[1] = red-orange #ff4400). Wire ColorRamp.Color → Principled BSDF Base Color. Add ShaderNodeEmission, wire Fac → Emission.Strength (so emission scales with heat). Add ShaderNodeAddShader mixing BSDF + Emission → Output.",
      },
      {
        title: "Attach modifier and export",
        body: "mod = obj.modifiers.new('HeatDiffusion', 'NODES'); mod.node_group = ng. Save as heat_diffusion_dome.blend. Apply modifier for export: bpy.ops.object.modifier_apply(modifier='HeatDiffusion'). Call bpy.ops.export_scene.gltf(export_apply=True, export_attributes=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_image_format='WEBP'). The heat_blurred attribute appears as _HEAT_BLURRED in the GLB binary accessor.",
      },
    ],
    finalResult:
      "A .blend with a UV sphere under a live GN modifier: sharply-seeded 1.0/0.0 pole cap diffuses to a smooth heat gradient driven by topology hops, with a visible slowdown at the equatorial insulation band. The colour ramp and normal displacement are live — drag the Iterations slider on the modifier panel to watch the heat spread and retract. A Draco-compressed GLB with heat_blurred as a custom vertex attribute for Three.js.",
    variations: [
      "Dual heat sources: add a second StoreNamedAttribute seeding 'cold' at the south pole (Z < -0.92). Run a second BlurAttribute on 'cold'. Mix the two blurred values: ShaderNodeMath(SUBTRACT, heat_blurred, cold_blurred) → MapRange → ColorRamp. The equatorial region becomes a battleground where the two fronts collide.",
      "Anisotropic conductivity: instead of a band-shaped weight, paint a vertex group on the mesh and convert it to a FLOAT attribute via VertexGroupToAttribute. Feed this directly to the Weight socket. The diffusion follows the painted region boundaries instead of a latitude threshold.",
      "Animated pulse: keyframe Iterations from 1 → 20 → 1 over 90 frames in record.py. The heat radiates outward then retracts — a looping topology-propagation effect that renders cleanly via bpy.ops.render.opengl(animation=True).",
    ],
    troubleshooting: [
      {
        symptom: "Flat uniform colour — gradient not visible",
        cause:
          "The first StoreNamedAttribute ('heat') is missing or its Name string is empty. BlurAttribute reads NamedAttribute('heat') which returns 0 everywhere → the blurred value is also 0 everywhere, so cold colour fills the dome.",
        fix: "Select StoreNamedAttribute_seed in the GN editor, confirm Name = 'heat' (exact case). Use Ctrl+Shift+click on the node to pin the Spreadsheet to it and verify the 'heat' column is present at POINT domain with values 0.0 and 1.0.",
      },
      {
        symptom: "Material shows no colour — sphere is grey",
        cause:
          "The ShaderNodeAttribute attribute_name does not match the stored name exactly. Case matters: 'heat_blurred' ≠ 'Heat_Blurred'.",
        fix: "In the Material node editor, select the Attribute node and confirm attribute_name = 'heat_blurred'. Verify the modifier has been applied before GLB export, or that export_apply=True is set, so the attribute exists in the exported mesh.",
      },
      {
        symptom: "Equatorial insulation band has no visible effect",
        cause:
          "GeometryNodeSwitch input_type is not set to 'FLOAT', or the Weight socket link is missing. Without the weight, Blur Attribute defaults to Weight=1.0 everywhere.",
        fix: "Select the Switch node, confirm input_type='FLOAT'. Check the link from Switch.outputs[0] to BlurAttribute.inputs[2]. Raise Equator_Resistance to 0.0 (full insulator) to confirm the band appears — it should show as a visible horizontal band where the gradient stalls.",
      },
    ],
  },
  base,
);

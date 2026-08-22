import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnAttributeStatisticEvaluateOnDomainBody() {
  return (
    <>
      <p>
        <strong>Attribute Statistic</strong> is the only Geometry Nodes node
        that collapses a field down to global scalars in a single evaluation
        pass. Feed it Face Area, set <code>domain=&#39;FACE&#39;</code>, and
        its outputs — Min, Max, Mean, Standard Deviation — are constants
        uniform across the whole geometry, not per-element fields. Pipe Min
        and Max into Map Range and you have a self-calibrating normaliser:
        whatever the mesh looks like, whatever the displacement amplitude, the
        full [0, 1] range always maps to the full colour ramp. This tutorial
        builds a noise-displaced terrain where every face is coloured by its
        world-space area, and a second attribute produced via{" "}
        <strong>Evaluate on Domain</strong> demonstrates how to transfer a
        face-domain field into vertex context for downstream interop.
      </p>

      <h2>Global normalisation vs hard-coded bounds</h2>
      <p>
        Most GN colour-mapping pipelines hard-code a MapRange from{" "}
        <code>0</code> to <code>some_maximum</code>. That breaks the moment you
        change the mesh, the displacement strength, or the scale. Attribute
        Statistic solves it cleanly: <code>inputs[2]</code> takes any FLOAT
        field, <code>domain=&#39;FACE&#39;</code> tells it to sample once per
        face, and <code>outputs[&quot;Min&quot;]</code> /{" "}
        <code>outputs[&quot;Max&quot;]</code> are live scalars wired directly
        to MapRange&rsquo;s <em>From Min</em> / <em>From Max</em> sockets. The
        node re-evaluates on every modifier recalculation, so dragging the
        Noise_Strength slider in the panel reprints the heat map in real time —
        no bake, no refresh.
      </p>
      <p>
        This pattern is a fundamentally different tool from{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-geometry-proximity-deform"
          className={lk}
        >
          Geometry Proximity
        </Link>{" "}
        (which measures 3-D distance to a target object) or{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
          className={lk}
        >
          Blur Attribute
        </Link>{" "}
        (which spreads values along topology). Attribute Statistic tells you
        about the distribution of an existing attribute; the other two{" "}
        <em>create</em> attributes. Use it wherever you need to answer
        &ldquo;what is the range of this field across the whole mesh?&rdquo;
      </p>

      <h2>Evaluate on Domain: context transfer without interpolation</h2>
      <p>
        The bpy type <code>GeometryNodeFieldOnDomain</code> (UI name updated
        to &ldquo;Evaluate on Domain&rdquo; in 4.3 — the type identifier is
        unchanged) re-evaluates an input field within the context of a
        specified domain. Set <code>domain=&#39;FACE&#39;</code> and
        connect the ColorRamp output to <code>inputs[0]</code>; downstream,
        when a POINT-domain StoreNamedAttribute consumes the output, each
        vertex samples the colour of its lowest-index adjacent face.
      </p>
      <p>
        The critical subtlety: <strong>this is not interpolation</strong>.
        Adjacent vertices that share a face will have the same colour; the
        seam appears at the face boundary, not averaged across it. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          Named Attribute pattern
        </Link>{" "}
        used throughout these tutorials stores face-constant data at FACE
        domain exactly because that is where it belongs semantically — Evaluate
        on Domain is for those moments when a downstream consumer (a shader,
        a physics sim, a Three.js morph target) requires POINT domain data but
        the source is inherently per-face. To smooth the result, chain one
        pass of Blur Attribute (1–2 iterations) on the vertex attribute after
        storing it.
      </p>

      <h2>Two attributes, one GLB, two use cases</h2>
      <p>
        The blueprint stores both <code>face_heat</code> (FACE domain,{" "}
        <code>FLOAT_COLOR</code>) and <code>vertex_heat</code> (POINT domain,{" "}
        <code>FLOAT_COLOR</code>) on the same mesh and exports both via{" "}
        <code>export_attributes=True</code>. In the GLB binary they appear as{" "}
        <code>_FACE_HEAT</code> and <code>_VERTEX_HEAT</code> custom accessors
        in the primitive&rsquo;s attribute dictionary. In Three.js, load them
        as{" "}
        <code>geometry.attributes._FACE_HEAT</code> (Float32Array, itemSize=4)
        and feed to a ShaderMaterial uniform for a faceted cel look; or use{" "}
        <code>_VERTEX_HEAT</code> with standard vertex colour interpolation for
        a smooth read. The{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          Vertex Colour Attributes tutorial
        </Link>{" "}
        covers the Three.js side of this pipeline in full.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-attribute-statistic-evaluate-on-domain",
  title:
    "GN Attribute Statistic + Evaluate on Domain — Global-Normalised Face-Area Heat Map (Blender 5.1)",
  date: "2026-06-03",
  kind: "tutorial",
  excerpt:
    "Attribute Statistic collapses a field to global scalars (Min, Max, Mean …) in one GN pass — combine with Map Range for a self-calibrating normaliser that reprints the colour ramp live as you reshape the mesh. Evaluate on Domain re-evaluates the face-domain colour result in vertex context, exposing the hard-edge semantics of cross-domain field transfer and when to follow it with Blur Attribute.",
  Body: GnAttributeStatisticEvaluateOnDomainBody,
};

export const entry = buildInstructable(
  {
    goal: "Build a 14×14 grid with a GN modifier that noise-displaces the Z axis, measures world-space face area globally via Attribute Statistic, normalises to [0,1] via Map Range (using live Min/Max), maps to a cool-warm Color Ramp, and stores both a face-domain attribute (face_heat) and a vertex-domain attribute via Evaluate on Domain (vertex_heat). Export a Draco-compressed GLB with both custom accessors.",
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-attribute-statistic-evaluate-on-domain",
    time: "1–2 hours",
    difficulty: "intermediate",
    prerequisites: [
      "Blender 5.1 installed",
      "Geometry Nodes modifier basics — adding a modifier, navigating the node editor",
      "Familiarity with StoreNamedAttribute and InputNamedAttribute",
      "Python scripting access (Scripting workspace or terminal)",
    ],
    steps: [
      {
        title: "Create the terrain grid",
        body: "bpy.ops.mesh.primitive_grid_add(x_subdivisions=13, y_subdivisions=13, size=2.0). Name the object 'area_terrain'. A 14×14 vertex grid gives 169 quads — enough faces to show the Min/Max spread clearly without overwhelming the Spreadsheet.",
      },
      {
        title: "Add noise displacement",
        body: "In the GN tree: add GeometryNodeInputPosition → ShaderNodeTexNoise (Scale=3.2, Detail=4.0, Roughness=0.65). Add ShaderNodeMath(MULTIPLY): inputs[0]=Noise.Fac, inputs[1]=GroupInput.Noise_Strength. Add ShaderNodeCombineXYZ: Z=Math.result, X and Y stay 0. Add GeometryNodeSetPosition: inputs[0]=GroupInput.Geometry, inputs[3]=CombineXYZ. This creates terrain with unequal face areas — steep flanks get stretched faces, flat tops get compact faces.",
      },
      {
        title: "Add Attribute Statistic",
        body: "Add GeometryNodeAttributeStatistic. Set data_type='FLOAT', domain='FACE'. Wire SetPosition.outputs[0] → AttrStat.inputs[0] (evaluation context). Add GeometryNodeInputFaceArea. Wire FaceArea.Area → AttrStat.inputs[2] (attribute field). Leave inputs[1] (Selection) open — evaluates as True for all faces. The outputs Min and Max are now live global scalars. Confirm in the Spreadsheet: pin AttrStat and drag Noise_Strength — watch Min and Max change.",
      },
      {
        title: "Normalise and colour",
        body: "Add ShaderNodeMapRange (data_type='FLOAT', clamp=True, inputs[3]=0.0, inputs[4]=1.0). Wire FaceArea.Area → inputs[0], AttrStat.Min → inputs[1], AttrStat.Max → inputs[2]. Add ShaderNodeValToRGB: element[0] deep blue at 0.0, element[1] orange-red at 1.0. Wire MapRange.Result → ValToRGB.Fac.",
      },
      {
        title: "Store face_heat and vertex_heat",
        body: "Add GeometryNodeStoreNamedAttribute: data_type='FLOAT_COLOR', domain='FACE', inputs[2]='face_heat'. Wire SetPosition.outputs[0] → store_face.inputs[0], ValToRGB.Color → store_face.inputs[3]. Add GeometryNodeFieldOnDomain: data_type='FLOAT_COLOR', domain='FACE'. Wire ValToRGB.Color → FieldOnDomain.inputs[0]. Add second StoreNamedAttribute: data_type='FLOAT_COLOR', domain='POINT', inputs[2]='vertex_heat'. Wire store_face.outputs[0] → store_vert.inputs[0], FieldOnDomain.outputs[0] → store_vert.inputs[3]. Wire store_vert.outputs[0] → GroupOutput.",
      },
      {
        title: "Material and GLB export",
        body: "Create a material with ShaderNodeAttribute (attribute_type='GEOMETRY', attribute_name='face_heat'). Wire Attribute.Color → Principled BSDF Base Color. Attach modifier: mod = obj.modifiers.new('AreaHeatMap', 'NODES'); mod.node_group = ng. Save .blend. Apply modifier: bpy.ops.object.modifier_apply(modifier='AreaHeatMap'). Export: bpy.ops.export_scene.gltf(export_apply=True, export_attributes=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6). Both _FACE_HEAT and _VERTEX_HEAT appear in the GLB primitive attribute dict.",
      },
    ],
    finalResult:
      "A .blend with a noise-displaced 14×14 grid under a live GN modifier: Attribute Statistic samples all 169 face areas every evaluation, normalises them globally, and maps the result to a cool-warm ramp stored as face_heat (FACE domain) and vertex_heat (POINT domain via Evaluate on Domain). Drag Noise_Strength in the modifier panel to watch the heat map self-calibrate in real time. A Draco-compressed GLB with _FACE_HEAT and _VERTEX_HEAT as custom Float32Array accessors for Three.js.",
    variations: [
      "Replace Face Area with a custom FLOAT attribute computed elsewhere in the tree — for example, the dot product of the face normal with a light direction (a quick diffuse term). AttributeStatistic normalises whatever you give it; the heat-map pipeline is domain-agnostic.",
      "Add a third StoreNamedAttribute at EDGE domain using Evaluate on Domain(domain='FACE') on the same ColorRamp output. Each edge samples the colour of one adjacent face, giving a wiry heat-map outline that reads cleanly in wireframe mode or as a Freestyle edge attribute.",
      "Chain GeometryNodeBlurAttribute (data_type='FLOAT_COLOR', 2 iterations) after the vertex_heat store. Compare the Spreadsheet before and after to see how 2 iterations of topological averaging smooths the hard face-boundary seams into a gradient — the practical workflow for getting smooth vertex colours from a face-domain source.",
    ],
    troubleshooting: [
      {
        symptom: "All faces display the same colour — no gradient",
        cause:
          "AttributeStatistic.inputs[2] (Attribute) is disconnected. Without the FaceArea field, the statistic evaluates a constant 0 for every element, so Min=0 and Max=0 → MapRange divides by zero and clamps to one colour.",
        fix: "Select the AttributeStatistic node; confirm a wire runs from GeometryNodeInputFaceArea.Area to inputs[2]. Use Ctrl+Shift+click to pin the node in the Spreadsheet and verify Min < Max.",
      },
      {
        symptom:
          "vertex_heat has hard edges — looks identical to face_heat in the viewport",
        cause:
          "This is correct and expected. GeometryNodeFieldOnDomain(domain='FACE') re-evaluates the face colour at each vertex by sampling the lowest-index adjacent face — it does NOT interpolate across face boundaries. Both attributes will display hard edges unless smoothed downstream.",
        fix: "To soften vertex_heat, add GeometryNodeBlurAttribute (data_type='FLOAT_COLOR', Iterations=2) between the FieldOnDomain output and the vertex StoreNamedAttribute. 1–2 iterations typically closes the seams on a regular grid.",
      },
      {
        symptom: "_FACE_HEAT and _VERTEX_HEAT are absent from the exported GLB",
        cause:
          "export_attributes=True was not passed to export_scene.gltf, or the modifier was not applied before export so the mesh has no materialised custom attributes.",
        fix: "Ensure export_apply=True and export_attributes=True are both set. After bpy.ops.object.modifier_apply(modifier='AreaHeatMap'), check obj.data.attributes in the Python console to confirm face_heat and vertex_heat are present before calling the exporter.",
      },
    ],
  },
  base,
);

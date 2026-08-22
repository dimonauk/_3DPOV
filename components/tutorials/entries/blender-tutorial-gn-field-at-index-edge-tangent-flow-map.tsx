import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnFieldAtIndexEdgeTangentFlowMapBody() {
  return (
    <>
      <p>
        <strong>Field at Index</strong> (<code>GeometryNodeFieldAtIndex</code>) is a
        pure field node — it has no Geometry socket at all. Its{" "}
        <code>domain</code> property declares which element <em>table</em> to read
        from (POINT = vertex array, EDGE = edge array, and so on). Its{" "}
        <code>Index</code> input is an integer field that selects a row in that table.
        The evaluation <em>context</em> — what &ldquo;current element&rdquo; means when
        Index is evaluated — flows in from whichever geometry-socket node consumes the
        output. In this tutorial, that consumer is{" "}
        <code>StoreNamedAttribute(domain=&apos;EDGE&apos;)</code>, so Index evaluates
        once per edge, and Field at Index reads one vertex per call.
      </p>
      <p>
        The project builds an <em>altitude gradient slope map</em> on a noise-displaced
        IcoSphere. For each of the 120 edges (subdivisions=2), two Field at Index
        calls read the stored Z altitude of the edge&rsquo;s two endpoint vertices. The
        difference — positive for uphill edges, negative for downhill — drives a
        blue→white→red ColorRamp. The result is a diagnostic colour that encodes local
        surface slope direction directly into mesh edge data.
      </p>

      <h2>Field at Index vs Sample Index — the definitive distinction</h2>
      <p>
        Both nodes access elements by integer index, but they differ in one critical
        respect: <strong>geometry context</strong>.
      </p>
      <ul>
        <li>
          <code>GeometryNodeSampleIndex</code> has an explicit Geometry socket. It crosses
          geometry boundaries — the geometry you pass in is independent of the current
          modifier context. See the{" "}
          <Link
            href="/tutorials/blender-tutorial-gn-sample-index-echo-grid"
            className={lk}
          >
            Sample Index echo-grid tutorial
          </Link>{" "}
          for a full treatment.
        </li>
        <li>
          <code>GeometryNodeFieldAtIndex</code> has <em>no</em> Geometry socket. It
          reads from the geometry flowing through the current modifier context. Wiring in
          a separate geometry is not an option — and not needed, because the{" "}
          <code>domain</code> property already selects which element array (POINT, EDGE,
          FACE, CORNER) to index into.
        </li>
      </ul>
      <p>
        The practical consequence: if you need to read a vertex attribute at an edge
        endpoint <em>within the same mesh</em>, use Field at Index. If you need to
        read from a different object entirely, use Sample Index.
      </p>

      <h2>Why EdgeVertices alone is not enough</h2>
      <p>
        <code>GeometryNodeInputEdgeVertices</code> exposes four outputs per edge:{" "}
        <code>Vertex Index 1</code>, <code>Vertex Index 2</code>,{" "}
        <code>Position 1</code>, and <code>Position 2</code>. Position is already
        provided directly — so for reading vertex <em>positions</em>, Field at Index is
        redundant. The reason to use it here is to read a <em>custom attribute</em>:{" "}
        <code>altitude</code> (the noise-displaced Z coordinate), stored earlier in the
        same GN tree via{" "}
        <code>StoreNamedAttribute(&apos;altitude&apos;, POINT, FLOAT)</code>.
        EdgeVertices has no way to surface custom attributes — only built-in position.
        Field at Index is the only mechanism for reading an arbitrary POINT-domain
        float at the two vertex indices supplied by EdgeVertices.
      </p>
      <p>
        This same pattern applies to weight-paint groups, custom vertex scores,
        normals baked from a high-poly, any NamedAttribute stored on the POINT domain
        — all accessible via Field at Index with an index from EdgeVertices or any
        other topology node. Compare the similar corner-domain approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-corners-of-face-vertex-of-corner-faceted-gem-gradient"
          className={lk}
        >
          Corners of Face + Vertex of Corner tutorial
        </Link>
        , which performs the same cross-domain lookup but at the CORNER level.
      </p>

      <h2>The two-store pattern</h2>
      <p>
        A common mistake: omitting the first{" "}
        <code>StoreNamedAttribute(&apos;altitude&apos;, POINT)</code> and wiring{" "}
        <code>SeparateXYZ(InputPosition).Z</code> directly into the Field at Index
        Value socket. This appears to work but produces wrong results. The reason:
        Field at Index evaluates the <em>Value field</em> at each Index — lazily — in
        the EDGE domain context. <code>InputPosition</code> in EDGE context gives the
        midpoint of each edge, not the vertex position. The first Store materialises
        the Z value as a genuine per-vertex FLOAT attribute in the POINT array, which
        Field at Index then reads correctly via integer indexing.
      </p>
      <p>
        For a deeper analysis of lazy field evaluation and when materialisation is
        required, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-attribute-statistic-evaluate-on-domain"
          className={lk}
        >
          Attribute Statistic + Evaluate on Domain tutorial
        </Link>
        , which walks the same principle in the context of global min/max normalisation.
      </p>

      <h2>EDGE → POINT domain promotion</h2>
      <p>
        Per-edge colour (<code>edge_slope</code>, stored at EDGE domain) cannot feed
        a vertex shader directly — the shader expects per-vertex data. The fix is
        <code>GeometryNodeFieldOnDomain(domain=&apos;EDGE&apos;)</code> (Evaluate on
        Domain), which re-evaluates an EDGE-domain field in POINT context. When
        consumed by <code>StoreNamedAttribute(domain=&apos;POINT&apos;)</code>, Blender
        averages the colours of all edges adjacent to each vertex, giving smooth
        interpolation across the sphere surface. This is the same averaging strategy
        used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-topology-vertex-valence-heat-map"
          className={lk}
        >
          Vertex Valence Heat Map tutorial
        </Link>
        , which promotes EDGE-domain valence counts to per-vertex emission colour via
        the same Evaluate on Domain → StoreNamedAttribute(POINT) chain.
      </p>

      <h2>Slope colour encoding and tuning GRAD_MAX</h2>
      <p>
        The gradient is computed as{" "}
        <code>altitude_v2 &minus; altitude_v1</code>. Because Edge Vertices always
        returns vertices in the same winding order (v1 = lower index, v2 = higher
        index), the sign of the gradient encodes which direction is &ldquo;uphill&rdquo;
        relative to vertex index ordering, not necessarily world-space direction. This
        is a diagnostic convention, not a directional one.
      </p>
      <p>
        <code>GRAD_MAX = 0.18</code> matches the <code>NOISE_STRENGTH</code> of 0.22 m
        with some headroom. If you increase displacement amplitude, increase{" "}
        <code>GRAD_MAX</code> proportionally, or all edges will clamp to full red or
        blue (saturated). If GRAD_MAX is too large relative to displacement, the colour
        range will be compressed around white and slope differences will be invisible.
      </p>

      <h2>GLB export and Three.js read-back</h2>
      <p>
        <code>export_attributes=True</code> writes both <code>edge_slope</code> and{" "}
        <code>vertex_slope</code> as custom glTF accessors:{" "}
        <code>_edge_slope</code> and <code>_vertex_slope</code> (underscore-prefixed
        per the glTF spec §2.4). The per-vertex one is colour 0 if promoted to{" "}
        <code>COLOR_0</code> by the exporter. In Three.js:{" "}
        <code>geometry.attributes[&apos;_vertex_slope&apos;]</code> or{" "}
        <code>geometry.attributes.color</code> depending on whether the exporter
        promotes FLOAT_COLOR to <code>COLOR_0</code>. Use{" "}
        <code>export_colors=True</code> to trigger promotion.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/field/field_at_index.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Field at Index Node — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team. Authoritative reference for
          domain semantics, data_type options, and the distinction from Sample Index.
          Related nodes in the same manual section: <em>Sample Index</em>,{" "}
          <em>Evaluate at Index</em>.
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/read/edge_vertices.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Edge Vertices Node — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team. Documents Vertex Index 1/2
          and Position 1/2 outputs, the winding-order convention, and the relationship
          to the Edges of Vertex and Corners of Edge sibling nodes.
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          · MIT · Nicolas Janakiev. Python scripting patterns for GN node-tree
          construction via <code>bpy.data.node_groups</code> used throughout
          blueprint.py.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF-Blender-IO
          </a>{" "}
          · Apache-2.0 · Khronos Group. The Blender GLB exporter — the
          <code>export_attributes</code> and <code>export_colors</code> flags that
          write <code>_vertex_slope</code> and <code>COLOR_0</code> into the mesh
          primitive. Sibling project:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Assets
          </a>{" "}
          (CC0/various) — reference GLBs for testing custom accessor round-trips.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-field-at-index-edge-tangent-flow-map",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Build an altitude gradient slope map on a noise-displaced IcoSphere using GeometryNodeFieldAtIndex to read per-vertex altitude at both endpoints of every edge. Store per-edge blue→white→red slope colour, promote to vertex domain via Evaluate on Domain, and export a GLB with custom glTF accessors.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Understand GN field evaluation: Named Attribute, Store Named Attribute",
      "Know what domain means in GN (POINT, EDGE, FACE, CORNER)",
      "Comfortable with ColorRamp and MapRange nodes",
    ],
    steps: [
      {
        title: "Create IcoSphere host and GN modifier",
        body: "primitive_ico_sphere_add(subdivisions=2, radius=1.0). Add a NODES modifier. Create a GeometryNodeTree with one NodeSocketGeometry Output. GroupInput[0] carries the base mesh geometry implicitly.",
      },
      {
        title: "Noise displacement and first Store (altitude)",
        body: "ShaderNodeTexNoise(3D, Scale=NOISE_SCALE) → ShaderNodeMapRange(0..1 → −NOISE_STRENGTH..+NOISE_STRENGTH) → CombineXYZ(Z=mapped_fac) → GeometryNodeSetPosition(Offset=combined). Then: GeometryNodeInputPosition → SeparateXYZ.Z → GeometryNodeStoreNamedAttribute('altitude', POINT, FLOAT). This materialises the displaced Z before Field at Index reads it.",
      },
      {
        title: "Edge Vertices → Field at Index (×2)",
        body: "GeometryNodeInputEdgeVertices outputs Vertex Index 1 and Vertex Index 2 (INT, EDGE domain). For each: GeometryNodeInputNamedAttribute('altitude', FLOAT) → GeometryNodeFieldAtIndex(domain='POINT', data_type='FLOAT'). Connect fai.inputs['Value'] ← named_attr.outputs['Attribute']; fai.inputs['Index'] ← edge_verts.outputs['Vertex Index 1'] (or 2). The EDGE-domain evaluation context from the downstream StoreNamedAttribute drives both.",
      },
      {
        title: "Gradient, MapRange, ColorRamp",
        body: "ShaderNodeMath(SUBTRACT, fai2.outputs['Value'], fai1.outputs['Value']) → gradient_raw. ShaderNodeMapRange(−GRAD_MAX, +GRAD_MAX, 0.0, 1.0, clamp=True) → t. ShaderNodeValToRGB: stop at 0.0=(0,0.1,1)blue, 0.5=(1,1,1)white, 1.0=(1,0.08,0)red. Connect ColorRamp.outputs['Color'] → StoreNamedAttribute('edge_slope', EDGE, FLOAT_COLOR).",
      },
      {
        title: "Evaluate on Domain: EDGE → POINT",
        body: "GeometryNodeInputNamedAttribute('edge_slope', FLOAT_COLOR) → GeometryNodeFieldOnDomain(domain='EDGE', data_type='FLOAT_COLOR') → GeometryNodeStoreNamedAttribute('vertex_slope', POINT, FLOAT_COLOR). The FieldOnDomain node re-evaluates the EDGE attribute in POINT context, averaging adjacent-edge colours per vertex.",
      },
      {
        title: "Emission material and export",
        body: "ShaderNodeAttribute(attribute_type='GEOMETRY', attribute_name='vertex_slope') → ShaderNodeEmission(Strength=3.0). MixShader(Fac=0.8, in1=Diffuse dark, in2=Emission). Render engine BLENDER_EEVEE_NEXT + use_bloom=True. bpy.ops.export_scene.gltf(export_apply=True, export_attributes=True, export_colors=True, export_draco_mesh_compression_enable=True).",
      },
    ],
    troubleshooting: [
      {
        symptom: "All edges are white — no slope gradient visible",
        cause:
          "GRAD_MAX is much larger than the actual altitude variation on the sphere",
        fix: "Lower GRAD_MAX to match NOISE_STRENGTH. With NOISE_STRENGTH=0.22, start with GRAD_MAX=0.15. Open Spreadsheet editor, select EDGE domain, inspect the 'edge_slope' column to see raw values.",
      },
      {
        symptom: "Field at Index outputs zeros for all edges",
        cause:
          "StoreNamedAttribute('altitude') is wired AFTER the Field at Index nodes in the geometry flow, so the attribute does not exist yet when Field at Index evaluates",
        fix: "Confirm the geometry socket chain: SetPosition → StoreNamedAttribute('altitude') → StoreNamedAttribute('edge_slope'). Field at Index reads from the attribute table, not the geometry socket, so the store must be upstream in the topology.",
      },
      {
        symptom:
          "TypeError: cannot connect ShaderNodeValToRGB.Color to StoreNamedAttribute.Value",
        cause:
          "StoreNamedAttribute data_type is set to FLOAT or FLOAT_VECTOR instead of FLOAT_COLOR",
        fix: "store_edge.data_type = 'FLOAT_COLOR'. The ColorRamp outputs 'Color' (COLOR socket) which maps to FLOAT_COLOR in GN attribute storage.",
      },
      {
        symptom: "vertex_slope attribute missing in Three.js GLB",
        cause:
          "export_attributes=False or export_colors=False in the glTF exporter call",
        fix: "Add both export_attributes=True and export_colors=True. Check geometry.attributes in the browser console with THREE.GLTFLoader — look for '_vertex_slope' or 'color'.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-field-at-index-edge-tangent-flow-map",
    title:
      "GN Field at Index — Altitude Gradient Slope Map: Per-Edge Height Difference via Indexed Vertex Lookup",
    date: "2026-06-27",
    kind: "tutorial",
    excerpt:
      "Use GeometryNodeFieldAtIndex — a pure intra-geometry field node — to read per-vertex altitude at both endpoints of every mesh edge. Combines Edge Vertices integer indices with a two-store materialisation pattern, EDGE→POINT domain promotion via Evaluate on Domain, and a blue/white/red ColorRamp to visualise surface slope on a noise-displaced IcoSphere.",
    Body: GnFieldAtIndexEdgeTangentFlowMapBody,
  },
);

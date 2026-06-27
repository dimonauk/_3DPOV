import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnAccumulateFieldWeightedStripeTubeBody() {
  return (
    <>
      <p>
        <strong>Accumulate Field</strong> (<code>GeometryNodeAccumulateField</code>) is
        a pure field node that computes a running total — a prefix sum — of any
        per-element value across an entire domain in a single GN evaluation pass. It
        exposes three outputs: <code>Leading</code> (exclusive prefix sum: all
        elements <em>before</em> the current one), <code>Trailing</code> (inclusive:
        all elements up to and including the current), and <code>Total</code> (the full
        group sum, the same on every element). A <code>Group ID</code> input isolates
        accumulation per group, making per-spline arc-length computation trivial on
        multi-spline curves.
      </p>
      <p>
        This tutorial builds a Bezier S-tube where 64 resampled points each carry a
        noise-driven weight. <code>AccumulateField</code> sums these weights; dividing
        the <code>Leading</code> output by <code>Total</code> yields a UV parameter
        where high-weight segments own wide colour stripes and low-weight segments own
        narrow ones. The distinction from standard <code>SplineParameter.Factor</code>
        (which gives equal arc-length fractions) is that the weight field can encode
        <em>any</em> arbitrary per-point quantity — importance, time cost, density —
        not just geometric distance.
      </p>

      <h2>Why AccumulateField and not Index × step?</h2>
      <p>
        When all per-point values are identical (say, a constant{" "}
        <code>STEP_HEIGHT</code> for a staircase), the prefix sum reduces to{" "}
        <code>Index × STEP_HEIGHT</code>. That is tractable without Accumulate Field.
        The node becomes indispensable when the values <em>vary</em> per element: a
        noise-driven weight, an area, a user-painted mask. In those cases there is no
        closed-form expression for element <em>i</em>&rsquo;s cumulative offset because
        it depends on the actual values of every preceding element. Accumulate Field
        computes this correctly in O(N) — one pass over all N elements. The only
        alternative is a{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-iterative-lsystem-branch-growth"
          className={lk}
        >
          Repeat Zone
        </Link>
        , which re-evaluates the body N×M times (N iterations, M elements) — far
        slower for large meshes.
      </p>

      <h2>The three outputs and how to read them</h2>
      <p>
        For a sequence of four weights <code>[w0, w1, w2, w3]</code>:
      </p>
      <ul>
        <li>
          <code>Leading</code>: <code>[0, w0, w0+w1, w0+w1+w2]</code> — the offset
          at which this element <em>begins</em>. Element 0&rsquo;s leading value is
          always 0 because nothing precedes it.
        </li>
        <li>
          <code>Trailing</code>: <code>[w0, w0+w1, w0+w1+w2, W]</code> — the offset
          at which this element <em>ends</em>. The last element&rsquo;s trailing value
          equals Total.
        </li>
        <li>
          <code>Total</code>: <code>[W, W, W, W]</code> — the same sum on every
          element; used for normalisation.
        </li>
      </ul>
      <p>
        Dividing <code>Leading</code> by <code>Total</code> gives a UV parameter in{" "}
        <code>[0, 1)</code> where each element&rsquo;s UV interval width is
        proportional to its weight. High-weight elements occupy wider UV space →
        wider rendered stripes. This is the weighted arc-length parameterisation at
        the heart of this tutorial. For a treatment of uniform (geometric) arc-length
        UV on curves, see{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-points-bead-necklace-instance-align"
          className={lk}
        >
          Curve to Points — Bead Necklace
        </Link>
        , which uses <code>SplineParameter.Factor</code> instead.
      </p>

      <h2>Group ID and multi-spline correctness</h2>
      <p>
        Without wiring <code>Group ID</code>, all curve points accumulate into a
        single sequence regardless of which spline they belong to. On a multi-spline
        curve this produces one continuous running total spanning all splines —
        almost certainly wrong. Wiring{" "}
        <code>GeometryNodeInputSplineIndex</code> to <code>Group ID</code> makes each
        spline restart its accumulation from zero independently. The <code>Total</code>
        output then reflects the weight sum for <em>that spline only</em>, so
        <code>Leading / Total</code> gives a clean 0..1 range per spline.
      </p>
      <p>
        This same pattern works with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-field-at-index-edge-tangent-flow-map"
          className={lk}
        >
          Field at Index
        </Link>{" "}
        tutorial&rsquo;s two-store pattern: Group ID can be any integer field —
        material index, island ID, face set — giving per-group running totals useful
        for packed UV island placement or multi-group weighting.
      </p>

      <h2>Sort Index — controlling accumulation order</h2>
      <p>
        The optional <code>Sort Index</code> input (INT field) determines the order in
        which elements are summed within each group. Leaving it unwired defaults to
        natural element index (0, 1, 2, …). Wiring a custom integer — for example,
        the descending rank of face area — accumulates in a different order, which
        shifts which elements get the &ldquo;early&rdquo; (low) vs &ldquo;late&rdquo;
        (high) prefix-sum values. A common use: sort mesh faces by area to accumulate
        coverage in size order (largest face first), then use{" "}
        <code>Leading / Total &lt; 0.5</code> as a mask to select the smallest 50% of
        faces by area rank.
      </p>

      <h2>The 1-D noise weight and SplineParameter.Factor</h2>
      <p>
        The weight field is a{" "}
        <code>ShaderNodeTexNoise(noise_dimensions=&apos;1D&apos;)</code> sampled at{" "}
        <code>SplineParameter.Factor</code> — the arc-length fraction of each
        resampled curve point (0..1 after <code>ResampleCurve(COUNT)</code>). Using
        Factor rather than raw index as the noise coordinate means the weight pattern
        is independent of sample count — doubling <code>RESAMPLE_COUNT</code> doesn&rsquo;t
        change which weights appear, only how finely the tube is tessellated. The
        comparison is instructive: <code>SplineParameter.Factor</code> is a
        uniform-spaced geometric parameter; <code>AccumulateField(weight).Leading / Total</code>
        is a weight-proportional parameter. They differ whenever the noise field is
        non-constant.
      </p>
      <p>
        For winding paths with tight bends, geometric arc length is already available
        from <code>SplineParameter.Length</code>. Accumulate Field adds value when
        you want to weight by something <em>other</em> than distance — importance,
        density, painted mask. For per-point position look-ahead on curves (used when
        computing segment-to-segment distance within a zone), see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-offset-point-in-curve-chain-links"
          className={lk}
        >
          Offset Point in Curve — Chain Links tutorial
        </Link>
        , which pairs <code>GeometryNodeOffsetPointInCurve</code> with{" "}
        <code>Field at Index</code> to read the next point&rsquo;s position.
      </p>

      <h2>Curve to Mesh and attribute transfer</h2>
      <p>
        <code>GeometryNodeStoreNamedAttribute</code> runs on the <em>curve</em>
        geometry (after <code>ResampleCurve</code>, before{" "}
        <code>GeometryNodeCurveToMesh</code>). The stored <code>FLOAT_COLOR</code>{" "}
        attribute <code>weighted_stripe</code> lives on the POINT domain of the curve.
        When <code>CurveToMesh</code> tessellates the tube, it transfers POINT-domain
        attributes to the corresponding vertex rings of the resulting mesh — all 8
        profile vertices at position <em>i</em> receive the colour of curve point{" "}
        <em>i</em>. The result is uniform colour bands perpendicular to the tube axis,
        with no UV unwrap required. For hard-surface export requiring a UV map instead,
        see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-handle-positions-bezier-s-curve-taper"
          className={lk}
        >
          Set Handle Positions — S-Curve Taper
        </Link>{" "}
        tutorial, which covers Bezier handle manipulation before CurveToMesh.
      </p>

      <h2>GLB export for WebXR</h2>
      <p>
        <code>export_apply=True</code> realises the GN modifier before export.{" "}
        <code>export_colors=True</code> promotes the <code>weighted_stripe</code>{" "}
        FLOAT_COLOR attribute to <code>COLOR_0</code> in the glTF primitive, readable
        in Three.js via <code>geometry.attributes.color</code>. Without this flag,
        the attribute exports as a custom accessor named{" "}
        <code>_weighted_stripe</code> — accessible but not auto-applied by the
        default Three.js material. For Draco-compressed multi-material pipelines and
        quad-safe tessellation before GLB export, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-triangulate-mesh-webxr-tri-safe-export"
          className={lk}
        >
          Triangulate Mesh — WebXR Tri-Safe Export tutorial
        </Link>
        .
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/field/accumulate_field.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Accumulate Field Node — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team. Authoritative reference for
          domain semantics, Group ID behaviour, Sort Index ordering, and the
          Leading/Trailing/Total output definitions. Related nodes in the same manual
          section:{" "}
          <em>Field at Index</em>, <em>Evaluate on Domain</em>, <em>Spline Parameter</em>.
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
          · MIT · Nicolas Janakiev. Python scripting patterns for bpy GN node-tree
          construction used throughout <code>blueprint.py</code>.
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
          · Apache-2.0 · Khronos Group. The Blender GLB exporter that promotes
          FLOAT_COLOR to <code>COLOR_0</code> via <code>export_colors=True</code>.
          Sibling project:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Assets
          </a>{" "}
          (CC0 / various) — reference GLBs for verifying custom attribute round-trips
          in Three.js and Babylon.js.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-accumulate-field-weighted-stripe-tube",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Use GeometryNodeAccumulateField to compute a noise-weighted running sum across 64 resampled curve points. Divide the Leading output by Total to get a non-uniform UV parameter where stripe widths reflect per-point weight, then export a Bezier S-tube with alternating coral/cobalt stripes as a GLB for WebXR.",
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
      "Familiar with ResampleCurve and CurveToMesh nodes",
      "Comfortable with MapRange and ColorRamp nodes",
    ],
    steps: [
      {
        title: "Build the S-curve object",
        body: "bpy.ops.curve.primitive_bezier_curve_add(). Access spline.bezier_points[0] and [1], set .co and .handle_left/.handle_right to form an inflected S in XZ. This gives a path with continuously varying curvature — unlike a circle, the spacing of evaluated points is non-uniform in parameter space, motivating the weighted-UV approach.",
      },
      {
        title: "Resample curve + configure GN modifier",
        body: "ng = bpy.data.node_groups.new('GN_AccumulateField_WeightedStripe', 'GeometryNodeTree'). Add NODES modifier. Wire GroupInput[0] → GeometryNodeResampleCurve(mode='COUNT', count=RESAMPLE_COUNT). 'COUNT' mode gives equal arc-length spacing — 64 points at geometrically uniform intervals.",
      },
      {
        title: "Noise weight field",
        body: "GeometryNodeSplineParameter.outputs['Factor'] → ShaderNodeTexNoise(noise_dimensions='1D').inputs['W']. Using the arc-length fraction as the noise coordinate makes the weight pattern resolution-independent. ShaderNodeMapRange(0..1 → WEIGHT_MIN..WEIGHT_MAX) converts noise.Fac to the working weight range. Output: per-point FLOAT field in [0.40, 1.60].",
      },
      {
        title: "AccumulateField — prefix sum of weights",
        body: "GeometryNodeAccumulateField(domain='POINT', data_type='FLOAT'). inputs['Value'] ← map_weight.Result. inputs['Group ID'] ← GeometryNodeInputSplineIndex.outputs[0] — each spline accumulates independently. Sort Index left unwired → natural 0..N-1 order. Outputs: Leading (exclusive prefix sum), Trailing (inclusive), Total (full spline sum).",
      },
      {
        title: "Weighted UV and stripe pattern",
        body: "ShaderNodeMath(DIVIDE, Leading, Total) → weighted UV in [0, 1). ×NUM_STRIPES → FLOOR → MODULO(2) → alternating 0/1. ShaderNodeValToRGB: stop 0.0 = coral (0.94, 0.33, 0.18), stop 1.0 = cobalt (0.17, 0.42, 0.88). Result = FLOAT_COLOR per point.",
      },
      {
        title: "Store attribute, curve to mesh, export",
        body: "GeometryNodeStoreNamedAttribute('weighted_stripe', POINT, FLOAT_COLOR) on the resampled curve, BEFORE CurveToMesh. Wire resample.Curve → store → CurveToMesh(profile=CurvePrimitiveCircle(R=0.07, resolution=8), fill_caps=True) → GroupOutput. bpy.ops.export_scene.gltf(export_apply=True, export_colors=True, export_draco_mesh_compression_enable=True).",
      },
    ],
    troubleshooting: [
      {
        symptom: "All stripes are the same width — weighting has no effect",
        cause:
          "WEIGHT_MIN and WEIGHT_MAX are equal, or the noise scale is so low that all weights are nearly identical",
        fix: "Set WEIGHT_MIN=0.40, WEIGHT_MAX=1.60. Increase WEIGHT_NOISE_SCALE to at least 2.0. Open the Spreadsheet editor, select the resampled curve, switch to POINT domain — inspect the 'weighted_stripe' column to confirm the colour values vary.",
      },
      {
        symptom: "AccumulateField.Total is zero for all points",
        cause:
          "The map_weight.Result output is connected to AccumulateField.Value but the MapRange 'From Min/Max' clamp is inverted (From Min > From Max)",
        fix: "Ensure From Min < From Max in the MapRange. With noise.Fac in [0,1], From Min=0.0 and From Max=1.0. Total of 64 points with weights in [0.4,1.6] should be approximately 64.",
      },
      {
        symptom: "Multi-spline curve: second spline stripes restart from Total of first spline",
        cause: "Group ID not wired — all points accumulate into one sequence",
        fix: "Wire GeometryNodeInputSplineIndex.outputs[0] → AccumulateField.inputs['Group ID']. Each spline's Total will then equal its own weight sum, not the cumulative total of all preceding splines.",
      },
      {
        symptom: "weighted_stripe attribute is missing in the Three.js GLB",
        cause: "export_colors=False in the gltf export call",
        fix: "Add export_colors=True. This promotes the FLOAT_COLOR attribute to COLOR_0 in the glTF primitive. Verify with: loader.load('tube.glb', (gltf) => console.log(gltf.scene.children[0].geometry.attributes)).",
      },
      {
        symptom: "TypeError: could not connect ShaderNodeTexNoise.W to SplineParameter.Factor",
        cause:
          "ShaderNodeTexNoise is created with default noise_dimensions='3D', which uses a Vector socket ('Vector') not a float socket ('W')",
        fix: "Set noise.noise_dimensions = '1D' BEFORE wiring. The 1D mode exposes the 'W' FLOAT input. In the UI: Texture Nodes header shows the dimension selector; switch to '1D' first.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-accumulate-field-weighted-stripe-tube",
    title:
      "GN Accumulate Field — Proportional UV Stripes: Noise-Weighted Arc-Length Tiling on a Curve Tube",
    date: "2026-06-27",
    kind: "tutorial",
    excerpt:
      "Use GeometryNodeAccumulateField to compute a noise-weighted running sum across 64 resampled curve points. The Leading/Total ratio gives a non-uniform UV parameter — wider stripes where weights are high, narrower where low — applied to a Bezier S-tube and exported as a WebXR GLB.",
    Body: GnAccumulateFieldWeightedStripeTubeBody,
  },
);

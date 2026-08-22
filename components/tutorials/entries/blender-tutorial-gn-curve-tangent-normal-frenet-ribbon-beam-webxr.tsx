import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Two Geometry Nodes field sources sit in the <strong>Curve Read</strong>{" "}
        category and are almost always skipped over:{" "}
        <code>Curve&nbsp;Tangent</code> and{" "}
        <code>Curve&nbsp;Normal</code>. Every practical curve tutorial reaches
        straight for <code>Curve&nbsp;to&nbsp;Points</code> (which outputs a
        Tangent socket) or <code>Spline&nbsp;Parameter</code> (which outputs a
        Factor for driving other effects). These two nodes are different in kind
        — they are pure <em>field sources</em>, not operators. They have no
        Geometry input; they evaluate lazily at whatever point in the GN tree
        their output is consumed. Understanding that distinction is what this
        tutorial is about.
      </p>
      <p>
        The <strong>Frenet-Serret frame</strong> is the classical machinery for
        describing the geometry of a 3-D curve. At every point you have three
        orthonormal vectors: <strong>T</strong> (Tangent, the direction of
        travel), <strong>N</strong> (Normal, toward the centre of curvature),
        and <strong>B</strong> = T&nbsp;×&nbsp;N (Binormal, the remaining
        lateral axis). Blender&rsquo;s <code>CurveTangent</code> node gives you
        T and <code>CurveNormal</code> gives you N. B is a two-node chain: feed
        both into <code>VectorMath(CROSS_PRODUCT)</code>. Together they form the
        full frame. Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-curve-tilt-mobius-ribbon"
          className={lk}
        >
          Set Curve Tilt tutorial
        </Link>
        , where the tilt value <em>rotates</em> the Frenet normal around T —
        that tutorial manipulates the frame; this one reads and stores it.
      </p>
      <p>
        The scene is a seven-point Bezier S-curve. A GN modifier on that curve
        object resamples it to 64 uniform points, then stores{" "}
        <code>_T</code>, <code>_N</code>, <code>_B</code>, and{" "}
        <code>beam_t</code> (Spline Parameter Factor) as named POINT-domain
        attributes before feeding the curve into{" "}
        <code>CurveToMesh</code> with an eight-vertex circle profile. The
        resulting tube mesh carries all four attributes per vertex; the
        Holoflow exporter copies any attribute whose name begins with an
        underscore into the GLB accessor list. In Three.js you can then drive
        an anisotropic highlight along <code>_T</code>, a glow gradient from{" "}
        <code>_N</code>, and a plasma distortion axis from{" "}
        <code>_B</code> — without any UV atlas or post-process pass. Compare
        the attribute-storage approach with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          Store Named Attribute shader bridge tutorial
        </Link>
        , which uses the same mechanism for a different data payload on a
        mesh object rather than a swept curve.
      </p>
      <p>
        <code>CurveNormal</code> has two modes. <strong>Z_UP</strong> projects
        the world Z-axis perpendicular to T and normalises it. On a path that
        passes through a near-vertical segment (T&nbsp;≈&nbsp;±Z), the
        projection length falls toward zero and the frame flips suddenly between
        adjacent points — the tube shows a pronounced UV twist at that
        location. <strong>MINIMUM_ROTATION</strong> (parallel transport)
        propagates the previous point&rsquo;s normal forward with the minimum
        rotation that keeps it perpendicular to T. There are no discontinuities
        on open paths. The S-curve in this blueprint rises steeply enough to
        trigger the Z_UP artefact, so MINIMUM_ROTATION is non-optional. This
        mirrors the problem you will recognise from the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-points-bead-necklace-instance-align"
          className={lk}
        >
          Curve to Points bead necklace tutorial
        </Link>
        , where instance rotation on a near-vertical spline must use the same
        parallel-transport convention to avoid spinning beads.
      </p>
      <p>
        Attributes stored on the curve&rsquo;s POINT domain before{" "}
        <code>CurveToMesh</code> survive on the output mesh — each ring of tube
        vertices inherits the attribute value of its source curve point.{" "}
        <code>SplineParameter.Factor</code> becomes a smooth 0→1 gradient along
        the beam that a fragment shader can read as{" "}
        <code>beam_t</code> to fade the ends in/out. The export call uses{" "}
        <code>export_attributes=True</code> alongside Draco level&nbsp;6
        compression; Draco quantises FLOAT_VECTOR to 10-bit precision, which
        introduces ±0.001 error per component — negligible for a direction
        vector used in shading but worth documenting in the GLB validator
        output. For a complete look at the Draco + attribute export pipeline
        and how the atelier viewer loads these files, see the{" "}
        <Link href="/atelier" className={lk}>
          Atelier WebXR viewer
        </Link>
        .
      </p>
      <p>
        <strong>Outside sources:</strong> The{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/read/curve_tangent.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Curve Tangent node
        </a>{" "}
        (CC-BY-SA 4.0, Blender Foundation) describes the field evaluation model
        and the two output options (tangent and tilt). The companion page for{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/read/curve_normal.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Curve Normal
        </a>{" "}
        explains the MINIMUM_ROTATION vs Z_UP distinction. The GN tree in this
        blueprint was validated against{" "}
        <a
          href="https://github.com/BrendanParmer/NodeToPython"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          NodeToPython (MIT, Brendan Parmer)
        </a>
        , a serialisation tool that round-trips node groups to Python scripts —
        useful for verifying that socket names and data types match the
        Blender Python API exactly. Its sibling test suite at{" "}
        <code>tests/</code> exercises a wide range of GN node types and is the
        quickest way to confirm an API name has changed between Blender versions.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-curve-tangent-normal-frenet-ribbon-beam-webxr",
  title:
    "GN Curve Tangent + Curve Normal — Frenet-Serret Frame Ribbon Beam for WebXR",
  date: "2026-07-03",
  kind: "tutorial",
  excerpt:
    "Use CurveTangent and CurveNormal as lazy field sources to store the full Frenet-Serret frame (T, N, B) as named GLB attributes on a swept energy-beam tube, enabling anisotropic and gradient shaders in Three.js without UV atlases.",
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/geometry-nodes/gn-curve-tangent-normal-frenet-ribbon-beam-webxr/",
    time: "1–2 hours",
    difficulty: "advanced",
    overview:
      "Store the complete Frenet-Serret orthonormal frame per vertex on a swept tube GLB using Blender's CurveTangent and CurveNormal field nodes, then read T, N, B, and beam_t in Three.js to drive anisotropic beam shaders without UV atlases.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "CurveNormal.mode=MINIMUM_ROTATION requires ≥3.4; GeometryNodeSetShadeSmooth domain property requires ≥4.1",
      },
    ],
    prerequisites: [
      "Comfortable building Geometry Nodes trees via Python (bpy node_groups API)",
      "Knows what a named attribute is and how StoreNamedAttribute works",
      "Understands Bezier curve splines in Blender (control points, handle types)",
      "Has read the Curve to Mesh tutorial or equivalent",
    ],
    steps: [
      {
        title: "Understand the Frenet-Serret frame",
        body: `At any point on a smooth curve you can define three orthonormal vectors:
T (Tangent) — the unit vector in the direction of travel. If you walked along the curve, T points straight ahead.
N (Normal) — the unit vector toward the centre of curvature, i.e. the concave side. On a circle, N always points to the circle's centre.
B (Binormal) — T × N in that order. It is perpendicular to both T and N, completing a right-handed coordinate system.

These three vectors form the Frenet-Serret moving frame. They are not fixed in space — they change at every point along the curve.

In Blender 5.1:
- CurveTangent outputs T as a FLOAT_VECTOR field.
- CurveNormal(mode=MINIMUM_ROTATION) outputs N.
- VectorMath(CROSS_PRODUCT, T, N) gives B.

There is no built-in Binormal node because B follows mathematically from T and N.`,
      },
      {
        title: "Build the S-curve",
        body: `Run Stage 1 and Stage 2 of blueprint.py. A seven-point Bezier curve with AUTO handles appears in the viewport, rising from (−1.6, 0, 0) to (1.6, 0, 3.0) in a sinuous S-shape.

WHY seven points: fewer control points (3–4) give too little curvature variation; the Frenet Normal barely moves and MINIMUM_ROTATION vs Z_UP differences are not visible. Seven points give two clear curvature reversals — one upper S-bend, one lower — so both the Normal direction flip (Z_UP artefact) and its absence (MINIMUM_ROTATION) are clearly demonstrable.

WHY Bezier not Poly: a Poly spline has sharp angles at each control point. The CurveTangent at a corner is undefined (discontinuous). Bezier AUTO handles guarantee G1 continuity everywhere, so CurveTangent is smooth and CurveNormal's parallel transport works correctly.`,
      },
      {
        title: "Build the GN tree: resample and store the frame",
        body: `Run Stage 4 of blueprint.py. The key chain is:

  ResampleCurve(COUNT=64)
    → StoreNamedAttribute("_T", FLOAT_VECTOR, CurveTangent)
    → StoreNamedAttribute("_N", FLOAT_VECTOR, CurveNormal(MIN_ROT))
    → StoreNamedAttribute("_B", FLOAT_VECTOR, VectorMath(CROSS, T, N))
    → StoreNamedAttribute("beam_t", FLOAT, SplineParameter.Factor)

All four nodes operate on the resampled curve — 64 points, uniform arc-length spacing. WHY resample first: the raw Bezier curve stores only 7 control points with variable spacing; CurveTangent evaluates at evaluated segments, which cluster near control points on complex paths. Resampling to COUNT=64 first ensures uniform spatial coverage before the frame vectors are materialised.

In the Geometry Nodes editor (open alongside the viewport), you can add a Viewer node after each StoreNamedAttribute and inspect the attribute values in the Spreadsheet editor. For "_T", column X should be roughly the X-component of the beam's forward direction at each point.`,
      },
      {
        title: "Observe the Z_UP vs MINIMUM_ROTATION difference",
        body: `In the GN tree, find the CurveNormal node. Change mode from MINIMUM_ROTATION to Z_UP and watch the tube in the viewport.

Near the steep upper section of the S-curve (T ≈ (0, 0, 1)), the Z_UP projection of world-Z perpendicular to T collapses — the Normal vector jumps and the tube's UV/orientation suddenly spins a full quarter-turn. You will see a twisted kink in the Material Preview shading.

Switch back to MINIMUM_ROTATION. The kink disappears. The parallel-transport frame rolls smoothly through the steep section.

This is the single most important practical lesson in this tutorial: Z_UP is only safe on flat paths where T stays well away from ±Z. For anything that climbs or dips, MINIMUM_ROTATION is mandatory.`,
      },
      {
        title: "Sweep the tube and add noise",
        body: `The CurveToMesh node receives:
- Curve: the resampled+attributed curve (from the last StoreNamedAttribute)
- Profile Curve: a CurvePrimitiveCircle (RADIUS mode, radius=0.042, 8 vertices)
- Fill Caps: True

8 profile vertices × 64 path points = 512 quads → 1024 triangles + 16 cap triangles ≈ 1040 tris total. Well under the WebXR 10k-tri budget for a single prop.

After CurveToMesh, a Noise Texture drives a small positional offset (±14 mm) to give the beam an organic breathing quality. The noise coordinates are 3-D position-based rather than UV-based, so the displacement is spatially coherent even without a UV map.

SetShadeSmooth(FACE, True) completes the tube, removing the hard silhouette edges between adjacent 8-sided rings.`,
      },
      {
        title: "Export with attributes and verify",
        body: `Run the GLB export block (Stage 6). The key flags are:
  export_apply=True   — applies the GN modifier before export
  export_attributes=True — includes named attributes in the accessor list
  export_draco_mesh_compression_enable=True, level=6

In the exported GLB, open it in gltf-validator (or the Khronos glTF Viewer). Under meshes[0].primitives[0].attributes you should see:
  POSITION, NORMAL, _T, _N, _B, beam_t

The underscore prefix (_T, _N, _B) conforms to glTF §3.7.3 which reserves prefixed attributes for application-defined use. Three.js reads these as BufferAttribute objects directly from geometry.attributes['_T'] etc.

In Three.js, assign them to material uniforms for a beam shader:
  const tangent = geo.attributes['_T'];
  const t       = geo.attributes['beam_t'];
  // use t.array to drive an alpha fade at beam ends`,
      },
    ],
    finalResult:
      "A sinuous energy beam tube (1040 triangles, Draco-compressed GLB, ~12 KB) with four per-vertex custom attributes: _T (Frenet tangent), _N (Frenet normal, parallel-transport frame), _B (binormal = T×N), and beam_t (0→1 position along beam). All four are readable in Three.js as BufferAttribute objects, enabling anisotropic highlight, bend-direction gradient, and alpha-fade effects without UV atlases or post-process compositing.",
    variations: [
      "Ribbon instead of tube: replace CurvePrimitiveCircle with CurvePrimitiveLine (start=(−0.06, 0, 0), end=(0.06, 0, 0)). CurveToMesh sweeps a flat quad strip; enable Fill Caps=False (a ribbon has open ends). Reduce NOISE_STRENGTH to 0 for a clean holographic blade look. The _T / _N / _B attributes survive identically — use _B as the ribbon&apos;s width axis in the shader for an anisotropic edge highlight.",
      "Animated beam growth: add a Trim Curve node (mode=FACTOR) before CurveToMesh. Animate its End socket from 0→1 over 40 frames. The stored beam_t attribute can drive an alpha mask so the beam fades at the growing tip — no material keyframes needed, just a beam_t-threshold uniform in Three.js updated each frame.",
      "Multi-strand helix: before the ResampleCurve, add a Set Position that offsets the curve by VectorMath(SCALE, CurveNormal, STRAND_OFFSET). Run a Repeat Zone over STRAND_COUNT copies, rotating the offset angle each iteration. Each strand inherits its own Frenet frame attributes, producing a cable-bundle effect. Connect to the helix variant from the Distribute Points on Curves tutorial for a climbing multi-strand vine.",
    ],
    troubleshooting: [
      {
        symptom: "_T attribute is absent from the GLB",
        cause:
          "export_attributes=False in the bpy.ops.export_scene.gltf() call, or the name does not begin with an underscore (glTF requires underscore prefix for user-defined attributes per §3.7.3).",
        fix: "Set export_attributes=True and verify attribute names start with '_'. In the Blender Spreadsheet editor (Domain=Point, with the beam object selected), confirm the attribute appears in the column list before export.",
      },
      {
        symptom: "Tube has a twist kink visible in viewport — Möbius-like seam",
        cause:
          "CurveNormal mode is Z_UP and the curve passes near-vertical. The frame flips at the steep section.",
        fix: "Change n_nrm.mode = 'MINIMUM_ROTATION' in blueprint.py and rerun. Alternatively, if the path is genuinely flat (Z-variation < 20% of path length) Z_UP is fine and faster to evaluate.",
      },
      {
        symptom: "CurveToMesh produces no output — mesh socket is empty",
        cause:
          "The profile curve (CurvePrimitiveCircle) is not connected to the Profile Curve input, or the path curve lost its geometry through a broken StoreNamedAttribute chain.",
        fix: "In the GN editor, trace the Geometry line from GroupInput through each StoreNamedAttribute to CurveToMesh.Curve, and confirm CurvePrimitiveCircle connects to CurveToMesh.ProfileCurve. Use a Viewer node after each store node to confirm the curve geometry is still present.",
      },
    ],
  },
  base,
);

export { entry };

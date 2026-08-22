import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <strong>Points to Curves</strong> is the node that turns a point
        cloud into a set of curve strands by grouping consecutive points
        that share the same integer attribute value. Each unique value
        becomes one POLY spline; the points within a group are connected
        in ascending point-index order. It is not a simulation and not a
        pathfinding algorithm — it is a pure organisational node: you
        decide the grouping, it connects the dots.
      </p>
      <p>
        The studio application here is poi-orbit ribbon geometry. A poi
        orbit sampled at N angular steps is a list of N world-space
        positions. Points to Curves turns that ordered list into one closed
        strand. Five concurrent orbits at different radii and Z-modulation
        phases → five distinct ribbons, each swept through an 8-sided
        circular profile via Curve to Mesh, each colour-coded by spline
        parameter via a Hue-to-RGBA ramp. The resulting GLB carries the{" "}
        <code>strand_factor</code> float as a custom accessor (
        <code>_STRAND_FACTOR</code> in the glTF JSON) so a Three.js
        material can reconstruct the gradient at runtime without baking it
        into vertex colours.
      </p>

      <h2>Fields are lazy; Points to Curves is not</h2>
      <p>
        Most GN value nodes are <em>fields</em> — lazy expressions that
        re-evaluate at whatever domain is active at the point of
        consumption. A <code>SplineParameter.Factor</code> field evaluated
        before <code>Points to Curves</code> gives each scatter point a
        value based on its scatter-point index. Evaluated <em>after</em>,
        it gives each curve point a value based on its position along the
        output strand — which is exactly what you want for a colour
        gradient that runs from strand-start to strand-end. This ordering
        sensitivity is why the node graph places{" "}
        <code>SplineParameter</code> <em>after</em>{" "}
        <code>Points to Curves</code> and before{" "}
        <code>Curve to Mesh</code>. Compare the field-laziness explanation
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          Capture Attribute tutorial
        </Link>
        , which solves the same ordering problem in reverse — freezing a
        field value at scatter time so that downstream deletions cannot
        change it.
      </p>

      <h2>The grouping rule and index ordering</h2>
      <p>
        Points to Curves reads one per-point INT attribute — the{" "}
        <em>curve group ID</em>. Every point whose group ID is{" "}
        <code>k</code> contributes one control vertex to the{" "}
        <em>k</em>-th output spline, inserted in ascending order of the
        point&rsquo;s linear index in the incoming Geometry. The ordering
        invariant is important: if you want the orbit to go
        counterclockwise, the points must be stored with ascending index
        in the counterclockwise direction. The blueprint enforces this by
        generating orbit positions in ascending angular order (
        <code>angle = 2π × step / N_STEPS</code>). Reversing the order
        (counting down) reverses the spline direction — relevant for tilt
        calculations and for the direction of the Frenet frame, as the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-tangent-normal-frenet-ribbon-beam-webxr"
          className={lk}
        >
          Frenet ribbon tutorial
        </Link>{" "}
        demonstrates.
      </p>
      <p>
        Points that share <em>no</em> group ID with any other point form
        single-vertex degenerate splines — zero-length curves that are
        legal but invisible after Curve to Mesh. The node&rsquo;s second
        output socket, <strong>Points</strong>, emits any points that
        were explicitly excluded by a selection field; here we leave the
        selection unwired (meaning <em>all</em> points are eligible) and
        discard the Points output entirely.
      </p>

      <h2>Resample before cyclic, not after</h2>
      <p>
        The node graph chains as: <code>Points to Curves → Resample
        Curve → Set Spline Cyclic → ...</code>. This ordering matters.
        Resampling a cyclic curve includes the closing span (last point
        back to first), which shifts every sample position by one{" "}
        <code>1/Count</code> fraction compared to resampling the open
        curve and then closing it. For colour gradients the shift is
        visible — the gradient will not return to its starting hue at the
        point where the strand closes. By resampling first (open curve,
        even spacing), then marking cyclic (closing the gap with one
        implicit span that the renderer draws but Resample never saw), the
        gradient is computed on the correct arc length and the visual
        closure looks seamless.
      </p>
      <p>
        For a deeper walk of Resample Curve&rsquo;s Count vs Length vs
        Evaluated modes, and how arc-length parameterisation differs from
        angular parameterisation on non-circular paths, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-resample-curve-railing-balustrade-bezier-path"
          className={lk}
        >
          Resample Curve — Railing &amp; Balustrade tutorial
        </Link>
        .
      </p>

      <h2>Curve to Mesh and the profile sweep</h2>
      <p>
        Once the strands are resampled and closed, the pipeline sweeps an
        8-sided circle (radius 0.018 m) along each strand&rsquo;s tangent
        using Curve to Mesh. The tangent direction at each control vertex
        comes from the curve&rsquo;s evaluated tangent — the same value
        that <code>Curve Tangent</code> exposes as a field. The 8-sided
        polygon gives the ribbon a subtle faceted silhouette consistent
        with the studio&rsquo;s flat-shaded WebXR aesthetic.{" "}
        <strong>Fill Caps = True</strong> closes both ends of each tube so
        the GLB meshes are water-tight — no open boundaries that would
        cause z-fighting or transparent-depth artefacts in Three.js.
      </p>
      <p>
        The Curve to Mesh node does not let you independently control
        twist per strand. To add tilt — a rotation of the profile around
        the curve tangent — chain a{" "}
        <code>Set Curve Tilt</code> node between Resample Curve and Curve
        to Mesh. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-curve-tilt-mobius-ribbon"
          className={lk}
        >
          Set Curve Tilt — Möbius Ribbon tutorial
        </Link>{" "}
        covers the full tilt pipeline, including how a single 2π tilt
        ramp over a closed curve produces a topological Möbius band.
      </p>

      <h2>Exporting strand_factor as a GLB accessor</h2>
      <p>
        The material reads <code>strand_factor</code> via a{" "}
        <code>ShaderNodeAttribute</code> node with{" "}
        <code>attribute_type=&apos;GEOMETRY&apos;</code>. The glTF exporter
        maps this POINT-domain float attribute to a custom vertex accessor
        in the GLB JSON (key <code>_STRAND_FACTOR</code>) when{" "}
        <code>export_attributes=True</code> is set. A Three.js shader in
        the{" "}
        <Link href="/atelier" className={lk}>
          Atelier spatial viewer
        </Link>{" "}
        can read this accessor and reconstruct the gradient at runtime — a
        one-float-per-vertex payload that is far cheaper than a full
        vertex-colour RGB triplet. This is the same accessor mechanism
        used for the activation attribute in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-bake-node-simulation-growth"
          className={lk}
        >
          Bake Node Simulation Growth tutorial
        </Link>
        .
      </p>

      <h2>Outside sources</h2>
      <p>
        Blender Manual — Points to Curves node (CC-BY-SA 4.0, Blender
        Foundation,{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/points_to_curves.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org &rarr; GN &rarr; Points to Curves
        </a>
        ). Related Blender Foundation projects: blender-git, blender-addons,
        Blender Studio open movies (CC-BY).
      </p>
      <p>
        Blender Manual — Curve to Mesh node (CC-BY-SA 4.0, Blender
        Foundation,{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/curve_to_mesh.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org &rarr; GN &rarr; Curve to Mesh
        </a>
        ). Related: blender/blender source tree (GPL-2.0+ kernel, CC0 Python
        scripts), Blender Developer Docs wiki (CC-BY-SA).
      </p>
    </>
  );
}

const data = {
  slug: "blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr",
  title:
    "GN Points to Curves — Poi Trail & Particle Streak Ribbons for WebXR (Blender 5.1)",
  description:
    "Convert grouped point clouds into closed curve strands with GeometryNodePointsToCurves, resample to uniform arc-length, sweep through a circular profile via Curve to Mesh, and export five colour-gradient poi-orbit ribbons as a Draco-6 GLB carrying a custom strand_factor accessor for Three.js / WebXR.",
  date: "2026-07-23",
  Body,
  seeAlso: [
    {
      href: "/tutorials/blender-tutorial-gn-curve-tangent-normal-frenet-ribbon-beam-webxr",
      label: "GN Curve Tangent & Normal — Frenet Ribbon Beam",
      note: "Frenet frame on output curves — tangent, normal, and binormal for ribbon orientation",
    },
    {
      href: "/tutorials/blender-tutorial-gn-set-curve-tilt-mobius-ribbon",
      label: "GN Set Curve Tilt — Möbius Ribbon",
      note: "Tilt channel: per-point profile rotation for twisted and Möbius topologies",
    },
    {
      href: "/tutorials/blender-tutorial-gn-resample-curve-railing-balustrade-bezier-path",
      label: "GN Resample Curve — Railing & Balustrade",
      note: "Count vs Length vs Evaluated mode; arc-length vs angular parameterisation",
    },
    {
      href: "/tutorials/blender-tutorial-gn-capture-attribute-named-attribute",
      label: "GN Capture Attribute — Per-Instance Data Pipelines",
      note: "Field laziness and capture semantics — the ordering problem this tutorial inverts",
    },
    {
      href: "/tutorials/blender-tutorial-gn-bake-node-simulation-growth",
      label: "GN Bake Node — Simulation Growth Cache",
      note: "Custom attribute GLB accessor export — same export_attributes=True pattern",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/points_to_curves.html",
      label: "Blender Manual — GN Points to Curves",
      note: "CC-BY-SA 4.0 · Blender Foundation · node inputs, group ID semantics, Points output socket",
    },
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/curve_to_mesh.html",
      label: "Blender Manual — GN Curve to Mesh",
      note: "CC-BY-SA 4.0 · Blender Foundation · profile sweep, Fill Caps, attribute propagation to mesh",
    },
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/read/spline_parameter.html",
      label: "Blender Manual — GN Spline Parameter",
      note: "CC-BY-SA 4.0 · Blender Foundation · Factor, Length, Index outputs; domain sensitivity",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-points-to-curves-poi-trail-ribbon-webxr",
    time: "one session",
    difficulty: "intermediate",
    goal: "Build five closed poi-orbit ribbon strands in a single GN modifier: scatter points encode orbit group IDs, Points to Curves groups them into POLY splines, Resample Curve gives uniform arc-length spacing, Set Spline Cyclic closes each orbit, Curve to Mesh sweeps a faceted circle profile, and export_attributes=True writes strand_factor as a custom GLB accessor.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Points to Curves node available since Blender 4.0. Target is 5.1.",
      },
    ],
    prerequisites: [
      "Familiar with GN basics: Group Input/Output, modifier workflow",
      "Understand GN field laziness — see blender-tutorial-gn-capture-attribute-named-attribute",
      "Know Curve to Mesh and profile curve wiring — see blender-tutorial-gn-curve-to-mesh",
    ],
    steps: [
      {
        title: "Build the point cloud with curve_group attribute",
        body: "The blueprint creates a plain mesh with N_ORBITS × N_STEPS = 100 vertices.\n\nEach orbit is a parametric loop:\n  `angle = 2π × step / N_STEPS + phase`\n  `x = r × cos(angle)`, `y = r × sin(angle)`\n  `z = z_amp × sin(2 × angle)` (figure-8 Z flutter)\n\nThe `curve_group` INT attribute is assigned after mesh creation via `me.attributes.new('curve_group', 'INT', 'POINT')`. Points 0–19 get group 0, 20–39 get group 1, and so on.\n\nUsing INT (not FLOAT) is mandatory — Points to Curves reads the group ID as a discrete integer. A FLOAT attribute would still work numerically, but two floats that are equal within floating-point rounding might be misread as distinct groups, producing extra single-vertex degenerate splines.",
      },
      {
        title: "Wire Points to Curves with the group ID",
        body: "In the GN tree, the key wiring is:\n  `NamedAttribute('curve_group', INT).Attribute → PointsToCurves.Curve Group ID`\n  `GroupInput.Geometry → PointsToCurves.Points`\n\nThe `NamedAttribute` node reads the INT attribute from the incoming point cloud and forwards it as an integer field to the Curve Group ID socket.\n\nAt evaluation, Points to Curves produces one POLY spline per unique group ID encountered in the incoming points, ordered by the group ID values it finds (0, 1, 2, 3, 4 in this blueprint). Within each spline, control vertices appear in ascending point-index order within that group — i.e., orbit point 0 comes before orbit point 1, which comes before orbit point 2, and so on up to point 19.",
      },
      {
        title: "Resample, close, store SplineParameter",
        body: "Chain: `PointsToCurves → ResampleCurve(Count=64) → SetSplineCyclic(True) → StoreNamedAttribute`\n\nResample first (open strand, 64 even samples) → then close cyclic: this ensures the gradient runs correctly over the open arc length without sampling the gap-closing span.\n\nSplineParameter is wired from its own node (no geometry input — it is a field). Its Factor output (0..1 along each strand) feeds StoreNamedAttribute with name 'strand_factor', data type FLOAT, domain POINT.\n\nStoring before Curve to Mesh is required because Curve to Mesh converts the curve into a mesh; the POINT domain of the output mesh has vertex-count = ResampleCount × ProfileSides. The stored 'strand_factor' propagates correctly from each curve point to the ring of mesh vertices at that position along the tube.",
      },
      {
        title: "Sweep with Curve to Mesh and shade flat",
        body: "The profile node:\n  `CurvePrimitiveCircle(mode=RADIUS, Radius=0.018, Resolution=8)`\n\nCurve to Mesh inputs:\n  Curve ← StoreNamedAttribute.Geometry\n  Profile Curve ← CurvePrimitiveCircle.Curve\n  Fill Caps ← True\n\nThe 8-sided polygon gives a faceted tube. Fill Caps=True adds a flat triangle fan at each strand end — only visible on open strands; for cyclic strands the caps are not generated (no ends exist).\n\nFinally: SetShadeSmooth(domain=FACE, Shade Smooth=False) gives flat-shaded facets — studio convention for low-poly WebXR aesthetics.",
      },
      {
        title: "Add the emission gradient material",
        body: "The material uses:\n  `ShaderNodeAttribute(attribute_name='strand_factor', attribute_type='GEOMETRY')`\n  → `ShaderNodeValToRGB` (5-stop: violet→cyan→lime→amber→magenta)\n  → `bsdf.Emission Color`\n\nEmission strength is set to 4.0 on the Principled BSDF. When glTF exports a material whose emission strength > 1.0, it writes the `KHR_materials_emissive_strength` extension into the GLB, preserving HDR bloom levels for Three.js / WebXR renderers that support it.\n\nBecause `strand_factor` is stored as a named attribute on the mesh (not a temporary field), it survives the depsgraph bake and appears in the Spreadsheet editor as a per-vertex float column.",
      },
      {
        title: "Export with export_attributes=True",
        body: "The blueprint exports the baked ribbon mesh via:\n  `bpy.ops.export_scene.gltf(..., export_attributes=True, ...)`\n\nWithout `export_attributes=True`, the 'strand_factor' FLOAT attribute is silently dropped — the GLB carries only positions and normals. With it, the exporter writes a custom accessor (key `_STRAND_FACTOR` in the primitive's attributes dict in glTF JSON) alongside the standard POSITION and NORMAL accessors.\n\nIn Three.js, access it via:\n  `geometry.getAttribute('_STRAND_FACTOR')` → a BufferAttribute with one float per vertex.\n\nA TSL (Three.js Shading Language) material can read this to reconstruct the gradient at runtime without any baked vertex colours:\n  `attribute('_STRAND_FACTOR', 'float') → mix(colorA, colorB, factor)`",
      },
    ],
    finalResult:
      "Five closed poi-orbit ribbon strands (each 64 × 8 = 512 vertices) in a single GN modifier. Each strand sweeps a faceted 8-sided tube through a distinct orbital radius (0.6–1.8 m) with Z-axis flutter. A colour gradient from violet → cyan → lime → amber → magenta runs along each strand via SplineParameter. Exported as hf_poi_trails.glb (Draco-6, +Y up) carrying the strand_factor custom accessor for Three.js / WebXR material reconstruction.",
    variations: [
      "Random orbit perturbation: add a NoiseTexture evaluated at each point's Position before PointsToCurves. Store the noise value as 'ribbon_noise' using CaptureAttribute (to freeze it at scatter time), then use it to offset Z position inside a SetPosition node after Resample. The noise attribute must be captured before PointsToCurves because the node reorders points — a field re-evaluated after the node would give different noise values.",
      "Variable ribbon thickness: store a per-orbit radius attribute on the input mesh ('ribbon_r', FLOAT, POINT). After PointsToCurves, use SetCurveRadius driven by NamedAttribute('ribbon_r') before Curve to Mesh. CurveToMesh scales the profile circle by the curve's radius value at each control point, creating tapered ribbons that are thickest in the centre and thin at the strand tips.",
      "Animated unwinding: add a Compare node (Factor < SplineParameter.Factor) after ResampleCurve and feed its output to the Curve Selection socket of SetSplineCyclic — or use a Trim Curve node to progressively extend each strand from 0 to 1 over 60 frames, driven by SceneTime.Frame. This requires keeping the GN modifier live (do not bake the object data) and setting up a Simulation Zone to accumulate the progress attribute.",
    ],
    troubleshooting: [
      {
        symptom: "No curves appear — only a point cloud visible in the viewport",
        cause:
          "The Curve Group ID socket is not connected, or the 'curve_group' attribute is missing from the incoming mesh. Without a group ID, all points form a single group (group 0) and connect in sequence — but if the attribute lookup fails with a domain mismatch, PointsToCurves silently outputs empty Curves.",
        fix: "Open the Spreadsheet editor, set domain to Point, and verify the 'curve_group' INT column is present with values 0–4 (or whatever range you used). If the column is absent, re-run blueprint.py. If it is present but all values are 0, check that the attribute type is INT, not FLOAT.",
      },
      {
        symptom: "Ribbon strands overlap — all five orbits appear at the same position",
        cause:
          "The orbit radii array (ORBIT_RADII) was inadvertently set to all the same value, or the point cloud object was scaled uniformly to zero.",
        fix: "Confirm ORBIT_RADII = [0.6, 0.9, 1.2, 1.5, 1.8] in blueprint.py. Also confirm the hf_poi_trails object has scale (1, 1, 1) — GN nodes work in object space; a zero-scale object collapses all points to the origin regardless of the GN output.",
      },
      {
        symptom: "Colour gradient is uniform — all vertices have the same colour",
        cause:
          "The SplineParameter field was wired before PointsToCurves rather than after. Before the node, SplineParameter.Factor evaluates on the incoming point cloud's POINT domain using point index — all 20 points in a group get sequential 0/20, 1/20 … 19/20 values, but after Resample these map non-linearly because the resample redistributes points by arc length.",
        fix: "Move the SplineParameter node to after ResampleCurve in the node graph. Its Factor output should feed StoreNamedAttribute, which sits between ResampleCurve and Curve to Mesh.",
      },
      {
        symptom: "Tube ends are open — z-fighting holes visible in WebXR",
        cause:
          "Fill Caps on the Curve to Mesh node is False, or the strands were marked cyclic before Curve to Mesh (cyclic strands have no ends and caps are never generated).",
        fix: "Set node.inputs['Fill Caps'].default_value = True on the CurveToMesh node. For open-ended strands this adds the cap faces. For cyclic strands, caps are irrelevant — but verify the strands are truly cyclic (SetSplineCyclic input checked) rather than open and coincidentally appearing closed.",
      },
    ],
  },
  data,
);

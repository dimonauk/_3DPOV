import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&rsquo;s Geometry Nodes suite exposes every bezier handle as a
        writable field via <strong>Set Handle Positions</strong>. Where the{" "}
        <Link href="/tutorials/blender-tutorial-gn-fillet-curve-neon-sign" className={lk}>
          Fillet Curve tutorial
        </Link>{" "}
        rounds corners by inserting arc segments, this tutorial controls the
        tangent vectors directly — the exact mechanism the bezier curve uses
        to determine shape between control points. The result is a smooth S-curve
        ribbon produced from nothing more than a two-point straight line: one
        handle set on each operative end, a bell-curve radius taper driven by{" "}
        <code>Spline Parameter</code>, and a flat line profile swept through{" "}
        <Link href="/tutorials/blender-tutorial-gn-curve-to-mesh" className={lk}>
          Curve to Mesh
        </Link>
        .
      </p>
      <p>
        The tutorial also clarifies which handles actually matter on an open two-point
        curve (two out of four) and why <strong>Set Handle Type → FREE</strong> is
        not optional but a hard prerequisite — without it, Blender silently overwrites
        everything you just set.
      </p>

      <h2>Why only two of the four handles matter</h2>
      <p>
        A bezier segment between two control points P0 and P1 has four tangent
        handles: P0-Left, P0-Right, P1-Left, P1-Right. For an{" "}
        <em>open</em> curve that begins at P0 and ends at P1:
      </p>
      <ul>
        <li>
          <strong>P0-Right</strong> — the tangent leaving P0 toward P1. This is
          the operative handle for the shape of the single segment between P0 and P1.
          Must be set.
        </li>
        <li>
          <strong>P1-Left</strong> — the tangent entering P1 from P0. Also operative.
          Must be set.
        </li>
        <li>
          <strong>P0-Left</strong> — points backward from P0, into empty space.
          No adjacent segment exists, so this handle has zero effect on the curve
          shape. Setting it wastes a node.
        </li>
        <li>
          <strong>P1-Right</strong> — same reasoning: no segment continues past P1.
          Unused.
        </li>
      </ul>
      <p>
        On a <em>closed</em> loop curve, all four handles become operative because
        every control point sits between two segments. If you extend this tutorial
        to a closed loop (e.g., connecting P0 and P1 with{" "}
        <code>Set Spline Cyclic</code>), you would need all four{" "}
        <code>Set Handle Positions</code> nodes.
      </p>

      <h2>The FREE handle type prerequisite</h2>
      <p>
        Blender evaluates the modifier stack after the GN tree runs. Bezier handle
        types — AUTO, VECTOR, ALIGN, FREE — are not node data; they live on the
        spline object itself and influence how positions are interpreted during
        evaluation. AUTO recalculates handle positions to produce the smoothest
        possible tangent at each control point, overwriting whatever you wrote via
        Set Handle Positions. ALIGN forces left and right handles to be collinear,
        overwriting one side when you set the other.
      </p>
      <p>
        <strong>FREE</strong> is the only type that says &ldquo;use exactly the
        position stored in the handle data, do not touch it.&rdquo; You must call{" "}
        <code>Set Handle Type → FREE</code> on both LEFT and RIGHT, across all
        control points (leave Selection unwired to select all), before any{" "}
        <code>Set Handle Positions</code> node in the chain. If you omit this
        step, Set Handle Positions writes the positions correctly — and then
        Blender&rsquo;s evaluator silently recomputes them back to AUTO, and the
        curve never changes.
      </p>

      <h2>Constructing the S-shape: a geometry argument</h2>
      <p>
        The Curve Line runs from{" "}
        <code>(0, &minus;0.5, 0)</code> to <code>(0, +0.5, 0)</code> — a vertical
        segment along the Y axis. The S-shape is determined by two tangent vectors:
      </p>
      <ul>
        <li>
          <strong>P0-Right at <code>(+spread, &minus;0.25, 0)</code></strong> — the
          start point exits to the <em>right</em> (+X) and slightly downward.
        </li>
        <li>
          <strong>P1-Left at <code>(&minus;spread, +0.25, 0)</code></strong> — the
          end point is entered from the <em>left</em> (−X) and slightly upward.
        </li>
      </ul>
      <p>
        The tangent vectors are mirror images of each other across both axes, which
        produces a point-symmetric S (rotating 180° around the midpoint maps the
        curve onto itself). Increasing <code>Handle_Spread</code> pushes the handles
        further apart laterally, making the S more dramatic. At spread = 0, both
        handles collapse to the Y axis and the curve degenerates back to a straight
        line — use this as a sanity check when debugging.
      </p>

      <h2>Bell-curve taper with sin(t·π)</h2>
      <p>
        <code>Spline Parameter (Factor)</code> outputs a float that runs from
        0.0 at P0 to 1.0 at P1 along the resampled polyline. Multiplying by π and
        passing through a Sine node gives a value that is 0 at both ends (t = 0 and
        t = 1) and peaks at 1.0 at the midpoint (t = 0.5). Multiplying by{" "}
        <code>Profile_Radius</code> scales this into a physical ribbon width.
      </p>
      <p>
        <code>Set Curve Radius</code> writes this per-point radius into the spline
        data. <code>Curve to Mesh</code> multiplies each point&rsquo;s stored radius
        with the profile curve radius — so the flat line profile (half-width
        = Profile_Radius) gets scaled by the taper value, giving a ribbon that is
        zero-width at both tips and full-width at the waist. Compare with the
        uniform-radius approach in the{" "}
        <Link href="/tutorials/blender-tutorial-gn-spline-parameter-vine-tendril" className={lk}>
          Spline Parameter vine tendril tutorial
        </Link>
        , which uses the same node for an exponential growth envelope rather than
        a symmetric bell.
      </p>

      <h2>Why a line profile makes a ribbon, not a tube</h2>
      <p>
        The profile curve for <code>Curve to Mesh</code> defines the cross-section
        shape. A <code>Curve Circle</code> (res=8) produces a tubular profile — eight
        facets wrapping around. The{" "}
        <Link href="/tutorials/blender-tutorial-gn-set-curve-tilt-mobius-ribbon" className={lk}>
          Möbius Ribbon tutorial
        </Link>{" "}
        uses exactly this pattern. Here, a two-point <code>Curve Line</code> from
        &minus;Profile_Radius to +Profile_Radius on the X axis produces a flat strip
        with exactly two edge loops per cross-section. This is the minimum viable
        ribbon: zero thickness, maximum visual area-to-triangle ratio. With{" "}
        <code>Fill Caps = False</code>, the open ends remain as open edges (no cap
        polygons), keeping the tip geometry clean at zero width.
      </p>

      <h2>Resample is not optional in BEZIER mode</h2>
      <p>
        <code>Set Handle Positions</code> writes data into the spline&rsquo;s bezier
        handle storage. <code>Curve to Mesh</code> operates on the
        curve&rsquo;s <em>evaluated</em> representation — the polyline computed
        from the bezier arcs at the spline&rsquo;s <code>resolution_u</code> setting
        (default: 12 subdivisions per segment). Inserting{" "}
        <code>Resample Curve (COUNT, 120)</code> after the handle nodes bakes the
        evaluated polyline into explicit control points that downstream nodes can
        treat as a precise, predictable polyline. Without Resample, the resolution
        is 12 — visibly faceted at this scale. 120 points is invisible from WebXR
        viewing distances; drop to 24 to see the faceting.
      </p>

      <h2>Variation: sunburst of S-curve ribbons</h2>
      <p>
        After the Resample node, insert{" "}
        <code>Duplicate Elements (domain = SPLINE, Amount = Petal_Count − 1)</code>.
        Wire the{" "}
        <code>Duplicate Index</code> output (not the global Index) into an
        angle formula: <code>Duplicate_Index × 2π ÷ Petal_Count</code>. Pass the
        angle and a Z-axis vector into{" "}
        <code>Axis-Angle to Rotation</code>, then into{" "}
        <code>Rotate Instances</code>. Add{" "}
        <code>Realize Instances</code> before Curve to Mesh. The result is N
        S-curve ribbons fanning around the Z axis — a decorative rosette ready for
        stage or atelier use. Using <code>Duplicate Index</code> rather than the
        global <code>Index</code> node is critical: global Index increments across
        every point in every spline, not per-spline.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-set-handle-positions-bezier-s-curve-taper",
  title: "GN Set Handle Positions — Parametric Bezier S-Curve Taper Ribbon",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Control bezier tangent handles via Geometry Nodes: transform a two-point Curve Line into a smooth S-curve ribbon by setting exactly the two operative handles, lock them with Set Handle Type FREE, and taper the width via sin(t·π) driven by Spline Parameter.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    cost: "free",
    goal: "A .blend with a live GN modifier whose Handle_Spread slider transforms a straight line into a smooth S-curve ribbon with bell-curve taper in real time. A Draco GLB under 30 KB, exported with WebP textures.",
    supplies: {
      materials: [
        { name: "Blender 5.1" },
        { name: "s_curve_ribbon.blend (generated by blueprint.py)" },
      ],
      tools: [
        { name: "Geometry Nodes editor" },
        { name: "Shader editor (for emissive material)" },
        { name: "EEVEE Next renderer" },
        { name: "bpy (for blueprint.py)" },
      ],
    },
    steps: [
      {
        title: "Create the Curve Line primitive",
        body: "Add a Geometry Nodes modifier to a Plane. Inside the GN tree, add GeometryNodeCurvePrimitiveLine (mode='POINTS'). Set Start=(0, −0.5, 0) and End=(0, +0.5, 0). This gives a straight vertical segment with exactly two control points (P0 at −Y, P1 at +Y). Wire Curve Line.outputs['Curve'] to the Group Output Geometry temporarily to verify you see a line in the viewport.",
      },
      {
        title: "Set Handle Type to FREE on all control points",
        body: "Add GeometryNodeCurveSetHandles. Set mode={'LEFT','RIGHT'} and handle_type='FREE'. Leave Selection unwired — this selects all control points. Wire Curve Line → Set Handle Type → (continue chain). This node must come before any Set Handle Positions node in the chain. Without it, Blender's evaluator will silently recompute AUTO handle positions after your Set Handle Positions runs, discarding your values.",
      },
      {
        title: "Add Index + Compare selection nodes",
        body: "Add GeometryNodeInputIndex. Add two ShaderNodeMath nodes (operation='COMPARE'): one with inputs[1]=0.0 (selects P0), one with inputs[1]=1.0 (selects P1). Set inputs[2]=0.5 as the epsilon — this works as an exact integer equality check because Index values are integers and 0.5 < 1.0 gap. Wire Index to inputs[0] of both Compare nodes. Add a Negate node (ShaderNodeMath, MULTIPLY × −1) wired from the Handle_Spread group socket — you will use this for the mirror-image handle on P1.",
      },
      {
        title: "Set P0 Right handle position",
        body: "Add ShaderNodeCombineXYZ for the P0 Right position: wire Handle_Spread to the X input, set Y=−0.25, Z=0.0. Add GeometryNodeSetCurveHandlePositions, mode='RIGHT'. Wire: previous Curve → Curve, Index==0 Compare → Selection, CombineXYZ → Position. This sets the handle that controls the tangent leaving P0 toward P1. With Handle_Spread=0.55, P0 exits to the right (+X) — the first arc of the S.",
      },
      {
        title: "Set P1 Left handle position",
        body: "Add another ShaderNodeCombineXYZ for the P1 Left position: wire the Negate output (−spread) to X, set Y=+0.25, Z=0.0. Add GeometryNodeSetCurveHandlePositions, mode='LEFT'. Wire: previous SHP Curve → Curve, Index==1 Compare → Selection, this CombineXYZ → Position. P1 is entered from the left (−X), completing the S. Drag Handle_Spread in the modifier panel now — you should see the line bend into an S-curve live.",
      },
      {
        title: "Add bell-curve taper with Spline Parameter",
        body: "Add GeometryNodeSplineParameter. Wire the Factor output (0→1 along the curve) into a ShaderNodeMath (MULTIPLY, second input=π≈3.14159) to get t·π. Feed that into another ShaderNodeMath (SINE) to get sin(t·π). Multiply the sine result by Profile_Radius (group socket) to get the per-point radius. Add GeometryNodeSetCurveRadius, wire Set Handle Positions Curve output → Curve, radius math → Radius. The ribbon will now narrow at both tips.",
      },
      {
        title: "Resample and sweep the ribbon profile",
        body: "Add GeometryNodeResampleCurve (mode='COUNT', Count=120). Wire Set Curve Radius output → Curve. Add a second Curve Line as the ribbon profile: mode='POINTS', Start=(−Profile_Radius, 0, 0), End=(+Profile_Radius, 0, 0). Add GeometryNodeCurveToMesh: Fill Caps=False. Wire resampled curve → Curve input, profile line → Profile Curve. Add GeometryNodeSetShadeSmooth (domain='FACE', Shade Smooth=True). Wire to Group Output.",
      },
      {
        title: "Build the emissive material and export GLB",
        body: "Create a material with Principled BSDF (Base Color coral orange, Roughness=0.3) mixed with Emission (Strength=6.0) through Mix Shader (Fac=0.55). Assign via GeometryNodeSetMaterial. Export: File → Export → glTF 2.0, format=GLB, Apply Modifiers=on, Draco level 6, Image Format=WebP. Root object name must be snake_case (s_curve_ribbon) per studio convention.",
      },
    ],
    finalResult:
      "A .blend containing a single-node-group GN modifier with two interactive sliders: Handle_Spread controls S-curve width (0=straight, 0.55=gentle S, 1.2=dramatic Z-shape) and Profile_Radius controls ribbon width. The Spline Parameter taper narrows both tips to zero, giving clean closed ends without cap polygons. The emissive coral material renders with soft glow in EEVEE Next. The exported Draco GLB is under 30 KB.",
    variations: [
      "Sunburst rosette: after the Resample node, add Duplicate Elements (domain=SPLINE, Amount=Petal_Count−1). Wire Duplicate Index (not global Index) into angle math: Duplicate_Index × 2π ÷ Petal_Count. Feed through Axis-Angle to Rotation (Axis=Z), then Rotate Instances. Add Realize Instances before Curve to Mesh. With Petal_Count=12, you get 12 S-curve ribbons radiating around the Z axis — a decorative rosette in a single GN modifier.",
      "Asymmetric S (offset centre): set P0-Right Y to −0.1 instead of −0.25, and P1-Left Y to +0.4. The inflection point of the S shifts downward. Useful for architectural ogee moulding shapes. Try driving the Y offsets from group input sockets so you can slide the inflection point live.",
      "Animated formation: keyframe Handle_Spread from 0.0 (straight) at frame 1 to 0.55 at frame 60. The ribbon bends smoothly into S-shape over 2 seconds at 30 fps. Export as animated GLB — vertex count is constant (120 resampled points), so the animation uses morph targets cleanly.",
    ],
    troubleshooting: [
      {
        symptom: "Dragging Handle_Spread does nothing — the curve stays straight",
        cause:
          "Set Handle Type (FREE) is missing or placed after Set Handle Positions in the node chain. Blender's AUTO handle evaluator runs after GN and recomputes positions to smooth values, discarding what Set Handle Positions wrote.",
        fix: "Ensure GeometryNodeCurveSetHandles (mode={LEFT,RIGHT}, handle_type=FREE) is wired immediately after the Curve Line, before any Set Handle Positions node. The node order in the chain is the evaluation order — FREE must precede the position writes.",
      },
      {
        symptom: "The curve bends but only on one side — not an S-shape",
        cause:
          "Only one Set Handle Positions node is active, or both nodes are set to the same mode (both RIGHT or both LEFT). An S requires the exiting handle of P0 (RIGHT) and the entering handle of P1 (LEFT) to be set with mirrored lateral offsets.",
        fix: "Check that the first SHP node has mode='RIGHT' and targets Index==0, and the second has mode='LEFT' and targets Index==1. Check that P0's X is +spread and P1's X is −spread (use the Negate node). If the selections are wrong, the nodes set handles on non-existent control points and have no effect.",
      },
      {
        symptom: "The ribbon is faceted — visible polygon edges where it should be smooth",
        cause:
          "Resample Curve is missing, so Curve to Mesh uses the default curve resolution_u=12 subdivisions, which is visibly coarse at 1 metre scale.",
        fix: "Add GeometryNodeResampleCurve (mode='COUNT') between Set Curve Radius and Curve to Mesh. Set Count≥80 for smooth silhouette. The Set Shade Smooth node helps further but cannot fix faceting caused by too few polyline points.",
      },
      {
        symptom: "Ribbon tips are not tapering to zero — they have a flat end",
        cause:
          "The MapRange / sin(t·π) math is not connected to Set Curve Radius, or Set Curve Radius is placed after Resample Curve (which resamples before the radius is set).",
        fix: "Ensure Set Curve Radius comes BEFORE Resample Curve in the chain. The radius attribute needs to be on the bezier control points so that Resample inherits and interpolates it to the 120 resampled points. If placed after Resample, the attribute is applied to the polyline points but the taper profile is sampled differently.",
      },
    ],
  },
  base,
);

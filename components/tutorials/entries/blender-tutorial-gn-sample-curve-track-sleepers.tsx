import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSampleCurveTrackSleepersBody() {
  return (
    <>
      <p>
        Blender offers three routes for distributing geometry along a curve:
        sweep a profile with <strong>Curve to Mesh</strong>, scatter instances
        using <strong>Resample Curve → Instance on Points</strong>, or evaluate
        at explicit positions with <strong>Sample Curve</strong>.  The first two
        are well-trodden.  Sample Curve is the specialist option — and the only
        one that guarantees true arc-length equidistant placement.
      </p>

      <p>
        The difference matters on any curve where curvature is non-uniform.
        An oval has tight bends at the short-axis ends and loose, nearly-straight
        sections along the long sides.  Resample Curve distributes its count
        evenly in <em>parameter</em> space — a 0-to-1 walk across the Bezier
        control points.  Because the tight bends consume a disproportionate
        share of the parameter range relative to their arc length, resampled
        points cluster at the bends and thin out on the straights.  The visual
        result is an accordion effect: more sleepers per metre at the curves,
        fewer on the long runs.  Real railway track does not work this way.
      </p>

      <p>
        Sample Curve in <code>mode=LENGTH</code> takes an arc-length value in
        metres and returns the exact curve data at that physical distance along
        the rail.  Feed it <code>Index × SLEEPER_SPACING</code> and every
        sleeper is placed exactly <code>SLEEPER_SPACING</code> metres from
        the next, at every point on the oval.  The node also returns a{" "}
        <code>Rotation</code> output — a proper quaternion socket introduced in
        Blender&nbsp;4.x — that encodes the curve&apos;s tangent, normal, and
        binormal at the sample position.  Wiring that directly into
        Instance&nbsp;on&nbsp;Points&apos; <code>Rotation</code> socket orients
        each sleeper to face the rail with no <code>Align Euler to Vector</code>{" "}
        workaround.
      </p>

      <p>
        The tutorial also covers the <code>Is Valid</code> boolean output, which
        goes <code>False</code> whenever a requested arc-length exceeds the total
        curve length.  Rather than computing the exact sleeper count from the
        oval&apos;s perimeter, the blueprint uses a slightly-too-large count and
        pipes <code>Is Valid</code> into a <code>Delete Geometry</code> node to
        automatically trim the excess — a robust pattern for any production rig
        where the guide curve length is not known at author time.  Compare this
        with the length-domain approach used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-spline-parameter-vine-tendril"
          className={lk}
        >
          Spline Parameter vine tendril tutorial
        </Link>
        , which operates on the existing control-point domain rather than
        sampling at arbitrary positions.  For a modifier-stack alternative to
        distributing geometry along a curve, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-array-curve-deform-chain-rope"
          className={lk}
        >
          Array + Curve Deform chain tutorial
        </Link>
        .
      </p>

      <p>
        The sleeper cross-section comes from a <code>GeometryNodeMeshCube</code>{" "}
        primitive wired directly as the instance — no separate object required.
        Its <code>Size</code> input is set to{" "}
        <code>(2.4, 0.14, 0.22)&nbsp;m</code> so the X axis holds the long
        cross-track dimension.  Because Sample Curve&apos;s Rotation convention
        places +X along the curve&apos;s binormal (perpendicular to the tangent),
        the 2.4&nbsp;m face automatically spans the track gauge — the cube
        geometry and the quaternion convention align without an extra rotation
        node.  The&nbsp;final Realize Instances node bakes all instances into a
        single mesh for{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-ground-cover-scatter"
          className={lk}
        >
          GLB-exportable geometry
        </Link>{" "}
        with Draco compression.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-sample-curve-track-sleepers",
  title:
    "GN Sample Curve Node — Arc-Length Equidistant Track Sleepers on a Bezier Oval (Blender 5.1)",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "GeometryNodeSampleCurve in mode=LENGTH places 38 railway sleepers at physically equidistant arc-length positions on a Bezier oval. Rotation socket (quaternion, Blender 5.x) wires directly to InstanceOnPoints — no Align Euler to Vector workaround. Is Valid output feeds DeleteGeometry to trim out-of-range samples. Compares arc-length vs parameter-space distribution on non-uniform curvature. MeshCube primitive as inline instance. RealizeInstances for GLB/Draco export. Blender 5.1.",
  Body: GnSampleCurveTrackSleepersBody,
};

export const entry = buildInstructable(
  {
    time: "35 minutes",
    difficulty: "intermediate",
    cost: "free — Blender 5.1, no add-ons",
    supplies: {
      materials: [
        "Blender 5.1",
        "blueprint.py from public/library/blends/geometry-nodes/gn-sample-curve-track-sleepers/",
      ],
      tools: [
        "3D Viewport › Material Preview shading",
        "Geometry Node Editor (header dropdown or Ctrl-Space)",
        "Scripting workspace (to run blueprint.py)",
        "Outliner (to locate SL_TrackSleepers and track_oval_curve)",
        "Properties › Modifier panel (wrench icon)",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py and inspect the oval",
        content: `Open Blender 5.1.  Switch to the Scripting workspace, click Open,
and load blueprint.py.  Click Run Script (or Alt-P).

Switch to the Layout workspace.  In the Outliner you should see two objects:
  - track_oval_curve (hidden — the guide Bezier, eye icon is off)
  - SL_TrackSleepers (the GN modifier output)

Select SL_TrackSleepers.  Set viewport shading to Material Preview (Z menu).
You should see ~38 dark-oak wooden sleepers arranged around an oval, evenly
spaced all the way around — including through the tight bends at the short ends.

Tumble the viewport (middle-mouse drag) to view the oval from an angle.
Compare the sleeper density at the short bends versus the long straights:
it should look identical — no clustering.`,
      },
      {
        title: "Open the Geometry Node editor and read the tree",
        content: `With SL_TrackSleepers selected, open a Geometry Node Editor
(click the editor-type icon in any panel header and choose Geometry Node Editor,
or use Ctrl-Space on an existing panel then switch type).

The tree left-to-right:

  ObjectInfo (track_oval_curve)
    ↓ Geometry
  MeshLine (Count=40, Offset=(0,0,0))       ← 40 points all at world origin
    ↓ Geometry
  Index → Multiply (× 0.56) → arc_length   ← arc-length per point
  Sample Curve (mode=LENGTH)
    ↓ Position, Rotation, Is Valid
  SetPosition                               ← move MeshLine points to curve
    ↓ Geometry
  DeleteGeometry (Selection = Is Valid)     ← remove out-of-range points
    ↓ Geometry
  InstanceOnPoints
    Instance = MeshCube (2.4 × 0.14 × 0.22 m)
    Rotation = SampleCurve.Rotation         ← Rotation socket (quaternion)
    ↓ Instances
  SetMaterial → RealizeInstances → GroupOutput

Click the Sample Curve node.  In the header bar, confirm Mode = Length.`,
      },
      {
        title: "Understand arc-length vs parameter-space distribution",
        content: `The oval has semi-axes 4.0 m (X) and 2.5 m (Y).  Its perimeter
is approximately 20.7 m (Ramanujan approximation).

Parameter-space test (Resample Curve):
  Temporarily bypass the Sample Curve approach: add a Resample Curve node
  between ObjectInfo and InstanceOnPoints with Count=38.  Use CurveToPoints
  to get point positions, then InstanceOnPoints.  Watch the sleepers: the
  tight short-axis bends will have visibly more sleepers per metre than the
  long-side straights.

Arc-length test (Sample Curve, mode=LENGTH):
  Remove the test and restore the original tree.  The spacing is now uniform
  across all sections because the Length input maps directly to metres along
  the rail — not to a 0-1 parameter walk.

Index × SLEEPER_SPACING:
  The Multiply node computes: point_index × 0.56 metres.
  For index 0 → 0.00 m, index 1 → 0.56 m, ..., index 37 → 20.72 m.
  At 20.72 m the curve has looped back to origin, so samples 38 and 39 fall
  beyond 20.7 m and Is Valid returns False — DeleteGeometry removes them.
  Result: 38 valid sleepers at exactly 0.56 m spacing.`,
      },
      {
        title: "Inspect the Rotation socket",
        content: `Click on the wire connecting SampleCurve.Rotation → InstanceOnPoints.Rotation.

In the Geometry Node Editor's N-panel (press N → Item tab) the socket info
shows type: Rotation.  This is the quaternion socket type added in Blender 4.0.
Before this, the same wire would have been labelled Vector (Euler angles).

Sample Curve's Rotation convention (from Blender 5.1 docs):
  +Z axis → curve tangent (direction of travel)
  +Y axis → curve normal  (outward normal from curvature plane)
  +X axis → binormal      (tangent × normal, spans gauge width)

The sleeper cube was built with Size = (2.4, 0.14, 0.22) m:
  X = 2.4 m long → aligns to binormal → spans cross-track width   ✓
  Y = 0.14 m tall → aligns to normal  → faces upward               ✓
  Z = 0.22 m deep → aligns to tangent → slim face toward the rail  ✓

If the pre-4.0 path is needed (e.g. targeting an older Blender build),
replace the Rotation wire with:
  SampleCurve.Tangent → AlignEulerToVector (axis=Z) → RotateInstances.`,
      },
      {
        title: "Test the Is Valid guard",
        content: `Select the DeleteGeometry node.  In the N-panel, confirm:
  Domain: Point
  Mode: All
  Selection: (wired from SampleCurve.Is Valid, index 7)

Temporarily disconnect the Is Valid wire from DeleteGeometry's Selection socket.
The Selection defaults to True — meaning all 40 points are kept.
Two or three sleepers will appear at world origin (0,0,0), the undefined
position returned for out-of-range samples.  Reconnect the wire to restore.

Tip: to visualise Is Valid directly, add a Viewer node (Shift-Ctrl-click)
on the Is Valid output.  In the Spreadsheet editor, switch to Points domain
and look at the Viewer column — you will see True for indices 0-37 and
False for 38-39 (or wherever the out-of-range samples begin).`,
      },
      {
        title: "Adjust sleeper spacing live",
        content: `The SLEEPER_SPACING constant (0.56 m in blueprint.py) is hardwired
into the Multiply node's second input.  To expose it as a live modifier parameter:

1. In the GN editor, open the Group menu (N-panel → Group tab) and add a
   Float input named "Sleeper Spacing" with min=0.1, max=2.0, default=0.56.
2. Connect GroupInput.SleeperSpacing → Multiply.Input[1].
3. The modifier panel (Properties → wrench) now shows the slider.

Drag the slider from 0.56 to 0.28: sleeper density doubles in real time —
~76 sleepers at 0.28 m spacing.  Slide to 1.12: density halves to ~19 sleepers.
Is Valid automatically trims the point pool at both extremes.

For a fully dynamic count (no fixed SLEEPER_COUNT pool), see the Variations
section: AttributeStatistic on SplineLength gives the total curve length,
from which floor(length / spacing) can drive the MeshLine Count directly.`,
      },
      {
        title: "Export as GLB",
        content: `In the Scripting workspace, run:

import bpy
bpy.ops.export_scene.gltf(
    filepath="//track_sleepers.glb",
    export_format="GLB",
    use_selection=False,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
)

export_apply=True bakes the GN modifier before export — without it, the
exporter writes the empty base mesh (SleepersOut has no geometry before
the modifier).  RealizeInstances inside the tree ensures the exporter
receives a single flat mesh rather than an instanced structure, which
Draco can then compress efficiently.

Open the exported GLB in a glTF viewer (Khronos glTF Sample Viewer or
Three.js Editor) — you should see ~38 sleepers with the wood material.`,
      },
    ],
    notes: `Sample Curve (GeometryNodeSampleCurve) vs Evaluate Curve (deprecated):
In Blender 3.x there was an "Evaluate Curve" node.  It was renamed to
"Sample Curve" in 3.4 and its socket layout was revised.  The data_type
property and Is Valid output were added then; the Rotation socket (quaternion)
replaced the Tangent-based Euler workflow in 4.0.  If you open an older file
in Blender 5.1, the Evaluate Curve node auto-upgrades to Sample Curve — check
that the Mode and data_type properties transferred correctly.

Closed curves and the LENGTH boundary:
On a cyclic (closed) Bezier, arc-length wraps: requesting length=L where L is
the total perimeter lands you back at the start.  Sample Curve does NOT wrap —
it returns Is Valid=False for any length > total_perimeter.  If you want
wrap-around behaviour (e.g. animating a train that circles the track), use
Math(MODULO, arc_length, perimeter) before the Length input to force wrapping.
The perimeter is available via AttributeStatistic(domain=SPLINE, attribute=SplineLength).`,
    variations: [
      "Dynamic sleeper count from curve length: instead of a fixed SLEEPER_COUNT=40 pool, pipe the curve through AttributeStatistic(domain=SPLINE, data_type=FLOAT, attribute=SplineLength.Length) to get total_length as a scalar. Then Math(FLOOR, total_length / spacing) feeds MeshLine.Count directly. The pool always matches the curve exactly — no Is Valid trimming needed. Trade-off: recomputes on every spacing change, adding one more evaluation step.",
      "Two parallel rails via lateral offset: after SetPosition, add a SetPosition(Offset = binormal × GAUGE_HALF) where binormal = cross(tangent, normal) from SampleCurve's Tangent and Normal outputs and GAUGE_HALF = 0.717 m (standard 1435 mm gauge / 2). Use SeparateGeometry to route one copy with +binormal offset and one with -binormal offset, then JoinGeometry for both rails plus the sleepers. This gives a three-component track assembly from a single curve.",
      "Animated camera following the track: use Sample Curve in a driver. Create an empty on the track, add a custom property 'distance' (float, 0 → perimeter). Add a Python driver to the empty's location: bpy.data.node_groups['TrackSleeperGN'].nodes['Sample Curve'].outputs[1].default_value[0] — or more reliably, set up a second minimal GN tree on the camera that reads SampleCurve.Position at a 'distance' group input. Animate the distance input to make the camera follow the rail arc-length precisely.",
    ],
    troubleshooting: [
      {
        symptom: "Sleepers all appear at world origin (0, 0, 0) instead of on the curve",
        cause:
          "The ObjectInfo node's Object input is empty, so the Curves socket receives no geometry. SampleCurve evaluates against an empty curve, returning Position=(0,0,0) and Is Valid=False for every sample. If Is Valid is not connected to DeleteGeometry, all 40 sleepers land at the origin.",
        fix: "Select the ObjectInfo node and confirm its Object input slot shows 'track_oval_curve'. If it is blank, run blueprint.py again (it sets n_obj.inputs[0].default_value = track_obj in Python). Alternatively, drag the track_oval_curve object from the Outliner into the ObjectInfo Object input socket.",
      },
      {
        symptom: "Sleepers are present but all facing the same world direction (identity rotation)",
        cause:
          "The Rotation wire from SampleCurve to InstanceOnPoints is missing or the Rotation socket type is not matching. In older Blender builds, InstanceOnPoints.Rotation expects a Vector (Euler), but SampleCurve.Rotation outputs a Rotation socket — Blender 4.0 through 5.x accept both, but if the socket types do not match Blender silently drops the connection.",
        fix: "Verify the connection in the node editor. If the wire is orange (type mismatch), your Blender may be pre-4.0. Replace with: SampleCurve.Tangent → AlignEulerToVector(axis=Z) → RotateInstances(Local=False). This is the legacy path that achieves the same orientation without the Rotation socket.",
      },
      {
        symptom: "GeometryNodeSampleCurve does not exist — Blender reports 'Unknown node type'",
        cause:
          "The node was named 'GeometryNodeEvaluateCurve' before Blender 3.4. Versions 3.0-3.3 use the old name. Blender 5.1 uses 'GeometryNodeSampleCurve'.",
        fix: "Ensure you are running Blender 5.1 (or at minimum 3.4). In Blender 5.1, open the Add menu in the Geometry Node Editor (Shift-A → Curve → Sample → Sample Curve) to confirm the node is available. The blueprint.py is written for 5.1 and will fail on earlier versions.",
      },
      {
        symptom: "Some sleepers are tilted at wrong angles relative to the track",
        cause:
          "The curve's tilt property is non-zero on some Bezier control points. Blender incorporates the spline Tilt setting into the Normal output of SampleCurve, which in turn affects the Rotation quaternion. A tilt of 90° on one control point will rotate the sleepers in that section by 90° around the tangent axis.",
        fix: "Select the track_oval_curve object, enter Edit Mode, select all control points (A), open Item properties (N → Item), and set Tilt = 0° on all points. Or in Python: for bpt in curve.splines[0].bezier_points: bpt.tilt = 0.0. Run blueprint.py again to rebuild the GN tree with the corrected curve.",
      },
    ],
  },
  base,
);

export { entry };

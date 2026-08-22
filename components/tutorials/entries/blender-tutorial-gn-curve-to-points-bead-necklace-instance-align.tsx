import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <strong>Curve to Points</strong> is the node that bridges the curve
        domain and the instance domain in Geometry Nodes — yet most tutorials
        skip straight to Distribute Points on Faces and never show you the
        curve-based alternative. The difference matters: Distribute on Faces
        scatters randomly across a surface, giving you statistical density
        control. Curve to Points is deterministic and arc-length-aware; it
        places exactly N points along a path with uniform spacing guaranteed
        by the curve&apos;s own parameterisation. That guarantee is why it is the
        right tool for a necklace, a railway sleeper system, a rosary, or any
        object where the number and spacing of instances must be musically
        precise rather than stochastically approximate. For the Poisson-disc
        alternative on surfaces, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          Distribute Points on Faces tutorial
        </Link>
        ; for arc-length sampling that also reads named attributes from a
        spline, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-sample-curve-track-sleepers"
          className={lk}
        >
          Sample Curve railway sleeper tutorial
        </Link>
        .
      </p>

      <p>
        The node has four modes: <strong>EVALUATED</strong> (one point per
        evaluated spline segment), <strong>COUNT</strong> (N arc-length-uniform
        points), <strong>LENGTH</strong> (one point every X metres), and{" "}
        <strong>LENGTH_FACTOR</strong> (LENGTH normalised to 0–1 of total curve
        length). COUNT is the right choice for a 40-bead necklace design
        because you are specifying the visual rhythm — 40 beads — not a
        physical spacing. If you were designing to a jewellery specification
        that demands 8 mm between bead centres, you would switch to LENGTH and
        set Length = 0.008. The tutorial uses a{" "}
        <strong>ResampleCurve</strong> node before Curve to Points for a
        specific reason: a Bezier Circle stores only 4 control points by
        default, giving the evaluator a coarse 48-point basis. When Bead Count
        exceeds that basis, arc-length interpolation clusters beads near the
        bezier knots. ResampleCurve (EVALUATED, Resolution 64) raises the basis
        to 256 poly points so the COUNT distribution is smooth up to 200 beads.
        Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh"
          className={lk}
        >
          Curve to Mesh tutorial
        </Link>
        , which uses the same source curve simultaneously in a parallel branch
        for the silk cord — both branches evaluate against the same Bezier
        Circle input, so the cord and beads are always co-registered.
      </p>

      <p>
        The rotation alignment is the load-bearing detail that separates a
        convincing necklace from a cloud of spheres hovering near a circle.
        Curve to Points outputs a{" "}
        <code>Tangent</code> vector at every point — the unit vector pointing
        along the string at that location. The{" "}
        <strong>Align Euler to Vector</strong> node receives that Tangent on its{" "}
        <code>Vector</code> input with <code>axis = Y</code> and{" "}
        <code>pivot_axis = Z</code>: it constructs an Euler rotation that
        points the instance&apos;s local Y axis toward the tangent. For a UV
        Sphere this is visually irrelevant — spheres are isotropic. But wire in
        a cylinder or a barrel bead and the alignment becomes immediately
        visible: the hole axis tracks the cord exactly, just as a real jeweller
        would thread it. The <code>pivot_axis = Z</code> choice prevents the
        gimbal flip that occurs on tight curves where the tangent passes through
        the XZ plane. For a chain-link approach using the Array modifier
        instead of GN instancing, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-array-curve-deform-chain-rope"
          className={lk}
        >
          Array + Curve Deform chain-rope tutorial
        </Link>
        . The GN approach is lighter (one shared template mesh, N instances)
        but requires RealizeInstances before GLB export because the glTF
        specification does not support Blender&apos;s deferred instance tree.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-curve-to-points-bead-necklace-instance-align",
  title:
    "GN Curve to Points — Parametric Bead Necklace: Count-Mode Sampling + Instance Alignment on Curve Tangent (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Build a 40-bead pearl necklace using Curve to Points (COUNT mode) for arc-length-uniform bead placement, AlignEulerToVector for tangent-based bead rotation, and a parallel CurveToMesh branch for the silk cord — all from a single Bezier Circle input.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "one sitting (50–90 min)",
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
        title: "Understand the four Curve to Points modes before choosing one",
        body: 'Open a fresh Blender 5.1 scene.  Before touching a node, internalise what the four modes do so the COUNT choice is motivated rather than arbitrary.\n\nEVALUATED: emits one point per evaluated segment of the spline — dependent on the curve\'s internal Resolution setting (Property Panel → Object Data → Shape → Resolution Preview).  Output count varies with resolution; no arc-length guarantee.\n\nCOUNT: divides the full curve arc-length into N equal segments and emits one point at each division.  The count is a fixed integer input.  For a 40-bead necklace that must always have exactly 40 beads regardless of resizing, this is the correct mode.\n\nLENGTH: emits one point every L metres of arc-length.  Bead count scales with curve size.  For a jewellery specification that requires 8 mm centre-to-centre spacing, use LENGTH with Length = 0.008.\n\nLENGTH_FACTOR: same as LENGTH but the length is specified as a fraction of total curve length (0.0–1.0).  Useful for proportional subdivisions.\n\nFor this tutorial: choose COUNT.  Open Properties → Geometry Nodes, Add → Mesh → UV Sphere — actually, do not add any mesh yet.  Start by building the curve path.',
      },
      {
        title: "Add the Bezier Circle necklace path and a Geometry Nodes modifier",
        body: 'Delete the default cube (X → Delete).  Press Shift+A → Curve → Bezier Circle.  In the Operator Panel (bottom-left) set Radius = 1.0 m.\n\nWith the circle selected, open Properties → Object (orange square icon) → Transform.  Rotate X = 90°.  This tilts the circle to stand vertically — a necklace hangs in the XZ plane, not flat on the ground.  Apply the rotation: Object → Apply → Rotation.  This resets the rotation euler to (0,0,0) while baking the 90° tilt into the curve data.\n\nAdd a Geometry Nodes modifier: Properties → Modifier (wrench) → Add Modifier → Geometry Nodes.  Click "New" to create a blank node tree.  Name it "BeadNecklace" in the node tree header.\n\nIn the Geometry Nodes editor, you should see Group Input → Group Output with a Geometry wire between them.',
      },
      {
        title: "Build the bead branch: ResampleCurve → CurveToPoints",
        body: 'In the GN editor, break the wire between Group Input and Group Output.  Add → Curve → Operations → Resample Curve.  Place it between Group Input and a gap on the right.\n\nSet: mode = EVALUATED, Resolution = 64.\n\nWire: Group Input.Geometry → Resample Curve.Curve.\n\nAdd → Curve → Operations → Curve to Points.  Set mode = COUNT.  Wire: Resample Curve.Curve → Curve to Points.Curve.\n\nFor Bead Count: open the N-panel (N key) → Group tab.  You should see the active sockets listed.  To expose Bead Count as a slider, add a Group Input node in the GN editor and look for the "+" socket at the bottom.  Click it to add a new Integer input, name it "Bead Count", set default = 40, min = 4, max = 200.  Wire Group Input.Bead Count → Curve to Points.Count.\n\nCheck the Modifier panel in Properties.  A "Bead Count" integer field should now appear.  Drag it to see the evaluated point count change in real time — but nothing is visible in the viewport yet because there is no instance geometry.',
      },
      {
        title: "Add the bead template: MeshUVSphere inline in the GN tree",
        body: 'In GN: Add → Mesh Primitives → UV Sphere.\n\nSet: Segments = 8, Rings = 6.  This gives a 48-vertex, 40-quad bead — low-poly enough for WebXR.\n\nFor Bead Radius: add a Float Group Input socket named "Bead Radius", default = 0.08, min = 0.01, max = 0.5.  Wire Group Input.Bead Radius → UV Sphere.Radius.\n\nAdd → Instances → Instance on Points.  Wire:\n  Curve to Points.Points → Instance on Points.Points\n  UV Sphere.Mesh → Instance on Points.Instance\n\nAt this point, beads should appear in the viewport along the circle.  They are all identical spheres at the default (0,0,0) rotation — no alignment yet.  Toggle Wireframe (Z) to confirm 40 sphere instances spaced uniformly around the ring.',
      },
      {
        title: "Add AlignEulerToVector to thread beads along the string",
        body: 'Look at the current beads: if you swap the UV Sphere for a cylinder (Add → Mesh Primitives → Cylinder, Vertices = 6, wire it instead of the sphere temporarily), you will see all cylinders pointing in the same global direction — they are not following the string.\n\nFix this with Add → Utilities → Rotation → Align Euler to Vector.\n\nSet:\n  axis        = Y    — the bead\'s local Y axis will point toward the tangent\n  pivot_axis  = Z    — prevents gimbal flip on tight curves\n\nWire: Curve to Points.Tangent → Align Euler to Vector.Vector\nWire: Align Euler to Vector.Rotation → Instance on Points.Rotation\n\nNow the cylinders\' Y axes track the string tangent at every point — each "hole" faces along the cord.  Swap the cylinder back to the UV Sphere; the alignment is invisible on a sphere but is baked into the instance transform for when you later swap in a barrel or teardrop bead.\n\nWHY pivot_axis = Z?  When the tangent passes through the XZ plane (at the top and bottom of the necklace ring), the shortest rotation from the default Y axis can flip between +Z and -Z pivots, causing a visible 180° spin on those beads.  Fixing pivot_axis = Z forces all alignments to rotate around Z, so the flip cannot occur.',
      },
      {
        title: "Add random per-bead scale variation",
        body: 'Each pearl on a real strand has a slightly different diameter.  Reproduce this with a Random Value node.\n\nAdd → Utilities → Random Value.  Set:\n  data_type = FLOAT\n  Min = 0.75\n  Max = 1.25\n  Seed = 7\n\nAdd → Vector → Combine XYZ.  Wire:\n  Random Value.Value → Combine XYZ.X\n  Random Value.Value → Combine XYZ.Y\n  Random Value.Value → Combine XYZ.Z\n\nWhy CombineXYZ with the same float on all three inputs rather than a FLOAT_VECTOR random?  A FLOAT_VECTOR random varies X, Y, Z independently — the bead would stretch non-uniformly into an ellipsoid.  Routing one FLOAT through CombineXYZ produces the same scalar on all three axes: uniform scale, round pearls, different diameters.\n\nWire: Combine XYZ.Vector → Instance on Points.Scale.',
      },
      {
        title: "Assign the Pearl material and realise instances",
        body: 'Beads currently inherit the object\'s default grey material.  Assign a dedicated pearl material.\n\nCreate the material: open the Shader Editor, click New, name it "Mat_Pearl".  In the Principled BSDF:\n  Base Colour:      (0.95, 0.92, 0.88) — warm white\n  Roughness:        0.10\n  Subsurface Weight: 0.12\n  Coat Weight:       0.30\n  Coat Roughness:   0.05\n  (The Coat layer adds the characteristic pearl lustre without heavy SSS computation.)\n\nBack in the GN editor: Add → Material → Set Material.  Wire:\n  Instance on Points.Instances → Set Material.Geometry\nSet the Material input to "Mat_Pearl".\n\nAdd → Geometry → Realise Instances.  Wire:\n  Set Material.Geometry → Realise Instances.Geometry\n\nRealise Instances collapses the deferred instance tree into real mesh geometry.  This is required for two reasons:\n  1.  Set Material acts on the outer instance wrapper without RealizeInstances; the material never reaches the bead faces.\n  2.  GLB/glTF export cannot represent Blender\'s instance tree — export_apply=True in the exporter only bakes procedural modifiers, not unresolved GN instances.',
      },
      {
        title: "Build the parallel string branch with CurveToMesh",
        body: 'The cord runs through the same Bezier Circle.  A second ResampleCurve node on the same Group Input.Geometry avoids aliasing between the two branches.\n\nAdd → Curve → Operations → Resample Curve (second one).\n  Mode = EVALUATED, Resolution = 64.\nWire: Group Input.Geometry → (this second) Resample Curve.Curve.\n\nAdd → Curve Primitives → Curve Circle.  Mode = RADIUS, Resolution = 6.\nAdd a Group Input socket "String Radius", default = 0.005, min = 0.001, max = 0.05.\nWire: Group Input.String Radius → Curve Circle.Radius.\n\nAdd → Curve → Operations → Curve to Mesh.\nWire:\n  Resample Curve.Curve (string branch) → Curve to Mesh.Curve\n  Curve Circle.Curve → Curve to Mesh.Profile Curve\nSet: Fill Caps = False  (an open cord, not a sealed tube).\n\nAdd a second Set Material node, assign "Mat_Cord" (dark Principled BSDF, Roughness 0.82).\nWire: Curve to Mesh.Mesh → Set Material (cord).Geometry.',
      },
      {
        title: "Join the bead and cord branches and export GLB",
        body: 'Add → Geometry → Join Geometry.  Wire:\n  Realise Instances.Geometry → Join Geometry.Geometry\n  Set Material (cord).Geometry → Join Geometry.Geometry\n  Join Geometry.Geometry → Group Output.Geometry\n\nIn the viewport you should now see 40 pearl-white beads strung on a thin dark cord.\n\nAdjust the modifier sliders:\n  Bead Count 4 → 200 → 40: confirms real-time resampling\n  Bead Radius 0.02 → 0.12: delicate seed pearls to large baroque beads\n  String Radius 0.002 → 0.015: silk thread to rubber tube\n\nExport: File → Export → glTF 2.0 (.glb/.gltf)\n  Format:                     GLB\n  Include → Apply Modifiers: ✓  (critical — bakes GN + RealizeInstances)\n  Geometry → Compression:    ✓  Level 6 (Draco)\n  Geometry → Normals:        ✓\n  Materials:                 Export\n  Transform → Y Up:          ✓\n\nVerify in the Khronos glTF Sample Viewer (see link in Blender Manual attribution below).  You should see two mesh islands: the pearl bead cluster and the hexagonal-cross-section cord — both with correct materials and normals.',
      },
    ],
    finalResult:
      "A Draco-6 GLB of a 40-bead pearl necklace: 40 UV Sphere beads (8×6 = 48 verts each) with noise-varied diameters between 0.75× and 1.25× the base 8 cm radius, threaded on a hexagonal-cross-section silk cord. All geometry is Y-up and WebXR-ready. The source .blend retains the live GN modifier with Bead Count, Bead Radius, and String Radius sliders. The node chain transfers to any closed curve — replace the Bezier Circle with a figure-of-eight, a heart spline, or a free-hand chain and the beads follow instantly.",
    variations: [
      "Barrel or teardrop beads: replace MeshUVSphere with a MeshCylinder (Vertices=6) or an elongated UV Sphere (scale Z=1.5 via a ScaleElements node). The AlignEulerToVector (axis=Y) immediately shows its effect — the hole axis tracks the cord. For a teardrop, bias the sphere scale with a Math MULTIPLY_ADD on the random scale output: Y = rand × 0.8 + 1.2 (elongated), X = Z = rand (round cross-section).",
      "Alternating gem beads: duplicate the bead branch. On the second branch, use a MeshIcoSphere and a contrasting material (semi-transparent gem). Use a Math MODULO node on the point Index (Curve to Points provides implicit index via the evaluation order): index MODULO 2 = 0 → pearl; MODULO 2 = 1 → gem. Wire as Selection into each InstanceOnPoints to place alternating bead types.",
      "Animate the necklace being strung: expose an additional Integer socket 'Visible Count', default 0. Add a Compare node: Index < Visible Count → Selection socket of InstanceOnPoints. Keyframe Visible Count from 0 to 40 over 80 frames — beads appear one by one along the string as if being threaded.",
      "3D-print-ready jewellery: switch scene units to millimetres (Scene → Unit System = Metric, Unit Scale = 0.001). Set Bead Radius = 4 (= 4mm in mm units), String Radius = 0.4 (= 0.4mm). The same GN tree produces a correctly-dimensioned STL: export via File → Export → STL. A 40-bead necklace with 4mm pearls has a roughly 46mm necklace diameter at radius=23mm — adjust NECKLACE_RADIUS accordingly.",
    ],
    troubleshooting: [
      {
        symptom: "All beads face the same direction — alignment has no effect",
        cause:
          "The Curve to Points.Tangent output is not wired to AlignEulerToVector.Vector, or AlignEulerToVector.Rotation is not wired to InstanceOnPoints.Rotation.",
        fix: "Check both connections in the GN editor. Tangent → Vector is the input side; Rotation → Rotation is the output side. Both wires must be present for the alignment to apply. Use the viewer node on Tangent to confirm it is outputting non-zero vectors.",
      },
      {
        symptom: "Beads are not equally spaced — clusters appear at one side",
        cause:
          "ResampleCurve is missing or set to EVALUATED with too low a Resolution, causing CurveToPoints to arc-length-sample a coarse polyline and cluster points near the original bezier knots.",
        fix: "Ensure ResampleCurve precedes CurveToPoints and set Resolution ≥ 64. With a 4-segment Bezier Circle and 64 steps per segment, the basis is 256 poly points — CurveToPoints COUNT up to ~200 distributes evenly.",
      },
      {
        symptom: "Material does not appear on beads after GLB export",
        cause:
          "RealizeInstances is missing from the bead branch. Without it, Set Material writes to the outer instance wrapper, which export_apply does not resolve — the exported mesh has no material assignment.",
        fix: "Insert GeometryNodeRealizeInstances between Set Material and Join Geometry. The node collapses the instance tree to a real mesh with material indices before export.",
      },
      {
        symptom: "Bead scale is uniform — no size variation between beads",
        cause:
          "The Random Value node's Seed is 0 and all beads fall on the same random value, or the Value output is not wired through CombineXYZ to InstanceOnPoints.Scale.",
        fix: "Set Seed to any non-zero integer (7 in the blueprint). Verify that Random Value.Value → CombineXYZ.X, Y, Z → InstanceOnPoints.Scale is the complete chain. If Scale stays (1,1,1), add a Viewer node on CombineXYZ.Vector to inspect the values in the Spreadsheet editor.",
      },
      {
        symptom: "Cord is missing from the GLB — only beads exported",
        cause:
          "The string branch (CurveToMesh) outputs to a separate wire that was not connected to Join Geometry before Group Output.",
        fix: "Join Geometry has a multi-input socket. Both the RealizeInstances (bead branch) output and the Set Material (cord branch) output must be wired into the same Join Geometry node. Confirm by counting two wires entering Join Geometry.",
      },
    ],
  },
  base,
);

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The Möbius strip has one side and one boundary edge. A crawler placed on
        the surface traverses the entire strip before returning to its starting
        face — the topological fact that makes it non-orientable. In Blender 5.1
        Geometry Nodes the mechanism for creating this is the{" "}
        <strong>Set Curve Tilt</strong> node: it rotates the profile
        cross-section around the curve tangent at each sample point. For a
        closed circle curve traversed once from start to finish, applying a tilt
        equal to <code>Spline Parameter Factor × π</code> produces a cumulative
        half-twist — the defining signature of the Möbius strip. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh"
          className={lk}
        >
          Curve to Mesh tutorial
        </Link>{" "}
        established how a profile curve sweeps along a base curve; this tutorial
        explains what happens when that profile is additionally rotated per-point
        by a field before the sweep.
      </p>

      <p>
        The <strong>Spline Parameter</strong> node outputs three fields:{" "}
        <code>Factor</code> (0 → 1 along the curve, as a normalised fraction of
        arc length), <code>Length</code> (raw arc length in metres from the
        start), and <code>Index</code> (integer point index). On a closed circle
        with <code>resolution=128</code>, Factor at point 0 is exactly 0.0 and
        at point 127 approaches but never reaches 1.0 — because point 127
        connects back to point 0, and Factor there would be 1.0 = 0.0 (the seam
        point). This is the correct behaviour for the Möbius seam: the profile
        at the last point is almost-but-not-quite at tilt π, and the mesh closes
        by connecting back to the first point at tilt 0. The seam is the
        half-twist joint. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-spline-parameter-vine-tendril"
          className={lk}
        >
          Spline Parameter vine tendril tutorial
        </Link>{" "}
        for the distinction between Factor, Length, and Index and when to choose
        each for curve-driven motion.
      </p>

      <p>
        Set Curve Tilt stores the tilt value as a float attribute on the{" "}
        <code>POINT</code> domain of the curve, in radians. When{" "}
        <code>Curve to Mesh</code> consumes this tilted curve, it reads the per-
        point tilt and applies it as an additional rotation of the profile in the
        plane perpendicular to the tangent. The crucial distinction from a
        profile rotation applied via an object transform: tilt accumulates
        continuously from point to point via the field evaluation, whereas an
        object transform would apply the same rotation to every cross-section
        ring uniformly. The field-driven accumulation is what produces the smooth
        twist. This is the same field-accumulation principle used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-accumulate-field-spiral-tower"
          className={lk}
        >
          Accumulate Field spiral tower
        </Link>
        , but here the accumulation comes from the Spline Parameter Factor field
        rather than an explicit running sum node.
      </p>

      <p>
        The profile curve is a two-point{" "}
        <code>GeometryNodeCurvePrimitiveLine</code> rather than a closed circle.
        This produces a flat ribbon cross-section: each ring in the resulting
        mesh is a single line segment rather than a loop. The choice of{" "}
        <strong>Fill Caps = False</strong> on Curve to Mesh is not optional — a
        Möbius strip has no cap faces, and filling them would produce incorrect
        topology at the seam where the half-twist causes the boundary to
        cross-connect.{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/write/set_curve_tilt.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          The Blender Manual entry on Set Curve Tilt
        </a>{" "}
        (CC BY-SA 4.0 — Blender Foundation) documents the tilt attribute and
        its interaction with the Normal mode of the base curve. The{" "}
        <a
          href="https://github.com/mrdoob/three.js/blob/dev/src/geometries/ParametricGeometry.js"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Three.js ParametricGeometry (MIT)
        </a>{" "}
        achieves the same surface mathematically via parametric equations
        evaluated at runtime — comparing the two reveals the trade-off: the
        parametric approach is dynamic but runs on the CPU each frame, while the
        baked GLB is static but renders on the GPU with a single draw call and
        Draco compression (see the{" "}
        <Link
          href="/tutorials/blender-to-site-asset-pipeline"
          className={lk}
        >
          Blender-to-site asset pipeline
        </Link>{" "}
        for how the GLB is loaded into the WebXR scene). For materials that
        reveal the single-sided topology, consider a{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence"
          className={lk}
        >
          transmission + iridescence shader
        </Link>{" "}
        — the iridescent colour shift as the surface twists makes the
        non-orientability immediately visible.
      </p>
    </>
  );
}

const base = {
  date: "2026-06-20",
  slug: "blender-tutorial-gn-set-curve-tilt-mobius-ribbon",
  title:
    "GN Set Curve Tilt — Möbius Ribbon: Field-Driven Half-Twist on a Closed Curve (Blender 5.1)",
  description:
    "Build a Möbius strip in Geometry Nodes using Set Curve Tilt driven by a Spline Parameter field. Covers the tilt attribute domain, profile line vs circle cross-sections, Fill Caps topology, and the Twist Turns parameter that generalises from Möbius to cylinder to multi-twist torus knot ribbon.",
  tags: [
    "blender",
    "geometry-nodes",
    "curve-tilt",
    "mobius",
    "spline-parameter",
    "curve-to-mesh",
    "procedural",
    "webxr",
    "glb",
  ],
  body: Body,
  externalLinks: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/write/set_curve_tilt.html",
      label: "Blender Manual: Set Curve Tilt (CC BY-SA 4.0 — Blender Foundation)",
      note: "Official documentation for the Set Curve Tilt node. Documents the tilt attribute, selection field, and how tilt interacts with the Normal mode of the base curve object. Related project: blender/blender-manual.",
    },
    {
      href: "https://github.com/mrdoob/three.js/blob/dev/src/geometries/ParametricGeometry.js",
      label: "Three.js ParametricGeometry (MIT — mrdoob and contributors)",
      note: "The runtime JavaScript equivalent: evaluates parametric surface equations per frame. The Möbius strip parametric form is (u,v) → ((1+v/2·cos(u/2))·cos(u), (1+v/2·cos(u/2))·sin(u), v/2·sin(u/2)). Comparing this to the GN Set Curve Tilt approach shows the trade-off between CPU-dynamic parametric and GPU-static baked GLB. Related project: @react-three/fiber.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "one to two hours",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Completed the GN Curve to Mesh tutorial, or comfortable with profile curves.",
      "Blender 5.1 installed and able to run Python scripts headlessly.",
      "Familiar with the Spline Parameter node (Factor vs Index vs Length).",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Uses BLENDER_EEVEE_NEXT for the record.py render step.",
      },
    ],
    steps: [
      {
        title: "Understand what Set Curve Tilt actually does",
        body: "Set Curve Tilt writes a float value (in radians) into the POINT domain of a curve geometry under the attribute name 'tilt'. This attribute is consumed by Curve to Mesh when it sweeps the profile: at each sample point on the base curve, the profile is rotated by the tilt value around the local tangent axis before being placed.\n\nThe critical difference between tilt and a rotation applied via a Transform node: Transform rotates in world space, uniformly, at every point. Tilt rotates in the curve's LOCAL frame — around its tangent — and the value varies per point. This per-point variation is what makes a smooth twist possible rather than a rigid spin of the entire profile.\n\nThe Set Curve Tilt node has a Selection field input (boolean, defaults to True) that controls which points receive the new tilt value. Leave it at True for a Möbius ribbon — we want all points tilted.",
      },
      {
        title: "Build the base curve and tilt field",
        body: "The Möbius base curve is a Curve Circle in RADIUS mode with resolution=128. More points = smoother twist boundary at the seam.\n\nThe tilt field is built from three nodes:\n  1. GeometryNodeSplineParameter  → Factor output (0 → 1 per point)\n  2. ShaderNodeMath (MULTIPLY, B=π)  → Factor × π  \n  3. ShaderNodeMath (MULTIPLY, B=Twist_Turns) → (Factor × π) × Twist_Turns\n\nFor a classic Möbius strip, Twist_Turns=1.0 gives a total tilt of π radians (180°) — exactly a half-twist. At Twist_Turns=2.0 the total tilt is 2π, meaning the strip rotates a full 360° and reconnects to its starting orientation, producing a closed tube (orientable). At Twist_Turns=3.0 the result is a three-half-twist ribbon with a different knot topology.\n\nThe π constant is set as the default_value on the second input socket of the first Math node:\n\n  n_pi.inputs[1].default_value = math.pi   # 3.14159...\n\nThis bakes the value into the node rather than requiring a separate Value node — fewer nodes, cleaner graph.",
      },
      {
        title: "Create the flat ribbon profile",
        body: "The profile curve is a GeometryNodeCurvePrimitiveLine with mode='POINTS'. Its Start and End inputs define a 2-point open curve. For a ribbon centred on the curve tangent axis:\n\n  n_profile.inputs['Start'].default_value = (0.0, -STRIP_HALF_WIDTH, 0.0)\n  n_profile.inputs['End'].default_value   = (0.0,  STRIP_HALF_WIDTH, 0.0)\n\nThe X component is 0 because the profile lives in the local YZ plane of the curve; Curve to Mesh aligns this plane to the curve's Frenet-Serret frame (tangent + normal + binormal) at each sample point. Z=0 keeps the profile in the 'normal' plane rather than tilted toward the binormal.\n\nWhy a line profile rather than a Curve Circle? A circle profile produces a tube (every cross-section is a closed ring). A line profile produces a flat ribbon (every cross-section is an open edge). A Möbius strip is a ribbon, not a tube — using a circle profile would create the wrong topology. The resulting mesh from a line profile has two open boundary loops that, for Twist_Turns=1.0, join to form a single boundary edge of length 4π·r (twice the circumference) — the topological signature of the Möbius strip.",
      },
      {
        title: "Connect Set Curve Tilt → Curve to Mesh with Fill Caps = False",
        body: "The chain:\n\n  n_circle → n_tilt → n_ctm\n  n_profile → n_ctm (Profile Curve input)\n\nThe Set Curve Tilt node sits between the Circle primitive and the Curve to Mesh node:\n\n  links.new(n_circle.outputs['Curve'], n_tilt.inputs['Curve'])\n  links.new(n_tilt.outputs['Curve'],   n_ctm.inputs['Curve'])\n  links.new(n_profile.outputs['Curve'], n_ctm.inputs['Profile Curve'])\n\nFill Caps must be False:\n\n  n_ctm.inputs['Fill Caps'].default_value = False\n\nIf Fill Caps were True, Blender would try to close the open ends of the line profile with cap polygons at the start and end of the circle. But the Möbius strip's single boundary means there IS no separate start/end — the boundary loops back to itself. Enabling Fill Caps produces a polygon fan at the seam where the geometry has already twisted by π, creating a degenerate, self-intersecting cap mesh.",
      },
      {
        title: "Export GLB and verify topology",
        body: "After attaching the modifier and building the scene:\n\n  bpy.ops.export_scene.gltf(\n      filepath=str(GLB_OUT),\n      export_format='GLB',\n      use_selection=True,\n      export_apply=True,   # required — evaluates the GN modifier\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_normals=True,\n  )\n\nVerify in glTF Viewer (Don McCurdy) or Three.js: the mesh should be a twisted ribbon with no caps, Draco-compressed. Face count ≈ 254 (128 segments × 2 triangles, minus 2 at the seam).\n\nTo confirm single-sidedness in Blender: enter Edit Mode, select a face, press Ctrl+L to select linked faces. For a Möbius strip, ALL faces select because there is only one connected surface. For a cylinder or plane, only one side selects.",
      },
    ],
    finalResult:
      "A GLB containing a Möbius ribbon — violet-magenta flat strip with a half-twist — compressed with Draco level 6. The source .blend retains the live GN modifier with Radius, Twist Turns, and Resolution exposed as panel sliders. Changing Twist Turns to 2.0 collapses the Möbius into a closed tube without rebuilding any nodes.",
    variations: [
      "Iridescent single-surface shader: import the Principled BSDF and add an Iridescence input driven by the Face Normal Z component. As the strip twists, the colour shifts from face to back and back to face — visually demonstrating the single-sided topology to viewers in WebXR.\n\nIn the node tree: add a Geometry node (ShaderNodeNewGeometry) → Normal output → Separate XYZ → Z socket → Math (× 0.5 + 0.5 to remap -1→+1 to 0→1) → Iridescence socket of Principled BSDF.",
      "Multi-twist torus knot ribbon: set Twist Turns to 1.5, 2.5, or 3.5 and reduce the Radius to 0.8. The ribbon wraps with non-integer half-twists and creates a figure-eight-like loop. For Twist_Turns=1.5 the boundary edge completes two loops before closing — a different knot class than the classic Möbius.",
      "Animated twist unfurl: keyframe Twist Turns from 0.0 to 1.0 over 60 frames. At 0.0 the strip is a flat disc-like ribbon (no twist). As the value rises toward 1.0, the Möbius twist builds up continuously. Because Set Curve Tilt is driven by a live Group Input socket, the animation evaluates frame-by-frame through the GN dependency graph with no bake needed.",
    ],
    troubleshooting: [
      {
        symptom: "GLB is empty or shows zero faces despite a visible ribbon in the viewport",
        cause: "export_apply=False (the default). The exporter received the raw empty base mesh datablock, not the GN-evaluated ribbon geometry.",
        fix: "Add export_apply=True to the bpy.ops.export_scene.gltf() call. Confirm face count in glTF Viewer after re-export.",
      },
      {
        symptom: "The ribbon has a sharp crease/seam visible at one point on the loop",
        cause: "CIRCLE_RESOLUTION is too low (below ~64). With fewer points, the angular step between adjacent tilts is large enough for the twist to appear as a visible kink rather than a smooth gradient.",
        fix: "Increase CIRCLE_RESOLUTION to 128 or higher in blueprint.py. The constant is at the top of the file for this reason.",
      },
      {
        symptom: "Fill Caps produced a degenerate polygon at the seam",
        cause: "n_ctm.inputs['Fill Caps'].default_value was True. Blender attempted to close the open profile ends at the seam, but the half-twist means both boundary loops are the same loop — the cap polygon self-intersects.",
        fix: "Set n_ctm.inputs['Fill Caps'].default_value = False. The Möbius strip's single boundary requires no cap geometry.",
      },
      {
        symptom: "Ctrl+L in Edit Mode selects only half the ribbon faces",
        cause: "The GN modifier was applied with export_apply and the mesh was manually split at the seam, creating two disconnected surface patches.",
        fix: "Do not apply the GN modifier in the viewport. Use export_apply=True only in the GLB export call. In Blender, the modifier remains live and the ribbon is a single connected surface.",
      },
    ],
  },
  base,
);

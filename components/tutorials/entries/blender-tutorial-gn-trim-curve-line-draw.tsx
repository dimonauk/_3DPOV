import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnTrimCurveLineDrawBody() {
  return (
    <>
      <p>
        <strong>Trim Curve</strong> clips a spline to a sub-range of its
        parameterised length, expressed either as a normalised factor [0, 1] or
        as a world-space distance in metres. FACTOR mode is the right choice for
        &ldquo;draw-on&rdquo; animations: the [0, 1] parameter is independent of
        curve shape or scale, so a single keyframed float reveals any path —
        a spiral, a signature, a circuit-board trace — without knowing the arc
        length in advance. This tutorial builds a golden Archimedean spiral that
        writes itself outward over 60 frames, then exports the completed loop as
        a Draco-compressed GLB for Three.js delivery.
      </p>

      <h2>FACTOR mode vs LENGTH mode</h2>
      <p>
        FACTOR mode clips proportionally: Start=0.0, End=0.6 always reveals the
        first 60% of the curve regardless of topology or scale. LENGTH mode uses
        world-space metres: Start=0, End=3.0 clips at the 3-metre mark, which
        shifts whenever you scale the object or change the spiral&apos;s radius.
        For animation, FACTOR is almost always correct — keyframe End from 0→1
        and the reveal is self-contained. LENGTH is appropriate for technical
        applications like cutting a cable to an exact physical measurement.
        Compare with{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-spline-parameter-vine-tendril"
          className={lk}
        >
          Spline Parameter
        </Link>
        , which exposes the same [0,1] normalised position as a per-point{" "}
        <em>field</em> for reading — Trim Curve physically <em>cuts</em> the
        curve rather than reading from it.
      </p>

      <h2>Why the Archimedean spiral</h2>
      <p>
        <code>GeometryNodeCurvePrimitiveSpiral</code> grows radially outward from
        a centre point, so partial trims are immediately legible: End=0.2 shows
        tight inner coils, End=0.6 shows the mid-range, End=1.0 reveals the
        full extent. A trimmed circle produces an arc that is visually ambiguous
        until it is nearly complete. A trimmed straight line shows a stub with no
        sense of direction. The spiral&apos;s radial expansion makes the animation
        feel purposeful — compare it with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-fillet-curve-neon-sign"
          className={lk}
        >
          neon star sign
        </Link>
        , where TrimCurve on a closed star curve would open a growing gap at the
        trim start rather than an expanding shape.
      </p>

      <h2>Keyframing a GN socket from Python</h2>
      <p>
        In Blender 4.x / 5.x, Geometry Nodes modifier inputs are addressed by
        their socket <strong>identifier</strong> string — not by their display
        name. The identifier (e.g.{" "}
        <code>&quot;Socket_2&quot;</code>) is assigned when the socket is created
        and is stable for the lifetime of the node group. Blueprint.py captures
        it at creation time and uses it for both value assignment and keyframing:
      </p>
      <pre>{`de = ng.interface.new_socket("Draw_End", in_out="INPUT",
                              socket_type="NodeSocketFloat")
draw_end_id = de.identifier        # e.g. "Socket_2"
...
mod[draw_end_id] = 0.0
mod.keyframe_insert(data_path=f'["{draw_end_id}"]', frame=1)
mod[draw_end_id] = 1.0
mod.keyframe_insert(data_path=f'["{draw_end_id}"]', frame=60)`}</pre>
      <p>
        After inserting keyframes, the blueprint iterates{" "}
        <code>obj.animation_data.action.fcurves</code> and sets each keyframe
        point&apos;s <code>interpolation</code> to{" "}
        <code>EASE_IN</code> — slow start, accelerating finish — which reads as
        a natural pen stroke rather than a mechanical linear wipe. Compare with
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
          className={lk}
        >
          animation drivers tutorial
        </Link>{" "}
        for the F-Curve graph editor approach to the same interpolation control.
      </p>

      <h2>Tube resolution and GLB budget</h2>
      <p>
        The spiral has 200 polyline points (<code>Resolution=200</code>). Swept
        through an octagonal profile (<code>Resolution=8</code>), that gives 200
        × 8 = 1 600 triangles plus 16 end-cap tris — well within the WebXR
        100 K-tri per-object budget. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh"
          className={lk}
        >
          Curve to Mesh tutorial
        </Link>{" "}
        for a detailed analysis of the profile resolution trade-off. The GLB is
        exported at frame 60 (full spiral visible) via{" "}
        <code>scene.frame_set(ANIM_FRAMES)</code> before the glTF operator runs;
        the animation is intentionally not embedded because Three.js would drive
        the reveal separately via a shader or morph target, not a baked modifier
        animation.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-trim-curve-line-draw",
  title: "GN Trim Curve — Animated Line-Draw Reveal on a Spiral Path",
  date: "2026-06-05",
  kind: "tutorial",
  excerpt:
    "Use the Trim Curve node in FACTOR mode to reveal an Archimedean spiral progressively over 60 keyframed frames — and learn why FACTOR is the only practical choice for draw-on animations, plus the socket-identifier pattern for keyframing GN inputs from Python.",
  Body: GnTrimCurveLineDrawBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    cost: "free",
    goal: "A keyframed spiral trace that draws itself outward over 60 frames, plus a Draco GLB of the complete spiral, and a solid grasp of when FACTOR vs LENGTH mode is correct.",
    supplies: {
      materials: [
        { name: "Blender 5.1" },
        { name: "spiral_trace.blend (generated by blueprint.py)" },
      ],
      tools: [
        { name: "Geometry Nodes editor" },
        { name: "Shader editor" },
        { name: "EEVEE Next renderer" },
        { name: "Timeline editor" },
        { name: "bpy (for blueprint.py)" },
      ],
    },
    steps: [
      {
        title: "Create the Spiral primitive and expose Spiral_Turns",
        body: "Add a Geometry Nodes modifier to any mesh. Inside the GN tree, add GeometryNodeCurvePrimitiveSpiral: Resolution=200, Start Radius=0.0, End Radius=2.0, Height=0.0, Reverse=False. The Resolution input controls how many polyline points the spiral has — more points produce a smoother tube silhouette. Add a group socket 'Spiral_Turns' (INT, 1–20, default 8) and wire it to Spiral.Rotations. Higher turn counts expose TrimCurve more dramatically because each End increment covers more visual arc.",
      },
      {
        title: "Add Trim Curve in FACTOR mode",
        body: "Add GeometryNodeTrimCurve. Set mode='FACTOR'. Set inputs['Start'].default_value=0.0 (fixed — always draw from the spiral centre). Add group socket 'Draw_End' (FLOAT, 0.0–1.0, default 1.0) and wire to inputs['End']. Wire Spiral.Curve → Trim.Curve. In FACTOR mode, End=0.0 clips the entire curve to nothing (zero-length result — a mesh with no triangles is correct, not an error). End=1.0 passes the full spiral through.",
      },
      {
        title: "Build the tube profile and sweep it",
        body: "Add GeometryNodeCurvePrimitiveCircle: Resolution=8 (octagonal — studio standard for thin tubes), Radius driven by group socket 'Line_Radius' (FLOAT, 0.005–0.1, default 0.025). Add GeometryNodeCurveToMesh: Fill Caps=True. Wire Trim.Curve → CurveToMesh.Curve and Circle.Curve → CurveToMesh.Profile Curve. The octagonal profile sweeps along the trimmed arc only — when Trim End < 1.0 the tube ends cleanly at the clip point with a solid octagonal cap.",
      },
      {
        title: "Assign the golden emissive material",
        body: "Create material 'golden_trace_mat'. Add Principled BSDF only — Blender 4.0+ supports 'Emission Color' and 'Emission Strength' directly on the BSDF without a Mix Shader. Set Base Color=(0.95, 0.65, 0.1), Metallic=0.95, Roughness=0.1, Emission Color=(1.0, 0.75, 0.1), Emission Strength=3.0. In EEVEE Next scene settings, enable Bloom (Intensity=0.12, Radius=5.0). The dark world background (near-black) makes the gold halo visible without needing a high Strength value.",
      },
      {
        title: "Keyframe Draw_End from Python",
        body: "After ng.interface.new_socket() for 'Draw_End', capture de.identifier. This is the stable key for the modifier dict. Set mod[draw_end_id]=0.0, call mod.keyframe_insert(data_path=f'[\"{draw_end_id}\"]', frame=1). Set mod[draw_end_id]=1.0, keyframe_insert at frame=60. Then iterate obj.animation_data.action.fcurves → keyframe_points and set interpolation='EASE_IN' for a natural pen-stroke acceleration rather than a linear wipe.",
      },
      {
        title: "Export the full spiral as a Draco GLB",
        body: "Call scene.frame_set(ANIM_FRAMES) before the gltf operator so the modifier evaluates at frame 60 (Draw_End=1.0, full spiral). Use export_apply=True to materialise the modifier output as real mesh geometry. GLB settings: format='GLB', export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_image_format='WEBP'. The animation keyframes are not included because the Three.js delivery controls the reveal via its own animation system.",
      },
    ],
    finalResult:
      "A .blend with a live GN modifier showing the spiral at frame 60; scrub the timeline to watch the draw-on reveal. A golden tube on a dark background with a subtle EEVEE Bloom halo. A Draco GLB under 60 KB containing the complete spiral, ready for Three.js or WebXR.",
    variations: [
      "Custom path: replace the Spiral node with an Object Info node wired from a handdrawn Bézier curve object in the scene. The TrimCurve End socket still drives the reveal — the technique is path-agnostic. Use this to draw a signature, a logo outline, or a handwritten word.",
      "Looping reveal: add a third keyframe — Draw_End=0.0 at frame 90 after the full-reveal at frame 60. Set the final-frame interpolation to 'EASE_OUT'. The spiral grows to full extent then retracts. Loop the timeline for an infinite animation.",
      "Staggered dual trace: duplicate the spiral object, offset it 90° (half a turn) in Z rotation, and set its keyframe start to frame 15. Two golden traces chase each other around the spiral in opposite phase — effective for loading indicators and sci-fi HUD elements.",
    ],
    troubleshooting: [
      {
        symptom: "No mesh visible at frame 1 when Draw_End = 0.0",
        cause:
          "TrimCurve with End=0.0 produces a zero-length curve. CurveToMesh of a zero-length curve outputs zero triangles — this is correct behaviour, not an error.",
        fix: "Scrub to frame 30 to verify the tube appears at half-reveal. If it does not, confirm the wire Spiral.Curve → TrimCurve.Curve and TrimCurve.Curve → CurveToMesh.Curve are connected. Also confirm Draw_End group socket is wired to TrimCurve.inputs['End'] and the modifier panel shows the socket.",
      },
      {
        symptom: "Animation plays but Draw_End never changes value",
        cause:
          "keyframe_insert was called but the modifier's animation data was not created because obj.animation_data was None at the time.",
        fix: "Ensure obj.animation_data_create() is called before keyframe_insert, or check that obj.animation_data is not None after the first keyframe_insert call. The bpy API creates animation data lazily on the first keyframe_insert — if the modifier does not exist yet when the insert is called, data creation silently fails.",
      },
      {
        symptom: "RuntimeError: socket identifier not found when running record.py",
        cause:
          "The .blend was saved with a different socket creation order than expected, so draw_end_id points to a non-existent key in the modifier dict.",
        fix: "Re-run blueprint.py from scratch on a clean Blender instance to regenerate the .blend with fresh socket identifiers. Alternatively, inspect ng.interface.items_tree in the Scripting workspace to find the current identifier of the 'Draw_End' socket and update the record.py DRAW_END_ID constant.",
      },
    ],
  },
  base,
);

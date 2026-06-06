import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSeparateGeometryExplodedViewBody() {
  return (
    <>
      <p>
        <strong>Separate Geometry</strong> is the Geometry Nodes node that most
        tutorials skip when they reach the&nbsp;dissection problem — they
        default to a Boolean modifier or Delete Geometry instead.  The critical
        expert insight is that Separate Geometry returns <em>two live geometry
        outputs</em> from a single boolean field: the matched elements on socket
        0 (&ldquo;Selection&rdquo;) and their untouched complement on socket 1
        (&ldquo;Inverted&rdquo;).  This tutorial splits a UV sphere at its
        equatorial plane, assigns distinct materials to each half, and animates
        the upper shell lifting away using a{" "}
        <code>BoundingBox</code>-derived adaptive gap.  The whole dissection is
        reversible at any frame — no mesh was deleted.
      </p>

      <h2>Separate Geometry vs Delete Geometry</h2>
      <p>
        Both nodes consume a boolean selection field, but they make
        fundamentally different promises.{" "}
        <strong>Delete Geometry</strong> permanently removes the matched
        elements from the geometry stream — the operation cannot be observed or
        animated because the removed half simply does not exist downstream.{" "}
        <strong>Separate Geometry</strong> keeps both halves alive: selected
        elements on outputs[0], the inverted set on outputs[1].  You can wire
        each output into its own sub-chain — material assignment,
        transformation, independent modifiers — and then join them with
        JoinGeometry into a single object for export.  Dragging the{" "}
        <code>Explode_Gap</code> slider from 0 to 1 lifts the upper shell
        without any destructive state; setting it back to 0 is a perfect
        reassembly.
      </p>
      <p>
        The practical consequence for WebXR delivery: you can export the
        dissected state at any gap value and you can bake the animation to NLA
        for runtime playback.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-boolean-hard-surface"
          className={lk}
        >
          Mesh Boolean workflow
        </Link>{" "}
        achieves a similar visual result but requires a cutter object, cannot
        animate the cut plane smoothly, and produces non-manifold geometry at
        the intersection seam.  Separate Geometry avoids all three problems
        because the split is driven entirely by a position field evaluated at
        each face centre.
      </p>

      <h2>Domain parameter: why FACE and not POINT</h2>
      <p>
        The <code>domain</code> property controls which mesh element type the
        selection field is evaluated on.  The options are{" "}
        <code>POINT</code>, <code>EDGE</code>, <code>FACE</code>,{" "}
        <code>CURVE</code>, and <code>INSTANCE</code>.
      </p>
      <p>
        For a planar cross-section, <code>FACE</code> is correct.  At the
        equatorial ring the UV sphere has faces whose vertices straddle Z = 0 —
        some vertices sit above, some below.  With{" "}
        <code>domain=&apos;POINT&apos;</code>, Blender evaluates the selection
        field at each <em>vertex</em>: vertices below the equator evaluate to
        False, vertices above to True.  A face whose vertices are mixed (some
        True, some False) gets an ambiguous evaluation — Blender&apos;s rule is
        that a face is selected if <em>any</em> of its vertices are selected,
        which means equatorial faces land in the upper half regardless of where
        their centre sits.  The result is a ragged, non-planar cut.  With{" "}
        <code>domain=&apos;FACE&apos;</code>, the field is evaluated at each
        face&apos;s centre point, giving a clean binary split at the equator.
      </p>
      <p>
        The same logic applies to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-for-each-element-hex-panel"
          className={lk}
        >
          For Each Element zone
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
          className={lk}
        >
          Simulation Zone wave reveal
        </Link>
        : whenever a selection targets a face property (material, normal,
        area), evaluate in the FACE domain; when targeting a per-vertex
        attribute (weight paint, position-based noise), use POINT.
      </p>

      <h2>BoundingBox as a measurement node</h2>
      <p>
        Most documentation covers <code>GeometryNodeBoundingBox</code> only as
        &ldquo;returns a box mesh&rdquo;, but the node has two additional
        outputs that are far more useful for procedural rigs: <code>Min</code>{" "}
        and <code>Max</code>, which are world-space Vector fields containing the
        extreme corners of the input geometry&apos;s axis-aligned bounding box.
        Neither <code>Min</code> nor <code>Max</code> is a mesh — they are
        Vector constants (re-evaluated each frame) that can be wired into any
        socket expecting a Vector field.
      </p>
      <p>
        In this blueprint, <code>BoundingBox.Max.Z</code> of the upper
        hemisphere gives the exact height of the shell at rest (approximately
        SPHERE_R = 1.0 for a unit sphere).  Multiplying by{" "}
        <code>Explode_Gap</code> via a Math MULTIPLY node and packing the result
        into the Z component of a CombineXYZ vector gives the TransformGeometry
        Translation socket a value that exactly separates the two halves when{" "}
        Gap = 1.0 — no hard-coded offset, no manual tuning required.  This
        means the same node tree works correctly if you scale the sphere to
        0.25 m for a desk-scale model or 4 m for an architectural display.
      </p>
      <p>
        Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          Crystal Cluster Repeat Zone
        </Link>
        , where a fixed offset was sufficient because the cluster cells had
        known identical radii.  When geometry scale is variable (animated,
        driven, or parametric), BoundingBox is the correct measurement tool.
      </p>

      <h2>The two-output wiring pattern</h2>
      <p>
        The GN tree structure is deliberately linear to make the data flow
        legible.  After SeparateGeometry the graph forks into two parallel
        chains — upper and lower — that converge at JoinGeometry:
      </p>
      <pre>{`SeparateGeometry.outputs["Selection"] → SetMaterial(amber) → TransformGeometry → ─┐
SeparateGeometry.outputs["Inverted"]  → SetMaterial(teal)                         → ┴─ JoinGeometry → Output`}</pre>
      <p>
        The BoundingBox node sits on the upper chain between SeparateGeometry
        and SetMaterial — it reads the upper geometry before any transformation,
        which is essential.  If you plug BoundingBox into the post-transform
        geometry, its Max.Z would include the translation offset, causing the
        gap to grow exponentially each frame.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Both halves the same colour</strong>: outputs[0] and
          outputs[1] are swapped in the wiring.  In Blender 5.1 the
          SeparateGeometry node labels the sockets &ldquo;Selection&rdquo; and
          &ldquo;Inverted&rdquo; respectively — hover each socket to confirm.
        </li>
        <li>
          <strong>Gap grows quadratically</strong>: BoundingBox is downstream
          of TransformGeometry.  Move it upstream, before the lift is applied.
        </li>
        <li>
          <strong>Ragged equatorial cut</strong>: domain is set to POINT or
          EDGE.  Change to FACE.
        </li>
        <li>
          <strong>Equatorial ring stays with lower half</strong>: the Compare
          threshold is exactly 0.0 — equatorial vertices at Z = 0 evaluate as
          False.  Add a small epsilon: <code>B = 1e-4</code>.
        </li>
      </ul>
    </>
  );
}

const base = {
  slug: "blender-tutorial-gn-separate-geometry-exploded-view",
  title:
    "GN Separate Geometry — Procedural Dissection and Exploded-View Animation (Blender 5.1)",
  date: "2026-06-06",
  kind: "tutorial" as const,
  excerpt:
    "Split a UV sphere at its equatorial plane into two live geometry halves with GeometryNodeSeparateGeometry. Assign distinct materials, measure the shell height via BoundingBox.Max, and animate a clean gap with a single Explode_Gap socket — no mesh permanently deleted.",
  Body: GnSeparateGeometryExplodedViewBody,
};

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "intermediate",
    cost: "free",
    goal: "Build a procedural exploded-view rig using Separate Geometry with a BoundingBox-derived gap, animatable via a single Group Input socket.",
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
      materials: [],
      tools: [],
    },
    steps: [
      {
        title: "Run blueprint.py to build the scene",
        body: "Open Blender ▸ Scripting workspace ▸ load blueprint.py ▸ Run Script. The script resets to an empty scene, creates the UV sphere, builds the full GN tree, keyframes Explode_Gap 0→1 over 60 frames, and saves dissection_exploded.blend.",
      },
      {
        title: "Confirm the two-output split",
        body: "In the GN node editor, find the SeparateGeometry node. Verify socket 0 is labelled 'Selection' and socket 1 'Inverted'. Hover each output to confirm the label — the wires from each socket should go to different SetMaterial nodes.",
      },
      {
        title: "Scrub the timeline to test dissection",
        body: "In the Layout workspace, drag the playhead from frame 1 to frame 60. The amber upper hemisphere should lift cleanly away from the teal lower half. At frame 1 the sphere appears whole; at frame 60 there is a clear gap between the shells.",
      },
      {
        title: "Verify the domain is FACE",
        body: "Click the SeparateGeometry node. In the node header (or node properties), confirm Domain = Face. Switch temporarily to Point and scrub to frame 30 — note the ragged equatorial cut. Switch back to Face.",
      },
      {
        title: "Inspect BoundingBox position in the tree",
        body: "Trace the wire from SeparateGeometry.outputs['Selection'] → BoundingBox → SeparateXYZ → Multiply → CombineXYZ → TransformGeometry.Translation. Confirm BoundingBox is upstream of TransformGeometry. If it were downstream, the gap calculation would include the lift itself and grow exponentially.",
      },
      {
        title: "Test Explode_Gap manually",
        body: "In the GN modifier properties panel, drag the Explode_Gap slider from 0 to 1.5. The upper shell should lift beyond the natural sphere radius. Drag back to 0 — the sphere reassembles perfectly. This confirms the operation is non-destructive.",
      },
      {
        title: "Run record.py to render the animation",
        body: "Load record.py in the Scripting workspace and run it. EEVEE renders 60 frames to public/library/videos/geometry-nodes/gn-separate-geometry-exploded-view/viewport.mp4. Expect 1–3 minutes on a mid-range GPU.",
      },
      {
        title: "Inspect the GLB in gltf.report",
        body: "Drag dissection_exploded.glb into gltf.report. Confirm two materials (shell_amber, core_teal) are present, Draco compression decoded, and the mesh represents the frame-30 mid-dissection state with the upper shell lifted.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Both halves render the same material colour",
        cause:
          "The two SeparateGeometry output sockets are wired to the wrong SetMaterial nodes — socket 0 (Selection) is going to core_teal and socket 1 (Inverted) to shell_amber.",
        fix: "In the GN editor, hover each output socket on SeparateGeometry to read its label. Rewire so Selection → SetMaterial(shell_amber) and Inverted → SetMaterial(core_teal).",
      },
      {
        symptom: "Gap grows larger and larger with each frame instead of reaching a fixed maximum",
        cause:
          "BoundingBox is positioned downstream of TransformGeometry. Its Max.Z includes the current lift distance, which compounds every evaluation.",
        fix: "Move the BoundingBox node to read from SeparateGeometry.outputs['Selection'] before any TransformGeometry is applied. The BoundingBox wire should split from the same output socket that feeds SetMaterial, not from TransformGeometry's output.",
      },
      {
        symptom: "The equatorial ring of faces stays with the lower half",
        cause:
          "The Compare threshold B is exactly 0.0. Faces whose centres sit precisely at Z = 0 evaluate to False (not greater than 0) and join the lower half.",
        fix: "In blueprint.py, set the Compare B value to 1e-4. Re-run the script.",
      },
    ],
  },
  base,
);

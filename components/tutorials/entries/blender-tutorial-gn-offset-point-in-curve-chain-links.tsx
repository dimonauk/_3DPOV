import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Most Geometry Nodes curve tutorials stop at the Tangent socket from{" "}
        <strong>Curve to Points</strong> and use it to orient instances. That
        works well for smooth Bezier paths, but the Tangent at point&nbsp;i is
        derived from the <em>incoming</em> edge (i−1&nbsp;→&nbsp;i), not the{" "}
        <em>outgoing</em> edge (i&nbsp;→&nbsp;i+1). On a coarsely sampled poly
        path — or when two adjacent instances must be connected by a rod that
        runs from centre to centre — the Tangent lags by one sample step and
        accumulates visible angular error. The{" "}
        <strong>Offset Point in Curve</strong> node solves this: given the index
        of the current point, it returns the index of the point exactly N steps
        ahead (or behind) on the same spline. Pair it with{" "}
        <strong>Evaluate at Index</strong> to read the neighbour&apos;s position,
        subtract, and you have an exact centre-to-centre direction for every
        link in the chain.
      </p>
      <p>
        This is also the node pattern behind worm locomotion, tank-tread
        segments, and any procedural system where each element must
        &ldquo;look at&rdquo; its neighbour rather than at a global vector.
        For the bead necklace that does NOT need directional awareness, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-points-bead-necklace-instance-align"
          className={lk}
        >
          Curve to Points bead necklace tutorial
        </Link>
        ; for arc-length sampling with attribute read-back from a spline, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-sample-curve-track-sleepers"
          className={lk}
        >
          Sample Curve railway sleeper tutorial
        </Link>
        .
      </p>

      <h2>Node graph overview</h2>
      <p>
        The tree has two independent concerns — <em>placement</em> (where each
        link goes) and <em>orientation</em> (which way it faces) — fanned out
        from a single{" "}
        <strong>Resample Curve → Curve to Points</strong> pair.
      </p>
      <ul>
        <li>
          <strong>Resample Curve (COUNT = Link Count)</strong> — converts the
          input Bezier circle to a poly curve with exactly{" "}
          <code>LINK_COUNT</code> uniformly-spaced control points. Without this,
          a 4-segment Bezier circle would give Curve to Points only 4 basis
          points to interpolate from, causing visible clustering at the bezier
          knots when Link Count exceeds ~24.
        </li>
        <li>
          <strong>Curve to Points</strong> — consumes the resampled curve and
          produces a Points geometry in the Point domain. Its Points output feeds{" "}
          <code>Instance on Points</code>. Link Count is wired to both Resample
          and Curve to Points so the two nodes always agree on point count.
        </li>
        <li>
          <strong>Index</strong> — evaluates to the per-element index (0 through
          Link Count−1) inside the field context of Instance on Points&apos;
          Rotation input. This is the &ldquo;which link am I?&rdquo; value.
        </li>
        <li>
          <strong>Offset Point in Curve</strong> — receives the resampled Curve
          geometry, the current Index, and a constant Offset&nbsp;=&nbsp;1.
          Returns the index of the next point on the same spline. Clamp is left
          at the default <code>False</code> so the last point wraps to the first
          — correct for a closed loop. Set Clamp to <code>True</code> if you
          are building an open chain where the final link should just repeat its
          own direction.
        </li>
        <li>
          <strong>Evaluate at Index (domain=POINT, data_type=FLOAT_VECTOR)</strong>{" "}
          — reads the Position field at the next point&apos;s index. Think of it
          as <code>positions[next_index]</code> evaluated lazily per element.
          The Geometry input receives the same resampled curve that feeds Offset
          Point in Curve — both nodes share that geometry so their indices refer
          to the same point set.
        </li>
        <li>
          <strong>Vector Math SUBTRACT (next − current)</strong> — the
          centre-to-centre direction vector for each link. This is normalised
          implicitly by <code>Align Euler to Vector</code> which only cares about
          direction, not magnitude.
        </li>
        <li>
          <strong>Align Euler to Vector (axis=Z)</strong> — rotates each torus
          so its hole-axis (Z) aligns to the chain direction. The torus then lies
          in the plane perpendicular to the chain — its opening faces along the
          chain so the next link can pass through it.
        </li>
        <li>
          <strong>Rotate Euler (AXIS_ANGLE, LOCAL, axis=chain_dir, angle=(Index
          MODULO 2) × π/2)</strong> — the interlace step. Even-indexed links
          (angle=0) keep the base orientation; odd-indexed links (angle=90°) are
          rotated 90° around the chain direction axis. In LOCAL space, this tilt
          happens in the link&apos;s own reference frame regardless of how the
          chain curves — a torus on a bend tilts correctly relative to its local
          chain direction, not a global axis.
        </li>
        <li>
          <strong>Mesh Torus → Instance on Points → Realize Instances</strong>{" "}
          — each link is a torus instance placed at its curve point with the
          computed rotation. Realize collapses instances to a real mesh before
          Set Material so that material indices survive GLB export. Without
          Realize, the exporter sees wrappers with no mesh data and strips the
          material.
        </li>
      </ul>

      <h2>Closed-loop wrap-around</h2>
      <p>
        The closed Bezier circle has no true &ldquo;last&rdquo; point: point
        N−1 is adjacent to point 0 in 3-D space. With{" "}
        <code>Offset Point in Curve</code> and <code>Clamp=False</code>, the
        node returns index 0 when asked for index N, so the final link
        correctly aims at the start of the circle. If you replace the input
        curve with an open path (a Bezier curve with two endpoints), either
        set Clamp=True to repeat the last direction, or subtract one from Link
        Count so the final point index never requests an out-of-bounds
        neighbour.
      </p>

      <h2>Why not Tangent?</h2>
      <p>
        Tangent from Curve to Points is the derivative of the poly-curve at
        each vertex — effectively the direction of the PREVIOUS edge. For most
        smooth curves and high link counts the difference is imperceptible. The
        Offset Point in Curve approach is preferable when:
      </p>
      <ul>
        <li>
          Link Count is low (≤ 16) and the angular error from one-step lag
          is visible at sharp bends.
        </li>
        <li>
          You need the EXACT next-position for a visual connector (a rod, bolt,
          or ring that must visually join centre-to-centre — not just face a
          direction).
        </li>
        <li>
          The system is a simulation read-back where point positions have been
          baked from a simulation zone and the tangent field has not been
          updated (Evaluate at Index bypasses the tangent entirely).
        </li>
      </ul>

      <h2>Adapting to a VRM accessory chain</h2>
      <p>
        Chain accessories on a VRM character (bracelet, ankle chain, collar)
        can be authored as a lightweight GLB and driven by spring bones. The
        recommended workflow: set Link Count = 16–20, Major Radius ≈ 0.006 m
        (6 mm for a delicate bracelet), export GLB, import into the VRM spring-
        bone workflow described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-stretchy-ik-volume-preserve-vrm"
          className={lk}
        >
          stretchy IK and volume-preservation tutorial
        </Link>
        , and parent the chain path to the wrist bone. The GN modifier
        auto-recomputes positions whenever the path moves, so the chain follows
        correctly in EEVEE previews before export. For finer control over
        per-link arc-length, cross-reference the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          Instance on Points tutorial
        </Link>{" "}
        for attribute-driven density masks, and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-fillet-curve-neon-sign"
          className={lk}
        >
          Fillet Curve neon-sign tutorial
        </Link>{" "}
        for rounding the input path at sharp corners before the chain is placed
        on it.
      </p>

      <h2>Outside references</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/topology/offset_point_in_curve.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender Manual — Offset Point in Curve
          </a>{" "}
          (CC-BY-SA-4.0 · Blender Foundation · Blender Documentation Team).
          Sibling project:{" "}
          <a
            href="https://projects.blender.org/blender/blender-manual"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            projects.blender.org/blender/blender-manual
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT · Nikolai Janakiev) — reference collection for building GN trees
          and mesh objects entirely via <code>bpy</code>. The pattern used here
          for node creation and socket wiring follows the conventions established
          in that repository.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-offset-point-in-curve-chain-links",
  title:
    "GN Offset Point in Curve — Procedural Articulated Chain Links (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Use Offset Point in Curve + Evaluate at Index to look up each link's exact next-neighbour position, compute a precise centre-to-centre direction, and orient interlocking torus links around any Bezier path.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "45 minutes",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1 or later"],
      tools: [
        "Blender Scripting workspace",
        "Geometry Node Editor",
        "blueprint.py from this library entry",
      ],
    },
    steps: [
      "Open Blender 5.1 and switch to the Scripting workspace.",
      "Open blueprint.py in the text editor and press Run Script.",
      "Inspect the chain_path object — the ChainLinks GN modifier is attached.",
      "Open the Geometry Node Editor: locate the Offset Point in Curve node. Set Offset to 2 and observe every-other-link skip; reset to 1.",
      "In the modifier panel, drag Link Count between 12 and 80 to see ring density change.",
      "Zoom in on 4–5 adjacent links and orbit the camera. Confirm alternating links are perpendicular.",
      "Replace the input Bezier circle: Tab into Edit Mode, reshape the circle into an oval or S-curve. The chain re-conforms immediately.",
      "File → Save As → chain_links.blend. Verify chain_links.glb was written to the same folder.",
      "Run record.py headless to generate the viewport.mp4 animation.",
    ],
    troubleshooting: [
      {
        symptom: "All links face the same direction — no interlacing visible",
        cause:
          "The Rotate Euler node's Angle input is not receiving the (Index MODULO 2) × π/2 value, so all links rotate by 0°.",
        fix: "Trace the wire from Math MODULO (Index) → Math MULTIPLY (× π/2) → Rotate Euler Angle. If any wire is broken, reconnect. Confirm by placing a Viewer node on the Angle socket — it should alternate 0 and 1.5707… across the spreadsheet.",
      },
      {
        symptom:
          "Error: socket 'Offset' not found on GeometryNodeOffsetPointInCurve",
        cause:
          "The socket may be named 'Offset' only in Blender 5.1. Earlier 4.x builds use a different interface before the node was stabilised.",
        fix: "Print the available socket names: `print([s.name for s in opc.inputs])`. Use the returned name in place of 'Offset' in the blueprint. The node was introduced in 4.0; socket names were finalised by 4.2.",
      },
      {
        symptom:
          "Material missing from GLB — chain appears grey or untextured",
        cause:
          "Realize Instances is absent from the tree. Without it, Set Material writes to the instance wrapper, which the GLB exporter does not resolve.",
        fix: "Insert a Realize Instances node between Instance on Points and Set Material. Confirm by checking the exported GLB in three.js or Blender's GLB importer — the material should be visible immediately.",
      },
      {
        symptom: "Last link points in the wrong direction (spikes outward)",
        cause:
          "The input curve is OPEN (not closed) and Offset Point in Curve with Clamp=False wraps index N to 0, creating a backward-pointing direction vector.",
        fix: "Set Clamp=True on Offset Point in Curve, OR reduce Link Count by 1 so the last instance's Index never reaches the spline endpoint. Alternatively use a closed Bezier circle as recommended.",
      },
      {
        symptom: "Links are not equally spaced — gaps appear at curve bends",
        cause:
          "Resample Curve is missing or its Count is not connected to the Link Count group input — the curve is sampled at the default Bezier evaluation resolution.",
        fix: "Ensure Resample Curve precedes both Curve to Points and Offset Point in Curve, and that the same Link Count value drives all three Count inputs. With the resampled poly curve, arc-length distribution is exact.",
      },
    ],
  },
  base,
);

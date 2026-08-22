import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnCurveSpiralHelicalSpringBody() {
  return (
    <>
      <p>
        The <code>Spiral</code> node (<code>GeometryNodeCurveSpiral</code>) is one of the
        more satisfying corners of Blender&nbsp;5.1 Geometry Nodes: six scalar inputs produce
        a mathematically exact helix in a single evaluation, with no iterative approximation,
        no Screw modifier stack, and no hand-placed Bézier control points. Pipe its output
        through <code>Curve to Mesh</code> with a circle cross-section and you have a solid
        spring wire ready for WebXR GLB export in three to five nodes.
      </p>

      <h2>Parametric helix anatomy</h2>
      <p>
        A helix is defined by two quantities: its <em>radius</em> (distance from the axis)
        and its <em>pitch</em> (axial advance per rotation). The Spiral node exposes both
        indirectly:
      </p>
      <ul>
        <li>
          <strong>Rotations</strong> — total coil count; float values give partial final turns
          (8.5 produces a spring whose end coils are offset 180° from each other — useful for
          chassis springs that need specific end-coil orientation relative to a mount).
        </li>
        <li>
          <strong>Start Radius / End Radius</strong> — helix radius at the bottom and top
          control points respectively. Equal values → cylindrical spring; unequal → volute
          (conical). The radius interpolates linearly along the helix axis.
        </li>
        <li>
          <strong>Height</strong> — total Z extent. Pitch is implicit:{" "}
          <code>pitch = Height / Rotations</code>.
        </li>
        <li>
          <strong>Resolution</strong> — control points per full rotation. This governs
          smoothness around the helix axis, not the wire&apos;s cross-section. At 8 the coils
          look octagonal; at 32 they appear round at the standard 45° WebXR viewing angle; 64
          adds roughly 2× vertex count for diminishing visual return.
        </li>
        <li>
          <strong>Reverse</strong> — toggles handedness. <code>False</code> → right-hand helix
          (curl the right-hand fingers counterclockwise from below, thumb points up); <code>True</code>{" "}
          → left-hand. The Blender Manual — Spiral Node (CC-BY-SA 4.0, Blender Documentation Team)
          notes that reversed springs occur in counter-threaded fasteners and left-hand torque
          converters.
        </li>
      </ul>

      <h2>Three spring archetypes from one tree</h2>
      <p>
        No node changes are required between the three common engineering spring types —
        only parameter values change:
      </p>
      <ul>
        <li>
          <strong>Compression spring</strong>: <code>Start Radius == End Radius</code>,
          Height at natural length. Exported as-is; physics engine compresses it at runtime.
        </li>
        <li>
          <strong>Volute (conical) spring</strong>: <code>Start Radius = 1.2</code>,{" "}
          <code>End Radius = 0.4</code>. The wide base coils nest inside the narrow apex coils
          when compressed — useful for low-profile suspension springs and VRM accessory props
          that cannot afford height budget.
        </li>
        <li>
          <strong>Tension spring</strong>: identical to compression but Height multiplied by
          1.4–1.6 to show a pre-stretched state. Hook geometry at each end is a separate mesh
          joined with <code>Join Geometry</code>.
        </li>
      </ul>
      <p>
        The contrast with the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-screw-revolve-column"
          className={lk}
        >
          Screw modifier helix approach
        </Link>{" "}
        is instructive: the Screw modifier sweeps a profile around a pivot point with a
        per-turn offset, which is ideal when the profile itself is complex (threaded rod,
        fluted column). The Spiral GN node is superior when the helix geometry is parametric
        — you iterate parameter values without entering Edit Mode at all.
      </p>

      <h2>Chirality and VRM spring bones</h2>
      <p>
        The <code>Reverse</code> flag matters beyond aesthetics. Physical simulation engines
        that support torsional spring constraints (Bullet, Havok, PhysX) assign different
        angular stiffness directions to left- and right-hand helices when a twist torque is
        applied along the spring axis. In game engines that load GLB physics data, importing
        the wrong chirality can invert the spring&apos;s restoring force.
      </p>
      <p>
        VRM spring bones — covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          VRM spring bones tutorial
        </Link>{" "}
        — use a damped pendulum model (not torsion) and are chirality-agnostic, so{" "}
        <code>Reverse</code> is cosmetic there. The distinction matters when this spring is
        exported as a physics prop for an engine that reads GLB physics extensions (OMI
        physics shapes, MSFT_rigid_bodies, etc.).
      </p>

      <h2>Curve to Mesh: profile alignment and fill caps</h2>
      <p>
        <code>CurveToMesh</code> sweeps the profile circle along the helix tangent at each
        control point. The tangent direction is computed from the helical curve&apos;s derivative
        — at each point this is a unit vector angled <code>arctan(pitch / (2π × radius))</code>{" "}
        from horizontal (the helix angle). For a spring with Rotations&nbsp;=&nbsp;8,
        Radius&nbsp;=&nbsp;1.0, Height&nbsp;=&nbsp;4.0 the helix angle is about 7°, which
        means the wire cross-section leans 7° from vertical — correct and visible in the
        viewport when viewed from the side.
      </p>
      <p>
        <code>Fill Caps = True</code> adds a flat polygon face at each open wire end, closing
        the tube. Without it the wire is hollow at the tips — acceptable for internal
        mechanical springs hidden inside housing geometry, but distracting for visible WebXR
        props. The cap polygon has the same vertex count as the circle{" "}
        <code>Resolution</code> (<code>WIRE_SEGMENTS</code> = 12 by default), so it
        triangulates cleanly for GLTF export.
      </p>
      <p>
        For articulated chain links or spring segments that need neighbour-awareness, see{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-offset-point-in-curve-chain-links"
          className={lk}
        >
          GN Offset Point in Curve — chain links
        </Link>
        , which uses curve point indexing to interleave adjacent link geometry.
      </p>

      <h2>WebXR export: control-point density and GLB size</h2>
      <p>
        The spring wire at default settings (8 rotations × 32 resolution points × 12 wire
        segments = 3072 vertices before caps) compresses to roughly 12 kB with Draco level 6
        — well within WebXR polygon budgets. For hero springs that will be examined up close,
        increase <code>SPRING_RESOLUTION</code> to 64 and <code>WIRE_SEGMENTS</code> to 16;
        the GLB stays under 40 kB. For distant or animated background springs, 16/8 at
        ~1.5 kB is sufficient.
      </p>
      <p>
        The <code>export_apply=True</code> flag is non-negotiable: without it the GN modifier
        is not evaluated and Three.js receives the single-vertex host mesh. Shade Smooth is
        baked into vertex normals on export, so the glossy wire look requires no custom shader
        in Three.js — the Principled BSDF translates directly to a PBR metallic-roughness
        material in the GLB. For a runtime comparison using Three.js{" "}
        <code>CatmullRomCurve3</code> to approximate the same helix procedurally (useful when
        the spring deforms at runtime), see the CatmullRomCurve3 source linked below.
      </p>
      <p>
        For rounding the spring wire ends or adding ornamental bead caps, chain this tree
        into{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-fillet-curve-neon-sign"
          className={lk}
        >
          GN Fillet Curve
        </Link>{" "}
        before the CurveToMesh node to round each control point at a set radius.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/primitives/spiral.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Spiral Node — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team. Authoritative reference for the six
          input sockets, handedness conventions, and the relationship between Resolution and
          curve smoothness. Sibling pages:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/primitives/arc.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Arc Node
          </a>{" "}
          (planar arc, 2-D analogue) and{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/curve_to_mesh.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Curve to Mesh
          </a>{" "}
          (profile sweep with Fill Caps).
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Helix"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Helix — Wikipedia
          </a>{" "}
          · CC-BY-SA 3.0 · Wikipedia contributors. Covers the parametric equations{" "}
          <code>x = r cos θ, y = r sin θ, z = (h/2π) θ</code>, helix angle, pitch, and
          chirality. The article&apos;s engineering section covers torsional stiffness formulae
          for spring design. Sister articles:{" "}
          <a
            href="https://en.wikipedia.org/wiki/Coil_spring"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Coil spring
          </a>{" "}
          (engineering applications, volute vs cylindrical) and{" "}
          <a
            href="https://en.wikipedia.org/wiki/Archimedean_spiral"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Archimedean spiral
          </a>{" "}
          (flat 2-D analogue, useful for GN Arc node patterns).
        </li>
        <li>
          <a
            href="https://github.com/mrdoob/three.js/blob/dev/src/extras/curves/CatmullRomCurve3.js"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Three.js CatmullRomCurve3
          </a>{" "}
          · MIT · Ricardo Cabello (mrdoob) + three.js contributors. A runtime alternative
          for procedural helix approximation in WebXR: feed evenly-spaced helical sample
          points as the control array and set <code>closed=false</code>,{" "}
          <code>curveType=&apos;catmullrom&apos;</code>. Useful when the spring must deform
          dynamically at runtime (stretching, bending) without re-exporting a GLB. Sibling
          packages:{" "}
          <a
            href="https://github.com/pmndrs/react-three-fiber"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            @react-three/fiber
          </a>{" "}
          (MIT · Poimandres) and{" "}
          <a
            href="https://github.com/pmndrs/drei"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            drei
          </a>{" "}
          (MIT), which provide the <code>{"<QuadraticBezierLine>"}</code> and{" "}
          <code>{"<CatmullRomLine>"}</code> helpers for in-engine spring visualisation.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-curve-spiral-helical-spring-webxr",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Use the Geometry Nodes Spiral curve primitive to build a parametric helical spring in Blender 5.1 — compression, volute, and tension archetypes from one tree — then export as a Draco-compressed WebXR GLB with smooth wire normals.",
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
      "Familiar with the GN editor: adding nodes, wiring sockets, modifier panel",
      "Know Curve to Mesh basics — see /tutorials/blender-tutorial-gn-curve-to-mesh",
      "Understand Blender GLB export with Apply Modifiers enabled",
    ],
    steps: [
      {
        title: "Create host mesh and add Geometry Nodes modifier",
        body: "Add a Plane mesh (Shift+A → Mesh → Plane). In Properties → Modifier → Add Modifier, choose Geometry Nodes and click New. The host mesh is replaced entirely at evaluation time; its topology is irrelevant. Rename the object 'Spring_Host'.",
      },
      {
        title: "Add the Spiral node and set helix parameters",
        body: "In the GN editor: Add → Curve → Primitives → Spiral. Set Rotations = 8, Start Radius = 1.0, End Radius = 1.0, Height = 4.0, Resolution = 32, Reverse = Off. The helix appears as a curve in the viewport (no solid geometry yet). Drag the Spiral.Curve output towards the Group Output node's Geometry input — you will see a thin ribbon before the next step.",
      },
      {
        title: "Add the Circle profile for wire cross-section",
        body: "Add → Curve → Primitives → Circle. Set mode to Radius, Resolution = 12, Radius = 0.12. This is the cross-section profile that sweeps along the helix. Do not connect it to the Group Output — it feeds the Curve to Mesh node in the next step.",
      },
      {
        title: "Connect Curve to Mesh: extrude profile along helix",
        body: "Add → Curve → Operations → Curve to Mesh. Wire Spiral.Curve → CurveToMesh.Curve and Circle.Curve → CurveToMesh.Profile Curve. Enable the Fill Caps socket (click, set to True) — this closes the open wire ends with flat disk faces. Connect CurveToMesh.Mesh → Group Output.Geometry. The solid spring wire is now visible.",
      },
      {
        title: "Set shade smooth for round wire appearance",
        body: "Add → Geometry → Write → Set Shade Smooth. Insert it between CurveToMesh and Group Output. Set domain = Face, Shade Smooth = True. The wire surface changes from faceted polygon rings to a visually smooth cylinder. For WebXR: smooth normals are baked into the GLB vertex data and require no custom shader in Three.js.",
      },
      {
        title: "Assign brushed-steel material",
        body: "In Properties → Material, add a new material. In the shader editor: Principled BSDF with Base Color = (0.72, 0.74, 0.76), Metallic = 0.92, Roughness = 0.22, Anisotropic = 0.45. The anisotropy simulates the micro-groove texture of drawn steel wire. Connect to Material Output.",
      },
      {
        title: "Export GLB with Draco compression",
        body: "File → Export → glTF 2.0 (.glb). Filename: spring_coil.glb. Tick 'Apply Modifiers' (required — without this the GN modifier is not evaluated). Enable Draco Mesh Compression, level 6. Set Image Format to WebP. Confirm export.",
      },
    ],
    troubleshooting: [
      {
        symptom: "No geometry visible in viewport after adding Spiral node",
        cause: "Spiral output is a curve, not a mesh; the Group Output only shows mesh geometry unless a CurveToMesh node converts it",
        fix: "Add CurveToMesh and pipe Spiral.Curve → CurveToMesh.Curve, Circle.Curve → CurveToMesh.Profile Curve, then CurveToMesh.Mesh → Group Output.Geometry.",
      },
      {
        symptom: "Spring wire looks angular / polygonal, not round",
        cause: "WIRE_SEGMENTS is too low (default 6 is a hexagon) or Shade Smooth is not enabled",
        fix: "Increase Circle Resolution to 12–16 and add SetShadeSmooth (Shade Smooth = True) between CurveToMesh and Group Output.",
      },
      {
        symptom: "Spring ends show open holes (hollow tube tips)",
        cause: "Fill Caps input on CurveToMesh is False or unconnected",
        fix: "Click the Fill Caps socket on CurveToMesh and set its default value to True. No additional node required.",
      },
      {
        symptom: "Conical/volute taper is not visible",
        cause: "Start Radius == End Radius; linear interpolation between equal values produces a cylinder",
        fix: "Set Start Radius = 1.2 and End Radius = 0.4 (or any unequal pair). The taper becomes apparent at height ratios above 0.3.",
      },
      {
        symptom: "GLB is empty or shows a single vertex in Three.js",
        cause: "Modifier was not applied during export",
        fix: "Enable 'Apply Modifiers' (export_apply=True in bpy) in the GLTF export dialogue. This evaluates the GN tree and bakes the result into mesh data before writing.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-curve-spiral-helical-spring-webxr",
    title:
      "GN Curve Spiral — Parametric Helical Spring: Compression, Volute & Tension Variants for WebXR",
    date: "2026-06-27",
    kind: "tutorial",
    excerpt:
      "The Spiral curve node generates a mathematically exact helix in Blender 5.1 Geometry Nodes from six scalar parameters — Rotations, Start/End Radius, Height, Resolution, Reverse. Piped through Curve to Mesh it becomes a solid spring wire in three nodes. Three archetypes (compression, volute, tension) share the same tree; chirality is toggled via the Reverse flag. Expert depth on pitch, helix angle, Fill Caps, shade smooth baking, and Draco-compressed GLB export for WebXR.",
    Body: GnCurveSpiralHelicalSpringBody,
  },
);

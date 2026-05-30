import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnAccumulateFieldSpiralTowerBody() {
  return (
    <>
      <p>
        The <code>Accumulate Field</code> node computes a running prefix sum
        over every element of a domain in index order. Feed it per-point step
        heights and you get, for free, the exact cumulative base position of
        every subsequent pillar — no Repeat Zone, no simulation, no state
        carried between iterations. The three outputs — <em>Leading</em>,{" "}
        <em>Trailing</em>, and <em>Total</em> — are the floor, the ceiling, and
        the full height of the tower at a single node.
      </p>

      <p>
        The distinction between Leading and Trailing trips up most people the
        first time. At index&nbsp;0, Leading&nbsp;=&nbsp;0 (nothing precedes
        it) and Trailing&nbsp;=&nbsp;h₀ (only the first step). At index&nbsp;i,
        Leading&nbsp;=&nbsp;Σhⱼ for j&nbsp;&lt;&nbsp;i — the floor of pillar i.
        Trailing&nbsp;=&nbsp;Leading&nbsp;+&nbsp;hᵢ — the ceiling of pillar i.
        Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          Repeat Zone crystal cluster tutorial
        </Link>
        , which derives each shard&apos;s Z position from the loop iteration
        index via a MapRange — simpler but unable to express variable step
        sizes without explicit state.
      </p>

      <p>
        Because AccumulateField is a <em>field node</em>, its outputs are lazy
        expressions evaluated at read-time in the active domain context. You
        don&apos;t need a{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          Capture Attribute wrapper
        </Link>{" "}
        unless a downstream node shifts the active domain (e.g. inside an
        instance context after InstanceOnPoints). Keep both nodes in the same
        POINT context and the lazy evaluation is safe.
      </p>

      <p>
        The XY layout uses a Fermat spiral: radius proportional to √(i/(N−1)),
        angle equal to i&nbsp;×&nbsp;golden_angle_rad (≈&nbsp;137.5°). This gives
        equal-area point density — each pillar occupies the same angular wedge
        of area regardless of total count. Contrast this with the simpler
        circular ring used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          Instance on Points tutorial
        </Link>
        , which places evenly-spaced angles on a single radius and bunches up
        towards the centre as count grows.
      </p>

      <h2>AccumulateField API surface</h2>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto">
        {`n_accum = nodes.new("GeometryNodeAccumulateField")
n_accum.data_type = "FLOAT"   # FLOAT | INT | FLOAT_VECTOR | FLOAT2 | QUATERNION
n_accum.domain    = "POINT"   # POINT | EDGE | FACE | SPLINE | INSTANCE

links.new(step_height_field, n_accum.inputs[0])   # inputs[0] = Value
# inputs[1] = Group Index: 0 = one contiguous tower (default)

# outputs[0] = Leading   ← Σhⱼ for j < i  (floor of pillar i)
# outputs[1] = Trailing  ← Σhⱼ for j ≤ i  (ceiling of pillar i)
# outputs[2] = Total     ← grand sum over entire domain`}
      </pre>
      <p>
        The Group Index input partitions the running total into independent
        groups. Set it to a per-point integer and you get N separate
        accumulators running in parallel — useful for multi-arm spirals or
        grid columns. Leave it at&nbsp;0 for a single tower.
      </p>

      <h2>Pillar midpoint and unit-cone scaling</h2>
      <p>
        Unit-depth cones (depth&nbsp;=&nbsp;1) are instanced with
        Scale.Z&nbsp;=&nbsp;step_height. A scaled unit cone of
        depth&nbsp;d extends from −d/2 to +d/2 in local Z. To have the
        base sit exactly at <code>Leading_i</code>:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto">
        {`point_z = Leading_i + step_height_i / 2
# base of scaled cone = point_z - step_height_i/2 = Leading_i  ✓
# tip  of scaled cone = point_z + step_height_i/2 = Trailing_i ✓`}
      </pre>
      <p>
        Wire <code>CombineXYZ(spiral_x, spiral_y, point_z)</code> into{" "}
        <code>SetPosition.Position</code>. The XY taper (ShaderNodeMapRange
        from 1.0 at the base to 0.25 at the top) is driven by the same
        normalised index used for the Fermat radius — meaning the thinnest
        pillar is always also the tallest and furthest out. This matches the
        geometry of real mineral crystal growth fronts, where faster-growing
        facets narrow as available material depletes.
      </p>

      <h2>Flat shade after RealizeInstances</h2>
      <p>
        Apply <code>SetShadeSmooth(domain=&apos;FACE&apos;, False)</code> after{" "}
        <code>RealizeInstances</code>. Hard face normals are what give the
        crystal its mineralogical identity — the same technique used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
          className={lk}
        >
          Simulation Zone wave-reveal tutorial
        </Link>
        . Without it the EEVEE FORWARD path interpolates normals across
        the cone facets and the sharp-crystal silhouette becomes a smooth
        organic shape.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>All pillars same height</strong> — AccumulateField is
          evaluating in the wrong domain. Confirm{" "}
          <code>.domain = &quot;POINT&quot;</code> and that no intervening node
          has shifted to INSTANCE or FACE domain.
        </li>
        <li>
          <strong>Cones overlap at base</strong> — at index&nbsp;0,
          Leading&nbsp;=&nbsp;0 and the first pillar base is at Z&nbsp;=&nbsp;0.
          If BASE_HEIGHT is small relative to CONE_BASE_R the bottom pillar
          overlaps itself when viewed from above. Increase BASE_HEIGHT or
          reduce CONE_BASE_R.
        </li>
        <li>
          <strong>GLB is empty after export</strong> —{" "}
          <code>export_apply=True</code> is mandatory. Runtimes do not
          evaluate GN modifiers; without this flag the exporter serialises
          the empty base mesh.
        </li>
        <li>
          <strong>Pillar bases float above Z = 0</strong> — the first Leading
          is always 0 so this only happens if SetPosition.Position.Z receives
          Trailing instead of the midpoint. Check the wire from{" "}
          <code>mid_z = Leading + step_height/2</code> into CombineXYZ Z.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/field/accumulate_field.html"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Accumulate Field Node
          </a>
          , Blender Manual, CC-BY-SA 4.0.
        </li>
        <li>
          Jacques Lucke —{" "}
          <a
            href="https://devtalk.blender.org/t/geometry-nodes-fields/14042"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Geometry Nodes Fields RFC
          </a>
          , devtalk.blender.org, CC-BY-SA. Lucke designed the Blender fields
          system and the RFC explains the lazy-evaluation contract that makes
          AccumulateField safe to compose with other field nodes.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-accumulate-field-spiral-tower",
  title: "GN Accumulate Field — Parametric Spiral Tower (Blender 5.1)",
  date: "2026-05-29",
  kind: "tutorial",
  excerpt:
    "Running prefix sums over per-point step heights place every pillar's base Z at the exact cumulative total of all preceding pillars — GeometryNodeAccumulateField delivers this in one node with no loop, no simulation, no carried state.",
  Body: GnAccumulateFieldSpiralTowerBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable building GN trees via bpy.data API — no bpy.ops inside the tree.",
      "Completed the GN Instance on Points tutorial or understand InstanceOnPoints scaling.",
      "Blender 5.1 installed; able to run blueprint.py headlessly with --background.",
      "Understand the difference between a field expression and a stored attribute in Blender GN.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    steps: [
      {
        title: "Create the base object and GN tree",
        body: "Factory-reset the scene (read_factory_settings), create an empty mesh, attach a NODES modifier, and build a GeometryNodeTree. Register six group input sockets: Pillar Count (Int 28), Base Height (Float 0.06), Height Growth (Float 0.014), Spiral Radius (Float 0.95), Cone Base R (Float 0.10), Cone Vertices (Int 7).",
      },
      {
        title: "Wire step heights and AccumulateField",
        body: "Index → Math(MULTIPLY, HeightGrowth) → Math(ADD, BaseHeight) → AccumulateField.inputs[0]. Set AccumulateField.data_type='FLOAT' and .domain='POINT'. outputs[0] = Leading (floor), outputs[1] = Trailing (ceiling). Compute midpoint Z = Leading + step_height / 2.",
      },
      {
        title: "Build the Fermat spiral XY",
        body: "Normalise index: i / (N-1). Radius = SpiralRadius × √normalised. Angle = i × golden_angle_rad (2.39996). X = cos(angle) × radius; Y = sin(angle) × radius. CombineXYZ(X, Y, midpoint_Z) → SetPosition.Position on a GeometryNodePoints(Count) cloud.",
      },
      {
        title: "Instance unit cones with taper and flat shade",
        body: "MapRange(i/(N-1), 0→1, 1.0→0.25) gives taper factor. scale_xy = taper × ConeBaseR. CombineXYZ(scale_xy, scale_xy, step_height) → InstanceOnPoints.Scale. MeshCone(depth=1, radius_bottom=1, radius_top=0.01). RealizeInstances. SetShadeSmooth(domain='FACE', False).",
      },
      {
        title: "Assign material and export GLB",
        body: "Create a Principled BSDF material with Transmission Weight=0.90, Roughness=0.02, IOR=1.46, Base Color cobalt-blue. Assign to obj.data.materials. Run bpy.ops.export_scene.gltf with export_apply=True, Draco level 6, export_image_format='WEBP'. Save .blend with bpy.ops.wm.save_as_mainfile.",
      },
    ],
    finalResult:
      "A GLB containing a single flat-shaded mesh of 28 translucent crystal pillars arranged on a Fermat spiral, each successive pillar taller and slimmer than the last, their bases interlocked by cumulative AccumulateField prefix sums. The source .blend retains the live GN modifier with six exposed sliders. Dragging Pillar Count from 1 to 28 adds pillars one at a time in Fermat-spiral order.",
    variations: [
      "Multi-arm spiral: wire a second Index field into Group Index — use modulo (Index % 3) to create three independent accumulators, each building its own arm. The three arms interleave in the Fermat layout.",
      "Height-driven radius: replace the Fermat radius (based on index) with a radius derived from AccumulateField.Trailing so taller pillars push further outward. This mimics how real crystal blooms grow.",
      "Animated reveal: keyframe Pillar Count from 1 to 28 over 84 frames with CONSTANT interpolation. record.py demonstrates this — run it after blueprint.py.",
    ],
    troubleshooting: [
      {
        symptom: "All pillars identical height — AccumulateField seems to output a constant",
        cause: "domain on the AccumulateField node is set to 'INSTANCE' or 'FACE' instead of 'POINT', so it sees only one element.",
        fix: "Set n_accum.domain = 'POINT' explicitly. Also confirm the GeometryNodePoints node feeds into SetPosition before InstanceOnPoints — the POINT context must be active when AccumulateField is evaluated.",
      },
      {
        symptom: "GLB exports as empty mesh — zero faces in Three.js / model viewer",
        cause: "export_apply=False (the default). The exporter writes the unmodified base mesh, which has no faces.",
        fix: "Add export_apply=True to bpy.ops.export_scene.gltf(). Also verify bpy.context.view_layer.objects.active = obj and obj.select_set(True) before calling the operator.",
      },
      {
        symptom: "Pillar bases float — tower doesn't start at Z = 0",
        cause: "CombineXYZ Z is receiving AccumulateField.Trailing instead of the midpoint calculation.",
        fix: "Recheck mid_z = n_accum.outputs[0] (Leading) + step_height / 2. If you accidentally wired outputs[1] (Trailing) the first pillar's midpoint will be at step_height instead of step_height/2.",
      },
    ],
  },
  base,
);

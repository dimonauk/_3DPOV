import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ArrayCurveDeformChainRopeBody() {
  return (
    <>
      <p>
        Two modifiers, one elegant pipeline. Array fills a guide path with
        repeated link segments; Curve bends the resulting strip to follow any
        arbitrary Bezier without distorting the individual links. Neither
        modifier knows about the other — they co-operate because Blender
        applies the modifier stack in order, so Array fires first and Curve
        deforms its output. Reshape the guide path in Edit Mode and the link
        count recalculates in real time, courtesy of Array&apos;s{" "}
        <em>Fit Curve</em> mode.
      </p>
      <p className="mt-3">
        This is one of Blender&apos;s oldest power-user workflows — it
        predates Geometry Nodes entirely — but it remains the fastest way to
        produce physically plausible chains, ropes, tracks, necklaces, and
        fence rails because the modifier stack is non-destructive and
        computationally trivial compared to a full Geometry Nodes graph.
        See the{" "}
        <Link href="/tutorials/blender-tutorial-gn-curve-to-mesh" className={lk}>
          Curve-to-Mesh GN tutorial
        </Link>{" "}
        for the node-graph equivalent when you need per-point attribute control.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The travel axis — why X, not Z
      </h2>
      <p>
        Both modifiers share an axis convention. Array slides copies along
        the object&apos;s local X by default (Constant Offset X = link pitch).
        The Curve modifier&apos;s <code>deform_axis</code> property — set to{" "}
        <code>POS_X</code> — maps that same local X onto the curve&apos;s
        tangent direction. If the link is modelled with its travel direction
        along Z instead, you must change <code>deform_axis</code> to{" "}
        <code>POS_Z</code> and update the Constant Offset accordingly, or the
        strip will be crushed to a point. Model the single link with X as the
        travel axis from the start; it saves a great deal of confusion.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`# Array modifier — bpy API
mod_arr = obj.modifiers.new("Array", 'ARRAY')
mod_arr.fit_type              = 'FIT_CURVE'   # auto-count from curve arc-length
mod_arr.curve                 = guide_obj     # the Bezier path object
mod_arr.use_constant_offset   = True
mod_arr.constant_offset_displace = (link_pitch, 0.0, 0.0)   # travel along X
mod_arr.use_relative_offset   = False         # must be OFF or you get double-offset

# Curve modifier
mod_crv = obj.modifiers.new("Curve", 'CURVE')
mod_crv.object      = guide_obj
mod_crv.deform_axis = 'POS_X'`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Fit Curve vs Fixed Count vs Fit Length
      </h2>
      <p>
        Array&apos;s <code>fit_type</code> property has three modes that solve
        different authoring problems:
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
        <li>
          <code>FIXED_COUNT</code> — you supply an integer. Simple, but if you
          reshape the curve the strip overshoots or falls short. Good for
          static scenes where the count is known in advance.
        </li>
        <li>
          <code>FIT_CURVE</code> — points to a curve object; count =
          ceil(arc_length ÷ link_pitch). The count updates every time the
          curve is edited, which is why this is preferred for dynamic scenes.
          Requires the Curve modifier to reference the <em>same</em> curve
          object.
        </li>
        <li>
          <code>FIT_LENGTH</code> — you supply a float (metres). Works like
          Fit Curve but without a live link to the path, useful when you want
          a fixed physical length of chain independent of any guide.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Building a two-link chain unit cell
      </h2>
      <p>
        A real chain alternates horizontal and vertical links. Array copies
        the object as a rigid unit, so it cannot produce alternating
        orientations unless the alternation is baked into the base object.
        The solution is a <em>two-link unit cell</em>: model one horizontal
        and one vertical link in the same object, separated by exactly one
        pitch. Array then tiles this two-link pair, and the alternation
        appears automatically.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`# Two-link unit cell in bpy — after building both half-tori in bmesh:

# Link A — horizontal, centred at X = -half_pitch
xform_a = Matrix.Translation((-half_pitch, 0, 0))

# Link B — rotated 90° about X, centred at X = +half_pitch
rot90x = Matrix.Rotation(math.pi / 2, 4, 'X')
xform_b = Matrix.Translation((half_pitch, 0, 0)) @ rot90x

# Pair total X-extent = 2 × (2 × LINK_WIDTH + LINK_GAP)
# Array Constant Offset X = this total extent → end-to-end repeat`}</pre>
      <p className="mt-3">
        The half-torus (π arc) leaves two open faces that the adjacent link
        threads through. The minor cross-section radius must be smaller than
        the gap between the adjacent link&apos;s inner and outer radii, or the
        links will interpenetrate in Edit Mode.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Rope — Object Offset and cumulative twist
      </h2>
      <p>
        For a rope, each segment is a short cylinder. Instead of Constant
        Offset, we use <em>Object Offset</em>: an Empty that is both
        translated by one segment length along X <em>and</em> rotated by
        15° around X. Array accumulates the transforms multiplicatively, so
        copy <em>n</em> is rotated by 15° × <em>n</em>. After enough copies
        the helical braid rhythm is clearly visible before Curve bends the strip.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`# Rope twist empty — placed as Array offset object
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
twist_empty = bpy.context.active_object
twist_empty.rotation_euler.x = math.radians(15)   # 15° per copy
twist_empty.location.x       = seg_length          # advance one segment

mod_arr.use_object_offset    = True
mod_arr.offset_object        = twist_empty
mod_arr.use_constant_offset  = False   # object offset replaces constant`}</pre>
      <p className="mt-3">
        WHY 15° and not 120°? 120° would give exactly one revolution of a
        single strand, but with a short cylinder the visual reads as a smooth
        spiral rather than a plaited braid. 15° accumulates slowly enough
        that adjacent copies still appear staggered, matching the perceived
        rhythm of a three-strand rope.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Guide curve — origin placement matters
      </h2>
      <p>
        The Curve modifier wraps the mesh around the guide path starting
        from the curve&apos;s <em>object origin</em>. If the origin is not at
        the first control point, the chain will be offset along the path
        — it starts mid-way through, or the first links hang in empty space.
        After placing control points, set the curve object&apos;s origin to
        the first point with{" "}
        <strong>Object ▸ Set Origin ▸ Origin to Geometry</strong>, or in bpy:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
# or manually: move the origin to spline.bezier_points[0].co`}</pre>
      <p className="mt-3">
        The same origin is used by the Array modifier when computing Fit Curve
        arc-length — a misplaced origin does not affect the count, but does
        affect where the strip starts deforming.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        GLB export — apply modifiers
      </h2>
      <p>
        glTF 2.0 has no concept of procedural modifiers. At export time, set{" "}
        <code>export_apply = True</code> in{" "}
        <code>bpy.ops.export_scene.gltf</code> to bake the Array + Curve stack
        into a static mesh. The baked chain is a dense but geometrically correct
        mesh that Three.js loads without any special handling. For WebXR scenes
        where you want run-time path control, the alternative is to export the
        guide curve as a set of vertex positions and reconstruct a tube in
        Three.js using{" "}
        <code>THREE.TubeGeometry</code> or{" "}
        <code>THREE.CatmullRomCurve3</code>.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`bpy.ops.export_scene.gltf(
    filepath       = str(out_path / "chain_rope.glb"),
    export_format  = 'GLB',
    export_apply   = True,   # CRITICAL — bakes Array + Curve to static mesh
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
)`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Failure modes and troubleshooting
      </h2>
      <ul className="list-disc list-inside space-y-2 text-sm mt-2">
        <li>
          <strong>Chain collapses to a straight line ignoring the curve</strong>
          — Curve modifier is above Array in the stack. Array must be first (top
          of the list). Drag Curve below Array in the Properties panel.
        </li>
        <li>
          <strong>Links are crushed or sheared</strong> — Curve modifier deform
          axis does not match the travel axis of the link geometry. Verify that
          the link&apos;s X-axis is the travel direction and{" "}
          <code>mod_crv.deform_axis = 'POS_X'</code>.
        </li>
        <li>
          <strong>Count stays at 1 regardless of curve length</strong> — the
          Array modifier&apos;s curve pointer is not set, or it points to a mesh
          object instead of a curve object. Only Bezier, NURBS, and Path objects
          are valid targets for Fit Curve.
        </li>
        <li>
          <strong>First link starts half-way along the path</strong> — curve
          object origin is not at the first control point. Use{" "}
          <em>Set Origin ▸ Origin to Geometry</em>.
        </li>
        <li>
          <strong>GLB is empty or has no mesh</strong> — the chain object&apos;s
          modifiers produced zero faces (e.g. Fit Curve returned count = 0
          because the curve is too short). Check the curve arc-length vs link
          pitch.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Studio connections
      </h2>
      <p>
        The Curve modifier is the modifier-stack sibling of{" "}
        <Link href="/tutorials/blender-tutorial-armature-spline-ik-tentacle" className={lk}>
          Spline IK
        </Link>{" "}
        — that tutorial deforms <em>bones</em> along a curve; this one deforms
        mesh vertices. The{" "}
        <Link href="/tutorials/blender-tutorial-gn-fillet-curve-neon-sign" className={lk}>
          Fillet Curve GN tutorial
        </Link>{" "}
        shows how to round the corners of the guide path before the chain
        follows it, avoiding kinks at tight bends. For a node-graph version of
        the entire pipeline, see{" "}
        <Link href="/tutorials/blender-tutorial-gn-curve-to-mesh" className={lk}>
          Curve to Mesh
        </Link>
        . The edge-wear shader from{" "}
        <Link href="/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear" className={lk}>
          Procedural Worn Metal Edge Wear
        </Link>{" "}
        pairs directly with the chain material — driven by the baked mesh&apos;s
        edge curvature.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/array.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Array Modifier — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/curve.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Curve Modifier — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          · MIT · Nicolas Janakiev — bpy scripting patterns referenced for
          modifier creation and animation keyframe insertion
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: ["Modifier Properties panel", "Bezier curve guide path"],
    },
    steps: [
      {
        title: "Build the single link (or two-link cell for chain)",
        body: "Model a half-torus in bmesh oriented with X as travel axis. For chain, duplicate and rotate 90° around X to form the interlocking pair. Total X extent = 2 × link pitch.",
      },
      {
        title: "Create the Bezier guide curve",
        body: "Add a Bezier curve, place control points along the desired path, set Auto handles. Move the curve object origin to the first control point.",
      },
      {
        title: "Add Array modifier — Fit Curve",
        body: "Add Array to the link object. Set fit_type = FIT_CURVE, point to the guide curve. Enable Constant Offset X = link pitch, disable Relative Offset.",
      },
      {
        title: "Add Curve modifier — +X axis",
        body: "Add Curve modifier below Array. Point to the same guide curve. Set deform_axis = POS_X. Watch the strip bend to follow the path.",
      },
      {
        title: "Reshape the guide in Edit Mode",
        body: "Tab into the guide curve, grab a handle and move it. Return to Object Mode — observe the Array count update automatically.",
      },
      {
        title: "Export GLB with export_apply = True",
        body: "Run bpy.ops.export_scene.gltf with export_apply=True. This bakes Array + Curve to a static mesh that any glTF 2.0 loader can read.",
      },
    ],
  },
  {
    slug: "blender-tutorial-modifier-array-curve-deform-chain-rope",
    title:
      "Array Modifier + Curve Deform: Procedural Chain / Rope Along Curve (Blender 5.1)",
    date: "2026-06-13",
    kind: "tutorial",
    excerpt:
      "Two modifiers — Array (Fit Curve) and Curve Deform — produce a live, reshapeable chain or rope without Geometry Nodes. Reshape the Bezier guide path and the link count recalculates automatically.",
    Body: ArrayCurveDeformChainRopeBody,
  },
);

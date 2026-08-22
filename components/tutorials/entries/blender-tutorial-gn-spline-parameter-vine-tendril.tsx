import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSplineParameterVineTendrilBody() {
  return (
    <>
      <p>
        The <code>Spline Parameter</code> node outputs a float called{" "}
        <em>Factor</em> — 0 at the first control point, 1 at the last —
        that flows along every spline in the curve object simultaneously.
        Feed it into <code>Store Named Attribute</code> before any geometry
        conversion and you have a reusable per-point gradient that drives
        taper, colour, density, and instancing from a single field
        evaluation. This tutorial builds a cluster of five Bezier tendrils
        whose stems taper from root to tip and whose diamond-shaped leaves
        appear only where Factor exceeds a live-adjustable threshold.
      </p>
      <p>
        The architecture links directly to the named-attribute round-trip
        covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          Capture Attribute tutorial
        </Link>{" "}
        and the curve-to-mesh extrusion pipeline in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh"
          className={lk}
        >
          Curve to Mesh tutorial
        </Link>
        .
      </p>

      <h2>Why ResampleCurve must come first</h2>
      <p>
        Bezier control points are not uniformly spaced in arc-length
        parameter — they cluster near the influence of each handle. Reading{" "}
        <code>SplineParameter.Factor</code> at raw control points gives a
        non-linear ladder: dense at root and tip, sparse in the middle.
        Placing <code>ResampleCurve(COUNT=64)</code> before everything else
        converts each spline to 64 equal-arc-length points. Factor now steps
        linearly 0, 1/64, 2/64 … 63/64 — a reliable scaffold for taper,
        colour ramps, and leaf spacing. Note that the last point lands at
        63/64 ≈ 0.984, not 1.0; keep LEAF_THRESHOLD below 0.984 if you
        want the very tip to show leaves.
      </p>

      <h2>The StoreNamedAttribute round-trip</h2>
      <p>
        <code>SplineParameter</code> is a <em>curve-domain field</em>. The
        moment you pass the geometry through <code>CurveToPoints</code> the
        domain shifts from CURVE/POINT to POINT (different context), and the{" "}
        <code>Factor</code> output socket evaluates to 0 everywhere in that
        new context. The fix is to freeze the field value before any domain
        change:{" "}
        <code>StoreNamedAttribute(name=&quot;vine_t&quot;, domain=POINT)</code>{" "}
        writes the current Factor values into the geometry&apos;s attribute
        layer. Any downstream node — including nodes after{" "}
        <code>CurveToPoints</code> — reads it back with{" "}
        <code>InputNamedAttribute(&quot;vine_t&quot;)</code> and gets the
        correct 0→1 gradient per point. This round-trip is the standard
        pattern for cross-domain attribute access in Blender 5.1, the same
        principle the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-accumulate-field-spiral-tower"
          className={lk}
        >
          Accumulate Field tutorial
        </Link>{" "}
        uses when passing accumulated offsets through a domain shift.
      </p>
      <pre className="bg-black/40 rounded p-3 text-sm overflow-x-auto">{`ResampleCurve(COUNT=64)
  → StoreNamedAttribute("vine_t", domain=POINT, value=SplineParameter.Factor)
  ├─[A] InputNamedAttribute("vine_t") → MapRange(0→1, BASE→TIP)
  │      → SetCurveRadius → CurveToMesh ← CurvePrimitiveCircle(res=6)
  │      → SetMaterial(VineStem) → JoinGeometry
  └─[B] CurveToPoints(LENGTH=0.10)
         InputNamedAttribute("vine_t") → Compare(GREATER_THAN, Leaf_Threshold)
         → InstanceOnPoints(Selection, Instance=LeafTemplate)
         → SetMaterial(VineLeaf) → JoinGeometry`}</pre>

      <h2>Taper with MapRange</h2>
      <p>
        <code>MapRange(from_min=0, from_max=1, to_min=BASE, to_max=TIP)</code>{" "}
        converts vine_t directly to radius — no manual lerp arithmetic.
        BASE = 0.035 m (thick bark), TIP = 0.004 m (needle), clamp=True.
        The result feeds <code>SetCurveRadius</code> before{" "}
        <code>CurveToMesh</code>: each resampled point gets its own profile
        radius, creating a smooth taper. The hexagonal profile circle
        (resolution=6) is imperceptible as faceted at these radii; it stays
        genuinely low-poly at the studio&apos;s export densities — the same
        trade-off covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-curves-hair-grooming"
          className={lk}
        >
          Curves Hair Grooming tutorial
        </Link>
        .
      </p>

      <h2>Leaf instancing on a LENGTH-mode CurveToPoints</h2>
      <p>
        <code>CurveToPoints(mode=LENGTH, length=0.10 m)</code> places one
        point every 10 cm along each tendril regardless of local curvature
        speed — uniform density. <code>InputNamedAttribute(&quot;vine_t&quot;)</code>{" "}
        at this POINT domain retrieves the stored gradient, which{" "}
        <code>Compare(GREATER_THAN, Leaf Threshold)</code> converts to a
        boolean selection mask. <code>InstanceOnPoints</code> stamps the
        diamond leaf mesh (4 verts, 2 tris) only at selected points. Moving
        the <strong>Leaf Threshold</strong> modifier socket live in the
        properties panel sweeps leaves inward from the tips — a gradient
        field controlling instancing in real time.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>No taper — all stems same width</strong> —{" "}
          <code>InputNamedAttribute</code> Name does not match
          &quot;vine_t&quot; exactly (case-sensitive). Confirm both the Store
          node and the read-back node use identical strings.
        </li>
        <li>
          <strong>Leaves appear along the full stem</strong> — the{" "}
          <code>vine_t</code> attribute is reading 0 everywhere after{" "}
          <code>CurveToPoints</code>, causing Compare to return True for all
          points. Confirm <code>StoreNamedAttribute</code> is wired before
          the branch, not after it.
        </li>
        <li>
          <strong>Leaf placement is uneven — dense at root, sparse at tip</strong>{" "}
          — <code>ResampleCurve</code> is missing or placed after
          StoreNamedAttribute. Resample must be the first node after
          GroupInput.Geometry.
        </li>
        <li>
          <strong>GLB has stems but no leaves</strong> —{" "}
          <code>export_apply=True</code> was not set, or the LeafTemplate
          object was deleted before export. Confirm the object exists in bpy
          data and export_apply is True.
        </li>
        <li>
          <strong>Modifier socket key &quot;Input_2&quot; fails in record.py</strong>{" "}
          — sockets were reordered in the GN editor after blueprint.py ran.
          Open the modifier panel, hover over the Leaf Threshold value, and
          press Ctrl+Alt+U to inspect the RNA data_path. Update THRESH_KEY in
          record.py accordingly.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Blender Documentation Team —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/read/spline_parameter.html"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Spline Parameter Node
          </a>
          , Blender Manual, CC-BY-SA 4.0. Related: <em>Resample Curve</em>{" "}
          and <em>Curve to Points</em> in the same Curve section.
        </li>
        <li>
          Blender Documentation Team —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/store_named_attribute.html"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Store Named Attribute Node
          </a>
          , Blender Manual, CC-BY-SA 4.0. The write-side of the named
          attribute round-trip; pair with <em>Input Named Attribute</em> for
          cross-domain reads.
        </li>
        <li>
          Khronos Group —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            glTF-Blender-IO
          </a>
          , Apache-2.0. <code>export_apply=True</code> realises the GN
          modifier output — leaf instances become mesh faces in the binary
          accessor.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-spline-parameter-vine-tendril",
  title:
    "GN Spline Parameter — Procedural Vine Tendril with Tapering Profile and Tip Instancing (Blender 5.1)",
  date: "2026-06-02",
  kind: "tutorial",
  excerpt:
    "SplineParameter.Factor flows 0→1 along each Bezier spline. StoreNamedAttribute freezes it as 'vine_t' before CurveToMesh and CurveToPoints branches — the only way to use the gradient in both CURVE and POINT domain contexts. MapRange drives taper; a live Leaf Threshold socket sweeps diamond-leaf instances inward from the tips.",
  Body: GnSplineParameterVineTendrilBody,
};

export const entry = buildInstructable(
  {
    goal: "Build five Bezier tendril strands in a GN modifier, store SplineParameter.Factor as 'vine_t' for cross-branch access, use MapRange to drive a hexagonal-profile taper from root to needle-tip, place diamond leaf instances along CurveToPoints output where vine_t exceeds a live threshold, and export a Draco-compressed GLB.",
    blenderVersion: "5.1",
    libraryPath: "blends/geometry-nodes/gn-spline-parameter-vine-tendril",
    time: "2–3 hours",
    difficulty: "advanced",
    prerequisites: [
      "Blender 5.1 installed",
      "Geometry Nodes modifier basics — adding a GN modifier, navigating the node editor",
      "Familiarity with Bezier curves in Blender (Edit mode, control points, handles)",
      "Python scripting access (Scripting workspace or terminal)",
    ],
    steps: [
      {
        title: "Create materials and leaf template mesh",
        body: "Run the Material + leaf sections of blueprint.py: VineStem (ochre-brown, roughness 0.85) and VineLeaf (forest green, roughness 0.55). Build the diamond leaf as a 4-vert bmesh: tip (0, 0, +LEAF_HALF_H), right, base, left. Create the Object without linking it to the scene — GN ObjectInfo accesses unlinked objects via the data block.",
      },
      {
        title: "Create the fan of Bezier vine curves",
        body: "Run make_vine_curves(N_CURVES=5, SEED=42). Each spline has 3 control points: root at ground with FREE handles for a slight upward lean, mid with AUTO handles for a natural S-bend, tip with AUTO handles curling outward. cu.resolution_u=12 for smooth viewport preview — the GN ResampleCurve overrides this for the actual geometry.",
      },
      {
        title: "Add GN modifier and build the interface",
        body: "Create a GeometryNodeTree named 'VineTendrilGN'. Add GROUP_OUTPUT Geometry and GROUP_INPUT Geometry sockets via nt.interface.new_socket(). Add the Leaf Threshold float socket (default=0.80, range 0–1). Add NodeGroupInput and NodeGroupOutput nodes.",
      },
      {
        title: "ResampleCurve → StoreNamedAttribute",
        body: "Add GeometryNodeResampleCurve (mode=COUNT, Count=64). Wire GroupInput.Geometry → ResampleCurve.Curve. Add GeometryNodeSplineParameter — no Geometry input needed; it evaluates from the downstream context. Add GeometryNodeStoreNamedAttribute (data_type=FLOAT, domain=POINT, Name='vine_t'). Wire: ResampleCurve.Curve → Store.Geometry; SplineParameter.Factor → Store.Value.",
      },
      {
        title: "Taper branch — MapRange → SetCurveRadius → CurveToMesh",
        body: "Add GeometryNodeInputNamedAttribute (data_type=FLOAT, Name='vine_t'). Add ShaderNodeMapRange (clamp=True, From 0→1, To BASE_RADIUS→TIP_RADIUS). Wire: NamedAttribute.Attribute → MapRange.Value. Add GeometryNodeSetCurveRadius; wire MapRange.Result → Radius, Store.Geometry → Curve. Add CurvePrimitiveCircle(Resolution=6, Radius=1.0) as profile. Add CurveToMesh (Fill Caps=False). Wire SetCurveRadius.Curve → CurveToMesh.Curve; Circle.Curve → CurveToMesh.Profile. Add SetMaterial(VineStem) → JoinGeometry.",
      },
      {
        title: "Leaf branch — CurveToPoints → InstanceOnPoints",
        body: "Add GeometryNodeCurveToPoints (mode=LENGTH, Length=0.10). Wire Store.Geometry → CurveToPoints.Curve. Add a second InputNamedAttribute('vine_t'). Add FunctionNodeCompare (FLOAT, GREATER_THAN); wire vine_t.Attribute → A, GroupInput.Leaf Threshold → B. Add ObjectInfo; set Object=LeafTemplate, transform_space=ORIGINAL. Add InstanceOnPoints; wire CurveToPoints.Points → Points, Compare.Result → Selection, ObjectInfo.Geometry → Instance. Add SetMaterial(VineLeaf) → JoinGeometry (same join node as stem). JoinGeometry → GroupOutput.",
      },
      {
        title: "Attach modifier, save, and export",
        body: "Attach the GN tree to curve_ob as a NODES modifier named 'GNVineTendril'. Call bpy.context.view_layer.update() to force evaluation. Save the blend with bpy.ops.wm.save_as_mainfile. Export GLB with export_apply=True, Draco level 6, WebP, export_yup=True.",
      },
    ],
    finalResult:
      "A .blend with five Bezier vine strands under a GN modifier producing tapered hexagonal-tube stems (thick at root, needle-thin at tip) and diamond leaf instances at the upper 20% of each tendril. A Draco-compressed GLB with fully realised stem + leaf geometry. The Leaf Threshold group socket lets you sweep leaves from full-coverage to tip-only in real time.",
    variations: [
      "Colour gradient along the stem: add a second StoreNamedAttribute storing vine_t as FLOAT_COLOR using ColorRamp(0=bark-brown, 1=leaf-green). Wire as vertex colour on the mesh after CurveToMesh — no UV needed.",
      "Animated growth: keyframe the Bezier curve's scale.z from 0→1 over 60 frames while simultaneously lowering Leaf Threshold from 0.90 to 0.75 — the stem grows up and leaves bloom as it goes.",
      "Multiple leaf shapes: add a GeometryNodeSwitch (GEOMETRY type) gated by Compare(vine_t, >, 0.90) to switch between a small diamond (tip) and a wider rounded oval (mid). The factor drives both the placement threshold and the shape selection.",
    ],
    troubleshooting: [
      {
        symptom: "No taper — all stems have the same radius",
        cause:
          "InputNamedAttribute Name string does not match StoreNamedAttribute Name (case-sensitive). A mismatch reads as attribute-not-found → 0 everywhere → MapRange outputs BASE_RADIUS for all points.",
        fix: "Confirm both nodes have identical Name strings ('vine_t'). Check in the spreadsheet view (Ctrl+Shift+click the node) that the attribute exists and has non-zero values at tip-side points.",
      },
      {
        symptom: "Leaves appear along the full length, not just the tips",
        cause:
          "StoreNamedAttribute is wired after CurveToPoints instead of before the branch. The points context cannot read the stored value so InputNamedAttribute returns 0, and Compare(0 > 0.80) = False for all — unless threshold was set negative, in which case True everywhere.",
        fix: "Move StoreNamedAttribute to be the first node after ResampleCurve, before the branch to CurveToPoints.",
      },
      {
        symptom: "Leaf placement is uneven — dense at root, sparse near tip",
        cause:
          "ResampleCurve is missing. SplineParameter.Factor is evaluated at raw Bezier control points, which cluster near the two end handles.",
        fix: "Insert GeometryNodeResampleCurve(mode=COUNT, Count=64) as the first node after GroupInput.Geometry. Re-wire: GroupInput → Resample → Store → branches.",
      },
      {
        symptom: "GLB exports stems but no leaf geometry",
        cause:
          "export_apply=True was omitted, or the LeafTemplate object was deleted before export. GN instance geometry is only realised when the modifier is applied.",
        fix: "Pass export_apply=True to bpy.ops.export_scene.gltf. Confirm bpy.data.objects['LeafTemplate'] still exists at export time (blueprint.py keeps it unlinked but in bpy.data).",
      },
    ],
  },
  base,
);

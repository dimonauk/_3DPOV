import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnMeshToCurveWireframeScaffoldBody() {
  return (
    <>
      <p>
        The <strong>Mesh to Curve</strong> node converts every edge of a mesh
        into a 2-point spline, turning a polygon mesh into a set of curve
        strands.  <strong>Curve to Mesh</strong> then sweeps a cross-section
        profile along each strand, producing a tube for every structural edge.
        Together they are the Geometry Nodes answer to Blender&apos;s Wireframe
        modifier — but unlike the modifier they preserve full attribute access
        at each topology level, so you can drive per-tube diameter from any
        per-edge scalar.  Here the unsigned dihedral angle drives thickness:
        edges where two faces meet at a sharp angle become heavy structural
        members; near-flat seams become thin hairlines.  The result reads
        immediately as a geodesic tensegrity scaffold rather than a uniform
        wire cage.
      </p>

      <p>
        The critical subtlety is <strong>domain migration</strong>.  When
        Mesh to Curve executes, the topology changes: each edge becomes one
        spline, and each endpoint vertex becomes one spline point.
        Consequently, attributes stored at <code>EDGE</code> domain on the
        original mesh end up at <code>SPLINE</code> domain on the resulting
        curve — not at <code>POINT</code> domain.  To use an edge-level value
        for per-point radius control, a{" "}
        <code>Field on Domain</code> node (internally{" "}
        <code>GeometryNodeFieldOnDomain</code>) must explicitly broadcast the
        spline-domain scalar to both points of each 2-point spline.  Omitting
        this and reading the named attribute at POINT domain returns 0.0 on
        every tube — a maddening silent failure with no error in the console.
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-capture-attribute-named-attribute"
          className={lk}
        >
          Capture Attribute tutorial
        </Link>{" "}
        covers the underlying domain-preservation rules in depth; this tutorial
        adds the conversion step that the capture-attribute pattern omits.
      </p>

      <p>
        The pipeline opens with a{" "}
        <code>StoreNamedAttribute</code> node (domain={" "}
        <code>EDGE</code>, data type <code>FLOAT</code>, name{" "}
        <code>&quot;edge_sharpness&quot;</code>) fed by the{" "}
        <code>Edge Angle</code> node&apos;s <em>Unsigned Angle</em> output,
        which reports the dihedral angle in radians in [0, π].  This capture
        must happen <em>before</em>{" "}
        <code>MeshToCurve</code> — once the topology change fires the edge
        domain is gone.  After <code>MeshToCurve</code>, a{" "}
        <code>Named Attribute</code> node reads <code>&quot;edge_sharpness&quot;</code>
        (still at SPLINE domain), and <code>Field on Domain</code> with output
        domain set to <code>POINT</code> broadcasts each spline&apos;s scalar
        to its two endpoint points.  A <code>Map Range</code> node then
        converts [0, π] to [THIN_RADIUS, THICK_RADIUS], and{" "}
        <code>Set Curve Radius</code> writes the result into the built-in
        curve-point <em>radius</em> attribute.  When <code>CurveToMesh</code>{" "}
        runs, it multiplies the profile circle by each point&apos;s radius
        automatically — the profile itself stays at a neutral radius of 1.0,
        so all size control flows through the one <code>Set Curve Radius</code>{" "}
        node, making the two modifier parameters (<em>Thin Radius</em>,{" "}
        <em>Thick Radius</em>) the only knobs the artist touches.  Compare the
        domain-conversion chain here with the simpler but less flexible{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-accumulate-field-spiral-staircase"
          className={lk}
        >
          Accumulate Field spiral tutorial
        </Link>
        , which keeps all computation within a single domain and avoids the
        broadcast step entirely.
      </p>

      <p>
        <code>Curve to Mesh</code> with <em>Fill Caps = True</em> adds disc
        faces at each tube end, making the swept mesh manifold.  Without
        capping, every tube is an open cylinder: technically non-manifold and
        therefore unprintable, and likely to produce artefacts in WebXR raster
        passes where the camera looks inside the tube at grazing angle.  After{" "}
        <code>CurveToMesh</code>, a <code>Merge by Distance</code> node welds
        the coincident tube endpoints that congregate at each original sphere
        vertex — on a subdivision-2 icosphere every vertex has valence 5 or 6,
        so up to 12 tube-cap vertices stack at the same world position and must
        be fused into a clean junction.  The weld distance of 0.003 m is safely
        below the minimum edge length (≈ 0.23 m at radius 1.0) yet large enough
        to catch floating-point coincidences.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-3d-print-mesh-analysis"
          className={lk}
        >
          3D print mesh analysis script
        </Link>{" "}
        can verify the result: after MergeByDistance the scaffold passes
        manifold, non-intersecting, and zero-thickness checks — it is directly
        printable at an appropriate scale.
      </p>

      <p>
        The material reads the <code>&quot;edge_sharpness&quot;</code> attribute
        via a <code>Shader Node Attribute</code> node (attribute type{" "}
        <code>GEOMETRY</code>) and pipes its <em>Fac</em> output into a{" "}
        <code>Hue / Saturation / Value</code> node that drives colour
        saturation.  Because <code>StoreNamedAttribute</code> was at EDGE
        domain and <code>CurveToMesh</code> propagates POINT attributes into
        vertex colour on the mesh, the attribute survives all three domain
        transitions (EDGE → SPLINE → POINT → mesh vertex) without an extra
        realise step.  The metallic Principled BSDF at roughness 0.25 gives
        the brushed-steel specular highlight that reads well against dark
        backgrounds in WebXR without Bloom.  For a cel-shaded variant, swap
        to a Diffuse BSDF, add an Emission socket at 15 % weight on the
        border, and pair it with the Grease Pencil Line Art approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-grease-pencil-lineart-toon-outline"
          className={lk}
        >
          toon-outline tutorial
        </Link>{" "}
        to trace the scaffold&apos;s silhouette with a contrasting ink line.
      </p>

      <p>
        <strong>Failure modes and extensions.</strong>{" "}
        If the scaffold renders with no visible thickness variation, check
        that <em>Field on Domain</em>&apos;s output domain property reads{" "}
        <code>POINT</code> — it defaults to <code>FACE</code> in the UI when
        first added to a tree, and the mismatch silently returns 0.0.  If
        tubes intersect each other at sphere vertices (visible as Z-fighting
        cross-sections), reduce MERGE_DIST — the weld may be collapsing tubes
        whose endpoints are not truly coincident.  For non-spherical source
        meshes, beware of open boundary edges: MeshToCurve converts them like
        any other edge, but their dihedral angle is undefined (only one
        adjacent face), so Edge Angle returns 0 and they get THIN_RADIUS tubes
        regardless of their visual role.  Mask them with a{" "}
        <code>Is Face Planar</code> or <code>Is Boundary Edge</code> check and
        route them to a separate SetCurveRadius if you need a different
        treatment.  For exporting individual tubes as separate GLB meshes (useful
        for interactive highlighting in WebXR), wrap the entire chain in a{" "}
        <code>For Each Geometry Element</code> loop over splines — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-for-each-element-hex-panel"
          className={lk}
        >
          For Each tutorial
        </Link>{" "}
        for the pattern.  The{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/mesh_to_curve.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Mesh to Curve
        </a>{" "}
        (CC-BY-SA 4.0, Blender Foundation) documents the Selection socket,
        which lets you restrict conversion to specific edges — combine it with
        an edge-angle threshold to tube only the sharpest creases and leave
        flat faces untouched.  The{" "}
        <a
          href="https://github.com/nortikin/sverchok"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Sverchok add-on
        </a>{" "}
        (MIT, Nikita Gorodetskiy et al.) offers a <em>Bevel Curve</em> node
        that bundles this whole pipeline into one node with preset profiles;
        comparing its output with the manual chain here reveals exactly which
        abstractions it hides — useful when debugging, as the intermediate
        domain states are inaccessible inside Sverchok&apos;s wrappers.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-gn-mesh-to-curve-wireframe-scaffold",
  title:
    "GN Mesh to Curve + Curve to Mesh — Procedural Bevelled Wireframe Scaffold (Blender 5.1)",
  tags: [
    "blender",
    "geometry-nodes",
    "mesh-to-curve",
    "curve-to-mesh",
    "wireframe",
    "field-on-domain",
    "edge-angle",
    "store-named-attribute",
    "set-curve-radius",
    "merge-by-distance",
    "ico-sphere",
    "glb",
    "webxr",
    "python",
    "3d-print",
  ],
  category: "tutorial",
  publishedOn: "2026-06-11",
  summary:
    "Every edge of an icosphere becomes a bevelled tube whose diameter is " +
    "proportional to its dihedral angle — sharp structural edges thick, flat " +
    "seams thin.  The key insight is domain migration: EDGE attributes travel " +
    "to SPLINE domain after Mesh to Curve, and Field on Domain must explicitly " +
    "broadcast them to POINT domain before Set Curve Radius can use them.",
  body: GnMeshToCurveWireframeScaffoldBody,
  libraryPath:
    "blends/geometry-nodes/gn-mesh-to-curve-wireframe-scaffold",
});

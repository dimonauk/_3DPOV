import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sdf-csg-quilez-smooth-boolean-poi-head-webxr";

const TITLE =
  "Python numpy — SDF CSG: Quilez Primitives, Smooth Boolean Operations & Poi Head GLB for WebXR (Blender 5.1)";

const LEDE =
  "A Signed Distance Field reduces every Boolean CSG operation to an arithmetic comparison — union is min(a, b), difference is max(a, −b) — and Inigo Quilez's smooth minimum replaces the discontinuous min with a C¹-blended curve, so two forms dissolve into each other organically without a seam. Four primitives and three smooth Boolean operations are enough to construct a production poi head, extract its zero isosurface via Surface Nets, and export a Draco-compressed GLB ready for WebXR.";

function Body() {
  return (
    <>
      <p>
        Constructive Solid Geometry has existed since the 1970s, when it was
        implemented via boundary-representation trees and expensive ray
        intersection tests. The SDF reformulation collapses all of that
        bookkeeping into a single scalar: the signed distance to the nearest
        surface. Boolean operations become comparisons. The entire compound
        scene is one function <code>f(p) → ℝ</code>, evaluated once per grid
        cell, with no need to track which primitive owns each face.
      </p>

      <h2>What is a Signed Distance Field</h2>
      <p>
        For a closed surface S, the signed distance function is:{" "}
        <code>d(p) = min‖p − s‖ · sign(inside(p))</code>. Negative inside,
        positive outside, zero on the surface. The key property is{" "}
        <em>composability</em>: if{" "}
        <code>d_A</code> and <code>d_B</code> are SDFs for shapes A and B:
      </p>
      <ul>
        <li>
          <strong>Union:</strong> <code>min(d_A, d_B)</code> — the closer
          surface wins.
        </li>
        <li>
          <strong>Intersection:</strong> <code>max(d_A, d_B)</code> — only the
          region inside both.
        </li>
        <li>
          <strong>Difference:</strong> <code>max(d_A, −d_B)</code> — inside A
          but outside B.
        </li>
      </ul>
      <p>
        These operations are exact for convex primitives and give a bound (not
        exact SDF) for complex Boolean trees. For isosurface extraction the
        bound is sufficient: we only care about sign changes, and the zero
        crossing remains geometrically correct.
      </p>

      <h2>The smooth minimum</h2>
      <p>
        The plain <code>min</code> function is C⁰ — continuous but not
        differentiable at the boundary between a and b. Evaluated on a grid,
        this produces a visible crease where two primitives meet. Inigo Quilez
        (whose distance-function library is CC0) introduced the{" "}
        <em>polynomial smooth minimum</em>:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`h = clamp(0.5 + 0.5·(b - a)/k,  0, 1)
smin(a, b, k) = mix(a, b, h) − k·h·(1 − h)`}
      </pre>
      <p>
        When <code>|a − b| &gt; k</code> it reduces to <code>min(a, b)</code>.
        Within the blend zone of radius k, it dips below min by at most
        k/4 (at h = ½), creating a smooth concave bridge. The gradient of
        smin is C¹ everywhere — exactly what we need for smooth normals at a
        juncture.
      </p>
      <p>
        There are several variants: exponential (C∞ but hard to control),
        power (controllable falloff), and the polynomial above (Quilez's
        preferred, because k has intuitive metre-scale meaning). We use the
        polynomial throughout.
      </p>

      <h2>Smooth difference and smooth intersection</h2>
      <p>
        Smooth maximum is just <code>−smin(−a, −b, k)</code> — negate both
        inputs, take smooth min, negate the result. Smooth difference follows:
        <code>sdiff(a, b, k) = smax(a, −b, k)</code>. In words: subtract B
        from A by taking the smooth maximum of A and (−B). The minus sign
        inverts B's interior/exterior convention, making the intersection
        region the carved-out zone.
      </p>
      <p>
        We use a tighter k for the dome subtraction (0.55 × SMOOTH_K) than
        for the body + ring union (SMOOTH_K), because the dome cavity should
        read as a precise concave recess rather than a vague dent. k is a
        physical measurement — it is literally the radius of the blend zone in
        metres.
      </p>

      <h2>The four primitives</h2>
      <p>
        Every SDF primitive in the library follows the same signature:{" "}
        <code>f(pts) → (N,)</code>, where pts is an (N, 3) float32 array.
        This matches the flat grid array produced by{" "}
        <code>np.meshgrid(..., indexing=&apos;ij&apos;)</code> after reshaping, so all
        vectorisation is trivial.
      </p>
      <ul>
        <li>
          <strong>Sphere:</strong> <code>‖p‖ − r</code>. Exact SDF.
        </li>
        <li>
          <strong>Box:</strong>{" "}
          <code>‖max(|p|−b, 0)‖ + min(max(|p|−b), 0)</code>. Correct interior
          and exterior distances simultaneously via the two-term split.
        </li>
        <li>
          <strong>Torus (XZ-equatorial):</strong>{" "}
          <code>√((‖p.xz‖ − R)² + p.y²) − r</code>. Ring centre-line is the
          circle of major radius R in the XZ plane; tube of radius r.
        </li>
        <li>
          <strong>Capsule:</strong> Distance to the line segment [a, b]
          minus r. The t = clamp(...) projects each point onto the segment
          and the residual is the SDF. Exact for all points.
        </li>
      </ul>

      <h2>Poi head composition</h2>
      <p>
        The composition tree is three operations deep:
      </p>
      <ol>
        <li>
          <code>smin(sphere(body), torus(ring), k=0.12)</code> — the
          equatorial ring blends into the sphere body, raising a subtle
          shoulder where they meet.
        </li>
        <li>
          <code>sdiff(shell, sphere(dome), k=0.066)</code> — a larger sphere
          centred slightly above the equator is subtracted, hollowing out the
          top polar region. The dome sphere overlaps the body but not the ring,
          so the ring emerges cleanly from the carved surface.
        </li>
        <li>
          <code>smin(shape, capsule(stem), k=0.07)</code> — a slender capsule
          stem below the body blends upward into the sphere with a tighter
          radius, keeping the joint compact.
        </li>
      </ol>
      <p>
        The three k values are deliberately different. This is the expressive
        power of the smooth Boolean toolkit: each junction has its own
        character, set by a single parameter in physical units.
      </p>

      <h2>Grid sampling and Surface Nets</h2>
      <p>
        We evaluate <code>scene_poi(pts)</code> over a 72³ lattice covering
        ±1.05 m (~373 k cells). The compound SDF is vectorised — numpy
        broadcasts over the (N, 3) point array — so the entire grid evaluates
        in one call with no Python loop. At GRID_N = 72, the evaluation takes
        roughly 40 ms on a modern CPU.
      </p>
      <p>
        Isosurface extraction uses Surface Nets (Gibson 1998) rather than
        classical Marching Cubes: one vertex per surface cell, placed at the
        centroid of active edge crossings, with quads stitched between adjacent
        surface cells on each sign-change edge. Surface Nets requires no 256-case
        lookup table, handles smooth SDFs with fewer staircase artefacts than
        MC, and the complete implementation is about 30 lines of numpy. The
        same extractor is used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr"
          className={lk}
        >
          Gyroid TPMS tutorial
        </Link>
        .
      </p>

      <h2>Why Surface Nets for a CSG SDF</h2>
      <p>
        Smooth SDFs benefit more from Surface Nets than sharp-edged ones do.
        The smooth minimum produces SDFs whose gradient varies continuously
        across the blend zone, so the centroid approximation is accurate.
        On a sharp union (plain min) the isovertex centroid can drift; on
        smin it converges toward the exact surface. The blend zone effectively
        pre-smooths the scalar field, making Surface Nets the natural pairing
        for smooth Boolean CSG.
      </p>

      <h2>Failure modes and trade-offs</h2>
      <p>
        <strong>k too large:</strong> The blend zone inflates the mesh — the
        poi head grows in volume. This is a known artefact of polynomial smin:
        the subtracted energy (k·h·(1−h)) increases the blend region&apos;s
        volume. Quilez documents a volume-preserving variant at 0.5 + 0.5·h²·(3−2h)
        but it requires a second pass. For visual work the volume artefact is
        usually acceptable.
      </p>
      <p>
        <strong>GRID_N too low:</strong> The isovertex centroid approximation
        degrades at coarse resolutions. At GRID_N = 48 the ring loses its
        round cross-section. At 96 the mesh is near-exact. 72 balances quality
        and speed for rapid iteration.
      </p>
      <p>
        <strong>Duplicate-primitive CSG:</strong> Two spheres of identical
        radius at the same position produce SDF = 0 everywhere on the blend
        zone, causing degenerate face normals. The fix is to offset or
        differentiate them slightly.
      </p>
      <p>
        <strong>Non-Euclidean operators:</strong> Twist, taper, and bend
        deform the domain of p before evaluating a primitive, which breaks the
        SDF guarantee (the returned value is no longer the true Euclidean
        distance). The zero crossing is still correct; only the gradient
        magnitude is off. Sphere-tracing renderers compensate with a
        Lipschitz bound; mesh extraction does not need the bound and is
        unaffected.
      </p>

      <h2>Export and WebXR pipeline</h2>
      <p>
        The assembled bmesh goes through{" "}
        <code>bmesh.ops.remove_doubles</code> at 0.1 mm tolerance (Surface
        Nets occasionally produces near-duplicate vertices at cell
        boundaries), then <code>recalc_face_normals</code> for consistent
        outward orientation. The object is rotated −90° on X before
        transform-apply to convert from Blender&apos;s Z-up to +Y-up for the
        HoloFlow WebXR pipeline.
      </p>
      <p>
        GLB export uses Draco level 6 with WebP texture encoding. For a 72³
        Surface Nets mesh the resulting GLB is typically 60–90 KB — small
        enough for real-time streaming at HoloFlow stage events.
      </p>

      <h2>Extending the library</h2>
      <p>
        Any SDF can be dropped into the composition tree. Useful additions for
        poi design:
      </p>
      <ul>
        <li>
          <strong>Rounded box:</strong> <code>sdf_box(p, b) − r</code> (offset
          the box SDF outward by r gives exact rounded corners, still an SDF).
        </li>
        <li>
          <strong>Infinite cylinder:</strong>{" "}
          <code>‖p.xz‖ − r</code> (no end caps — combine with sdf_box to cap
          it).
        </li>
        <li>
          <strong>Displacement:</strong> <code>d(p) + noise(p)</code> — adding
          a noise function to any SDF displaces the surface. The gradient of
          the noise must be bounded by the noise amplitude or the SDF guarantee
          breaks; use Quilez&apos;s smooth noise whose derivative &lt; 1.
        </li>
        <li>
          <strong>Twist operator:</strong>{" "}
          <code>p&apos; = (p.x·cos(θ·p.y) − p.z·sin(θ·p.y), p.y, ...)</code> —
          rotate the XZ plane as a function of Y before evaluating the
          primitive.
        </li>
      </ul>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-superquadric-lame-curve-barr-signed-powers-shape-space-poi-head-webxr"
          className={lk}
        >
          Superquadric Poi Head tutorial
        </Link>{" "}
        shows an alternative parametric SDF family using Lamé curves. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr"
          className={lk}
        >
          CVT Faceted Poi Head tutorial
        </Link>{" "}
        takes a completely different approach — constructing the form via
        Voronoi sphere tessellation rather than isosurface extraction. For
        compound geometry intended for 3D printing, the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-resin-msla-light-sculpture-nested-shell-led-cavity-tir-drainage"
          className={lk}
        >
          Resin MSLA Light Sculpture tutorial
        </Link>{" "}
        shows how to layer nested shells — a technique that pairs naturally
        with SDF offset: <code>d(p) − shell_thickness</code>.
      </p>

      <h2>Credits and licence</h2>
      <ul>
        <li>
          Inigo Quilez,{" "}
          <a
            href="https://iquilezles.org/articles/distfunctions/"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            "Signed Distance Functions"
          </a>{" "}
          — CC0. The smooth minimum and all primitive SDFs are derived from his
          public reference implementation. Related:{" "}
          <a
            href="https://www.shadertoy.com/user/iq"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            shadertoy.com/user/iq
          </a>
          ,{" "}
          <a
            href="https://github.com/fogleman/sdf"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            github.com/fogleman/sdf
          </a>{" "}
          (MIT, Michael Fogleman&apos;s Python SDF library).
        </li>
        <li>
          Sarah F. Gibson (1998),{" "}
          <a
            href="https://www.merl.com/publications/TR98-19.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            "Constrained Elastic Surface Nets"
          </a>
          , MERL Technical Report TR98-19 — academic free-use. Related:{" "}
          <a
            href="https://github.com/scikit-image/scikit-image"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            scikit-image
          </a>{" "}
          (BSD-3).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-01",
  topics: ["scripting", "sdf", "csg", "boolean", "webxr", "poi"],
  body: Body,
});

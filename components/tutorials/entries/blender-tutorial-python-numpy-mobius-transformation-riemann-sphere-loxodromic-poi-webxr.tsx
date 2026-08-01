import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr";

const TITLE =
  "Python numpy — Möbius Transformation Gallery: PSL(2,ℂ) Conformal Maps, Loxodromic Spirals & Animated Light Sphere for WebXR (Blender 5.1)";

const LEDE =
  "Every Möbius transformation f(w) = (aw+b)/(cw+d) belongs to exactly one of four conjugacy classes in PSL(2,ℂ): elliptic rotations, hyperbolic scalings, parabolic drifts, and the loxodromic case that combines rotation with scaling — producing logarithmic spirals on the Riemann sphere that look exactly like the path a poi light traces on the sphere of its reachable positions during a corkscrew spin. This blueprint projects a UV-sphere through stereographic coordinates, applies the one-parameter loxodromic family f_t(w)=λ^t·w as shape keys, and generates 72 emissive NURBS spiral tubes for WebXR export.";

function Body() {
  return (
    <>
      <p>
        The Riemann sphere is not just a metaphor — it is the unique compact
        complex manifold of genus zero, and the Möbius group PSL(2,ℂ) is its
        full holomorphic automorphism group. When you set a poi spinning in a
        corkscrew pattern — leaning slightly while spinning — the head traces
        exactly the orbit of a loxodromic transformation on the sphere of its
        reachable positions.
      </p>

      <h2>Stereographic projection</h2>
      <p>
        The stereographic map from the north pole N = (0, 0, 1) sends any point
        (x, y, z) ∈ S² \ &#123;N&#125; to the complex number:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`w(x, y, z) = (x + iy) / (1 − z)`}
      </pre>
      <p>
        The south pole maps to 0, the equator maps to the unit circle |w| = 1,
        and the north pole maps to ∞ (the point at infinity that completes
        ℂ∪&#123;∞&#125; into the Riemann sphere). The inverse is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`x = 2u / (|w|²+1)
y = 2v / (|w|²+1)
z = (|w|²−1) / (|w|²+1)`}
      </pre>
      <p>
        This is a conformal map: it preserves angles (but not distances). Circles
        and lines in ℂ correspond to circles on S². Any Möbius transformation,
        which maps circles/lines to circles/lines in ℂ, therefore maps circles on
        S² to circles on S².
      </p>

      <h2>The four conjugacy classes</h2>
      <p>
        Every element of PSL(2,ℂ) is determined up to conjugacy by its
        trace-squared tr(M)², where M ∈ SL(2,ℂ) is any lift. The four
        qualitatively distinct cases are:
      </p>
      <ul>
        <li>
          <strong>Elliptic (tr² ∈ [0, 4) real):</strong> Two fixed points that
          are complex conjugates of each other on the Riemann sphere; orbits are
          circles of latitude around the axis through the two fixed points. Pure
          rotation — the classical rotation group SO(3) ≅ PSU(2) lives here.
        </li>
        <li>
          <strong>Hyperbolic (tr² ∈ (4, ∞) real):</strong> Two real fixed
          points; orbits are geodesic arcs between them. Pure scaling: points
          drift from one fixed point to the other exponentially.
        </li>
        <li>
          <strong>Parabolic (tr² = 4):</strong> Exactly one fixed point (a
          degenerate double root). Orbits are horocycles — circles internally
          tangent to S² at the fixed point. The analogue of a pure translation
          on the complex plane.
        </li>
        <li>
          <strong>Loxodromic (tr² ∈ ℂ \ [0, ∞)):</strong> Two real fixed
          points; orbits are logarithmic spirals connecting them. A combination
          of hyperbolic drift and elliptic rotation — the generic case.
        </li>
      </ul>

      <h2>The loxodromic one-parameter family</h2>
      <p>
        Fix the poles as the two fixed points by choosing the simplest loxodromic
        family: f_t(w) = λ^t · w, where λ = exp(log_r + i·α), log_r &gt; 0, α ≠ 0.
        In polar coordinates on ℂ:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`|f_t(w)| = e^{log_r · t} · |w|   (radius drifts exponentially)
arg(f_t(w)) = α · t + arg(w)      (angle advances linearly)`}
      </pre>
      <p>
        An orbit starting at w₀ = e^(iϕ₀) (equator, |w₀| = 1) satisfies:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`w(t) = e^{(log_r + iα)t} · e^{iϕ₀}
     = e^{log_r · t} · e^{i(ϕ₀ + αt)}`}
      </pre>
      <p>
        The colatitude on S² satisfies tan(φ/2) = |w(t)| = e^(log_r · t): when
        log_r &gt; 0, φ → 0 (north pole) as t → +∞ and φ → π (south pole) as
        t → −∞. Meanwhile the longitude advances at α radians per unit t. Together
        this is a logarithmic spiral winding from south to north pole.
      </p>

      <h2>Python implementation</h2>
      <p>
        The blueprint follows the{" "}
        <strong>split-operator pattern</strong>: separate functions for the
        forward and inverse stereographic maps, and a self-contained{" "}
        <code>loxo_apply</code> that multiplies complex numbers via 2×2 real
        arithmetic rather than Python&apos;s{" "}
        <code>complex</code> type — so numpy vectorisation over all N_ORBITS×T_STEPS
        points in one call costs the same as one loop iteration would.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`def loxo_apply(u, v, t, log_r=LOG_R, alpha=ALPHA):
    scale  = math.exp(log_r * t)
    cos_a, sin_a = math.cos(alpha * t), math.sin(alpha * t)
    # Complex multiply: (scale·e^{iαt}) · (u + iv)
    u2 = scale * (cos_a * u - sin_a * v)
    v2 = scale * (cos_a * v + sin_a * u)
    return u2, v2`}
      </pre>
      <p>
        For the sphere shape keys, the inverse stereographic result is
        renormalised back to unit length before writing — a numeric safeguard,
        since Möbius maps preserve S² exactly but floating-point arithmetic
        accumulates a small radial error:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`sph = stereo_inv(u2, v2)
new_pts[valid] = sph / np.linalg.norm(sph, axis=1, keepdims=True)`}
      </pre>

      <h2>NURBS orbit curves</h2>
      <p>
        Each of the 72 orbits is a NURBS-4 (cubic) open spline with
        T_STEPS = 64 control points. NURBS rather than BEZIER avoids the
        tangent-handle bookkeeping that would be needed for a smooth fit to the
        spiral arc; NURBS order-4 gives C² continuity at every interior knot.
        The <code>use_endpoint_u = True</code> flag forces the spline to pass
        through its first and last control points exactly, so the tubes visually
        terminate at the pole-guard boundary rather than overshooting.
      </p>
      <p>
        Every 8th orbit gets a thicker bevel radius (BEVEL_THICK = 0.008 m vs
        BEVEL_DIM = 0.0035 m) to create a visual hierarchy: 9 guide spirals at
        full weight, the remaining 63 at a finer gauge. This reads at a glance
        as a structural grid without the individual spirals being hard to count.
      </p>

      <h2>Colour and material</h2>
      <p>
        Orbit hue = k / N_ORBITS, sweeping the full HSV spectrum
        (violet → red → orange → yellow → … → violet) around the sphere. The
        emissive strength of 4.5 saturates EEVEE Next&apos;s bloom threshold, so
        each tube glows into its neighbours when BLOOM radius is 3.5–4.0.
        Together the 72 emissive tubes read as a continuous spectrum wound
        around the sphere — analogous to a full-spectrum poi performance filmed
        in long-exposure.
      </p>

      <h2>Poi performance connection</h2>
      <p>
        In real poi spinning, the head traces a path on the sphere of its
        reachable positions (radius = arm + cord length, centred on the
        shoulder). A pure horizontal spin traces the equator. A vertical
        plane-change tilts the axis elliptically. A corkscrew —
        simultaneously spinning and tilting the plane — traces a loxodromic
        orbit: the plane leans while the poi rotates, so the head spirals from
        the current plane toward a perpendicular one. The exact winding angle
        per revolution is the ratio α / log_r in the blueprint&apos;s parameters.
      </p>

      <h2>WebXR export</h2>
      <p>
        The Draco-6 GLB contains the glass sphere (as a UV-sphere mesh with
        three shape keys), the 72 NURBS tubes converted to polygon meshes via{" "}
        <code>export_apply=True</code>, and all emissive materials. In WebXR the
        shape key animation plays via the GLB&apos;s <code>KHR_animation_pointer</code>{" "}
        extension (if exported with shape-key animation frames), or the shape keys
        can be driven from a JavaScript weight lerp targeting{" "}
        <code>morphTargetInfluences</code> in Three.js / Babylon.js.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Curves missing from GLB:</strong>{" "}
          <code>export_apply=True</code> must be set; bevel curves are not
          exported as curves but as realised meshes.
        </li>
        <li>
          <strong>Shape keys not in GLB:</strong> Export with{" "}
          <code>export_morph=True</code> (default true in Blender 5.1). Confirm
          the sphere object is selected or use <code>export_selected=False</code>.
        </li>
        <li>
          <strong>North/south pole gaps:</strong> Increase POLE_GUARD (e.g. 0.99)
          to let orbits closer to the poles — but very small denominators in the
          stereographic formula will amplify numerical error.
        </li>
        <li>
          <strong>Bloom not visible in viewport:</strong>{" "}
          Switch to Rendered shading (Numpad 0 → Material Preview uses EEVEE but
          may not run full post-processing). Use View → Viewport Render to
          preview bloom.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <p>Related studio tutorials and resources:</p>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr" className={lk}>
            Hopf Fibration: S³→S² Clifford Parallels
          </Link>{" "}
          — another sphere-to-sphere bundle, different group structure (U(1) vs PSL(2,ℂ))
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr" className={lk}>
            Torus Knot T(p,q): Parallel-Transport Tube
          </Link>{" "}
          — knot complement and monodromy, topological companion to these orbits
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr" className={lk}>
            Möbius Strip N-Twist: Non-Orientable Surface
          </Link>{" "}
          — shares the Möbius name but is the strip (band), not the PSL(2,ℂ) transformation
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr" className={lk}>
            600-Cell: Quaternion Binary Icosahedral Stereographic Shadow
          </Link>{" "}
          — stereographic projection from S³, related technique to the S²→ℂ used here
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Henri Poincaré (1882){" "}
          <a href="https://archive.org/details/actamathematica01stockholmgoog" className={lk} target="_blank" rel="noopener noreferrer">
            Théorie des groupes fuchsiens
          </a>{" "}
          — the founding paper on Möbius groups and Kleinian groups; Public Domain.
          Related:{" "}
          <a href="https://en.wikipedia.org/wiki/Möbius_transformation" className={lk} target="_blank" rel="noopener noreferrer">
            Wikipedia: Möbius transformation
          </a>
        </li>
        <li>
          Mumford, Series &amp; Wright (2002){" "}
          <a href="https://archive.org/details/indraspearlsthev0000mumf" className={lk} target="_blank" rel="noopener noreferrer">
            Indra&apos;s Pearls: The Vision of Felix Klein
          </a>{" "}
          — the canonical illustrated guide to Kleinian limit sets, PSL(2,ℂ) orbit
          visualisation, and the loxodromic / Schottky group constructions. CC0
          preview via Internet Archive. Related:{" "}
          <a href="https://github.com/jfb3615/ACP-Examples" className={lk} target="_blank" rel="noopener noreferrer">
            ACP-Examples (MIT)
          </a>
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
  topics: ["blender", "python", "scripting", "mathematics", "webxr", "poi"],
  body: Body,
  library: {
    type: "blend + glb",
    topic: "scripting",
    path: `blends/scripting/${SLUG}/`,
    blenderVersion: "5.1",
  },
});

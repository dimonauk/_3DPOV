import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        In 1931 Heinz Hopf asked a deceptively simple question: are all
        continuous maps from S³ to S² topologically equivalent to a constant
        map?  The answer is no, and the counter-example he constructed — the
        Hopf fibration — became one of the landmark results of twentieth-century
        topology.  The fibration partitions the 3-sphere S³ into pairwise-linked
        circles called <em>fibres</em>.  Every pair of distinct fibres links
        exactly once.  No fibre touches any other.  The linking is not a
        geometric accident but a topological invariant that cannot be undone by
        any continuous deformation short of tearing.
      </p>
      <p>
        Stereographic projection collapses S³ into ordinary ℝ³, where each
        fibre lands as a Villarceau circle on a nested torus.  The whole
        sculpture is a family of glowing rings — coloured by latitude band on
        the base sphere — that pass through one another in every direction
        simultaneously.  Rendered in EEVEE Next with Bloom, the result reads
        exactly as the light-painting equivalent of that topological
        entanglement: rings mid-pass, frozen at maximum interlace.
      </p>

      <h2>The Hopf fibration: what it actually is</h2>
      <p>
        Think of the 3-sphere S³ as the set of unit quaternions — all
        (a, b, c, d) ∈ ℝ⁴ with a² + b² + c² + d² = 1.  The Hopf map
        h: S³ → S² is defined by:
      </p>
      <pre>{`h(a, b, c, d) = ( 2(ac + bd),   2(bc − ad),   a² + b² − c² − d² )`}</pre>
      <p>
        Verify it lands on S²: the three components have sum of squares equal
        to 1 for any unit quaternion.  The key property is that h is the
        projection of a <em>principal circle bundle</em>: S³ is a U(1)-bundle
        over S², meaning the fibre of every point is a circle on which the
        group U(1) acts freely by right-multiplication.
      </p>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting"
          className={lk}
        >
          Spring-Pendulum Poi Lissajous tutorial
        </Link>{" "}
        — that system traces curves in ℝ³ by integrating ODEs in time.  The
        Hopf fibration produces its curves by algebra alone, with no time
        integration at all: each circle is an analytic closed-form object
        determined entirely by its base point on S².
      </p>

      <h2>Lifting a base point: the section</h2>
      <p>
        To compute the fibre over a given p = (p₁, p₂, p₃) ∈ S², choose one
        point q₀ on the fibre — the <em>section</em> — then sweep it through
        the whole U(1) orbit to trace the circle.
      </p>
      <p>
        A clean section that avoids the south-pole singularity:
      </p>
      <pre>{`denom = √(2(1 + p₃))

q₀ = ( √((1 + p₃)/2),   −p₂ / denom,   p₁ / denom,   0 )

Special case p₃ = −1:   q₀ = (0, 0, 0, 1)`}</pre>
      <p>
        This is the <em>Hopf section</em> — a smooth map S² \ {"{south}"} → S³
        that picks one quaternion per base point.  It exists globally minus the
        south pole precisely because the bundle is non-trivial: a global
        section everywhere would imply S³ ≅ S² × S¹, which is false.
      </p>

      <h2>Tracing the fibre: right-multiplication by U(1)</h2>
      <p>
        Once q₀ is in hand, the full fibre is the orbit of q₀ under
        right-multiplication by{" "}
        <code>e&#8309;&#8305;&#945; = (cos α, sin α, 0, 0)</code> as α sweeps
        [0, 2π):
      </p>
      <pre>{`q(α) = q₀ · (cos α, sin α, 0, 0)

Expanding quaternion product for q₀ = (a₀, b₀, c₀, d₀):
  q(α) = ( a₀ cos α − b₀ sin α,
            a₀ sin α + b₀ cos α,
            c₀ cos α − d₀ sin α,
            c₀ sin α + d₀ cos α )`}</pre>
      <p>
        This is a circle: fixed q₀, it traces a great circle on S³ as α
        advances.  Every such great circle is a Hopf fibre.
      </p>

      <h2>Stereographic projection: entering ℝ³</h2>
      <p>
        Stereographic projection from the north pole N = (1, 0, 0, 0) maps
        S³ \ {"{N}"} bijectively to ℝ³:
      </p>
      <pre>{`π(a, b, c, d) = SCALE · ( b/(1−a),   c/(1−a),   d/(1−a) )`}</pre>
      <p>
        Why SCALE?  The raw projection places the south pole at the origin
        and stretches fibres near the north pole to near-infinity.  Multiplying
        by a constant simply sets the overall sculpture radius — the{" "}
        <code>SCALE = 1.8</code> default gives a comfortable 1.8 BU radius.
      </p>
      <p>
        The image of each fibre under π is a Villarceau circle — one of the
        two families of circles you can cut from a torus at a specific oblique
        angle.  The latitude band φ on S² controls which torus the fibre lands
        on: φ ≈ π/2 (equatorial base points) gives fibres near the unit-radius
        torus; φ → 0 or π (polar base points) gives fibres that approach
        straight lines (the stereographic image of Hopf fibres near the north
        and south poles of S²).
      </p>

      <h2>Blueprint walkthrough</h2>
      <h3>Constants</h3>
      <pre>{`PHI_COUNT   = 6     # latitude bands (φ ∈ (0, π), excluding poles)
PSI_COUNT   = 12    # fibres per band  → 72 curves total
FIBRE_STEPS = 96    # polyline points per closed circle
BEVEL_DEPTH = 0.018 # tube radius
SCALE       = 1.8
EMISSION_STR= 10.0`}</pre>
      <p>
        Six latitude bands at 12 fibres each gives 72 glowing tubes.  Increasing{" "}
        <code>PSI_COUNT</code> fills in the torus surfaces more densely;
        increasing <code>PHI_COUNT</code> adds more nested tori.
      </p>

      <h3>Core functions</h3>
      <pre>{`def _hopf_section(p1, p2, p3):
    if p3 > -1.0 + 1e-10:
        denom = math.sqrt(2.0 * (1.0 + p3))
        return (math.sqrt(0.5 * (1.0 + p3)), -p2 / denom, p1 / denom, 0.0)
    return (0.0, 0.0, 0.0, 1.0)   # south pole

def _phase_mul(q0, alpha):
    a0, b0, c0, d0 = q0
    ca, sa = math.cos(alpha), math.sin(alpha)
    return (a0*ca - b0*sa,  a0*sa + b0*ca,
            c0*ca - d0*sa,  c0*sa + d0*ca)

def _stereo(q):
    a, b, c, d = q
    denom = 1.0 - a
    if abs(denom) < 1e-12:
        return None          # skip near north pole
    s = SCALE / denom
    return (b * s, c * s, d * s)`}</pre>
      <p>
        <strong>Why plain Python tuples, not `mathutils.Quaternion`?</strong>{" "}
        The <code>mathutils.Quaternion</code> type stores components as{" "}
        <code>(w, x, y, z)</code>, which matches convention, but right-
        multiplication <code>q @ e_alpha</code> would work fine too.  Plain
        tuples avoid an import dependency and are marginally faster in the
        hot loop where we compute 72 × 96 = 6,912 quaternion products.
      </p>

      <h3>Curve construction</h3>
      <p>
        Each fibre becomes a <em>POLY</em> curve — the simplest Blender curve
        type, which just connects dots with straight segments.  With 96 points
        on a circle the straight-segment approximation is invisible at normal
        viewing distance.  The <code>use_cyclic_u = True</code> flag closes
        the loop:
      </p>
      <pre>{`curve_data = bpy.data.curves.new(name, type="CURVE")
curve_data.bevel_depth      = BEVEL_DEPTH
spline = curve_data.splines.new("POLY")
spline.use_cyclic_u = True
spline.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    spline.points[i].co = (x, y, z, 1.0)  # W=1 for POLY`}</pre>
      <p>
        Compare this approach with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr"
          className={lk}
        >
          Points to Curves Poi Trail tutorial
        </Link>{" "}
        — that tutorial creates curves from a Geometry Nodes node tree applied
        to a point cloud, while here we write directly into{" "}
        <code>bpy.data.curves</code> for full parameter control without any
        modifier stack overhead.
      </p>

      <h3>Colour: HSV by latitude band</h3>
      <pre>{`hue = (phi_idx - 1) / max(PHI_COUNT - 1, 1)  # 0 (red) → 1 (violet)
mat = _emission_mat(f"HopfMat_{phi_idx:02d}", hue)`}</pre>
      <p>
        The outermost torus (equatorial fibres, φ ≈ π/2) receives a mid-hue
        (green); polar tori approach red and violet.  Each latitude band shares
        one material — 72 objects but only 6 materials.  Pure emission with
        Transparent BSDF mix at 90% opacity lets the Bloom bleed through
        overlapping rings without covering them completely.
      </p>

      <h3>Failure modes</h3>
      <p>
        <strong>North-pole divergence.</strong>  When a fibre base point is
        exactly p₃ = 1 (north pole of S²), the section formula produces
        q₀ = (1, 0, 0, 0), and the first stereographic projection attempt
        lands on <code>denom = 1 − 1 = 0</code>.  The{" "}
        <code>if abs(denom) &lt; 1e-12: return None</code> guard skips these
        points.  Because <code>FIBRE_STEPS</code> distributes α uniformly,
        only one or two points out of 96 are ever skipped — imperceptible in
        the finished curve.
      </p>
      <p>
        <strong>South-pole section singularity.</strong>  The section formula
        <code>denom = √(2(1 + p₃))</code> approaches zero as p₃ → −1.
        The explicit special case
        <code>(0, 0, 0, 1)</code> handles this exactly.  In practice the
        loop&apos;s φ sampling excludes the poles (phi_idx runs 1 to PHI_COUNT
        inclusive, bounded by <code>π * phi_idx / (PHI_COUNT + 1)</code> which
        never reaches 0 or π), so the special case is only exercised if you
        manually add a south-pole base point.
      </p>
      <p>
        <strong>EEVEE Bloom on curve bevels.</strong>  Bloom in EEVEE Next
        requires the rendered object to emit above the <code>bloom_threshold</code>.
        The emission strength of 10.0 comfortably exceeds the default threshold
        of 0.8.  If Bloom seems absent, check{" "}
        <code>scene.eevee.use_bloom = True</code> and that the viewport shading
        is set to <strong>Rendered</strong>, not Material Preview (Material
        Preview uses its own simplified shading that ignores Bloom settings).
      </p>

      <h2>GLB export for WebXR</h2>
      <p>
        The 72 curve objects export cleanly as glTF meshes when you enable{" "}
        <strong>Apply Modifiers</strong> in the exporter.  Blender internally
        converts curve bevels to mesh at export time; the resulting triangle
        count per tube is approximately{" "}
        <code>FIBRE_STEPS × BEVEL_RESOLUTION × 2</code> ≈ 576 triangles per
        fibre, 41,472 total — perfectly comfortable for WebXR.
      </p>
      <p>
        Emission materials that use the Transparent BSDF mix export with{" "}
        <code>alphaMode: BLEND</code> in glTF — the three.js WebXR runtime
        handles the blend order transparently (pun intended).  Check the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          Batch GLB Exporter tutorial
        </Link>{" "}
        for scripting the export step to run automatically after{" "}
        <code>build()</code>.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>
            <a
              href="https://github.com/niles-johnson/Hopf"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              niles-johnson/Hopf
            </a>
          </strong>{" "}
          — Niles Johnson · MIT licence · Mathematical visualisation reference
          for Hopf fibration geometry.  Related:{" "}
          <a
            href="https://nilesjohnson.net/hopf.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            nilesjohnson.net/hopf
          </a>
          .
        </li>
        <li>
          <strong>
            <a
              href="https://www.dimensions-math.org/"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Dimensions (documentary)
            </a>
          </strong>{" "}
          — Étienne Ghys, Jos Leys, Aurélien Alvarez · CC-BY-SA-3.0 · Chapters
          7–8 show the Hopf fibration animated in stereographic projection.
          Related:{" "}
          <a
            href="https://www.josleys.com/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            josleys.com
          </a>
          .
        </li>
      </ul>
      <p>
        For the N-body and chaos-system techniques that produced this studio&apos;s
        earlier light-sculpture series, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nbody-gravity-star-cluster-leapfrog-light-painting"
          className={lk}
        >
          N-Body Gravity tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting"
          className={lk}
        >
          Lorenz Attractor tutorial
        </Link>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-hopf-fibration-linked-tori-light-sculpture-webxr",
  title:
    "Python mathutils — Hopf Fibration: Stereographic S³ Fibres as Linked-Torus Light Sculpture for WebXR (Blender 5.1)",
  libraryPath:
    "blends/scripting/python-hopf-fibration-linked-tori-light-sculpture-webxr",
  publishedAt: "2026-07-24",
  tags: ["blender", "python", "scripting", "topology", "light-sculpture", "webxr"],
  body: Body,
});

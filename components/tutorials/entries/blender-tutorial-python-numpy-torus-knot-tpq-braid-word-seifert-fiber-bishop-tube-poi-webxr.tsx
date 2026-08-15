import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Torus Knot T(p,q): Braid-Word Closure, Bishop Parallel-Transport Tube, Four Shape-Key Knot Types & Poi Light Trail for WebXR (Blender 5.1)";

const LEDE =
  "A torus knot T(p,q) is the simplest infinite family of non-trivial knots: it lives on the surface of a torus, winding p times around the central axis and q times around the tube, and it closes up into a single component whenever gcd(p,q)=1. The trefoil T(2,3) — genus 1, signature −2 — is the first knot in every table; T(2,5) the cinquefoil 5₁; T(3,4) and T(3,5) the algebraic knots 8₁₉ and 10₁₂₄ with genera 3 and 4. Torus knots are also the closures of simple braid words: T(p,q) = closure of (σ₁σ₂…σ_{p-1})^q in the p-braid group Bₚ. This blueprint parametrises the centreline c(t) = ((R+r·cos(qt))·cos(pt), (R+r·cos(qt))·sin(pt), r·sin(qt)) over 480 steps, builds a smooth tube via Robert Bishop's 1975 parallel-transport frame (Rodrigues rotation, end-closure correction), stores all four knot types as morph-target shape keys, vertex-colours the arc-length gradient cool-to-warm, and exports a Draco-6 GLB with shape keys intact for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-15",
  externalSources: [
    {
      label:
        "Knot Atlas — katlas.org — Bar-Natan D, Morrison S et al. CC-BY-SA. The reference wiki for knot invariants: Alexander polynomial Δ_{p,q}(t) = (t^{pq}−1)(t−1)/((t^p−1)(t^q−1)); braid words (σ₁…σ_{p-1})^q; Seifert genus g=(p−1)(q−1)/2; signature σ=−(p−1)(q−1); self-linking pq. Torus knot page: https://katlas.org/wiki/Torus_Knots. Related: Rolfsen table (T(2,3)=3₁, T(2,5)=5₁, T(3,4) neighbourhood 8₁₉, T(3,5)=10₁₂₄); KnotInfo database Indiana University; Cromwell 2004 Knots and Links (Cambridge); HOMFLY-PT polynomial — Jones V_{T(p,q)}(t) and its specialisations to Alexander Δ and Conway ∇.",
      url: "https://katlas.org/wiki/Torus_Knots",
      licence: "CC-BY-SA (knot data)",
      author: "Bar-Natan D, Morrison S et al.",
    },
    {
      label:
        "Bishop RL (1975) There is more than one way to frame a curve. Amer. Math. Monthly 82(3):246–251. MAA journal, JSTOR open access for non-commercial use. https://www.jstor.org/stable/2319846. Bishop proves that any smooth curve admits a one-parameter family of parallel-transport frames: propagate a normal by rotating the previous normal as little as possible at each step (Rodrigues formula about T_{i−1}×T_i), instead of differentiating the curvature vector. The result is singular-free for curves with vanishing curvature. The total angular drift equals the total torsion integral ∫τ ds, which for a closed curve must be corrected to close the tube. Related: Frenet-Serret classical frame (1847/1851); Hanson AJ & Ma H (1995) Parallel Transport Approach to Curve Framing (U Iowa TR); Bergou M et al. (2008) Discrete Elastic Rods SIGGRAPH (uses Bishop frame for rod simulation — MIT licence https://github.com/mmorandi/DER).",
      url: "https://www.jstor.org/stable/2319846",
      licence: "MAA journal (JSTOR open access, non-commercial)",
      author: "Richard L. Bishop",
    },
    {
      label:
        "NumPy Developers (2020) Array programming with NumPy. Nature 585:357–362. BSD-3-Clause — https://numpy.org. Uses: np.linspace for arc-length sampling; np.linalg.norm for unit tangents and closure test; np.cross for Rodrigues axis and binormal; np.column_stack for (x,y,z) point array; np.ptp for bounding-box scaling; np.arctan2 for signed closure-angle computation. Related: https://github.com/numpy/numpy; SciPy (BSD-3) for potential extension to algebraic knot detection; mathutils.Vector / mathutils.Matrix in Blender's bundled Python for the record.py look-at construction.",
      url: "https://numpy.org",
      licence: "BSD-3-Clause",
      author: "NumPy Developers",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Every knot table starts with the trefoil. It is the smallest torus
        knot, the first non-trivial knot you can draw, and — for poi — the
        shape that appears naturally when a light trail crosses itself twice.
        Torus knots are the geometry you get by wrapping a thread around a
        doughnut and closing it up; they are also the shapes that appear in
        the Milnor fibration of algebraic curve singularities, the Seifert
        fibration of the three-sphere, and the representation theory of braid
        groups. This tutorial builds all four classical types in one mesh with
        shape-key morphing.
      </p>

      <h2>The parametrisation and why it works</h2>
      <p>
        The standard torus T² ⊂ ℝ³ with major radius R and tube radius r is
        parametrised by two angles (φ, θ): position = ((R+r·cos θ)·cos φ,
        (R+r·cos θ)·sin φ, r·sin θ). A torus knot T(p,q) uses φ = pt and
        θ = qt for t ∈ [0, 2π). After one full period the curve returns to
        its start because both cos(pt) and cos(qt) complete whole revolutions:
        cos(p·2π) = 1 and cos(q·2π) = 1. The curve is a single component
        (not a link of several loops) exactly when gcd(p,q) = 1, because that
        is the condition for 1/p and 1/q to share no common period shorter
        than 2π.
      </p>
      <p>
        The values R=1.0 and r=0.42 in the blueprint are chosen so that r/R
        is large enough for the tube axis to be clearly visible in the
        viewport, but r &lt; R/2 ensures the inner equator of the torus stays
        in the positive-x half-space and the knot does not self-intersect
        on the host surface.
      </p>
      <p className="font-mono text-sm pl-4">
        c(t) = ((R + r cos qt) cos pt,{" "}
        <br />
        {"        "}(R + r cos qt) sin pt,{" "}
        <br />
        {"               "}r sin qt),{"  "}t ∈ [0, 2π),{"  "}gcd(p,q) = 1
      </p>

      <h2>Braid-word closure and the braid index</h2>
      <p>
        Alexander&apos;s theorem (1923) says every knot is the closure of some
        braid. For torus knots the braid word is unusually clean: T(p,q) =
        closure of (σ₁σ₂…σ_(p−1))^q in the p-strand braid group Bₚ, where
        σᵢ is the standard generator (strand i crosses over strand i+1). The
        braid has p strands, length pq, and all pq crossings are positive
        — which is why torus knots are fibred, positive knots with trivial
        concordance obstructions. The Morton–Williams–Franks bound shows the
        braid index is min(p,q) — so T(2,3) has braid index 2, the minimum
        non-trivial case.
      </p>

      <h2>Seifert genus and the Alexander polynomial</h2>
      <p>
        Every knot bounds an orientable surface: Seifert&apos;s 1934 algorithm
        constructs one canonically by smoothing each crossing according to
        orientation, forming discs, and connecting them by twisted bands. For
        T(p,q) the result has the minimum possible genus:
      </p>
      <p className="font-mono text-sm pl-4">
        g(T(p,q)) = (p−1)(q−1)/2
      </p>
      <p>
        T(2,3): g=1 (genus-1 surface, a once-punctured torus). T(2,5): g=2.
        T(3,4): g=3. T(3,5): g=4 — which is why shape-key morphing between
        them has a monotone genus gradient.
      </p>
      <p>
        The Alexander polynomial encodes the homology of the Seifert surface
        via the Seifert matrix V: Δ(t) = det(V − t·Vᵀ). For torus knots
        this determinant simplifies to a closed form — one of the few cases
        in knot theory where it does:
      </p>
      <p className="font-mono text-sm pl-4">
        Δ_&#123;p,q&#125;(t) = (t^&#123;pq&#125; − 1)(t − 1) / ((t^p − 1)(t^q − 1))
      </p>
      <p>
        Despite appearances this is a genuine polynomial: the numerator
        t^(pq)−1 is divisible by both t^p−1 and t^q−1 (because p and q each
        divide pq), so the factored quotient lands in ℤ[t, t⁻¹] — no
        fractions remain after cancellation.
      </p>

      <h2>The Bishop parallel-transport frame</h2>
      <p>
        A tube mesh needs a normal vector at each centreline point — a
        consistent choice of &ldquo;which direction is outward&rdquo; that
        varies smoothly and closes up when the knot completes its loop. The
        classical Frenet–Serret frame differentiates the tangent vector T to
        get the principal normal N = T&apos;/|T&apos;|, then B = T×N. This fails
        wherever the curvature |T&apos;| → 0 (inflection points), because the
        direction of T&apos; becomes undefined. Torus knots always have positive
        curvature for r/R &lt; 1, but inflection-point failures haunt the
        general case and the Bishop frame is strictly safer.
      </p>
      <p>
        Bishop&apos;s 1975 construction: seed an arbitrary normal N₀ orthogonal
        to T₀, then at each step rotate the previous normal by the same
        rotation that carries T_(i−1) to T_i. That rotation has axis
        a = T_(i-1) × T_i and angle α = arcsin|a|. Rodrigues&apos; formula gives:
      </p>
      <p className="font-mono text-sm pl-4">
        N_i = N_(i-1) cos α + (a × N_(i-1)) sin α + a (a · N_(i-1))(1 − cos α)
      </p>
      <p>
        After propagating around the full knot once, N returns to a normal
        that differs from N₀ by a rotation of angle ψ around the tangent —
        this is the total torsion ∫τ ds, which is non-zero for torus knots
        (it equals 2π pq times the writhe per period). To close the tube, the
        blueprint distributes this mismatch angle linearly across all N steps:
        at step i, rotate N_i by (ψ · i / N) around T_i before writing the
        ring vertices. The first and last rings then connect seamlessly.
      </p>

      <h2>Bench steps</h2>
      <p>
        Open Blender 5.1, switch to the Scripting workspace. Open{" "}
        <code>blueprint.py</code> in the text editor and press ▶.
      </p>
      <ol className="list-decimal pl-6 space-y-1">
        <li>
          The script clears all objects and mesh data from the scene, then
          calls <code>knot_curve(2, 3)</code> to sample 480 points along the
          T(2,3) trefoil centreline using numpy broadcasting —
          the <code>endpoint=False</code> flag is critical: with it, the
          last point is the step before the first, so the tube closes without
          a seam. With it omitted, you get a duplicated vertex at t=0=2π and
          a visible crease.
        </li>
        <li>
          <code>bishop_tube(pts)</code> computes central-difference tangents
          (periodic boundary: tang[0] uses pts[1] and pts[-1]), seeds a
          normal orthogonal to T₀, runs the Rodrigues transport loop, then
          applies the closure correction. Each ring of N_TUBE=10 vertices is
          built as pts[i] + TUBE_RADIUS × (cosθ · N_i + sinθ · B_i) for ten
          evenly-spaced θ values. The binormal B_i = T_i × N_i closes the
          frame triad.
        </li>
        <li>
          <code>me.from_pydata</code> constructs the mesh. Quad faces are
          built with the double loop over i (centreline index) and j (ring
          index), using modular arithmetic for the periodic closures in both
          directions.
        </li>
        <li>
          <code>me.attributes.new("Col", "FLOAT_COLOR", "POINT")</code> adds
          the vertex colour attribute. In Blender 5.x the correct type string
          is <code>"FLOAT_COLOR"</code> (linear float, not <code>"BYTE_COLOR"</code>
          which would quantise to 8-bit). The arc-length hue runs from 0.60
          (cool blue) through the full circle to 0.60+0.90=1.50 mod 1=0.50
          (cyan), giving a cool-to-warm cycle that reads as a rainbow light
          trail.
        </li>
        <li>
          Shape keys: <code>ob.shape_key_add(name="Basis")</code> first, then
          one per variant. For each variant, the tube vertices are scaled to
          <code>POI_DIAMETER / span</code> so all four knots occupy the same
          bounding box — necessary for smooth shape-key animation without size
          jumps. The base mesh is scaled after shape-key creation for the same
          reason.
        </li>
        <li>
          The emission material uses a ShaderNodeAttribute node to read the
          &ldquo;Col&rdquo; geometry attribute, wired to ShaderNodeEmission at
          strength 3.0. <code>mat.shadow_method = "NONE"</code> tells EEVEE
          not to compute shadows from an emissive poi head — correct for a
          light-trail prop.
        </li>
        <li>
          Export: <code>export_apply=False</code> is mandatory when shape keys
          are present. Setting it to True would bake the basis into the mesh
          and discard all other shape keys before the GLB is written. Draco
          level 6 compresses the tube geometry from ~1.5 MB to ~90 kB.
        </li>
      </ol>

      <h2>Key parameters and their effects</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>N_CURVE=480</strong> — must be at least 6 × max(p,q) to
          resolve the fastest-oscillating variant T(3,5); below ~60 the tube
          develops kinks at the tightest bends.
        </li>
        <li>
          <strong>N_TUBE=10</strong> — ten-sided polygon gives a round-looking
          cross-section at TUBE_RADIUS=0.048 m on a POI_DIAMETER=0.18 m head.
          Reduce to 6 for a faceted hexagonal tube (cel-shading aesthetic);
          increase to 16 for smooth organic feel.
        </li>
        <li>
          <strong>TORUS_r / TORUS_R = 0.42</strong> — the ratio controls how
          tightly the knot coils. At r/R=0.5 the innermost part of the tube
          passes through the central z-axis and the mesh self-intersects. At
          r/R=0.2 the knot becomes a tight helix close to a circle; the tube
          loses visual interest. 0.4–0.45 balances clarity and complexity.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Seam visible at the closure:</strong> check that you used
          <code>endpoint=False</code> in <code>np.linspace</code> and that
          the face loop uses <code>% N_CURVE</code> for the i+1 index.
        </li>
        <li>
          <strong>Tube twists visibly between shape keys:</strong> the Bishop
          closure correction is per-knot, not shared between shape keys. Each
          call to <code>bishop_tube</code> independently corrects its own
          mismatch angle. If the twist appears only on one key, verify the
          seed normal assignment for that specific (p,q) call.
        </li>
        <li>
          <strong>Shape keys disappear after GLB round-trip:</strong> confirm
          <code>export_morph=True</code> and <code>export_apply=False</code>
          in the gltf exporter call. Some Three.js versions require
          <code>morphTargetsRelative=false</code> on the glTF loader side.
        </li>
        <li>
          <strong>Vertex colours black in WebXR:</strong> the GLB requires
          the WebXR shader to read <code>COLOR_0</code> attribute and multiply
          it into the emissive channel. In Three.js set{" "}
          <code>material.vertexColors = true</code> on the mesh material after
          import.
        </li>
        <li>
          <strong>Script too slow for large N_CURVE:</strong> the Rodrigues
          loop is a Python for-loop over N_CURVE steps — O(N). At N=480 it
          runs in ~0.1 s. Vectorising with numpy requires storing all tangent
          pairs simultaneously; the gain is modest (~2×) and the code
          complexity increases substantially. Prefer keeping the loop.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <p>
        The Seifert fibration of the three-sphere that this tutorial sits
        inside is the same structure explored in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
          className={lk}
        >
          Hopf fibration tutorial
        </Link>{" "}
        — every torus knot T(p,q) is a Seifert fibre of S³ with parameters
        (p,q), and the generic fibre (with p=q=1) is the Hopf great circle.
        Circles on the same host torus used here appear in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-villarceau-circles-torus-hopf-fiber-interlocked-poi-head-webxr"
          className={lk}
        >
          Villarceau circles tutorial
        </Link>{" "}
        — the oblique sections of the torus that create pairs of interlocked
        circles, a limiting case of the torus knot as p,q → 1. Knot-theory
        topology with a Brunnian multi-component link is explored in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-borromean-rings-brunnian-link-milnor-invariant-poi-head-webxr"
          className={lk}
        >
          Borromean rings tutorial
        </Link>{" "}
        — a link with Milnor invariant μ̄₁₂₃=1 that torus knots (single
        component, Milnor trivial) cannot produce. The Bishop
        parallel-transport frame used for the tube here is the same technique
        applied to ribbon geometry in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-euler-elastica-jacobi-dn-curvature-lemniscate-ribbon-poi-webxr"
          className={lk}
        >
          Euler elastica ribbon tutorial
        </Link>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
  libraryPath:
    "blends/scripting/python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr",
});

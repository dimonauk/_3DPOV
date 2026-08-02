import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-quaternion-julia-set-4d-hyperplane-sweep-de-height-field-webxr";

const TITLE =
  "Python numpy — Quaternion Julia Set: 4D ℍ Orbit Dynamics, z-Hyperplane Section Sweep & Smooth-Iteration Height-Field Shape Keys for WebXR (Blender 5.1)";

const LEDE =
  "Hamilton's quaternions ℍ = ℝ⁴ carry the only four-dimensional normed " +
  "division algebra over the reals, making them the natural arena for a " +
  "genuine 4D analogue of the complex Julia set. The iteration " +
  "f_c(z) = z² + c over ℍ uses the exact formula " +
  "z² = (a²−b²−c²−d², 2ab, 2ac, 2ad) — no spherical-coordinate " +
  "approximation, unlike the Mandelbulb's triplex algebra. Restricting " +
  "starting points to the hyperplane Π_t = {x+yi+t·j+0·k : x,y ∈ ℝ} " +
  "gives an invariant 3D cross-section of the 4D filled Julia set. " +
  "This blueprint sweeps t from 0 (the classical complex Julia set) " +
  "through 0.30, 0.55, 0.75, 0.92, storing each cross-section as a " +
  "Blender shape key so the WebXR viewer can morph through 4D structure " +
  "in real time.";

function Body() {
  return (
    <>
      <p>
        The complex Mandelbrot and Julia sets iterate z → z² + c in ℂ ≅ ℝ²,
        exploiting the field structure of complex multiplication. What happens
        when you extend that to four real dimensions? The only four-dimensional
        normed division algebra is ℍ, Hamilton&rsquo;s quaternions:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ℍ = { a + bi + cj + dk : a,b,c,d ∈ ℝ }
|z|² = a² + b² + c² + d²

Multiplication rules:  i² = j² = k² = ijk = −1
                       ij = k,  ji = −k
                       jk = i,  kj = −i
                       ki = j,  ik = −j

Note: multiplication is NOT commutative (ij ≠ ji).`}
      </pre>
      <p>
        The non-commutativity rules out simple polynomial differentiation, but
        it does not obstruct iteration. The map{" "}
        <code>f_c(z) = z² + c</code> is perfectly well defined over ℍ —
        you just square the quaternion and add the constant.
      </p>

      <h2>Exact quaternion squaring</h2>
      <p>
        Expanding <code>(a+bi+cj+dk)²</code> using the multiplication table:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`(a+bi+cj+dk)²

Real part:
  a·a + b·(bi)·i + c·(cj)·j + d·(dk)·k
  = a² + b²(i²) + c²(j²) + d²(k²)
  = a² − b² − c² − d²

i-component (collect all terms with i after evaluation):
  a·bi + bi·a = 2ab·i    (ij = k, ik = -j, etc. give no i-terms from cross products)

j-component:
  a·cj + cj·a = 2ac·j    (similarly cross products cancel)

k-component:
  a·dk + dk·a = 2ad·k

Result:  z² = (a²−b²−c²−d²,  2ab,  2ac,  2ad)`}
      </pre>
      <p>
        This is exact — no approximation. The formula is cleaner than the
        Mandelbulb&rsquo;s spherical-coordinate power because quaternion
        multiplication distributes over addition in a genuine algebra, whereas
        triplex exponentiation does not correspond to any algebraic structure.
      </p>

      <h2>The 4D filled Julia set and its cross-sections</h2>
      <p>
        Fix <code>c = −0.2 + 0.6i</code> (a point inside the quaternion
        Mandelbrot set, ensuring K(c) is connected). The filled Julia set is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`K(c) = { z ∈ ℍ : |f_c^n(z)| ↛ ∞ }

J(c) = ∂K(c)  (the Julia set itself is the boundary)

dim_H(J(c)) ≈ 2  (Hausdorff dimension, generalising from ℂ)

The set lives in ℝ⁴ — we cannot see it directly.`}
      </pre>
      <p>
        To visualise it we take the hyperplane slice:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Π_t = { (x, y, t, 0) : x, y ∈ ℝ }
      = { x + yi + t·j + 0·k }

For starting point z₀ = (x, y, t, 0) and C = (−0.2, 0.6, 0, 0):
  z₁ = z₀² + C
     = (x²−y²−t²−0² + (−0.2),  2xy + 0.6,  2xt + 0,  2x·0 + 0)
     = (x²−y²−t²−0.2,  2xy+0.6,  2xt,  0)

k-component stays 0 every iteration because C[k]=0 and 2ad=0 when d=0.
The subspace Π_t with C_k=0 is EXACTLY INVARIANT — not an approximation.`}
      </pre>
      <p>
        This invariance is why the cross-section is exact: we are not
        projecting from 4D onto a 3D screen — we are computing the dynamics
        restricted to a genuine 3D subspace that happens to be preserved by
        the map. The result at t=0 is the standard complex Julia set
        J(−0.2+0.6i) ⊂ ℂ embedded in ℝ³ as a flat surface.
      </p>

      <h2>Smooth colouring formula</h2>
      <p>
        Raw iteration count n produces visible integer bands — neighbouring
        pixels with n=7 and n=8 show a hard discontinuity despite being
        geometrically close to the Julia set boundary. Linas Vepstas (2000)
        derived a correction using the magnitude overshoot:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`After escaping at iteration n:
  μ = n + 1 − log₂( log₂|z_n| )

WHY this works:
  |z_n| > R (escape radius, here R=4).
  If |z_n| = R then log₂(log₂R) corrects n → n+0 exactly.
  If |z_n| = R² (double-escaped) then correction ≈ n−1.
  Interpolating between these gives a smooth continuous field.

Divided by MAX_ITER this maps to [0, 1].
Interior points (never escaped) receive a negative sentinel value.`}
      </pre>

      <h2>Blender implementation</h2>
      <p>
        The blueprint follows the Holoflow height-field pattern used in the
        Gray-Scott and KdV tutorials: build a flat grid, populate Z coordinates
        from a numpy field, add shape keys for each parameter, assign vertex
        colours, export GLB.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Key parameters at the top of blueprint.py
RES_X, RES_Y = 192, 96     # mesh vertices
Z_SLICES = [0.00, 0.30, 0.55, 0.75, 0.92]  # j-axis sweep
C = np.array([-0.2, 0.6, 0.0, 0.0])        # fixed quaternion`}
      </pre>
      <p>
        The vectorised inner loop iterates over all{" "}
        <code>RES_X × RES_Y = 18,432</code> starting points simultaneously
        using numpy boolean masking. The mask removes escaped points from
        further computation, shrinking the active set each iteration and
        keeping total work below a naive full-grid approach.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`for n in range(MAX_ITER):
    newly = (~escaped) & (r2 > ESCAPE_R2)
    if newly.any():
        r_hit = np.sqrt(r2[newly].clip(1.001))
        smooth[newly] = (n + 1 - np.log2(np.log2(r_hit))) / MAX_ITER
        escaped |= newly
    if escaped.all(): break
    mask = ~escaped
    z[mask] = qsq_plus_c(z[mask])   # vectorised quaternion step
    r2[mask] = (z[mask] * z[mask]).sum(-1)`}
      </pre>

      <h2>Shape keys and the 4D sweep</h2>
      <p>
        Each of the five Z_SLICES values produces a separate height array.
        The t=0 array becomes the mesh basis; subsequent arrays become shape
        keys. In the WebXR viewer, the Five morph targets let you interpolate
        from the rich connected structure at t=0 through the progressive
        dissolution of the basin boundary.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# In Three.js / WebXR after loading the GLB:
const mixer = new THREE.AnimationMixer(mesh)
mesh.morphTargetInfluences[0] = 0.0   // z=0.00  (Basis, always active)
mesh.morphTargetInfluences[1] = 0.5   // z=0.30  half-blended
mesh.morphTargetInfluences[2] = 0.0   // z=0.55  off
// etc.`}
      </pre>
      <p>
        The morph targets are additive in Three.js&rsquo;s default mode,
        so blending two adjacent shape keys gives a smooth traversal through
        the 4D space.
      </p>

      <h2>Vertex colour palette</h2>
      <p>
        Colours are assigned per vertex from the t=0 smooth-iteration value
        and stored in the <code>orbit_depth</code> float-colour attribute
        (exported as <code>COLOR_0</code> in the GLB). Three bands:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Deep interior</strong> (smooth ≈ 0) — deep indigo/violet,
          showing the solid basin of K(c).
        </li>
        <li>
          <strong>Mid escape</strong> — amber to gold, revealing the fractal
          tendrils close to the boundary.
        </li>
        <li>
          <strong>Fast escape rim</strong> — cyan to white, the sparse dust
          far from the basin.
        </li>
      </ul>

      <h2>Comparison: quaternion vs. triplex algebra</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Quaternion ℍ (this tutorial):
  z² = (a²−b²−c²−d², 2ab, 2ac, 2ad)
  Exact algebra.  Non-commutative.  z lives in ℝ⁴, slice to ℝ³.
  c=-0.2+0.6i chosen inside the (complex) Mandelbrot set → K(c) connected.

Triplex / Mandelbulb (see cross-reference below):
  z^n uses spherical coords (r,θ,φ) → (r^n, nθ, nφ) — spherical power only.
  z lives in ℝ³ directly.  No algebra — the "power" is not a ring operation.
  Produces branched-antenna aesthetic; power-8 gives eight-fold equatorial sym.

Neither is the "correct" 3D extension of ℂ, because ℝ³ has no field structure
(Hurwitz 1898: only ℝ, ℂ, ℍ, 𝕆 are normed division algebras).`}
      </pre>

      <h2>Failure modes</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Mesh is completely flat.</strong> The HEIGHT_SCALE is too
          small relative to smooth-iteration values. Check that escaped.any()
          is True after the loop — if C is outside the Mandelbrot set, K(c)
          is a Cantor dust and nearly all points escape in 1–2 iterations,
          compressing the smooth range. Try c = (−0.7, 0.27, 0, 0).
        </li>
        <li>
          <strong>NaN in smooth colouring.</strong> log₂(log₂(r_hit)) fails
          when r_hit ≤ 1.0. The <code>.clip(1.001)</code> guard prevents this;
          verify ESCAPE_R2 ≥ 4.0 so escaping points always have |z| ≥ 2.
        </li>
        <li>
          <strong>Shape keys look identical.</strong> The Z_SLICES values are
          too small — the basin only shrinks noticeably beyond t≈0.4 for
          this c. Try [0.00, 0.40, 0.65, 0.85, 1.00] for stronger contrast.
        </li>
        <li>
          <strong>GLB morph targets absent.</strong> The gltf exporter
          requires <code>export_morph=True</code> (enabled in blueprint.py).
          Also verify <code>export_apply=True</code> is set; morph targets on
          un-applied modifiers are silently dropped.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mandelbrot-julia-fractal-poi-webxr"
            className={lk}
          >
            Python numpy — Mandelbrot &amp; Julia Fractal, Poi WebXR
          </Link>{" "}
          — the t=0 cross-section of this tutorial IS the complex Julia set
          computed there; compare the two blueprints to see how the 4D
          computation collapses to the 2D case when d=0 and t=0.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mandelbulb-power8-triplex-de-orbit-trap-webxr"
            className={lk}
          >
            Python numpy — Mandelbulb Power-8: Triplex Algebra, Distance Estimation
          </Link>{" "}
          — the direct counterpoint to this tutorial: triplex exponentiation
          versus exact quaternion squaring. Both produce 3D fractals from escape
          iteration; the Mandelbulb&rsquo;s branched-antenna aesthetic arises from
          the spherical-power formula, not from genuine 4D structure.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr"
            className={lk}
          >
            Python numpy — 600-Cell: Binary Icosahedral Group, Quaternion Shadow
          </Link>{" "}
          — quaternions appear there for representing the 120-element binary
          icosahedral group on S³; a useful companion showing quaternion algebra
          applied to discrete symmetry rather than continuous dynamics.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
            className={lk}
          >
            Python numpy — Möbius Transformations: PSL(2,ℂ) Conformal Maps
          </Link>{" "}
          — Möbius maps are the automorphisms of ℂ ∪ &#x7B;∞&#x7D;; they sit inside the
          quaternionic Möbius group AGL(1,ℍ), connecting the complex and
          quaternionic dynamics studied in this tutorial.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Norton, A. (1989){" "}
          <a
            href="https://dl.acm.org/doi/10.1145/74334.74373"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            &ldquo;Generation and Display of Geometric Fractals Using Quaternion
            Algebra&rdquo;
          </a>
          . IBM T.J. Watson Research Center, in{" "}
          <em>ACM SIGGRAPH Computer Graphics</em> 23(3), 1989. The first paper
          to describe 3D cross-sections of quaternion Julia sets and implement
          their display. Mathematical content in the public domain. Related work:
          Norton&rsquo;s earlier{" "}
          <em>Julia Sets in the Quaternions</em> (Computers &amp; Graphics, 1989)
          which establishes the connectivity criterion and relation to the complex
          Mandelbrot set.
        </li>
        <li>
          Milnor, J. (2006){" "}
          <a
            href="https://arxiv.org/abs/math/9201272"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            <em>Dynamics in One Complex Variable</em>
          </a>
          . Princeton University Press (3rd ed.), Annals of Mathematics Studies
          160. §14–15 cover Julia and Fatou sets, the connectedness criterion
          (J(c) connected iff c ∈ M), and the smooth colouring renormalisation.
          Mathematical content in the public domain. The same{" "}
          <em>invariance principle</em> used above for Π_t is a quaternionic
          special case of Milnor&rsquo;s Theorem 9.5 on invariant subsets.
          Related: Douady &amp; Hubbard&rsquo;s original proof of Mandelbrot set
          connectedness (1982, <em>C. R. Acad. Sci. Paris</em>), which the
          quaternion theory generalises.
        </li>
      </ul>
    </>
  );
}

export const entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-02",
  topics: [
    "blender", "scripting", "python", "numpy",
    "quaternion", "julia-set", "fractal", "4d",
    "hyperplane", "shape-keys", "height-field", "webxr",
    "complex-dynamics", "smooth-colouring",
  ],
  body: Body,
}) satisfies Entry;

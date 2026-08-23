import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-arnolds-cat-map-anosov-diffeomorphism-golden-ratio-torus-chaos-poi-disc-webxr";

function Body() {
  return (
    <>
      <h2>The cat that scrambles and returns</h2>
      <p>
        In the 1960s Vladimir Arnold used a picture of a cat to illustrate
        something unsettling about smooth, area-preserving maps: apply the same
        simple linear transformation enough times, and the image disintegrates
        into noise — then, after a precise number of steps, it snaps perfectly
        back. No dissipation, no randomness. The map is deterministic and
        reversible at every step. The apparent chaos is real, in the
        mathematical sense; the recovery is also real, because the torus is
        compact and the map is an integer matrix.
      </p>
      <p>
        That map is now called Arnold&rsquo;s cat map. Its matrix is the
        simplest possible hyperbolic integer matrix:
      </p>
      <pre>{`M = [[2, 1],
     [1, 1]]     det M = 1,  tr M = 3`}</pre>
      <p>
        It acts on the flat 2-torus <code>T² = ℝ²/ℤ²</code>: multiply
        coordinates by M, then reduce modulo 1. Area is preserved because{" "}
        <code>det M = 1</code>. The origin is a fixed point; every rational
        point <code>(p/N, q/N)</code> is periodic with period dividing the
        &ldquo;cat map period&rdquo; T(N). It is an Anosov diffeomorphism —
        the gold standard of uniform chaos.
      </p>

      <h2>Eigenvalues and the golden ratio</h2>
      <p>
        The characteristic polynomial of M is <code>λ² − 3λ + 1 = 0</code>.
        Its roots:
      </p>
      <pre>{`λ± = (3 ± √5) / 2

λ₊ = φ²  ≈ 2.618   (unstable eigenvalue)
λ₋ = 1/φ² ≈ 0.382  (stable eigenvalue)

where φ = (1+√5)/2 ≈ 1.618  (the golden ratio)`}</pre>
      <p>
        Because <code>λ₊ · λ₋ = 1</code> (det M = 1) the expansion exactly
        compensates the contraction: volume is preserved but directions are
        stretched and squeezed at the same exponential rate.
      </p>
      <p>
        The <strong>Lyapunov exponent</strong> is{" "}
        <code>Λ = log(λ₊) = log(φ²) = 2 log φ ≈ 0.962 nats/iteration</code>.
        This is the exact, closed-form chaos rate — no numerical estimation
        needed. Two nearby points separate by a factor of φ² with each step in
        the unstable direction.
      </p>

      <h2>Fibonacci matrices</h2>
      <p>
        Repeated matrix multiplication produces Fibonacci numbers. This is not
        a coincidence: the Fibonacci recurrence{" "}
        <code>F_n = F_{"{n-1}"} + F_{"{n-2}"}</code> and the cat-map recurrence
        are the same recurrence. The powers of M are:
      </p>
      <pre>{`M¹ = [[2,  1 ], [1,  1 ]]   Fib:  2, 1
M² = [[5,  3 ], [3,  2 ]]   Fib:  5, 3, 2
M³ = [[13, 8 ], [8,  5 ]]   Fib: 13, 8, 5
M⁵ = [[89, 55], [55, 34]]   Fib: 89, 55, 34
M⁸ = [[987,610],[610,377]]  Fib: 987, 610, 377`}</pre>
      <p>
        The shape-key names in this blueprint encode exactly these powers.{" "}
        <code>SK_Step3</code> raises every vertex height by the torus distance
        after thirteen wraps in u and eight in v — the clearest visual of the
        Fibonacci chaos structure.
      </p>

      <h2>Stable and unstable manifolds</h2>
      <p>
        The eigenvector of <code>λ₊ = φ²</code> is <code>(1, 1/φ)</code>{" "}
        (i.e., <code>(φ, 1)</code> up to scale). The{" "}
        <strong>unstable manifold</strong> through the origin is:
      </p>
      <pre>{`{ (t, t/φ) mod 1 : t ∈ ℝ }`}</pre>
      <p>
        Since <code>1/φ</code> is irrational, this line wraps densely over all
        of T² — it never closes. The unstable manifold object in the blend file
        (amber emission) traces 1 200 equally-spaced points along this orbit.
        You can see the golden-ratio dotted texture covering the disc without
        ever exactly repeating.
      </p>
      <p>
        The <strong>stable manifold</strong> has slope <code>−φ</code> and
        contracts at rate <code>1/φ²</code> per step. It is the locus of
        points that converge to the origin under forward iteration — a set of
        measure zero, but topologically important for understanding the
        hyperbolic structure.
      </p>

      <h2>The scramble-distance height field</h2>
      <p>
        The blueprint builds a 64 × 64 vertex grid covering{" "}
        <code>[0, 1)²</code>, mapped to a 1 m × 1 m poi disc. For each vertex{" "}
        <code>(u, v)</code>, after K applications of M:
      </p>
      <pre>{`(u_K, v_K) = M^K · (u, v)  mod 1

d_K(u,v) = torus_distance( (u_K, v_K), (u, v) )
         = sqrt( wrap(u_K−u)² + wrap(v_K−v)² )
  where  wrap(x) = x − round(x)   (nearest-integer wrapping)

z = d_K × HEIGHT_SCALE`}</pre>
      <p>
        The torus distance correctly handles the modular wrap: a vertex near
        (0.99, 0.5) that maps to (0.02, 0.5) is only 0.03 units away, not
        0.97. NumPy&rsquo;s <code>round</code> on the difference gives the
        shortest path on the torus, matching what you see on the physical disc.
      </p>
      <p>
        At K = 3, the field reveals the Fibonacci structure: the ridges of high
        scramble distance run at slope 1/φ (matching the unstable manifold)
        and the valleys at slope −φ (the stable manifold). The interplay of
        those two directions is what Anosov diffeomorphisms are built from.
      </p>

      <h2>Vertex colour and material</h2>
      <p>
        The FLOAT_COLOR POINT attribute <code>CatMap_Scramble</code> encodes
        the K = 3 scramble distance via a cobalt → amber → crimson ramp:
      </p>
      <pre>{`d_norm = d₃ / d_max      ∈ [0, 1]

d_norm ≤ 0.5  →  lerp(cobalt, amber, 2·d_norm)
d_norm > 0.5  →  lerp(amber, crimson, 2·d_norm − 1)`}</pre>
      <p>
        FLOAT_COLOR on the POINT domain exports as{" "}
        <code>GLTF_COLOR_0</code> without gamma distortion. BYTE_COLOR applies
        a sRGB encode that shifts cobalt towards purple in WebXR — always use
        FLOAT_COLOR for colour-accurate vertex attributes.
      </p>

      <h2>Common failure modes</h2>
      <pre>{`# Symptom: all shape keys look identical
# Cause: foreach_set("co", ...) requires float32, not float64
# Fix: cast with .astype(np.float32) before flattening

# Symptom: vertex colours appear greyed-out
# Cause: Principled BSDF ignores vertex colour by default
# Fix: ShaderNodeAttribute ("CatMap_Scramble") → BaseColor socket

# Symptom: the unstable manifold curve looks like random dots
# Cause: edges connect only consecutive points in the loop; jump
#        points (where t/φ mod 1 wraps) are still joined by edges.
#        That is correct: the wrapping IS the irrational winding.

# Symptom: GLB export_colors has no effect
# Cause: export_colors=True is required; the default is False in Blender 5.1`}</pre>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
            className={lk}
          >
            Feigenbaum Bifurcation Diagram — Logistic Map Poi Disc
          </Link>{" "}
          — another height-field poi disc driven by a chaotic 1D map. The
          scramble-distance colour scheme and shape-key pipeline here are
          identical; compare the period-doubling cascade with the cat
          map&rsquo;s Fibonacci period structure.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-bunimovich-stadium-ergodic-billiard-poincare-section-density-poi-disc-webxr"
            className={lk}
          >
            Bunimovich Stadium — Ergodic Billiard Poincaré Section Poi Disc
          </Link>{" "}
          — ergodic chaos visualised as a density height field, using the same
          poi-disc format. The stadium billiard and the cat map are both
          uniformly hyperbolic; compare their density fields and what
          &ldquo;uniform&rdquo; means in each context.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-penrose-p2-kite-dart-aperiodic-robinson-deflation-stage-floor-webxr"
            className={lk}
          >
            Penrose P2 Kite-Dart — Aperiodic Tiling Stage Floor
          </Link>{" "}
          — the golden ratio φ governs Penrose tile counts (kite:dart → φ) via
          the same Fibonacci substitution matrix M = [[1,1],[1,0]] that
          generates the cat map&rsquo;s eigenvalues. The irrational slope of
          the cat map&rsquo;s unstable manifold is φ⁻¹ — the same irrationality
          that makes Penrose tilings aperiodic.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-miura-ori-rigid-origami-kawasaki-flat-fold-auxetic-poi-disc-webxr"
            className={lk}
          >
            Miura-Ori Rigid Origami — Kawasaki Flat-Fold Poi Disc
          </Link>{" "}
          — shares the flat-torus disc format and the six-shape-key fold
          animation pipeline used here.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shape-keys-morph-targets" className={lk}>
            Shape Keys &amp; Morph Targets
          </Link>{" "}
          — foundational shape-key tutorial for the{" "}
          <code>foreach_set(&quot;co&quot;, …)</code> pattern used in every
          blueprint in this library.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul>
        <li>
          Arnold, V.I. &amp; Avez, A. (1968).{" "}
          <em>Ergodic Problems of Classical Mechanics</em>. Benjamin, New York.
          The cat map appears in Chapter 1 as the simplest example of an Anosov
          diffeomorphism. Mathematical content public domain. Related projects:
          Anosov, D.V. (1967){" "}
          <em>Geodesic Flows on Riemannian Manifolds of Negative Curvature</em>
          , Proceedings of the Steklov Institute of Mathematics, Vol. 90 —
          the general theory of which the cat map is the simplest compact
          example.
        </li>
        <li>
          Hannay, J.H. &amp; Berry, M.V. (1980). Quantization of linear maps
          on a torus — Fresnel diffraction by a periodic grating.{" "}
          <em>Physica D</em>, <strong>1</strong>(3), 267–290.{" "}
          <a
            href="https://doi.org/10.1016/0167-2789(80)90026-3"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1016/0167-2789(80)90026-3
          </a>
          . Equations and analysis public domain. This paper introduced the
          &ldquo;quantum cat map&rdquo; — quantising the area-preserving torus
          automorphism — which became a model system for quantum chaos research.
          Related projects: Keating, J.P. &amp; Mezzadri, F. (2000) quantum
          cat-map spectral statistics; de Bi&egrave;vre, S. &amp; Degli Esposti,
          M. (1998) equidistribution of Husimi functions — both in the public
          domain as mathematical results. NumPy BSD-3-Clause{" "}
          <a href="https://numpy.org" className={lk} target="_blank" rel="noreferrer">
            numpy.org
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Arnold's Cat Map — Anosov Diffeomorphism, Fibonacci Matrices & Golden-Ratio Torus Chaos",
  lede: "The simplest uniformly hyperbolic torus map: M = [[2,1],[1,1]], scramble distance as a height field, Fibonacci matrix powers, and the golden-ratio unstable manifold winding densely over the disc.",
  date: "2026-08-23",
  tags: ["blender", "python", "numpy", "chaos", "topology", "poi", "webxr", "5.1"],
  body: Body,
});

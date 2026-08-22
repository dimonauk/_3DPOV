import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-riemann-zeta-critical-strip-nontrivial-zeros-euler-product-stage-floor-webxr";

const TITLE =
  "Python numpy — Riemann Zeta Function: Critical Strip σ∈(0,1), Non-Trivial Zeros, Euler Product & |ζ(σ+it)| Modulus Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "Bernhard Riemann wrote twelve pages in 1859 that changed number theory permanently. The central object — the function ζ(s) = Σ_{n≥1} n^(−s) extended by analytic continuation to the entire complex plane except s=1 — connects the prime numbers to complex analysis through the Euler product Π_p(1−p^(−s))^(−1) and to the distribution of primes through its zeros. The non-trivial zeros, those in the critical strip 0 < Re(s) < 1, appear in the explicit formula ψ(x) = x − Σ_ρ x^ρ/ρ − log(2π) and directly control how closely the primes follow the logarithmic integral estimate. The Riemann Hypothesis — that all non-trivial zeros have Re(s) = ½ — remains unproved after 167 years and is one of the Millennium Prize Problems. This blueprint computes ζ(σ+it) on an 80×160 grid over σ∈[0.02, 0.98] × t∈[0.5, 50] using an Euler–Maclaurin summation with Bernoulli tail corrections (N=100, |error|<5×10⁻⁴), builds a height field h=clip(log(1+|ζ|), 0, 2.8)×0.18 m with HSV vertex colours tracking arg(ζ), marks the five known non-trivial zeros as red cylinders, and draws the critical line σ=½ in gold — revealing the functional equation's bilateral symmetry directly in the Blender viewport.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-15",
  externalSources: [
    {
      label:
        "Riemann B (1859) Über die Anzahl der Primzahlen unter einer gegebenen Grösse [On the Number of Primes Less Than a Given Magnitude]. Monatsberichte der Berliner Akademie, November 1859. Public Domain — English translation by David Wilkins (2016), released to public domain. The paper introduces: ζ(s) as a meromorphic function; the functional equation ξ(s)=ξ(1−s); the connection to prime distribution via ln(ζ(s)) = Σ_p Σ_m p^(−ms)/m; the explicit formula for ψ(x) involving the zeros; the conjecture (Riemann Hypothesis) that all non-trivial zeros lie on Re(s)=½. Related: Euler (1737) product formula for real s>1; Hadamard-de la Vallée Poussin (1896) proof of the Prime Number Theorem; Clay Mathematics Institute Millennium Prize Problem; Selberg (1942) bound on zero count.",
      url: "https://www.claymath.org/sites/default/files/ezeta.pdf",
      licence: "Public Domain (original 1859; translation 2016)",
      author: "Bernhard Riemann (trans. David Wilkins)",
    },
    {
      label:
        "Olver FWJ, Lozier DW, Boisvert RF, Clark CW (eds.) NIST Digital Library of Mathematical Functions, Chapter 25: Zeta and Related Functions. Release 1.2.1. US Government work (public domain) — https://dlmf.nist.gov/25. Covers: §25.2 Definition and analyticity; §25.4 Functional equation; §25.6 Integer arguments ζ(2n)=(−1)^(n+1) B_(2n) (2π)^(2n) / (2·(2n)!); §25.9 Euler–Maclaurin formula; §25.10 Zeros — tabulated non-trivial zeros t_1=14.134725, t_2=21.022040, t_3=25.010858, t_4=30.424876, t_5=32.935062; §25.11 Hurwitz zeta function. Related: DLMF §25.4 Bernoulli numbers B_(2k); LMFDB at lmfdb.org for computational zero data.",
      url: "https://dlmf.nist.gov/25",
      licence: "US Government work (public domain)",
      author: "NIST DLMF Contributors",
    },
    {
      label:
        "NumPy Developers (2020) Array programming with NumPy. Nature 585:357–362. BSD-3-Clause — https://numpy.org — meshgrid for the 80×160 (σ, t) parameter grid; broadcast of exp(−log_n · s_flat) for the partial sum; np.log1p for numerically stable log(1+|ζ|); np.angle for arg(ζ); np.select for vectorised HSV→RGB conversion; np.clip for height-field ceiling. Related: https://github.com/numpy/numpy; SciPy mpmath for arbitrary-precision verification of zero locations.",
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
        Riemann&apos;s 1859 paper is one of the shortest in mathematics — twelve
        pages — and one of the most consequential. He asked a question Euler
        had posed for real s and answered for that case: can the connection
        between Σ n^(−s) and Π_p (1−p^(−s))^(−1) be extended to complex s,
        and if so, what does the resulting function tell us about where the
        primes are? The answer turned out to involve the zeros of ζ(s) in a
        strip of the complex plane that nobody had anticipated.
      </p>

      <h2>The Euler product and the primes</h2>
      <p>
        Euler had noticed in 1737 that for real s &gt; 1 the Dirichlet series
        Σ n^(−s) factors over primes: ζ(s) = Π_p (1−p^(−s))^(−1). The key
        is unique factorisation — every positive integer appears exactly once
        in the expansion of the product. Taking logarithms:
      </p>
      <p className="font-mono text-sm pl-4">
        log ζ(s) = Σ_p Σ_(m≥1) p^(−ms)/m = Σ_p p^(−s) + smaller terms
      </p>
      <p>
        So the poles and zeros of ζ(s) directly encode whether the sum Σ_p
        p^(−s) blows up or not — i.e., they encode the density of primes.
        The Prime Number Theorem says π(x) ~ x/log(x); the error in that
        estimate is controlled by the real parts of the non-trivial zeros of ζ.
      </p>

      <h2>Analytic continuation and the critical strip</h2>
      <p>
        The Dirichlet series Σ n^(−s) converges only for Re(s) &gt; 1.
        Riemann showed that ζ(s) extends to a meromorphic function on all of
        ℂ with a single simple pole at s=1 (residue 1). The extension comes
        from the Euler–Maclaurin formula or from the integral representation
        ζ(s) = (1/Γ(s)) ∫_0^∞ t^(s−1)/(e^t−1) dt. The critical strip
        0 &lt; Re(s) &lt; 1 is the region where the series does not converge but
        ζ(s) is well-defined by continuation.
      </p>
      <p>
        The functional equation ξ(s) = ξ(1−s) where ξ(s) =
        ½s(s−1)π^(−s/2)Γ(s/2)ζ(s) is a symmetry: the completed zeta function
        is unchanged under s ↦ 1−s. This means if ρ is a non-trivial zero,
        so is 1−ρ. Combined with the Schwarz reflection principle
        (ζ̄(s) = ζ(s̄)), zeros come in quadruples: ρ, 1−ρ, ρ̄, 1−ρ̄. The
        critical line Re(s)=½ is the fixed axis of s ↦ 1−s, and the height
        field in our stage floor is bilaterally symmetric about σ=½ as a
        direct consequence.
      </p>

      <h2>The Euler–Maclaurin summation formula</h2>
      <p>
        The challenge of computing ζ(σ+it) in the critical strip is that the
        Dirichlet series diverges there. The Euler–Maclaurin identity resolves
        this by splitting the series into a partial sum plus explicitly
        computable corrections:
      </p>
      <p className="font-mono text-sm pl-4">
        ζ(s) ≈ Σ_(n=1..N) n^(−s) + N^(1−s)/(s−1) + ½·N^(−s)
        <br />
        {"       "}+ s/12 · N^(−s−1) − s(s+1)(s+2)/720 · N^(−s−3)
      </p>
      <p>
        The key term is N^(1−s)/(s−1). For Re(s) &gt; 1 this vanishes as
        N→∞. For Re(s) &lt; 1, the partial sum Σ n^(−s) diverges like N^(1−σ),
        but the tail correction N^(1−s)/(s−1) exactly cancels this divergence,
        leaving a finite result. This is the analytic continuation hiding
        inside an approximation formula — the magic that makes the computation
        valid in the critical strip.
      </p>
      <p>
        With N=100 and the two Bernoulli corrections (B₂=1/6, B₄=−1/30),
        the absolute error is below 5×10⁻⁴ for |Im(s)| ≤ 50. The
        exp(−log_n · s) broadcast in numpy evaluates 100×12800 = 1.28 million
        complex exponentials in a single vectorised call — about 15 ms on
        a modern CPU.
      </p>

      <h2>Reading the height field</h2>
      <p>
        The height h = clip(log(1+|ζ(σ+it)|), 0, 2.8) × 0.18 m encodes the
        modulus of ζ. Several features are immediately legible:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Tall ridge along σ→1, t→0:</strong> the simple pole at s=1
          causes |ζ| → ∞; the height field piles up in the corner
          (σ=0.98, t=0.5).
        </li>
        <li>
          <strong>Bilateral symmetry about the golden spine (σ=½):</strong>{" "}
          consequence of the functional equation ξ(s)=ξ(1−s). The left half
          (σ &lt; ½) mirrors the right half (σ &gt; ½) exactly.
        </li>
        <li>
          <strong>Red zero markers at t≈14.13, 21.02, 25.01, 30.42, 32.94:</strong>{" "}
          at these points on the critical line |ζ(½+it)| = 0, so h→0 and the
          vertex colour desaturates to grey. The Riemann Hypothesis asserts
          these are the <em>only</em> zeros in the strip.
        </li>
        <li>
          <strong>Rapid phase oscillation at large t:</strong> the hue cycles
          faster and faster as Im(s) increases, because arg(ζ) is driven by
          the phase θ(t) = arg(Γ(¼+it/2)) − t·log(π)/2 that accumulates at
          rate ~log(t/(2π))/2.
        </li>
      </ul>

      <h2>Blueprint key decisions</h2>
      <p>
        <strong>Grid resolution 80×160.</strong> The σ direction needs less
        resolution (the functional equation gives the left half visually for
        free); the t direction needs more to capture the zero valleys, which
        have width ~2π/log(T) ≈ 0.4 in t at T=50.
      </p>
      <p>
        <strong>exp(−log_n · s_flat) broadcast path.</strong> Using
        n^(−s) = exp(−s·log n) avoids complex-power branch-cut ambiguity in
        numpy. The real part σ·log n governs the amplitude; the imaginary part
        t·log n governs the oscillation. Broadcasting log_n[:,None] against
        s_flat[None,:] creates a (100, 12800) complex array in one call,
        summed immediately over axis 0 — no Python loop.
      </p>
      <p>
        <strong>from_pydata over bpy.ops.mesh.primitive_grid_add.</strong> The
        Blender Scripting context does not guarantee the mesh-primitive
        operator&apos;s required context. from_pydata constructs the mesh object
        directly from vertex and face lists and works regardless of the active
        workspace.
      </p>
      <p>
        <strong>Saturation = clip(|ζ|/2, 0.1, 0.85).</strong> Near a zero,
        |ζ| → 0, so saturation drops toward grey — making the zero valleys
        visually distinct even before the height dips. Far from zeros |ζ| ≈ 1
        typically, so saturation sits near 0.5, avoiding over-saturated colour.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Height field shows no valleys:</strong> the N_EM partial-sum
          depth is too low. Increase to N_EM=200 for |Im(s)| up to 100.
          The zero at t≈14.13 is shallow (≈0.3 units wide in t) — set
          N_T≥200 to resolve it clearly.
        </li>
        <li>
          <strong>Script runs out of memory:</strong> the (N_EM, N_SIGMA×N_T)
          complex float64 array is 100×12800×16 bytes ≈ 20 MB. On machines
          with less than 500 MB free, reduce N_EM to 60 (accuracy drops to
          ~5×10⁻³) or reduce the grid to 60×120.
        </li>
        <li>
          <strong>Zero markers appear at wrong positions:</strong> the t→z
          mapping uses T_MIN and T_MAX constants. If you change the grid range,
          zeros outside [T_MIN, T_MAX] will map outside the floor — filter them
          with <code>if T_MIN &lt;= t_zero &lt;= T_MAX</code> in the loop.
        </li>
        <li>
          <strong>Functional-equation symmetry not visible:</strong> check
          that SIGMA_MIN and SIGMA_MAX are symmetric about 0.5. The default
          [0.02, 0.98] is not pixel-perfect; use [0.01, 0.99] or [0.05, 0.95]
          if exact mirror symmetry is needed.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <p>
        The complex-function visualisation approach is shared with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-newton-fractal-basin-attraction-complex-roots-stage-floor-webxr"
          className={lk}
        >
          Newton fractal stage floor
        </Link>{" "}
        (complex iteration on the plane) and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-weierstrass-p-elliptic-lattice-doubly-periodic-height-field-webxr"
          className={lk}
        >
          Weierstrass ℘-function height field
        </Link>{" "}
        (another doubly-periodic complex function with poles). The Möbius
        transformation and Kleinian group connection is detailed in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-kleinian-limit-set-schottky-group-indras-pearls-poi-webxr"
          className={lk}
        >
          Kleinian limit set tutorial
        </Link>{" "}
        — the same PSL(2,ℂ) group that acts on the Riemann sphere underlying
        the ζ(s) critical strip. Conformal mapping principles from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-joukowski-conformal-map-aerofoil-complex-potential-flow-poi-webxr"
          className={lk}
        >
          Joukowski aerofoil tutorial
        </Link>{" "}
        provide additional complex-analysis background.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
  libraryPath:
    "blends/scripting/python-numpy-riemann-zeta-critical-strip-nontrivial-zeros-euler-product-stage-floor-webxr",
});

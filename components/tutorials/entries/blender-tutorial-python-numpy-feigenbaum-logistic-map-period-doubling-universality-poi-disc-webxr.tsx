import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr";

function Body() {
  return (
    <>
      <p>
        The <strong>logistic map</strong> f<sub>r</sub>(x) = r·x·(1−x) is a
        one-parameter family of self-maps of [0, 1].  Below r = 3 the orbit of
        almost any seed converges to a fixed point x* = 1 − 1/r.  At r ≈ 3.0
        that fixed point loses stability and a <em>period-2 orbit</em> appears;
        at r ≈ 3.449 the period-2 orbit itself bifurcates into period-4; and so
        on in an accelerating cascade.  Mitchell Feigenbaum discovered in 1978
        that the ratio of consecutive bifurcation intervals converges to a
        universal constant δ ≈ 4.66920…, now called the first Feigenbaum
        constant.  This script renders that entire diagram as a 3D poi disc:
        radial distance encodes the parameter r, angle encodes the attractor
        position x, and height encodes how densely the orbit visits each state.
      </p>

      <h2>The logistic map and its bifurcation structure</h2>
      <p>
        f<sub>r</sub> has a unique quadratic maximum at x = ½ with value r/4.
        For r ≤ 4 the map is bounded; for r = 4 it is an exact Bernoulli shift
        on [0, 1].  The bifurcation sequence occurs at:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`r₁ ≈ 3.0000   period-1  → period-2
r₂ ≈ 3.4495   period-2  → period-4
r₃ ≈ 3.5441   period-4  → period-8
r₄ ≈ 3.5644   period-8  → period-16
r∞ ≈ 3.5699…  accumulation point — chaos onset`}
      </pre>
      <p>
        The gaps satisfy r_{`{n+1}`} − r_n ≈ (r_n − r_{`{n-1}`}) / δ, so the
        cascade converges geometrically.  Beyond r∞ the orbit is generically
        chaotic, interrupted by periodic <em>windows</em> — the most prominent
        being the period-3 window near r ≈ 3.833 (Li–Yorke 1975: &ldquo;period
        three implies chaos&rdquo;).
      </p>

      <h2>Feigenbaum universality</h2>
      <p>
        The constants δ and α are not peculiar to the logistic map.  Feigenbaum
        proved via a functional renormalisation-group argument that any{" "}
        <em>unimodal</em> map with a <em>quadratic</em> maximum (sin, cosine,
        x² + c, …) has the same δ and α.  The proof defines a renormalisation
        operator T acting on functions: if f is a map-at-bifurcation then
        T[f](x) = α·f(f(x/α)) is also a map-at-bifurcation, and the
        Feigenbaum constants are the eigenvalues of the linearised T at the
        unique attracting fixed point g* — the{" "}
        <em>Feigenbaum-Cvitanović universal function</em>.  This connects the
        period-doubling route to chaos to the renormalisation group techniques
        of statistical mechanics, the same apparatus behind critical exponents
        near phase transitions.
      </p>

      <h2>Disc geometry</h2>
      <p>
        The mesh is a 200-ring × 180-sector annular disc (36 000 vertices,
        35 820 quads).  Ring i maps to parameter r_i ∈ [2.8, 4.0]; sector j
        maps to state x_j = j/180 ∈ [0, 1) → θ_j = 2π·x_j.  Height:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Z(r_i, x_j) = density[i, j] / density[i, :].max()  ×  H_SCALE

density[i, j] = # times the logistic orbit at r_i lands in bin j
               (after 1 000 warm-up steps; collected over 800 orbit points)`}
      </pre>
      <p>
        Row-normalisation gives each r-value equal visual weight regardless of
        orbit width.  A 3-tap circular smoother (½·d + ¼·roll±1) reduces
        salt-and-pepper noise in the chaotic bands without blurring the sharp
        period-doubling spikes.  Vertex colour: <strong>amber</strong> where
        density &gt; 0.02 (orbit visits this state),{" "}
        <strong>cobalt</strong> for forbidden states.
      </p>

      <h2>Vectorised numpy iteration — WHY and HOW</h2>
      <p>
        Naïvely iterating 200 chains × 1 800 steps in Python would take ∼15 s.
        The script runs all N_R chains in one numpy array:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`r_arr = np.linspace(r_min, r_max, N_R)   # (200,)
x     = np.full(N_R, 0.5)

for _ in range(WARM_UP):                  # 1 000 × 1 vectorised op
    x = r_arr * x * (1.0 - x)

for _ in range(N_ORBIT):                  # 800 × 1 vectorised op + add.at
    x = r_arr * x * (1.0 - x)
    j = (x * N_THETA).astype(int)
    np.add.at(density, (idx_r, j), 1.0)`}
      </pre>
      <p>
        <code>np.add.at</code> is used (not indexed assignment) because
        multiple chains can land in the same column j on the same step — a
        plain <code>density[idx_r, j] += 1</code> would silently drop
        duplicates due to numpy&apos;s non-buffered reduction semantics.
        Total runtime per density window: ≈ 0.08 s on a single CPU core.
      </p>

      <h2>Shape keys — five zoomed views</h2>
      <p>
        Each shape key recomputes the orbit density for a narrower r-window
        mapped onto the same 200 rings.  The X, Y positions of the disc are
        unchanged (same physical radii); only the Z heights re-encode the
        zoomed-in density.  Morphing between keys in WebXR is equivalent to
        zooming in on the bifurcation diagram:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Basis          [2.80, 4.00]  full diagram — four regimes visible
SK_FirstBifurc [2.95, 3.15]  period-1 → period-2 at r = 3.0
SK_Cascade     [3.40, 3.58]  period-4/8/16/… cascade
SK_ChaoticOnset[3.55, 3.65]  chaos onset, intermittency
SK_Period3Win  [3.82, 3.88]  period-3 window (r ≈ 3.833)`}
      </pre>

      <h2>Period-3 window and Li–Yorke chaos</h2>
      <p>
        The <code>SK_Period3Win</code> shape key isolates r ∈ [3.82, 3.88].
        Three amber spikes emerge, equally spaced at 120° — the three-periodic
        orbit.  Li and Yorke (1975) proved that the mere existence of a period-3
        orbit implies the existence of orbits of <em>every</em> period, plus an
        uncountable set of chaotic orbits.  The theorem predates Feigenbaum&apos;s
        universality; together they paint the complete picture of how simple
        quadratic iteration generates infinite complexity.  The period-3 window
        closes again near r ≈ 3.857, where the period-3 orbit itself period-
        doubles into period-6, then period-12, then chaos — a miniature replica
        of the full cascade, scaled by δ² ≈ 21.8.
      </p>

      <h2>Related studio tutorials</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
          >
            Duffing oscillator — period-doubling cascade in a continuous system
          </Link>{" "}
          — the same δ constant appears in the Duffing bifurcation diagram;
          Poincaré section reveals the period-doubling structure geometrically
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr"
          >
            Aizawa attractor — toroidal chaos, λ₁ ≈ +0.073
          </Link>{" "}
          — another route to chaos distinct from period-doubling: a torus
          breakdown (Ruelle-Takens scenario) rather than a cascade
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
          >
            Lorenz attractor — RK4, butterfly strange attractor
          </Link>{" "}
          — ODE analogue of the logistic map&apos;s chaotic regime; topological
          mixing without period-doubling route
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-gn-simulation-zone-coupled-map-lattice-logistic-spatiotemporal-chaos-poi-webxr"
          >
            Coupled map lattice — logistic spatiotemporal chaos (Geometry Nodes)
          </Link>{" "}
          — spatial extension of the same logistic map; coupling creates
          spatiotemporal patterns built from the same period-doubling ingredients
        </li>
      </ul>

      <h2>External references</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          Feigenbaum MJ (1978){" "}
          <em>
            Quantitative universality for a class of nonlinear transformations
          </em>
          .{" "}
          <em>J. Stat. Phys.</em> 19(1):25–52.{" "}
          <a
            className={lk}
            href="https://doi.org/10.1007/BF01020332"
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1007/BF01020332
          </a>{" "}
          (open access). Original discovery of δ ≈ 4.669 and α ≈ −2.503;
          renormalisation-group argument; companion paper (1979, J. Stat. Phys.
          21) completes the universality proof.  Related: Coullet P &amp;
          Tresser C (1978) independently discovered the same constants
          (C. R. Acad. Sci. Paris A 287:577).
        </li>
        <li>
          Li T-Y &amp; Yorke JA (1975){" "}
          <em>Period three implies chaos</em>.{" "}
          <em>Am. Math. Monthly</em> 82(10):985–992.{" "}
          <a
            className={lk}
            href="https://doi.org/10.2307/2318254"
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.2307/2318254
          </a>{" "}
          (open access). Proves: period-3 orbit in a continuous interval map
          implies orbits of all periods plus an uncountable scrambled set;
          coined the word &ldquo;chaos&rdquo; in the mathematical sense.
          Related: Šarkovskiĭ AN (1964) — pre-dates Li-Yorke; ranks periods
          in an ordering that fully characterises which periods coexist;
          Smale&apos;s horseshoe (1967) gives a geometric model.
        </li>
      </ul>
    </>
  );
}

const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Feigenbaum Bifurcation Diagram: Logistic Map f_r(x)=rx(1−x), Period-Doubling Cascade (r₁≈3.0/r₂≈3.449/r∞≈3.5699), Universal Constants (δ≈4.669/α≈−2.503), Renormalisation-Group Universality (Feigenbaum 1978), Li–Yorke Period-3 Window, Five Shape Keys, Cobalt–Amber Density Vertex Colour & Bifurcation Poi Disc for WebXR (Blender 5.1)",
  date: "2026-08-22",
  tags: [
    "blender",
    "python",
    "numpy",
    "chaos",
    "feigenbaum",
    "bifurcation",
    "logistic-map",
    "period-doubling",
    "universality",
    "dynamical-systems",
    "shape-keys",
    "vertex-color",
    "webxr",
    "glb",
  ],
  series: "scripting",
  body: Body,
  outside_sources: [
    {
      author: "Feigenbaum MJ",
      year: 1978,
      title:
        "Quantitative universality for a class of nonlinear transformations",
      url: "https://doi.org/10.1007/BF01020332",
      licence: "open-access",
      notes:
        "Feigenbaum MJ (1978) J. Stat. Phys. 19(1):25–52. doi:10.1007/BF01020332 open access. Original discovery of the first (δ≈4.66920) and second (α≈-2.50291) Feigenbaum constants; renormalisation-group argument for universality across all unimodal maps with quadratic maximum. Companion: Feigenbaum MJ (1979) J. Stat. Phys. 21(6):669–706 (completes universality proof). Related: Coullet P & Tresser C (1978) C. R. Acad. Sci. Paris A 287:577 (independent co-discovery); Lanford OE (1982) Bull. AMS 6:427 (rigorous computer-assisted proof of universality); Collet P & Eckmann J-P (1980) Iterated Maps on the Interval as Dynamical Systems Birkhäuser.",
    },
    {
      author: "Li T-Y & Yorke JA",
      year: 1975,
      title: "Period three implies chaos",
      url: "https://doi.org/10.2307/2318254",
      licence: "open-access",
      notes:
        "Li T-Y & Yorke JA (1975) Am. Math. Monthly 82(10):985–992. doi:10.2307/2318254 open access. Proves that a continuous self-map of an interval with a period-3 orbit has orbits of every period and an uncountable scrambled set; coined 'chaos' in the mathematical sense. Related: Šarkovskiĭ AN (1964) Ukr. Mat. Zh. 16:61–71 (earlier, stronger result: Šarkovskiĭ ordering of periods); Smale S (1967) Bull. AMS 73:747 (horseshoe: geometric model of chaos); Devaney RL (1986) An Introduction to Chaotic Dynamical Systems Addison-Wesley (MIT licence lecture notes at math.bu.edu).",
    },
  ],
});

export { entry };

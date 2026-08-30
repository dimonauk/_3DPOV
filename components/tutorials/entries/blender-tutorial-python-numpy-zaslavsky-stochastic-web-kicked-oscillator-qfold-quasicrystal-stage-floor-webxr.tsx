import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-zaslavsky-stochastic-web-kicked-oscillator-qfold-quasicrystal-stage-floor-webxr";

const TITLE =
  "Python numpy — Zaslavsky Stochastic Web: Kicked Oscillator α=2π/q Resonance, q-Fold Quasi-Crystal Corridors, Anomalous Lévy Diffusion, Log-Density Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "The Zaslavsky stochastic web is what you get when a harmonic oscillator meets periodic kicks at exactly the right resonance: the phase plane cracks open into a fractal network of corridors with q-fold rotational symmetry, and particles diffuse through them superlinearly — ⟨r²⟩ ∝ t^μ, μ > 1 — a genuine Lévy flight in a deterministic system. This blueprint samples 100 trajectories × 18 000 map steps for each of four symmetry orders (q=4 square, q=3 triangular, q=6 hexagonal, q=5 quasi-crystal), bins the orbit density into a 180×180 log-count grid, and lifts that grid into a stage-floor mesh with four shape keys. The q=5 shape key is the mathematical odd-one-out: five-fold symmetry is incompatible with any 2-D Bravais lattice, so the web is genuinely aperiodic — the same class of object as a Penrose tiling, but arriving from chaos rather than from geometry.";

function Body() {
  return (
    <>
      <p>
        A particle in a magnetic field orbits in a perfect circle — the cyclotron
        orbit. Kick it periodically and nothing much happens, until the kick
        frequency commensurately resonates with the cyclotron frequency. At that
        moment, the tidy circles shatter into a fractal corridor network that
        spans the entire plane.
      </p>
      <p>
        Zaslavsky, Zakharov, Sagdeev, Usikov, and Chernikov identified this
        structure in 1986 and named it the <em>stochastic web</em>. The web is
        not random in origin — it is carved by a deterministic symplectic map
        — but trajectories inside it behave statistically as if they were
        random walks with an anomalous exponent.
      </p>

      <h2>The map</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`x' =  x·cos α + (y + K·sin x)·sin α
y' = −x·sin α + (y + K·sin x)·cos α

α = 2π/q          rotation angle per kick (sets symmetry order q)
K = 0.6           kick strength

Jacobian: det [[cos α, sin α], [−sin α, cos α]] · (1 + K·cos x)
Actually det J = 1 everywhere → area-preserving (symplectic)`}
      </pre>
      <p>
        The map is a composition of a linear cyclotron rotation by angle α and a
        nonlinear kick{" "}
        <code>y → y + K·sin x</code> applied before the rotation. The kick
        preserves x and shifts y — it is a shear in the y-direction, with
        amplitude modulated by sin x. After the shear, the cyclotron rotation
        mixes both coordinates. The product of two area-preserving maps is
        area-preserving, so det J = 1 everywhere.
      </p>

      <h2>Why resonance creates the web</h2>
      <p>
        Without kicks the orbit is a circle of radius r in the (x,y) phase
        plane, advancing by α per step. The kicks perturb the circle. When
        q kicks complete exactly one full cyclotron orbit (α = 2π/q), each kick
        lands at the same angular position relative to the previous orbit — they
        accumulate coherently rather than averaging out. This resonant
        accumulation distorts the phase-plane topology catastrophically: KAM
        tori aligned with the resonance break into the separatrix network we
        see as the stochastic web.
      </p>
      <p>
        Non-resonant α gives no web — trajectories fill neat annuli and the
        kick perturbations average away over many steps (twist map ergodicity
        for irrational α/2π).
      </p>

      <h2>Why q=5 is special</h2>
      <p>
        The crystallographic restriction theorem states that the only rotational
        symmetries compatible with a 2-D periodic lattice are 2-, 3-, 4-, and
        6-fold. Five-fold symmetry cannot tile the Euclidean plane periodically.
        The q=5 web has exact five-fold symmetry — five corridors meet at each
        junction — yet no unit cell repeats. It is quasi-periodic: the
        autocorrelation of the orbit density has sharp peaks (long-range order)
        but no shortest period. Structurally it belongs to the same universality
        class as the Penrose tiling, which was discovered in 1974 — twelve years
        before Zaslavsky&apos;s map.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`q  α       symmetry   lattice?
─────────────────────────────────
3  2π/3   3-fold     ✓ triangular (hexagonal Bravais)
4  π/2    4-fold     ✓ square Bravais lattice
6  π/3    6-fold     ✓ hexagonal Bravais lattice
5  2π/5   5-fold     ✗ quasi-crystal, non-periodic`}
      </pre>

      <h2>Anomalous diffusion inside the web</h2>
      <p>
        Normal diffusion (Brownian motion) gives ⟨r²⟩ ∝ t. Zaslavsky showed
        that inside the stochastic web the mean-square displacement grows as
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`⟨r²(t)⟩ ∝ t^μ,   μ ≈ 1.3 – 1.7`}
      </pre>
      <p>
        This superdiffusion (μ &gt; 1) is a Lévy flight — the trajectory has
        occasional very long straight dashes along a web corridor, interrupted
        by trapping events near the KAM island boundaries (stickiness). The
        statistical description requires{" "}
        <strong>fractional kinetics</strong>: a Fokker–Planck equation with
        fractional time and space derivatives, which Zaslavsky developed as a
        separate research programme in the 1990s–2000s.
      </p>

      <h2>Blueprint approach: log-density height field</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`N_GRID   = 180          # 180×180 = 32 400 vertices
N_IC     = 100          # trajectories per q value
N_ITER   = 18 000       # steps per trajectory
XY_RANGE = 4.5π         # plot ±4.5π ≈ ±14.1 (covers ~2 web-cell widths)

for each (q, K):
    seed x, y ∈ U(−XY_RANGE, XY_RANGE)   # some land in web, some in islands
    iterate map N_ITER times (vectorised over N_IC)
    bin (x,y) → (xi, yi) counts array
    h = log(1 + counts) / max         # [0,1] normalised log-density`}
      </pre>
      <p>
        The log transform is essential: raw counts span 4 decades (web strands
        receive ~3 000 visits, open KAM regions receive ~1). A linear scale
        would render everything below the top percentile as flat black. With
        log(1 + counts) the full topography is visible — island boundaries
        appear as faint ridges rather than invisible notches.
      </p>
      <p>
        Why seed uniformly rather than seeding only inside the web? Because we
        do not know a priori where the web is — the web IS what we are computing.
        Seeds that land in KAM islands contribute compact, localised density
        peaks (the island surface), which show up as short ridges around island
        cores. This enriches the floor rather than corrupting it.
      </p>

      <h2>Vertex colour and material</h2>
      <p>
        A <code>FLOAT_COLOR</code> attribute <code>ZaslavWeb_Density</code> is
        written to the mesh with a cobalt-to-amber ramp: cobalt at log-density
        0 (open zones) sliding to amber at log-density 1 (dense web strands).
        The material uses{" "}
        <code>ShaderNodeAttribute → ShaderNodeEmission</code>; no UV unwrap is
        needed. In WebXR the attribute is exported as a vertex colour morph
        target inside the GLB.
      </p>

      <h2>Shape keys</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/20">
            <th className="py-1 pr-4 text-left">Key</th>
            <th className="py-1 pr-4 text-left">q</th>
            <th className="py-1 pr-4 text-left">α</th>
            <th className="py-1 text-left">Web character</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Basis", "4", "π/2", "Square corridors, 90° intersections"],
            ["SK_Q3", "3", "2π/3", "Triangular Y-junctions, 120° corridors"],
            ["SK_Q6", "6", "π/3", "Hexagonal honeycomb, densest web"],
            ["SK_Q5", "5", "2π/5", "Quasi-crystal — five arms, no repeat"],
          ].map(([key, q, alpha, desc]) => (
            <tr key={key} className="border-b border-white/10">
              <td className="py-1 pr-4 font-mono text-xs">{key}</td>
              <td className="py-1 pr-4">{q}</td>
              <td className="py-1 pr-4 font-mono text-xs">{alpha}</td>
              <td className="py-1 text-xs opacity-80">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Failure modes & trade-offs</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <strong>Web too faint (K too small)</strong>: below K ≈ 0.2 the web
          is sub-pixel thin at 180×180. Raise K to 0.8–1.2 for thick visible
          corridors; above K ≈ 1.5 the KAM islands shrink and the floor looks
          like uniform fog.
        </li>
        <li>
          <strong>Trajectories escaping XY_RANGE</strong>: the map has no
          boundary — trajectories near the web edge may diffuse out. These are
          silently discarded (the <code>ok</code> mask in the blueprint). If the
          floor looks hollow at the edges, increase XY_RANGE or N_IC.
        </li>
        <li>
          <strong>q=5 looks different from q=4/3/6</strong>: correct. The
          quasi-crystal web has slightly blurred strands because the five-fold
          symmetry group is larger and the corridors are sparser. If you want
          comparable strand density, raise K by ~0.1 for SK_Q5.
        </li>
        <li>
          <strong>Shape-key morph reveals topology mismatch</strong>: because
          the web strands move across the grid when q changes, the morph
          between Basis and SK_Q5 will appear as vertex flow rather than a clean
          dissolve. This is expected — the two webs occupy different phase-space
          regions. For a clean dissolve use Geometry Nodes weight-blending
          instead (future extension).
        </li>
      </ul>

      <h2>Sources</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          Zaslavsky G.M., Zakharov M.Yu., Sagdeev R.Z., Usikov D.A., Chernikov
          A.A. (1986) &ldquo;Stochastic web and diffusion of particles in a
          magnetic field.&rdquo; <em>Zh. Eksp. Teor. Fiz.</em>{" "}
          <strong>91</strong>:500 [<em>Sov. Phys. JETP</em>{" "}
          <strong>64</strong>(2):294]. Equations public domain.
        </li>
        <li>
          Chernikov A.A., Sagdeev R.Z., Usikov D.A., Zakharov M.Yu., Zaslavsky
          G.M. (1987) &ldquo;Minimal chaos and stochastic webs.&rdquo;{" "}
          <em>Nature</em> <strong>326</strong>:559–563.{" "}
          <a
            href="https://doi.org/10.1038/326559a0"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1038/326559a0
          </a>
          . Equations public domain. Related: ChaosBook (
          <a
            href="https://chaosbook.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            chaosbook.org
          </a>
          , CC-BY for educators).
        </li>
        <li>
          Zaslavsky G.M. (2002) &ldquo;Chaos, fractional kinetics, and anomalous
          transport.&rdquo; <em>Physics Reports</em> <strong>371</strong>:461–580.{" "}
          <a
            href="https://doi.org/10.1016/S0370-1573(02)00331-9"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1016/S0370-1573(02)00331-9
          </a>
          . Equations public domain. Related: Metzler &amp; Klafter (2000)
          &ldquo;The random walk&apos;s guide to anomalous diffusion&rdquo;{" "}
          <em>Physics Reports</em> 339:1–77.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul className="list-disc pl-5 text-sm">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr"
            className={lk}
          >
            Chirikov Standard Map — KAM breakdown, Greene's K_c
          </Link>{" "}
          — same symplectic-map family; compare island structure and KAM ridges.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-ammann-beenker-octagonal-quasicrystal-silver-ratio-multigrid-stage-floor-webxr"
            className={lk}
          >
            Ammann–Beenker Octagonal Quasi-Crystal Stage Floor
          </Link>{" "}
          — another non-periodic floor from a different mathematical source;
          compare geometric vs. dynamical quasi-periodicity.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-sinai-billiard-lorentz-gas-dispersing-lyapunov-poincare-stage-floor-webxr"
            className={lk}
          >
            Sinai Billiard / Lorentz Gas — Dispersing Billiard Stage Floor
          </Link>{" "}
          — another area-preserving map producing a Poincaré-section density
          floor; different geometry, same log-density height-field technique.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-30",
  topics: [
    "blender",
    "python",
    "numpy",
    "dynamical systems",
    "chaos",
    "stochastic web",
    "quasi-crystal",
    "stage floor",
    "webxr",
    "shape keys",
  ],
  Body,
});

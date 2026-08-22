import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr";

const TITLE =
  "Python numpy — Gray-Scott Reaction-Diffusion: Turing Pattern Height-Field, Spot/Stripe/Maze Regimes & Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "The Gray-Scott model is a pair of coupled PDEs describing two chemical " +
  "species U (substrate) and V (activator): ∂U/∂t = Du·∇²U − UV² + f(1−U), " +
  "∂V/∂t = Dv·∇²V + UV² − (f+k)V. The cross-term UV² drives autocatalytic " +
  "growth of V at V's own expense, while U continuously replenishes from a " +
  "feed reservoir. Because Dv < Du the activator diffuses slower than its " +
  "substrate — the Turing instability condition — so spatial heterogeneity " +
  "spontaneously emerges from a near-uniform initial state. Pearson (1993) " +
  "catalogued twelve qualitatively distinct pattern regimes by varying only f " +
  "and k. This blueprint simulates the alpha regime (isolated spots) on a " +
  "64×64 periodic grid with explicit-Euler integration, then displaces a " +
  "Blender plane by the V-field to produce an organic height-field GLB ready " +
  "for WebXR.";

function Body() {
  return (
    <>
      <p>
        Alan Turing&rsquo;s 1952 paper &ldquo;The Chemical Basis of
        Morphogenesis&rdquo; showed that a two-species reaction-diffusion
        system could produce stationary spatial patterns from a spatially
        uniform state, provided the inhibitor diffused faster than the
        activator. The Gray-Scott model is the simplest concrete realisation
        of that mechanism, designed by P. Gray and S.K. Scott in 1985 to
        model the iodate-arsenite reaction.
      </p>

      <h2>The equations</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂U/∂t = Du·∇²U  −  U·V²  +  f·(1 − U)
∂V/∂t = Dv·∇²V  +  U·V²  −  (f + k)·V

Du = 0.210   Dv = 0.105   (Dv < Du → Turing instability)
f  = 0.035   k  = 0.060   (alpha / spot regime)`}
      </pre>
      <p>
        Reading each term in the V equation:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <code>Dv·∇²V</code> — Fickian diffusion spreading V across the grid.
        </li>
        <li>
          <code>+U·V²</code> — autocatalysis: one V molecule plus one U
          produces two V, consuming the U.
        </li>
        <li>
          <code>−(f+k)·V</code> — V is removed at rate k (killed), plus
          diluted by the same feed flow that brings fresh U in.
        </li>
      </ul>
      <p>
        The U·V² nonlinearity is not arbitrary. It makes V self-catalytic
        (positive feedback) while U-depletion provides the negative feedback
        that prevents unbounded growth — exactly the activator-inhibitor
        architecture Turing identified. The quadratic V² exponent (rather than
        linear V) guarantees the homogeneous state is stable below a threshold,
        so patterns only emerge beyond a seed perturbation.
      </p>

      <h2>Turing instability — why patterns form</h2>
      <p>
        Linearise about the homogeneous fixed point (U*, V*) and perform a
        Fourier decomposition. A wave-number mode k is unstable when the
        corresponding eigenvalue of the linearised system is positive. The
        condition reduces to:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Dv·∂f_u/∂u + Du·∂f_v/∂v  >  2·√(Du·Dv·det J)

where J is the Jacobian of (f_u, f_v) at the fixed point.

Satisfied when Dv < Du AND one species is autocatalytic.`}
      </pre>
      <p>
        Physically: V grows where it already exists (autocatalysis) but
        diffuses more slowly than U. A small V blob depletes local U, which
        diffuses away laterally; the lateral U deficit prevents V from growing
        in the surrounding region, so a characteristic wavelength is selected
        — the distance at which U can resupply before the local V exhausts it.
        That wavelength sets the spot spacing.
      </p>

      <h2>Discretisation</h2>
      <p>
        The Laplacian on a periodic square grid uses the 5-point stencil:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∇²f[i,j] ≈ f[i+1,j] + f[i−1,j] + f[i,j+1] + f[i,j−1] − 4·f[i,j]

# numpy implementation — periodic via np.roll
lap = (np.roll(f,+1,0) + np.roll(f,-1,0)
     + np.roll(f,+1,1) + np.roll(f,-1,1) - 4*f)`}
      </pre>
      <p>
        Explicit Euler is first-order in time but sufficient: the stability
        requirement <code>DT · Du / dx² &lt; 0.5</code> is met with dx = 1,
        DT = 1, Du = 0.21 → 0.21 ≪ 0.5. A higher-order integrator (RK4)
        would allow larger time steps but costs four Laplacian evaluations per
        step — not worth it when the goal is a steady-state pattern rather than
        precise transient dynamics.
      </p>

      <h2>Pearson&rsquo;s parameter zoo</h2>
      <p>
        The (f, k) plane contains twelve named regimes. A selection:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Regime   f       k       Pattern
alpha    0.035   0.060   isolated spots  ← default in blueprint
beta     0.035   0.065   labyrinths / stripe mix
gamma    0.040   0.060   mazes / reticulate
delta    0.025   0.060   self-replicating spots
worms    0.062   0.061   moving worm-like blobs
solitons 0.030   0.058   self-replicating, collide elastically`}
      </pre>
      <p>
        Change only <code>FEED</code> and <code>KILL</code> at the top of
        <code>blueprint.py</code> to explore each regime — no other parameters
        need adjustment. Convergence time varies: stripes (beta) stabilise
        around step 4000; solitons may not stabilise at all within 6000 steps
        (they continue replicating indefinitely).
      </p>

      <h2>Height-field mesh</h2>
      <p>
        The V concentration field at simulation end is a 64×64 array of values
        in [0, 1]. We map this directly to mesh Z coordinates:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# vertex at grid position (i, j)
x = j * step - MESH_SIZE / 2
y = i * step - MESH_SIZE / 2
z = V_field[i, j] * HEIGHT_SCALE

# vertex colour (R, G, B) encodes reaction state:
R ← V           # activator concentration
G ← 1 − V       # substrate concentration (inverse)
B ← U · V       # reaction front (UV² is maximised here)`}
      </pre>
      <p>
        Flat (face-angle) shading amplifies the faceted ridge structure —
        adjacent quads at different heights produce sharp silhouette angles
        that read clearly in WebXR without per-vertex normal smoothing. The
        B channel lights the reaction front (where U·V² is high) in a cool
        blue against the amber V-peaks — the mathematically active region
        made visually distinct.
      </p>

      <h2>Failure modes and fixes</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>Uniform grey mesh, no pattern.</strong> The initial seed
          was too small or the random perturbations were disabled. Increase
          <code>SEED_R</code> from 3 to 6 or add more sparse noise points.
        </li>
        <li>
          <strong>Pattern fills the whole grid uniformly.</strong> f/k values
          are outside the Turing instability window. Try the alpha defaults.
        </li>
        <li>
          <strong>Negative concentrations / NaN.</strong> DT is too large for
          the chosen Du. Halve DT or reduce Du. The <code>np.clip</code> guards
          catch floating-point drift but cannot fix a fundamentally unstable
          DT choice.
        </li>
        <li>
          <strong>Pattern has period-1 checkerboard.</strong> Aliasing between
          the Laplacian stencil and the grid — increase GRID_N (e.g. 128) or
          reduce the intrinsic wavelength by increasing k slightly.
        </li>
        <li>
          <strong>GLB export fails.</strong> Ensure the <code>.blend</code>{" "}
          file has been saved at least once so <code>bpy.path.abspath("//…")</code>{" "}
          resolves to an actual directory.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-physarum-slime-mould-transport-network-poi-webxr"
            className={lk}
          >
            Physarum Slime-Mould Transport Network
          </Link>{" "}
          — another emergent-network algorithm (Sense-Rotate-Move-Deposit);
          compare the network topology to the Gray-Scott maze regime.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr"
            className={lk}
          >
            Gyroid SDF Isosurface (Surface Nets)
          </Link>{" "}
          — the gyroid TPMS shares a similar field→mesh pipeline; both
          produce a height-field from a scalar grid.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
            className={lk}
          >
            Duffing Oscillator: Period-Doubling Route to Chaos
          </Link>{" "}
          — complementary study in nonlinear dynamics; Duffing in time,
          Gray-Scott in space.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Pearson, J.E. (1993){" "}
          <a
            href="https://www.science.org/doi/10.1126/science.261.5118.189"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            &ldquo;Complex Patterns in a Simple System&rdquo;
          </a>
          . <em>Science</em> 261(5118), 189–192. Public-domain mathematical
          content; the (f, k) parameter zoo originates here. Related upstream
          work: Gray &amp; Scott (1983, 1985) in{" "}
          <em>Chemical Engineering Science</em> introduced the model.
        </li>
        <li>
          pmneila,{" "}
          <a
            href="https://github.com/pmneila/jsexp"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            jsexp
          </a>{" "}
          (MIT licence). JavaScript interactive Gray-Scott visualiser; useful
          for exploring (f, k) parameter space before committing to a
          long Python simulation run. Sibling work:{" "}
          <a
            href="https://github.com/pmneila/morphogenesis-resources"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            pmneila/morphogenesis-resources
          </a>{" "}
          (curated reaction-diffusion reference list, also MIT).
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
  topics: ["blender", "scripting", "python", "numpy", "reaction-diffusion",
           "turing-patterns", "height-field", "webxr", "procedural"],
  body: Body,
}) satisfies Entry;

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-peregrine-breather-rogue-wave-nls-rational-solution-poi-disc-webxr";

function Body() {
  return (
    <>
      <h2>The wave that had to be exactly three times taller</h2>
      <p>
        In 1983, Howell Peregrine published a two-page note in the Journal of
        the Australian Mathematical Society. He had been looking for exact
        analytical solutions to the focusing 1D Nonlinear Schrödinger equation —
        the PDE governing water-wave envelopes, optical pulses in fibres, and
        Bose–Einstein condensates. He found one that was unlike anything in the
        soliton literature: a solution that does not require any free amplitude
        parameter and does not decay exponentially in space or time. It decays
        algebraically. It lives on a continuous background. And it reaches
        exactly three times the background amplitude at its peak — not
        approximately three, but provably, analytically exactly three. There is
        nothing to tune.
      </p>
      <p>
        Oceanographers later named this a <em>rogue wave</em> model. The Draupner
        platform wave of 1995 — 25.6 m crest height against a background of
        roughly 9 m — had a ratio of about 2.8. The Peregrine breather gives a
        theoretical maximum ratio of 3 and a concrete prediction: the wave rises
        from a flat sea, reaches triple amplitude at one point in space and one
        instant in time, then subsides back as though it had never existed. No
        permanent energy deposit; no dispersing radiation. Just a localised,
        rational event.
      </p>

      <h2>The NLS equation and the Peregrine ansatz</h2>
      <p>
        The focusing 1D Nonlinear Schrödinger equation in normalised form:
      </p>
      <pre>{`i Ψ_t + ½ Ψ_xx + |Ψ|² Ψ = 0`}</pre>
      <p>
        The coefficient <code>½</code> in front of the second derivative is
        dispersion; the <code>|Ψ|²Ψ</code> term is the cubic Kerr nonlinearity.
        When the sign of the nonlinear term matches the sign of dispersion
        (<em>focusing</em> regime), the equation supports soliton solutions and
        the modulation instability (Benjamin–Feir instability, 1967) by which a
        plane wave spontaneously grows localised perturbations. The Peregrine
        breather lives at the peak of that instability.
      </p>
      <p>
        The background solution is the plane wave{" "}
        <code>Ψ₀(t) = e^(it)</code> — unit amplitude, uniform phase. Peregrine
        wrote the exact perturbation as:
      </p>
      <pre>{`Ψ_P(x,t) = [1 − 4(1+2it) / D(x,t)] · e^{it}
D(x,t)   = 1 + 4x² + 4t²`}</pre>
      <p>
        The modulus squared, computed without complex floating-point division
        (which loses precision near the origin):
      </p>
      <pre>{`|Ψ_P|² = [(D−4)² + 64t²] / D²`}</pre>
      <p>
        This is the form used in the blueprint because it lets NumPy operate
        entirely in real arithmetic — no complex conjugates, no cancellation
        risk near (0,0). The peak at the origin:
      </p>
      <pre>{`D(0,0) = 1
|Ψ_P(0,0)|² = (1−4)² / 1² = 9  →  |Ψ_P(0,0)| = 3`}</pre>
      <p>
        Far from the origin, <code>D → ∞</code> and the fraction{" "}
        <code>4(1+2it)/D → 0</code>, so{" "}
        <code>Ψ_P → e^(it)</code> and <code>|Ψ_P| → 1</code>. The algebraic
        approach to the background (as 1/r² rather than e^(−r)) is what makes
        this solution fundamentally different from a bright soliton.
      </p>

      <h2>Why it is called a &ldquo;breather&rdquo;</h2>
      <p>
        The term comes from the sine-Gordon literature where breathers are
        spatially localised oscillating bound states. In NLS parlance, a
        breather is a solution periodic in one direction and localised in the
        other. Peregrine&rsquo;s solution is localised in <em>both</em>
        directions — the limit of the breather family as both the spatial and
        temporal periods go to infinity simultaneously. It sits at the
        intersection of two one-parameter families:
      </p>
      <ul>
        <li>
          <strong>Akhmediev breathers</strong> — periodic in x, localised in t.
          The spatial period shrinks to infinity → Peregrine.
        </li>
        <li>
          <strong>Ma–Kuznetsov breathers</strong> — periodic in t, localised in
          x. The temporal period shrinks to infinity → Peregrine.
        </li>
      </ul>
      <p>
        This double-limit origin is why the Peregrine breather is called
        &ldquo;doubly localised&rdquo;. It was the first member of what turned
        out to be a hierarchy of higher-order rational solutions (Ohta–Yang
        2012): the N-th order solution reaches amplitude <code>2N+1</code>.
        N = 1 gives the Peregrine (amplitude 3), N = 2 gives amplitude 5,
        N = 3 gives amplitude 7.
      </p>

      <h2>The height-field mesh</h2>
      <p>
        The blueprint constructs an 80 × 80 vertex grid over{" "}
        <code>x ∈ [−4.5, +4.5]</code> and <code>t ∈ [−4.5, +4.5]</code>,
        scaled to a 1.0 m × 1.0 m physical poi disc. Each vertex&rsquo;s
        Z-position is:
      </p>
      <pre>{`z = |Ψ_P(x, t)| × HEIGHT_SCALE   (HEIGHT_SCALE = 0.22 m)
  → background:  z = 0.22 m  (|Ψ_P| = 1)
  → rogue peak:  z = 0.66 m  (|Ψ_P| = 3)`}</pre>
      <p>
        The x-axis maps to the spatial dimension; the y-axis maps to time. The
        poi disc is therefore a frozen landscape: looking straight down, you see
        the full rogue-wave history — where in space it peaked and how long it
        lasted. The crimson summit at the centre is both the spatial and temporal
        maximum.
      </p>

      <h2>Why real arithmetic avoids the pole</h2>
      <p>
        A naïve implementation would compute
        <code> Ψ_P = (1 − 4*(1+2j*TT)/D) * np.exp(1j*TT) </code> and then take
        the absolute value. Near (0,0), the numerator and denominator of the
        fraction are both small, and double-precision floating point gives
        cancellation error that manifests as a dimple or spike in the vertex
        mesh. The algebraically expanded form avoids this:
      </p>
      <pre>{`# Numerically stable form — pure real arithmetic
D    = 1.0 + 4.0*XX**2 + 4.0*TT**2
amp2 = ((D - 4.0)**2 + 64.0*TT**2) / (D**2)
amp  = np.sqrt(np.clip(amp2, 0.0, None))`}</pre>
      <p>
        The <code>np.clip</code> guards against a floating-point zero going
        marginally negative under subtraction. No such negative values occur in
        the exact mathematical expression, but always protect a square root
        from negative input in production code.
      </p>

      <h2>Shape keys and what they reveal</h2>
      <p>
        Four shape keys beyond the Basis let you morph the disc to highlight
        different aspects of the Peregrine solution:
      </p>
      <pre>{`Basis       full amplitude landscape |Ψ_P(x,t)|
SK_Flat     flat at z = HEIGHT_SCALE  (the homogeneous background |Ψ|=1)
SK_Perturb  z = (|Ψ_P| − 1) × HEIGHT_SCALE  (pure rogue perturbation)
SK_Narrow   t-axis compressed ×0.4 → spatial cross-section ridge
SK_Wide     t-axis stretched ×2.0 → slow algebraic decay visible`}</pre>
      <p>
        <strong>SK_Narrow</strong> is particularly informative: compressing t
        makes the landscape look like a sharp spine running along the x-axis.
        This is the spatial profile at t = 0 — the momentary wavefront shape.
        It reveals that the peak is not a delta-function but a smooth rational
        bump of width ∼ 1 in mathematical units.
      </p>
      <p>
        <strong>SK_Perturb</strong> (background subtracted) is useful for
        numerical work: it shows only the excess amplitude above the plane-wave
        carrier. This is also what a real ocean buoy would record — the deviation
        from the average wave height, not the absolute surface elevation.
      </p>

      <h2>Vertex colour scheme</h2>
      <p>
        The FLOAT_COLOR POINT attribute <code>Peregrine_Amp</code> encodes
        amplitude using a cobalt → amber → crimson gradient:
      </p>
      <pre>{`c = clip((|Ψ_P| − 1) / 2, 0, 1)     # 0 at background, 1 at peak

c ≤ 0.5  →  lerp(cobalt, amber, c×2)
c > 0.5  →  lerp(amber, crimson, (c−0.5)×2)`}</pre>
      <p>
        FLOAT_COLOR on the POINT domain is the correct Blender 5.1 choice for
        vertex colours that export faithfully to GLTF as{" "}
        <code>GLTF_COLOR_0</code>. BYTE_COLOR applies an implicit sRGB
        gamma-encode on write and decode on read, which shifts the hue of the
        cobalt–amber gradient in WebXR. FLOAT_COLOR is linear throughout.
      </p>

      <h2>Common failure modes</h2>
      <pre>{`# Symptom: dimple or spike at the mesh centre
# Cause: complex arithmetic cancellation near D=1
# Fix: use the real formula above

# Symptom: shape keys show no morph in the GLB
# Cause: shape key values left at 0 on export
# Fix: set each SK value to 0 before export; the mesh data is stored regardless

# Symptom: vertex colours appear washed out in EEVEE
# Cause: Principled BSDF does not use vertex colour by default
# Fix: add an Attribute node → Color input of Emission socket, mix 0.6 with BSDF`}</pre>

      <h2>Modulation instability and the rogue-wave link</h2>
      <p>
        The Peregrine solution belongs to the modulational instability (MI)
        spectrum. In MI, a small perturbation of wavenumber <em>k</em> on the
        background grows exponentially at rate{" "}
        <code>γ = k√(2 − k²)</code> for <code>|k| &lt; √2</code>. The
        Peregrine breather is the k → 0 limit of MI: the perturbation grows
        to infinite amplitude at one point then immediately returns. In a real
        ocean, this shows up as a localised giant wave from apparently calm sea
        — the mechanism that makes rogue waves so dangerous to shipping.
      </p>
      <p>
        The formula <code>D = 1 + 4x² + 4t²</code> means the
        &ldquo;half-width&rdquo; of the rogue wave in space is about 0.5
        mathematical units and in time about 0.5 time units. In physical ocean
        waves with carrier frequency 0.1 Hz (10-second period), one mathematical
        time unit corresponds to about 10 seconds — so the rogue event lasts
        roughly 5 seconds. In nonlinear fibre optics, the same equation applies
        but time units compress to picoseconds.
      </p>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr"
            className={lk}
          >
            KdV Soliton — Hirota τ-function &amp; Phase Shift
          </Link>{" "}
          — the KdV equation is a different integrable PDE whose solitons are
          exponentially localised (not rational). Comparing the two tutorials
          shows why NLS supports algebraically decaying solutions while KdV
          does not.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-toda-lattice-integrable-chain-flaschka-lax-soliton-poi-disc-webxr"
            className={lk}
          >
            Toda Lattice — Flaschka Variables, Jacobi Lax Pair &amp; 2-Soliton
          </Link>{" "}
          — discrete integrable system with the same Lax-pair structure as NLS.
          The 2-soliton collision shape key here parallels the SK_Wide morph in
          the Peregrine tutorial, both revealing the persistence of the wave
          packet.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-willmore-flow-h2-bending-energy-conformal-invariant-marques-neves-poi-webxr"
            className={lk}
          >
            Willmore Flow — H² Bending Energy &amp; Conformal Invariance
          </Link>{" "}
          — shares the height-field shape-key pipeline and the cobalt–amber
          FLOAT_COLOR colour scheme used here.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
            className={lk}
          >
            Feigenbaum Bifurcation Diagram — Logistic Map Poi Disc
          </Link>{" "}
          — another height-field poi disc using the identical mesh-building
          pattern (NumPy grid → bmesh loop → FLOAT_COLOR attributes →
          shape keys).
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shape-keys-morph-targets" className={lk}>
            Shape Keys &amp; Morph Targets
          </Link>{" "}
          — the foundational tutorial for the five-shape-key pattern used here.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul>
        <li>
          Peregrine, H.D. (1983).{" "}
          <em>
            Water waves, nonlinear Schrödinger equations and their solutions
          </em>
          . Journal of the Australian Mathematical Society, Series B,{" "}
          <strong>25</strong>(1), 16–43.{" "}
          <a
            href="https://doi.org/10.1017/S0334270000003891"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1017/S0334270000003891
          </a>
          . Mathematical content public domain. Related projects: the
          Akhmediev breather hierarchy (N.N. Akhmediev, V.M. Eleonskii,
          N.E. Kulagin, 1985); the Ohta–Yang higher-order rational solutions
          (2012); the Draupner rogue-wave field measurements (Haver 1995,
          StatoilHydro, public-domain data).
        </li>
        <li>
          Akhmediev, N., Ankiewicz, A., &amp; Taki, M. (2009).{" "}
          <em>Waves that appear from nowhere and disappear without a trace</em>.
          Physics Letters A, <strong>373</strong>(6), 675–678.{" "}
          <a
            href="https://doi.org/10.1016/j.physleta.2008.12.036"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1016/j.physleta.2008.12.036
          </a>
          . Mathematical content public domain. Related: the Optical Rogue
          Waves group at the Australian National University
          (anu.edu.au/nonlinear-physics); the FROG-CRAB attosecond pulse
          characterisation community which uses the same NLS framework.
        </li>
        <li>
          NumPy — BSD-3-Clause ·{" "}
          <a
            href="https://numpy.org/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            numpy.org
          </a>
          . Related: SciPy (BSD-3-Clause){" "}
          <a
            href="https://scipy.org/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            scipy.org
          </a>{" "}
          — <code>scipy.integrate.solve_ivp</code> can propagate the full NLS
          numerically to verify the analytical Peregrine solution; the
          real-arithmetic formula in the blueprint avoids that cost entirely.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Peregrine Breather: Howell Peregrine 1983 Rogue-Wave Solution, NLS i Ψ_t + ½ Ψ_xx + |Ψ|²Ψ = 0, Doubly-Localised Rational Ansatz |Ψ_P(0,0)|=3 Exact, Akhmediev–Ma Hierarchy, Modulation Instability Background, Five Shape Keys & Cobalt–Crimson Poi Disc for WebXR (Blender 5.1)",
  category: "blender",
  tags: [
    "blender",
    "python",
    "numpy",
    "NLS",
    "Peregrine breather",
    "rogue wave",
    "nonlinear Schrödinger",
    "soliton",
    "modulation instability",
    "height field",
    "poi disc",
    "WebXR",
    "GLB",
    "wave physics",
    "integrable systems",
  ],
  date: "2026-08-22",
  lede:
    "Build the Peregrine breather — Howell Peregrine's 1983 exact rational solution to the 1D Nonlinear Schrödinger equation — as an 80×80 height-field poi disc in Blender 5.1 using pure NumPy real arithmetic; the landscape shows the full rogue-wave history over the x–t plane, with amplitude exactly 3× the background at the origin (cobalt background → amber → crimson peak), exported as a morph-target GLB for WebXR.",
  Body,
  library: {
    blend:
      "public/library/blends/scripting/python-numpy-peregrine-breather-rogue-wave-nls-rational-solution-poi-disc-webxr/blueprint.py",
    glb: "public/library/glbs/scripting/python-numpy-peregrine-breather-rogue-wave-nls-rational-solution-poi-disc-webxr/hf_peregrine_poi.glb",
  },
});

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr";

const TITLE =
  "Python numpy — KdV Soliton: Korteweg–de Vries τ-Function, 2-Soliton Hirota Bilinear Method, Phase Shift & Animated Stage-Floor Shape Keys for WebXR (Blender 5.1)";

const LEDE =
  "The Korteweg–de Vries equation u_t + 6u u_x + u_xxx = 0 supports exact " +
  "multi-soliton solutions: localised travelling humps that pass through each " +
  "other without change of shape or speed. The only evidence of the collision " +
  "is a phase shift — the faster soliton emerges ahead of where it would have " +
  "been without the interaction; the slower one emerges behind. Hirota's " +
  "bilinear method computes these solutions exactly via the substitution " +
  "u = 2∂²_x ln τ, where the τ-function for two solitons is a four-term " +
  "exponential whose interaction coefficient A₁₂ = ((κ₁−κ₂)/(κ₁+κ₂))² " +
  "encodes the entire collision. This blueprint computes the 2-soliton field " +
  "analytically, displaces a 192×64 stage-floor mesh, adds five shape-key " +
  "time snapshots, and traces each soliton peak as a NURBS poi light trail.";

function Body() {
  return (
    <>
      <p>
        Diederik Korteweg and Gustav de Vries derived their equation in 1895
        to explain the solitary water waves John Scott Russell had observed
        racing along the Union Canal in 1834 — waves that maintained their
        shape over miles, puzzling physicists who expected dispersive spreading.
        The KdV equation balances two competing effects: the nonlinear term
        6u u_x steepens the wave (tall crests travel faster and overtake shallow
        troughs), while the dispersion term u_xxx spreads it. When the two
        effects exactly cancel a <em>soliton</em> forms — a self-reinforcing
        profile that neither steepens nor disperses.
      </p>

      <h2>The equation and its symmetries</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`u_t + 6u u_x + u_xxx = 0

Scaling symmetry: if u(x,t) is a solution, so is
    λ²u(λx, λ³t)   for any λ > 0.

This fixes the soliton family:
    u(x,t; κ) = (κ²/2) sech²( κ(x − κ²t) / 2 )
    speed = κ²,  amplitude = κ²/2  → amplitude ∝ speed.

Faster solitons are taller. A soliton with κ=1.2 overtakes
one with κ=0.65 because 1.44 > 0.42 (m/s).`}
      </pre>
      <p>
        The amplitude–speed proportionality is not obvious from the equation
        form but follows from the scaling symmetry above combined with the
        sech² ansatz. It has a physical consequence: in a real wave tank,
        a tall initial disturbance breaks into faster, taller solitons at the
        front and shorter, slower ones at the rear — the &ldquo;soliton train&rdquo;
        visible in Russell&rsquo;s canal experiments.
      </p>

      <h2>Hirota&rsquo;s bilinear method</h2>
      <p>
        In 1971 Ryogo Hirota showed that the substitution{" "}
        <code>u = 2∂²_x ln τ</code> transforms the KdV equation into a
        bilinear form:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`(D_t D_x + D_x⁴) τ · τ = 0

where D is the Hirota derivative:  D_x f · g = f_x g − f g_x.

For N solitons, τ is a finite exponential sum:
  τ = Σ_{μ∈{0,1}ᴺ} exp( Σᵢ μᵢ ηᵢ + Σᵢ<ⱼ μᵢ μⱼ ln Aᵢⱼ )

where ηᵢ = κᵢ x − κᵢ³ t  and  Aᵢⱼ = ((κᵢ−κⱼ)/(κᵢ+κⱼ))².`}
      </pre>
      <p>
        For N=2 this gives the four-term expression used in the blueprint.
        The key insight is that the bilinear equation is <em>linear in each
        factor separately</em>, so the exponential ansatz terminates —
        unlike direct substitution into the original PDE which generates an
        infinite Fourier series that must be truncated.
      </p>

      <h2>Computing u analytically</h2>
      <p>
        Rather than finite-differencing τ in x, the blueprint computes
        τ, τ_x, τ_xx symbolically from the exponential structure and evaluates
        u = 2(τ τ_xx − τ_x²) / τ². This avoids grid-size-dependent errors near
        the soliton crest where ∂²u/∂x² is large:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`e1  = exp(κ₁x − κ₁³t)   e2  = exp(κ₂x − κ₂³t)   e12 = e1 · e2
K   = κ₁ + κ₂

τ   = 1 + e1 + e2 + A₁₂ e12
τ_x = κ₁ e1 + κ₂ e2 + A₁₂ K e12
τ_xx= κ₁² e1 + κ₂² e2 + A₁₂ K² e12

u   = 2 (τ τ_xx − τ_x²) / τ²`}
      </pre>
      <p>
        The exponents are clipped to [−60, 60] before calling np.exp to prevent
        float64 overflow far from the solitons. Because the tails decay as
        e^(−2κ|x−κ²t|), overflow only threatens far from the domain
        centre — clipping introduces no visible artefact.
      </p>

      <h2>Phase shift — the smoking gun</h2>
      <p>
        After the collision, the solitons re-emerge with exactly their original
        speeds and amplitudes. The only trace of the interaction is a spatial
        phase shift:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Δx₁ = +(2/κ₁) ln( (κ₁+κ₂)/(κ₁−κ₂) )   [faster, advances]
Δx₂ = −(2/κ₂) ln( (κ₁+κ₂)/(κ₁−κ₂) )   [slower, retreats]

With κ₁=1.20, κ₂=0.65:
  ln-factor = ln(1.85/0.55) = ln(3.364) ≈ 1.213
  Δx₁ ≈ +2.02 m   Δx₂ ≈ −3.73 m`}
      </pre>
      <p>
        Physically: during the interaction the fast soliton temporarily
        &ldquo;rides on top of&rdquo; the slow one and is carried forward;
        the slow one is shielded below the fast one and is left behind.
        The phase shift is determined entirely by the ratio of wavenumbers
        — it is infinite when κ₁ → κ₂ (the solitons travel at the same
        speed and interact forever) and zero when κ₁/κ₂ → ∞ (the fast
        one passes through instantaneously).
      </p>

      <h2>The Blender objects</h2>
      <h3>Stage-floor mesh</h3>
      <p>
        A 192×64 planar grid spanning ±12 m × ±3.5 m in XY. The Z coordinate
        of each vertex is set to <code>u(x, y_ignored, 0.0) × HEIGHT_SCALE</code>{" "}
        — the soliton field at t=0, the collision moment. Vertex colours use a
        teal-to-cream ramp so the height is readable in both the
        EEVEE rendered view and the WebXR viewer.
      </p>
      <h3>Shape keys</h3>
      <p>
        Five additional shape keys capture t = −5, −2, 0, +2, +5. Scrubbing the
        timeline through these shows the pre-collision separated humps (t=−5),
        approach (t=−2), collision (t=0), separation with phase shift (t=+2),
        and post-collision profiles (t=+5). The key interpolation is linear —
        not physically accurate between snapshots, but sufficient for a visual
        preview of the dynamics.
      </p>
      <h3>NURBS poi light trails</h3>
      <p>
        Each soliton peak traces a straight line in (x, t)-space:{" "}
        <code>x_peak(t) = κ²t</code>. The blueprint maps this trajectory to 3D
        by spreading t-values across the stage Y-axis. The fast trail (gold)
        has steeper slope than the slow trail (cyan) — their angular difference
        in the top-down view is the visual encoding of the speed ratio κ₁²/κ₂².
      </p>

      <h2>Failure modes</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <strong>All shape keys look identical.</strong> The time range is too
          small — the solitons have not visibly separated. Increase
          <code>TIMES</code> to e.g. [−10, −4, 0, 4, 10] or reduce KAPPA_2
          (slower soliton takes longer to cross the domain).
        </li>
        <li>
          <strong>Mesh entirely flat or uniformly yellow.</strong> The{" "}
          <code>u_kdv</code> exponents returned NaN/Inf. Check that the exp
          clipping range [−60, 60] is present and that DOMAIN_X is not far
          larger than the soliton amplitude (scale HEIGHT_SCALE up first).
        </li>
        <li>
          <strong>GLB export error on filepath.</strong> Save the .blend file
          before running the script — <code>bpy.path.abspath(&quot;//&quot;)</code>{" "}
          requires a known directory.
        </li>
        <li>
          <strong>Shape key Z does not update.</strong> Blender caches the basis
          in edit-mode coordinates. Switch the mesh to Object Mode before
          running the script, or call{" "}
          <code>bpy.context.view_layer.update()</code> between <code>_set_z</code>{" "}
          and <code>_shape_keys</code>.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr"
            className={lk}
          >
            Gray-Scott Reaction-Diffusion Height-Field
          </Link>{" "}
          — another scalar-field-to-mesh pipeline; compare the discretised PDE
          integration approach there against the exact analytic τ-function here.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
            className={lk}
          >
            Duffing Oscillator: Period-Doubling Route to Chaos
          </Link>{" "}
          — nonlinear ODE with competing stiffness and damping; a useful
          counterpoint to KdV solitons — Duffing leads to chaos, KdV to
          perfect order (exact integrability).
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr"
            className={lk}
          >
            Weierstrass–Enneper Minimal Surfaces
          </Link>{" "}
          — also uses exact analytic formulae to populate a mesh, bypassing
          numerical integration; a structural parallel to the τ-function approach.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Hirota, R. (1971){" "}
          <a
            href="https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.27.1192"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            &ldquo;Exact Solution of the Korteweg–de Vries Equation for Multiple
            Collisions of Solitons&rdquo;
          </a>
          . <em>Physical Review Letters</em> 27(18), 1192–1194.
          Mathematical content in the public domain; the bilinear method and
          τ-function formalism originate here. Related upstream work: the
          inverse scattering transform by Gardner, Greene, Kruskal &amp;
          Miura (1967, also PRL) predates Hirota and provides the theoretical
          justification for why exact solutions exist at all.
        </li>
        <li>
          Drazin, P.G. &amp; Johnson, R.S.{" "}
          <a
            href="https://www.cambridge.org/core/books/solitons/4BD7EC7E1FAD7FD636BB3E5D5AEE59A3"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            <em>Solitons: An Introduction</em>
          </a>
          . Cambridge University Press, 1989. §2.3–2.5 (Hirota method) and
          §3.2 (phase shift derivation). Mathematical content in the public
          domain. The same authors&rsquo; related text{" "}
          <em>Hydrodynamic Stability</em> (Cambridge, 2004) covers the
          physical water-wave context in depth.
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
    "kdv", "soliton", "hirota", "tau-function",
    "phase-shift", "height-field", "shape-keys", "webxr",
    "nonlinear-waves", "integrability",
  ],
  body: Body,
}) satisfies Entry;

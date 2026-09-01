import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-dadras-attractor-momeni-2009-four-scroll-variable-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Dadras–Momeni Attractor (2009): Four-Scroll Variable-Divergence Chaos, " +
  "RK4 Bishop Parallel-Transport Tube & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Dadras and Momeni's 2009 three-ODE system is the clearest known demonstration that a strange " +
  "attractor does not need a constant volume-contraction rate: its divergence ∇·F = −10.3 + 2x " +
  "swings by nearly a factor of two across the attractor, yet the orbit self-organises so the " +
  "time-average satisfies Liouville's theorem. Adjusting a single coupling parameter q switches " +
  "the topology from a two-lobe figure-eight through three- and four-scroll butterfly forms — " +
  "each scroll winding around a distinct unstable equilibrium. This blueprint integrates 90,000 " +
  "RK4 steps at dt = 5×10⁻⁴, threads a Bishop parallel-transport tube through 3,000 waypoints, " +
  "and encodes orbital speed as a cobalt–amber FLOAT_COLOR gradient across four shape keys.";

function Body() {
  return (
    <>
      <p>
        Almost every textbook strange attractor comes with a reassuring constant:
        the trace of its Jacobian — which equals the divergence of the vector
        field — is the same number everywhere in phase space. For the Lorenz
        system it is −(σ + 1 + β) ≈ −13.67; for Rössler it is −(a + 1) ≈ −1.2;
        for Thomas it is exactly −3b. That constant tells you the rate at which
        volumes shrink as the flow compresses trajectories toward the attractor,
        and its universality makes the maths tidy.
      </p>
      <p>
        The Dadras–Momeni attractor breaks that tidiness on purpose. Its third
        equation contains the term s·x·z, which contributes s·x to the
        divergence. The left lobe of the butterfly sits near x ≈ −2, where
        ∇·F ≈ −14; the right lobe sits near x ≈ +2, where ∇·F ≈ −6. The
        attractor&rsquo;s two wings are contracting at wildly different rates,
        yet the trajectory still fills a bounded fractal with a well-defined
        Kaplan–Yorke dimension of about 2.105 — because the long-term average,
        ⟨∇·F⟩<sub>orbit</sub>, comes out negative by Liouville&rsquo;s theorem.
        The local rate varies; the global constraint holds.
      </p>

      <h2>Equations and equilibria</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = y − p·x + q·y·z
ẏ = r·y − x·z + z
ż = s·x·z − t·z

Canonical params:  p=3  q=2.7  r=1.7  s=2  t=9

Jacobian diagonal:
  ∂ẋ/∂x = −p = −3          (constant)
  ∂ẏ/∂y =  r = +1.7        (constant)
  ∂ż/∂z =  s·x − t = 2x−9  ← position-dependent

Divergence:  ∇·F(x) = −p + r + (s·x − t) = −10.3 + 2x

At x=−2 (left lobe):  ∇·F ≈ −14.3  (fast compression)
At x=+2 (right lobe): ∇·F ≈  −6.3  (slow compression)

Lyapunov spectrum (q=2.7): λ₁ ≈ +0.47,  λ₂ ≈ 0,  λ₃ ≈ −4.47
Kaplan–Yorke dimension: D_KY = 2 + λ₁/|λ₃| ≈ 2.105`}
      </pre>

      <h2>Multi-scroll topology: what q controls</h2>
      <p>
        The term q·y·z in ẋ couples all three variables and is responsible for
        the multi-scroll behaviour. Setting q near zero leaves a simple
        dissipative spiral. As q rises:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`q ≈ 0.0–0.9   →  period-1 / period-2 limit cycle (no scroll)
q ≈ 1.0       →  SK_TwoScroll  — figure-eight around two equilibria
q ≈ 1.9       →  three-scroll  (not shown as a shape key — intermediate)
q ≈ 2.7       →  Basis         — four-scroll butterfly`}
      </pre>
      <p>
        Each scroll corresponds to the trajectory winding around one of the
        system&rsquo;s unstable equilibria. Finding them analytically means
        solving a cubic in z arising from ẋ = ẏ = ż = 0; numerically, the four
        equilibria live at approximately (±1.8, ±0.6, ±2.5) and are all
        saddle-focus type — each with one unstable direction and a spiralling
        stable manifold that the chaos rides around.
      </p>

      <h2>Why Bishop frames, not Frenet-Serret</h2>
      <p>
        The Frenet frame needs a well-defined curvature at every point on the
        curve. The Dadras trajectory passes through inflection points — moments
        where the curvature passes through zero — at which the Frenet normal
        flips discontinuously, producing a twisted tube. Bishop frames avoid
        this: the normal is initialised once and then parallel-transported along
        each successive edge, rotating only as much as the tangent direction
        rotates. The result is a smooth, non-twisting tube even at inflection
        points, which matters for a WebXR prop where visual continuity is
        perceptible to the viewer.
      </p>

      <h2>Blueprint walkthrough</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# 1. Integration constants
DT = 5e-4    # small enough for the t=9 z-decay (stiffness ratio ≈ 19)
N_WARMUP = 10_000   # transient settles by ~2,000 steps; 10k is conservative
N_STEPS  = 90_000   # 3,000 waypoints after thinning by THIN=30

# 2. RK4 kernel
def rk4_step(xyz, p, q, r, s, t):
    k1 = deriv(xyz);  k2 = deriv(xyz + DT/2*k1)
    k3 = deriv(xyz + DT/2*k2);  k4 = deriv(xyz + DT*k3)
    return xyz + (DT/6)*(k1 + 2*k2 + 2*k3 + k4)

# 3. Bishop frame (parallel transport, not Frenet)
#    — seed normal perpendicular to first tangent
#    — Rodrigues rotation at each edge to propagate N, B

# 4. Tube mesh: 8-sided polygon rings along 3000 waypoints
#    — 8 × 2999 = 23,992 verts,  8 × 2998 = 23,984 quads

# 5. FLOAT_COLOR 'Dadras_Speed'  cobalt(slow) → amber(fast)

# 6. Shape keys: Basis / SK_TwoScroll(q=1) / SK_Compact(s=3) / SK_WidePinch(p=2)

# 7. GLB export: Draco-6, export_yup=True, export_colors=True, export_morph=True`}
      </pre>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Tube self-intersects near the scroll centres.</strong> The
          trajectory passes close to the equilibria where speed drops near zero
          and curvature spikes. Reduce <code>TUBE_RADIUS</code> to 0.02 or
          increase <code>THIN</code> to 40 (fewer waypoints, cleaner spacing).
        </li>
        <li>
          <strong>Shape-key vertex count mismatch.</strong> Each parameter set
          produces a different attractor extent; the script pads or clips the
          secondary trajectories to exactly <code>n_basis</code> verts. If the
          shape key looks like a crumpled ball, the padding line is dominating —
          try a longer warmup for that parameter set.
        </li>
        <li>
          <strong>GLB export fails with &ldquo;no active object&rdquo;.</strong>{" "}
          Blender 5.1 requires <code>use_selection=True</code> and the object
          selected before calling <code>bpy.ops.export_scene.gltf</code>. The
          script calls <code>ob.select_set(True)</code> and sets{" "}
          <code>view_layer.objects.active = ob</code> immediately after linking
          the object — confirm those lines ran if the error appears.
        </li>
        <li>
          <strong>FLOAT_COLOR not visible in viewport.</strong> Switch to{" "}
          <em>Material Preview</em> or <em>Rendered</em> mode. In{" "}
          <em>Solid</em> mode the Attribute node is not evaluated.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <p>
        The Bishop-frame tube technique is shared with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Rössler Attractor tutorial
        </Link>{" "}
        (constant-divergence single-scroll, Shilnikov homoclinic orbit) and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
          className={lk}
        >
          Chen Attractor tutorial
        </Link>{" "}
        (anti-dual Lorenz, D_KY ≈ 2.169). For the contrasting case of a
        symmetric variable-divergence system see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr"
          className={lk}
        >
          Thomas Cyclically-Symmetric Attractor
        </Link>{" "}
        (Z₃ symmetry, ∇·F = −3b constant there — a useful contrast since the
        Dadras system has no obvious symmetry group yet produces an apparently
        symmetric attractor through dynamics alone).
      </p>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Dadras S & Momeni HR (2009)</strong>{" "}
          &ldquo;A novel three-dimensional autonomous chaotic system generating
          two, three and four-scroll attractors&rdquo;{" "}
          <em>Physics Letters A</em> 373(36):3637–3642.{" "}
          DOI{" "}
          <a
            href="https://doi.org/10.1016/j.physleta.2009.07.088"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            10.1016/j.physleta.2009.07.088
          </a>
          . Elsevier. Original derivation and stability analysis of the
          multi-scroll family; equilibrium locations and Lyapunov spectrum
          computed for p=3, q=2.7, r=1.7, s=2, t=9.
        </li>
        <li>
          <strong>NumPy Developers</strong> — BSD-3-Clause —{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>
          {" / "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          . RK4 integration, Bishop frame rotation (Rodrigues), vertex-ring
          generation, and RGBA gradient mapping. Related: SciPy (BSD-3), used
          by sibling tutorials for Fresnel integrals and eigenmode computation.
        </li>
        <li>
          <strong>Sprott JC (2010)</strong>{" "}
          <em>Elegant Chaos: Algebraically Simple Chaotic Flows</em>{" "}
          World Scientific — ISBN 978-981-283-881-0.{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/elegantchaos.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu
          </a>
          . Classification of low-dimensional chaotic systems by symmetry and
          scroll count; Sprott&rsquo;s companion C code (MIT-licensed) provides
          reference Lyapunov computations for validation.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-01",
  tags: [
    "blender",
    "python",
    "numpy",
    "scripting",
    "chaos",
    "dynamical-systems",
    "dadras",
    "attractor",
    "multi-scroll",
    "variable-divergence",
    "poi",
    "webxr",
    "bishop-tube",
    "shape-keys",
    "rk4",
  ],
  body: Body,
});

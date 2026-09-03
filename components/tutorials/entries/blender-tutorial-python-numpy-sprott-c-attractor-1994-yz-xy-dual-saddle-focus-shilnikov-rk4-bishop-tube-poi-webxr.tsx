import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-c-attractor-1994-yz-xy-dual-saddle-focus-shilnikov-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott C Attractor 1994: ẋ=yz ẏ=x−y ż=c−xy " +
  "6-Term Dual-Product Nonlinearity Paired Shilnikov Saddle-Foci " +
  "P±=(±√c,±√c,0) λ_r≈−1.352 λ_c≈+0.176±1.203i |λ_r|>Re(λ_c) ✓ " +
  "Z₂ Double-Scroll Constant Divergence ∇·F=−1 λ₁≈+0.101 D_KY≈2.092 " +
  "RK4 DT=0.01 BURN_IN=3000 N=90000 THIN=30→3000wp Bishop Parallel-Transport " +
  "Basis(c=1.0)/SK_cLow(c=0.7)/SK_cHigh(c=1.5)/SK_cWide(c=2.0) " +
  "Shape Keys Cobalt–Amber SprottC_Speed FLOAT_COLOR Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott C achieves chaos with just six terms and two product " +
  "nonlinearities — yz and xy — where each term requires two distinct " +
  "variables to activate simultaneously. " +
  "Both fixed points P₊=(1,1,0) and P₋=(−1,−1,0) are Shilnikov saddle-foci, " +
  "and a Z₂ symmetry maps one lobe to the other, producing a paired " +
  "double-scroll topology confirmed by the Shilnikov condition " +
  "|λ_r|=1.352 > Re(λ_c)=0.176.";

function Body() {
  return (
    <>
      <p>
        In 1994 Julien Clinton Sprott ran a computer search over all three-variable
        polynomial ODEs with at most six terms and at most two quadratic
        nonlinearities, integrated each numerically, and retained the nineteen
        that produced genuine bounded chaos.  The studio already holds{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr">
          System A (no equilibria, conservative KAM tori)
        </Link>
        ,{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr">
          System B (two-quadratic constant dissipation)
        </Link>
        ,{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-e-attractor-1994-minimal-chaos-saddle-centre-single-fixed-point-rk4-bishop-tube-poi-webxr">
          System E (saddle-centre, Hamiltonian-like)
        </Link>
        , and{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-l-attractor-1994-quadratic-rectifying-x-squared-single-saddle-focus-rk4-bishop-tube-poi-webxr">
          System L (x²-rectifying nonlinearity)
        </Link>
        .  System C is the fifth entry, and the only one in the Holoflow
        collection that has two product nonlinearities — both requiring two
        distinct variables to fire.
      </p>

      <h2>The equations</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ = y·z                 (nonlinear: x driven only when both y≠0 and z≠0)
ẏ = x − y               (linear restoring; linear damping −y)
ż = c − x·y             (nonlinear: z driven only when both x≠0 and y≠0)

Canonical c = 1.0  (Sprott 1994)

Constant divergence:  ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = 0 + (−1) + 0 = −1
Liouville identity:   λ₁ + λ₂ + λ₃ = −1   (exact, numerically verified)`}
      </pre>

      <h2>Why product nonlinearities are different</h2>
      <p>
        Consider the term <code>y·z</code> in <code>ẋ</code>.  If either{" "}
        <code>y</code> or <code>z</code> is zero, the drive on <code>x</code>{" "}
        vanishes completely — both variables must conspire.  This is a{" "}
        <em>mutual gate</em>.  Compare with:
      </p>
      <ul className="ml-4 list-disc space-y-1">
        <li>
          <strong>Sprott L</strong>&apos;s <code>b·x²</code>: always non-negative,
          always pushing <code>y</code> upward — a one-way valve.
        </li>
        <li>
          <strong>Lorenz</strong>&apos;s <code>x·y</code> in <code>ż</code>:{" "}
          same product form, but Lorenz has six terms with additional linear
          coupling terms that break the Z₂ symmetry Sprott C retains.
        </li>
        <li>
          <strong>Rössler</strong>&apos;s <code>x·z</code> in <code>ẏ</code>:{" "}
          single product term; the other nonlinearity is an additive constant.
        </li>
      </ul>
      <p>
        In Sprott C the mutual-gating appears in both ẋ <em>and</em> ż,
        creating slow passages near the <code>z = 0</code> plane — where
        both equilibria live — that read in the mesh as deep cobalt bands
        (slowest speed) against the faster amber spirals.
      </p>

      <h2>Fixed points and Shilnikov's theorem</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Setting ẋ=ẏ=ż=0:
  y·z = 0   →  y=0 or z=0
  x = y
  x·y = c

  Case y=0: x=0 but 0·0=c → impossible for c≠0
  Case z=0: x=y and x²=c  → x = ±√c

P₊ = (+√c, +√c, 0)    P₋ = (−√c, −√c, 0)

Canonical c=1.0 →  P₊=(1,1,0)  P₋=(−1,−1,0)

Jacobian at P₊ = (1,1,0):
    J = [[0, z, y],    at (1,1,0):    [[0,  0,  1],
         [1, −1, 0],                   [1, −1,  0],
         [−y,−x, 0]]                   [−1, −1, 0]]

Char. poly:  λ³ + λ² + λ + 2 = 0

Eigenvalues:
  λ_r  ≈ −1.352               (real, stable manifold)
  λ_c  ≈ +0.176 ± 1.203i      (complex pair, unstable spiral)

Shilnikov condition:  |λ_r| = 1.352  >  Re(λ_c) = 0.176   ✓
→ The return map near any homoclinic orbit through P₊ contains a Smale
  horseshoe, guaranteeing infinitely many unstable periodic orbits.

Z₂ symmetry: (x,y,z)→(−x,−y,z) maps P₊↔P₋ with identical eigenvalues.
→ Both lobes are Shilnikov saddle-foci → genuine double-scroll topology.`}
      </pre>

      <p>
        Shilnikov&apos;s 1965 theorem is the rigorous backbone of the chaos
        claim.  Whenever a homoclinic orbit visits a fixed point of saddle-focus
        type with the stable modulus exceeding the unstable real part, the
        neighbourhood of that orbit contains countably infinite periodic orbits
        of every period — the hallmark of Smale horseshoe dynamics.  The
        numerical evidence (positive Lyapunov exponent λ₁ ≈ +0.101, D_KY ≈
        2.09) is consistent.  Compare with the{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr">
          Rössler attractor
        </Link>
        , which uses the same mechanism at a single saddle-focus to produce a
        one-lobe band; Sprott C doubles that into two Z₂-symmetric scrolls.
      </p>

      <h2>Bishop parallel-transport frames</h2>
      <p>
        The 3 000-waypoint orbit is extruded into a 10-sided tube using
        Bishop parallel-transport frames rather than Frenet-Serret frames.
        The Frenet frame flips 180° at inflection points (where curvature
        momentarily vanishes), causing the tube cross-section to suddenly
        invert — visible as an ugly crease.  Bishop frames never flip: they
        rotate the transported normal by exactly the angle between successive
        tangent vectors, accumulating no extra torsion.  For Sprott C, where
        the orbit nearly straightens out near the <code>z = 0</code> plane,
        this matters.
      </p>

      <h2>Blueprint walkthrough</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`# 1. integrate canonical orbit  (c = 1.0, IC near P₊)
pts, spds = integrate(c=1.0)   # → 3 000 waypoints

# 2. Bishop frame
N, B = bishop_frame(pts)       # per-waypoint normal + binormal

# 3. tube geometry
verts, faces = build_tube(pts, N, B, r=0.025, sides=10)
# → 30 000 verts / 29 970 quads

# 4. FLOAT_COLOR attribute  (SprottC_Speed)
colours = speed_to_rgba(spds, sides=10)  # cobalt→amber, p2–p98 clip

# 5. shape keys  (c ∈ {1.0, 0.7, 1.5, 2.0})
for sk_name, c_val in PRESETS.items():
    sk_pts, sk_spds = integrate(c=c_val)
    sk_N, sk_B = bishop_frame(sk_pts)
    sk_verts, _ = build_tube(sk_pts, sk_N, sk_B, r=0.025, sides=10)
    sk = ob.shape_key_add(name=sk_name, from_mix=False)
    sk.data.foreach_set("co", sk_verts.flatten())

# 6. poi head sphere at centroid (radius 0.085 m)
# 7. emission material:  ShaderNodeAttribute → BSDF + Emission (1.7×)
# 8. +Y-up rotation + GLB export (Draco 6, WebP, morph targets)`}
      </pre>

      <h2>Troubleshooting</h2>
      <ul className="ml-4 list-disc space-y-1">
        <li>
          <strong>Tube self-intersects:</strong> the orbit is compact (≈ 3 m
          cube at c=1.0) but SK_cWide (c=2.0) may expand to ≈ 5 m.  If the
          tube collapses into itself, reduce <code>TUBE_R</code> from 0.025 to
          0.018 for SK_cWide only.
        </li>
        <li>
          <strong>Shape key diverges (SK_cWide):</strong> near c=2.0 the orbit
          occasionally escapes to infinity if the IC is not close to P₊.  The
          blueprint seeds each key near <code>(√c, 0.5√c, 0)</code> to
          keep the burn-in on the attractor; if it still escapes, reduce c to
          1.8.
        </li>
        <li>
          <strong>Colour is all one shade:</strong> Sprott C&apos;s speed
          distribution is narrower than Lorenz — the percentile clip to [p2,
          p98] is important.  Without it the colour range collapses to a thin
          band near the mean.
        </li>
        <li>
          <strong>Attribute not visible in render:</strong> make sure the
          material reads <code>ShaderNodeAttribute</code> with
          <code>attribute_name = "SprottC_Speed"</code> (exact string, case-
          sensitive).  The attribute type must be <code>FLOAT_COLOR</code>
          on domain <code>POINT</code>.
        </li>
      </ul>

      <h2>The c-parameter family</h2>
      <p>
        As c increases, the equilibria P± move outward (|P±| = √c), and the
        attractor grows accordingly.  At c ≈ 2.2 the orbit appears to become
        unbounded in most initial conditions tested — a practical bifurcation
        limit, though a rigorous proof of this boundary is not in the
        literature.  The four shape keys sample the interior of this range.
        Compare with the <em>a</em>-parameter family of{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr">
          Thomas&apos;s cyclic attractor
        </Link>
        , where decreasing the damping b from 0.20 to 0 transitions through
        quasi-periodic tori before reaching a limit cycle — a completely
        different bifurcation route despite the superficially similar
        parameter-family structure.
      </p>

      <h2>WebXR export notes</h2>
      <p>
        The GLB uses Draco level 6 compression, WebP textures, and morph
        targets for the four shape keys.  The root object is named{" "}
        <code>SprottC_Attractor</code> (snake_case, no spaces) and carries
        <code>holoflow:facet = False</code> and{" "}
        <code>holoflow:category = poi-head</code>.  The +Y-up rotation is
        applied to the mesh data (not the object transform) before export,
        so the GLB coordinate frame matches the WebXR viewer without any
        runtime correction.  See the{" "}
        <Link className={lk} href="/docs/INSTALL-SCAN-BLENDER">
          Blender install and scan guide
        </Link>{" "}
        for the full export pipeline, and the{" "}
        <Link className={lk} href="/docs/BLENDER-EXTENSIONS">
          extensions reference
        </Link>{" "}
        for the holoflow_webxr_exporter add-on.
      </p>

      <h2>Outside sources</h2>
      <ul className="ml-4 list-disc space-y-1">
        <li>
          <strong>Sprott JC (1994)</strong> — &ldquo;Some simple chaotic
          flows&rdquo; <em>Phys Rev E</em> 50(2):R647–R650.{" "}
          <a className={lk}
             href="https://doi.org/10.1103/PhysRevE.50.R647"
             target="_blank" rel="noopener noreferrer">
            DOI 10.1103/PhysRevE.50.R647
          </a>.
          Public-domain mathematics. Companion atlas:{" "}
          <a className={lk}
             href="https://sprott.physics.wisc.edu/chaos/"
             target="_blank" rel="noopener noreferrer">
            sprott.physics.wisc.edu/chaos/
          </a>{" "}
          (permissive educational). Related: Sprott (2010){" "}
          <em>Elegant Chaos</em>, World Scientific — full 19-system survey with
          Lyapunov exponents.
        </li>
        <li>
          <strong>Gilpin W (2021–2024)</strong> — <em>dysts</em> Dynamical
          Systems Benchmarks. MIT licence.{" "}
          <a className={lk}
             href="https://github.com/williamgilpin/dysts"
             target="_blank" rel="noopener noreferrer">
            github.com/williamgilpin/dysts
          </a>.
          Lyapunov spectra and Kaplan-Yorke dimensions for 131 chaotic systems.
          Related: <em>fnn</em> (MIT) for false-nearest-neighbours embedding:{" "}
          <a className={lk}
             href="https://github.com/williamgilpin/fnn"
             target="_blank" rel="noopener noreferrer">
            github.com/williamgilpin/fnn
          </a>.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-03",
  topics: ["blender", "python", "numpy", "chaos", "dynamical-systems", "webxr"],
  body: Body,
  library: {
    blend: `public/library/blends/scripting/${SLUG}/blueprint.py`,
    glb: `public/library/glbs/scripting/${SLUG}/hf_sprott_c_poi.glb`,
  },
});

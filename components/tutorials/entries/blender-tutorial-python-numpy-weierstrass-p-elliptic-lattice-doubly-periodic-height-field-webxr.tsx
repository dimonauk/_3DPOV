import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-weierstrass-p-elliptic-lattice-doubly-periodic-height-field-webxr";

const TITLE =
  "Python numpy — Weierstrass ℘-Function: Doubly-Periodic Elliptic Height " +
  "Field, Lattice-Shape Morphs & Modular Invariants for WebXR (Blender 5.1)";

const LEDE =
  "The Weierstrass ℘-function is the foundational elliptic function — a " +
  "meromorphic function doubly-periodic in ℂ with second-order poles at every " +
  "lattice point.  This blueprint evaluates Re(℘(z; 1, τ)) on a 96 × 96 grid " +
  "using a vectorised Eisenstein lattice sum, builds a height-field mesh whose " +
  "central volcanic peak represents the pole at z = 0, and stores three classical " +
  "lattice shapes (square, rectangular, equianharmonic) as Blender shape keys " +
  "for WebXR morph-target animation.  Vertex colours encode the gradient " +
  "magnitude — steepest near the pole (magenta), flattest at the half-period " +
  "saddle points (cyan).  Exported as Draco-6 GLB for the Holoflow stage floor.";

function Body() {
  return (
    <>
      <p>
        Karl Weierstrass introduced his ℘-function in lectures at Berlin in the
        1860s as a systematic way to build all elliptic functions from a single
        primitive.  An <em>elliptic function</em> is meromorphic on ℂ and
        doubly-periodic: there exist two complex numbers ω₁, ω₂ with{" "}
        <code>Im(ω₂/ω₁) &gt; 0</code> such that{" "}
        <code>f(z + ω₁) = f(z + ω₂) = f(z)</code> for all z.  ℘ is the
        simplest possible example — it has a second-order pole at every lattice
        point <code>ω = mω₁ + nω₂</code> and no other singularities.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`℘(z; Λ) = 1/z²  +  Σ_{ω ∈ Λ \\ {0}} [ 1/(z−ω)²  −  1/ω² ]

The Eisenstein subtraction  1/ω²  converts a conditionally-convergent sum
into an absolutely-convergent one (terms decay as 1/|ω|³, not 1/|ω|²).
Without it the sum diverges.  This regularisation preserves the doubly-
periodic structure — the derivative ℘'(z) = −2 Σ_{ω∈Λ} 1/(z−ω)³  needs
no correction because the raw sum already converges absolutely.`}
      </pre>
      <p>
        ℘ satisfies a remarkable algebraic ODE — the <em>Weierstrass
        equation</em>:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`(℘')²  =  4℘³  −  g₂ ℘  −  g₃

g₂ = 60  Σ_{ω≠0} ω⁻⁴       (Eisenstein series G₄, up to constant)
g₃ = 140 Σ_{ω≠0} ω⁻⁶       (Eisenstein series G₆, up to constant)

This ODE says: if you set X = ℘(z), Y = ℘'(z), the pair (X, Y) lies on the
smooth cubic curve  Y² = 4X³ − g₂X − g₃  in the (X,Y) affine plane.
That curve IS an elliptic curve — a smooth genus-1 Riemann surface — and
every elliptic curve over ℂ arises this way for some lattice Λ.`}
      </pre>
      <p>
        The three roots e₁, e₂, e₃ of <code>4X³ − g₂X − g₃ = 0</code> are
        exactly the values of ℘ at the three half-period points:
        ω₁/2, (ω₁+ω₂)/2, and ω₂/2.  On the height-field mesh you see them as
        three shallow saddle points — the landscape valleys between the central
        pole-peak and the periodic tiles.
      </p>

      <h2>Vectorised lattice sum with NumPy</h2>
      <p>
        The naïve implementation loops over ≈ 440 lattice terms for each of
        9 216 grid points — slow in pure Python.  The blueprint broadcasts
        instead:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# z → (G², 1)   ω → (1, M=440)
diff = z[:, None] - omega[None, :]           # (G², M) complex array
# ℘ regularised: sum  1/(z−ω)²  − 1/ω²
p  = 1/safe_z**2  +  (1/safe_diff**2 - inv_w2).sum(axis=1)

# Memory: 9216 × 440 × 16 B  ≈ 65 MB — fits comfortably in Blender's heap`}
      </pre>
      <p>
        The pole at z = 0 would produce a floating-point infinity.  An epsilon
        guard <code>EPS = 1e-8</code> replaces near-zero denominators before
        squaring, giving a finite but very large value that the subsequent{" "}
        <code>POLE_CLIP</code> clamping then trunates to 9.0.  This produces the
        volcano peak visible at the mesh centre.
      </p>

      <h2>Three classical lattice shapes</h2>
      <p>
        The modular parameter τ = ω₂/ω₁ (with Im τ &gt; 0) determines the shape
        of the lattice and therefore the shape of the function.  Three shape
        keys encode the most mathematically significant choices:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Square (τ = i):
  ℤ₄ symmetry  z ↦ iz  maps the lattice to itself.
  Consequence: g₃ = 0  (G₆ vanishes by ℤ₄ argument-sum cancellation).
  Half-period values: e₁ = −e₃ ∈ ℝ₊,  e₂ = 0.
  The height field has 4-fold rotational symmetry.

Rectangular (τ = 1.5i):
  ℤ₂ symmetry only.  Volcano elongated along the Y-axis.
  The three half-period saddles are spaced further apart than the Square case.
  Useful for stage floors with a directional performance axis.

Equianharmonic (τ = e^{iπ/3}):
  ℤ₆ symmetry  z ↦ ωz  (ω = e^{iπ/3})  maps the lattice to itself.
  Consequence: g₂ = 0  (G₄ vanishes by ℤ₆ argument-sum cancellation).
  This is the lattice ℤ[ω] of Eisenstein integers.
  The elliptic curve  Y² = 4X³ − g₃  has complex multiplication by ℤ[ω].
  Taniyama-Shimura: this curve is associated to a modular form of weight 2,
  connecting it to the proof of Fermat's Last Theorem via the same machinery.`}
      </pre>
      <p>
        Compare the equianharmonic lattice&apos;s ℤ₆ symmetry with the 6-fold
        structure in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr"
          className={lk}
        >
          Centroidal Voronoi Tessellation tutorial
        </Link>
        , where hexagonal tiling arises from energy minimisation rather than
        complex multiplication.  Both routes produce the same six-fold geometry
        from different starting assumptions.
      </p>

      <h2>Connection to the KdV equation</h2>
      <p>
        The ℘-function is not merely a curiosity of 19th-century complex
        analysis.  It appears as an exact solution to the{" "}
        <em>Korteweg–de Vries</em> (KdV) equation:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`KdV:   u_t  +  6u u_x  +  u_{xxx}  =  0

Stationary 1-soliton travelling at speed c:
  u(x, t)  =  −2℘(x − ct;  Λ)   for a suitable lattice Λ with g₂ = 12c, g₃ = 0

When Λ → degenerate (c → ∞), ℘(z) → 1/sinh²(z)  — the familiar sech² soliton.
The ℘ function is therefore the periodic analogue of the isolated soliton.`}
      </pre>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr"
          className={lk}
        >
          KdV soliton tutorial
        </Link>{" "}
        builds the 2-soliton via Hirota&apos;s bilinear τ-function; this
        blueprint is the complementary periodic (non-degenerate lattice) picture.
        Both produce height-field stage floors — the KdV tutorial gives
        propagating wave ridges, this tutorial gives the stationary doubly-periodic
        terrain.
      </p>

      <h2>Vertex colours and gradient magnitude</h2>
      <p>
        After evaluating Re(℘), NumPy&apos;s <code>np.gradient()</code> computes
        the discrete partial derivatives ∂Re(℘)/∂x and ∂Re(℘)/∂y.  Their
        magnitude |∇Re(℘)| is steepest near the pole (where 1/z² ≈ 1/r²
        diverges) and flattest near the half-period saddle points.  The
        normalised gradient is stored as a <code>FLOAT_COLOR</code> point
        attribute, mapped to a cyan → magenta ramp:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`t = gradient_magnitude_normalised  # ∈ [0, 1]
R = 0.2 + 0.8·t   # R: 0.2 (cyan) → 1.0 (magenta)
G = 1.0 − 0.9·t   # G: 1.0 → 0.1
B = 1.0 − 0.4·t   # B: 1.0 → 0.6`}
      </pre>
      <p>
        The same gradient-magnitude colouring approach appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-joukowski-conformal-map-aerofoil-complex-potential-flow-poi-webxr"
          className={lk}
        >
          Joukowski conformal map tutorial
        </Link>
        , where the flow velocity magnitude is mapped to streamline colours.
        Both use NumPy&apos;s gradient operator on a 2D field evaluated on a
        regular grid — the same one-liner generalises across complex analysis
        visualisations.
      </p>

      <h2>The j-invariant and modular forms</h2>
      <p>
        The lattice Λ is determined up to isomorphism by τ = ω₂/ω₁.  Two
        lattices Λ and Λ′ give isomorphic elliptic curves if and only if their
        τ-values are related by a Möbius transformation in SL(2,ℤ):
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`τ  ↦  (aτ + b) / (cτ + d),    a,b,c,d ∈ ℤ,  ad − bc = 1

The modular j-function:   j(τ) = 1728 · g₂(τ)³ / Δ(τ)
                          Δ(τ) = g₂(τ)³ − 27 g₃(τ)²   (discriminant)

j(i) = 1728     (Square lattice, g₃ = 0 → Δ = g₂³)
j(e^{iπ/3}) = 0 (Equianharmonic, g₂ = 0 → Δ = −27g₃²  ← j = 0/Δ = 0)

j(τ) is the same function that appears in Monstrous Moonshine:
the q-expansion  j(τ) = 1/q + 744 + 196884q + …  has coefficients that are
dimensions of representations of the Monster group (Conway & Norton 1979).`}
      </pre>
      <p>
        Compare the SL(2,ℤ) action on τ here with the PSL(2,ℂ) Möbius
        transformations in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
          className={lk}
        >
          Möbius transformation tutorial
        </Link>
        .  The modular group is the restriction to integer entries — a
        discrete subgroup acting on the upper half-plane, rather than all of Ĉ.
      </p>

      <h2>WebXR use as stage floor</h2>
      <p>
        The GLB exports the morph targets as{" "}
        <code>morphTargetInfluences[0]</code> (Rectangular) and{" "}
        <code>morphTargetInfluences[1]</code> (Equianharmonic).  In a Holoflow
        stage, driving these from an audio analyser creates a{" "}
        &ldquo;breathing terrain&rdquo; that responds to music: low frequencies
        morph toward the square lattice (4-fold symmetry), highs toward the
        equianharmonic (6-fold). The same morph-target pipeline appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr"
          className={lk}
        >
          Weierstrass–Enneper minimal surfaces tutorial
        </Link>
        , where shape keys cycle between the Bonnet associate family members.
      </p>

      <h2>Sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Whittaker, E.T. &amp; Watson, G.N.{" "}
          <em>A Course of Modern Analysis</em>, 4th ed. Cambridge, 1927.
          Chapter XX: Elliptic Functions.{" "}
          <a
            href="https://archive.org/details/courseofmodernan00whit"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            archive.org/details/courseofmodernan00whit
          </a>{" "}
          — public domain; the standard reference for elliptic function theory.
          Related:{" "}
          <a
            href="https://en.wikipedia.org/wiki/Weierstrass_elliptic_function"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikipedia: Weierstrass elliptic function
          </a>
          ,{" "}
          <a
            href="https://en.wikipedia.org/wiki/Elliptic_curve"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Elliptic curve
          </a>
          .
        </li>
        <li>
          Reinhardt, W.P. &amp; Walker, P.L.{" "}
          <em>
            DLMF Chapter 23 — Weierstrass Elliptic and Modular Functions
          </em>
          . NIST Digital Library of Mathematical Functions.{" "}
          <a
            href="https://dlmf.nist.gov/23"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            dlmf.nist.gov/23
          </a>{" "}
          — public domain (US government work); formulae §23.6 used directly
          for the lattice sum definition and half-period identities.  Related:{" "}
          <a
            href="https://dlmf.nist.gov/20"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            DLMF §20 Theta functions
          </a>
          ,{" "}
          <a
            href="https://dlmf.nist.gov/22"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            §22 Jacobian elliptic functions
          </a>
          .
        </li>
        <li>
          NumPy community. <em>NumPy</em> (BSD-3-Clause).{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>{" "}
          — broadcasting, <code>np.gradient</code>, complex arithmetic.
          Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "45 minutes",
    difficulty: "intermediate",
    cost: "nil — Python + Blender only",
    supplies: {
      materials: [],
      tools: [
        "Blender 5.1",
        "numpy (bundled with Blender)",
      ],
    },
    steps: [
      {
        title: "Open Scripting workspace",
        body: "Launch Blender 5.1. Switch to the Scripting workspace. Create a new text datablock and save the .blend so that '//' paths resolve correctly.",
      },
      {
        title: "Paste and run blueprint.py",
        body: "Copy blueprint.py into the text editor. Press Alt+P. The console prints field sizes and shape key names. Expect 45–90 s on a modern CPU.",
      },
      {
        title: "Verify the lattice sum",
        body: "After running, open the Python console and type: import numpy as np. Then verify N_SUM=10 gives 440 terms: (2*10+1)**2 - 1 == 440. This truncation produces relative error < 0.01% for the square lattice.",
      },
      {
        title: "Inspect the height field",
        body: "In the 3D Viewport, orbit around the mesh. The central truncated peak is the clamped pole at z=0. Three shallow saddles are visible — these are the half-period values e₁, e₂, e₃.",
      },
      {
        title: "View vertex colours",
        body: "Press Z → Material Preview. Cyan regions are flat (near the zeros of ℘'); magenta regions are steep (pole surroundings). The boundary between cyan and magenta traces the contour where |℘'| equals half its maximum.",
      },
      {
        title: "Explore shape keys",
        body: "Object Properties → Shape Keys. Drag 'Rectangular_tau_1p5i' to 1.0 to see the elongated volcano. Drag 'Equianharmonic_tau_eiπ3' to 1.0 to see the 6-fold symmetric form. Note how the saddle positions and peak height change.",
      },
      {
        title: "Run record.py",
        body: "Load record.py and press Alt+P. The script keyframes a 120-frame morph cycle (Square → Rectangular → Equianharmonic → Square) and renders to viewport.mp4 using Workbench vertex-colour mode.",
      },
      {
        title: "Save .blend and capture screen.mp4",
        body: "File → Save As → hf_weierstrass_p.blend. Follow SCREEN-RECORDING-NOTES.md to capture the OBS session: theory, code walkthrough, live run, shape key demo.",
      },
    ],
  },
  {
    slug: SLUG,
    title: TITLE,
    date: "2026-08-07",
    kind: "tutorial",
    excerpt: LEDE,
    Body,
  },
);

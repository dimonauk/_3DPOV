import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-fraunhofer-diffraction-fft-aperture-psf-airy-disk-stage-floor-webxr";

const TITLE =
  "Python numpy — Fraunhofer Diffraction: 2D FFT Aperture Point-Spread " +
  "Function, Airy Disk & Diffraction Spike Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "The far-field diffraction pattern of a coherent plane wave through an " +
  "aperture equals the squared modulus of the aperture's 2D Fourier transform.  " +
  "Three aperture shapes (circular → Airy disk, hexagonal → 6-spike pattern, " +
  "annular → sharpened core) are computed by zero-padded FFT, log-compressed " +
  "for 70 dB dynamic range, and mapped onto a 96 × 96 bmesh height field with " +
  "morph-target shape keys and blue-white vertex-colour emission for WebXR.";

function Body() {
  return (
    <>
      <p>
        Every long-exposure poi photograph of a distant LED shows rings around
        the brightest point: the <em>Airy disk</em>.  This is not a lens flaw —
        it is the exact, mathematically inevitable consequence of wave
        interference through a finite circular opening.  The pattern is the
        point-spread function (PSF) of the optical system.
      </p>
      <p>
        In the Fraunhofer (far-field) limit the field amplitude U at the focal
        plane of a lens of focal length f is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`U(X,Y) ∝ F[A](u,v)   where u = X/(λf), v = Y/(λf)
I(X,Y) = |U|²         — irradiance is squared modulus`}
      </pre>
      <p>
        A(x, y) is the pupil function (1 inside the aperture, 0 outside);
        F denotes the 2D Fourier transform.  For a circular aperture of
        diameter D the result is analytic:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`I(ρ) = I₀ · [2 J₁(ρ) / ρ]²,   ρ = 2πar/(λf)
first dark ring at r₁ = 1.22 λ f / D   (Rayleigh criterion)`}
      </pre>
      <p>
        The Airy ring radii are the zeros of J₁, listed in the{" "}
        <Link className={lk} href="https://dlmf.nist.gov/10.21">
          NIST DLMF §10.21
        </Link>
        .  The{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-zernike-polynomials-noll-wavefront-aberration-disc-poi-webxr">
          Zernike polynomials tutorial
        </Link>{" "}
        covers how wavefront aberrations W(x,y) deform the PSF via
        F[A · exp(iW)].
      </p>

      <h2>Why log-scale the intensity</h2>
      <p>
        The Airy first bright ring carries ~1.7 % of total power; the second
        ~0.4 %.  Linear scale makes both invisible next to the central peak.
        Plotting 10 log₁₀(I/I_max) maps the 70 dB dynamic range onto a
        perceptually uniform axis, revealing all ring structure.  The ε = 10⁻⁷
        floor in the blueprint sets −70 dB — consistent with a 12-bit detector.
      </p>

      <h2>Hexagonal aperture: 6 diffraction spikes</h2>
      <p>
        A regular hexagon has 3 pairs of parallel straight edges.  Each straight
        edge acts as a single slit, producing a sinc-like lobe perpendicular to
        itself.  Three edge directions at 0°, 60°, 120° → 6 spikes.  This is the
        exact mechanism behind the 6 primary spikes in every JWST starfield image;
        JWST&apos;s 18 hexagonal mirror segments form a roughly hexagonal envelope.
      </p>
      <p>
        The blueprint defines the hexagon via the L∞ norm on the hexagonal lattice:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`p0 = |x|
p1 = |0.5x + (√3/2)y|
p2 = |0.5x − (√3/2)y|
mask = max(p0, p1, p2) ≤ r`}
      </pre>
      <p>
        Compare this with the Chladni standing-wave patterns in the{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-chladni-figures-standing-wave-eigenmodes-nodal-lines-height-field-webxr">
          Chladni nodal-line tutorial
        </Link>
        : both produce height fields with 6-fold symmetry from a hexagonal
        boundary condition, though via entirely different physics.
      </p>

      <h2>Annular aperture: sharpened core</h2>
      <p>
        Removing the central disc of relative radius ε from a circular aperture
        shifts the first dark ring inward to ~0.64λ/D for ε → 1 — a 47 %
        sharpening.  The trade-off: the first bright ring rises from 1.7 % to
        ~17 % of total power.  Cassegrain telescopes are annular apertures
        (secondary mirror blocks the centre).  JWST: ε ≈ 0.10; Hubble: ε ≈ 0.33.
        The{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-render-cycles-dof-motion-blur-bokeh">
          Cycles DoF bokeh tutorial
        </Link>{" "}
        covers how <code>cam.data.dof.aperture_blades</code> controls bokeh shape
        at the camera level; this tutorial operates one abstraction deeper — the
        wave-optical PSF that bokeh approximates.
      </p>

      <h2>Zero-padding: why 2×</h2>
      <p>
        The DFT assumes periodic input.  Without padding the aperture tiles —
        left edge adjoins right edge — adding phantom grating orders.  Padding
        to 2N per side separates physical and replica apertures by one Rayleigh
        range in the focal plane, sufficient for all practical PSF work.  4×
        padding is used in high-dynamic-range coronagraph simulations.  This
        double-resolution is the same reasoning behind the zero-padding in the{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr">
          FFT epicycles tutorial
        </Link>
        .
      </p>

      <h2>Blender height-field construction</h2>
      <p>
        All three 96 × 96 PSF arrays share identical XY vertex positions on a
        1 m × 1 m stage floor — only Z heights differ between aperture types.
        This makes them valid morph targets:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`obj = build_base_mesh(psf_circ)          # circular PSF → base geometry
add_shape_key(obj, psf_circ,  "Circular_Airy")
add_shape_key(obj, psf_hexa,  "Hexagonal_Spikes")
add_shape_key(obj, psf_annul, "Annular_Sharpened")
# foreach_set('co', flat_list) — 30× faster than per-vertex loop`}
      </pre>
      <p>
        Vertex colours (FLOAT_COLOR / POINT attribute <code>PSFIntensity</code>)
        encode a deep-blue → teal → white ramp.  The Emission shader reads this
        via <code>ShaderNodeAttribute</code> — no UV map needed.  The same
        attribute pattern is used in the{" "}
        <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr">
          Gray-Scott reaction-diffusion tutorial
        </Link>
        .
      </p>

      <h2>External sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Born, M. &amp; Wolf, E. (1999).{" "}
          <em>Principles of Optics</em>, 7th ed., §8.5.  Cambridge University
          Press.  Pre-1978 content Public Domain.{" "}
          <Link className={lk} href="https://www.cambridge.org/9781108477406">
            cambridge.org/9781108477406
          </Link>
          .  Related: Chapter 9 "Diffraction Theory of Aberrations"; Chapter 10
          "Interference with Partially Coherent Light".
        </li>
        <li>
          NIST DLMF §10.21 "Zeros of Bessel Functions J₁" — Airy ring positions.
          Public Domain (US Government).{" "}
          <Link className={lk} href="https://dlmf.nist.gov/10.21">
            dlmf.nist.gov/10.21
          </Link>
          .  Related:{" "}
          <Link className={lk} href="https://dlmf.nist.gov/10">
            DLMF §10 Bessel Functions
          </Link>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    directory:  "blends/scripting/python-numpy-fraunhofer-diffraction-fft-aperture-psf-airy-disk-stage-floor-webxr",
    software:   ["Blender 5.1", "numpy (bundled with Blender)"],
    time:       "20 minutes",
    difficulty: "advanced",
    cost:       "nil — Python + Blender only",
    supplies: {
      materials: [],
      tools: ["Blender 5.1", "numpy (bundled with Blender)"],
    },
    steps: [
      {
        title: "Open the Scripting workspace",
        body:  "Launch Blender 5.1.  Switch to the Scripting workspace.  Create a new text block and save the .blend to a local folder.",
      },
      {
        title: "Paste and run blueprint.py",
        body:  "Copy blueprint.py into the Text Editor and press Alt+P.  The console should print: '[blueprint] Done — holoflow:facet=True stage floor ready.'  Expect 2–5 s on a modern CPU.",
      },
      {
        title: "Inspect the PSF mesh",
        body:  "Switch to the 3D Viewport, Numpad 7 (top view), Numpad 5 (orthographic).  Enable Viewport Shading → Material Preview (sphere icon) to see the blue-white Airy disk emission.",
      },
      {
        title: "Scrub the shape keys",
        body:  "Open Properties → Object Data → Shape Keys.  Dial Hexagonal_Spikes from 0 → 1 to morph from Airy rings to 6-spike diffraction.  Dial Annular_Sharpened to see the narrowed core.",
      },
      {
        title: "Run record.py",
        body:  "Load record.py in a second text block; press Alt+P.  This keyframes the three-state morph over 150 frames and renders viewport.mp4 via Workbench.",
      },
      {
        title: "Follow SCREEN-RECORDING-NOTES.md",
        body:  "Configure OBS with Blender window capture at 1920×1080, 30 fps.  Record theory walkthrough, live script run, and shape-key morphing.  Save as screen.mp4.",
      },
      {
        title: "Export GLB",
        body:  "File → Export → glTF 2.0.  Format = GLB, Draco level 6, Morph Targets ✓, Vertex Colors ✓, Apply Transforms ✓.  Save as hf_fraunhofer_psf.glb.",
      },
      {
        title: "Verify in the Three.js viewer",
        body:  "Load hf_fraunhofer_psf.glb in the Holoflow Three.js viewer.  Confirm three morph targets are listed and the emission gradient is visible without a UV map.",
      },
    ],
  },
  {
    slug:    SLUG,
    title:   TITLE,
    date:    "2026-08-08",
    kind:    "tutorial",
    excerpt: LEDE,
    Body,
  },
);

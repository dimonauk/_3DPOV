import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-phyllotaxis-golden-angle-torus-spiral-sculpture-webxr";

const TITLE =
  "Python — Phyllotaxis: Golden Angle Spiral, Fibonacci Parastichies & Torus Lattice Sculpture for WebXR (Blender 5.1)";

const LEDE =
  "Phyllotaxis is the botanical law governing leaf and seed placement. Every sunflower packs its seeds by rotating each successive floret by the golden angle α = 2π/φ² ≈ 137.508° — the angle hardest to approximate by any rational fraction, so no pair of florets ever clusters on a spoke. This tutorial implements the Vogel 1979 polar model in pure Python/BMesh, explains why Fibonacci numbers 8, 13, 21, 34 appear as spiral arm counts (parastichies emerge from the continued-fraction convergents to 1/φ²), and maps the same lattice onto a torus surface via Weyl's equidistribution theorem. Output: two EEVEE-Next WebXR sculptures — an octagonal-pillar sunflower disk and a spiky golden-spiral torus.";

function Body() {
  return (
    <>
      <p>
        Count the spirals in a sunflower head. Some run clockwise, some
        counter-clockwise. The counts — almost always consecutive Fibonacci
        numbers (21 and 34, or 34 and 55 in a large bloom) — are not an
        accident. They fall directly out of one irrational number.
      </p>

      <h2>Why the golden angle packs most uniformly</h2>
      <p>
        The golden ratio φ = (1+√5)/2 has continued-fraction expansion
        [1;1,1,1,...] — every partial quotient is 1, making it harder to
        approximate by rationals than any other positive irrational (Hurwitz
        1891). The golden angle α = 2π/φ² ≈ 137.508° inherits this
        property: rotating by n·α avoids every periodic resonance.
      </p>
      <pre>{`α = 2π / φ²  ≈  2.39996 rad  =  137.508°
φ = (1+√5)/2 ≈  1.61803`}</pre>
      <p>
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-halton-sequence-fibonacci-sphere-lattice-scatter-poi-webxr"
          className={lk}
        >
          Halton low-discrepancy sequence tutorial
        </Link>
        : Halton base-2/3 sequences enforce uniformity by digit-reversal
        over two coprime bases. Phyllotaxis achieves the same effect with a
        single angle — one irrational constant rather than two integer bases.
        Halton produces a grid-like lattice; the phyllotaxis spiral has full
        rotational symmetry.
      </p>

      <h2>Vogel 1979 polar model</h2>
      <p>
        Vogel's model (
        <em>Mathematical Biosciences</em> 44, 1979) maps floret n to:
      </p>
      <pre>{`r(n) = C · √n      (uniform area density — equal area per floret)
θ(n) = n · α       (golden-angle rotation)`}</pre>
      <p>
        The √n radial rule is critical. In polar area, the annular ring from
        r=√n to r=√(n+1) has area π, independent of n. Placing exactly one
        floret per ring gives constant packing density — matching the biology,
        where each seed occupies the same physical area. Any other exponent
        either clusters florets at the centre or piles them at the edge.
      </p>
      <p>
        Fibonacci parastichies appear because the Fibonacci numbers 5, 8, 13,
        21, 34, 55 are the denominators of the continued-fraction convergents
        to α/(2π) = 1/φ². At F_k florets the angular spacing is a near-integer
        multiple of the circumference — the eye reads this near-resonance as a
        spiral arm. Two consecutive Fibonacci numbers appear because the two
        solutions of the Descartes-style convergence give both chiralities.
        This is the same golden-ratio structure visible in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-penrose-p3-rhombus-quasicrystal-stage-floor-webxr"
          className={lk}
        >
          Penrose P3 quasicrystal
        </Link>
        , whose inflation ratio is also φ.
      </p>

      <h2>Single-BMesh construction</h2>
      <p>
        Each floret is an extruded regular octagon (SEG = 8). The{" "}
        <code>_floret()</code> helper builds bottom ring, top ring, and side
        quads into a shared BMesh. A Gram-Schmidt step keeps the tangent frame
        orthogonal even under floating-point drift:
      </p>
      <pre>{`t = (tangent − tangent·normal · normal).normalised()
b = normal × t`}</pre>
      <p>
        Batching all 500 florets into one BMesh avoids the cost of 500
        separate <code>bpy.ops.object.add</code> calls — each requiring a
        full UI-context round-trip. The same strategy batches 1,400 cylinders
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-apollonian-circle-packing-soddy-descartes-stage-floor-webxr"
          className={lk}
        >
          Apollonian circle packing tutorial
        </Link>
        .
      </p>

      <h2>Torus phyllotaxis and Weyl's theorem</h2>
      <p>
        The same principle extends to a curved surface. Floret n sits at:
      </p>
      <pre>{`azimuthal v = n · α      (wraps the big circle)
poloidal  u = n · α/φ   (wraps the tube)`}</pre>
      <p>
        Weyl's equidistribution theorem (1916) guarantees (nα, nβ) fills the
        2-torus uniformly whenever α/β is irrational — here α/β = φ.
        Each floret is oriented along the torus outward normal
        n̂ = cos(u)·r̂ + sin(u)·ẑ and extruded outward, producing a
        sea-urchin-like spiky torus that reads well in WebXR. The torus
        surface parameterisation uses exactly the frame derived in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr"
          className={lk}
        >
          torus knot parallel-transport tutorial
        </Link>
        .
      </p>

      <h2>Outside sources and attribution</h2>
      <ul>
        <li>
          H. Vogel (1979).{" "}
          <em>A better way to construct the sunflower head.</em>{" "}
          Mathematical Biosciences 44 (3–4): 145–199.
          Mathematical content public domain.{" "}
          <a
            href="https://en.wikipedia.org/wiki/Fermat%27s_spiral"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Wikipedia — Fermat spiral / Vogel model
          </a>
        </li>
        <li>
          Adrien Douady &amp; Jacques Couder (1992).{" "}
          <em>
            Phyllotaxis as a Physical Self-Organised Growth Process.
          </em>{" "}
          Physical Review Letters 68 (13): 2098–2101. Mathematical
          content public domain.{" "}
          <a
            href="https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.68.2098"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            PRL 68 2098
          </a>
        </li>
        <li>
          NumPy (BSD-3-Clause).{" "}
          <a href="https://numpy.org" className={lk} target="_blank" rel="noreferrer">
            numpy.org
          </a>{" "}
          —{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/numpy/numpy
          </a>
        </li>
      </ul>
    </>
  );
}

const blenderTutorialPythonNumpyPhyllotaxisGoldenAngleTorusSpiralSculptureWebxrEntry: Entry =
  buildInstructable(
    {
      steps: [
        {
          title: "Run blueprint.py",
          body: "Open Scripting workspace. Paste or open blueprint.py. Run Script. Console prints '[hf] disk florets: 500  torus florets: 300'. Both objects appear in viewport — disk at X=+3.2, torus at origin.",
        },
        {
          title: "Inspect disk parastichies",
          body: "Switch to Rendered view (Z → Rendered), EEVEE Next. Look down on disk from above. Count the clockwise and counter-clockwise spiral arms — you should see 13 and 21 (consecutive Fibonacci numbers). Zoom into centre: florets smallest and densest there, confirming √n area-density law.",
        },
        {
          title: "Orbit torus",
          body: "Select torus object. Middle-mouse-drag to orbit. Observe florets covering the surface without visible gaps or bunching. The poloidal winding (u = n·α/φ) distributes them in both angular directions simultaneously.",
        },
        {
          title: "Adjust parameters",
          body: "To see more Fibonacci arms: increase N_DISK to 2000, reduce DISK_SCALE to 0.055. Arms 34/55 become visible. To increase torus density: increase N_TORUS to 600, reduce T_FLORET_R to 0.038 to avoid overlap.",
        },
        {
          title: "Export GLB",
          body: "blueprint.py auto-exports hf_phyllotaxis.glb (torus only) with Draco-6, WEBP, Y-up. To also export disk: select disk + torus, set use_selection=True and export separately or remove use_selection.",
        },
        {
          title: "Run record.py",
          body: "Run record.py after blueprint.py builds the scene. Renders 120 frames: F1-40 overhead disk, F41-80 side orbit of torus, F81-120 two-shot pull-back. Output: public/library/videos/scripting/.../viewport.mp4.",
        },
      ],
      troubleshooting: [
        {
          symptom: "Script error: 'NoneType has no attribute normalized'",
          cause: "Tangent vector is zero-length (r=0 at n=0).",
          fix: "Loop starts at n=1 in build_disk(). If you added n=0, skip it or add a guard: if r < 1e-6: continue.",
        },
        {
          symptom: "Torus florets intersect or overlap",
          cause: "T_FLORET_R too large relative to floret spacing at given N_TORUS.",
          fix: "Reduce T_FLORET_R. Rule of thumb: T_FLORET_R < 0.5 · (2π·TORUS_R_MINOR / N_TORUS)^0.5.",
        },
        {
          symptom: "GLB export fails: no active object",
          cause: "bpy.context.view_layer.objects.active not set before export.",
          fix: "Confirm main() sets bpy.context.view_layer.objects.active = torus after select.",
        },
        {
          symptom: "Fibonacci arms not visible in disk",
          cause: "Too few florets — 13/21 arms need at least 200 florets to be visible.",
          fix: "Increase N_DISK to 400+, or view from directly above with no perspective distortion.",
        },
      ],
      voiceMode: "aura",
    },
    {
      slug: SLUG,
      title: TITLE,
      date: "2026-08-01",
      kind: "tutorial",
      excerpt: LEDE,
      tags: [
        "blender",
        "python",
        "phyllotaxis",
        "golden-angle",
        "fibonacci",
        "torus",
        "sculpture",
        "procedural",
        "webxr",
        "bmesh",
        "vogel",
        "parastichies",
        "spiral",
        "geometry",
      ],
      Body,
    },
  );

export const entry =
  blenderTutorialPythonNumpyPhyllotaxisGoldenAngleTorusSpiralSculptureWebxrEntry;

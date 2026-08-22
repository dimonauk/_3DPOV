import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-newton-fractal-basin-attraction-complex-roots-stage-floor-webxr";

const TITLE =
  "Python numpy — Newton Fractal: Basin of Attraction, Complex Root-Finding " +
  "& Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "Newton's method applied to p(z) = z^n − 1 in the complex plane divides " +
  "every starting point into one of n basins — one per root of unity — and " +
  "the boundary between them is a fractal Julia set of Hausdorff dimension > 1. " +
  "This blueprint iterates a 256×256 grid of complex seeds under the simplified " +
  "Newton map N(z) = ((n−1)·z^n + 1)/(n·z^(n−1)), colours each vertex by the " +
  "root it reached, and encodes slow convergence (boundary proximity) as ridge " +
  "height. Shape keys morph the floor between z^3−1, z^5−1, and z^7−1 — " +
  "three-fold, five-fold, and seven-fold symmetry — ready for a live WebXR " +
  "remix at runtime.";

function Body() {
  return (
    <>
      <p>
        Newton&apos;s root-finding algorithm is designed to converge — but in
        the complex plane it can converge to any of the n roots, and the set of
        starting points that converge to a given root is its{" "}
        <em>basin of attraction</em>. For n ≥ 3, no root&apos;s basin is
        simply connected: every basin boundary point is a limit of points from
        all other basins simultaneously. That boundary is the{" "}
        <em>Julia set of the Newton map</em>, a fractal.
      </p>

      <h2>The Newton map as a rational function on ℙ¹(ℂ)</h2>
      <p>
        For p(z) = z^n − 1, the derivative is p&apos;(z) = n·z^(n−1), giving:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`N(z) = z − p(z)/p'(z)
     = z − (z^n − 1) / (n·z^(n−1))
     = ((n−1)·z^n + 1) / (n·z^(n−1))`}
      </pre>
      <p>
        This compact form avoids catastrophic cancellation near a root: when z
        ≈ root, both numerator and denominator approach zero at the same rate,
        so the ratio remains numerically stable. The code guards the denominator
        with a floor of 1e-12 to skip the single-point singularity at z = 0.
      </p>
      <p>
        N(z) is a degree-n rational map on the Riemann sphere ℙ¹(ℂ). Its n
        fixed points are the roots of unity. Iteration from almost every
        starting point converges to one of them — but the measure-zero set
        where it does not (the Julia set) has Hausdorff dimension strictly
        between 1 and 2.
      </p>

      <h2>Why the basin boundary is fractal</h2>
      <p>
        Sutherland (1989) proved that for n ≥ 3 the Julia set of the Newton map
        of z^n − 1 is connected and has no interior — it is a{" "}
        <em>dendrite</em>. Near any boundary point the map exhibits sensitive
        dependence on initial conditions: an arbitrarily small perturbation can
        redirect the orbit to any of the n roots. This is structurally different
        from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-mandelbulb-power8-triplex-de-orbit-trap-webxr"
          className={lk}
        >
          Mandelbulb
        </Link>
        , which iterates z ↦ z^8 + c with escape-time colouring, or the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-kleinian-limit-set-schottky-group-indras-pearls-poi-webxr"
          className={lk}
        >
          Kleinian limit set
        </Link>
        , which arises from group-word enumeration of Möbius maps. Newton
        fractals are the only common fractal family that originates from a
        numerical algorithm rather than from iteration of a single map for its
        own sake.
      </p>

      <h2>Vectorised numpy iteration</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`lin       = np.linspace(-2.2, 2.2, 256)
Re, Im    = np.meshgrid(lin, lin)
z         = Re + 1j * Im
roots     = np.exp(2j * np.pi * np.arange(n) / n)
active    = np.ones((256,256), dtype=bool)

for k in range(MAX_ITER):
    zn  = np.where(active, z**n,     1.0)   # avoid wasted pow on done pixels
    zn1 = np.where(active, z**(n-1), 1.0)
    z[safe] -= (zn[safe] - 1.0) / (n * zn1[safe])
    for r, root in enumerate(roots):
        hit          = active & (np.abs(z - root) < 1e-8)
        basin[hit]   = r
        active[hit]  = False`}
      </pre>
      <p>
        The early-exit <code>active</code> mask is essential: once a pixel
        converges it stops being updated, so later iterations only process the
        frontier pixels. On a 256×256 grid this halves wall-clock time versus a
        naïve all-pixel loop.
      </p>

      <h2>Height encoding — convergence speed as ridge</h2>
      <p>
        The basin boundary is where convergence is slowest (high iteration
        count). Encoding speed as height{" "}
        <code>z = (1 − iter/MAX_ITER) × 0.40</code> places the fractally
        sharp ridges at the boundary and leaves the basin interiors nearly flat
        — the same design principle used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-apollonian-circle-packing-soddy-descartes-stage-floor-webxr"
          className={lk}
        >
          Apollonian floor
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr"
          className={lk}
        >
          Gray–Scott reaction-diffusion field
        </Link>
        .
      </p>

      <h2>Vertex colour and palette</h2>
      <p>
        Each basin index maps to a hue in the studio&apos;s cyan-magenta system
        (cyan → magenta-pink → amber → lime → violet for z^5 − 1). The colour
        attribute is a <code>FLOAT_COLOR / POINT</code> domain attribute, which
        the glTF exporter writes as <code>COLOR_0</code> with full float
        precision. Pixels that never converge (z = 0 exactly) remain white —
        visible as a tiny white dot at the singularity of N.
      </p>

      <h2>Shape keys for z^3−1 and z^7−1</h2>
      <p>
        The basis mesh is z^5 − 1. Two morph targets reshape the height field:
        <code>roots_3</code> for three-fold symmetry, <code>roots_7</code> for
        seven-fold. Only the Z coordinate changes between shape keys; the vertex
        colour (basin colouring) is baked to the degree-5 basis and
        interpolates visually during the morph. In WebXR the GLB loader can
        drive both shape keys from a <code>THREE.AnimationMixer</code> channel.
      </p>
      <p>
        Compare with the degree-varying morphs in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-ikeda-map-complex-laser-cavity-attractor-basin-poi-webxr"
          className={lk}
        >
          Ikeda map tutorial
        </Link>
        , where the morph parameter is the control value b rather than the
        polynomial degree.
      </p>

      <h2>Connection to Möbius geometry</h2>
      <p>
        The Newton map N(z) is a rational degree-n map, and rational maps on
        ℙ¹(ℂ) are the natural domain of the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
          className={lk}
        >
          Möbius transformation gallery
        </Link>
        . A Möbius map is the degree-1 case: one fixed point, trivially a
        basin the size of the whole sphere minus the repeller. The Newton
        fractal is what emerges when degree rises above 2 and the basin
        boundary stops being a circle.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>All vertices are white:</strong> the <code>FLOAT_COLOR</code>{" "}
          attribute was not written — check the Blender version is ≥ 3.5.
        </li>
        <li>
          <strong>No ridges visible:</strong> increase <code>MAX_ITER</code>{" "}
          from 100 to 200; pixels at the boundary converge very slowly and may
          be mapped to count=0 too early.
        </li>
        <li>
          <strong>GLB has no morph targets:</strong> confirm{" "}
          <code>export_morph=True</code> in the glTF exporter call. The default
          is True in Blender 5.1 but was False in 3.x.
        </li>
        <li>
          <strong>Script takes &gt;60 s:</strong> reduce{" "}
          <code>GRID_N</code> to 128 for a draft run; the full 256×256 grid
          iterates ~6.5 M complex numbers per Newton step.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul>
        <li>
          <strong>Sutherland (1989)</strong> — proof that Newton basins for
          z^n − 1, n ≥ 3, form a connected Julia set.{" "}
          <a
            href="https://link.springer.com/article/10.1007/BF01048759"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ergodic Theory Dynam. Systems 9(2)
          </a>
          . Academic reference.
        </li>
        <li>
          <strong>njanakiev/blender-scripting</strong> — MIT — Nicolas Janakiev.{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/njanakiev/blender-scripting
          </a>
          . Height-field mesh-from-data patterns. Related:{" "}
          <a
            href="https://github.com/njanakiev/parametric-pillows"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/parametric-pillows
          </a>
          .
        </li>
        <li>
          <strong>NumPy</strong> — BSD-3-Clause — NumPy contributors.{" "}
          <a
            href="https://numpy.org/doc/stable/user/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org/doc/stable
          </a>
          . Vectorised complex arithmetic. Related:{" "}
          <a
            href="https://github.com/scipy/scipy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            scipy/scipy
          </a>
          .
        </li>
      </ul>

      <h2>Related tutorials</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mandelbulb-power8-triplex-de-orbit-trap-webxr"
            className={lk}
          >
            Mandelbulb Power-8
          </Link>{" "}
          — also uses iteration-count coloring; compare escape-time (Mandelbulb)
          versus convergence-speed (Newton) encoding.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-apollonian-circle-packing-soddy-descartes-stage-floor-webxr"
            className={lk}
          >
            Apollonian Circle Packing
          </Link>{" "}
          — another stage floor with complex-plane geometry; Apollonian gaskets
          are limit sets of Kleinian groups, Newton basins are Julia sets —
          both live on ℙ¹(ℂ).
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-shader-to-rgb-halftone-cel-shade-webxr"
            className={lk}
          >
            Shader-to-RGB Halftone Cel-Shade
          </Link>{" "}
          — apply the cel-shade ramp over the vertex-colour palette for a
          stylised look in Eevee.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon",
    difficulty: "advanced",
    cost: "nil — Python + Blender only",
    supplies: {
      materials: [],
      tools: ["Blender 5.1", "numpy (bundled with Blender)"],
    },
    steps: [
      {
        title: "Open Scripting workspace",
        body: "Launch Blender 5.1. Switch to the Scripting workspace. Create a new text datablock.",
      },
      {
        title: "Paste and run blueprint.py",
        body: "Copy blueprint.py into the text editor. Press Alt+P. The script runs ~20 s on an 8-core CPU. Confirm the console prints '[newton] ✓ exported //hf_newton_basin.glb'.",
      },
      {
        title: "Inspect the mesh",
        body: "Switch to 3D Viewport → Material Preview mode (Z → Material Preview). You should see five coloured basins (cyan, magenta-pink, amber, lime, violet) with sharp white ridges at the fractal boundary. Press Numpad 7 for top-down view.",
      },
      {
        title: "Try the shape key morphs",
        body: "Open Object Properties → Shape Keys. Drag 'roots_3' from 0 to 1 to see the three-basin z^3−1 topology emerge. Return to 0, then try 'roots_7' for seven basins.",
      },
      {
        title: "Run record.py",
        body: "Load record.py into the text editor and press Alt+P. This bakes the 90-frame shape-key animation and writes viewport.mp4 via Workbench renderer.",
      },
      {
        title: "Screen-record",
        body: "Follow SCREEN-RECORDING-NOTES.md to capture a 4-minute OBS recording: blueprint run, basin inspection, shape-key morphs, top-down view, record.py playback.",
      },
      {
        title: "Save the .blend",
        body: "File → Save As → hf_newton_basin.blend in the same directory.",
      },
    ],
  },
  {
    slug: SLUG,
    title: TITLE,
    date: "2026-08-02",
    kind: "tutorial",
    excerpt: LEDE,
    Body,
  },
);

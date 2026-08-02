import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-ikeda-map-complex-laser-cavity-attractor-basin-poi-webxr";

const TITLE =
  "Python numpy — Ikeda Map: Complex Laser Cavity Attractor, Chaotic Basin Fractal & Orbit-Density Relief for WebXR (Blender 5.1)";

const LEDE =
  "Kensuke Ikeda's 1979 recurrence z_{n+1} = a + b·z·exp(i·(c − d/(1+|z|²))) " +
  "models the complex field amplitude inside a ring laser cavity: the Kerr " +
  "medium applies intensity-dependent phase shift d/(1+I), bounding orbits " +
  "via nonlinear saturation. For b ≥ 0.6 the map turns chaotic; at b = 0.9 " +
  "the strange attractor is a product of a Cantor set and a smooth curve — " +
  "Hausdorff dimension ≈ 1.7 — whose horseshoe geometry looks exactly like " +
  "the long-exposure photograph of poi spinning a sustained butterfly. This " +
  "blueprint iterates 180 000 seeds for 1 000 steps, log-compresses the " +
  "density histogram, drapes it over a 120×120 height-field quad mesh with " +
  "three b-value shape keys (0.70 / 0.85 / 0.92) and cyan–magenta FLOAT_COLOR " +
  "vertex colours, then exports a Draco-6 WebP GLB for WebXR.";

function Body() {
  return (
    <>
      <p>
        A <em>ring laser</em> recirculates a coherent pulse. Each roundtrip
        through the Kerr medium shifts the phase by d/(1+|z|²); the cavity
        reintroduces offset a. Sampling the amplitude once per roundtrip gives:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`z_{n+1} = a + b · z_n · exp(i · t_n)
t_n     = c − d / (1 + |z_n|²)
a=1.0  b=0.9  c=0.4  d=6.0`}
      </pre>
      <p>
        The <code>d/(1+I)</code> saturation is what makes this physically
        realistic — without it b &gt; 0 would let every orbit escape to infinity.
        With it, the map is dissipative (volume-contracting) and the attractor
        is bounded.
      </p>

      <h2>Contrast with Hénon and Duffing</h2>
      <p>
        The{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-henon-map-strange-attractor-fractal-basin-poi-webxr" className={lk}>
          Hénon map
        </Link>{" "}
        is a real 2D polynomial with no physical derivation. The{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr" className={lk}>
          Duffing oscillator
        </Link>{" "}
        is a continuous ODE sampled via Poincaré section. The Ikeda map lives
        in the <em>complex amplitude plane of a coherent laser state</em> — its
        state space is physically meaningful. Rewriting with z = x+iy gives a
        vectorisable real form for numpy:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`t = c − d/(1+x²+y²)
x' = a + b·(x·cos t − y·sin t)
y' =     b·(x·sin t + y·cos t)`}
      </pre>

      <h2>Density histogram and log-compression</h2>
      <p>
        After N_WARMUP = 600 steps each seed lands on the attractor. The next
        N_TRAIL = 400 steps accumulate 72 M points. The central filament is
        ~200× denser than the outer structure; a raw histogram renders only
        one bright strand:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`H, _, _ = np.histogram2d(pts.real, pts.imag, bins=GRID_N, ...)
H_log   = np.log1p(H)          # log(1+x): zeros stay zero, peaks compress
H_norm  = H_log / H_log.max()  # → [0, 1]`}
      </pre>
      <p>
        <code>np.log1p</code> over <code>np.log</code>: empty bins (outside
        attractor support) stay exactly 0, not −∞.
      </p>

      <h2>Bifurcation shape keys</h2>
      <p>
        Three shape keys capture the period-doubling route to chaos:
      </p>
      <ul>
        <li>
          <strong>b = 0.70</strong> — period-2 orbit. Two elliptical ridges,
          geometry identical to a poi butterfly figure-of-eight.
        </li>
        <li>
          <strong>b = 0.85</strong> — period-4 sub-ridges; fractal structure
          emerges at the lobe edges.
        </li>
        <li>
          <strong>b = 0.92</strong> — full strange attractor, horseshoe lobe
          plus fractal satellite clusters.
        </li>
      </ul>
      <p>
        Morphing these in the WebXR viewer gives a real-time bifurcation diagram
        in 3D relief — compare to the frequency-locking structure in the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-arnold-tongue-circle-map-mode-locking-poi-disc-webxr" className={lk}>
          Arnold tongue tutorial
        </Link>
        .
      </p>

      <h2>Vertex colours: FLOAT_COLOR not BYTE_COLOR</h2>
      <p>
        The colour attribute uses <code>FLOAT_COLOR</code> domain{" "}
        <code>POINT</code> (32-bit float per vertex). With 14 400 vertices and
        a smooth density gradient, 8-bit BYTE_COLOR introduces banding across
        the shallow outer slopes. FLOAT_COLOR exports as 32-bit vertex colours
        in the GLB and Eevee renders them without quantisation artefacts.
        Density d maps to a cyan–magenta ramp:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`R = d            # 0=cyan, 1=magenta
G = √(1−d)       # sqrt: perceptual midpoint near d=0.5
B = 1 − d·0.5   # stays bright; drops at high-density peaks`}
      </pre>

      <h2>Poi connection</h2>
      <p>
        The attractor at b = 0.9 has two bright lobes connected by a dim crossing
        strand — exactly the geometry of a sustained poi butterfly: bright dwell
        zones at each tip, faint crossing paths. Both systems are dissipative
        2D maps with one contracting direction; their Poincaré sections are
        homeomorphic at period-2. The laser cavity makes the chaos visible in
        photons, poi makes it visible in fire — the attractor shape is the
        same.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Flat mesh:</strong> b ≥ 1 — seeds escaped. Keep b &lt; 1.
        </li>
        <li>
          <strong>Single bright spike:</strong> D &lt; 1 — saturation fails.
          Increase D toward 6.
        </li>
        <li>
          <strong>Shape keys missing in GLB:</strong> add{" "}
          <code>export_morph=True</code> to the exporter call.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul>
        <li>
          <strong>Ikeda (1979)</strong> — original ring-cavity map derivation.{" "}
          <a href="https://www.sciencedirect.com/science/article/pii/0030401879901722" className={lk} target="_blank" rel="noopener noreferrer">
            Optics Communications 30(2)
          </a>. Academic reference.
        </li>
        <li>
          <strong>njanakiev/blender-scripting</strong> — MIT — Nicolas Janakiev.{" "}
          <a href="https://github.com/njanakiev/blender-scripting" className={lk} target="_blank" rel="noopener noreferrer">
            github.com/njanakiev/blender-scripting
          </a>
          . Mesh-from-data patterns. Related: njanakiev/parametric-pillows.
        </li>
        <li>
          <strong>NumPy</strong> — BSD-3-Clause — NumPy contributors.{" "}
          <a href="https://numpy.org/doc/stable/user/" className={lk} target="_blank" rel="noopener noreferrer">
            numpy.org/doc/stable
          </a>
          . Related: <a href="https://github.com/scipy/scipy" className={lk} target="_blank" rel="noopener noreferrer">scipy/scipy</a>.
        </li>
      </ul>

      <h2>Related tutorials</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-kleinian-limit-set-schottky-group-indras-pearls-poi-webxr" className={lk}>
            Kleinian Limit Set: PSL(2,ℂ) Word Enumeration & Fractal Dust
          </Link>{" "}
          — shares the Cantor-set factor; compare fractal dust topologies.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr" className={lk}>
            Möbius Transformation Gallery
          </Link>{" "}
          — the Ikeda map is a composition of Möbius maps plus a nonlinear
          phase rotation.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shader-to-rgb-halftone-cel-shade-webxr" className={lk}>
            Shader-to-RGB Halftone Cel-Shade
          </Link>{" "}
          — the cyan–magenta palette used here matches the studio's cel-shade ramp.
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
        body: "Copy blueprint.py into the text editor. Press Alt+P. The script runs ~15 s on an 8-core CPU. Confirm the console prints '[ikeda] exported hf_ikeda.glb'.",
      },
      {
        title: "Inspect the mesh and shape keys",
        body: "Switch to 3D Viewport → Material Preview. Drag b=0.70 → 1.0 to see the period-2 ridges, then b=0.92 → 1.0 for the full strange attractor.",
      },
      {
        title: "Run record.py",
        body: "Load and run record.py to bake the 90-frame shape-key animation and write viewport.mp4.",
      },
      {
        title: "Screen-record",
        body: "Follow SCREEN-RECORDING-NOTES.md to capture a 3–4 min OBS recording showing the blueprint run, shape-key morph, and animation playback.",
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

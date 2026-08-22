import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        In 2011 Stephan Rafler published a deceptively short paper on arXiv:
        what if every cell in Conway's Game of Life held a real number instead
        of a single bit, and the neighbourhood were a pair of concentric disks
        instead of eight adjacent squares? The result — SmoothLife — produces
        perpetually moving, self-organising structures that look nothing like
        the ticking pixels of the original: organic gliders drift across the
        field, pulsing rings expand and collide, and branching filaments trace
        paths that dissolve and re-form. The blueprint below runs the full
        simulation inside Blender's Python environment using numpy FFT
        convolution, then maps each snapshot to a shape-key timeline and
        exports an animated GLB for WebXR.
      </p>
      <p>
        SmoothLife lifts two discrete constraints simultaneously. First, cell
        state is a <em>real value</em> s ∈ [0, 1]: a cell can be 0.63 alive.
        Second, the neighbourhood is defined by two continuous radii —
        inner disk r&lt;ri (average = <code>n</code>, "the cell itself")
        and annular ring ri ≤ r &lt; ra (average = <code>m</code>,
        "the surroundings"). The transition is smooth sigmoid arithmetic rather
        than a lookup table:
      </p>
      <pre>{`σ(x, a, α)    = 1 / (1 + exp(−4·(x−a)/α))   smooth step at x=a
σ2(x, a, b, α) = σ(x,a,α) · (1 − σ(x,b,α))  smooth window in [a, b]

alive = σ(n, 0.5, α_n)               is this cell currently "alive"?
f     = lerp( σ2(m, b1, b2, α_m),    birth:    was dead, surroundings match
              σ2(m, s1, s2, α_m),    survival: was alive, surroundings match
              alive )
s_new = clamp(s + dt · (2f − 1), 0, 1)   +1 = grow toward alive, −1 = die`}</pre>

      <h2>Why FFT convolution?</h2>
      <p>
        Both neighbourhood averages (<code>n</code> and <code>m</code>) are
        circular-window convolutions of the state grid. Naively, convolving a
        256×256 grid with a disk of radius 21 costs roughly 360 million
        multiply-adds per step. FFT convolution (compute the FFT of the grid,
        multiply by the pre-computed FFT of the kernel, inverse FFT) costs about
        9.4 million operations — a 38× gain that scales as O(N² / log N) with
        grid size. The kernels are built once at startup; every subsequent step
        is three FFTs and two pointwise multiplies.
      </p>
      <p>
        Compare this approach to the 5-point Laplacian stencil used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr"
          className={lk}
        >
          Gray-Scott Reaction-Diffusion blueprint
        </Link>{" "}
        (numpy <code>roll</code> stencil, O(N²) per step but only 4 neighbours)
        and the radial-kernel Gaussian blur in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr"
          className={lk}
        >
          Cahn-Hilliard Phase Separation blueprint
        </Link>
        . SmoothLife's annular kernel spans the entire grid at large radii,
        making stencil methods impractical and FFT convolution mandatory.
      </p>

      <h2>Initial conditions and warm-up</h2>
      <p>
        A uniform random field takes thousands of steps to develop coherent
        structures because the long-range correlation must build up from thermal
        noise. Seeding 12 random filled disks of radius ≈ ri gives the system
        enough local density for structures to emerge within the 600-step warm-up.
        Low-amplitude noise (<code>±0.01</code>) breaks any unphysical symmetry
        that the disk pattern might introduce. Change <code>SEED</code> to get a
        completely different population of gliders without altering the physics.
      </p>

      <h2>Blender mesh and shape keys</h2>
      <p>
        The script creates a 128×128 grid primitive (127 × 127 quads),
        adds a <code>Basis</code> shape key, then inserts 8 additional
        shape keys — one per SmoothLife snapshot — setting vertex Z to
        <code>state_value × DISP_SCALE</code>. A keyframe at every
        24th frame drives exactly one shape-key value to 1.0, giving a
        192-frame timeline that scrubs cleanly through the evolution.
        The final-frame concentration field is written to a <code>Col</code>{" "}
        vertex colour attribute (FLOAT_COLOR, POINT domain) which the
        Principled BSDF picks up via an Attribute node for GLB export.
      </p>
      <p>
        For a Geometry Nodes comparison of a closely related continuous
        automaton, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          GN Simulation Zone — Turing Reaction-Diffusion tutorial
        </Link>
        , which implements the Gierer-Meinhardt activator-inhibitor
        model entirely in nodes. SmoothLife cannot be replicated in
        GN without a custom kernel-convolution node because the Blur
        Attribute node only averages immediate mesh neighbours — it
        cannot simulate a continuous annular disk.
      </p>
      <p>
        The shape-key export path is identical to the one used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr"
          className={lk}
        >
          FFT Epicycles — Fourier-Series Phasor Chain
        </Link>{" "}
        tutorial. Both use <code>export_morph=True</code> in the GLTF
        exporter so Three.js can drive morph targets from an
        AnimationMixer.
      </p>

      <h2>WebXR application</h2>
      <p>
        Load the GLB into a Three.js scene and drive morph target weights
        from a clock: <code>mesh.morphTargetInfluences[i]</code> set from a
        sine curve gives a smooth breathing animation. The vertex colour
        attribute (blue → orange gradient encoding concentration) streams
        directly from <code>COLOR_0</code> in the GLTF buffer — no
        additional texture atlas required. The poi-sculptor spatial audio
        field from the{" "}
        <Link href="/lab/poi-sculptor" className={lk}>
          Poi Sculptor project
        </Link>{" "}
        can be overlaid by mapping glider position to speaker location,
        making the field reactive to the performer's movement.
      </p>
    </>
  );
}

const data = {
  title:
    "Python numpy — SmoothLife: Fourier-Domain Continuous Cellular Automaton → Animated Displaced Mesh for WebXR",
  lede:
    "Lift Conway's Game of Life to a real-valued, continuous-neighbourhood domain using FFT kernel convolution, then map the evolving glider field to Blender shape keys and export an animated GLB.",
  date: "2026-07-25",
  steps: [
    {
      title: "Install numpy in Blender",
      body: "Blender 5.1 ships numpy as part of its bundled Python. Confirm with: import numpy; print(numpy.__version__) in the Scripting workspace. No separate pip install is needed.",
    },
    {
      title: "Run blueprint.py",
      body: "Open a new general file, switch to Scripting, paste blueprint.py, and press Run Script (Alt+P). The console prints warm-up progress; after ~15–25 s (depending on CPU) the SmoothLife mesh appears in the 3D Viewport.",
    },
    {
      title: "Scrub the timeline",
      body: "Press Space to play. Frames 1–192 cycle through the 8 shape-key snapshots. Watch for the characteristic SmoothLife dynamics: a single glider-blob splits into two, rings expand and pinch off, filaments dissolve into pools.",
    },
    {
      title: "Inspect vertex colours",
      body: "Press Z → Material Preview. The vertex colour attribute Col encodes concentration as a blue (s≈0) to orange (s≈1) gradient. In Edit Mode, select any vertex and hover over the Attributes panel to read its exact s value.",
    },
    {
      title: "Export GLB",
      body: "The script auto-exports hf_smoothlife.glb to the .blend file directory with Draco level 6 compression, morph targets (export_morph=True), and WebP colour textures. In Three.js, create an AnimationMixer from the GLB clip to drive the shape-key timeline automatically.",
    },
    {
      title: "Record viewport animation",
      body: "Run record.py in the same session to generate viewport.mp4 — 192 frames at 30 fps (6.4 seconds), camera at 52° overhead tilt, Material Preview shading to display vertex colours.",
    },
  ],
  troubleshooting: [
    {
      symptom: "All cells converge to 0 or all cells converge to 1 after warm-up",
      cause:
        "Parameters B1/B2, S1/S2 are outside the operating range for the chosen RI/RA_FACTOR combination. With RI < 4 the inner-disk average becomes noisy; with RI > 14 the structures grow very slowly.",
      fix: "Reset to defaults: RI=7, B1=0.278, B2=0.365, S1=0.267, S2=0.445. If you want larger structures, increase RI to 12 and increase WARM_STEPS to 1200.",
    },
    {
      symptom: "Simulation produces NaN after a few steps",
      cause:
        "DT is too large or the initial seed has produced extreme values (s > 1 or s < 0) that the clamp failed to catch due to a floating-point accumulation error.",
      fix: "Reduce DT to 0.05. Also confirm that np.clip is applied after every step — remove any in-place arithmetic that bypasses the clamp.",
    },
    {
      symptom: "Mesh appears but Z-displacement is flat (all vertices at z=0)",
      cause:
        "The shape keys exist but DISP_SCALE is 0.0, or the state values are all near zero (automaton collapsed — see above).",
      fix: "Add print(frames[0].min(), frames[0].max()) before build_mesh(). If the range is near zero, fix the parameters first. If the range is healthy (max > 0.2), confirm DISP_SCALE = 0.45 in the constants block.",
    },
    {
      symptom: "GLB morph targets missing in Three.js",
      cause:
        "export_morph=False in the exporter call, or the GLB was exported with the Basis key only (all other keys had value 0.0 at export time).",
      fix: "Set export_morph=True and export_apply=False. The exporter includes all shape keys regardless of their current value when export_apply is disabled.",
    },
    {
      symptom: "Vertex colours not visible in Three.js",
      cause:
        "The material does not have vertexColors enabled, or the GLTF loader mapped the attribute to an unexpected slot.",
      fix: "In Three.js: material.vertexColors = true; material.needsUpdate = true. Verify the attribute name in Blender is exactly Col (capital C, no trailing space) and its domain is POINT.",
    },
    {
      symptom: "Pattern looks identical to Game of Life — sharp, binary cells",
      cause:
        "ALPHA_N and ALPHA_M are set too small (< 0.005), making the sigmoid steps effectively binary.",
      fix: "Restore ALPHA_N=0.028 and ALPHA_M=0.147. These values are carefully tuned to keep the field continuous while still producing crisp enough transitions for visible structure.",
    },
  ],
  externalLinks: [
    {
      label:
        "Rafler (2011) — Generalisation of Conway's Game of Life to a Continuous Domain — arXiv:1111.1567 — public domain mathematical result",
      href: "https://arxiv.org/abs/1111.1567",
    },
    {
      label:
        "duckythescientist/SmoothLife — Python reference implementation — MIT licence — duckythescientist",
      href: "https://github.com/duckythescientist/SmoothLife",
    },
    {
      label:
        "numpy.fft.rfft2 — 2D Real FFT — BSD-3-Clause — NumPy Developers",
      href: "https://numpy.org/doc/stable/reference/generated/numpy.fft.rfft2.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Python numpy — Gray-Scott Reaction-Diffusion: Turing Spots, Stripe Labyrinths & Displaced WebXR Mesh",
      href: "/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr",
    },
    {
      label:
        "Python numpy — FFT Epicycles: Fourier-Series Phasor Chain & Depsgraph Trail for Poi Light-Painting",
      href: "/tutorials/blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr",
    },
    {
      label:
        "Python numpy — Cahn-Hilliard Phase Separation: Spinodal Decomposition & Bicontinuous Domain for WebXR",
      href: "/tutorials/blender-tutorial-python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr",
    },
    {
      label:
        "GN Simulation Zone — Reaction-Diffusion Turing Spots (Gierer-Meinhardt in Geometry Nodes)",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-numpy-smoothlife-fourier-continuous-automaton-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "simulation",
      "physics",
      "webxr",
    ],
    body: Body,
  },
  data,
);

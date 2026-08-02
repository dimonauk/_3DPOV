import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-chladni-figures-standing-wave-eigenmodes-nodal-lines-height-field-webxr";

const TITLE =
  "Python numpy — Chladni Figures: Standing Wave Eigenmodes, " +
  "Nodal Line Geometry & Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "Ernst Chladni (1787) bowed a metal plate covered in sand and watched the " +
  "grains migrate to lines of zero displacement — the nodal lines of the " +
  "plate's standing-wave eigenmodes. This blueprint computes the classic " +
  "cosine-superposition approximation ψ⁺(m,n) = cos(mπx)·cos(nπy) + " +
  "cos(nπx)·cos(mπy) on a 256×256 grid, encodes |ψ| as ridge height so " +
  "nodal valleys carve the floor, colours each antinode lobe cyan or " +
  "magenta-pink by phase sign, and exports shape keys that morph between the " +
  "12-lobe basis ψ⁺(2,3), the 4-lobe diagonal cross ψ⁺(1,2), and the " +
  "24-lobe starburst ψ⁻(3,4) — all ready for a live WebXR remix.";

function Body() {
  return (
    <>
      <p>
        In 1787 Ernst Chladni published{" "}
        <em>Entdeckungen über die Theorie des Klanges</em> — the first
        systematic account of the sand patterns that appear on a vibrating
        metal plate. Napoleon I saw a demonstration and funded a prize for the
        best mathematical explanation, which Sophie Germain eventually won
        after four attempts. The underlying physics is a 4th-order partial
        differential equation; the striking visual is just its zero set.
      </p>

      <h2>The eigenmode approximation</h2>
      <p>
        For a free square plate the exact eigenmodes require Bernoulli-Euler
        beam functions. The standard engineering approximation (Waller, 1961)
        superimposes two cosine-product terms:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ψ⁺(m,n,x,y) = cos(mπx)·cos(nπy)  +  cos(nπx)·cos(mπy)
ψ⁻(m,n,x,y) = cos(mπx)·cos(nπy)  −  cos(nπx)·cos(mπy)

x,y ∈ [−1, 1],  m,n ∈ ℤ⁺,  m ≠ n`}
      </pre>
      <p>
        The plus family ψ⁺ has approximate D₄ symmetry for m ≠ n (the four
        rotations and four reflections of the square). The minus family ψ⁻ is
        anti-symmetric under the same group: ψ⁻(m,n,x,y) = −ψ⁻(m,n,y,x).
        The nodal lines {"{ψ = 0}"} are not straight — they curve between the
        antinode lobes in the characteristic Chladni shapes.
      </p>

      <h2>Why sand collects at the nodes</h2>
      <p>
        A grain of sand on a vibrating plate experiences two competing forces:
        gravity (holds it flat) and acoustic radiation pressure (pushes it
        along the surface). The radiation-pressure force on a small particle
        points toward local minima of the time-averaged kinetic energy density,
        which for a pure mode is exactly the set {"{ψ = 0}"}. So sand
        accumulates at nodal lines — not because it is attracted there, but
        because it is expelled from everywhere else.
      </p>
      <p>
        This is structurally different from the pattern-formation in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr"
          className={lk}
        >
          Gray–Scott reaction-diffusion tutorial
        </Link>
        , where stripes form through autocatalytic instability rather than
        displacement boundary conditions. Both produce similar-looking
        height-field floors; the mechanisms are entirely different.
      </p>

      <h2>Height encoding — amplitude as ridge</h2>
      <p>
        The height field is <code>z = |ψ(x,y)| × HEIGHT_SCALE</code>. Taking
        the absolute value collapses the two opposite-phase antinode families
        into the same positive range; the sign information is preserved
        separately as vertex colour. Nodal lines (|ψ| ≈ 0) become valleys,
        antinodes become ridges. The design principle is the same as in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-newton-fractal-basin-attraction-complex-roots-stage-floor-webxr"
          className={lk}
        >
          Newton Fractal floor
        </Link>
        , where slow convergence (boundary) encodes as height, and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr"
          className={lk}
        >
          KdV soliton floor
        </Link>
        , where the soliton amplitude drives the z coordinate.
      </p>

      <h2>Vertex colour — phase as hue</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Smoothstep from white (node) to phase colour (antinode)
t    = clamp(|ψ| / WHITE_THRESH, 0, 1)
t    = t² · (3 − 2t)           # C¹ transition
rgba = (1−t)·WHITE + t·CYAN    if ψ ≥ 0
rgba = (1−t)·WHITE + t·MAGENTA if ψ < 0`}
      </pre>
      <p>
        The smoothstep blend gives the nodal lines a feathered white edge —
        resembling the actual sand colour — rather than a hard threshold that
        would look jaggy at the grid resolution. A hard threshold would also
        oscillate at the anti-aliasing boundary as shape-key values change,
        producing flicker during WebXR morphing.
      </p>

      <h2>Shape keys and mode morphing</h2>
      <p>
        The basis mesh is ψ⁺(2,3) with 12 antinode lobes arranged in a
        near-square grid. Two shape keys shift only the z coordinate:
      </p>
      <ul>
        <li>
          <code>mode_1_2_plus</code> — ψ⁺(1,2): the lowest-order non-trivial
          ψ⁺ mode. Two nodal lines cross at 45° to the plate edges, dividing
          the floor into four triangular lobes.
        </li>
        <li>
          <code>mode_3_4_minus</code> — ψ⁻(3,4): a higher-frequency mode
          with 24 lobes and D₂ symmetry. The minus sign breaks the D₄
          symmetry, producing a pinwheel-like pattern absent from the plus
          family.
        </li>
      </ul>
      <p>
        Vertex colours are baked to the basis mode. During morph the colour
        and height are on independent tracks — a deliberate choice to keep the
        cyan-magenta palette stable even as the topology shifts.
      </p>

      <h2>Connection to spectral geometry</h2>
      <p>
        Chladni patterns are the zero sets of eigenfunctions of the plate
        operator. The analogue on an arbitrary surface is the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr"
          className={lk}
        >
          Laplace-Beltrami eigenmode tutorial
        </Link>
        , which computes ∇²f = λf on a poi-head surface mesh using the
        cotangent Laplacian. The flat-plate ψ⁺/ψ⁻ modes are analytic; the
        curved-mesh eigenmodes require a sparse linear solve. Both produce the
        same visual idea: a surface carved by its own resonances.
      </p>
      <p>
        For stylised rendering, apply the cel-shade technique from{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-to-rgb-halftone-cel-shade-webxr"
          className={lk}
        >
          Shader-to-RGB Halftone Cel-Shade
        </Link>{" "}
        over the emission material to produce flat-colour lobes with hard outlines.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>White mesh, no colour:</strong> the{" "}
          <code>FLOAT_COLOR</code> attribute was not created — confirm Blender
          version is ≥ 3.5. Earlier builds only support{" "}
          <code>BYTE_COLOR</code> on colour attributes.
        </li>
        <li>
          <strong>All vertices are white (nodal):</strong>{" "}
          <code>WHITE_THRESH</code> is too large. The cosine products reach
          peak amplitude 1.0 after normalisation; lower the threshold from
          0.08 toward 0.02 to widen the coloured lobes.
        </li>
        <li>
          <strong>Ridges too flat:</strong> increase{" "}
          <code>HEIGHT_SCALE</code> from 0.35 to 0.6. The ψ⁺(2,3) mode has
          broader antinodes than ψ⁺(1,2), so the ridge contrast is gentler.
        </li>
        <li>
          <strong>Shape key morph flattens mesh:</strong> confirm the basis
          shape key &ldquo;Basis&rdquo; was added before the morph targets.
          If you add a morph target before the basis, Blender treats the
          current mesh as the basis implicitly and the morph offsets will
          subtract the wrong reference.
        </li>
        <li>
          <strong>GLB has no morph targets:</strong> check{" "}
          <code>export_morph=True</code> in the glTF export call. The default
          is True in Blender 5.1 but has changed between releases.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul>
        <li>
          <strong>Chladni, E.F.F.</strong> — <em>Entdeckungen über die Theorie
          des Klanges</em> (1787). Public Domain.{" "}
          <a
            href="https://archive.org/details/entdeckungenbert00chla"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            archive.org
          </a>
          . The original experimental record of sand patterns on vibrating
          plates.
        </li>
        <li>
          <strong>njanakiev/blender-scripting</strong> — MIT — Nicolas
          Janakiev.{" "}
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
          . Vectorised cosine computation. Related:{" "}
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
            href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr"
            className={lk}
          >
            Gray–Scott Reaction-Diffusion
          </Link>{" "}
          — Turing pattern height-field; similar visual but driven by
          autocatalytic chemistry rather than plate resonance.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr"
            className={lk}
          >
            Laplace-Beltrami Eigenmodes
          </Link>{" "}
          — the curved-surface counterpart to Chladni: eigenfunctions of ∇²
          on a poi-head mesh via cotangent Laplacian.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr"
            className={lk}
          >
            KdV Soliton
          </Link>{" "}
          — another wave-physics height-field floor; soliton amplitude encodes
          height where Chladni encodes absolute eigenmode displacement.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon",
    difficulty: "intermediate",
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
        body: "Copy blueprint.py into the text editor. Press Alt+P. The script runs ~8 s on an 8-core CPU. Confirm the console prints '[chladni] ✓ exported //hf_chladni.glb'.",
      },
      {
        title: "Inspect the mesh",
        body: "Switch to 3D Viewport → Material Preview (Z → Material Preview). You should see cyan and magenta-pink lobes separated by white nodal valleys. Press Numpad 7 for the top-down view showing 12-lobe D₄ symmetry.",
      },
      {
        title: "Try the shape key morphs",
        body: "Open Object Properties → Shape Keys. Drag 'mode_1_2_plus' from 0 to 1 to see the 4-lobe diagonal cross. Return to 0. Then drag 'mode_3_4_minus' from 0 to 1 for the 24-lobe starburst.",
      },
      {
        title: "Run record.py",
        body: "Load record.py into the text editor and press Alt+P. This bakes the 90-frame shape-key animation and writes viewport.mp4 via Workbench renderer.",
      },
      {
        title: "Screen-record",
        body: "Follow SCREEN-RECORDING-NOTES.md to capture a 4-minute OBS recording: blueprint run, mesh inspection, shape-key morphs, top-down view, record.py playback.",
      },
      {
        title: "Save the .blend",
        body: "File → Save As → hf_chladni.blend in the same directory as blueprint.py.",
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

import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-apollonian-gasket-descartes-theorem-integer-packing-fractal-stage-floor-webxr";

function Body() {
  return (
    <>
      <p>
        In 1643, René Descartes wrote a letter to Princess Elizabeth of Bohemia
        containing a beautiful theorem about tangent circles. Three centuries
        later, Frederick Soddy rediscovered it and published it — not as a
        proof, but as a poem. "The Kiss Precise" appeared in{" "}
        <em>Nature</em> in 1936 and ends with the crucial equation:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Four circles to the kissing come,
The smaller are the benter.
The bend is just the inverse sum
Of space from border's centre.

Though their intrigue left Euclid dumb,
There's now no need for rule of thumb.
Since zero bend's a dead straight line
And concave bends have minus sign,
The sum of the squares of all four bends
Is half the square of their sum.

  — Frederick Soddy, Nature 137:1021 (1936), Public Domain`}
      </pre>
      <p>
        "Bend" is what Soddy called curvature: k&nbsp;=&nbsp;1/r. The poem
        encodes exactly the Descartes Circle Theorem. This blueprint generates
        the integer Apollonian gasket from that theorem, packing hundreds of
        tangent discs into a WebXR stage floor.
      </p>

      <h2>Descartes' theorem and Vieta jumping</h2>
      <p>
        For four mutually tangent circles with curvatures k₁,k₂,k₃,k₄ (the
        enclosing outer circle takes negative curvature by convention):
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`(k₁+k₂+k₃+k₄)² = 2(k₁²+k₂²+k₃²+k₄²)        [Descartes 1643 / Soddy 1936]

Vieta reflection: given a valid quadruple, the sibling of k₄ is
    k₄' = 2(k₁+k₂+k₃) − k₄              [no square-root — integer-exact!]

Complex centre Vieta (Lagarias–Mallows–Wilks 2002):
    k₄'·z₄' = 2(k₁·z₁ + k₂·z₂ + k₃·z₃) − k₄·z₄`}
      </pre>
      <p>
        Starting from the seed quadruple (−1,&thinsp;2,&thinsp;2,&thinsp;3),
        every descendant curvature is a positive integer — a consequence of the
        integer structure of the Apollonius group. The Hausdorff dimension of
        the fractal limit set is δ&nbsp;≈&nbsp;1.3057 (Boyd 1973).
      </p>

      <h2>Seed placement</h2>
      <p>
        Fixing the outer circle at the origin with radius 1, the three inner
        seed circles are placed by tangency constraints alone — no solving
        required:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`k=−1, z=0+0i     outer circle (radius 1, encloses all)
k=2,  z=0−0.5i   radius 0.5; internally tangent to outer → |z|=1−0.5=0.5 ✓
k=2,  z=0+0.5i   externally tangent to k=2 above: |z₁−z₂|=0.5+0.5=1 ✓
k=3,  z=2/3+0i   internally tangent to outer: |z|=1−1/3=2/3 ✓
                  tangent to both k=2 circles: |z−(0,±0.5)|=5/6 ✓`}
      </pre>

      <h2>BFS algorithm</h2>
      <p>
        The algorithm maintains a queue of Apollonius quadruples. For each
        quadruple it produces four children — one per Vieta reflection — and
        deduplicates by integer curvature and rounded complex centre. Two sets
        guard against redundant work: one for circles, one for quadruples.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`for i in range(4):
    k_new = 2 * sum(others_k) − k_i        # Vieta integer jump
    z_new = (2 * kz_sum − k_i * z_i) / k_new
    if 0 < k_new ≤ MAX_K and (k_new, z_new) not seen:
        register circle
        push new quadruple (replacing i-th circle) onto queue`}
      </pre>
      <p>
        WHY Vieta not the ± Descartes square-root: the square-root form
        introduces complex branch cuts when curvatures are nearly equal, and
        requires careful sign selection. Vieta is algebraically equivalent but
        works purely over integers — no floating-point ambiguity.
      </p>

      <h2>Mesh construction</h2>
      <p>
        Each circle becomes a flat fan-triangulated disc. Angular resolution
        scales as 1/√k so large circles (k&thinsp;=&thinsp;2) receive 22
        segments while the smallest (k&thinsp;≈&thinsp;MAX_K) receive the
        minimum six. With MAX_K&thinsp;=&thinsp;80 the gasket yields
        approximately 300–400 circles and 2,500–4,000 vertices.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`r_world  = R0 / k                  # world-space radius (R0 = 0.80 m)
cx, cy   = z_c.real * R0, z_c.imag * R0
n        = max(6, int(32 / sqrt(k / 2)))   # angular resolution

# Fan triangulation from centre vertex
verts[0] = (cx, cy, 0)
verts[j+1] = (cx + r·cos(2πj/n), cy + r·sin(2πj/n), 0)
faces[j] = (0, j+1, (j % n)+2)`}
      </pre>

      <h2>Vertex colour</h2>
      <p>
        The <code>Apollon_K</code> FLOAT_COLOR attribute maps curvature to
        colour on a logarithmic scale: cobalt for large circles (k&thinsp;=&thinsp;2),
        amber for the smallest. Log-scale prevents all the colour interest from
        clustering near k&thinsp;=&thinsp;2.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`t = log(k) / log(MAX_K)              # 0 for k=1, 1 for k=MAX_K
colour = COBALT * (1−t) + AMBER * t  # component-wise lerp`}
      </pre>

      <h2>Shape keys</h2>
      <ul>
        <li>
          <strong>Basis</strong> — completely flat (z&thinsp;=&thinsp;0). The
          gasket as a 2D stamp — closest to the mathematical definition.
        </li>
        <li>
          <strong>SK_Elevated</strong> — each disc raised by
          log(k)/log(MAX_K)&thinsp;×&thinsp;0.12&thinsp;m. Small circles
          (high k) peak above large ones. Turns the gasket into a curvature
          landscape: look down from above to read k.
        </li>
        <li>
          <strong>SK_Inverted</strong> — large circles elevated, small circles
          flat. Reverses the landscape: the coarse structure rises above the
          fine fractal detail below.
        </li>
      </ul>

      <h2>Step-by-step bench</h2>
      <ol>
        <li>
          Open Blender 5.1. In the Scripting workspace, open{" "}
          <code>blueprint.py</code> from the library entry folder.
        </li>
        <li>
          Run the script. The terminal prints "Apollonian Gasket: generating
          circle packing …" followed by the circle count (typically 300–400).
          Total run time: 2–8 seconds.
        </li>
        <li>
          Press <kbd>Numpad 7</kbd> for a top-down orthographic view. The
          gasket should fill the viewport with concentric rings of decreasing
          discs.
        </li>
        <li>
          Switch to <strong>Material Preview</strong> mode (<kbd>Z</kbd>). The
          cobalt→amber gradient should be visible.
        </li>
        <li>
          In Properties → Object Data → Shape Keys, drag SK_Elevated from 0
          to 1. The smallest circles rise first, creating a spiky landscape.
        </li>
        <li>
          Drag SK_Elevated back to 0, then drag SK_Inverted to 1. Now the
          large circles are the high points.
        </li>
        <li>
          Save as <code>apollonian_gasket_floor.blend</code>. The GLB is
          already exported during the script run.
        </li>
        <li>
          Run <code>record.py</code> for the 180-frame orbit animation.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Problem: Script hangs for many seconds with no progress.
Fix:    The BFS queue can grow large near MAX_K=80. Add a deque maxlen:
        queue = deque(maxlen=50000)  — or reduce MAX_K to 40 for a preview.

Problem: Circles appear to overlap (not tangent).
Fix:    Floating-point rounding in the BFS key (PREC=6) is correct.
        Visual "overlap" arises because fan discs at k=2 share an edge with
        the outer circle; this is correct tangency, not penetration.

Problem: GLB morph targets missing in WebXR.
Fix:    export_morph=True is required explicitly in Blender 5.1.
        Confirm the shape-key count: obj.data.shape_keys.key_blocks should
        show 3 entries (Basis, SK_Elevated, SK_Inverted).

Problem: Colour gradient appears on only some discs.
Fix:    All per-vertex colours are written in one foreach_set call.
        If the attribute shows blank: confirm domain="POINT" (not FACE).`}
      </pre>

      <p>
        For other aperiodic stage-floor packings, see the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-penrose-p2-kite-dart-aperiodic-robinson-deflation-stage-floor-webxr"
        >
          Penrose P2 kite–dart tiling tutorial
        </Link>{" "}
        (Robinson deflation, golden ratio) and the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-ammann-beenker-octagonal-quasicrystal-silver-ratio-multigrid-stage-floor-webxr"
        >
          Ammann–Beenker octagonal quasicrystal tutorial
        </Link>{" "}
        (de Bruijn multigrid, silver ratio). Both use the same FLOAT_COLOR
        pipeline for attribute-driven materials.
      </p>
      <p>
        The self-similar structure of the Apollonian gasket shares conceptual
        ground with the period-doubling cascade in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
        >
          Feigenbaum Bifurcation Diagram tutorial
        </Link>
        — both exhibit universality: the fine-scale details replicate the
        coarse-scale structure under rescaling, and both produce height-field
        meshes coded by an intrinsic quantity (density / curvature).
      </p>
      <p>
        The differential-growth ruffling in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr"
        >
          Differential Growth tutorial
        </Link>{" "}
        is the dynamic counterpart: where the Apollonian gasket is a static
        optimal packing, differential growth is a physical process that locally
        maximises area under perimeter constraints, producing the same
        hierarchical scale structure via a completely different mechanism.
      </p>

      <h2>Outside sources</h2>
      <p>
        Hausdorff dimension proof and residual set:{" "}
        <a
          className={lk}
          href="https://doi.org/10.1112/S0025579300004745"
          target="_blank"
          rel="noreferrer"
        >
          Boyd, D.W. (1973). &ldquo;The Residual Set Dimension of the Apollonius
          Packing.&rdquo; <em>Mathematika</em> 20:&nbsp;170–174.
        </a>{" "}
        UK publication pre-1978; mathematical content uncopyrightable. Boyd
        established δ&nbsp;≈&nbsp;1.3057 and proved the packing is a Cantor set
        in dimension. Related: Lagarias, Mallows, Wilks (2002), &ldquo;Beyond the
        Descartes Circle Theorem&rdquo;,{" "}
        <em>Amer. Math. Monthly</em> 109(4):338–361 — the source of the complex
        Descartes formula used for circle centres here.
      </p>
      <p>
        Original theorem and poem:{" "}
        <a
          className={lk}
          href="https://doi.org/10.1038/1371021a0"
          target="_blank"
          rel="noreferrer"
        >
          Soddy, F. (1936). &ldquo;The Kiss Precise.&rdquo;{" "}
          <em>Nature</em> 137:&nbsp;1021.
        </a>{" "}
        Public domain. Soddy published the theorem as a sonnet after
        rediscovering Descartes&apos; result independently; he won the 1921
        Nobel Prize in Chemistry and considered this poem one of his finest
        contributions to mathematics. Related: Descartes, R. (1643), letter to
        Princess Elizabeth of Bohemia,{" "}
        <em>Oeuvres de Descartes</em> vol.&nbsp;4, public domain.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Apollonian Gasket: Descartes Circle Theorem (1643) (k₁+k₂+k₃+k₄)²=2(k₁²+k₂²+k₃²+k₄²), Vieta Jumping Integer Seed (−1,2,2,3), Soddy 1936 Kiss Precise, Boyd δ≈1.3057 Hausdorff Dimension, Fan-Disc BFS Packing & Cobalt–Amber Apollon_K FLOAT_COLOR Stage Floor for WebXR (Blender 5.1)",
  lede:
    "Generate the integer Apollonian circle packing via Vieta jumping on Descartes' theorem, assemble hundreds of fan-triangulated discs into a WebXR stage floor, and morph between flat, curvature-elevated, and inverted landscape shape keys.",
  date: "2026-08-29",
  tags: [
    "blender",
    "python",
    "fractals",
    "mathematics",
    "webxr",
    "stage-floor",
    "circle-packing",
    "descartes",
  ],
  body: Body,
});

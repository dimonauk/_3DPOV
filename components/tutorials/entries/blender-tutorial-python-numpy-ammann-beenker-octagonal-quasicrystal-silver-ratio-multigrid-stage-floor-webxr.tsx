import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-ammann-beenker-octagonal-quasicrystal-silver-ratio-multigrid-stage-floor-webxr";

function Body() {
  return (
    <>
      <h2>Why eight is stranger than five</h2>
      <p>
        In 1974, Penrose proved you can tile the plane aperiodically with two
        rhombus shapes related by the golden ratio φ = (1+√5)/2. Eight years
        later, F.P.M. Beenker quietly published an eight-fold analogue: two
        tiles — a unit square and a 45°/135° rhombus — that cover the plane
        with <em>local</em> eightfold symmetry yet no global period. The
        governing constant is the{" "}
        <strong>silver ratio λ = 1 + √2 ≈ 2.414</strong>. Inflate every length
        by λ and you get a rescaled copy of the same tiling back again.
      </p>
      <p>
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-penrose-p3-rhombus-robinson-deflation-aperiodic-stage-floor-webxr"
          className={lk}
        >
          Penrose P3 stage-floor tutorial
        </Link>
        , which uses Robinson triangle deflation (a purely recursive
        algorithm). Here we take a different road entirely: de Bruijn's{" "}
        <strong>multigrid-dual</strong> method. Both approaches produce
        aperiodic tilings; only the symmetry group and the governing irrational
        differ.
      </p>
      <p>
        The Ammann-Beenker tiling is also a 2D shadow of the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-icosahedral-quasicrystal-cut-project-z6-shechtman-poi-head-webxr"
          className={lk}
        >
          cut-and-project construction from Z⁴
        </Link>
        : project the D₄ integer lattice in four dimensions through the window
        where the projected image lands inside an octagonal acceptance strip.
        The multigrid-dual we implement here is the computationally efficient
        dual of that geometric picture.
      </p>

      <h2>The de Bruijn multigrid dual</h2>
      <p>
        Nikolas de Bruijn (1981) realised that any regular multigrid — a
        superposition of K families of equally-spaced parallel lines — has a
        natural{" "}
        <strong>dual tiling</strong>. Each connected region of the multigrid
        (a pocket between lines) maps to one vertex of the tiling; adjacent
        pockets connected by one tile edge.
      </p>
      <p>
        For the Ammann-Beenker we use <strong>K = 4</strong> families at
        angles 0°, 45°, 90°, 135°. The four unit direction vectors are:
      </p>
      <pre>{`E[k] = exp(i·π·k/4)   k = 0, 1, 2, 3`}</pre>
      <p>
        Each family has parallel lines at positions{" "}
        <code>Re(z · conj(E[k])) = n + GAMMA</code> for integer n (GAMMA = 0.5
        keeps the origin inside a tile, guaranteeing{" "}
        <em>general position</em>: no three lines ever meet at one point).
      </p>
      <p>
        At each grid-line intersection of families j and k, four pockets meet
        and one tile is born. The tile type:
      </p>
      <ul>
        <li>
          <code>|k − j| mod 4 == 2</code> → families at 90° →{" "}
          <strong>unit square</strong>
        </li>
        <li>
          <code>|k − j| mod 4 == 1</code> → families at 45° →{" "}
          <strong>unit rhombus</strong> (angles 45°/135°)
        </li>
      </ul>

      <h2>The index formula</h2>
      <p>
        The crucial insight: because no family-l line passes through the
        intersection z<sub>int</sub> of families j and k (general position), all
        four surrounding pockets lie on the <em>same side</em> of every
        family-l line. So the index n<sub>l</sub> for l ∉ {"{j, k}"} is
        constant across all four pockets and can be computed directly from z
        <sub>int</sub>:
      </p>
      <pre>{`# At intersection z_int of lines (j, mj) and (k, mk):
for l in range(4):
    if l in (j, k): continue
    proj = Re(z_int · conj(E[l]))
    n_l  = ceil(proj − GAMMA)   # constant for all 4 surrounding pockets

# Base vertex of the tile:
P = mj·E[j] + mk·E[k] + Σ_{l≠j,k} n_l·E[l]

# Four CCW vertices (form a unit parallelogram):
v0 = P
v1 = P + E[j]
v2 = P + E[j] + E[k]
v3 = P + E[k]`}</pre>
      <p>
        Side lengths: |E[j]| = |E[k]| = 1 always (unit vectors). The angle
        between E[j] and E[k] is either 90° (square) or 45° (rhombus). The
        winding is counterclockwise because Im(conj(E[j]) · E[k]) &gt; 0 for
        all j &lt; k in our 0–3 range.
      </p>
      <p>
        The full Blender script iterates 6 family-pairs × (2N+1)² line-index
        combinations, rejects tiles whose centroid falls outside DISC_RADIUS,
        and assembles the surviving quads into a bmesh:
      </p>
      <pre>{`def generate_tiles():
    tiles = []
    for j in range(4):
        for k in range(j + 1, 4):
            is_sq = ((k - j) % 4 == 2)
            for mj in range(-N, N + 1):
                for mk in range(-N, N + 1):
                    z = intersect(j, mj, k, mk)
                    if abs(z) > DISC_RADIUS + 2.0: continue
                    P = mj * E[j] + mk * E[k]
                    for l in range(4):
                        if l in (j, k): continue
                        nl = ceil(Re(z * conj(E[l])) - GAMMA)
                        P += nl * E[l]
                    centroid = P + 0.5*(E[j] + E[k])
                    if abs(centroid) > DISC_RADIUS: continue
                    tiles.append(([P, P+E[j], P+E[j]+E[k], P+E[k]], is_sq))
    return tiles`}</pre>

      <h2>Silver ratio in the tile frequencies</h2>
      <p>
        The Ammann-Beenker tiling has a definite <em>frequency</em> for each
        tile type. As the disc grows, the proportion converges to:
      </p>
      <ul>
        <li>
          Squares: 1/(2 + √2) ≈ 29.3% of tile count
        </li>
        <li>
          Rhombi: (1 + √2)/(2 + √2) ≈ 70.7% of tile count
        </li>
        <li>
          Ratio sq/rh → 1/(1+√2) ≈ <strong>0.414</strong> — the reciprocal of
          the silver ratio
        </li>
      </ul>
      <p>
        The script prints this ratio after generation. If you see ≈ 0.414 you
        know the disc is large enough for the asymptotic frequencies to have
        settled. This is the same algebraic mechanism governing{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-phyllotaxis-golden-angle-vogel-fibonacci-parastichy-poi-disc-webxr"
          className={lk}
        >
          Fibonacci phyllotaxis
        </Link>
        , where the golden ratio forces irrational parastichy counts: the
        irrationality of λ prevents any commensurate periodicity.
      </p>

      <h2>Mesh construction in Blender</h2>
      <p>
        Each tile becomes an extruded slab. Squares (cobalt blue) sit 7 cm
        tall; rhombi (amber-gold) at 4 cm. The height contrast makes the tile
        boundary visible from oblique angles without needing visible grout lines
        — though we also shrink each tile toward its centroid by factor INSET =
        0.935 to add a thin gap.
      </p>
      <pre>{`for (verts, is_sq) in tiles:
    h   = SLAB_SQ if is_sq else SLAB_RH
    col = COL_SQUARE if is_sq else COL_RHOMBUS
    bot = inset(verts)                       # z = 0
    top = [(x, y, h) for (x, y, _) in bot]  # z = h
    # Add top face, bottom face (reversed winding), four side faces.
    # Assign vertex colour COL_SQUARE or COL_RHOMBUS to every loop.`}</pre>
      <p>
        The material uses a <strong>Principled BSDF</strong> driven by the
        vertex-colour attribute "TileType". Metallic = 0.6, roughness = 0.22 —
        a polished tile look. The object then receives a π/2 rotation about X
        and has that transform applied before export, fulfilling the studio
        convention (+Y-up for WebXR GLTF).
      </p>

      <h2>Vertex star: the local structure</h2>
      <p>
        Zoom into the centre of the disc and you will see the canonical{" "}
        <em>vertex star</em> of the Ammann-Beenker tiling: 8 tiles meeting at
        a point, alternating squares and rhombi. This eight-fold arrangement
        never appears in any periodic tiling of squares and rhombi — it is a
        purely quasicrystalline feature.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-hyperbolic-poincare-disk-tiling-5-4-triangle-group-stage-floor-webxr"
          className={lk}
        >
          hyperbolic {"{5,4}"} Poincaré-disk tiling tutorial
        </Link>{" "}
        generates a different aperiodic floor pattern via hyperbolic isometry
        — compare the two: both have regular local geometry, both are globally
        non-repeating, but through entirely different mechanisms (irrational
        inflation vs. negative curvature).
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Duplicate tiles</strong>: with GAMMA = 0.5 and general
          position, each intersection maps to exactly one tile — no
          deduplication is needed. If you see overlapping faces, check that
          GAMMA ≠ 0 (GAMMA = 0 puts grid lines through the origin and breaks
          the uniqueness argument).
        </li>
        <li>
          <strong>Winding errors / dark underside patches</strong>: if normals
          point inward on top faces, verify that the CCW order (P, P+E[j],
          P+E[j]+E[k], P+E[k]) holds — it does whenever Im(conj(E[j])·E[k])
          &gt; 0, which you can verify: for all six (j,k) pairs this evaluates
          to sin(k·π/4 − j·π/4) = sin(Δ·π/4) &gt; 0 since Δ ∈ {"{1, 2, 3}"}
          all give positive sines.
        </li>
        <li>
          <strong>Too few / too many tiles</strong>: adjust N (default 8) and
          DISC_RADIUS (default 3.5). Increasing DISC_RADIUS with fixed N
          causes edge tiles to be clipped mid-intersection; increase N
          proportionally.
        </li>
        <li>
          <strong>GLB export fails</strong>: ensure Blender 5.1 has the GLTF
          I/O extension enabled (it ships by default in 4.2+ via the Extensions
          Platform — check Edit → Preferences → Get Extensions if not visible).
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Beenker FPM (1982).{" "}
          <em>
            Algebraic theory of non-periodic tilings by two simple building
            blocks: a square and a rhombus.
          </em>{" "}
          TU Eindhoven EUT Report 82-WSK-04.{" "}
          <a
            href="https://research.tue.nl/en/publications/algebraic-theory-of-non-periodic-tilings-of-the-plane-by-two-sim"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            research.tue.nl
          </a>{" "}
          — Public domain mathematical facts; independent CC0 implementation.
        </li>
        <li>
          de Bruijn NG (1981).{" "}
          <em>Algebraic theory of Penrose&apos;s non-periodic tilings.</em>{" "}
          Indag. Math. 43: 39–66.{" "}
          <a
            href="https://www.win.tue.nl/~aeb/combinatorics/penrose/debruijn.pdf"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            win.tue.nl
          </a>{" "}
          — the multigrid-dual method extended here from Penrose (5 grids) to
          Ammann-Beenker (4 grids). Related work by the same group at TU
          Eindhoven includes the classification of all 2D quasicrystalline
          tilings by their symmetry groups.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Ammann-Beenker Octagonal Quasicrystal: De Bruijn Multigrid Dual, Silver Ratio λ=1+√2, Stage Floor for WebXR",
  description:
    "Generate the 8-fold aperiodic Ammann-Beenker tiling (squares + 45° rhombi) using de Bruijn's multigrid-dual index formula, extrude into a Blender stage floor, and export a WebXR GLB.",
  tags: [
    "python",
    "numpy",
    "quasicrystal",
    "aperiodic-tiling",
    "ammann-beenker",
    "silver-ratio",
    "multigrid",
    "de-bruijn",
    "stage-floor",
    "webxr",
    "glb",
  ],
  date: "2026-08-16",
  blenderVersion: "5.1",
  libraryPath:
    "public/library/blends/scripting/python-numpy-ammann-beenker-octagonal-quasicrystal-silver-ratio-multigrid-stage-floor-webxr",
  Body,
});

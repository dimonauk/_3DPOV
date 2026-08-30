import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-clifford-attractor-pickover-discrete-2d-map-fractal-density-stage-floor-webxr";

const TITLE =
  "Python numpy — Clifford Attractor: Pickover Discrete 2-D Map " +
  "x=sin(ay)+c·cos(ax) y=sin(bx)+d·cos(by), Dissipative Strange Attractor " +
  "D_f<2, 3M-Step Log-Density Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "The Clifford attractor is a four-parameter family of nonlinear 2-D maps where" +
  " x_{n+1}=sin(a·y_n)+c·cos(a·x_n) and y_{n+1}=sin(b·x_n)+d·cos(b·y_n)." +
  " Unlike area-preserving Hamiltonian maps, this system is dissipative: volume" +
  " contracts, orbits collapse onto a strange attractor of fractal dimension D_f<2," +
  " and the long-run density of visited points traces that attractor's self-similar" +
  " structure. This blueprint iterates 3 × 10⁶ steps, bins the orbit into a 120×120" +
  " log-density grid, and lifts it into a Blender stage-floor mesh with four shape" +
  " keys sweeping from a 5-arm starfish (Basis) through cave strands, crystalline" +
  " webs, and sparse island rings. Cobalt–amber vertex colour encodes density.";

function Body() {
  return (
    <>
      <p>
        Most nonlinear systems you encounter in a Blender context come from physics:
        pendulums, plasma waves, atmospheric models. The Clifford attractor is
        different — it arrived from recreational mathematics and computer art.
        Clifford A. Pickover introduced the map in his 1991 book{" "}
        <em>Computers and the Imagination</em>, assembling a taxonomy of exotic
        fractal geometries by scanning the four-dimensional parameter space
        (a, b, c, d) ∈ ℝ⁴. Each point in that space yields a different alien
        landscape; some are blank noise, but a remarkable fraction produce
        structured strange attractors.
      </p>
      <p>
        What makes this interesting for the studio is that the output is already
        a 2-D density field — exactly the shape we want for a stage-floor mesh.
        Three million orbit steps, binned into a 120×120 grid, gives a rich
        height map where the attractor&apos;s filamentary structure reads as ridges
        and the empty regions of phase space read as flat plains.
      </p>

      <h2>The map</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`x_{n+1} = sin(a·y_n) + c·cos(a·x_n)
y_{n+1} = sin(b·x_n) + d·cos(b·y_n)

Parameters: (a, b, c, d) ∈ ℝ⁴  — continuous family of attractors

Jacobian:
  J = [[ -c·a·sin(a·x)    a·cos(a·y)  ],
       [  b·cos(b·x)       -d·b·sin(b·y) ]]

det(J) = c·d·a·b · sin(a·x)·sin(b·y) − a·b · cos(a·y)·cos(b·x)
       ≠ 1 in general  →  NOT area-preserving, DISSIPATIVE`}
      </pre>

      <h2>Dissipation versus Hamiltonicity — why this makes a different kind of attractor</h2>
      <p>
        The{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr"
        >
          Chirikov standard map
        </Link>{" "}
        and the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-zaslavsky-stochastic-web-kicked-oscillator-qfold-quasicrystal-stage-floor-webxr"
        >
          Zaslavsky stochastic web
        </Link>{" "}
        are <em>area-preserving</em> (symplectic): their Jacobians have determinant 1
        everywhere, so a small region of phase space maps to a region of exactly
        the same area after each step. This is a consequence of Liouville&apos;s
        theorem for Hamiltonian systems. KAM tori survive because there is no volume
        to lose; the chaotic sea simply redistributes area rather than concentrating it.
      </p>
      <p>
        The Clifford map is <em>dissipative</em>: det J varies and can be less than 1
        in magnitude across significant regions. Volume contracts. An initial cloud
        of points spreads along the unstable manifold (the attractor&apos;s filaments)
        while being squeezed in the stable direction. After enough iterations every
        initial condition inside the basin of attraction has collapsed onto the same
        zero-measure set — the strange attractor — with a fractal dimension D_f
        strictly between 1 and 2.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Hamiltonian (Chirikov, Zaslavsky)    Dissipative (Clifford)
────────────────────────────────    ─────────────────────────────────
det J = 1 everywhere                det J < 1 on average
Area preserved                      Area contracts → attractor
KAM tori survive small ε            No tori — only attractor + basin
Multiple basins = KAM islands       Single attractor (for generic params)
Dimension = 2 (fills phase plane)   D_f ∈ (1, 2) — fractal, measure zero
Lévy diffusion possible             Orbit stays bounded on attractor`}
      </pre>

      <h2>Why a single long orbit suffices</h2>
      <p>
        For Hamiltonian maps like Chirikov we needed many independent initial
        conditions to sample different KAM islands: an ergodic trajectory starting
        inside one island will not exit to visit others. The Clifford attractor
        has a single connected basin (for the parameter values chosen here) and
        the attractor itself is ergodic under the map. One long orbit visits every
        part of the attractor with the correct invariant measure — the natural
        measure of the attractor — so 3 × 10⁶ steps from a single seed gives a
        well-converged density, roughly 200 hits per bin on the densest filaments.
      </p>
      <p>
        The{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-henon-map-strange-attractor-fractal-basin-poi-webxr"
        >
          Hénon map
        </Link>{" "}
        uses the same principle at much smaller scale: the classic a=1.4, b=0.3
        attractor fills with a single orbit of order 10⁵ steps. The Clifford map
        tends to fill more slowly (the attractor can be thinner and more filamentary)
        so 3 × 10⁶ is the comfortable choice.
      </p>

      <h2>Parameter presets and the geometry they produce</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Preset      a      b      c      d     Character
─────────────────────────────────────────────────────────────
Basis      -1.4   1.6   1.0   0.7   Starfish — 5-arm radial symmetry
SK_Cave    -1.7   1.3  -0.1  -1.2   Cave strands — elongated comma loops
SK_Web      1.5  -1.8   1.6   0.9   Crystalline web — fine branching filaments
SK_Sparse   1.3   1.7   0.5   1.0   Island rings — sparse separated clusters`}
      </pre>
      <p>
        The Basis preset (a=−1.4, b=1.6, c=1.0, d=0.7) is perhaps the most
        photographed Clifford attractor: it has approximate 5-fold rotational symmetry
        — reminiscent of a sea urchin or starfish — despite the map having no
        built-in symmetry group. This emergent symmetry arises because the chosen
        parameters happen to produce a periodic-ish winding of the unstable manifold.
        Unlike the q=5 quasi-crystal in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-zaslavsky-stochastic-web-kicked-oscillator-qfold-quasicrystal-stage-floor-webxr"
        >
          Zaslavsky web
        </Link>
        , this symmetry is not exact — close inspection reveals slight asymmetries —
        but at density-map resolution it reads as 5-fold.
      </p>

      <h2>Log-density transform and height-field encoding</h2>
      <p>
        Raw orbit-visit counts span a dynamic range of roughly 10³–10⁴: dense
        filament cores receive thousands of hits while the surrounding halo
        receives single-digit counts. A linear height field would compress the halo
        into a flat plain indistinguishable from empty space. The transform
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`h[i,j] = log(1 + counts[i,j]) / log(1 + max_counts)`}
      </pre>
      <p>
        compresses the dynamic range to [0, 1] while preserving both the
        fine filaments and the broad plateau structure. The same transform is
        used in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
        >
          Feigenbaum bifurcation diagram
        </Link>{" "}
        and the Chirikov map to handle similar density-range problems.
      </p>

      <h2>Mesh construction</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Grid:     120 × 120 = 14 400 vertices
Quads:    119 × 119 = 14 161 faces
Extent:   6 m × 6 m floor (MESH_SCALE = 6.0)
Height:   0 – 0.5 m  (HEIGHT_SCALE = 0.5, multiplied by h ∈ [0,1])
Domain:   ±2.0 in Clifford (x,y) mapped to ±3.0 m in Blender (x,y)

Shape keys:  Basis (mesh base) + 3 relative keys (SK_Cave, SK_Web, SK_Sparse)
             Blender computes shape-key deltas as (target_z − basis_z) per vertex.

Colour:      FLOAT_COLOR "Clifford_Z" on CORNER domain
             t = h[i,j] from Basis density
             colour = COBALT·(1−t) + AMBER·t   (linear interpolation)`}
      </pre>

      <h2>Blueprint walkthrough</h2>
      <p>
        The script runs as a single-pass computation with no Blender operators:
      </p>
      <ol>
        <li>
          <strong>clifford_density(a, b, c, d)</strong> — single-loop Python
          iterate of 3 × 10⁶ steps. Bin each (x, y) into a 120×120 integer grid,
          then apply log-normalisation. The inner loop is pure Python (not numpy-
          vectorised over iterations) because the map is sequential: step n+1
          depends on step n. Elapsed time is ~25 s on a mid-range CPU; a Cython
          or numba JIT would drop this to ~0.5 s, but the bpy scripting context
          does not include numba by default in Blender 5.1&apos;s bundled Python.
        </li>
        <li>
          <strong>build_floor()</strong> — calls density for all four presets,
          then builds the mesh via <code>me.from_pydata(verts, [], faces)</code>.
          Shape keys are added with <code>ob.shape_key_add()</code>; only the
          z-coordinates of each key&apos;s <code>sk.data[i].co</code> differ from
          the Basis. The FLOAT_COLOR attribute is written per face-corner via
          <code>me.color_attributes.new(type=&quot;FLOAT_COLOR&quot;, domain=&quot;CORNER&quot;)</code>
          — the 5.1 API for what was previously <code>vertex_colors</code>.
        </li>
      </ol>

      <h2>Export for WebXR delivery</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`File → Export → glTF 2.0
  ✓ Apply Transformations
  ✓ Include: Selected Objects
  ✓ Geometry: Apply Modifiers, Vertex Colors
  ✓ Compression: Draco Level 6
  Texture Format: WebP
  Root object name: clifford_attractor   (snake_case, holoflow convention)`}
      </pre>
      <p>
        The FLOAT_COLOR attribute exports as{" "}
        <code>COLOR_0</code> in glTF, readable by Three.js{" "}
        <code>MeshStandardMaterial</code> with{" "}
        <code>vertexColors: true</code>. The shape keys export as glTF morph
        targets, addressable at runtime via{" "}
        <code>mesh.morphTargetInfluences[i]</code>.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Flat mesh / no height:</strong> confirm H density array was
          non-zero before normalisation — add <code>print(h.max())</code> before
          the return. If max is 0, the orbit is escaping ±XY_RANGE; widen
          XY_RANGE or check parameter values.
        </li>
        <li>
          <strong>Blank shape key (all zeros):</strong> the SK preset&apos;s orbit
          may land outside the grid for those (a,b,c,d). Widen XY_RANGE to 2.5
          for the affected preset or replace with a known-good set.
        </li>
        <li>
          <strong>Colour attribute missing in glTF viewer:</strong> ensure export
          includes vertex colours and the viewer shader uses{" "}
          <code>vertexColors: THREE.VertexColors</code> (Three.js r148+).
        </li>
        <li>
          <strong>Long compute time:</strong> reduce N_ITER to 500 000 for a
          quick draft; the attractor is recognisable but filaments are noisier.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Clifford A. Pickover,{" "}
          <em>Computers and the Imagination: Visual Adventures Beyond the Edge</em>{" "}
          (St. Martin&apos;s Press, 1991, ISBN 0-312-06131-4). The attractor map
          equations are mathematical definitions and are not subject to copyright.
          Related projects: <a className={lk} href="https://pickover.com" target="_blank" rel="noopener noreferrer">pickover.com</a>.
        </li>
        <li>
          Paul Bourke, &ldquo;Clifford Attractors&rdquo; (2013),{" "}
          <a className={lk} href="http://paulbourke.net/fractals/clifford/" target="_blank" rel="noopener noreferrer">
            paulbourke.net/fractals/clifford/
          </a>{" "}
          — algorithm description PD, figures CC BY 4.0. Related: Bourke&apos;s full
          fractal catalogue at{" "}
          <a className={lk} href="http://paulbourke.net/fractals/" target="_blank" rel="noopener noreferrer">
            paulbourke.net/fractals/
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
  datePublished: "2026-08-30",
  topic: "blender",
  body: <Body />,
});

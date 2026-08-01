import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-arnold-tongue-circle-map-mode-locking-poi-disc-webxr";

const TITLE =
  "Python numpy — Arnold Tongue Circle Map: Mode-Locking Bifurcation, Farey Winding Numbers & Displaced Relief Poi Disc for WebXR (Blender 5.1)";

const LEDE =
  "The sine circle map is the simplest mathematical model of two coupled oscillators. As coupling strength K rises from zero to one, the slow oscillator locks onto rational multiples of the drive frequency — 1:1, 1:2, 2:3 — in tongue-shaped parameter regions first classified by Vladimir Arnol'd in 1965. At K = 1 these tongues tile the entire unit square, and the winding number becomes the devil's staircase: a monotone function flat on a dense set of intervals. This tutorial vectorises 1 200 iterations of the circle map over a 180 × 180 grid using numpy, classifies each cell by its Farey winding number (q ≤ 8), lifts the mode-locking depth into a displaced mesh, paints vertex colours by rational hue, and exports a Draco-6 GLB for WebXR — producing a topographic chart of every resonance the map supports.";

function Body() {
  return (
    <>
      <p>
        The circle map sits at the intersection of music theory, cardiac
        physiology, and chaos theory. Mode-locking is why a driven pendulum
        prefers simple frequency ratios, why the heart can synchronise to a
        pacemaker, and why the Jovian moon system clusters around 1:2:4
        orbital resonances. Arnol'd tongues make all these phenomena visible
        in a single two-parameter diagram.
      </p>

      <p>
        The contrast with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
          className={lk}
        >
          Duffing oscillator
        </Link>{" "}
        is instructive: Duffing shows period-doubling (period 2 → 4 → 8 →
        chaos) as a single parameter varies, whereas the circle map shows all
        rational resonances simultaneously in the (Ω, K) plane. Both are
        routes to chaos, but the circle map&apos;s route runs through the devil&apos;s
        staircase — a fractal structure on the frequency axis — rather than
        through a cascade of period-doublings.
      </p>

      <p>
        Visually the winding-number field resembles the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-mandelbrot-julia-fractal-poi-webxr"
          className={lk}
        >
          Mandelbrot escape-time diagram
        </Link>
        , in that it assigns a colour to each point in a 2D parameter space
        based on the long-time behaviour of an iterated map. The key difference
        is that the circle map is one-dimensional (one phase variable) and
        dissipative: all orbits converge to an attractor, so there is no
        sensitive dependence on initial conditions inside a locked tongue.
        Sensitivity only appears in the gaps between tongues — the chaotic
        regions.
      </p>

      <h2>The Sine Circle Map</h2>
      <p>
        The map advances a phase θ ∈ [0, 1) at each discrete timestep:
      </p>
      <pre>{`θ_{n+1} = (θ_n + Ω − (K / 2π) · sin(2π θ_n))  mod 1`}</pre>
      <p>
        At K = 0 this is a pure rotation by Ω each step. At K &gt; 0 the
        sine term accelerates the orbit near θ = 0 and decelerates it near
        θ = 0.5, creating regions where the orbit spends extra time — exactly
        the mechanism that pulls the average rate toward rational values.
      </p>
      <p>
        The <em>winding number</em> W = lim<sub>n→∞</sub> (θ_n − θ_0) / n
        (tracked without modular reduction so cumulative rotation is preserved)
        measures the long-time average rotation per step. When W = p/q, every
        q steps the orbit winds exactly p full turns. When W is irrational, the
        orbit is quasiperiodic and never exactly repeats.
      </p>

      <h2>Farey Sequence & Rational Classification</h2>
      <p>
        To classify winding numbers we build the <em>Farey table</em>: all
        rationals p/q with q ≤ 8, sorted by value. This gives 49 candidate
        fractions, from 0/1 through 1/2, 1/3, 2/3, … to 8/8.
      </p>
      <pre>{`def _farey_table(max_q):
    seen, table = set(), []
    for q in range(1, max_q + 1):
        for p in range(0, q + 1):
            r = p / q
            if r not in seen:
                seen.add(r); table.append((p, q, r))
    return sorted(table, key=lambda x: x[2])`}</pre>
      <p>
        For each grid cell, a vectorised nearest-rational search over the 49
        candidates identifies the closest locking state. If the distance is
        below <code>LOCK_EPSILON = 0.012</code>, the cell is classified as
        mode-locked and its displacement height is proportional to how far inside
        the tongue it sits. Cells beyond the epsilon boundary are chaotic — flat
        and desaturated.
      </p>

      <h2>Vectorised Iteration</h2>
      <p>
        Looping over 32 400 grid points in Python would be prohibitively slow.
        Instead, the full (Ω, K) grid is broadcast as two (180, 180) arrays and
        iterated in parallel across all cells simultaneously:
      </p>
      <pre>{`OO, KK = np.meshgrid(omega, k_vals, indexing='ij')  # (RES, RES)
theta = np.zeros_like(OO)

# Transient — discard: let orbit settle onto its attractor
for _ in range(N_TRANSIENT):
    theta = (theta + OO - KK * inv2pi * np.sin(2*π*theta)) % 1.0

# Measurement — accumulate raw delta (no mod) so winding is preserved
cumulative = np.zeros_like(OO)
for _ in range(N_ITER):
    delta = OO - KK * inv2pi * np.sin(2*π*theta)
    theta = (theta + delta) % 1.0
    cumulative += delta

W = cumulative / N_ITER   # shape (RES, RES)`}</pre>
      <p>
        The transient phase uses modular arithmetic to keep theta bounded.
        The measurement phase tracks the raw angular increment — without mod —
        so the cumulative sum correctly counts total rotations across N_ITER steps,
        even when the orbit crosses the 0 ↔ 1 boundary many times.
      </p>
      <p>
        Why 400 transient steps? Mode-locked orbits converge exponentially fast
        (the Lyapunov exponent is negative inside a tongue), so 400 steps is
        comfortably past the transient for all K ≤ 1.15. Quasiperiodic orbits
        near tongue boundaries converge much more slowly — those cells will
        show slightly noisier winding numbers, which is physically correct
        (they are genuinely close to a phase transition).
      </p>

      <h2>Mesh Construction — bmesh Direct API</h2>
      <p>
        The mesh is built via <code>bmesh</code> (direct data API) rather than{" "}
        <code>bpy.ops.mesh.primitive_grid_add</code>. The operator approach
        requires a valid UI context and a depsgraph update cycle; bmesh is
        context-free and faster for programmatic vertex placement:
      </p>
      <pre>{`bm = bmesh.new()
for i in range(GRID_RES):            # Ω axis → X
    for j in range(GRID_RES):        # K axis → Y
        fi = i * GRID_RES + j
        z  = lock_depth[fi] * DISPLACEMENT_Z
        bm.verts.new((-half + i*step, -half + j*step, z))`}</pre>
      <p>
        The key design choice: X maps to Ω (frequency ratio) and Y maps to K
        (coupling strength). This matches the conventional orientation of
        published Arnold-tongue diagrams — tongues grow upward from the K = 0
        baseline. A viewer standing at the X axis sees the devil&apos;s staircase
        profile; standing at the Y axis sees the tongue cross-sections.
      </p>

      <h2>Vertex Colours — Blender 5.x FLOAT_COLOR API</h2>
      <p>
        Blender 4.x deprecated <code>mesh.vertex_colors</code> in favour of
        the unified colour-attribute system. In 5.x, vertex colours must be
        created via:
      </p>
      <pre>{`col_attr = mesh.color_attributes.new(
    name="Col", type='FLOAT_COLOR', domain='POINT'
)`}</pre>
      <p>
        <code>FLOAT_COLOR</code> stores four 32-bit floats per vertex (linear
        light, not sRGB). This is the correct type for PBR export — the GLTF
        exporter converts to the right colour space automatically. The legacy{" "}
        <code>BYTE_COLOR</code> type quantises to 8 bits and can cause banding
        artefacts on the subtle hue gradients between adjacent tongue regions.
      </p>
      <p>
        Each Farey rational p/q receives a hue derived from its denominator
        (the coarse band) offset by its numerator (the fine position within
        the band). Locked cells are highly saturated (S = 0.82); chaotic cells
        are nearly grey (S = 0.14). This makes the tongue boundaries
        immediately legible without any post-processing.
      </p>

      <h2>Export & WebXR Compatibility</h2>
      <p>
        The GLB is exported with Draco mesh compression (level 6) and WebP
        textures. The <code>export_colors=True</code> flag — added explicitly
        in 5.x — ensures the <code>Col</code> vertex attribute survives into the
        GLTF binary. In Three.js and Babylon.js, access it via{" "}
        <code>geometry.attributes.color</code> and enable{" "}
        <code>material.vertexColors = true</code> on the standard mesh
        material.
      </p>
      <p>
        The mesh is 2 × 2 m in Blender units, matching the standard WebXR
        stage floor footprint from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-physarum-slime-mould-transport-network-poi-webxr"
          className={lk}
        >
          Physarum transport network
        </Link>{" "}
        tutorial. It can be scaled and placed as a stage floor tile, a poi disc
        overlay, or a wall relief panel — the displacement is shallow enough
        (22 cm max) to read clearly from any angle.
      </p>

      <h2>Failure Modes & Troubleshooting</h2>
      <ul>
        <li>
          <strong>All cells classify as unlocked.</strong> Increase N_ITER or
          decrease LOCK_EPSILON. At low iteration counts, the winding number
          estimate has noise of order 1/N_ITER ≈ 0.001 for N_ITER = 1000, which
          is marginal for detecting narrow tongues (q = 7, 8).
        </li>
        <li>
          <strong>Mesh is flat (no displacement).</strong> Check that{" "}
          <code>lock_depth</code> is non-zero: print{" "}
          <code>lock_depth.max()</code> after compute_fields(). If it is zero,
          LOCK_EPSILON is too small for the current N_ITER.
        </li>
        <li>
          <strong>GLB has no vertex colours in the viewer.</strong> Confirm{" "}
          <code>export_colors=True</code> in the exporter call, and that the
          viewer material has vertex colours enabled. Some GLTF viewers ignore
          vertex attributes unless the material explicitly declares them.
        </li>
        <li>
          <strong>Script hangs.</strong> At GRID_RES = 180 and N_ITER = 1200,
          each inner loop touches 32 400 × 64-bit floats — about 256 kB per
          pass, well within L3 cache. If the system is memory-constrained,
          reduce GRID_RES to 120.
        </li>
      </ul>

      <h2>Outside Sources</h2>
      <ul>
        <li>
          <strong>Arnol&apos;d Standard Map — Scholarpedia</strong> (CC BY-NC-SA 3.0) ·
          Figueras, Haro, Luque ·{" "}
          <a
            href="http://www.scholarpedia.org/article/Arnold_standard_map"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            scholarpedia.org/article/Arnold_standard_map
          </a>
          {" "}· Related: Siegel Disks article (same encyclopedia, same authors).
        </li>
        <li>
          <strong>Jensen, Bak, Bohr — &ldquo;Transition to Chaos by Interaction of
          Resonances in Dissipative Systems&rdquo;</strong> · Phys. Rev. Lett. 50,
          1637 (1984) · academic reference, fair use ·{" "}
          <a
            href="https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.50.1637"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            journals.aps.org
          </a>
          . This is the paper that computed the first high-resolution Arnold
          tongue diagram numerically and measured the devil&apos;s staircase
          universally at K = 1. The figure in that paper is the direct
          ancestor of every Arnold tongue image since.
        </li>
      </ul>

      <h2>What to Try Next</h2>
      <p>
        The same winding-number technique applies to any area-preserving map
        (the conservative version of the circle map — the <em>Arnol&apos;d standard
        map</em> — has a (q, p) torus structure in phase space rather than
        parameter space). The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-lenia-continuous-cellular-automaton-fft-soliton-webxr"
          className={lk}
        >
          Lenia continuous automaton
        </Link>{" "}
        extends the FFT-convolution idea from scalar fields to complex-valued
        kernels — a natural next step if you want to explore the boundary
        between mode-locking and spatiotemporal chaos.
      </p>
    </>
  );
}

export const blenderTutorialPythonNumpyArnoldTongueCircleMapModeLockingPoiDiscWebxrEntry: Entry =
  buildInstructable(
    {
      time: "one evening",
      difficulty: "advanced",
      cost: "free (numpy ships with Blender)",
      supplies: {
        materials: ["Blender 5.1", "numpy (bundled)", "Python 3.11+"],
        tools: [
          "Blender Text Editor",
          "System console for progress logging",
          "OBS or Game Bar for screen recording",
        ],
      },
      steps: [
        {
          title: "Open blueprint.py in Blender's Text Editor",
          body: "Scripting workspace → Open → blueprint.py. Review the parameter block at the top. GRID_RES and N_ITER are the main quality knobs.",
        },
        {
          title: "Run the script",
          body: "Press ▶ (Run Script). Watch the Info header for the mode-locked fraction message. Expect ~60 % at the default K_MAX = 1.15.",
        },
        {
          title: "Inspect vertex colours in Material Preview",
          body: "Switch to Layout workspace. Press Z → Material Preview. The (Ω, K) tongue map appears: pastel bands for locked regions, near-grey for chaotic gaps.",
        },
        {
          title: "Examine the displacement relief",
          body: "Orbit to a low angle (hold middle-mouse + drag). The tongue interiors are raised plateaux; the chaotic gaps are valleys. The 3D relief makes the Farey hierarchy legible spatially.",
        },
        {
          title: "Run record.py for the viewport animation",
          body: "Open record.py in the Text Editor. Press Run Script. Blender renders a 12-second EEVEE orbit to viewport.mp4 in the videos directory.",
        },
        {
          title: "Export the GLB",
          body: "The GLB is exported automatically by blueprint.py (last step). Check hf_arnold_tongue.glb exists alongside blueprint.py. Load it in a GLTF viewer and enable vertex colours on the material.",
        },
      ],
    },
    {
      slug: SLUG,
      title: TITLE,
      date: "2026-08-01",
      kind: "tutorial",
      excerpt: LEDE,
      Body,
    },
  );

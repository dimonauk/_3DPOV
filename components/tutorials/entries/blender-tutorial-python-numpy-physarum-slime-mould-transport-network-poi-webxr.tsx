import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-physarum-slime-mould-transport-network-poi-webxr";

const TITLE =
  "Python numpy — Physarum Slime-Mould Transport Network: Jones Sense-Rotate-Move-Deposit Algorithm, Toroidal Trail Diffusion & Height-Field WebXR GLB (Blender 5.1)";

const LEDE =
  "Physarum polycephalum is a single-celled organism that forages by extending a sheet of microscopic agents: each agent deposits a chemical trail, senses it with three forward-facing antennae, and steers toward the strongest signal. The population self-organises into a fault-tolerant transport network that empirically approximates the Steiner minimum tree — a biological result that has since influenced network topology research. This tutorial implements the Jones (2010) Sense-Rotate-Move-Deposit algorithm on a 128 × 128 toroidal grid in pure numpy, lifts the resulting trail-density field into a displaced height-field mesh in Blender 5.1, and exports a Draco-6 GLB for WebXR.";

function Body() {
  return (
    <>
      <p>
        The Tokyo rail network, the Slime Mould Maps project, and the filament
        structure of the cosmic web all share topology with Physarum networks.
        None of them were designed: each emerged from local interaction rules
        applied uniformly across a population of agents. Jeff Jones formalised
        this as the <em>Sense-Rotate-Move-Deposit</em> (SRMD) loop in 2010,
        showing that four simple rules are sufficient to reproduce the branching,
        hub-and-spoke architecture that makes Physarum an efficient forager.
      </p>
      <p>
        Visually the result sits between the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr"
          className={lk}
        >
          DLA dendritic crystal
        </Link>{" "}
        (which builds a fractal tree by particle aggregation) and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr"
          className={lk}
        >
          Gray-Scott reaction-diffusion
        </Link>{" "}
        surface (which produces spots and labyrinths via activator-inhibitor
        chemistry). Physarum occupies the middle ground: it is agent-based like
        DLA, but the trail feedback loop performs implicit diffusion that pushes
        the network toward connected graphs rather than fractal trees.
      </p>
      <p>
        The contrast with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-reynolds-boids-3d-separation-alignment-cohesion-numpy-webxr"
          className={lk}
        >
          Reynolds Boids flocking tutorial
        </Link>{" "}
        is instructive: both are agent-based simulations, but Boids agents
        react to each other directly via a radius search, whereas Physarum
        agents react only to the shared chemical trail — a stigmergic medium.
        There is no explicit agent-to-agent communication at all; the network
        topology is an emergent property of agents writing and reading the same
        field.
      </p>

      <h2>The Jones SRMD algorithm</h2>
      <p>
        Each of the <code>N_AGENTS</code> agents carries a 2-D position and a
        heading angle. On every timestep:
      </p>
      <ol>
        <li>
          <strong>Sense</strong> — sample the trail at three positions:
          straight ahead (<code>fw</code>), ahead-left (<code>fl</code>) and
          ahead-right (<code>fr</code>), each <code>SENSOR_DIST</code> cells
          away at ± <code>SENSOR_ANGLE</code> from the current heading.
        </li>
        <li>
          <strong>Rotate</strong> — if the forward value is the largest, keep
          heading unchanged; if a flank is larger, rotate that direction by{" "}
          <code>ROTATION_ANGLE</code>; if both flanks exceed forward, apply a
          random turn. This last case is the network-forming step: agents stuck
          between two equally strong branches jitter randomly until one branch
          wins, preventing the deadlock that would occur with a pure
          gradient-ascent rule.
        </li>
        <li>
          <strong>Move</strong> — advance <code>STEP_SIZE</code> cells in the
          current heading direction, wrapping on the toroidal boundary so
          agents never reach an edge.
        </li>
        <li>
          <strong>Deposit &amp; Diffuse</strong> — add <code>DEPOSIT</code> to
          the trail map at the new position; apply a 3 × 3 box blur to spread
          the signal to neighbours; multiply by <code>DECAY &lt; 1</code> to
          let old trails fade. Diffusion propagates short-range attraction while
          decay enforces competition between branches — dense channels reinforce
          themselves faster than they decay, while thin branches fade.
        </li>
      </ol>

      <h2>Why vectorise the rotation decision?</h2>
      <p>
        The rotate step is a three-way conditional per agent. Implemented as a
        Python loop over <code>N_AGENTS=5000</code> this would be slow; the
        vectorised form uses{" "}
        <code>np.where</code> to avoid any Python-level iteration:
      </p>
      <pre>{`cond_both  = (fl >= fw) & (fr >= fw)          # deadlock: both flanks win
cond_left  = (fl > fr) & (fl > fw) & ~cond_both
cond_right = (fr > fl) & (fr > fw) & ~cond_both
angles = np.where(cond_both,  angles + random_turn,
         np.where(cond_left,  angles + rot_rad,
         np.where(cond_right, angles - rot_rad, angles)))`}</pre>
      <p>
        The <code>cond_both</code> guard is critical: without it the
        simultaneous <code>cond_left</code> and <code>cond_right</code> flags
        for an equal-flank agent would produce whichever condition appears last
        in the nesting, creating a systematic bias toward right turns. Checking{" "}
        <code>~cond_both</code> forces such agents through the random path
        regardless of which direction happens to be minutely stronger due to
        floating-point ordering.
      </p>

      <h2>Trail diffusion with np.roll</h2>
      <p>
        <code>scipy.ndimage.uniform_filter</code> would be the idiomatic tool
        for a 3 × 3 box blur, but Blender ships numpy without scipy by default.
        The pure-numpy equivalent accumulates nine shifted copies of the array:
      </p>
      <pre>{`def _box_blur(a):
    out = np.zeros_like(a)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            out += np.roll(np.roll(a, dy, axis=0), dx, axis=1)
    return out / 9.0`}</pre>
      <p>
        <code>np.roll</code> wraps at boundaries, which matches the toroidal
        agent motion — there is no edge artefact. The cost is nine vectorised
        array additions per step at O(GRID²), which is fast for GRID=128.
      </p>

      <h2>Building the height-field mesh</h2>
      <p>
        <code>bpy.ops.mesh.primitive_grid_add</code> creates a{" "}
        <code>GRID × GRID</code> vertex lattice in a single C call.{" "}
        <code>foreach_get</code> / <code>foreach_set</code> copy the coordinate
        buffer directly into a numpy array without Python overhead:
      </p>
      <pre>{`verts_flat = np.empty(len(mesh.vertices) * 3, dtype=np.float64)
mesh.vertices.foreach_get("co", verts_flat)
vco = verts_flat.reshape(-1, 3)

gx_idx = np.round((vco[:,0]+1.0)*0.5*(GRID-1)).astype(np.int32).clip(0,GRID-1)
gy_idx = np.round((vco[:,1]+1.0)*0.5*(GRID-1)).astype(np.int32).clip(0,GRID-1)
trail_vals   = trail_map[gy_idx, gx_idx]
vco[:,0]    *= PLANE_SIZE        # scale X to ±PLANE_SIZE m
vco[:,1]    *= PLANE_SIZE
vco[:,2]     = trail_vals * HEIGHT_SCALE

mesh.vertices.foreach_set("co", vco.ravel())`}</pre>
      <p>
        The primitive grid creates vertices at unit size (±1.0) in row-major
        order. Mapping vertex X in [−1, +1] to grid index via{" "}
        <code>(x + 1) * 0.5 * (GRID − 1)</code> is exact for a GRID-cell
        lattice and avoids any ambiguity from floating-point vertex ordering.
      </p>

      <h2>Vertex attribute and emission material</h2>
      <p>
        Storing the trail intensity as a named{" "}
        <code>FLOAT POINT</code> attribute lets the shader read it via{" "}
        <code>ShaderNodeAttribute(name=&quot;trail_intensity&quot;)</code>{" "}
        without baking a texture. The{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          vertex colour attributes tutorial
        </Link>{" "}
        covers the full attribute domain system. Here the colour ramp maps:
      </p>
      <ul>
        <li>0.0 → deep navy (background void)</li>
        <li>0.4 → violet (low-density hyphae)</li>
        <li>1.0 → bright cyan (primary transport trunks)</li>
      </ul>
      <p>
        EEVEE Next bloom at threshold 0.40 and intensity 0.20 makes the bright
        trunks bloom without washing out the violet mid-tones — the same bloom
        setup used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-levy-flight-brownian-cauchy-superdiffusion-poi-trail-webxr"
          className={lk}
        >
          Lévy flight poi trail tutorial
        </Link>
        .
      </p>

      <h2>Flat shading for faceted topology</h2>
      <p>
        Setting <code>poly.use_smooth = False</code> on every polygon produces
        the faceted aesthetic that is the Holoflow Studio default for stage-floor
        meshes — each quad reads as a distinct tile, emphasising the step-like
        topology of the height-field rather than blending it into a smooth
        surface. The <code>holoflow:facet = True</code> custom property signals
        the export pipeline to skip smooth-normal generation during GLB
        optimisation.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Blank height-field (all Z = 0):</strong> the trail map peaked
          below <code>1e-6</code> — likely too few steps or too high a decay.
          Increase <code>N_STEPS</code> to 150 or lower <code>DECAY</code> to
          0.85.
        </li>
        <li>
          <strong>No branches, solid disc:</strong>{" "}
          <code>SENSOR_DIST</code> too small relative to{" "}
          <code>GRID</code>. At GRID=128, <code>SENSOR_DIST=3</code> prevents
          long-range sensing; use 7-12.
        </li>
        <li>
          <strong>Long runtime (&gt; 30 s):</strong> the box blur runs nine
          numpy roll operations per step. Reduce <code>N_STEPS</code> to 60 for
          a quick preview. Alternatively install scipy into Blender&apos;s
          Python and swap <code>_box_blur</code> for{" "}
          <code>scipy.ndimage.uniform_filter(a, size=3, mode=&quot;wrap&quot;)</code>{" "}
          — about 3× faster.
        </li>
        <li>
          <strong>Vertex colours not showing in shader:</strong> confirm the
          attribute name matches exactly — &quot;trail_intensity&quot; is
          case-sensitive. Also ensure the domain is{" "}
          <code>&quot;POINT&quot;</code> not <code>&quot;CORNER&quot;</code>;
          POINT attributes interpolate across faces, CORNER attributes don&apos;t.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Jones, J. (2010).{" "}
          <em>
            Characteristics of Pattern Formation and Evolution in Approximations
            of Physarum Transport Networks.
          </em>{" "}
          Int. J. Unconventional Computing 5(1): 3-23. Algorithm in the public
          domain.{" "}
          <a
            href="https://uwe-repository.worktribe.com/output/980579"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            uwe-repository.worktribe.com
          </a>
          . Related project:{" "}
          <a
            href="https://en.wikipedia.org/wiki/Physarum_polycephalum"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikipedia: Physarum polycephalum
          </a>
          .
        </li>
        <li>
          NumPy Developers (2024).{" "}
          <em>NumPy Reference — Random Sampling.</em> BSD-3-Clause.{" "}
          <a
            href="https://numpy.org/doc/stable/reference/random/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>
          . Related project:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-01",
  tags: ["blender", "scripting", "python", "numpy", "simulation", "agent-based", "webxr"],
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-physarum-slime-mould-transport-network-poi-webxr",
});

export { entry as blenderTutorialPythonNumpyPhysarumSlimeMouldTransportNetworkPoiWebxrEntry };

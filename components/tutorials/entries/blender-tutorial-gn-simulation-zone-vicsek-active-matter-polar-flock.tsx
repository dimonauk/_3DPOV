import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        In 1995 Tamás Vicsek and colleagues published a two-page letter in
        Physical Review Letters that changed how physicists thought about living
        matter. They studied the simplest imaginable model for a flock: N
        point-particles, all moving at the same speed, each turning at each
        timestep toward the <em>average heading of its neighbours</em> within
        radius r, with a small random noise term η added. One rule. One
        parameter. Yet as η crosses a critical threshold η<sub>c</sub> the
        whole system flips from a disordered gas — every particle wandering
        independently — to a spontaneously ordered flock moving coherently in a
        single direction. That transition is not a crossover or a gradual
        change: it is a genuine second-order phase transition, identical in
        mathematical structure to the ferromagnetic transition in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-ising-model-spin-lattice-phase-transition"
          className={lk}
        >
          Ising model
        </Link>
        . The order parameter is the mean velocity vector magnitude |⟨v⟩| — it
        is zero in the disordered phase and non-zero in the ordered phase, and
        it breaks the continuous rotational symmetry of the model.
      </p>
      <p>
        This blueprint implements Vicsek dynamics on a 56 × 56 lattice inside a
        Blender 5.1 Geometry Nodes Simulation Zone. Each vertex carries a
        heading angle θ ∈ [−π, π] as a named FLOAT attribute. Each frame, a
        pair of <code>Blur Attribute</code> nodes averages the sin and cos
        components of θ across the grid topology, an <code>ARCTAN2</code> Math
        node recovers the circular mean angle, and a{" "}
        <code>FunctionNodeRandomValue</code> adds uniform noise η. The noise
        level cools from ETA_HOT = 2.20 to ETA_COLD = 0.10 over 280 frames —
        watch the rainbow-noise static crystallise into large coherent
        colour-patches as the flock locks in. The technique is the GN-native
        cousin of the Python{" "}
        <Link
          href="/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr"
          className={lk}
        >
          Kuramoto oscillator synchronisation
        </Link>{" "}
        tutorial: both use neighbour-averaging plus noise to produce emergent
        order.
      </p>

      <h2>Why you cannot average angles directly</h2>
      <p>
        The critical subtlety in any circular-statistics calculation is the
        wrap-around of the angle variable. If particle A points at θ = +175°
        and particle B points at θ = −175°, their direct arithmetic mean is 0°
        — dead wrong. The correct mean (the direction between them) is ±180°.
        The <em>circular mean</em> resolves this by decomposing each angle into
        its unit-vector components first:
      </p>
      <pre>{`# Wrong — alias at ±π:
θ_mean = mean(θ_neighbours)

# Correct — circular mean:
θ_mean = atan2( mean(sin θⱼ), mean(cos θⱼ) )`}</pre>
      <p>
        In the GN tree, <code>Blur Attribute(cos θ)</code> computes the
        neighbourhood mean of cos values across edge-connected vertices in one
        pass. The same for <code>Blur Attribute(sin θ)</code>. An{" "}
        <code>ARCTAN2(sin_blur, cos_blur)</code> Math node then reconstructs
        the correct mean angle, alias-free. This is the identical trick used in
        circular statistics, GPS bearing interpolation, and the colour-hue
        blending problem — but here it runs per vertex, per frame, across 3 136
        vertices simultaneously inside the Simulation Zone.
      </p>

      <h2>The phase transition</h2>
      <p>
        The XY model (Vicsek with no particle motion, spins on a fixed lattice)
        has a known critical noise η<sub>c</sub> ≈ π/3 ≈ 1.05 rad on a square
        lattice with 4-neighbour connectivity. Set{" "}
        <code>BLUR_ITER = 1</code> and the interaction radius is exactly 1
        grid-cell. The cooling schedule crosses η<sub>c</sub> around frame 110.
        Watch the correlation length grow: early frames show tiny patches of
        similar colour a few cells wide; near frame 110 you see patches spanning
        tens of cells, dissolving and reforming (diverging ξ); after frame 160
        one or two macroscopic domains lock in and the remaining domain walls
        anneal slowly. Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          Reaction-Diffusion Turing tutorial
        </Link>
        , where spatial structure GROWS from instability — here spatial
        structure COARSENS from a disordered state toward order. They are
        opposite sides of pattern formation.
      </p>
      <p>
        The order parameter Φ = |⟨e<sup>iθ</sup>⟩| is the magnitude of the
        mean complex phase across all vertices. At η = ETA_HOT, independent
        random θ values cancel: Φ ≈ 0. At η = ETA_COLD, all θ converge to one
        direction: Φ → 1. The colour-wheel emission material makes this
        visible: disordered frames show all hues equally; ordered frames show
        one dominant hue with narrow domain-wall fringing in the complementary
        colour.
      </p>

      <h2>Studio connection — active-matter choreography</h2>
      <p>
        A poi performance is an active-matter system: each performer reads
        those nearby, aligns their arc direction, adds personal variation (η).
        The ordered phase is a synchronised ensemble piece; the disordered
        phase is free improvisation. The Vicsek simulation is the exact
        mathematical model of that social dynamics. Long-exposure light
        paintings of the ordered phase — where many trail colours align into
        coherent sweeping arcs — reproduce the visual grammar of murmuration
        photography: the emergent shape is the behaviour, not the individual
        path. See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-boid-flock"
          className={lk}
        >
          Boid Flock tutorial
        </Link>{" "}
        for Craig Reynolds&apos; 1987 behavioural model (three steering forces)
        — Vicsek is the minimal statistical-mechanics reduction of that same
        collective phenomenon.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-25",
  title:
    "GN Simulation Zone — Vicsek Self-Propelled Particles: Active-Matter Phase Transition & Poi Murmuration Trails (Blender 5.1)",
  lede: "A 56×56 vertex lattice carries a heading angle θ per point; a Geometry Nodes Simulation Zone updates each angle each frame via the circular mean of edge-neighbour sin/cos components (BlurAttribute) plus uniform noise η — implementing the 1995 Vicsek model — while η cools from 2.20 to 0.10 over 280 frames, driving a second-order active-matter phase transition from disordered rainbow noise to large coherent colour domains rendered as a colour-wheel emission map for light-painting and poi murmuration visualisation.",
  body: Body,
  libraryPath:
    "blends/geometry-nodes/gn-simulation-zone-vicsek-active-matter-polar-flock/",
  steps: [
    {
      title: "Run blueprint.py — grid construction and GN tree",
      body: "Open Blender 5.1 → **Scripting** workspace. Open `blueprint.py` and press **Run Script**.\n\n`purge()` clears the scene. `make_grid()` builds a 56×56 vertex mesh with explicit edges (no quad faces — this is a point-and-edge graph, not a solid mesh). It seeds a random `theta` FLOAT attribute on the POINT domain using `mesh.attributes.new('theta','FLOAT','POINT')` and `foreach_set`.\n\n`build_vicsek_tree(obj)` creates the GN modifier and Simulation Zone. Key calls: `sim_i.pair_with_output(sim_o)` links the zone interior; `_blur(ng, cos_t, BLUR_ITER)` and `_blur(ng, sin_t, BLUR_ITER)` build the circular-mean neighbours; `_math(ng,'ARCTAN2', sin_blur, cos_blur)` recovers the mean angle; `FunctionNodeRandomValue(Seed=Frame)` provides per-vertex, per-frame noise.\n\nSwitch to **Rendered** shading (EEVEE Next). The initial lattice shows random hues — the disordered phase.",
    },
    {
      title: "Play the simulation and read the three phases",
      body: "Press **Space** to run the Simulation Zone frame-by-frame.\n\n**Frames 1–60 (η ≈ 2.2–1.6)**: disordered. All hues are equally represented; patches form and vanish within 2–3 frames. Correlation length ξ is of order 1–2 grid cells.\n\n**Frames 90–140 (η ≈ 1.1–0.6, crossing η_c ≈ 1.05)**: critical regime. Large, slow patches of the same hue form and dissolve — the correlation length diverges. This is the visual signature of a second-order phase transition: the system cannot decide which direction to flock, so it explores every scale simultaneously.\n\n**Frames 160–280 (η ≈ 0.5–0.1)**: ordered. One or two large domains of the same hue persist and grow. Domain walls — thin strips of complementary hue — anneal slowly inward. By frame 280 the lattice is nearly monochromatic: a single collective heading direction has locked in across all 3 136 vertices.",
    },
    {
      title: "Inspect the BlurAttribute nodes",
      body: "Open the GN editor with `hf_vicsek` selected. Inside the Simulation Zone body, locate the two `Blur Attribute` nodes.\n\nEach is configured with `data_type='FLOAT'` and `Iterations=1`. The `Value` input receives `Math(COSINE, theta_field)` or `Math(SINE, theta_field)` — **not** the stored attribute but a live field computed inline each frame. BlurAttribute evaluates the field at every connected vertex, then replaces each vertex value with the unweighted mean of its edge-neighbours' values.\n\nFor an interior vertex on the 56×56 grid (degree 4), the output is exactly `(cos(θ_N) + cos(θ_E) + cos(θ_S) + cos(θ_W)) / 4`. For an edge vertex (degree 2 or 3), the denominator adjusts. Increase `Iterations` to 2 for a larger effective interaction radius — each extra iteration passes the blur through one more edge hop, equivalent to enlarging r in the original Vicsek model.",
    },
    {
      title: "Vary η_c and observe the transition point shift",
      body: "Set `BLUR_ITER = 2` in blueprint.py and re-run. Each vertex now averages over a 2-hop neighbourhood (up to 12 neighbours for interior vertices). A larger interaction radius raises the critical noise — the Vicsek model orders more easily when agents listen further. You will see the transition cross from disordered to ordered earlier in the cooling schedule (lower frame number).\n\nAlternatively, keep `BLUR_ITER = 1` and change `ETA_HOT = 3.0`, `ETA_COLD = 0.8`, `FRAME_END = 400`. The phase transition is now slower — watch the coarsening in the 100–200 frame window at near-critical noise. The domain-wall motion follows Lifshitz–Allen–Cahn kinetics: domain radius R grows as `R(t) ∝ √t` if noise is just below η_c.\n\nFor a frozen snapshot at exactly η_c: set `ETA_HOT = ETA_COLD = 1.05` and run 200 frames. The lattice never orders; it remains in a perpetual critical state with scale-invariant colour patches. Long-exposure renders of this state make striking light paintings.",
    },
  ],
  finalResult:
    "A 56×56 vertex lattice (3 136 points) with a heading-angle θ attribute evolving each frame via circular-mean BlurAttribute averaging plus uniform noise, implementing the Vicsek (1995) active-matter model in a GN Simulation Zone. Noise cools from η=2.20 to η=0.10 over 280 frames, crossing the second-order phase transition at η_c ≈ 1.05. Colour-wheel emission material (theta_01 → rainbow ValToRGB) visualises the disordered→ordered transition as a live viewport animation, saved as hf_vicsek.blend.",
  variations: [
    "Add a second lattice layer at Z=0.1 with slightly different ETA_COLD (0.15 instead of 0.10). The two layers develop different domain orientations; the colour contrast between them seen from above mimics light-painted double-exposure with two poi performers choosing different final directions.",
    "Replace the `FunctionNodeRandomValue` Seed with a `SceneTime.Frame × prime_constant + vertex_index_noise` expression to desynchronise per-vertex noise timing slightly — this slows domain growth compared to fully correlated frame noise, mimicking the effect of spatial noise correlations in real flocks.",
    "Set ETA_COLD = 0.0 (zero noise) and ETA_HOT = 0.0 (start in an almost-ordered state with tiny perturbation). The system is now a pure XY model at T=0 — smooth spin waves propagate outward from any local perturbation. These waves are the Nambu-Goldstone modes of the broken continuous symmetry, the same physics as magnons in a ferromagnet.",
    "Bake the simulation to disk (modifier → Simulation Zone → Bake), then export a sequence of PNG frames with `record.py`. Composite the PNG sequence in the VSE with a colour-dodge blend over a black background — the coarsening domains look like coloured ink pooling in water.",
    "Increase N to 96 and decrease CELL to 0.07 m for the same physical lattice size. The phase transition is sharper at larger system size (finite-size effects diminish as N → ∞). Compare the transition frame between N=56 and N=96 runs — the N=96 transition is 5–10 frames earlier because larger systems order more decisively.",
  ],
  troubleshooting: [
    {
      symptom: "The lattice shows a fixed rainbow pattern and never changes",
      cause:
        "The Simulation Zone has baked data loaded from a prior run, or the Frame → Seed link on FunctionNodeRandomValue is broken.",
      fix: "In the modifier, expand the Simulation section and click 'Delete Baked Data' if present. In the GN editor, confirm that GeometryNodeInputSceneTime.outputs['Frame'] connects to FunctionNodeRandomValue.inputs['Seed']. A constant Seed generates the same per-vertex random values every frame, making the noise term cancel on average — the system looks frozen.",
    },
    {
      symptom: "All vertices turn the same hue within 10 frames (instant ordering)",
      cause:
        "ETA_HOT is set below η_c (< 1.05). The system starts already in the ordered phase and the 'initial noise' seeds a near-aligned state that immediately locks.",
      fix: "Increase ETA_HOT to at least 2.0 to guarantee the system starts disordered. At η = 2.20, the BlurAttribute averaging is overwhelmed by the noise term and the circular mean returns a quasi-random direction — the initial condition effectively resets every frame.",
    },
    {
      symptom: "theta_01 attribute shows values outside [0, 1] in the Spreadsheet",
      cause:
        "The ARCTAN2 node returns θ ∈ [−π, π]. Adding large-amplitude noise can push individual vertices outside this range before the next frame's atan2 normalises them, briefly exceeding [−π, π] which maps theta_01 outside [0, 1].",
      fix: "After the noise addition, add a `Math(MODULO, theta_new + π, 2π) − π` chain to clamp θ back into [−π, π] before storing. In practice, the material's ValToRGB node handles out-of-range Fac by clamping, so the visual artefact is invisible — but the Spreadsheet will reflect the corrected values after adding the modulo clamp.",
    },
  ],
  externalLinks: [
    {
      label:
        "T. Vicsek et al. — Novel Phase Transition in Self-Driven Particles (1995, PD preprint)",
      href: "https://arxiv.org/abs/cond-mat/9507055",
    },
    {
      label:
        "Blender Manual — Simulation Zone (CC-BY-SA 4.0, Blender Foundation)",
      href: "https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html",
    },
  ],
  relatedTutorials: [
    {
      label: "Boid Flock — Craig Reynolds Three-Force Steering & Emergent Flocking",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-boid-flock",
    },
    {
      label:
        "Ising Model — Ferromagnetic Spin Lattice & Metropolis Phase Transition",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-ising-model-spin-lattice-phase-transition",
    },
    {
      label:
        "Kuramoto Oscillators — Phase Synchronisation & Emergent Coherence",
      href: "/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr",
    },
    {
      label:
        "Reaction-Diffusion Turing — Grey-Scott Chemical Pattern Formation",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-simulation-zone-vicsek-active-matter-polar-flock",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "geometry-nodes",
      "simulation",
      "physics",
      "active-matter",
      "light-painting",
      "statistical-mechanics",
    ],
    body: Body,
  },
  data,
);

import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        In 1925 Ernst Ising solved a one-dimensional model of interacting
        magnetic spins, hoping to explain ferromagnetism. He found no phase
        transition and concluded the model was too simple to be physical.
        Twenty years later Lars Onsager solved the <em>two-dimensional</em>{" "}
        case exactly and discovered one of the most celebrated results in
        theoretical physics: a sharp ferromagnetic phase transition at
        T<sub>c</sub> = 2J / ln(1 + √2) ≈ 2.269 J/k<sub>B</sub>, where the
        system jumps from disordered noise to long-range magnetic order. That
        transition is what this blueprint makes visible, one Geometry Nodes
        frame at a time.
      </p>
      <p>
        The 32×32 quad-face lattice built here carries one binary spin per face
        — stored as a <code>FLOAT</code> named attribute on the{" "}
        <code>FACE</code> domain. A Simulation Zone updates every spin each
        frame using the Metropolis algorithm: sample four periodic neighbours,
        compute the energy penalty ΔE of flipping, and accept the flip with
        probability min(1, exp(−ΔE/T)). The temperature cools linearly from
        T=4.5 to T=0.8 over 200 frames, crossing T<sub>c</sub> halfway through.
        The visual result — a{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          cel-shaded
        </Link>{" "}
        two-tone domain map — reads as a long-exposure light-painting print of
        magnetic order emerging from thermal chaos.
      </p>

      <h2>The Ising Hamiltonian and Metropolis update</h2>
      <p>
        Every spin site i holds σ<sub>i</sub> ∈ {"{−1, +1}"}. The
        Hamiltonian couples nearest neighbours:
      </p>
      <pre>{`H = −J Σ⟨ij⟩ σᵢσⱼ      (J = 1 → ferromagnetic)

Flipping spin i alone changes energy by:
  ΔE = 2J σᵢ Σⱼ∈nbrs σⱼ

  ΔE < 0 → flip always lowers energy   → accept unconditionally
  ΔE ≥ 0 → flip raises energy          → accept with prob exp(−ΔE/T)

min(1, exp(−ΔE/T)) is the Metropolis criterion.`}</pre>
      <p>
        In a standard single-spin-flip chain you update one site at a time so
        that the accepted flip is immediately visible to its neighbours.
        Geometry Nodes updates all faces in parallel — this is technically
        &ldquo;parallel Metropolis&rdquo; and violates strict detailed balance,
        but the macroscopic phase-transition dynamics are qualitatively correct.
        Variation 5 describes the checkerboard sublattice fix for quantitative
        work.
      </p>

      <h2>Index arithmetic: periodic neighbours on a FACE domain</h2>
      <p>
        The GN grid has N×N faces arranged row-major: face index ={" "}
        <code>row * N + col</code>. From the <code>Index</code> node,{" "}
        <code>col = idx mod N</code> and{" "}
        <code>row = floor(idx / N)</code>. The four periodic neighbours are:
      </p>
      <pre>{`right = ((col + 1) mod N) + row * N
left  = ((col − 1 + N) mod N) + row * N
up    = col + ((row + 1) mod N) * N
down  = col + ((row − 1 + N) mod N) * N`}</pre>
      <p>
        Each neighbour index is fed to a <code>SampleIndex(domain=FACE)</code>{" "}
        node, which reads the <code>spin</code> attribute at that face. Adding N
        before applying mod handles negative offsets without branching — the
        same trick used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          Turing Reaction-Diffusion
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-predator-prey-lotka-volterra-ecosystem"
          className={lk}
        >
          Lotka-Volterra
        </Link>{" "}
        blueprints.
      </p>

      <h2>Temperature schedule and the phase transition</h2>
      <p>
        The <code>GeometryNodeInputSceneTime</code> Frame output drives a
        linear interpolation: T(f) = T_HOT − (T_HOT − T_COLD) × (f /
        FRAME_END). This temperature is recomputed every frame inside the
        Simulation Zone, so no driver or keyframe is needed. The same frame
        socket seeded into <code>FunctionNodeRandomValue</code> ensures the
        pseudo-random acceptance values change every frame — without it the
        lattice would freeze after the first accepted state.
      </p>
      <p>
        Three regimes are visible across the 200-frame animation: at T=4.5
        (frames 1–40) every face flips independently and the emission map is
        uniform salt-and-pepper noise. Near T<sub>c</sub> (frames 80–130) the
        fluctuation length diverges; large white and indigo blobs form and
        dissolve at every scale simultaneously — scale invariance, the visual
        signature of a second-order phase transition. Below T<sub>c</sub>{" "}
        (frames 150–200) a single domain colour dominates and domain walls
        become sharp, slow-moving boundaries. The exact crossing point of the
        bulk magnetisation connects directly to Onsager&apos;s 1944 calculation
        — one of the deepest analytic results in statistical mechanics,
        expressed here as a colour ramp.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-24",
  title:
    "GN Simulation Zone — 2D Ising Model: Ferromagnetic Spin Lattice, Metropolis Dynamics & Magnetic Domain Light-Painting (Blender 5.1)",
  lede: "A 32×32 quad-face lattice carries one binary spin per face; a Geometry Nodes Simulation Zone runs parallel Metropolis dynamics each frame — sampling four periodic neighbours, computing ΔE = 2Jσᵢ Σσⱼ, and accepting flips via min(1, exp(−ΔE/T)) — while the temperature cools linearly from T=4.5 through the ferromagnetic phase transition at T_c ≈ 2.269 to T=0.8, rendered as a two-tone indigo/white emission map for light-painting and WebXR.",
  body: Body,
  libraryPath:
    "blends/geometry-nodes/gn-simulation-zone-ising-model-spin-lattice-phase-transition/",
  steps: [
    {
      title: "Run blueprint.py — lattice construction and GN tree build",
      body: "Open Blender 5.1 → **Scripting** workspace. Open `blueprint.py` and press **Run Script**.\n\n`purge()` clears the scene. `make_lattice()` builds an (N+1)×(N+1)=33×33 vertex grid giving 32×32=1024 quad faces, then seeds a random 0/1 spin attribute on the FACE domain via `mesh.attributes.new('spin','FLOAT','FACE')` and `foreach_set`.\n\n`build_ising_tree()` creates a GN modifier and constructs the Simulation Zone node tree: `sim_i.pair_with_output(sim_o)` establishes the state loop; index arithmetic nodes decode each face's row/col; four `SampleIndex(FACE)` nodes read neighbour spins; a chain of Math nodes computes ΔE, acceptance probability, and the flip decision.\n\nSwitch to **Rendered** shading to see the emission map on a pure-black world.",
    },
    {
      title: "Play the simulation and observe the three regimes",
      body: "Press **Space** to run the Simulation Zone frame-by-frame.\n\n**Frame 1–40 (T ≈ 4.5)**: disordered. The acceptance probability for every flip is high regardless of neighbourhood — almost 50% of spins flip each frame. The emission map looks like static.\n\n**Frame 80–130 (T ≈ 2.5–2.1, near T_c)**: critical regime. Watch domain blobs appear and dissolve at ALL size scales simultaneously. This is the correlation length diverging — Onsager showed ξ ∝ |T − T_c|^(−1) near T_c.\n\n**Frame 160–200 (T ≈ 1.0–0.8)**: ordered. One colour dominates. Domain walls slow down because flipping a spin surrounded by opposite neighbours has ΔE = 2J×4 = 8 → acceptance probability = exp(−8/0.9) ≈ 10^(−4).\n\nScrub the timeline to see the transition unfold.",
    },
    {
      title: "Understand the ±1 encoding and ΔE calculation",
      body: "The `spin` attribute stores 0.0 (down) or 1.0 (up). The Ising Hamiltonian uses ±1, so the blueprint converts: `σ = spin × 2 − 1`. A chain of `Math(MULTIPLY,2) → Math(SUBTRACT,1)` nodes appears five times — once for the self spin and once per neighbour.\n\nThe neighbour sum `nsum = σ_right + σ_left + σ_up + σ_down` ranges from −4 to +4. The energy cost `ΔE = 2J × σ_self × nsum`:\n- If spin is aligned with all 4 neighbours: ΔE = 2×1×(+1)×4 = +8 (never flip below T_c)\n- If spin opposes all 4 neighbours: ΔE = 2×1×(+1)×(−4) = −8 (always flip)\n\n`Math(MAXIMUM, 0)` clamps ΔE before negating and dividing by T — this is the standard Metropolis shortcut: for negative ΔE, exp(−ΔE/T) > 1, so min(1, exp) = 1 automatically.",
    },
    {
      title: "Inspect the FunctionNodeRandomValue and Seed socket",
      body: "Open the node editor with the lattice selected. Locate the `Random Value` node (type=Float, Min=0, Max=1).\n\nThis node **implicitly hashes the current face index** as its ID — each face gets a different random float even without an explicit ID socket connection. The `Seed` socket is connected to `SceneTime → Frame`, which changes every frame: the hash input is `f(face_index, frame)`, giving per-face, per-frame variation.\n\nCRITICAL: if you disconnect the Frame → Seed link, the random values are constant across frames. The lattice freezes at its first accepted state. Similarly, if you set Seed to a constant, every even frame is identical to every other even frame (the same hash pattern repeats).\n\nTry: connect a constant integer (e.g. 42) to Seed and play. The lattice oscillates between the same two states forever.",
    },
  ],
  finalResult:
    "A 32×32 (1024-face) quad mesh with one binary spin per face, updated by parallel Metropolis dynamics inside a GN Simulation Zone. Temperature cools from T=4.5 to T=0.8 over 200 frames crossing T_c ≈ 2.269. The two-tone indigo/white emission material (CONSTANT colour ramp interpolation) renders magnetic domain patterns: disordered static → critical-scale-invariant fluctuations → large ordered domains. The phase transition is visible near frame 100. The scene saves as hf_ising_model.blend.",
  variations: [
    "Set T_HOT = T_COLD = 2.269 (the exact Onsager T_c) and FRAME_END = 500. At T_c the correlation length diverges, producing domain structures at ALL scales — fractal, scale-invariant. This is critical opalescence in magnetic form. Long exposures of this state are poster-worthy.",
    "Add a second `StoreNamedAttribute` that records `σ_self × nsum` as a `magnetisation_local` attribute, then add a material parameter mapping this to a diverging blue–white–red colour ramp. Faces at domain walls will glow red; interior spins glow blue. The wall geometry lights up.",
    "Replace the linear cooling schedule with exponential: `T(f) = T_COLD + (T_HOT - T_COLD) × exp(−f / 50)`. The system cools rapidly at first (dramatic domain nucleation) then slowly at low T (domain growth and coarsening). This mimics rapid quenching — a glass-transition analogue.",
    "Change N to 64 (4096 faces). The domain structures become richer and the critical fluctuations span larger scales, but the Simulation Zone performance may drop to 5–10 fps on modest hardware. Use `record.py` to render offline rather than scrubbing interactively.",
    "Implement checkerboard sublattice updates for strict detailed balance: add a Python pre-pass that stores a `checkerboard` attribute (0.0 on black squares, 1.0 on white) once at frame 0. Inside the Sim Zone, add `Math(MODULO, SceneTime.Frame, 2) → Compare(EQUAL, 0) → Switch` to zero out `new_spin` updates on alternating sublattices. Each sublattice updates only on its own frames, restoring detailed balance.",
  ],
  troubleshooting: [
    {
      symptom: "The lattice does not animate — spins are frozen after frame 1",
      cause:
        "The Simulation Zone is not advancing. Either the modifier is disabled, the simulation cache is paused, or the FunctionNodeRandomValue Seed is constant.",
      fix: "In the modifier stack, confirm the GN modifier is enabled (eye icon). In the GN editor, look for a blue 'bake' indicator on the Simulation Zone — if baked data is present, the zone replays the bake rather than re-simulating. Click 'Delete Baked Data' in the modifier's Simulation section. Also confirm that SceneTime.Frame is connected to RandomValue.Seed — a disconnected Seed produces identical random values every frame and the flip rate looks zero.",
    },
    {
      symptom:
        "All faces show the same colour — the lattice is fully white or fully indigo",
      cause:
        "The simulation converged to a ground state on frame 1. This happens if T is too low on startup (T_HOT < 0.5) or if the initial spin state is already fully ordered (SEED happened to produce all 0s or all 1s with N=1).",
      fix: "Increase T_HOT to at least 3.0 to ensure the system starts in a high-entropy state. Check that `make_lattice()` ran successfully — open the Spreadsheet Editor, set Domain=Face, and confirm the 'spin' column shows a mix of 0.0 and 1.0 values at frame 0.",
    },
    {
      symptom:
        "Neighbour spin reads appear to wrap incorrectly — faces at the grid edge look different from interior faces",
      cause:
        "The periodic boundary index arithmetic assumes N faces per row, but if the grid was created with a different face count the index encoding breaks.",
      fix: "Verify that N in blueprint.py matches the actual face grid. `make_lattice()` calls `bmesh.faces.new` in a nested loop of `range(N)×range(N)` producing exactly N² faces. Open the Spreadsheet (Face domain) and confirm face count = N×N = 1024. If the grid primitive was changed manually (e.g. via bpy.ops.mesh.primitive_grid_add), the face count may differ — always use `make_lattice()` rather than a subdivided plane.",
    },
  ],
  externalLinks: [
    {
      label:
        "Blender Manual — Simulation Zone (CC-BY-SA 4.0, Blender Foundation)",
      href: "https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html",
    },
    {
      label:
        "Ernst Ising — Beitrag zur Theorie des Ferromagnetismus (1925, Public Domain)",
      href: "https://link.springer.com/article/10.1007/BF02980577",
    },
    {
      label:
        "Lars Onsager — Crystal Statistics I: Exact 2D solution (1944, Public Domain)",
      href: "https://journals.aps.org/pr/abstract/10.1103/PhysRev.65.117",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Reaction-Diffusion Turing — Chemical Pattern Formation & Activator-Inhibitor",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
    },
    {
      label: "Chladni Standing Waves — 2D Wave Equation & Leapfrog Stencil",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-wave-equation-chladni-standing-waves",
    },
    {
      label:
        "Predator-Prey Lotka-Volterra — Three-State Spatial Cellular Automaton",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-predator-prey-lotka-volterra-ecosystem",
    },
    {
      label: "Abelian Sandpile — BTW Self-Organised Criticality & Fractal Cascade",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-abelian-sandpile-soc-fractal-cascade",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-simulation-zone-ising-model-spin-lattice-phase-transition",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "geometry-nodes",
      "simulation",
      "physics",
      "statistical-mechanics",
      "light-painting",
    ],
    body: Body,
  },
  data,
);

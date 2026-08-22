import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        John Horton Conway published his cellular automaton in 1970 and the
        algorithm has not changed since: a cell survives when it has two or
        three living neighbours; a dead cell is born when it has exactly three.
        Everything else dies or stays dead. The emergent complexity — gliders,
        oscillators, still lifes, spaceships — arises entirely from those four
        words. This tutorial implements those four words inside a Blender 5.1
        Geometry Nodes{" "}
        <strong>Simulation Zone</strong>, running on the face domain of a 32×32
        quad grid, using a single{" "}
        <strong>Blur Attribute</strong> node as the neighbourhood counter.
      </p>

      <p>
        The architectural choice that makes the whole tree possible without any
        extra state items: <em>living state is stored as a FLOAT attribute</em>{" "}
        (0.0 = dead, 1.0 = alive) on the face domain, not as a Boolean. The
        reason is that{" "}
        <code>GeometryNodeBlurAttribute</code> only operates on FLOAT, VECTOR,
        and COLOR fields. With <code>factor = 1.0</code> (i.e.{" "}
        <code>Weight</code> socket at its default) and{" "}
        <code>iterations = 1</code>, Blur Attribute computes the{" "}
        <strong>mean of edge-adjacent face values</strong> for every face
        simultaneously. For an interior face of a quad grid — exactly four
        edge-neighbours — that mean equals{" "}
        <code>(n₁ + n₂ + n₃ + n₄) / 4</code>. Multiplying by four and rounding
        recovers the exact integer neighbour count. Two Math nodes. No loops. No
        separate counting topology. This is the same blur-as-diffusion insight
        used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
          className={lk}
        >
          heat diffusion tutorial
        </Link>
        , but applied to a discrete binary field rather than a continuous
        temperature gradient.
      </p>

      <p>
        The boundary approximation is worth understanding precisely. Edge faces
        (three edge-neighbours) and corner faces (two) receive a blurred value
        that, when multiplied by four, does not land on an integer before
        rounding. Edge face:{" "}
        <code>blur × 4 = (n₁ + n₂ + n₃) / 3 × 4 = 1.33 × alive_sum</code>.
        The Round node maps this onto the nearest integer, which is almost
        always wrong relative to the true neighbour count. The practical effect
        is a roughly one-cell-wide dead border at the grid edges, regardless of
        the initial state. If your project needs correct edge behaviour, one
        solution is to allocate a two-cell-wide guard border — permanently dead
        cells around the perimeter — so the interior 28×28 region behaves
        correctly and the approximation artefact lands in invisible territory.
        Compare the boundary treatment in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          Reaction-Diffusion tutorial
        </Link>
        , which also uses Blur Attribute on face topology but where boundary
        softness was acceptable because diffusion is inherently smooth near
        edges.
      </p>

      <p>
        The decision logic inside the Simulation Zone body reads as follows,
        left to right. A <code>FunctionNodeCompare (GREATER_THAN, B=0.5)</code>{" "}
        on the raw alive float gives <code>is_alive</code> as a boolean field.
        A <code>FunctionNodeBooleanMath (NOT)</code> inverts it to{" "}
        <code>is_dead</code>. Two <code>FunctionNodeCompare (EQUAL, ε=0.1)</code>{" "}
        nodes test the rounded neighbour count against 2.0 and 3.0. A pair of{" "}
        <code>FunctionNodeBooleanMath (AND)</code> nodes produce the survival
        condition (<code>is_alive AND (n==2 OR n==3)</code>) and the birth
        condition (<code>is_dead AND n==3</code>). A final OR gives the new
        alive boolean, which a <code>ShaderNodeMath (MULTIPLY×1.0)</code>{" "}
        converts back to float (exploiting the implicit bool→float cast in the
        GN field engine) before being written by{" "}
        <code>GeometryNodeStoreNamedAttribute (FLOAT, FACE)</code>. The store
        node is the only geometry-socket node in the body; all field evaluation
        is lazy and evaluates on the face domain it specifies — including the
        Blur Attribute, which therefore uses face-topology adjacency, exactly as
        we need.
      </p>

      <p>
        The EEVEE material uses a{" "}
        <code>ShaderNodeAttribute</code> reading the per-face{" "}
        <code>alive</code> attribute, feeding a colour ramp with{" "}
        <code>CONSTANT</code> interpolation (no bleed across the 0→1 threshold)
        to hard-switch between near-black and saturated neon green. The constant
        ramp is the same per-face flat-shading trick exploited in the{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          vertex colour attributes tutorial
        </Link>
        : discrete attribute → constant ramp → emission creates the appearance
        of a self-lit grid with zero ambient light bleed between cells. The
        alive-cell emission strength is set to 5.0; raising it to 8–12 causes
        bloom in EEVEE Next, which looks spectacular but slows down playback on
        integrated GPUs.
      </p>

      <p>
        A practical note on cache behaviour in Blender 5.1: the Simulation Zone
        does <em>not</em> cache by default when the timeline is scrubbed
        backwards. If you go from frame 60 back to frame 10, Blender re-runs
        the simulation from frame 0 to 10 (or from the nearest baked checkpoint,
        if you have used the Bake Node). For interactive exploration, press{" "}
        <strong>Space</strong> and let the playback run forward continuously
        rather than scrubbing. For a final recording, use{" "}
        <code>record.py</code>, which calls{" "}
        <code>frame_set(f) + view_layer.update()</code> in a forward loop to
        warm the full cache before the render pass begins — the same warm-up
        pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-boid-flock"
          className={lk}
        >
          Boid Flocking tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-simulation-zone-game-of-life-mesh-faces",
  title:
    "GN Simulation Zone — Conway's Game of Life on Mesh Faces: Blur Attribute as a Neighbourhood Counter",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Implement Conway's B3/S23 cellular automaton in a Geometry Nodes Simulation Zone by exploiting the insight that Blur Attribute on a regular quad grid is also a face-neighbour counter — multiply by four, round, and the integer neighbour sum falls out without any extra nodes.",
  summary:
    "A Blender 5.1 Geometry Nodes Simulation Zone running Conway's Game of Life on the face domain of a 32×32 quad grid. The key technique: Blur Attribute with factor=1.0 and iterations=1 computes the mean of edge-adjacent face values; for interior quad faces this equals (n₁+n₂+n₃+n₄)/4, so multiplying by four and rounding recovers the exact neighbour count. Survival (n∈{2,3}) and birth (n=3) rules are applied via FunctionNodeCompare and FunctionNodeBooleanMath, the living state stored as a FLOAT named attribute and read back each frame by the Simulation Zone.",
  tags: [
    "blender",
    "geometry-nodes",
    "simulation",
    "cellular-automata",
    "blur-attribute",
    "procedural",
    "blender-5",
  ],
  Body,
  related: [
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
      label: "GN Simulation Zone — Reaction-Diffusion (Turing Pattern)",
      note: "Blur Attribute as spatial diffusion across face topology",
    },
    {
      href: "/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion",
      label: "GN Blur Attribute — Heat Diffusion",
      note: "Deep dive into Blur Attribute mechanics on mesh domains",
    },
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-boid-flock",
      label: "GN Simulation Zone — Boid Flocking",
      note: "Per-element state as named attributes in the Simulation Zone",
    },
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal",
      label: "GN Simulation Zone — Wave Reveal",
      note: "Simulation Zone fundamentals: geometry body channel and state propagation",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/blur_attribute.html",
      label: "Blur Attribute — Blender Manual",
      note: "CC-BY-SA 4.0 · Blender Foundation · related: all GN Attribute nodes",
    },
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html",
      label: "Simulation Zone — Blender Manual",
      note: "CC-BY-SA 4.0 · Blender Foundation · related: Simulation Bake Node, State Items reference",
    },
  ],
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    difficulty: "advanced",
    time: "2–3 hours",
    overview:
      "Conway's Game of Life runs on every machine with a 2D grid, but running it inside a Blender Geometry Nodes Simulation Zone on the face domain of a mesh unlocks something the desktop versions cannot offer: the living state is a named attribute that the rest of the Blender pipeline can read — materials, other GN modifiers, compositor passes. This tutorial builds that foundation and explains exactly why Blur Attribute doubles as a counting operator on regular quad topology.",
    goal: "A 961-face quad grid with a working B3/S23 cellular automaton running in a Simulation Zone, an emission material driven by the per-face alive attribute, and a record.py that renders the first 80 frames to viewport.mp4.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Simulation Zone, Blur Attribute, FunctionNodeCompare — all require Blender 4.1+; Blender 5.1 is the target for this recipe.",
      },
    ],
    prerequisites: [
      "Comfortable with the GN node editor — adding nodes, making links, reading field sockets",
      "Understands what a Simulation Zone is and how the geometry body channel propagates state",
      "Knows how Named Attribute and Store Named Attribute work as a read/write pair",
      "Has seen Blur Attribute used at least once (e.g. the heat diffusion tutorial)",
    ],
    steps: [
      {
        title: "Create the 32×32 quad grid and seed 'alive'",
        body: "Run `blueprint.main()` or copy the `make_grid()` function verbatim. A `primitive_grid_add` with `x_subdivisions=31, y_subdivisions=31` produces 961 quad faces. The bmesh loop then writes 0.0 or 1.0 to a new float face layer named `alive`, at 30% density using a seeded RNG.\n\nVerify: with the object selected, open the Geometry Nodes Spreadsheet, set the domain dropdown to Face, and confirm the `alive` column shows a mix of 0.0 and 1.0 values at frame 0.",
      },
      {
        title: "Add the GN modifier and wire the Simulation Zone frame",
        body: "Call `build_gol_tree(obj)`. This creates a new node group `GN_GameOfLife`, adds a `GeometryNodeSimulationInput` and `GeometryNodeSimulationOutput`, calls `sim_i.pair_with_output(sim_o)`, and connects `GroupInput.Geometry → SimInput.Geometry`. The Simulation Output's Geometry connects to `GroupOutput.Geometry`. These outer links are the frame; the body nodes go between them.",
      },
      {
        title: "Wire the Blur Attribute neighbourhood counter",
        body: "Inside the simulation body:\n\n1. `GeometryNodeInputNamedAttribute` with `data_type='FLOAT'`, name=`alive` → reads the previous frame's living state.\n2. `GeometryNodeBlurAttribute` with `data_type='FLOAT'`, `Iterations=1`, `Weight` left at default 1.0 → computes mean of edge-adjacent face values.\n3. `ShaderNodeMath (MULTIPLY, ×4)` → scales the mean to recover the neighbour sum.\n4. `ShaderNodeMath (ROUND)` → cleans float drift.\n\nThe result is the integer neighbour count as a float field. For an interior face with four alive neighbours, the chain produces exactly 4.0.",
      },
      {
        title: "Apply the Conway decision logic",
        body: "Add two `FunctionNodeCompare (FLOAT, EQUAL, ε=0.1)` nodes comparing the rounded count to 2.0 and 3.0. Add a `FunctionNodeCompare (FLOAT, GREATER_THAN)` comparing the raw alive float to 0.5 to produce `is_alive`. A `FunctionNodeBooleanMath (NOT)` gives `is_dead`.\n\nSurvival: `AND(is_alive, OR(n==2, n==3))`. Birth: `AND(is_dead, n==3)`. Final state: `OR(survival, birth)`.",
      },
      {
        title: "Write the new state and close the Simulation Zone",
        body: "A `ShaderNodeMath (MULTIPLY ×1.0)` converts the final boolean to a float via implicit cast. A `GeometryNodeStoreNamedAttribute (FLOAT, FACE)` with name=`alive` writes the result back.\n\nCritical wiring: `SimInput.Geometry → Store.Geometry → SimOutput.Geometry`. The store node is the only geometry-socket node in the body; every field upstream of it evaluates on the face domain the store specifies, including Blur Attribute.",
      },
      {
        title: "Add the emission material",
        body: "Run `make_material(obj)`. A `ShaderNodeAttribute` reads `alive` from the face domain, feeds a colour ramp with `CONSTANT` interpolation and two stops: near-black at position 0.0, saturated neon green at position 0.5. The ramp output drives an Emission node (strength=5.0) mixed with a dark Principled BSDF via a Mix Shader with the attribute Fac as the blend weight.",
      },
      {
        title: "Play the simulation and verify the rules",
        body: "Press Space. In the first 5–10 frames the random seed resolves itself: isolated live cells die (underpopulation), overcrowded clusters thin out, surviving clusters with 2–3 neighbours stabilise into still lifes or oscillators.\n\nScrub the Spreadsheet while playing to confirm `alive` changes each frame. If the attribute column shows identical values across frames, the Simulation Zone is not evaluating — check that `sim_i.pair_with_output(sim_o)` was called and that the outer geometry link is present.",
      },
    ],
    finalResult:
      "A 961-face quad grid with a live GOL automaton evolving from a 30%-density random seed. The emission material shows the living state as neon green cells against a near-black background. Typical evolution: ~150 cells die in the first 10 frames, leaving ~130 stable alive cells after frame 40. Oscillators (blinkers, toads) continue flickering indefinitely; still lifes (blocks, beehives) lock in place. Running record.py renders the first 80 frames to viewport.mp4.",
    variations: [
      "Wrap edges: add a Geometry Nodes step after the store that uses Index and domain-size arithmetic to copy the alive value of face 0 onto face GRID_DIVS-1, etc. True toroidal topology removes the boundary approximation entirely.",
      "Custom rules: change the compare B values to implement different cellular automata — Day & Night (B3678/S34678), Seeds (B2/S), or High Life (B36/S23) — without touching any other node.",
      "Density driven by texture: replace the random bmesh seed with a greyscale image sampled onto the grid via `bpy.ops.uv.smart_project` + `Image Texture` node evaluated at face centres. The initial pattern can be a photograph or a hand-drawn mask.",
      "3D volume: replace the flat grid with a UV Sphere subdivided to level 4, giving a closed curved surface. The Blur Attribute works on the sphere face topology unchanged; the result is a GOL running on the surface of a sphere.",
    ],
    troubleshooting: [
      {
        symptom: "All cells are dead after frame 1 — the grid goes black immediately",
        cause:
          "The 'alive' named attribute was not written to the mesh before the GN modifier was applied, or it was written to a different domain (e.g. VERTEX instead of FACE). The Blur Attribute and Store Named Attribute both target FACE domain; if the attribute does not exist there, the Named Attribute read returns 0.0 for every face.",
        fix:
          "Check `bpy.data.objects['gol_grid'].data.attributes` — there should be an 'alive' entry with domain='FACE' and data_type='FLOAT'. If missing, re-run `make_grid()`. If present but all-zero, verify `rng.random() < INITIAL_DENSITY` runs in the bmesh face loop — add a `print(sum(v for v in vals)/len(vals))` after the loop to confirm ~30% density.",
      },
      {
        symptom: "'pair_with_output' AttributeError on GeometryNodeSimulationInput",
        cause:
          "Running on Blender 4.0 or earlier. The `pair_with_output()` method was introduced with the Simulation Zone in Blender 4.0 but its Python binding stabilised in 4.1. Blender 3.x has no Simulation Zone at all.",
        fix:
          "Confirm `bpy.app.version >= (4, 1, 0)`. If not, upgrade to Blender 5.1. The blueprint targets 5.1 and no workaround exists for older versions.",
      },
      {
        symptom: "Cells evolve for a few frames then freeze — the automaton stops changing",
        cause:
          "The simulation cache was baked to disk (via Bake Node or manual bake) and the baked frames are being served instead of re-computing. Blender 5.1 bake files take precedence over live evaluation.",
        fix:
          "In the Geometry Nodes modifier panel, look for a Bake section and click 'Delete Bake'. Alternatively, remove any Simulation Bake nodes from the GN tree. After deletion, scrub back to frame 0 and play forward again.",
      },
      {
        symptom: "GeometryNodeBlurAttribute not found — bl_idname error",
        cause:
          "The node type string changed in Blender 5.x. In Blender 4.0–4.1 the node was registered as 'GeometryNodeBlurAttribute'; later builds may use a different internal name.",
        fix:
          "Confirm the correct type string with: `[t for t in dir(bpy.types) if 'blur' in t.lower()]`. Use whatever string appears there. As of Blender 5.1 the correct type is 'GeometryNodeBlurAttribute'.",
      },
    ],
  },
  base,
);

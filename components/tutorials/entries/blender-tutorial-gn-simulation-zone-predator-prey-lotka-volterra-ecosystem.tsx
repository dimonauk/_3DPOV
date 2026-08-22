import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Alfred Lotka and Vito Volterra independently described the oscillating
        dance between a prey species and its predator in 1925–26. The continuous
        ODE version cycles in phase space without ever settling. The{" "}
        <em>spatial</em> version — where every face on a mesh grid is either
        empty, colonised by prey, or occupied by a predator, and the fate of
        each face depends only on its direct edge-neighbours — produces something
        qualitatively different: rotating <strong>spiral waves</strong> that
        travel across the surface indefinitely. This tutorial implements that
        spatial system entirely inside a Blender 5.1 Geometry Nodes{" "}
        <strong>Simulation Zone</strong>, encoding the three states as a single
        FLOAT named attribute and using two concurrent Blur Attribute passes as
        neighbourhood counters — extending the technique introduced in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-game-of-life-mesh-faces"
          className={lk}
        >
          Game of Life tutorial
        </Link>{" "}
        from one population to two.
      </p>

      <h2>Why Blur Attribute is the right neighbourhood counter</h2>
      <p>
        A Blur Attribute node with <code>Iterations=1</code> and{" "}
        <code>Weight=1.0</code> (default) computes the arithmetic mean of all
        edge-adjacent face values. For an interior face of a quad grid — exactly
        four neighbours — that mean equals{" "}
        <code>(v₁+v₂+v₃+v₄)/4</code>. If the input field is a float mask (1.0
        where prey exists, 0.0 elsewhere), multiplying by four recovers the
        integer count of prey neighbours. A single{" "}
        <code>FunctionNodeCompare (GREATER_THAN, B=0.5)</code> on that scaled
        value then gives a boolean <em>has any prey neighbour</em> flag — no
        For Each zone, no topology iteration, no index lookups. Two Blur passes
        — one for the prey mask, one for the predator mask — run simultaneously
        on the same geometry body, which is why the Simulation Zone needs only a
        single geometry body state item and two float attributes.{" "}
        Contrast this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          Grey-Scott reaction-diffusion tutorial
        </Link>
        , where Blur Attribute is used as a discrete Laplacian on a continuous
        field rather than as a binary neighbourhood counter.
      </p>

      <h2>Single attribute, three states</h2>
      <p>
        Encoding the three states as a single FLOAT attribute{" "}
        <code>state</code> (0.0 = empty, 1.0 = prey, 2.0 = predator) keeps the
        Simulation Zone to one state item, matching the Game of Life pattern.
        Extracting the three booleans costs three Compare nodes:{" "}
        <code>is_prey = (state &gt; 0.5) AND (state &lt; 1.5)</code>;{" "}
        <code>is_pred = state &gt; 1.5</code>;{" "}
        <code>is_empty = NOT(is_prey OR is_pred)</code>. Re-encoding:{" "}
        <code>new_state = new_prey × 1.0 + new_pred × 2.0</code>. The boundary
        approximation is identical to GoL: edge faces accumulate a scaled Blur
        mean rather than an exact count — a one-cell dead border. Interior exact.
      </p>

      <h2>The update rules and their emergent dynamics</h2>
      <p>
        The spatial Lotka-Volterra / Rock-Paper-Scissors update table is:
      </p>
      <pre>{`Prey    → stays Prey      if 0 predator neighbours  (no one to eat it)
Prey    → becomes Pred    if ≥1 predator neighbour   (predation)
Pred    → stays Pred      if ≥1 prey neighbour       (feeds)
Pred    → becomes Empty   if 0 prey neighbours       (starvation)
Empty   → becomes Prey    if ≥1 prey neighbour       (colonisation)
Empty   → stays Empty     otherwise`}</pre>
      <p>
        These six rules wire into four Boolean nodes per population: two AND
        gates (survives/killed for prey; fed/starves for pred) each preceded by a
        NOT and followed by an OR. From a random 35% / 15% seed the system
        self-organises within roughly 30 frames into rotating anticlockwise
        spirals — empty chasing prey chasing predator chasing empty — because
        the only stable attractor for these three cyclic relationships is a
        travelling wave. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-boid-flock"
          className={lk}
        >
          Boid Flock tutorial
        </Link>{" "}
        for comparison: boids use per-point position state rather than per-face
        categorical state, but both ultimately encode neighbour influence as a
        continuous float field that Blur Attribute can summarise in one pass.
      </p>

      <h2>Material: three-stop CONSTANT colour ramp</h2>
      <p>
        A <code>ShaderNodeAttribute</code> reads the face-domain{" "}
        <code>state</code> attribute as a float (0–2). A Math Divide by 2.0
        maps it to the 0–1 range expected by a Colour Ramp. Setting the ramp
        interpolation to <code>CONSTANT</code> and placing stops at 0.0
        (near-black void), 0.4 (phosphor green prey), and 0.7 (hot red
        predator) gives three sharp bands. An Emission node at strength 6.0
        makes the spirals legible against a black world background — the same
        emission-as-false-colour approach used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
          className={lk}
        >
          heat-diffusion tutorial
        </Link>
        .
      </p>

      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Simulation Zone — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Foundation. State items, geometry body
          channel, bake behaviour, and the Python <code>pair_with_output()</code>{" "}
          binding. Related: Simulation Bake Node, Simulation State Items
          reference in the same section.
        </li>
        <li>
          <a
            href="https://github.com/mlankhorst/rps-cellular"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            rps-cellular
          </a>{" "}
          · MIT · Maarten Lankhorst. Interactive browser implementation of the
          spatial Rock-Paper-Scissors cellular automaton — the same three-state
          cyclic dominance rules implemented here. Related sibling:{" "}
          <a
            href="https://github.com/pmneila/jsexp"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            pmneila/jsexp
          </a>{" "}
          (Grey-Scott reaction-diffusion, MIT).
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          · Apache-2.0 · Khronos Group. The exporter that writes custom face
          attributes as glTF accessors when <code>export_attributes=True</code>{" "}
          — enabling the <code>state</code> snapshot to survive into Three.js.
          Related: glTF-Validator for attribute accessor conformance checking.
        </li>
      </ul>
    </>
  );
}

const base = {
  slug: "blender-tutorial-gn-simulation-zone-predator-prey-lotka-volterra-ecosystem",
  title: "GN Simulation Zone — Predator-Prey Lotka-Volterra Ecosystem",
  date: "2026-07-23",
  Body,
  relatedLinks: [
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-game-of-life-mesh-faces",
      label: "GN Simulation Zone — Conway's Game of Life on Mesh Faces",
      note: "The Blur Attribute neighbourhood-counter pattern this tutorial extends",
    },
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
      label: "GN Simulation Zone — Grey-Scott Reaction Diffusion",
      note: "Two-species continuous field in a Simulation Zone; Turing pattern instability",
    },
    {
      href: "/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion",
      label: "GN Blur Attribute — Heat Diffusion",
      note: "Blur Attribute as discrete Laplacian on a continuous scalar field",
    },
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-boid-flock",
      label: "GN Simulation Zone — Boid Flock",
      note: "Per-point position state and separation/cohesion forces in a Simulation Zone",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html",
      label: "Simulation Zone — Blender Manual",
      note: "CC-BY-SA 4.0 · Blender Foundation · state items, bake, Python binding",
    },
    {
      href: "https://github.com/mlankhorst/rps-cellular",
      label: "rps-cellular — Spatial Rock-Paper-Scissors",
      note: "MIT · Maarten Lankhorst · three-state cyclic dominance CA in the browser",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-simulation-zone-predator-prey-lotka-volterra-ecosystem",
    time: "one session",
    difficulty: "advanced",
    goal:
      "Implement a three-state spatial Lotka-Volterra / Rock-Paper-Scissors system in a Blender 5.1 GN Simulation Zone using two Blur Attribute passes as neighbourhood counters, and observe the characteristic rotating spiral waves that emerge on the face domain of a 31×31 quad grid.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Simulation Zone requires Blender 4.0+; Simulation Zone Python API stable from 4.1. Target is 5.1.",
      },
    ],
    prerequisites: [
      "Comfortable with GN: Named Attribute, Store Named Attribute, Math nodes, Bool Math nodes",
      "Understand the Simulation Zone frame loop — see gn-simulation-zone-wave-reveal",
      "Know how Blur Attribute acts as a neighbourhood mean — see gn-simulation-zone-game-of-life-mesh-faces",
    ],
    steps: [
      {
        title: "Create the 31×31 quad grid and seed 'state'",
        body: "Run `blueprint.main()` or copy `make_grid()`. A `primitive_grid_add` with `x_subdivisions=31, y_subdivisions=31` gives 961 quad faces. The bmesh loop writes 0.0 (empty), 1.0 (prey), or 2.0 (predator) to a new float face layer `state` at 35% / 15% / 50% density with a seeded RNG.\n\nVerify in the Spreadsheet (Face domain): the `state` column should show roughly 350 ones, 150 twos, 460 zeros at frame 0.",
      },
      {
        title: "Wire the Simulation Zone frame",
        body: "Call `build_pp_tree(obj)`. A `GeometryNodeSimulationInput` and `GeometryNodeSimulationOutput` are added and paired with `sim_i.pair_with_output(sim_o)`. `GroupInput.Geometry → sim_i.Geometry` is the outer left link; `sim_o.Geometry → GroupOutput.Geometry` is the outer right. The body nodes (steps 3–6) connect to `sim_i.outputs['Geometry']` for geometry sockets and return their modified geometry to `sim_o.inputs['Geometry']`.",
      },
      {
        title: "Decode the three-state attribute",
        body: "Inside the zone body: `GeometryNodeInputNamedAttribute(data_type='FLOAT', name='state')` reads the current frame's values. Three Compare nodes extract the booleans: `is_prey = Compare(GREATER_THAN, 0.5) AND Compare(LESS_THAN, 1.5)`; `is_pred = Compare(GREATER_THAN, 1.5)`; `is_empty = NOT(is_prey OR is_pred)`. Cost: 5 nodes, no extra state items.",
      },
      {
        title: "Run two Blur Attribute passes for neighbour counts",
        body: "Convert each boolean to float via `Math(MULTIPLY, ×1.0)`. Feed into two `GeometryNodeBlurAttribute(data_type='FLOAT', Iterations=1)` nodes — one for `prey_f`, one for `pred_f`. Each must receive the `sim_i.outputs['Geometry']` socket (not the outer GroupInput). Multiply each blurred output by 4.0. A `Compare(GREATER_THAN, 0.5)` on each scaled value yields `has_prey_nbr` and `has_pred_nbr`.",
      },
      {
        title: "Apply the six-rule update and re-encode",
        body: "Prey logic: `survives = is_prey AND NOT(has_pred_nbr)`; `born = is_empty AND has_prey_nbr`; `new_prey = survives OR born`.\nPredator logic: `fed = is_pred AND has_prey_nbr`; `kills = is_prey AND has_pred_nbr`; `new_pred = fed OR kills`.\nRe-encode: `new_state = (new_prey × 1.0) + (new_pred × 2.0)`. Store Named Attribute `('state', FLOAT, FACE)` writes back. Chain: `sim_i.Geometry → Store.Geometry → sim_o.Geometry`.",
      },
      {
        title: "Add the emission material and play",
        body: "Run `make_material(obj)`. A ShaderNodeAttribute reads `state`; a Math Divide by 2.0 maps to 0–1; a ColorRamp (CONSTANT, three stops: 0.0→black, 0.4→green, 0.7→red) feeds an Emission node at strength 6.0.\n\nPress Space in the 3D Viewport with EEVEE Next. Within ~10 frames the random seed resolves into patches. By frame 30–40 the first spirals appear. By frame 80 the surface is covered in rotating anticlockwise spirals of green→red→black→green.",
      },
    ],
    finalResult:
      "A 961-face quad grid with a live Predator-Prey spatial cellular automaton. Three-stop CONSTANT emission material renders empty faces as near-black, prey as phosphor green, predators as hot red. From a 35%/15% random seed the system self-organises into rotating spiral waves by frame 40 and maintains them indefinitely. record.py renders frames 0–120 to viewport.mp4 at 1920×1080, 30 fps.",
    variations: [
      "Wrap to sphere: use a subdivided UV Sphere (Subdivisions=4, ~5000 tris) and convert quads after subdividing. Blur Attribute works on triangle topology; the spiral waves wrap around the sphere.",
      "Stochastic rules: add a Noise Texture output as a probabilistic gate — e.g. born prey only when noise > 0.7 AND has_prey_nbr — slowing the wavefront speed and producing more irregular patterns.",
      "Export state snapshot: add a Realise Instances node after the GN modifier and a Python one-liner `bpy.ops.export_scene.gltf(export_attributes=True)` at a chosen frame to capture the state attribute as a GLB accessor readable in Three.js.",
      "Tune the rules: replacing the GREATER_THAN 0.5 threshold with GREATER_THAN 1.5 (two prey neighbours needed for predator survival) shifts from spirals to static spatial coexistence patches — a different attractor in the same rule space.",
    ],
    troubleshooting: [
      {
        symptom: "All faces go empty after 2–3 frames — the grid turns black",
        cause:
          "The 'state' attribute was not seeded on the mesh before the GN modifier ran, or was seeded on the VERTEX domain rather than FACE. Blur Attribute inside the zone reads the FACE domain; a VERTEX attribute returns 0.0 for every face.",
        fix:
          "Check `obj.data.attributes` for an entry with domain='FACE' and data_type='FLOAT' named 'state'. If absent, re-run `make_grid()`. If present but all-zero, inspect the bmesh loop: `f[lay] = 1.0 if r < PREY_DENSITY else ...` — add `print(sum(f[lay] for f in bm.faces)/len(bm.faces))` after the loop to confirm non-zero mean.",
      },
      {
        symptom: "Spirals do not appear — the grid settles into static blobs",
        cause:
          "The predation rule (prey→predator when has_pred_nbr) is disconnected. If `pred_kills` is wired to `new_pred` but `kills = is_prey AND has_pred_nbr` is missing the `is_prey` input, predators cannot spread and the system freezes.",
        fix:
          "Confirm the `pred_kills` BoolMath(AND) has two inputs: `is_prey_b.outputs[0]` and `hd.outputs['Result']` (has_pred_nbr). Without both, no predation occurs. Re-run `build_pp_tree(obj)` and delete the existing modifier first.",
      },
      {
        symptom: "pair_with_output AttributeError on GeometryNodeSimulationInput",
        cause: "Running on Blender 4.0 exactly. The method was added in 4.0 but had a bug fixed in 4.1; Blender 3.x has no Simulation Zone at all.",
        fix: "Upgrade to Blender 5.1. There is no workaround for this in older versions.",
      },
    ],
  },
  base,
);

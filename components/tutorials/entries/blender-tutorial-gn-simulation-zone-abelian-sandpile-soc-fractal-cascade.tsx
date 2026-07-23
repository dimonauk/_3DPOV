import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        In 1987 Per Bak, Chao Tang, and Kurt Wiesenfeld published a paper
        explaining 1/f ("pink") noise — ubiquitous in physics, biology, and
        music — through a single cellular automaton they called the{" "}
        <strong>Abelian Sandpile</strong>. The model is disarmingly simple: each
        cell on a grid holds an integer grain count. When a cell accumulates
        four or more grains it <em>topples</em>, losing four and giving one to
        each of its four cardinal neighbours. Repeat until every cell holds
        0–3. From a large pile heaped at the grid centre, the avalanche spreads
        outward tracing a diamond-shaped fractal with four-fold symmetry — a
        pattern that has attracted mathematicians ever since because its
        internal structure provably contains features at every length scale.
        This tutorial implements that system entirely inside a Blender 5.1{" "}
        <strong>Geometry Nodes Simulation Zone</strong>, using{" "}
        <strong>SampleIndex</strong> to read exact integer grain counts from
        cardinal neighbours by explicit index arithmetic — a technique that
        contrasts directly with the Blur Attribute neighbourhood averaging used
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-game-of-life-mesh-faces"
          className={lk}
        >
          Game of Life
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-predator-prey-lotka-volterra-ecosystem"
          className={lk}
        >
          Predator-Prey
        </Link>{" "}
        tutorials.
      </p>

      <h2>Why SampleIndex and not BlurAttribute</h2>
      <p>
        The Game of Life and Predator-Prey tutorials use{" "}
        <code>Blur Attribute × 4</code> to count active neighbours. This works
        because those rules only ask <em>is there any active neighbour?</em> —
        a threshold on a mean. The sandpile asks something harder:{" "}
        <em>exactly how many neighbours are currently toppling?</em> — because
        each one delivers precisely one grain. Compare the two approaches on
        boundary faces:
      </p>
      <pre>{`Interior face (4 neighbours):
  blur × 4 = sum(toppling_nbrs) / 4 × 4 = exact count ✓

Edge face (3 neighbours):
  blur × 4 = sum / 3 × 4 ≠ sum ✗  (over-counts by 33%)

Corner face (2 neighbours):
  blur × 4 = sum / 2 × 4 ≠ sum ✗  (over-counts by 100%)`}</pre>
      <p>
        Blur Attribute normalises by each face&apos;s actual neighbour count.
        Multiplying by a fixed 4 gives wrong results at the grid boundary where
        neighbour counts differ. SampleIndex bypasses this: it reads the sand
        value at an explicitly computed face index, with{" "}
        <code>clamp=False</code> returning 0 for out-of-range indices — giving
        exact grain counts everywhere with clean open-boundary semantics for
        the top and bottom rows at no extra cost. Left/right directions need a
        single <code>Switch</code> node to suppress column-boundary row-wrap;
        see step 4.
      </p>
      <p>
        Contrast this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          Grey-Scott reaction-diffusion tutorial
        </Link>
        , where Blur Attribute is used as a discrete Laplacian on a continuous
        field (exact boundary treatment is less critical for a PDE
        approximation) and with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
          className={lk}
        >
          heat diffusion tutorial
        </Link>{" "}
        for a deep treatment of what Blur Attribute actually computes.
      </p>

      <h2>Self-organised criticality and the fractal diamond</h2>
      <p>
        SOC means the system evolves towards a <em>critical state</em> without
        any tuning of external parameters. At the sandpile critical state, any
        added grain may cause an avalanche of any size — from 1 toppling to
        millions. The distribution of avalanche sizes follows a power law:{" "}
        <code>P(size) ∝ size⁻τ</code> for some exponent τ ≈ 1.2. This is the
        mechanism Bak proposed for 1/f noise: a system at the critical boundary
        of stability generates scale-free fluctuations.
      </p>
      <p>
        The visual result is the <em>sandpile identity</em> — the unique stable
        configuration reached from a central pile of N grains on a GRID_N²
        grid. Its shape is a diamond (the &apos;L∞ ball&apos; of the sandpile
        metric) and its interior fills with a repeating four-fold fractal tiling
        of three-grain (bright green) and two-grain (mid green) regions
        separated by zero-grain (black) boundaries. The pattern is not random;
        it is deterministic and reproducible, but its fine structure contains
        detail at arbitrarily small scales as GRID_N → ∞.
      </p>

      <h2>Index arithmetic for cardinal neighbours</h2>
      <p>
        Blender&apos;s{" "}
        <code>primitive_grid_add(x_subdivisions=N, y_subdivisions=N)</code>{" "}
        creates N² quad faces. Face ordering is row-major:{" "}
        <code>index(row, col) = row × N + col</code>. Given this, the four
        cardinal neighbours of face <code>i</code> are:
      </p>
      <pre>{`up    = i + GRID_N    (row + 1; OOB for top row    → 0.0 via clamp=False)
down  = i - GRID_N    (row - 1; negative for row 0 → 0.0 via clamp=False)
left  = i - 1         (col - 1; wraps to prev row at col=0 — needs Switch)
right = i + 1         (col + 1; wraps to next row at col=N-1 — needs Switch)`}</pre>
      <p>
        The wrap risk for left/right is suppressed by comparing{" "}
        <code>col = Index % GRID_N</code> against 0 and GRID_N−1 and routing
        through a Switch that returns 0.0 on the boundary column. Up/down
        boundary handling is free: negative indices and indices ≥ domain_size
        both return 0.0 when <code>SampleIndex.clamp = False</code>.
      </p>

      <h2>The update rule</h2>
      <p>
        All four toppling rules run simultaneously per frame (synchronous
        update — the Simulation Zone guarantees this since it reads the
        previous frame&apos;s state and writes to the next frame atomically):
      </p>
      <pre>{`received  = Σ (neighbour.sand ≥ 4.0) * 1.0   for each of 4 cardinal nbrs
i_topple  = (this.sand ≥ 4.0) * 4.0           — 0 or 4
new_sand  = max(sand - i_topple + received, 0)`}</pre>
      <p>
        The <code>max(…, 0)</code> clamp is a safety net; it should never fire
        because a face can receive at most 4 grains and only loses 4 if it was
        already ≥ 4. Proof: if sand = 0 and all 4 neighbours topple,
        new_sand = 0 − 0 + 4 = 4 → topples next frame but never goes negative.
        The clamp protects against any floating-point edge case in the FLOAT
        representation.
      </p>
      <p>
        Unlike the DLA tutorial (see{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-dla-crystal-dendrite"
          className={lk}
        >
          DLA Crystal Dendrite
        </Link>
        ), the sandpile is <em>abelian</em>: the final stable configuration
        does not depend on the order in which toppling events are processed.
        Blender&apos;s synchronous frame update is therefore not an
        approximation — it gives the same result as any sequential schedule.
      </p>
    </>
  );
}

const data = {
  slug: "blender-tutorial-gn-simulation-zone-abelian-sandpile-soc-fractal-cascade",
  title:
    "GN Simulation Zone — Abelian Sandpile: SampleIndex Exact Grain Counts & Self-Organised Criticality Fractal Diamond (Blender 5.1)",
  description:
    "Implement the Bak-Tang-Wiesenfeld Abelian Sandpile SOC model in a Blender 5.1 GN Simulation Zone using SampleIndex with explicit index arithmetic for exact integer grain counts — demonstrating when SampleIndex beats BlurAttribute and why.",
  date: "2026-07-23",
  Body,
  seeAlso: [
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-game-of-life-mesh-faces",
      label: "GN Simulation Zone — Conway's Game of Life",
      note: "BlurAttribute ×4 as approximate neighbour counter — the approach the sandpile cannot use",
    },
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-predator-prey-lotka-volterra-ecosystem",
      label: "GN Simulation Zone — Predator-Prey Lotka-Volterra",
      note: "Three-state spatial CA using two BlurAttribute passes",
    },
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
      label: "GN Simulation Zone — Grey-Scott Reaction-Diffusion",
      note: "BlurAttribute as discrete Laplacian on continuous fields",
    },
    {
      href: "/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion",
      label: "GN Blur Attribute — Heat Diffusion",
      note: "Deep treatment of what BlurAttribute actually computes (mean, not sum)",
    },
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-dla-crystal-dendrite",
      label: "GN Simulation Zone — DLA Crystal Dendrite",
      note: "Stochastic aggregation CA — contrast with sandpile's deterministic abelian property",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html",
      label: "Simulation Zone — Blender Manual",
      note: "CC-BY-SA 4.0 · Blender Foundation · state items, bake, Python binding",
    },
    {
      href: "https://github.com/rosamc/SandpileModel",
      label: "rosamc/SandpileModel",
      note: "MIT · Rosa MC · Python sandpile visualisation with NumPy",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-simulation-zone-abelian-sandpile-soc-fractal-cascade",
    time: "one session",
    difficulty: "advanced",
    goal:
      "Build a 32×32 Abelian Sandpile simulation in a Blender 5.1 GN Simulation Zone using SampleIndex with explicit index arithmetic for exact per-face grain delivery, and observe the BTW fractal diamond SOC attractor emerge from a central pile of 1 536 grains over 200 frames.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Simulation Zone requires Blender 4.0+; SampleIndex clamp=False API stable from 4.1. Target is 5.1.",
      },
    ],
    prerequisites: [
      "Comfortable with GN: Named Attribute, Store Named Attribute, Math, Compare, Switch nodes",
      "Understand the Simulation Zone read/write frame loop — see gn-simulation-zone-wave-reveal",
      "Know why BlurAttribute gives a mean, not a sum — see gn-blur-attribute-heat-diffusion",
    ],
    steps: [
      {
        title: "Create the 32×32 quad grid and seed the centre pile",
        body: "Run `blueprint.main()` or call `make_grid()` in a fresh scene. `primitive_grid_add(x_subdivisions=32, y_subdivisions=32)` produces 32² = 1 024 quad faces. The bmesh loop finds the face whose `calc_center_median()` is closest to world origin — the centre of the grid — and writes `N_GRAINS = 1 536` to the new `sand` float layer there; all others get 0.0.\n\nVerify in the Spreadsheet editor (Face domain): one face should read 1536.0; the remaining 1023 should read 0.0.",
      },
      {
        title: "Set up the emission material",
        body: "Run `make_material(obj)`. A `ShaderNodeAttribute` reads the `sand` float attribute; a Math Divide node maps it to 0–1 by dividing by 4.0; a CONSTANT ColourRamp at four stops (0.0→void black, 0.26→deep green, 0.51→bright green, 0.76→yellow-white) feeds an Emission node at strength 7.0.\n\nCONSTANT interpolation is critical: stable sand values are integers 0–3, which map exactly to the four ramp bands. LINEAR interpolation would blend between colours at sub-integer values during the active avalanche phase, giving a muddied transitional look instead of crisp per-cell colour.",
      },
      {
        title: "Wire the Simulation Zone frame loop",
        body: "Call `build_sandpile_tree(obj)`. `GeometryNodeSimulationInput` and `GeometryNodeSimulationOutput` are added and paired via `sim_i.pair_with_output(sim_o)`. The outer link: `GroupInput.Geometry → sim_i.Geometry`. The inner body (steps 4–7) reads from and modifies `sim_i.outputs['Geometry']`. The final `StoreNamedAttribute` writes to `sim_o.inputs['Geometry']`, and `sim_o.outputs['Geometry']` connects to `GroupOutput.Geometry`.",
      },
      {
        title: "Compute column index and boundary flags",
        body: "Inside the zone: `GeometryNodeInputIndex` outputs per-face index `i`. A Math MODULO node computes `col = i % GRID_N` (the column coordinate). Two `FunctionNodeCompare(FLOAT, EQUAL)` nodes produce:\n  `is_left  = Compare(col, 0)`\n  `is_right = Compare(col, GRID_N-1)`\n\nThese boolean outputs gate the left/right Switch nodes in step 5. The row coordinate is not needed — up/down boundary handling is implicit via SampleIndex clamp=False.",
      },
      {
        title: "Sample the four cardinal neighbours",
        body: "Four `GeometryNodeSampleIndex(data_type='FLOAT', domain='FACE', clamp=False)` nodes each receive `sim_i.outputs['Geometry']`, the `sand` NamedAttribute field, and a computed index:\n\n  `up_idx  = i + GRID_N` → OOB for top row (index ≥ 1 024) → 0.0\n  `dn_idx  = i - GRID_N` → negative for bottom row → 0.0\n  `lt_idx  = i - 1`      → wraps to prev row at col=0 → guard with Switch\n  `rt_idx  = i + 1`      → wraps to next row at col=N-1 → guard with Switch\n\nFor left/right: a `GeometryNodeSwitch(input_type='FLOAT')` has inputs [0]=is_left, [1]=raw sample (False branch), [2]=0.0 default (True branch). When on the left column, the switch outputs 0 regardless of the (wrong) wrapped index.",
      },
      {
        title: "Compute received grains and apply the update rule",
        body: "For each of the four sampled sand values, a `FunctionNodeCompare(GREATER_EQUAL, B=4.0)` checks whether that neighbour is toppling. The bool output is cast to float via `Math(MULTIPLY, ×1.0)`. Four values 0.0/1.0 are summed via two ADD nodes: `received = up_t + dn_t + lt_t + rt_t`.\n\nThis face's loss: `i_topple = Compare(sand, GREATER_EQUAL, 4.0) × 4.0` → 0.0 or 4.0.\n\nUpdate: `new_sand = max(sand - i_topple + received, 0.0)`. The MAXIMUM node clamps at 0.",
      },
      {
        title: "Store and bake",
        body: "A `GeometryNodeStoreNamedAttribute(data_type='FLOAT', domain='FACE', name='sand')` takes `sim_i.outputs['Geometry']` and the `new_sand` value, outputting updated geometry to `sim_o.inputs['Geometry']`.\n\nTo bake: **Object → Geometry Nodes Cache → Bake All**. With GRID_N=32 this completes in seconds. Scrub the timeline: frames 0–20 show the initial avalanche; the diamond boundary is visible ~frame 50; internal fractal detail settles ~frame 180. Frame 300 is the stable SOC attractor.",
      },
    ],
    finalResult:
      "A 1 024-face quad grid with a live Abelian Sandpile GN simulation. At stable state (frame ≥ 200) every face holds 0–3 grains encoded as four distinct colours. The SOC fractal diamond pattern is visible with four-fold symmetry and internal fractal tiling. record.py renders frames 0–200 overhead-orthographic to viewport.mp4 at 1920×1080 30fps; the avalanche propagation is clearly visible.",
    variations: [
      "Larger grid: increase GRID_N to 64 (4 096 faces) for finer fractal detail — the internal self-similar structure becomes visible. Bake time scales linearly with face count × frame count.",
      "Multiple piles: seed N_GRAINS/2 at two offset centre points. The two diamonds merge and their interaction boundary exhibits the abelian property — the merged result equals a single pile of N_GRAINS at the weighted average position.",
      "Non-square domain: run on a subdivided icosphere (triangulated, ~5 000 faces) to see SOC on a curved surface. Update the toppling threshold from 4 to 3 (each triangle vertex has 3 cardinal neighbours on a hex-remeshed sphere) and adjust index arithmetic to use topology nodes.",
      "Height visualisation: add a SetPosition node after the Simulation Zone with a Z Offset = sand × 0.08. InterpolateDomain from FACE to POINT transfers the face attribute to vertices for smooth elevation — the fractal diamond becomes a 3D topographic map.",
      "Export state: add a Python one-liner after baking — `bpy.ops.export_scene.gltf(export_attributes=True)` at a chosen stable frame — to carry the `sand` attribute as a per-face GLB accessor, readable as a typed array in Three.js.",
    ],
    troubleshooting: [
      {
        symptom: "All faces go black after 1–2 frames",
        cause:
          "The Store Named Attribute domain is set to POINT instead of FACE, writing per-vertex sand values that don't match what NamedAttribute reads back.",
        fix: "Verify `store.domain = 'FACE'` and `na.data_type = 'FLOAT'` match. Check the Spreadsheet (Face domain) at frame 0 shows the initial 1 536 value.",
      },
      {
        symptom: "Sand spreads diagonally instead of only to cardinal neighbours",
        cause:
          "Blur Attribute was used instead of SampleIndex — Blur Attribute on a quad grid also considers edge-adjacent (cardinal) neighbours only, but using it incorrectly with a non-unit weight spreads values beyond the four direct neighbours.",
        fix: "Confirm you are using SampleIndex with explicit i±1 / i±GRID_N offsets. There should be no Blur Attribute node in this tree.",
      },
      {
        symptom: "Grain counts go negative or reach very large values",
        cause:
          "The left/right Switch boundary masking is inverted — the True and False branches are swapped — so boundary faces receive a grain from a neighbour that does not exist.",
        fix: "Switch inputs[0]=condition (is_left), inputs[1]=real sample (False branch = not on boundary), inputs[2]=0.0 (True branch = on boundary). The naming is: True case fires when the condition is True (i.e., when we ARE on the boundary, return 0).",
      },
      {
        symptom: "The pattern shows 'stripes' rather than a diamond",
        cause:
          "The index offset for up/down is ±1 rather than ±GRID_N — treating the 1D index as column-major instead of row-major.",
        fix: "Set up_idx = i + GRID_N, dn_idx = i - GRID_N. The column-left/right offsets are ±1.",
      },
    ],
  },
  data,
);

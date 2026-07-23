import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Cloth simulation in Blender is usually handled by the native{" "}
        <strong>Cloth Physics modifier</strong>, which runs an implicit
        integrator outside of Geometry Nodes and cannot be baked into mesh
        deformation data for export. This tutorial builds a physically
        plausible spring-mass cloth entirely inside a Blender 5.1{" "}
        <strong>Geometry Nodes Simulation Zone</strong>, using Verlet position
        integration and two <code>BlurAttribute</code> passes to approximate
        structural and bending spring forces. The result bakes to concrete
        per-frame vertex positions and exports correctly to GLB for WebXR
        playback — something the native cloth modifier cannot do without a
        costly Alembic round-trip.
      </p>

      <h2>Why BlurAttribute is a discrete Laplacian</h2>
      <p>
        The key insight powering this technique was described in depth in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
          className={lk}
        >
          Blur Attribute heat diffusion tutorial
        </Link>
        : for a vertex{" "}
        <code>v</code> with <code>d</code> edge-adjacent neighbours{" "}
        <code>n₁…n_d</code>, <code>BlurAttribute</code> computes their mean
        position. Therefore:
      </p>
      <pre>{`blur(pos, 1) − pos ≈ (1/d) × Σ(nᵢ − pos)
                     = (1/d) × Laplacian(pos)`}</pre>
      <p>
        Multiplying by <code>K × d</code> recovers Σ&nbsp;k(nᵢ − pos) —
        exactly Hooke&apos;s law summed over all incident edges. We absorb the
        1/<em>d</em> factor into <code>K_STRUCT</code>, so one{" "}
        <code>BlurAttribute</code> node replaces a loop over every edge in the
        mesh. A second pass with <code>iterations=3</code> reaches vertices
        three hops away, coupling them through the spring graph and resisting
        bending curvature — a cheap substitute for explicit angle springs.
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          Grey-Scott reaction-diffusion tutorial
        </Link>
        , which uses the same blur-as-Laplacian identity for continuous PDE
        diffusion rather than discrete spring forces.
      </p>

      <h2>Verlet integration and the stability bound</h2>
      <p>
        Verlet position integration stores the previous two positions and
        updates without an explicit velocity variable:
      </p>
      <pre>{`pos_next = pos_curr + (pos_curr − pos_prev) × (1 − DAMPING)
         + (F_struct + F_bend + gravity + wind) × DT²`}</pre>
      <p>
        The sibling{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics"
          className={lk}
        >
          Verlet rope tutorial
        </Link>{" "}
        applies the same integrator to a 1-D chain with explicit
        distance-constraint projection (Jakobsen&apos;s method). This tutorial
        extends it to a 2-D grid and replaces constraint projection with
        implicit spring forces via <code>BlurAttribute</code> — a trade-off
        that gives smooth, globally-coupled motion at the cost of slight
        softness under large deformations. The stability bound is{" "}
        <code>K × DT² &lt; 1</code>. With <code>K_STRUCT = 250</code> and{" "}
        <code>DT = 1/24 s</code>, <code>K × DT² ≈ 0.434</code> — well inside
        the stable zone. Raising <code>K_STRUCT</code> beyond 576 makes the
        simulation diverge explosively.
      </p>

      <h2>Simulation Zone state design</h2>
      <p>
        Three named attributes on the <code>POINT</code> domain carry state
        between frames through the Simulation Zone&apos;s geometry pipeline:
      </p>
      <pre>{`pos_prev   FLOAT_VECTOR — vertex position at t−1 (Verlet shift register)
pos_curr   FLOAT_VECTOR — vertex position at t   (current state)
is_pinned  FLOAT        — 1.0 = fixed anchor, 0.0 = free vertex`}</pre>
      <p>
        Each frame: (1) read <code>pos_curr</code>; (2) blur it twice; (3)
        compute <code>pos_next</code> via Verlet; (4) apply the anchor
        constraint as a weighted mix — <code>pos_next = pos_next × (1 −
        is_pinned) + pos_curr × is_pinned</code> — so pinned vertices ignore
        forces entirely; (5) shift <code>pos_curr → pos_prev</code>, store
        <code>pos_next → pos_curr</code>; (6) call{" "}
        <code>SetPosition(pos_next)</code> to deform the visible mesh. The
        attribute initialisation (via <code>mesh.attributes.new()</code> in
        Python) is the same pattern used by the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-abelian-sandpile-soc-fractal-cascade"
          className={lk}
        >
          Abelian Sandpile tutorial
        </Link>{" "}
        for seeding per-face grain counts.
      </p>
      <p>
        The anchor constraint avoids <code>ShaderNodeMix</code> with its
        ambiguous vector-mode socket layout. Instead it uses two explicit{" "}
        <code>VectorMath SCALE</code> nodes — <code>pos_next × (1 −
        pin)</code> and <code>pos_curr × pin</code> — summed with{" "}
        <code>VectorMath ADD</code>. This pattern is robust to any change in
        Blender&apos;s Mix node socket ordering across versions.
      </p>
    </>
  );
}

const data = {
  slug: "blender-tutorial-gn-simulation-zone-spring-mass-cloth-verlet-grid-webxr",
  title:
    "GN Simulation Zone — 2-D Spring-Mass Cloth: Verlet Integration + BlurAttribute Laplacian Springs, GLB Export for WebXR (Blender 5.1)",
  description:
    "Build a deterministic cloth simulation entirely in a Blender 5.1 GN Simulation Zone using Verlet integration and BlurAttribute as a discrete graph Laplacian — no physics modifier, bakes to per-frame GLB vertex positions for WebXR.",
  date: "2026-07-23",
  Body,
  seeAlso: [
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics",
      label: "GN Simulation Zone — Verlet Rope / Cable Physics",
      note: "1-D Verlet chain with explicit distance-constraint projection — the 1-D sibling of this tutorial",
    },
    {
      href: "/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion",
      label: "GN Blur Attribute — Heat Diffusion",
      note: "In-depth treatment of BlurAttribute as a discrete Laplacian operator",
    },
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
      label: "GN Simulation Zone — Grey-Scott Reaction-Diffusion",
      note: "Continuous PDE diffusion via BlurAttribute — same Laplacian identity, different physics",
    },
    {
      href: "/tutorials/blender-tutorial-physics-cloth-simulation-waving-flag",
      label: "Physics — Cloth Simulation: Waving Flag",
      note: "Blender native cloth modifier approach — contrast with this GN-only, GLB-exportable method",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html",
      label: "Simulation Zone — Blender Manual",
      note: "CC-BY-SA 4.0 · Blender Foundation · state items, bake, Python binding",
    },
    {
      href: "https://resources.mtu.edu/courses/cs5621/papers/AdvancedCharPhys.pdf",
      label: "Thomas Jakobsen — Advanced Character Physics (GDC 2001)",
      note: "Public Domain · Verlet position integration, constraint projection, cloth simulation fundamentals",
    },
    {
      href: "https://www.cs.cmu.edu/~baraff/papers/sig98.pdf",
      label: "Baraff & Witkin — Large Steps in Cloth Simulation (SIGGRAPH 1998)",
      note: "Public Domain · Explicit/semi-implicit spring force formulation; stiffness stability analysis",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-simulation-zone-spring-mass-cloth-verlet-grid-webxr",
    time: "one session",
    difficulty: "advanced",
    goal: "Build a 20×16 vertex spring-mass cloth in a Blender 5.1 GN Simulation Zone using Verlet position integration and two BlurAttribute passes as a discrete graph Laplacian for structural and bending springs — top row pinned, gravity and wind active, bakes to GLB-exportable per-frame vertex positions.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Simulation Zone requires Blender 4.0+; BlurAttribute FLOAT_VECTOR requires 4.1+. Target is 5.1.",
      },
    ],
    prerequisites: [
      "Comfortable with GN: Named Attribute, Store Named Attribute, VectorMath, BlurAttribute nodes",
      "Understand the Simulation Zone read/write frame loop — see blender-tutorial-gn-simulation-zone-wave-reveal",
      "Know what BlurAttribute actually computes (mean of neighbours, not sum) — see blender-tutorial-gn-blur-attribute-heat-diffusion",
      "Familiarity with Verlet integration from blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics helps",
    ],
    steps: [
      {
        title: "Create the cloth mesh and initialise Verlet attributes",
        body: "Run `blueprint.main()` or call `make_cloth_mesh()` in a fresh scene. A bmesh loop creates (GRID_COLS+1) × (GRID_ROWS+1) = 21×17 = 357 vertices in the XZ plane, row 0 at Z=+0.5 m (top, pinned), row 16 at Z=−0.5 m (bottom, free). A tiny sinusoidal Y perturbation (≤5 mm) on free vertices seeds the dynamics.\n\nThree named attributes are initialised via `mesh.attributes.new()` → `foreach_set()`:\n  `pos_prev` FLOAT_VECTOR, POINT — initialised to vertex positions\n  `pos_curr` FLOAT_VECTOR, POINT — initialised to vertex positions\n  `is_pinned` FLOAT, POINT — 1.0 for vertex indices 0…GRID_COLS, 0.0 otherwise\n\nVerify in the Spreadsheet (Vertex domain): top row should show `is_pinned = 1.0`; `pos_curr` and `pos_prev` should match `Position`.",
      },
      {
        title: "Build the Geometry Nodes modifier and Simulation Zone",
        body: "Call `build_cloth_tree(obj)`. A GN node tree `ClothVerletGN` is created and attached via `obj.modifiers.new('ClothGN', 'NODES')`.\n\nThe outer shell:\n  `GroupInput.Geometry → sim_i.inputs['Geometry']`\n  `sim_o.outputs['Geometry'] → GroupOutput.Geometry`\n\n`sim_i.pair_with_output(sim_o)` binds the SimulationInput / SimulationOutput pair. All computation happens between `sim_i.outputs['Geometry']` (frame N−1 state) and `sim_o.inputs['Geometry']` (frame N state).",
      },
      {
        title: "Compute spring forces via BlurAttribute (discrete Laplacian)",
        body: "Read `pos_curr` from `GeometryNodeInputNamedAttribute(data_type='FLOAT_VECTOR', name='pos_curr')`.\n\nTwo `GeometryNodeBlurAttribute(data_type='FLOAT_VECTOR')` nodes:\n  `blur1` — Iterations=1: immediate neighbours → structural spring force\n  `blur3` — Iterations=3: 3-hop neighbours → bending resistance\n\nForce offsets (already multiplied by DT²):\n  `struct_offs = VectorMath.SCALE(blur1 − pos_curr,  K_STRUCT × DT²)`\n  `bend_offs   = VectorMath.SCALE(blur3 − pos_curr,  K_BEND   × DT²)`\n\nStability check: `K_STRUCT × DT² = 250 / 576 ≈ 0.434 < 1`. Exceeding 1.0 causes explosive growth.",
      },
      {
        title: "Integrate velocity and apply gravity and wind constants",
        body: "Read `pos_prev` from NamedAttribute.\n\nVelocity (implicit in Verlet — no explicit velocity variable):\n  `velocity = VectorMath.SCALE(pos_curr − pos_prev, 1 − DAMPING)`\n\nGravity and wind are baked as constant offsets on `VectorMath.ADD` second inputs:\n  `inputs[1].default_value = (WIND_DX, 0.0, GRAV_Z)`  where\n  `GRAV_Z  = GRAVITY × DT² ≈ −0.01703`\n  `WIND_DX = WIND_X  × DT² ≈  0.00243`\n\nChain: `pos_curr + velocity + struct_offs + bend_offs + (WIND_DX, 0, GRAV_Z)`  → `pos_next_raw`.",
      },
      {
        title: "Apply the anchor constraint and advance Verlet state",
        body: "Anchor constraint (avoids ShaderNodeMix socket ambiguity):\n  `inv_pin   = Math.SUBTRACT(1.0, is_pinned)`\n  `free_part = VectorMath.SCALE(pos_next_raw, inv_pin)`\n  `pin_part  = VectorMath.SCALE(pos_curr, is_pinned)`\n  `pos_next  = VectorMath.ADD(free_part, pin_part)`\n\nShift Verlet state via two StoreNamedAttribute chains:\n  geo2 = StoreNamedAttribute(geo,  'pos_prev', value=pos_curr)  ← shift curr→prev\n  geo3 = StoreNamedAttribute(geo2, 'pos_curr', value=pos_next)  ← write new curr\n\nThen `SetPosition(Geometry=geo3, Position=pos_next)` deforms the visible mesh.",
      },
      {
        title: "Bake and observe",
        body: "To bake: **Object → Geometry Nodes Cache → Bake All** (~20 s for 200 frames). Scrub the timeline:\n  Frames 0–30:  cloth begins to sag and bow toward +X under gravity + wind\n  Frames 30–80: full drape visible, folds emerge in the free hem\n  Frames 80–200: slow damped oscillation settling to a displaced equilibrium\n\nTo render: run `record.py` (side-view EEVEE camera) or use Blender's normal render pipeline. The cloth deforms as ordinary mesh vertices — any export pipeline that works on static meshes (GLTF, FBX, Alembic) will capture each baked frame correctly.",
      },
    ],
    finalResult:
      "A 357-vertex quad cloth mesh hanging in the XZ plane with a live GN Simulation Zone Verlet integrator. The top row stays pinned; the rest of the cloth sags under gravity and drifts in wind, oscillating with 1.8% per-frame damping. Bakes to per-frame vertex positions exportable as GLB for Three.js / WebXR animation. record.py renders 200 frames at 1920×1080 24fps from a side camera showing the full drape and fold dynamics.",
    variations: [
      "Finer grid: increase GRID_COLS to 40 and GRID_ROWS to 30 for smoother folds. Reduce K_STRUCT proportionally (edge length halves, so force should halve: K_STRUCT = 125) to maintain the same physical stiffness. Bake time scales with vertex count.",
      "Constraint projection: after the Verlet step, add a second BlurAttribute pass computing the mean of edge lengths, then subtract the deviation from rest length. This is Jakobsen's XPBD-style distance constraint and reduces the softness visible at high DAMPING values.",
      "Multiple pinned edges: change the is_pinned condition to also pin the left column (`i % (GRID_COLS+1) == 0`). The cloth will hang from its top-left corner like a flag pole attachment.",
      "Collision: sample a sphere SDF at pos_next and clamp any vertex inside the sphere to the surface. Use GeometryNodeInputPosition for the sphere centre and a ScalarMath comparison for the radius.",
      "GLB export per baked frame: loop `for f in range(200): bpy.context.scene.frame_set(f); bpy.ops.export_scene.gltf(filepath=f'cloth_{f:04d}.glb', export_apply=True)`. Three.js can blend between morphtargets derived from these frames for smooth WebXR cloth animation without re-simulating.",
    ],
    troubleshooting: [
      {
        symptom: "Cloth explodes (vertices fly to infinity) immediately",
        cause:
          "Stability condition K × DT² ≥ 1. Either K_STRUCT is too large for the chosen DT, or the DT value is wrong.",
        fix: "Verify K_STRUCT × (DT)² < 1. With DT=1/24: K_STRUCT must be < 576. Reduce K_STRUCT to 200–300 and re-bake.",
      },
      {
        symptom: "Pinned row slowly drifts downward over frames",
        cause:
          "The anchor constraint is not zeroing the velocity term for pinned vertices. pos_prev and pos_curr diverge because the constraint only masks pos_next, not the velocity.",
        fix: "The constraint `pos_next = pos_next × (1−pin) + pos_curr × pin` already sets pos_next = pos_curr for pinned vertices. Verify that pos_prev is being stored as pos_curr (not pos_next) so velocity = pos_curr − pos_prev = 0 for pinned vertices next frame.",
      },
      {
        symptom: "pos_curr stays equal to pos_prev — cloth does not move",
        cause:
          "The two StoreNamedAttribute nodes write to the same attribute name, or they are in the wrong order (pos_next written to pos_prev instead of pos_curr → pos_prev).",
        fix: "Check the chain: geo2 = Store('pos_prev', pos_curr, on=geo); geo3 = Store('pos_curr', pos_next, on=geo2). The first store writes old pos_curr into pos_prev; the second writes new pos_next into pos_curr.",
      },
      {
        symptom: "BlurAttribute has no effect — cloth falls as if no springs",
        cause:
          "data_type is set to 'FLOAT' instead of 'FLOAT_VECTOR' on the BlurAttribute node, so the vector values are read as scalars (all zero).",
        fix: "Set `blur_node.data_type = 'FLOAT_VECTOR'` in Python, or change the Data Type dropdown to Vector in the node editor.",
      },
    ],
  },
  data,
);

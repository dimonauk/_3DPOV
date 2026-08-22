import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        In 1951 Boris Belousov mixed bromate, malonic acid, and a cerium
        catalyst in dilute sulphuric acid and watched the solution oscillate
        between yellow and colourless — spontaneously, repeatedly, without any
        external input. Anatol Zhabotinsky later extended the work and showed
        that when the same reaction is spread in a thin layer it spontaneously
        organises into rotating spiral waves. These are not Turing patterns:
        where a{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          Grey-Scott system
        </Link>{" "}
        relaxes to a static fingerprint of spots and stripes, a
        Belousov-Zhabotinsky (BZ) medium sustains oscillation indefinitely —
        the spirals rotate forever, powered by the reaction&apos;s own kinetics.
        This tutorial implements the two-variable simplified Oregonator entirely
        inside a Blender 5.1 Geometry Nodes{" "}
        <strong>Simulation Zone</strong>, producing animated spiral waves on a
        vertex-domain grid that plays back in real time under EEVEE Next.
      </p>

      <h2>The Oregonator: why this model and not another</h2>
      <p>
        Richard Field, Endre Körös, and Richard Noyes published the full
        five-variable Oregonator in 1972. John Tyson and Paul Fife reduced it to
        two variables in 1980 by exploiting a timescale separation: the bromous
        acid (HBrO₂, variable <em>u</em>) reaches its fast quasi-steady state
        much quicker than the ferroin indicator (Fe³⁺, variable <em>v</em>), so
        the fast algebraic step can be eliminated. The reduced system is:
      </p>
      <pre>{`du/dt = (1/ε)[u(1−u) − fv(u−q)/(u+q)]  +  D·∇²u
dv/dt = u − v`}</pre>
      <p>
        The key parameters: <code>ε = 0.04</code> (activator fast timescale —
        makes <em>u</em> react quickly to any perturbation),{" "}
        <code>f = 1.4</code> (stoichiometric factor — sets the excitability;
        spirals exist for <code>0.5 &lt; f &lt; 2</code>), <code>q = 0.002</code>{" "}
        (quench parameter — prevents <em>u</em> from going negative under large{" "}
        <em>v</em>), <code>D = 0.25</code> (grid-normalised activator diffusion
        — only <em>u</em> diffuses; <em>v</em> is stationary, a valid
        approximation when ferroin diffusivity ≪ HBrO₂ diffusivity). Compare
        with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-coupled-pendulums-mathieu-resonance"
          className={lk}
        >
          Coupled Pendulums tutorial
        </Link>
        : there, the ODE is conservative and oscillation is sustained by initial
        energy; here, the ODE is dissipative and oscillation is sustained by the
        reaction&apos;s own autocatalytic loop.
      </p>

      <h2>Laplacian via Blur Attribute — same trick, different domain</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
          className={lk}
        >
          heat-diffusion tutorial
        </Link>{" "}
        showed that{" "}
        <code>BlurAttribute(u, Iterations=1)</code> computes the arithmetic mean
        of edge-adjacent values. For an interior vertex of a regular quad grid
        with four neighbours:
      </p>
      <pre>{`blur_u = (u_N + u_S + u_E + u_W) / 4
∇²u   ≈ (blur_u − u) × 4           (discrete Laplacian, Δx=1)`}</pre>
      <p>
        Multiplying by the diffusion coefficient <code>D = 0.25</code> gives the
        diffusion increment per time unit:{" "}
        <code>D·∇²u = D × 4 × (blur_u − u) = (blur_u − u)</code> — the
        correction cancels D for interior verts, but boundary verts (valence 2–3)
        still experience a reduced diffusion: a one-vertex absorbing border
        where wavefronts naturally stall. Only <em>u</em> is blurred;{" "}
        <em>v</em>&apos;s update is purely local (<code>dv = u − v</code>), which
        is why the node graph inside the Simulation Zone needs only a single Blur
        Attribute node. Contrast with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-predator-prey-lotka-volterra-ecosystem"
          className={lk}
        >
          Predator-Prey tutorial
        </Link>
        , which uses two concurrent Blur passes on a face-domain categorical
        attribute: there the blur acts as a <em>neighbourhood counter</em>, not
        a <em>diffusion operator</em>.
      </p>

      <h2>Why vertex domain, not face domain</h2>
      <p>
        The BZ field variables are continuous scalars on a regular lattice — the
        correct analogue of a finite-difference grid. Vertex domain maps directly
        to this: each vertex is a grid point, edges define the stencil adjacency
        (von Neumann neighbourhood), and the Blur Attribute iterates over
        edge-adjacent vertices. Face domain works for categorical systems (Game
        of Life, Predator-Prey) where the discrete states live on cells, not
        corners. Using face domain here would give each quad face four vertex
        neighbours via the dual adjacency, changing the stencil geometry and
        making the Laplacian approximation less accurate.
      </p>

      <h2>The inhibition fraction (u−q)/(u+q)</h2>
      <p>
        The term <code>fv(u−q)/(u+q)</code> is the key nonlinearity. When{" "}
        <em>u</em> is large (excited state, <em>u</em> ≫ <em>q</em>) the fraction
        approaches 1, so the kill term grows as <code>fv</code> — the inhibitor
        suppresses further activation. When <em>u</em> is small (rest state,{" "}
        <em>u</em> ≈ <em>q</em>) the fraction approaches 0, turning off the kill
        term and letting the birth term <code>u(1−u)</code> dominate. The quench
        parameter <em>q</em> = 0.002 ensures the denominator never reaches zero
        and sets the narrow threshold around which the excitable switch fires.
        This is implemented in the Geometry Nodes tree as three Math nodes:
        Subtract, Add, Divide — the same elementary arithmetic available in the
        shader editor, valid inside a GN tree with{" "}
        <code>ShaderNodeMath</code>.
      </p>

      <h2>Broken-circle spiral seeds</h2>
      <p>
        A BZ system will eventually self-organise from random noise, but the
        broken-circle initial condition nucleates reliable spiral pairs within
        ~10 frames. Each seed disc is split across the horizontal diameter:
        the lower half is set to the excited state (
        <code>u = 0.85, v = 0.10</code>) and the upper half to the refractory
        state (<code>u = 0.02, v = 0.90</code>). The refractory half blocks
        the wavefront from completing a ring, bending it into a rotating arm.
        Three seeds placed at <code>(0.30,0.40)</code>,{" "}
        <code>(0.65,0.35)</code>, and <code>(0.48,0.70)</code> in normalised
        grid coordinates give three independent spiral pairs that interact once
        they are large enough — producing annihilation events where two
        counter-rotating fronts collide and cancel.
      </p>

      <h2>Numerical stability</h2>
      <p>
        Forward Euler works here because both stability conditions are met.
        For diffusion: <code>dt ≤ 1/(4D·n_nbr) = 1/(4·0.25·4) = 0.25</code>,
        and <code>dt = 0.01 ≪ 0.25</code>. For the reaction:{" "}
        <code>dt ≤ ε = 0.04</code>, and <code>dt = 0.01 &lt; 0.04</code>. The
        amplification factor <code>1/ε = 25</code> is large, which makes the
        Euler step borderline stiff. If the simulation becomes unstable (large
        oscillations or NaN spread), halve <code>DT</code> or double{" "}
        <code>EPS</code>. The MINIMUM/MAXIMUM clamp pair in the node tree
        prevents <em>u</em> and <em>v</em> from leaving [0,1] even under
        transient overshoot.
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
          channel, Python <code>pair_with_output()</code>, bake behaviour, and
          the Simulation Bake Node. Related: Blur Attribute, Store Named
          Attribute, Named Attribute in the same GN reference section.
        </li>
        <li>
          <a
            href="https://github.com/pmneila/jsexp"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            pmneila/jsexp
          </a>{" "}
          · MIT · Juan Pablo de la Cruz. Interactive browser explorer for
          reaction-diffusion systems including Grey-Scott and FitzHugh-Nagumo
          excitable media. The same Blur-as-Laplacian approach is used in the
          JavaScript shader; demonstrates how a single convolution step per
          frame can drive complex emergent chemistry. Related sibling:{" "}
          <a
            href="https://github.com/pmneila/PyMCubes"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            pmneila/PyMCubes
          </a>{" "}
          (MIT) for marching-cubes isosurface extraction — useful if you want
          to export a BZ concentration surface as a GLB.
        </li>
      </ul>
    </>
  );
}

const base = {
  slug: "blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves",
  title: "GN Simulation Zone — Belousov-Zhabotinsky Oregonator: Spiral Waves",
  date: "2026-07-23",
  Body,
  relatedLinks: [
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
      label: "GN Simulation Zone — Grey-Scott Reaction Diffusion (Turing)",
      note: "Two-species continuous field; stationary Turing patterns — compare with BZ oscillatory regime",
    },
    {
      href: "/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion",
      label: "GN Blur Attribute — Heat Diffusion",
      note: "Blur Attribute as discrete Laplacian — the exact technique used for D·∇²u here",
    },
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-predator-prey-lotka-volterra-ecosystem",
      label: "GN Simulation Zone — Predator-Prey Lotka-Volterra",
      note: "Also produces spiral waves — via discrete categorical rules rather than continuous ODE",
    },
    {
      href: "/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge",
      label: "GN Store Named Attribute — Shader Data Bridge",
      note: "How named vertex attributes flow from GN into EEVEE shaders — the same pipeline used for the u→emission colour map",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html",
      label: "Simulation Zone — Blender Manual",
      note: "CC-BY-SA 4.0 · Blender Foundation · geometry body, state items, bake, Python API",
    },
    {
      href: "https://github.com/pmneila/jsexp",
      label: "pmneila/jsexp — reaction-diffusion explorer",
      note: "MIT · Juan Pablo de la Cruz · Grey-Scott & FitzHugh-Nagumo in the browser; Blur-as-Laplacian reference",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-simulation-zone-bz-oregonator-spiral-waves",
    time: "one session",
    difficulty: "advanced",
    goal:
      "Implement the two-variable simplified Oregonator (Field-Körös-Noyes 1972, Tyson-Fife 1980 reduction) in a Blender 5.1 GN Simulation Zone. Three broken-circle spiral seeds on a 64×64 vertex grid produce rotating spiral wave pairs under EEVEE Next — qualitatively different from stationary Turing patterns because the BZ medium is oscillatory, not merely diffusion-unstable.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Simulation Zone requires Blender 4.0+; Blur Attribute on vertex domain stable from 4.1. Target is 5.1.",
      },
    ],
    prerequisites: [
      "Comfortable with GN: Named Attribute, Store Named Attribute, Math nodes",
      "Understand the Simulation Zone frame loop — see gn-simulation-zone-wave-reveal",
      "Know how Blur Attribute computes a neighbourhood mean — see gn-blur-attribute-heat-diffusion",
      "Familiar with the difference between Turing instability and oscillatory excitable media (brief reading: pmneila/jsexp README)",
    ],
    steps: [
      {
        title: "Create the 64×64 vertex grid and seed u, v attributes",
        body: "Run `main()` from blueprint.py or call `make_grid()` directly. `primitive_grid_add(x_subdivisions=64, y_subdivisions=64, size=6.0)` gives a 6 m × 6 m plane with 65×65 = 4225 vertices and 64×64 = 4096 quad faces.\n\nThe bmesh loop then writes two float layers to vertex domain: `u` (activator/bromous acid) and `v` (inhibitor/ferroin). Default for most vertices: `u_rest ≈ 0.008, v_rest ≈ 0.008` (the system's rest steady state). Three broken-circle seeds override a radius-0.45-normalised disc: lower hemisphere → `u=0.85, v=0.10` (excited); upper hemisphere → `u=0.02, v=0.90` (refractory). This asymmetric initial condition bends each circular wavefront into a counter-rotating pair.\n\nVerify in the Spreadsheet editor (Vertex domain): columns `u` and `v` should exist, most rows near 0.008, three clusters with high u or high v values.",
      },
      {
        title: "Wire the Simulation Zone geometry body",
        body: "`build_bz_tree(obj)` creates a new GeometryNodeTree and adds:\n- `NodeGroupInput` → `GeometryNodeSimulationInput.Geometry`\n- `GeometryNodeSimulationOutput.Geometry` → `NodeGroupOutput`\n\nCall `sim_i.pair_with_output(sim_o)` immediately after creating both nodes — this links the zone interior sockets. No float state items are needed: `u` and `v` travel as named vertex attributes on the geometry body, which persists frame-to-frame inside the zone. The Simulation Zone wraps the entire computation; the geometry body is the single state channel.",
      },
      {
        title: "Read u and v with Named Attribute nodes",
        body: "Inside the zone body (connected to `sim_i.outputs['Geometry']`), add two `GeometryNodeInputNamedAttribute` nodes with `data_type='FLOAT'` and names `'u'` and `'v'`. These read from the **previous frame's** geometry body — the values written by the previous StoreNamedAttribute chain. No explicit Geometry socket is needed on NamedAttribute; it reads from the current evaluation context.\n\nDo not connect the outer `GroupInput.Geometry` here — that geometry has no stored attributes yet. Always read from inside the zone.",
      },
      {
        title: "Compute the discrete Laplacian of u via Blur Attribute",
        body: "Add `GeometryNodeBlurAttribute(data_type='FLOAT', Iterations=1)`. Connect `sim_i.outputs['Geometry']` → `Geometry` input. Connect `na_u.outputs['Attribute']` → `Value` input.\n\nThe output `Value` is the mean of edge-adjacent vertex u values (blur_u). The discrete Laplacian follows:\n    `∇²u ≈ (blur_u − u) × 4`\nImplement with Math SUBTRACT (blur_u − u) then MULTIPLY (× 4.0). Then MULTIPLY (× D = 0.25) for the diffusion term `D·∇²u`. For interior verts: `D × 4 × (blur_u − u) = (blur_u − u)` — the D/dx² normalisation cancels at grid resolution Δx=1.",
      },
      {
        title: "Compute the Oregonator reaction terms for u",
        body: "Build the inhibition fraction `(u−q)/(u+q)` with three Math nodes: SUBTRACT (u − 0.002), ADD (u + 0.002), DIVIDE.\n\nKill term: `fv(u−q)/(u+q)` — MULTIPLY(v, f=1.4) then MULTIPLY(result, ratio).\n\nBirth term: `u(1−u)` — SUBTRACT(1.0, u) then MULTIPLY(u, result).\n\nReaction: SUBTRACT(birth, kill) then MULTIPLY(× 1/ε = 25.0). This amplification reflects how fast the autocatalytic front fires compared to the slow inhibitor.\n\n`du = reaction_u + D·∇²u`: ADD the two terms. Then `u_new = clamp(u + dt×du, 0, 1)`: MULTIPLY(du, dt=0.01), ADD(u, result), MINIMUM(result, 1.0), MAXIMUM(result, 0.0).",
      },
      {
        title: "Compute the v update and store both attributes",
        body: "v update is simpler — no diffusion, no fraction:\n    `dv = u − v` → SUBTRACT\n    `v_new = clamp(v + dt×dv, 0, 1)` → MULTIPLY, ADD, MINIMUM, MAXIMUM\n\nWrite both back to the geometry body with two chained StoreNamedAttribute nodes:\n1. `st_u(domain='POINT', name='u')` — connects `sim_i.Geometry → st_u.Geometry`, `u_new → Value`\n2. `st_v(domain='POINT', name='v')` — connects `st_u.Geometry → st_v.Geometry`, `v_new → Value`\n3. `st_v.Geometry → sim_o.Geometry`\n\nThe chain is critical: each Store node passes through the geometry so the next one sees the updated topology. If you connect both stores directly to `sim_i.Geometry`, the second will overwrite the geometry body, discarding u_new.",
      },
      {
        title: "Set Z position from u for a height landscape",
        body: "After `sim_o.Geometry`, add a `GeometryNodeSetPosition` node. Build an Offset vector: `ShaderNodeCombineXYZ(X=0, Y=0, Z=u_new × 0.8)`. Connect `u_new` → Math MULTIPLY (× 0.8 height scale) → CombineXYZ Z input → SetPosition Offset.\n\nConnect `sim_o.Geometry → SetPosition.Geometry → GroupOutput.Geometry`.\n\nThe height landscape makes the orange wave crests visible at a 45° viewport angle. Without it the simulation still runs — you can visualise it purely through the emission material's vertex colour.",
      },
      {
        title: "Apply the hot-map emission material and play",
        body: "Run `make_material(obj)`. A `ShaderNodeAttribute(attribute_name='u', attribute_type='GEOMETRY')` reads from the vertex `u` attribute. A `ValToRGB` with B-Spline interpolation maps 0→deep indigo, 0.45→vivid orange, 1→white — mimicking the actual visual appearance of oxidised (yellow) vs. reduced (colourless) BZ reagent in a Petri dish. `Emission(Strength=8.0)` makes the spirals glow against the near-black world background.\n\nSwitch to EEVEE Next in the Viewport, press Space. Within 5–10 frames the wavefronts from each seed disc spread outward. By frame 30 the first spiral arms form. By frame 80 three mature rotating spirals fill the grid, annihilating where two counter-rotating fronts collide.",
      },
    ],
    finalResult:
      "A 64×64 vertex grid running a live two-variable Oregonator BZ simulation inside a Geometry Nodes Simulation Zone. Three broken-circle spiral seeds nucleate counter-rotating spiral pairs that mature by frame 80 and oscillate indefinitely. The height landscape and indigo-orange-white emission material make the activator wavefronts immediately legible. record.py renders frames 0–180 to viewport.mp4 (1920×1080, 30 fps, EEVEE Next).",
    variations: [
      "Increase N to 96 or 128 for finer spiral structure — memory cost scales as N². Expect ~15 000 vertex attributes; still realtime under EEVEE.",
      "Set f=0.6 to enter a near-excitable regime where target patterns (concentric rings) dominate over spirals. f=1.9 moves toward a stationary inhomogeneous steady state — the spirals freeze.",
      "Add a second Blur Attribute pass for v with a small D_v = 0.02 (ten times slower diffusion than u). This breaks the one-sided diffusion assumption and shifts the spiral chirality slightly; in some parameter regimes it stabilises targets over spirals.",
      "Wrap the grid onto a UV sphere using a second GN modifier with Sample UV Surface → Set Position to spherical coordinates. BZ spirals on a sphere wrap around the poles — topologically they must contain exactly one pair of defects (Poincaré index theorem).",
      "Bake the simulation to disk (Simulation Zone → Bake) then scrub through the timeline freely. Export a snapshot at peak contrast (frame 80) as a GLB with export_attributes=True for Three.js attribute access.",
    ],
    troubleshooting: [
      {
        symptom: "All values collapse to 0 or 1 within a few frames",
        cause:
          "Numerical blow-up from a too-large dt or too-small ε. The amplification 1/ε = 25 pushes the reaction close to the Euler stability limit.",
        fix: "Halve DT (0.005) or increase EPS to 0.06. Also verify the StoreNamedAttribute chain is correctly ordered and both stores use domain='POINT'.",
      },
      {
        symptom: "No spirals — only expanding rings that die at the border",
        cause:
          "Seed initial conditions are symmetric — the half-disc asymmetry was not applied correctly, so the wavefront completes a circle and collapses rather than bending into a spiral arm.",
        fix: "Inspect the Spreadsheet (Vertex domain) at frame 0. Near the seed centres you should see u values > 0.5 in the lower half and < 0.05 in the upper half. If all seed pixels are the same, check the atan2 branch in make_grid().",
      },
      {
        symptom: "Blur Attribute output is 0.0 everywhere",
        cause:
          "The Blur Attribute node is reading from the outer GroupInput geometry rather than from sim_i.outputs['Geometry']. The outer geometry carries no stored u attribute at evaluation time.",
        fix: "Verify the Geometry link into BlurAttribute comes from sim_i.outputs['Geometry'], not from the NodeGroupInput.",
      },
      {
        symptom: "v stays stuck near 0 for all frames",
        cause:
          "The StoreNamedAttribute for v is connected to sim_i.Geometry directly instead of to st_u.Geometry. This means both stores fight over the same input geometry and the second one wins but discards u_new.",
        fix: "Chain: sim_i.Geometry → st_u → st_v → sim_o. Each store's Geometry output feeds the next store's Geometry input.",
      },
    ],
  },
  base
);

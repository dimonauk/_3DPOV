import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        When two fluid layers slide past each other — one rushing right, one
        rushing left — the boundary between them is unstable. Any small ripple
        at the interface grows exponentially, wraps into a spiral, and tightens
        until the fluid has coiled itself into a compact vortex core. You see
        this in breaking ocean waves, the cloud bands of Jupiter, and the edges
        of a spiralling smoke ring: it is the Kelvin-Helmholtz instability, and
        it is one of the most visually compelling phenomena in all of fluid
        mechanics.
      </p>
      <p>
        In the potential-flow (inviscid) approximation, the interface is
        replaced by a continuous sheet of vorticity. Birkhoff (1954) and Rott
        (1956) independently derived the equation governing its evolution: the
        position of each filament{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting"
          className={lk}
        >
          interacts with every other filament
        </Link>{" "}
        via the 2-D Biot-Savart law — the same law that governs magnetic fields
        in three dimensions, transplanted to the complex plane:
      </p>
      <pre>{`Birkhoff-Rott (real, desingularised):
  u_x(i←j) =  Γ/(2πN) · (y_i − y_j) / (r²_ij + δ²)
  u_y(i←j) = −Γ/(2πN) · (x_i − x_j) / (r²_ij + δ²)
  r²_ij = (x_i−x_j)² + (y_i−y_j)²

  Γ = 2π  (total circulation), N = 24 (filaments)
  δ = 0.35 (Krasny core radius — prevents 1/0 when i→j)`}</pre>
      <p>
        The <code>δ²</code> term in the denominator is the Krasny (1986)
        desingularisation: without it, two filaments that pass close together
        generate infinite velocity. A small core radius smooths the singularity
        while preserving the long-range interaction. Smaller δ gives a more
        violent roll-up with tighter spirals; larger δ produces a gentler,
        more laminar coiling. The blueprint ships with{" "}
        <code>DELTA = 0.35</code> — try 0.1 and 0.8 to feel the difference.
      </p>

      <h2>Repeat Zone: an N² sum in Geometry Nodes</h2>
      <p>
        Implementing the Biot-Savart sum naively requires a nested loop: for
        each filament <em>i</em>, sum over all <em>j</em>. Blender 5.1
        introduced the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-antenna-webxr"
          className={lk}
        >
          Repeat Zone
        </Link>{" "}
        — a geometry-state loop analogous to the Simulation Zone but iterating a
        fixed number of times within a single frame. Nesting a Repeat Zone
        (iterations = N = 24) inside the Simulation Zone gives us exactly the
        inner sum:
      </p>
      <pre>{`For each frame (Simulation Zone):
  StoreNamedAttribute vx = 0, vy = 0

  Repeat Zone (j = 0 .. 23):
    xj = SampleIndex(px, j)        # scalar from POINT domain
    yj = SampleIndex(py, j)
    dx = px_i − xj                 # per-point field
    dy = py_i − yj
    r² = dx²+dy² + δ²
    mask = Switch(Index==j, 1.0, 0.0)   # self-exclusion
    vx += (1/N) · dy / r² · mask
    vy += (1/N) · (−dx) / r² · mask
    StoreNamedAttribute vx, vy     # accumulated state

  Euler: px += vx·dt, py += vy·dt
  SetPosition = (px/2π, py/2π, 0)`}</pre>
      <p>
        The Repeat Zone carries the geometry as state between iterations.
        <code>SampleIndex</code> reads filament <em>j</em>&apos;s coordinates as
        a scalar; <code>Named Attribute</code> evaluates{" "}
        <code>px_i, py_i</code> per-point simultaneously — Blender&apos;s field
        system broadcasts the scalar subtraction over all 24 points in parallel.
        After the Repeat Zone exits, every filament&apos;s <code>vx</code> and{" "}
        <code>vy</code> hold the full Biot-Savart velocity. An Euler step
        advances their positions.
      </p>
      <p>
        The visual: a polyline of 24 glowing filaments (orange where displaced
        upward, blue where displaced downward) coils into a tight spiral over
        200 frames. This is the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr"
          className={lk}
        >
          same orbital light-painting aesthetic
        </Link>{" "}
        as a poi spiral filmed in long exposure — one continuous ribbon tracing
        the history of the instability.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-24",
  title:
    "GN Simulation Zone + Repeat Zone — Kelvin-Helmholtz Vortex Filament Sheet: Birkhoff-Rott Equation & Shear-Flow Spiral Roll-Up for Light Painting (Blender 5.1)",
  lede: "24 vortex filaments represent the interface between two counter-streaming fluids; a GN Repeat Zone nested inside a Simulation Zone computes the full Birkhoff-Rott Biot-Savart sum (N²=576 pair interactions per frame) with Krasny desingularisation, rolling the initial wavy line into a tight orange-and-blue cat's-eye spiral over 200 frames — the Kelvin-Helmholtz instability as glowing tube light art.",
  libraryPath:
    "blends/geometry-nodes/gn-simulation-zone-kelvin-helmholtz-vortex-filament-birkhoff-rott/",
  blenderVersion: "5.1",
  difficulty: "expert" as const,
  time: "90 minutes",
  prerequisites: [
    "Comfortable reading and running bpy scripts in Blender's Scripting workspace",
    "Know what a Simulation Zone is and how Named Attribute / Store Named Attribute work",
    "Familiar with the Repeat Zone (see gn-repeat-zone-crystal-antenna-webxr tutorial)",
    "Basic fluency with complex numbers or 2-D vector fields",
  ],
  software: [
    {
      name: "Blender",
      version: "5.1",
      url: "https://www.blender.org/download/",
      cost: "free" as const,
      platforms: ["windows", "macos", "linux"] as Array<
        "windows" | "macos" | "linux"
      >,
    },
  ],
  steps: [
    {
      title: "Run blueprint.py — build the polyline and GN tree",
      body: "Open Blender 5.1 → **Scripting** workspace. Open `blueprint.py` and press **Run Script**.\n\n`purge()` clears the scene. `make_vortex_polyline()` creates N=24 vertices connected by N−1 edges (a polyline). Each vertex k sits at x_k = k·2π/N, y_k = 0.12·sin(2π·k/N). Four POINT-domain FLOAT attributes are added: `px`, `py` (physics coordinates), `vx`, `vy` (velocity accumulators, initialised to 0.0).\n\n`build_kh_tree()` wires the Simulation Zone + Repeat Zone. `make_material()` sets up an emission tube with object-space Y mapped to a blue→white→orange colour ramp.\n\nAfter the script runs, check that the modifier panel shows 'KH_BR (Nodes)' with a subpanel for 'KHBirkhoffRott'. Press Space to advance one frame and confirm the polyline shifts position.",
    },
    {
      title: "Observe the roll-up in the 3D Viewport",
      body: "Set viewport shading to **Rendered** (EEVEE Next, Z key or header icon). Press Space to play.\n\n**Frame 1–30**: The wavy line of 24 filaments is nearly flat. The Biot-Savart velocity is small because all filaments are nearly co-linear and the dominant mode (wavenumber 1, matching the initial sinusoidal perturbation) grows at rate σ = Γ·k/2 = π filaments are barely moving.\n\n**Frame 50–100**: The roll-up accelerates. Filaments near the crest of the initial wave (y > 0) are pulled rightward faster than those at the trough; the interface folds over itself. The blue (y < 0) filaments are tugged up by the upper group's Biot-Savart field.\n\n**Frame 130–200**: The spiral tightens into a bright core. The Euler integration introduces visible oscillation around the true trajectory at large velocities — this is the limitation of explicit Euler with large dt. Try `DT = 0.008` for a smoother but slower roll-up.\n\nScrub the timeline back and forth to see the progressive wrapping. The outermost filament of the spiral (highest curvature) is where the instability is most advanced.",
    },
    {
      title: "Inspect the Repeat Zone in the GN editor",
      body: "Open the **Geometry Node Editor** (Shift+F5 or header). With `kh_vortex_sheet` selected, the KHBirkhoffRott group opens.\n\nLocate the **Repeat Zone** (bordered frame between the vx/vy reset stores and the Euler integrate section). Inside the zone:\n- The `Repeat Input` node shows `Iterations = 24` and outputs `Iteration` (current j) and `State` (geometry).\n- Two `Sample Index` nodes read `px` and `py` at index j — these evaluate the scalar xj, yj for the current iteration.\n- Multiple `Math` nodes chain: SUBTRACT (dx, dy) → MULTIPLY (dx², dy²) → ADD (r²) → ADD (+ δ²).\n- `Input Index` and `Compare (INT, EQUAL)` feed a `Switch` node that clamps self-interactions to 0.\n- Final `Store Named Attribute` nodes update vx and vy; the updated geometry flows to `Repeat Output`.\n\nAfter the zone, `Repeat Output → State` carries all 24 accumulated velocities. Two Math ADD + MULTIPLY nodes integrate: `px_new = px + vx·DT`.",
    },
    {
      title: "Tune the Krasny δ parameter and time step",
      body: "In `blueprint.py`, change `DELTA` and re-run the script (which recreates the whole scene).\n\n**DELTA = 0.1**: tight spiral, large velocities near the roll-up core, Euler integration becomes visibly noisy after frame 150. The spiral tightens more dramatically. Real KH instability at low viscosity shows this sharpness.\n\n**DELTA = 0.6**: smooth, gentle coiling, the spiral never fully closes even at frame 200. Closer to the behaviour of a highly viscous fluid or a low-resolution approximation.\n\n**DT = 0.008**: halves the Euler step error. Roll-up takes until frame 300 to reach the same tightness as DT=0.018 at frame 200. Set FRAME_END=300 accordingly.\n\n**N = 32**: 32²=1024 Biot-Savart pairs. The Repeat Zone runs 32 iterations per frame. The spiral has finer structure but the GN tree remains the same — only `rep_i.inputs['Iterations'].default_value` changes.",
    },
    {
      title: "Render with record.py",
      body: "Open `record.py` in the Scripting workspace (alongside blueprint.py or as a second text block) and press **Run Script**.\n\nThe script sets resolution 1280×720, 24fps, EEVEE Next with bloom (intensity=0.9, threshold=0.3, radius=4.0), a pure-black world, and fires `bpy.ops.render.render(animation=True)`. Frames 1–200 render to:\n  `public/library/videos/geometry-nodes/gn-simulation-zone-kelvin-helmholtz-vortex-filament-birkhoff-rott/viewport.mp4`\n\nRender time: roughly 3–8 seconds per frame on a mid-range GPU. With bloom the glowing spiral effect is most dramatic: the tight core at frame 200 saturates to near-white with blue and orange halos bleeding outward.",
    },
  ],
  finalResult:
    "A 24-vertex polyline mesh with `px`, `py`, `vx`, `vy` POINT attributes; a Geometry Nodes modifier containing a Repeat Zone (N=24 iterations) nested inside a Simulation Zone, implementing the Birkhoff-Rott vortex-filament equation with Krasny desingularisation (δ=0.35) at 576 Biot-Savart pair evaluations per frame. An Euler integrator (dt=0.018) advances the filaments over 200 frames; the interface rolls from a gentle sinusoidal perturbation (ε=0.12) into a tight cat's-eye spiral. Visualised as a hexagonal emission tube (radius 0.012) colour-mapped blue→white→orange by object-space Y. Scene saved as hf_kh_vortex.blend.",
  variations: [
    "Set N=48 and DELTA=0.15 for a high-fidelity roll-up. The Repeat Zone now runs 48 iterations (2304 pairs/frame) — still real-time on modern hardware. The spiral has finer filament structure and the secondary Kelvin-Helmholtz instabilities (roll-ups on the spiral arms) begin to appear.",
    "Add a second mode: set EPSILON=0.08 for the wavenumber-1 perturbation and add a EPSILON2=0.04 * sin(2 * 2π * k / N) component. Two winding spirals appear side-by-side, their cat's-eye cores orbiting each other — this is wavenumber-2 competition.",
    "Use the simulation state as a motion path for poi light painting: after `make_vortex_polyline()`, parent an Empty to one filament vertex. Drive the empty's position from a driver on the `px`/`py` attributes at vertex index 0. A glowing poi sphere following filament 0 through the KH roll-up creates a performance-grade spiral animation.",
    "Replace Euler integration with a 4th-order Runge-Kutta (RK4) step. RK4 requires four Repeat Zones per frame (each reading the velocity at intermediate positions). Expensive but stable: use DT=0.05 with RK4 and match the 200-frame DT=0.018 Euler result with far less phase error.",
    "Replace Mesh-to-Curve tube output with Instance-on-Points: instance a long-exposure poi sphere on each filament vertex each frame using the GN Accumulate Field node to offset along Z by frame number. Stack all 200 frames into one object → a 3-D light sculpture of the entire roll-up trajectory.",
  ],
  troubleshooting: [
    {
      symptom: "The polyline does not animate — all filaments stay on the initial wavy line",
      cause:
        "The Simulation Zone is not advancing, or the Repeat Zone outputs are not wired correctly.",
      fix: "In the modifier panel, confirm no baked simulation data exists (Simulation section → Delete Baked Data). In the GN editor, trace the chain: Repeat Output → Store px → Store py → Set Position → Simulation Output. If Set Position is wired but nothing moves, check that `rep_o.inputs['State']` receives the geometry AFTER both `Store vx` and `Store vy` nodes — if either wire is missing, vx/vy contain zeros and positions never update.",
    },
    {
      symptom: "Error: 'repeat_items' has no attribute 'new' — Repeat Zone creation fails",
      cause:
        "The Repeat Zone API changed between Blender 4.1 and 5.x. Some builds use `.items.new()` rather than `.repeat_items.new()`.",
      fix: "In blueprint.py, change `rep_o.repeat_items.new('GEOMETRY', 'State')` to `rep_o.items.new('GEOMETRY', 'State')`. If neither works, create the zone manually in the GN editor (Add → Repeat Zone), add a Geometry item to the Output node, then read out the socket names via `print([s.name for s in rep_i.inputs])` in the Python console.",
    },
    {
      symptom: "The spiral suddenly explodes or filaments fly to infinity near frame 100",
      cause:
        "Euler integration instability. When two filaments approach within δ the effective velocity can still be large if DT is too large, causing the next step to overshoot.",
      fix: "Halve DT (to 0.009) and double FRAME_END (to 400). If the blow-up persists, increase DELTA to 0.5 — a larger core radius caps the maximum velocity near filament pairs. The fundamental cure is RK4 integration (see Variation 4), but halving DT costs only twice the frames and no code changes.",
    },
  ],
  externalLinks: [
    {
      label:
        "Lord Kelvin (William Thomson) — Hydrokinetic solutions and observations (1871, Public Domain)",
      href: "https://www.biodiversitylibrary.org/item/18369",
    },
    {
      label:
        "Blender Foundation — Geometry Nodes Repeat Zone Manual (CC-BY-SA 4.0)",
      href: "https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/repeat_zone.html",
    },
    {
      label:
        "Blender Foundation — Simulation Zone Manual (CC-BY-SA 4.0)",
      href: "https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "BZ Oregonator — Spiral Waves in Excitable Media (another continuous-vorticity system)",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves",
    },
    {
      label:
        "Lorenz Attractor — Butterfly Chaos & Sensitive Divergence for Poi Light Painting",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting",
    },
    {
      label:
        "SPH Fluid — Müller Kernels, Pressure & Viscosity for Light-Painting Trails",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting",
    },
    {
      label:
        "Repeat Zone — Crystal Antenna WebXR (how to wire a Repeat Zone from scratch)",
      href: "/tutorials/blender-tutorial-gn-repeat-zone-crystal-antenna-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-simulation-zone-kelvin-helmholtz-vortex-filament-birkhoff-rott",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "geometry-nodes",
      "simulation",
      "fluid-dynamics",
      "vortex",
      "repeat-zone",
      "light-painting",
    ],
    body: Body,
  },
  data,
);

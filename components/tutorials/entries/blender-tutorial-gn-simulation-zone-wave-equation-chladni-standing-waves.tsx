import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        In 1787 Ernst Chladni placed sand on a metal plate, drew a bow across
        its edge, and watched the grains migrate to fixed curves — the{" "}
        <em>nodal lines</em> where the plate was stationary. Each resonance
        frequency produced a different symmetric figure. This tutorial
        implements the 2-D scalar wave PDE inside a Blender 5.1 Geometry
        Nodes <strong>Simulation Zone</strong>, reproducing the cruciform
        mode-{`(2,3)`} Chladni figure with a diverging blue–black–red emission
        material that renders nodal lines as black seams against glowing peaks.
      </p>
      <p>
        The approach is scalar rather than vector: instead of the FLOAT_VECTOR
        position state used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-mass-cloth-verlet-grid-webxr"
          className={lk}
        >
          Spring-Mass Cloth tutorial
        </Link>
        , two FLOAT attributes (<code>u_curr</code>, <code>u_prev</code>) carry
        the displacement field. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
          className={lk}
        >
          BlurAttribute Laplacian
        </Link>{" "}
        now drives wave propagation rather than thermal equilibration: diffusion
        uses one state variable and bleeds energy toward the mean; the wave
        equation uses two time-level variables and conserves it, producing
        oscillation rather than decay.
      </p>

      <h2>The wave equation and the Leapfrog scheme</h2>
      <p>
        The 2-D scalar wave equation on a unit-spacing grid:
      </p>
      <pre>{`∂²u/∂t² = c²(∂²u/∂x² + ∂²u/∂y²)`}</pre>
      <p>
        Discretised by a centred finite difference in time (Leapfrog /
        Störmer-Verlet) and the standard 5-point Laplacian stencil in space:
      </p>
      <pre>{`u[t+1] = 2u[t] − u[t−1] + C_SQ · ∇²ₕu[t]
∇²ₕu  = u[i−1,j] + u[i+1,j] + u[i,j−1] + u[i,j+1] − 4u[i,j]
       = 4·(BlurAttribute_mean − u[i,j])`}</pre>
      <p>
        <code>C_SQ = c²(dt/dx)²</code> is the Courant number squared.
        The 2-D Courant-Friedrichs-Lewy (CFL) stability condition requires{" "}
        <code>C_SQ ≤ 0.5</code>. This blueprint uses <code>C_SQ = 0.24</code>{" "}
        for a comfortable margin. Exceeding 0.5 causes exponential growth
        (numerical instability) rather than oscillation.
      </p>
      <p>
        Why does BlurAttribute give the Laplacian? On a quad mesh, each interior
        vertex has exactly four edge-adjacent neighbours. BlurAttribute
        computes their mean: <code>mean = (Σneighbours)/4</code>. Multiplying
        by 4 gives the raw neighbour sum, so{" "}
        <code>4·(mean − u) = Σneighbours − 4u = ∇²ₕu</code> — the standard
        5-point stencil without dividing by{" "}
        <code>dx²</code> (absorbed into <code>C_SQ</code>). This is identical
        to the approach in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves"
          className={lk}
        >
          BZ Oregonator
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          Reaction-Diffusion
        </Link>
        , but those systems are first-order in time: they have one state
        variable each and use an explicit Euler step. The wave equation is
        second-order in time — it needs both <code>u_curr</code> (position
        at frame <em>t</em>) and <code>u_prev</code> (position at{" "}
        <em>t</em>−1) to reconstruct the velocity implicitly.
      </p>

      <h2>Chladni normal-mode initialisation</h2>
      <p>
        On a square plate with all four edges fixed at <code>u = 0</code>
        (Dirichlet boundary conditions), the normal modes are separable:
      </p>
      <pre>{`u_mn(col, row) = A · sin(M·π·col/(N−1)) · sin(N·π·row/(N−1))`}</pre>
      <p>
        Mode <code>(M, N)</code> has <code>M−1</code> vertical nodal lines and{" "}
        <code>N−1</code> horizontal nodal lines. Mode <code>(2,3)</code> is the
        classic <em>cruciform</em> Chladni figure: one vertical and two
        horizontal nodal lines dividing the plate into six anti-phase regions.
      </p>
      <p>
        Setting <code>u_prev = u_curr = mode_shape</code> imposes zero initial
        velocity — the plate starts at maximum displacement and oscillates
        at the natural frequency
      </p>
      <pre>{`ω = arccos(1 − 2·C_SQ·(1 − α)) rad/frame
α = (cos(M·π/(N−1)) + cos(N·π/(N−1))) / 2`}</pre>
      <p>
        For mode <code>(2,3)</code> on a 40-vertex grid:{" "}
        <code>α ≈ 0.979</code>, <code>ω ≈ 0.142 rad/frame</code>, period{" "}
        <code>T ≈ 44 frames</code>. At frame 22 the sign reverses; at frame 44
        the plate returns to its initial state. Nodal lines never move — they
        are the defining feature of a standing wave. See also the 1-D analogue
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-coupled-pendulums-mathieu-resonance"
          className={lk}
        >
          Coupled Pendulums tutorial
        </Link>
        .
      </p>

      <h2>Boundary conditions</h2>
      <p>
        A Switch node enforces Dirichlet (zero-displacement) boundary
        conditions after every Leapfrog step. The grid row and column of each
        vertex are recovered from its Index:
      </p>
      <pre>{`col = Index % GRID_N          (Math.MODULO)
row = floor(Index / GRID_N)  (Math.FLOOR after Math.DIVIDE)
is_boundary = (col ≤ 0) OR (col ≥ N−1) OR (row ≤ 0) OR (row ≥ N−1)
u_final = Switch(is_boundary → 0.0, else → u_next)`}</pre>
      <p>
        This is the same boundary-detection pattern used in the Abelian Sandpile
        tutorial, but applied to a FLOAT scalar rather than to a grain-count
        integer. Without it the wave would reflect off the edges with the wrong
        phase (free-end rather than fixed-end reflection), corrupting the
        nodal-line geometry.
      </p>

      <h2>State management and display</h2>
      <p>
        Two <code>StoreNamedAttribute</code> nodes chain sequentially inside
        the Simulation Zone:
      </p>
      <pre>{`geo2 = Store('u_prev', u_curr,  on=geo)   ← shift curr → prev
geo3 = Store('u_curr', u_final, on=geo2)  ← write propagated value`}</pre>
      <p>
        Order is critical: <code>u_prev</code> must be updated with the{" "}
        <em>old</em> <code>u_curr</code> before <code>u_curr</code> is
        overwritten. Writing both to the same geometry chain guarantees the
        correct order without branching.
      </p>
      <p>
        Height display uses <code>SetPosition</code> with an absolute position
        rather than an offset, to avoid Z accumulation across frames:
      </p>
      <pre>{`pos = InputPosition          ← (x, y, Z_from_previous_frame)
SetPosition.Position = CombineXYZ(pos.X, pos.Y, u_final·HEIGHT_SC)`}</pre>
      <p>
        Because the wave never modifies X or Y, <code>InputPosition.X</code>{" "}
        and <code>InputPosition.Y</code> always equal the original flat-mesh
        coordinates. Only Z is replaced each frame — no accumulation.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-23",
  title:
    "GN Simulation Zone — 2D Wave Equation: Chladni Standing Waves (Blender 5.1)",
  lede: "Leapfrog integration of the scalar wave PDE on a quad mesh, seeded with the cruciform Chladni normal mode (2,3) and rendered with a diverging emission map that makes nodal lines glow black.",
  body: Body,
  libraryPath:
    "blends/geometry-nodes/gn-simulation-zone-wave-equation-chladni-standing-waves/",
  steps: [
    {
      title: "Purge the scene and build the 40×40 quad mesh",
      body: "Run `purge()` to clear meshes, materials, and node groups.\n\nCall `make_plate()`. A `bmesh` loop creates a 40×40 grid (1600 vertices) in the XY plane at Z=0. Each cell is a quad face. Vertex positions are `(col·CELL_SIZE, row·CELL_SIZE, 0)` — no initial Z displacement, so the geometry starts flat.\n\nTwo FLOAT attributes (`u_curr`, `u_prev`) are initialised via `foreach_set` using a Python list comprehension computing `A·sin(Mπ·col/(N−1))·sin(Nπ·row/(N−1))` for each vertex. Both get the same values — identical attributes = zero initial velocity.",
    },
    {
      title: "Set up the diverging emission material",
      body: "Call `make_material(obj)`.\n\nChain: `ShaderNodeAttribute('u_curr') → MapRange(from=−AMPLITUDE..+AMPLITUDE, to=0..1) → ValToRGB → Emission(strength=8) → OutputMaterial`.\n\nThe five-stop B-Spline colour ramp:\n  Position 0.0 → deep blue   (trough peak)\n  Position 0.32 → electric blue\n  Position 0.5 → black (nodal line — u ≈ 0)\n  Position 0.68 → hot orange\n  Position 1.0 → pale yellow-white (crest peak)\n\nBlack at 0.5 is the key design choice: it makes Chladni nodal lines appear as dark seams against the glowing displacement field.",
    },
    {
      title: "Build the Simulation Zone node tree",
      body: "Call `build_wave_tree(obj)`.\n\nCreate a NODES modifier and a new GeometryNodeTree `ChladniWaveGN`. Wire:\n  `GroupInput.Geometry → SimulationInput → [zone] → SimulationOutput → GroupOutput.Geometry`\n\n`sim_i.pair_with_output(sim_o)` binds the SimulationInput/Output pair. Reads from `sim_i.outputs['Geometry']` see the previous frame's state; writes to `sim_o.inputs['Geometry']` propagate to the next frame.",
    },
    {
      title: "Compute the discrete Laplacian via BlurAttribute",
      body: "Inside the zone:\n  `u_curr = NamedAttribute('u_curr', FLOAT)`\n  `u_prev = NamedAttribute('u_prev', FLOAT)`\n  `blur_u = BlurAttribute(u_curr, iterations=1, FLOAT)`\n  `lapl   = 4 × (blur_u − u_curr)`   — 5-point stencil\n\nBlurAttribute with a single iteration averages each vertex over its four edge-adjacent neighbours on the quad mesh. Multiplying the deviation `(blur − u)` by 4 recovers the unscaled finite-difference Laplacian ∇²ₕu.",
    },
    {
      title: "Leapfrog propagation and Dirichlet boundary conditions",
      body: "Wave step:\n  `u_next = 2·u_curr + C_SQ·lapl − u_prev`\n\nBoundary detection:\n  `col = Math.MODULO(Index, GRID_N)`\n  `row = Math.FLOOR(Math.DIVIDE(Index, GRID_N))`\n  `is_b = OR(OR(col≤0, col≥N−1), OR(row≤0, row≥N−1))`\n  `u_final = Switch(is_b → 0.0, else → u_next)`\n\nThe Switch node enforces fixed-end (Dirichlet) BCs. Without it, edge vertices see only two or three neighbours in the blur, computing an incorrect Laplacian; the Switch overrides u to zero before any corruption can propagate inward.",
    },
    {
      title: "Advance state and set vertex height",
      body: "Two StoreNamedAttribute nodes in strict order:\n  `geo2 = Store('u_prev', u_curr,  on=geo)   ← old curr → prev`\n  `geo3 = Store('u_curr', u_final, on=geo2)  ← new value → curr`\n\nHeight display:\n  `pos  = InputPosition`\n  `sep  = SeparateXYZ(pos)`\n  `comb = CombineXYZ(sep.X, sep.Y, u_final·HEIGHT_SC)`\n  `SetPosition(geo3, Position=comb) → sim_o`\n\nUsing absolute Position rather than Offset avoids Z accumulation: the Z coordinate is replaced each frame with the current displacement, not added to the previous frame's Z.",
    },
    {
      title: "Observe Chladni patterns in the viewport",
      body: "Set the viewport to **Rendered** shading with EEVEE Next. Enable **Bloom** (Scene → EEVEE → Bloom, intensity 0.5+).\n\nPress **Space** to play. Frames 1–44 show one full oscillation:\n  Frame 1:  Blue troughs, orange/white crests, black cruciform nodal lines\n  Frame 11: All colour fading toward black (plate crossing through zero)\n  Frame 22: Colours reversed — former troughs glow orange, peaks glow blue\n  Frame 44: Back to frame 1 state\n\nThe nodal lines (black seams) hold perfectly fixed throughout. This is the diagnostic: if the nodal positions drift, the boundary conditions or mode initialisation have an error.",
    },
  ],
  finalResult:
    "A 40×40 vertex quad mesh evolving the 2-D scalar wave equation via a Geometry Nodes Simulation Zone Leapfrog integrator. Mode (2,3) oscillates with period ≈ 44 frames, producing a stable cruciform Chladni pattern with two vertical and two horizontal nodal lines. The diverging blue–black–red emission material renders nodal lines black against glowing peaks and troughs under EEVEE Next bloom. To capture: run `record.py` for `viewport.mp4`, or follow `SCREEN-RECORDING-NOTES.md` for an OBS screen recording.",
  variations: [
    "Mode (3,3): change MODE_M=3, MODE_N=3. The symmetric square mode produces four anti-phase quadrants with diagonal nodal lines and an oscillation period of ≈ 30 frames.",
    "Mode (1,1): the fundamental mode — one central nodal line bisecting the plate at a right angle. Lowest frequency, longest period (≈ 200 frames at C_SQ=0.24).",
    "Superposition: initialise u_curr with two modes summed — e.g. sin(2π·col/N)·sin(3π·row/N) + 0.3·sin(4π·col/N)·sin(2π·row/N). The result is not a standing wave but a quasiperiodic interference pattern where nodal lines migrate over time.",
    "Damping: subtract a Rayleigh term from u_next: u_final = u_next − DAMP·(u_curr − u_prev). This models the sand-plate experiment where energy dissipates. The amplitude decays exponentially; the nodal lines remain fixed until the plate is fully quiet.",
    "GLB export: after baking 120 frames, loop `bpy.context.scene.frame_set(f); bpy.ops.export_scene.gltf(filepath=f'chladni_{f:04d}.glb', export_apply=True)` to produce per-frame geometry for Three.js morph targets.",
  ],
  troubleshooting: [
    {
      symptom: "The plate stays flat — no displacement visible",
      cause:
        "The Simulation Zone has not been evaluated. Blender only runs the zone from frame 2 onward (frame 1 uses the initialised attribute values as the first state).",
      fix: "Advance to at least frame 2 by pressing the right-arrow key or clicking Play. In rendered viewport shading, also verify that the GN modifier is active (eye icon on in the modifier stack).",
    },
    {
      symptom: "Displacement explodes — vertices fly to infinity",
      cause:
        "CFL violation: C_SQ > 0.5 causes exponential numerical growth instead of oscillation.",
      fix: "Reduce C_SQ to 0.24 or below. The instability is immediate — if frame 2 is already diverging, the parameter is the culprit. Never set C_SQ above 0.5 for a 2-D quad mesh.",
    },
    {
      symptom: "Nodal lines drift or shift between frames",
      cause:
        "Mode initialisation has a phase mismatch: u_prev ≠ u_curr, giving a non-zero initial velocity that mixes modes and causes the nodal pattern to rotate or migrate.",
      fix: "Verify that the Python loop writes the same values to both `u_curr` and `u_prev` attributes via `foreach_set`. A common mistake is calling `foreach_set` on `u_prev` with a zero array instead of the mode shape.",
    },
    {
      symptom: "BlurAttribute has no effect (flat behaviour, no wave propagation)",
      cause:
        "`data_type` on the BlurAttribute node is set to FLOAT_VECTOR instead of FLOAT, so scalar u_curr values are read as zero-length vectors.",
      fix: "Set `blur_node.data_type = 'FLOAT'` in Python. In the node editor, the Data Type dropdown must show Float, not Vector.",
    },
    {
      symptom: "Black nodal lines are not visible — the plate is uniformly bright",
      cause:
        "The MapRange node's From Min/Max values do not span the actual u range, compressing the colour ramp to one end.",
      fix: "Set `From Min = −AMPLITUDE, From Max = +AMPLITUDE`. If AMPLITUDE was changed from 0.4, update MapRange accordingly. In Rendered shading, also confirm the Bloom threshold is below 0.5 so near-zero values render as black, not dark-grey bloom.",
    },
  ],
  externalLinks: [
    {
      label: "Blender Manual — Simulation Zone (CC-BY-SA 4.0)",
      href: "https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html",
    },
    {
      label: "Blender Manual — Blur Attribute (CC-BY-SA 4.0)",
      href: "https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/attribute/blur_attribute.html",
    },
    {
      label: "KhronosGroup/glTF-Blender-IO (Apache-2.0)",
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
    },
  ],
  relatedTutorials: [
    {
      label: "Blur Attribute as Discrete Laplacian — Heat Diffusion",
      href: "/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion",
    },
    {
      label: "Leapfrog State: Spring-Mass Cloth (FLOAT_VECTOR)",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-spring-mass-cloth-verlet-grid-webxr",
    },
    {
      label: "BZ Oregonator — Oscillatory Spiral Waves",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves",
    },
    {
      label: "Reaction-Diffusion Turing Patterns (stationary contrast)",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
    },
    {
      label: "Coupled Pendulums — 1-D Standing Wave Resonance",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-coupled-pendulums-mathieu-resonance",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-simulation-zone-wave-equation-chladni-standing-waves",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: ["blender", "geometry-nodes", "simulation", "physics", "wave-equation"],
    body: Body,
  },
  data,
);

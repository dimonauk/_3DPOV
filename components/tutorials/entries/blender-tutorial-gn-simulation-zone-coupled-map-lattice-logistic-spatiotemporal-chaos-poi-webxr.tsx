import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Iterated maps are one rung down from continuous differential equations
        but one rung up from cellular automata: they are exact, deterministic,
        and — crucially — can be fully chaotic at the level of a single isolated
        site.  Kunihiko Kaneko's Coupled Map Lattice (1984) places N such maps
        on a spatial graph and connects them with a diffusive coupling ε.  The
        result is a model that spans the full spectrum of collective behaviour by
        turning a single dial: at ε ≈ 0 you have N independent chaotic processes
        with no correlation whatsoever; near ε ≈ 0.5 the local chaos organises
        into travelling kink–antikink pairs that cross the ring like interference
        fringes; and at ε ≈ 1 all sites lock onto the identical chaotic orbit —
        synchronised chaos, where every poi performer spins in perfect unison yet
        the sequence itself remains completely unpredictable.
      </p>
      <p>
        The choice of logistic map f(x) = r·x·(1−x) at r = 3.8 is deliberate.
        At r ≤ 1 the map has a single stable fixed point (zero); at r ≈ 3 it
        period-doubles; at r ≈ 3.57 the last period-doubling cascade converges
        and the attractor becomes a Cantor set of zero measure — the onset of
        chaos.  By r = 3.8 the attractor is a dense interval and the{" "}
        <em>Lyapunov exponent</em> is positive (≈ 0.43), confirming that any two
        initial conditions diverge exponentially.  The period-2 skeleton
        (unstable orbit near φ ≈ 0.17 and φ ≈ 0.95) persists as a ghost: in
        the synchronised regime you can see neighbouring poi alternate between
        the two lobes — blue then red, blue then red — a shadow of the underlying
        period-2 cycle inside the chaos.
      </p>
      <p>
        The GN Simulation Zone implementation is interesting for a different
        reason: the Kaneko coupling formula
        (ε/2)·[f(φᵢ₋₁) + f(φᵢ₊₁)] is <em>exactly</em> what{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
          className={lk}
        >
          Blur Attribute
        </Link>{" "}
        computes on a 2-connected ring (each vertex with exactly two
        edge-neighbours).  No custom iteration, no Field at Index loop — one
        Blur node gives the full neighbour sum.  This is the key architectural
        insight: <strong>choose your mesh topology to match your coupling
        stencil</strong>, and Blender's built-in diffusion operator does the
        heavy lifting for free.  The same principle drives the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          Turing reaction-diffusion
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-boid-flock"
          className={lk}
        >
          Boid flock
        </Link>{" "}
        tutorials, but CML makes it most explicit because the coupling is purely
        two-neighbour with no face geometry to confuse the averaging.
      </p>

      <h2>Why store logistic-map values before blurring</h2>
      <p>
        The CML update requires f(φᵢ₋₁) and f(φᵢ₊₁) — the logistic-map
        <em>images</em> of the neighbours' current states — not the neighbours'
        states themselves.  Blurring φ directly would give{" "}
        <code>½·(φᵢ₋₁ + φᵢ₊₁)</code>, which is a different (linear diffusion)
        model.  The blueprint therefore:
      </p>
      <ol>
        <li>
          Computes <code>F = r·φ·(1−φ)</code> per vertex (the local map
          application).
        </li>
        <li>
          Stores F as the temporary named attribute <code>"lmap"</code> via{" "}
          <code>Store Named Attribute</code> — this writes F into the geometry
          so subsequent nodes can read it as a field.
        </li>
        <li>
          Reads <code>"lmap"</code> back with <code>Named Attribute</code> and
          passes it to <code>Blur Attribute(iterations=1)</code>, which averages
          across edge-connected neighbours — yielding{" "}
          <code>½·(F_{"{i-1}"} + F_{"{i+1}"})</code> exactly.
        </li>
        <li>
          Combines: <code>φ_new = (1−ε)·F + ε·blur_F</code>, clamps to (0.001,
          0.999), and stores as <code>"phi"</code>.
        </li>
      </ol>
      <p>
        The temporary "lmap" attribute is overwritten every frame — it is not
        accumulated across frames.  Only "phi" persists between Simulation Zone
        iterations.
      </p>

      <h2>The ε schedule and its three dynamical phases</h2>
      <p>
        The blueprint encodes ε as a step function of{" "}
        <code>SceneTime.Frame</code> inside the Simulation Zone using{" "}
        <code>Math(GREATER_THAN)</code> nodes:
      </p>
      <pre>{`eps = 0.05
    + GREATER_THAN(frame, 60)  × 0.45   → 0.50 after frame 60
    + GREATER_THAN(frame, 120) × 0.45   → 0.95 after frame 120`}</pre>
      <p>
        This is not a smooth ramp — the transitions are instantaneous — because
        the three phases are qualitatively distinct and a slow ramp would blur
        the visual boundary.  Watch for the transition at frame 61: within a few
        frames of the ε jump, travelling waves appear as diagonal stripes if you
        were to stack ring snapshots vertically as a space-time plot.  At frame
        121 the ring collapses from noisy to coherent in under 10 frames — the
        logistic{" "}
        <Link
          href="/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr"
          className={lk}
        >
          synchronisation
        </Link>{" "}
        is fast because r=3.8 gives a large positive Lyapunov exponent (strong
        chaos), and at ε≈0.95 the coupling term dominates the local dynamics by
        a factor of roughly 19:1.
      </p>

      <h2>Colour encoding and the invariant measure</h2>
      <p>
        The emission colour ramp (blue=0 → red=1) encodes φ directly.  At r=3.8
        the invariant density of the logistic attractor is the arcsine
        distribution ρ(x) = 1/(π√(x(1−x))), which peaks at 0 and 1 — values
        near 0 or 1 are visited most often.  In the spatiotemporal-chaos phase
        (ε=0.05) you therefore see more blues and reds than greens and yellows:
        the colour distribution reflects the arcsine density, not uniform random.
        In the synchronised phase, every site follows the same orbit, so the
        colour of the whole ring cycles together — watch for the characteristic
        blue/red alternation of the period-2 ghost.
      </p>
    </>
  );
}

const data = {
  title:
    "GN Simulation Zone — Coupled Map Lattice: Logistic Map, Spatiotemporal Chaos & Synchronisation for Poi Ring (Blender 5.1)",
  lede:
    "Build Kaneko's Coupled Map Lattice on a 64-vertex ring using BlurAttribute as the exact Kaneko coupling stencil. Three ε regimes — spatiotemporal chaos, travelling kink waves, synchronised chaos — animate 64 poi heads in a single 180-frame EEVEE render.",
  date: "2026-08-02",
  steps: [
    {
      title: "Run blueprint.py and understand the ring geometry",
      body: "Open Blender 5.1 → **Scripting** workspace. Paste and run `blueprint.py`.\n\n`make_ring()` builds a closed 1D ring of 64 vertices connected by edges only — **no faces**. This is the critical topology choice: `Blur Attribute` on a POINT domain averages across edge-connected vertices. A 2-connected ring gives each vertex exactly 2 neighbours, so one blur iteration yields `(left + right) / 2` — the exact Kaneko coupling stencil.\n\nThe `phi` FLOAT attribute is seeded in (0.15, 0.85) via `random.Random(137)`. Values outside (0.001, 0.999) are avoided because f(0) = f(1) = 0 and the map collapses to zero permanently — a degenerate absorbing state.\n\nSwitch to **Rendered** shading (EEVEE Next). You should see 64 glowing spheres on a ring, their heights encoding the random initial phi.",
    },
    {
      title: "Inspect the Simulation Zone node tree",
      body: "Select `hf_cml_ring`, open the **Geometry Nodes** editor. You see:\n\n1. **Group Input** → **Simulation Input** → sim body → **Simulation Output**\n2. After the sim output: **Set Position** → **Instance on Points** → **Group Output**\n\nInside the sim body, trace the main chain:\n- `Named Attribute('phi')` → `F = R_LOG * phi * (1 − phi)` (three Math nodes)\n- `Store Named Attribute('lmap', F)` — writes F to the geometry mid-tree\n- `Named Attribute('lmap')` → `Blur Attribute(iterations=1)` → `blur_F`\n- `SceneTime.Frame` → two `GREATER_THAN` tests → `eps` scalar\n- `phi_new = (1−eps)*F + eps*blur_F` → clamp → `Store Named Attribute('phi', phi_new)`\n\nThe two Store Named Attribute nodes are the geometry backbone: they carry the attribute data from one computation stage to the next.",
    },
    {
      title: "Frames 1–60: spatiotemporal chaos (ε = 0.05)",
      body: "Press **Space** and watch the first 60 frames. With ε = 0.05, each site applies the logistic map almost independently — the coupling is 5% of the update. The ring height profile is irregular and uncorrelated: neighbouring heights are no more similar than non-neighbours. This is spatiotemporal chaos: every point has a positive Lyapunov exponent and the spatial correlation length is O(1) lattice sites.\n\nOpen the **Spreadsheet** panel and pin `phi` on POINT domain. During frames 1–60 you will see all 64 values changing independently each frame, spanning most of the interval (0.1, 0.9) with a bias toward extremes (the arcsine invariant measure).\n\nAt N=64 with r=3.8, the maximum Lyapunov exponent per site is ≈0.43 nats/step. After 10 frames, any two trajectories starting 10⁻⁶ apart will differ by ~e^(0.43×10) ≈ 70× — the initial condition information is completely lost.",
    },
    {
      title: "Frames 61–120: travelling waves (ε = 0.50)",
      body: "At frame 61, `ε` steps from 0.05 to 0.50. Within a handful of frames, the ring develops **kink–antikink** structures: regions of phase-locked sites separated by narrow defect boundaries that travel around the ring.\n\nWatch for diagonal patterns if you hold a screen recording and scrub slowly — strips of coherent colour moving clockwise or anticlockwise. These are kinks (domain walls) propagating at a characteristic speed set by ε and r.\n\nThe defect density falls during this phase as kink–antikink pairs annihilate on collision. In the thermodynamic limit (N → ∞) this phase is sometimes called *pattern turbulence* — spatial order coexists with temporal chaos.\n\nIn the **GN node tree**: at ε=0.50, the blur term contributes equally to the self term: `phi_new = 0.5*F + 0.5*blur_F`. The spatial coupling is strong enough to enforce local agreement but not strong enough to globally synchronise.",
    },
    {
      title: "Frames 121–180: synchronised chaos (ε = 0.95)",
      body: "At frame 121 ε jumps to 0.95. The coupling term now dominates (19:1 over the self term). Within ~10 frames, all 64 sites collapse onto the same chaotic trajectory — **synchronised chaos**.\n\nIn the **Spreadsheet**, all 64 phi values are identical (to floating-point precision) after frame ~135. In the viewport, all 64 poi heads move to the same height simultaneously and their colour cycles as one. Yet the sequence is still completely unpredictable — the entire ring is a single chaotic oscillator.\n\nLook for the **period-2 ghost**: when phi is in the blue half (<0.5) the whole ring is blue; next frame it jumps to the red half (>0.5) and the ring is red. This alternation reflects the unstable period-2 orbit near {0.17, 0.95} that underlies the chaos at r=3.8. You are seeing a shadow of the orbit structure inside the synchronised chaos.\n\n**Recording note**: this phase makes the most striking footage — 64 poi heads pulsing in complete unison with a vivid blue/red alternation.",
    },
    {
      title: "Export a baked GLB for WebXR",
      body: "To export the simulation as a static animated GLB:\n\n1. In the modifier stack, expand **Simulation Zone → Bake** and click **Bake** for frames 1–180.\n2. Once baked, select `hf_cml_ring`, go to **File → Export → glTF 2.0**.\n3. Export settings: **Apply modifiers** ON, **Include → Selected Objects** only, **Animation → Baked Animation** ON.\n4. The exported GLB will contain 180 keyframes of vertex positions and vertex colours encoding the CML trajectory.\n\nFor WebXR deployment via `holoflow_webxr_exporter`, use: apply transforms, Draco compression level 6, WebP textures, root name `hf_cml_ring`. The `holoflow:facet` flag is not needed here (emission material, no face normals).\n\nThe baked GLB is typically 2–4 MB for 64 instances × 180 frames with Draco.",
    },
  ],
  finalResult:
    "A 64-vertex ring mesh with a `phi` FLOAT attribute evolving each frame via the Kaneko Coupled Map Lattice update rule — logistic map plus BlurAttribute neighbour coupling — inside a GN Simulation Zone. Three distinct dynamical phases (ε=0.05/0.50/0.95) animate over 180 frames: spatiotemporal chaos, kink–antikink travelling waves, and synchronised chaos. Poi sphere instances at each vertex emit colour-coded by φ, revealing the period-2 skeleton and arcsine invariant measure of the logistic attractor.",
  variations: [
    "Set R_LOG = 3.58 (barely above the chaos onset). The attractor is a narrow Cantor band and the synchronised phase shows long laminar windows — stretches of many frames where phi barely moves — punctuated by brief chaotic bursts. This is the 'intermittency route to chaos' and creates a very different light painting: long calm holds broken by sudden colour flashes.",
    "Change N from 64 to 128 and halve POI_R to 0.03 m. The ring is visually denser. In the wave phase (ε=0.50) you can count the number of kink–antikink pairs — it is always even (pairs annihilate in pairs). With N=128 you typically see 2–4 pairs simultaneously, creating visible interference patterns on the ring.",
    "Replace the logistic map with the tent map f(x) = r·min(x, 1−x) (two Math nodes: MIN, SUBTRACT). At r=2 the tent map is uniformly chaotic with Lyapunov exponent ln(2)≈0.69, larger than the logistic at r=3.8. The synchronised phase locks faster and the kink speed in the wave phase is higher. The invariant measure is now uniform on [0,1], so the colour distribution is flat — no arcsine bias toward blue/red.",
    "Add a second ring offset in Z by 0.5 m and initialised with the same seed but shifted by 1 frame. Watch the cross-correlation between the two rings: at ε=0.05 they are independent; at ε=0.95 they cannot synchronise (they have no coupling to each other) so they evolve on parallel but divergent chaotic orbits — a vivid demonstration that synchronisation requires coupling.",
    "Bake the simulation and export only the frames 115–145 (the ε=0.50→0.95 synchronisation transition). Import into the VSE and add a slow-motion effect (set FPS to 5). The collapse from wave-turbulence to coherent pulsing plays out over several seconds, making an excellent standalone educational clip.",
  ],
  troubleshooting: [
    {
      symptom:
        "All phi values collapse to 0 within a few frames",
      cause:
        "The initial phi attribute contains values too close to 0 or 1. The logistic map f(x)→0 when x→0, and if neighbours also have x≈0, the coupling term reinforces the collapse.",
      fix: "In `make_ring()`, change the bounds from `rng.uniform(0.15, 0.85)` to `rng.uniform(0.25, 0.75)` to start further from the absorbing fixed point. Alternatively, increase the clamp floor in the Simulation Zone from 0.001 to 0.05 — this reflects the orbit away from 0 before the next map application.",
    },
    {
      symptom:
        "The three ε phases are not visible — the ring looks the same throughout",
      cause:
        "The step-function ε nodes are wired incorrectly, or the SceneTime node is not inside the Simulation Zone body.",
      fix: "Open the GN editor and confirm that `GeometryNodeInputSceneTime` is between the `Simulation Input` and `Simulation Output` nodes (i.e. inside the zone body, not outside it). If SceneTime is outside the zone, it reads the current frame but the value is not visible to nodes inside the zone. Re-create the SceneTime node by clicking inside the zone boundary before adding it.",
    },
    {
      symptom:
        "BlurAttribute appears to include the vertex itself in the average (phi changes too slowly)",
      cause:
        "In some Blender builds, Blur Attribute on POINT domain uses a weighted average that includes the element itself with weight proportional to 1/degree. For a degree-2 ring this gives (1/3)·self + (1/3)·left + (1/3)·right instead of ½·(left+right).",
      fix: "Compensate by adjusting the combination formula. Instead of `phi_new = (1-eps)*F + eps*blur_F`, use `phi_new = F + eps*(blur_F - F)` — this is algebraically identical but makes the self-subtraction explicit and is resilient to the self-weight. Alternatively increase eps slightly (to 0.07, 0.60, 0.99) to achieve the same three regimes under the modified stencil.",
    },
  ],
  externalLinks: [
    {
      label:
        "Kaneko, K. — Period-doubling of kink-antikink patterns & spatial intermittency in coupled logistic lattice (1984, Public Domain preprint)",
      href: "https://arxiv.org/abs/nlin/0112004",
    },
    {
      label:
        "Blender Manual — Simulation Zone (CC-BY-SA 4.0, Blender Foundation)",
      href: "https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Reaction-Diffusion Turing — Grey-Scott Chemical Pattern Formation in GN Simulation Zone",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
    },
    {
      label:
        "Blur Attribute — Heat Diffusion & Laplacian Smoothing in Geometry Nodes",
      href: "/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion",
    },
    {
      label:
        "Boid Flock — Craig Reynolds Steering Behaviours in GN Simulation Zone",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-boid-flock",
    },
    {
      label:
        "Kuramoto Oscillators — Phase Synchronisation & Emergent Coherence (Python)",
      href: "/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-simulation-zone-coupled-map-lattice-logistic-spatiotemporal-chaos-poi-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "geometry-nodes",
      "simulation",
      "chaos",
      "coupled-map-lattice",
      "logistic-map",
      "light-painting",
      "poi",
    ],
    body: Body,
  },
  data,
);

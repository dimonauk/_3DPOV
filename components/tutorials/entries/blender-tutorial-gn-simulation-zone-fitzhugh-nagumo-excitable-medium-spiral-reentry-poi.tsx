import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A nerve cell does not behave like a simple resistor. Poke it gently and
        nothing happens. Poke it past a threshold and it fires a full-amplitude
        pulse — always the same size, regardless of how hard you pushed. Then it
        refuses to fire again for a fixed interval (the refractory period) before
        returning to rest. This all-or-nothing, threshold-gated behaviour is
        called <em>excitability</em>, and in 1961 Richard FitzHugh reduced the
        full 4-variable Hodgkin-Huxley equations down to two variables that
        capture every qualitative feature of the action potential.
      </p>
      <p>
        Give that 2-variable system spatial extent — let the activator{" "}
        <em>u</em> diffuse across a grid — and excitability becomes a{" "}
        <em>medium</em>: signals propagate as expanding rings, colliding waves
        annihilate each other (because each wavefront leaves a refractory tail),
        and a broken wavefront curls into a rotating spiral. You see this in
        cardiac muscle (the spiral is called <em>reentry</em> and it causes
        ventricular fibrillation), in the Belousov-Zhabotinsky reaction, and in
        retinal light-sensitivity waves. This tutorial runs it in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves"
          className={lk}
        >
          a Simulation Zone
        </Link>{" "}
        on a 64×64 grid using the same BlurAttribute Laplacian trick from the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
          className={lk}
        >
          heat-diffusion tutorial
        </Link>
        .
      </p>

      <h2>The FHN phase plane</h2>
      <p>
        The FitzHugh-Nagumo equations in their spatial form are:
      </p>
      <pre>{`∂u/∂t = u − u³/3 − v + I_ext + D ∇²u     (fast activator)
∂v/∂t = ε (u + α − β v)                   (slow recovery)

Canonical parameters: α = 0.7, β = 0.8, ε = 0.08, I_ext = 0.5, D = 0.5`}</pre>
      <p>
        The phase plane (
        <em>u</em> horizontal, <em>v</em> vertical) has two nullclines:
      </p>
      <pre>{`u-nullcline: v = u − u³/3 + I_ext   (cubic, N-shaped)
v-nullcline: v = (u + α) / β          (straight line)`}</pre>
      <p>
        With <code>I_ext = 0.5</code> the straight line crosses the cubic at its{" "}
        <em>middle branch</em> — an unstable fixed point. The system cannot rest
        there; any perturbation sends it around the limit cycle, firing
        spontaneously and creating target waves across the grid. Set{" "}
        <code>I_ext = 0.0</code> and the crossing shifts to the left stable
        branch: now the grid is truly excitable — it needs a push above threshold
        before it fires once, then rests.
      </p>

      <h2>The BlurAttribute Laplacian</h2>
      <p>
        BlurAttribute with one iteration averages each vertex with its
        edge-connected neighbours. On a 4-connected interior grid vertex{" "}
        <em>c</em>:
      </p>
      <pre>{`blur(u)_c = (u_c + u_N + u_S + u_E + u_W) / 5
→  blur(u) − u = (u_N + u_S + u_E + u_W − 4 u_c) / 5
               = discrete Laplacian / 5

∴  D ∇²u  ≈  D_EFF × (blur(u) − u),   D_EFF = D × 5 = 2.5`}</pre>
      <p>
        This is the same technique used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr"
          className={lk}
        >
          Gray-Scott reaction-diffusion tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-store-named-attribute-shader-data-bridge"
          className={lk}
        >
          Named Attribute bridge tutorial
        </Link>
        . The Blur node operates on the <code>POINT</code> domain of the mesh,
        so the hand-built bmesh grid in{" "}
        <code>blueprint.py</code> uses explicit edges rather than the Mesh Grid
        primitive (which creates face topology, not the edge topology BlurAttribute
        needs to see neighbours).
      </p>

      <h2>Spiral initiation: the cross-field protocol</h2>
      <p>
        A single pacemaker produces concentric target waves. To create a spiral
        you need to <em>break</em> a wavefront. The cross-field protocol does
        this with two stimuli:
      </p>
      <pre>{`S1 (frames 1–4):   left 3 columns, u set to U_STIM = 1.8
                   → plane wave propagates rightward
                   → the top and bottom halves are in phase

Frame ~35–55:      S1 wave propagates across the domain
                   → top half enters refractory zone, bottom still resting

S2 (frames 60–63): bottom half ONLY, u set to U_STIM = 1.8
                   → S2 wave can propagate in the resting bottom half
                   → S2 is blocked in the refractory top half
                   → wave tip appears at the boundary y = N/2 * CELL
                   → tip curls into a clockwise rotating spiral`}</pre>
      <p>
        Both stimulus gates live entirely inside the GN tree —{" "}
        <code>GeometryNodeSceneTime</code> provides the current frame,{" "}
        <code>FunctionNodeCompare</code> + <code>FunctionNodeBooleanMath(AND)</code>{" "}
        create the time and space masks, and{" "}
        <code>GeometryNodeSwitch</code> overrides{" "}
        <code>u_new</code> with <code>U_STIM</code> where the mask is true. No
        Python frame handler is required.
      </p>

      <h2>Poi fire-ring connection</h2>
      <p>
        The wavefront isocontour — where <em>u</em> crosses 0 from below — is a
        closed curve that expands outward at roughly one grid cell per frame. A
        poi head during a body-wrap traces exactly this arc: a closed ring
        centred on the performer's body. When the spiral reentry forms, the
        rotating tip corresponds to a poi performer spinning a horizontal lasso;
        the period of rotation, T ≈ 20–25 frames at 24 fps (0.8–1.0 seconds), is
        a natural poi beat frequency for a slow-tempo performance. The refractory
        tail — the dark violet region behind each wavefront — maps to the poi&apos;s
        return arc, where the glow fades before the next orbit begins.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-25",
  title:
    "GN Simulation Zone — FitzHugh-Nagumo Excitable Medium: Action-Potential Propagation, Spiral Reentry & Poi Fire-Ring Light Painting (Blender 5.1)",
  lede: "64×64 FitzHugh-Nagumo oscillators, fully in Geometry Nodes: BlurAttribute computes the 4-connected Laplacian, two frame-gated Switch nodes inject the cross-field stimulus (S1 plane wave + S2 half-plane break), and the broken wavefront tip curls into a rotating spiral reentry — the nerve-membrane action potential rendered as glowing poi fire rings over 280 frames.",
  libraryPath:
    "blends/geometry-nodes/gn-simulation-zone-fitzhugh-nagumo-excitable-medium-spiral-reentry-poi/",
  blenderVersion: "5.1",
  difficulty: "expert" as const,
  time: "75 minutes",
  prerequisites: [
    "Comfortable running bpy scripts in the Scripting workspace",
    "Understand what the Simulation Zone is and how Named Attribute / Store Named Attribute work",
    "Familiar with BlurAttribute as a Laplacian proxy (see gn-blur-attribute-heat-diffusion)",
    "Basic familiarity with phase-plane analysis (nullclines, fixed points) is helpful but not required",
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
      title: "Open Blender 5.1 — Scripting workspace",
      body: "New General file. Click the Scripting tab. Click New in the text editor. Open the System Console (Window → Toggle System Console on Windows) — the script prints a completion message you will want to see.",
    },
    {
      title: "Paste and run blueprint.py",
      body: "Copy blueprint.py into the text editor. Press Alt+P. The script creates a 64×64 bmesh grid, assigns fhn_u and fhn_v POINT attributes, builds the GN modifier with the Simulation Zone, and saves the blend file. Runtime under 4 seconds.",
    },
    {
      title: "Switch to Layout and play the timeline",
      body: "Press Space. By frame 20 you should see an orange wavefront advancing from the left edge. By frame 55 it fills most of the grid. At frame 60 the bottom half lights up (S2 stimulus). By frame 75 a rotating spiral should be visible in Material Preview (Z key). If the grid is grey, confirm the material is assigned: select the mesh, Properties → Material → check hf_fhn_mat is in the slot.",
    },
    {
      title: "Inspect the Simulation Zone in the GN editor",
      body: "Open the Geometry Node Editor (Shift+F5). With hf_fitzhugh_nagumo selected, the FitzHughNagumoGN group opens. Trace from the Simulation Input node: BlurAttribute reads fhn_u → Subtract gives the Laplacian proxy → three Math(MULTIPLY) nodes compute u³/3 → the kinetics chain → Euler update → two stimulus Switch nodes → Store fhn_u and fhn_v → SetPosition Z = u × Z_SCALE → Simulation Output. Outside the zone: MapRange normalises u to [0,1] and stores u_01 for the colour material.",
    },
    {
      title: "Change I_EXT to 0.0 — excitable vs oscillatory regime",
      body: "In blueprint.py change I_EXT = 0.5 to I_EXT = 0.0 and re-run. The v-nullcline now crosses the left branch of the u-nullcline: the system has a stable rest state. The S1 stimulus still fires a wavefront but the grid returns to dark blue rest rather than continuously oscillating. This is the excitable regime — the medium that models cardiac muscle at rest.",
    },
    {
      title: "Adjust the spiral protocol timing",
      body: "If the spiral does not form, the S2 stimulus may be arriving too early (while S1 is still in the top half) or too late (after the refractory period has passed). Change S2_START from 59.5 to 45.5 (earlier) or 74.5 (later) in blueprint.py and re-run. The sweet spot is when the S1 wave has fully crossed the top half but the bottom half has not yet been reached — visually, when you can see the orange wavefront at about x = 50 columns.",
    },
    {
      title: "Render the viewport animation with record.py",
      body: "Open record.py in a second text editor tab (alongside blueprint.py). Press Alt+P. The script adds 280 keyframes to the camera for a 270° orbit, sets EEVEE Next with bloom, and calls bpy.ops.render.render(animation=True). Output goes to public/library/videos/geometry-nodes/.../viewport.mp4. Render time: 3–8 seconds per frame on a mid-range GPU.",
    },
    {
      title: "Record the screen tutorial with OBS",
      body: "Follow SCREEN-RECORDING-NOTES.md. Capture the run of blueprint.py, the GN editor walkthrough, and the I_EXT toggle. Aim for 8–12 minutes. The most instructive moment is frames 59–75: step through frame-by-frame with ← / → to show the wave break and spiral tip formation.",
    },
  ],
  finalResult:
    "A 64×64 point-lattice mesh with fhn_u and fhn_v POINT-domain FLOAT attributes; a Geometry Nodes modifier containing a Simulation Zone implementing explicit-Euler FitzHugh-Nagumo kinetics (α=0.7, β=0.8, ε=0.08, I_ext=0.5, D_EFF=2.5, dt=0.05) with a 4-connected BlurAttribute Laplacian for u diffusion. Cross-field stimulation (S1 left columns, S2 bottom half) encoded as frame-gated Switch nodes. SetPosition lifts vertices by u × Z_SCALE to create a 3-D surface topography. An emission material maps u to a blue→violet→orange colour ramp. Spiral reentry visible after frame 70; the rotation period is approximately 22 frames (0.92 seconds at 24 fps). Scene saved as hf_fitzhugh_nagumo.blend.",
  variations: [
    "Set EPSILON = 0.03 (slower recovery) — the wavefronts become wider and slower, the refractory tails grow longer, and the spiral tip slows. This is the 'relaxation oscillator' limit of FHN.",
    "Remove I_EXT and add a periodic stimulus instead: every 30 frames, set u=U_STIM in the centre cell only. Use a SceneTime.Frame modulo check (Mod 30 < 3) to create a point pacemaker. Multiple spirals will spawn if you use two offset pacemakers.",
    "Add noise to the initial conditions: modify make_grid() to set u_arr with random values in [-0.2, 0.2] rather than -1.2. The chaotic initial state will self-organise into multiple competing spiral tips — a model of cardiac fibrillation.",
    "Replace the flat grid with a sphere surface: use a UV Sphere object (64×64 vertices) as the domain mesh and adjust the BlurAttribute to work with the non-uniform edge topology. The spiral will wrap around the sphere, demonstrating scroll waves on a closed surface.",
    "Export as a GLB animation: bake the GN state (modifier panel → Bake), then use bpy.ops.export_scene.gltf with export_animations=True. Baked vertex positions become morph-target animation in the GLB.",
  ],
  troubleshooting: [
    {
      symptom: "Grid stays dark blue — no wavefront appears after running blueprint.py",
      cause:
        "The Simulation Zone is not advancing, or the fhn_u attribute initial values were not set correctly.",
      fix: "In the modifier panel, confirm no baked data exists (Bake section → Delete). Check the GN chain ends at Simulation Output with Store fhn_u in the path. In the Python console: obj = bpy.data.objects['hf_fitzhugh_nagumo']; print(obj.data.attributes['fhn_u'].data[0].value) — should be 1.8 for the first vertices. If -1.2 everywhere, the initial condition failed: re-run blueprint.py.",
    },
    {
      symptom: "Target waves appear but no spiral forms — the grid just fills with concentric rings",
      cause:
        "The S2 stimulus is arriving too early or too late relative to the S1 refractory window.",
      fix: "Change S2_START in blueprint.py. Step through the timeline manually at frames 55–70 to find the frame where the S1 wavefront is at approximately x = 45 columns. Set S2_START to that frame minus 1. If the grid oscillates uniformly (no spiral) rather than showing rings, the S2 mask may not be limiting the stimulus to the bottom half — check that S2_ROW = (N // 2) * CELL is positive and approximately 3.84.",
    },
    {
      symptom: "Error: 'FunctionNodeBooleanMath' not found",
      cause:
        "Blender build does not have the BooleanMath node under that identifier (it may be registered as 'GeometryNodeBooleanMath' in some custom builds).",
      fix: "In blueprint.py, change 'FunctionNodeBooleanMath' to 'GeometryNodeBooleanMath'. If neither works, open the GN editor, press Shift+A → Utilities → Boolean Math to confirm the node's existence; right-click → Edit Source to find the bl_idname.",
    },
    {
      symptom: "Simulation Zone node raises 'pair_with_output' AttributeError",
      cause:
        "In Blender builds before 4.1, the API used a different method to pair Simulation Zone nodes.",
      fix: "Replace sim_i.pair_with_output(sim_o) with: sim_i.state_items.new('GEOMETRY', 'State'); sim_o.state_items.new('GEOMETRY', 'State'). If that also fails, create the Simulation Zone manually via the GN editor Add menu (Add → Simulation Zone) and connect the geometry through it by hand.",
    },
  ],
  externalLinks: [
    {
      label:
        "FitzHugh R. (1961). Impulses and Physiological States in Theoretical Models of Nerve Membrane. Biophysical Journal 1(6):445–466. NIH PMC Open Access — Public Domain.",
      href: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1366333/",
    },
    {
      label:
        "Blender Foundation — Blur Attribute node reference. CC-BY-SA 4.0.",
      href: "https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/attribute/blur_attribute.html",
    },
    {
      label:
        "Blender Foundation — Simulation Zone reference. CC-BY-SA 4.0.",
      href: "https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "BZ Oregonator — Spiral Waves in Excitable Media (sibling 3-variable excitable medium)",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves",
    },
    {
      label:
        "GN Blur Attribute — Heat Diffusion (the Laplacian proxy technique explained from first principles)",
      href: "/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion",
    },
    {
      label:
        "Python numpy — Gray-Scott Reaction-Diffusion: Spot & Stripe Turing Patterns for WebXR",
      href: "/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr",
    },
    {
      label:
        "GN Simulation Zone — 2-D Wave Equation: Chladni Standing Waves (wave propagation using the same grid topology)",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-wave-equation-chladni-standing-waves",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-simulation-zone-fitzhugh-nagumo-excitable-medium-spiral-reentry-poi",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: ["blender", "geometry-nodes", "simulation", "excitable-medium", "reaction-diffusion", "spiral-waves", "poi", "light-painting"],
    body: Body,
  },
  data,
);

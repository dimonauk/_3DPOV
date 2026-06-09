import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSimulationZoneReactionDiffusionTuringBody() {
  return (
    <>
      <p>
        The <strong>Grey-Scott reaction-diffusion model</strong> (1983) evolves
        two chemical species — U (substrate) and V (product) — across a mesh
        surface via coupled PDEs. Under the right parameters, the system breaks
        spatial symmetry and produces Turing patterns: labyrinths, spots, and
        solitons, all controllable from a single kill parameter dial. Implementing
        this in a Blender 5.1 Simulation Zone teaches per-point state accumulation
        between frames, discrete Laplacian approximation via BlurAttribute, and
        why the UV&sup2; term is the engine of self-organisation.
      </p>

      <h2>The Grey-Scott equations and what each term does</h2>
      <pre>{`∂U/∂t = Du∇²U  −  UV²  +  f(1−U)
∂V/∂t = Dv∇²V  +  UV²  −  (f+k)V`}</pre>
      <p>
        <strong>Du∇²U / Dv∇²V</strong> are the diffusion terms — U spreads
        twice as fast as V (Du=0.20, Dv=0.10), the asymmetry Turing identified
        as the necessary condition for pattern instability.{" "}
        <strong>UV&sup2;</strong> is the autocatalytic coupling: V catalyses its
        own production by converting U. <strong>f(1−U)</strong> replenishes U
        from a reservoir; <strong>(f+k)V</strong> removes V. Changing kill k
        alone moves through all of John Pearson&rsquo;s 1993 named regimes.
        Compare the diffusion-only approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-blur-attribute-heat-diffusion"
          className={lk}
        >
          Blur Attribute heat-diffusion tutorial
        </Link>
        , where a single species without the UV&sup2; term relaxes smoothly
        to uniform temperature rather than breaking into pattern.
      </p>

      <h2>Simulation Zone: state accumulation between frames</h2>
      <p>
        A standard GN modifier re-evaluates from scratch every frame.
        The <strong>Simulation Zone</strong> breaks this rule: geometry exiting{" "}
        <code>GeometryNodeSimulationOutput</code> is cached and fed back into{" "}
        <code>GeometryNodeSimulationInput</code> on the following frame.
        The pre-zone seed nodes run every evaluation, but the zone only consumes
        them at frame&nbsp;0 — once the cache exists, sim_in ignores
        initialisation and reads from its stored geometry. Resetting therefore
        requires a cache clear (the &lsquo;X&rsquo; on the modifier), not just
        rewinding the timeline. The same mechanism is used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
          className={lk}
        >
          Simulation Zone wave-reveal tutorial
        </Link>
        , though that entry uses a single scalar field with no nonlinear coupling.
      </p>

      <h2>BlurAttribute as a discrete Laplacian</h2>
      <p>
        <code>GeometryNodeBlurAttribute</code> computes a first-ring average;
        subtracting the original gives the discrete Laplacian:{" "}
        <code>lap_u&nbsp;=&nbsp;blur_u&nbsp;−&nbsp;u&nbsp;≈&nbsp;(Σneighbours&nbsp;−&nbsp;4u)/4</code>{" "}
        on a regular grid. Du=0.20 in the modifier is Du/4 in continuous-PDE
        literature; multiply published parameters by&nbsp;4 when porting.
        Stability criterion for explicit Euler: Du&nbsp;&times;&nbsp;2&nbsp;&le;&nbsp;1
        (with DT=1/frame). Du=0.20 gives 0.40 — stable. A flat grid is
        preferred over a UV sphere: regular 4-connectivity produces an isotropic
        Laplacian; irregular sphere valence distorts the Turing wavelength.
      </p>

      <h2>Node wiring: inside and outside the zone</h2>
      <p>
        Nodes are &ldquo;inside&rdquo; the zone if their geometry path runs from{" "}
        <code>sim_in.outputs[&quot;Geometry&quot;]</code> to{" "}
        <code>sim_out.inputs[&quot;Geometry&quot;]</code>. Pre-zone: two{" "}
        <code>StoreNamedAttribute</code> nodes seed conc_u=1.0 and conc_v=0.5
        at the seed patch, then feed the geometry into sim_in. Inside: two{" "}
        <code>NamedAttribute</code> nodes read the previous frame; two{" "}
        <code>BlurAttribute</code> nodes approximate the Laplacian; Math nodes
        compute the GS update; two <code>StoreNamedAttribute</code> nodes write
        back. Post-zone: the material reads conc_v via{" "}
        <code>ShaderNodeAttribute(attribute_type=GEOMETRY)</code>. This is the
        same attribute-on-geometry pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          Repeat Zone crystal cluster tutorial
        </Link>
        , the key difference being that Repeat Zone state spans one frame
        evaluation, while Simulation Zone state spans frames.
      </p>

      <h2>Pearson pattern map: one dial, eight regimes</h2>
      <p>
        In 1993, John Pearson mapped the entire (feed, kill) parameter space and
        named the qualitative pattern types. With feed=0.037 fixed, varying kill
        alone cycles through the most visually distinct regimes:
      </p>
      <ul>
        <li><strong>k=0.056</strong> — moving solitons (self-propelling spots)</li>
        <li><strong>k=0.060</strong> — coral / labyrinth (default; dense branching)</li>
        <li><strong>k=0.062</strong> — isolated spots (circular Turing blobs)</li>
        <li><strong>k=0.065</strong> — disappearing spots (spots nucleate then die)</li>
      </ul>
      <p>
        These can be explored live in the modifier panel, though each change
        requires a cache clear and replay from frame&nbsp;1.
      </p>

      <h2>WebXR export path</h2>
      <p>
        The GLB snapshot at frame&nbsp;180 carries conc_u and conc_v as custom
        accessors (<code>export_attributes=True</code>), readable in Three.js as
        per-vertex <code>BufferAttribute</code>s for a custom shader. For
        standard PBR, bake the conc_v vertex colour to a 2048&times;2048 texture
        via Cycles first — the workflow is detailed in the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking tutorial
        </Link>
        . The baked texture then drives a <code>KHR_materials_unlit</code> GLB
        that renders identically across all WebXR runtimes.
      </p>

      <h2>Failure modes</h2>
      <p>
        <strong>Pattern does not change between frames.</strong> Cache not written.
        Delete it (X on the modifier) and play from frame&nbsp;1. Do not scrub
        backwards — the zone reads only cached data past frame&nbsp;0.
      </p>
      <p>
        <strong>Uniform result, no pattern.</strong> Kill &gt; 0.07 removes V
        faster than UV&sup2; produces it; V collapses to zero. Reduce kill to
        0.056–0.065.
      </p>
      <p>
        <strong>Pattern explodes on frame&nbsp;2.</strong>{" "}
        Du&nbsp;&times;&nbsp;2&nbsp;&gt;&nbsp;1 — stability violated. Reduce Du
        below 0.45 and clear the cache.
      </p>
      <p>
        <strong><code>NamedAttribute &quot;conc_u&quot;</code> returns 0.</strong>{" "}
        Name string mismatch — verify all four nodes share exactly
        &lsquo;conc_u&rsquo; / &lsquo;conc_v&rsquo; (case-sensitive, no trailing
        spaces), data_type=FLOAT, domain=POINT.
      </p>

      <h2>Outside sources</h2>
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
          · CC-BY-SA 4.0 · Blender Documentation Team. The definitive reference
          for zone evaluation order, cache mechanics, and the skip-input behaviour
          used for initialisation.
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
          · MIT · Patrick Mineault. An interactive JavaScript Grey-Scott
          simulator with the same Pearson parameter map — useful for previewing
          (feed, kill) pairs before committing to a 180-frame Blender bake.
          Sister project:{" "}
          <a
            href="https://github.com/pmneila/PyMaxflow"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            pmneila/PyMaxflow
          </a>{" "}
          (MIT) — graph-cut optimisation by the same author.
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
          · Apache-2.0 · Khronos Group. The exporter that writes{" "}
          <code>export_attributes=True</code> custom accessors to the GLB — and
          therefore which attributes survive the export pipeline into Three.js.
          See also the sibling project{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Models
          </a>{" "}
          for reference GLBs demonstrating the custom-attribute accessor format.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-simulation-zone-reaction-diffusion-turing",
    time: "one session",
    difficulty: "advanced",
    goal:
      "Implement the Grey-Scott reaction-diffusion PDE in a Blender 5.1 Geometry Nodes Simulation Zone, using BlurAttribute as a discrete Laplacian, tune the kill parameter through Pearson's pattern regimes, and export a GLB with conc_v as a custom attribute accessor for WebXR.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Comfortable with Geometry Nodes: NamedAttribute, StoreNamedAttribute, Math nodes",
      "Understand what a Simulation Zone is (see gn-simulation-zone-wave-reveal tutorial)",
      "Know how BlurAttribute works as a diffusion operator (see blur-attribute-heat-diffusion)",
    ],
    steps: [
      {
        title: "Create the grid and GN modifier",
        body: "Add a Grid mesh (x_subdivisions=63, y_subdivisions=63, size=2.0 m). Add a Geometry Nodes modifier 'GN_GreyScott'. Add Float Group Inputs: Du=0.20, Dv=0.10, Feed=0.037, Kill=0.060, Seed_Radius=0.22.",
      },
      {
        title: "Seed initial conditions (pre-zone)",
        body: "Before the Simulation Zone: StoreNamedAttribute('conc_u', POINT, value=1.0). Then InputPosition → VectorMath(LENGTH) → Compare(LESS_THAN, B=Seed_Radius) → Math(MULTIPLY, 0.5) → StoreNamedAttribute('conc_v'). Wire into sim_in.Geometry.",
      },
      {
        title: "Add and wire the Simulation Zone",
        body: "Add GeometryNodeSimulationInput and GeometryNodeSimulationOutput (they auto-pair). The Geometry flows: sim_in.Geometry → StoreNamedAttribute(new_u) → StoreNamedAttribute(new_v) → sim_out.Geometry.",
      },
      {
        title: "Blur for Laplacian, compute Grey-Scott update",
        body: "Inside the zone: NamedAttribute('conc_u') → BlurAttribute(iterations=1) → subtract original → lap_u. Same for lap_v. UV² = named_u × named_v². dU = Du×lap_u − UV² + Feed×(1−u). dV = Dv×lap_v + UV² − (Feed+Kill)×v. new_u = Clamp(u + dU, 0, 1); new_v = Clamp(v + dV, 0, 1). Wire to the two StoreNamedAttribute Value inputs.",
      },
      {
        title: "Attach material and play",
        body: "Material: ShaderNodeAttribute(attribute_type=GEOMETRY, attribute_name='conc_v') → ColorRamp (teal→coral) → Principled BSDF. Play from frame 1 — pattern branches by frame 80, stabilises by frame 180.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Mesh stays uniform teal — no pattern emerges",
        cause: "Simulation Zone cache not written, or kill is too high (V collapses to zero)",
        fix: "Clear the modifier cache (X button) and play from frame 1. If still uniform, reduce Kill toward 0.060 and confirm the seed StoreNamedAttribute('conc_v') is wired before sim_in, not after.",
      },
      {
        symptom: "Pattern explodes to solid bright V on frame 2",
        cause: "Du × 2 > 1 — explicit Euler stability violated",
        fix: "Reduce Du below 0.45 (criterion: Du × 2 × DT ≤ 1 with DT=1). Clear cache, replay.",
      },
      {
        symptom: "GLB exports but conc_v missing in Three.js",
        cause: "export_attributes=False or export_apply=False",
        fix: "Both flags are required: export_apply bakes the GN modifier; export_attributes writes custom accessors. Without apply the modifier output never enters the GLB geometry.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
    title:
      "GN Simulation Zone — Grey-Scott Reaction-Diffusion: Turing Pattern Emergence",
    date: "2026-06-09",
    kind: "tutorial",
    excerpt:
      "Implement the Grey-Scott PDE reaction-diffusion system in a Blender 5.1 Geometry Nodes Simulation Zone: BlurAttribute as discrete Laplacian, UV² autocatalytic coupling, and a single kill-parameter dial that cycles through Pearson's coral, spot, and soliton pattern regimes.",
    Body: GnSimulationZoneReactionDiffusionTuringBody,
  },
);

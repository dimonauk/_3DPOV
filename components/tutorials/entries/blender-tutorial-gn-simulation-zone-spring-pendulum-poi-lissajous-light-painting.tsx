import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A poi head on a tether is a spring-pendulum: the hand (pivot end) moves
        in its own orbit and the poi head trails behind, connected by a cord that
        has a natural length L₀ and behaves elastically when stretched or
        compressed. The poi head is not free — it is <em>coupled</em> to the
        hand&apos;s motion — so the trajectory it traces is not a simple circle
        but a Lissajous curve whose shape depends on the ratio between the
        hand&apos;s orbital frequency ω<sub>h</sub> and the tether&apos;s own
        natural frequency ω₀ = √(k/m). This tutorial implements that physics
        inside a Blender 5.1 Geometry Nodes <strong>Simulation Zone</strong> and
        outputs the resulting trace as a multi-strand ribbon GLB for WebXR.
      </p>
      <p>
        The connection to poi practice is direct: what spinners call the{" "}
        <em>butterfly</em> (two-beat lissajous), the <em>isolation</em>{" "}
        (one-to-one locked circle), and the <em>inspin petal</em> (inner
        hypotrochoid) all correspond to integer ratios ω<sub>h</sub> : ω₀ = 1:2,
        1:1, 2:1 respectively. The simulation makes those ratios tunable from a
        single parameter.
      </p>

      <h2>Why semi-implicit Euler and not explicit?</h2>
      <p>
        The explicit (forward) Euler update reads:
      </p>
      <pre>{`v_{n+1} = v_n + F(r_n, v_n)/m · Δt   ← force from OLD state
r_{n+1} = r_n + v_n · Δt              ← position from OLD velocity`}</pre>
      <p>
        It injects a small amount of energy into the system every step. For a
        stiff spring (large k) this causes exponential blowup within a few dozen
        frames at 24 fps. The semi-implicit (symplectic) variant computes the new
        velocity first, then uses <em>that</em> velocity to advance the position:
      </p>
      <pre>{`v_{n+1} = v_n + F(r_n, v_n)/m · Δt   ← kick
r_{n+1} = r_n + v_{n+1} · Δt          ← drift with NEW v`}</pre>
      <p>
        Symplectic Euler conserves a modified energy (the symplectic area of
        phase space is preserved), so it remains bounded indefinitely. The same
        reasoning drives the integrator choice in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-coupled-pendulums-mathieu-resonance"
          className={lk}
        >
          Coupled Pendulums tutorial
        </Link>
        .
      </p>

      <h2>The Lissajous connection</h2>
      <p>
        When drag is small and the hand orbit is perfectly circular, the poi
        head&apos;s trajectory can be described analytically as a{" "}
        <em>harmonograph</em> — a sum of two sinusoids in perpendicular axes with
        different amplitudes and phases. The shape closes after exactly{" "}
        ω<sub>h</sub>/gcd(ω<sub>h</sub>, ω₀) hand orbits. With{" "}
        ω<sub>h</sub> = 7 rad/s and ω₀ ≈ 42 rad/s (k = 90 N/m, m = 0.05 kg),
        the ratio is 7:42 = 1:6, so each strand traces a six-petalled rhodonea
        before closing. Increasing k raises ω₀ and changes the petal count
        without touching the hand speed.
      </p>
      <p>
        Compare this with the accumulation logic in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr"
          className={lk}
        >
          Points to Curves poi-trail tutorial
        </Link>
        : that tutorial used a static analytical orbit (perfect circle) and
        grouped points by a strand ID attribute. This tutorial produces the orbit
        dynamically — the Simulation Zone accumulates positions that would be
        impossible to express as a closed-form GN field.
      </p>

      <h2>GN node graph layout</h2>
      <p>
        The simulation zone contains six logical sub-networks wired in sequence:
      </p>
      <ol>
        <li>
          <strong>State read:</strong> <code>Position</code> node gives r_prev.{" "}
          <code>Named Attribute</code> (<code>vel</code>, type Vector) gives
          v_prev.
        </li>
        <li>
          <strong>Hand position:</strong>{" "}
          <code>Scene Time → Math(Multiply, ω_h) → Combine XYZ</code> with cosine
          and sine branches. The per-strand phase offset is stored as a second
          named attribute <code>phase</code> set before the sim zone runs.
        </li>
        <li>
          <strong>Spring force:</strong> VectorMath Subtract (r_prev − r_hand) →
          VectorMath Length → Math Subtract L₀ (= stretch) → VectorMath Normalize
          (= d̂) → VectorMath Scale(−k · stretch). This is F_spring = −k·(|d|−L₀)·d̂.
        </li>
        <li>
          <strong>Drag force:</strong> VectorMath Scale(v_prev, −c) → F_drag.
        </li>
        <li>
          <strong>Kick:</strong> VectorMath Add(F_spring, F_drag) → VectorMath
          Scale(1/m·Δt) → VectorMath Add(v_prev) = v_new. Store Named Attribute
          (<code>vel</code>, v_new).
        </li>
        <li>
          <strong>Drift:</strong> VectorMath Scale(v_new, Δt) → VectorMath
          Add(r_prev) = r_new. Set Position(r_new).
        </li>
      </ol>
      <p>
        After the sim zone output, a <code>Points to Curves</code> node (group ID
        = the <code>strand_id</code> INT attribute) builds one spline per strand.
        Curve to Mesh with a six-sided circle profile converts each spline to a
        faceted tube. Set Material Index routes colour by strand. The same
        pattern is described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics"
          className={lk}
        >
          Verlet Rope tutorial
        </Link>
        , which uses a distance-constraint solver rather than a spring force —
        compare the two to understand when to use each.
      </p>

      <h2>Bench steps (Blender 5.1)</h2>
      <ol>
        <li>
          <strong>Source geometry:</strong> Add → Mesh → Single Vertex. This
          becomes N vertices after <code>Duplicate Elements</code> inside the GN
          tree. Alternatively, run <code>blueprint.py</code> which builds
          everything from Python.
        </li>
        <li>
          <strong>Initialise state attributes</strong> before the sim zone:{" "}
          <code>Store Named Attribute</code> (<code>vel</code>, Vector, zero) and{" "}
          <code>Store Named Attribute</code> (<code>phase</code>, Float,
          2π·Index/N).
        </li>
        <li>
          <strong>Add Simulation Zone</strong> (Add → Simulation → Simulation
          Zone). Wire the geometry through both the Input and Output nodes.
        </li>
        <li>
          Wire the six sub-networks described above inside the zone.
        </li>
        <li>
          <strong>Trail accumulation:</strong> Add <code>Join Geometry</code>{" "}
          outside the sim zone, one input from the sim output (current frame
          positions) and one from a <code>Group Input</code> passthrough of the
          accumulated history. Feed the accumulation back through the sim zone
          Geometry socket on the next frame.
        </li>
        <li>
          <strong>Bake:</strong> Properties → Object → Geometry Nodes → Bake.
          Bake all 180 frames before converting trails to curves.
        </li>
        <li>
          <strong>Curves → Mesh → GLB:</strong> Points to Curves → Curve to
          Mesh (profile = Curve Circle, 6 sides) → export via File → Export →
          glTF 2.0 with Draco level 6 and WebP textures, root name{" "}
          <code>hf_poi_lissajous</code>.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Poi head flies to infinity at frame 1:</strong> The{" "}
          <code>vel</code> named attribute was not initialised to zero before the
          sim zone. Store zero explicitly; do not rely on the default-value field
          of Named Attribute.
        </li>
        <li>
          <strong>All strands trace the same path:</strong> The{" "}
          <code>phase</code> attribute was not wired into the hand-orbit cosine/sine
          arguments. Phase offset must be added to the Scene Time angle before the
          trig nodes.
        </li>
        <li>
          <strong>Spiral collapses to a point:</strong> Drag c is too high
          relative to k. With k = 90 and m = 0.05, set c ≤ 2.0. At c = 0.8 the
          trace fills out before decaying.
        </li>
        <li>
          <strong>Trace does not close / petal count is wrong:</strong> ω_h must
          be an integer multiple or sub-multiple of ω₀. Adjust k until
          ω₀ = √(k/m) is close to the desired integer ratio.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Manual — Geometry Nodes Simulation Zone. CC-BY-SA-4.0 Blender
          Foundation.{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            docs.blender.org
          </a>
          . Related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            projects.blender.org/blender/blender
          </a>
          .
        </li>
        <li>
          OpenStax University Physics Vol. 1, Ch. 15 — Oscillations. CC BY 4.0
          Rice University.{" "}
          <a
            href="https://openstax.org/books/university-physics-volume-1/pages/15-introduction"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            openstax.org
          </a>
          . Related:{" "}
          <a
            href="https://github.com/openstax"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/openstax
          </a>
          .
        </li>
        <li>
          glTF 2.0 Specification. MIT. Khronos Group.{" "}
          <a
            href="https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/README.md"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/KhronosGroup/glTF
          </a>
          . Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Blender-IO
          </a>
          .
        </li>
      </ul>

    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting",
  title:
    "GN Simulation Zone — Spring-Pendulum Poi Tether: Elastic Orbit, Air Drag & Lissajous Light-Painting Path (Blender 5.1)",
  description:
    "Implement a spring-pendulum poi physics model inside a Blender 5.1 Geometry Nodes Simulation Zone. Semi-implicit Euler integration, drag coefficient, hand-orbit coupling, and Lissajous trace export as a WebXR ribbon GLB.",
  date: "2026-07-23",
  tags: ["blender", "geometry-nodes", "simulation", "poi", "physics", "webxr", "lissajous"],
  body: Body,
});

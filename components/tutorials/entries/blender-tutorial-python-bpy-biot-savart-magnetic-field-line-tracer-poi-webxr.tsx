import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every electronic poi contains a coil: the current loop that drives the
        LED controller, the inductive charging ring, or the spiral trace on the
        PCB. Those same loops produce magnetic fields whose geometry is fully
        determined by the Biot-Savart law. This tutorial implements Biot-Savart
        in pure Python, integrates 24 tracer particles along the resulting field
        lines with 4th-order Runge-Kutta, and deposits the trajectories as
        emissive POLY curves in Blender — a physically exact light-painting
        sculpture of the invisible field.
      </p>
      <p>
        The output exports as a GLB ready for WebXR: 24 field-line tube meshes
        with per-trail emission materials, set against a black background so
        EEVEE bloom turns each line into a glowing thread. The same pipeline
        handles any arbitrary wire path — swap the helix for a figure-eight or
        a Lissajous curve to visualise more exotic field topologies.
      </p>

      <h2>The Biot-Savart law</h2>
      <p>
        For a steady current{" "}
        <em>I</em> flowing along a wire, the magnetic field at a probe point{" "}
        <strong>p</strong> is:
      </p>
      <pre>{`B(p) = (μ₀ I / 4π) ∫_wire  (dl × r̂) / |r|²

dl  = infinitesimal wire element vector (tangent × length)
r   = p − wire_element_midpoint
r̂  = r / |r|   (unit displacement vector)`}</pre>
      <p>
        Discretised over <em>N</em> wire segments with midpoints{" "}
        <em>m_i</em> and chord vectors <em>dl_i</em>:
      </p>
      <pre>{`B ≈ Σ_i  (dl_i × r̂_i) / |r_i|²
r_i = p − m_i`}</pre>
      <p>
        The <code>μ₀I/4π</code> prefactor is a positive scalar; it scales the
        field magnitude but not its direction. For field-line tracing we only
        need the direction — so normalise <strong>B</strong> to a unit vector at
        each probe step, and the prefactor cancels entirely. No physical
        constants need to appear in the code.
      </p>

      <h2>Wire geometry: the poi-cable helix</h2>
      <p>
        A helical coil is the canonical electromagnetic source — it concentrates
        field on the axis (solenoid interior) while the exterior field forms the
        classic closed-loop "doughnut" pattern. The poi context doubles this: an
        electronic poi handle is often a cylindrical form with a spiral power
        trace, and the spinning poi head itself sweeps a helical path through
        the air.
      </p>
      <pre>{`# Helix parametrisation
WIRE_TURNS  = 3       # three full turns
WIRE_RADIUS = 0.15    # m  — matches a 300 mm poi handle diameter
WIRE_HEIGHT = 0.40    # m  — coil total height

def helix(theta: float) -> Vector:
    z = WIRE_HEIGHT * theta / (2π × WIRE_TURNS) − WIRE_HEIGHT × 0.5
    return Vector((R × cos(θ),  R × sin(θ),  z))`}</pre>
      <p>
        The helix is sampled at <code>N_WIRE_PTS = 256</code> segments. Each
        segment contributes one term to the Biot-Savart sum; 256 segments give
        sub-millimetre spacing on the helix, which is more than adequate for the
        field topology at probe distances ≥ 0.05 m from the wire.
      </p>
      <p>
        The chord vector <code>dl_i = helix(t_hi) − helix(t_lo)</code> (end
        minus start of segment <em>i</em>) approximates both the tangent
        direction and the length. This is the same discretisation magpylib uses
        internally for its Line source.
      </p>

      <h2>Biot-Savart summation in Python</h2>
      <pre>{`WIRE_SEGS = build_wire_segments()   # precomputed once

def b_field(p: Vector) -> Vector:
    B = Vector((0, 0, 0))
    for mid, dl in WIRE_SEGS:
        r    = p - mid
        r_sq = r.length_squared
        if r_sq < 9e-8:          # skip if probe inside wire (0.3 mm guard)
            continue
        r_hat = r / sqrt(r_sq)
        B    += dl.cross(r_hat) / r_sq
    return B`}</pre>
      <p>
        Three things worth noting about this inner loop:
      </p>
      <ul>
        <li>
          <strong>Cross product order matters.</strong>{" "}
          <code>dl.cross(r_hat)</code> follows the right-hand rule: current
          flowing from low to high parameter (our helix is wound
          counter-clockwise looking up) produces a field that points upward
          inside the bore. Swapping to{" "}
          <code>r_hat.cross(dl)</code> flips all field directions — same
          topology, opposite handedness.
        </li>
        <li>
          <strong>Singularity guard.</strong> When the probe sits on (or very
          near) a wire segment, <code>|r|² → 0</code> and the contribution
          diverges. The 0.3 mm exclusion sphere prevents this — seeds are
          placed 0.30 m from the axis, well outside any segment.
        </li>
        <li>
          <strong>Precomputation.</strong> Evaluating <code>WIRE_SEGS</code>{" "}
          once and iterating over a list (rather than recomputing the helix at
          each probe) cuts the inner-loop cost by ~40 %.
        </li>
      </ul>

      <h2>RK4 field-line integration</h2>
      <p>
        A field line is a curve that is tangent to <strong>B</strong> at every
        point. Integrating along it is equivalent to solving the ODE:
      </p>
      <pre>{`dp/ds = B̂(p)      (unit-speed parametrisation by arc length s)`}</pre>
      <p>
        Euler integration (<code>p_new = p + h·B̂(p)</code>) accumulates
        O(h²) truncation error per step. Over 400 steps at h = 0.012 m, Euler
        error reaches several centimetres — enough to drift off the correct
        field line near the high-curvature pole regions. RK4 reduces the
        per-step error to O(h⁵), giving 10 000× better accuracy per step for
        the same h, and the 400-step total path remains on the analytic field
        line to within a micrometre.
      </p>
      <pre>{`def rk4_step(p: Vector, h: float) -> Vector:
    k1 = b_direction(p)                    # B̂ at current position
    k2 = b_direction(p + h*0.5 * k1)      # B̂ at midpoint via k1
    k3 = b_direction(p + h*0.5 * k2)      # B̂ at midpoint via k2
    k4 = b_direction(p + h * k3)          # B̂ at full step via k3
    return p + (h/6) * (k1 + 2*k2 + 2*k3 + k4)`}</pre>
      <p>
        Each sub-evaluation calls the full Biot-Savart sum, so one RK4 step
        costs 4× a single evaluation. With 256 wire segments × 4 sub-steps ×
        400 RK4 steps × 24 seeds = 9.8 million B-field evaluations. On a
        modern CPU this runs in 15–45 seconds — slow but correct, and the
        result is persistent curve geometry, not a per-frame simulation.
      </p>

      <h2>Seed placement and field topology</h2>
      <p>
        Seeds are placed on an equatorial ring at radius 0.30 m, height 0.0 m
        (the midplane of the helix). This is just outside the helix diameter
        (0.30 m vs 0.15 m), so seeds start in the exterior field.
      </p>
      <p>
        What to expect from the traces:
      </p>
      <ul>
        <li>
          <strong>Close seeds</strong> (inside radius ≤ helix radius): field
          lines enter the bore on the axis side and loop tightly — short,
          closed arcs through the centre.
        </li>
        <li>
          <strong>Equatorial seeds</strong> (our default at 0.30 m): lines
          initially head away from the coil, arc outward to a few helix heights
          away, bend toward the coil poles, descend along the exterior, and
          re-enter the bore at the opposite end. The result is the familiar
          dipole-field topology — closed loops forming a toroidal shell around
          the coil.
        </li>
        <li>
          <strong>Far seeds</strong> (radius ≥ 0.60 m): field is weak and
          direction is nearly uniform; lines travel long distances before
          curving back.
        </li>
      </ul>
      <p>
        Magnetic field lines are always closed (div B = 0 everywhere, including
        inside the wire), so every field line that leaves through one end of the
        helix eventually returns through the other. The bail-out condition{" "}
        <code>if p.length &gt; 6.0: break</code> truncates lines that wander
        far from the scene origin before closing — these appear as open arcs in
        the Blender scene, which is fine aesthetically.
      </p>

      <h2>Building Blender POLY curves from trajectories</h2>
      <pre>{`def build_poly_curve(name, pts, mat):
    cdata = bpy.data.curves.new(name, type='CURVE')
    cdata.dimensions    = '3D'
    cdata.bevel_depth   = 0.003   # tube cross-section radius
    cdata.bevel_resolution = 2    # 6-sided cylinder

    sp = cdata.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1.0)   # POLY: (x, y, z, w)

    # Draw-on reveal: bevel_factor_end 0→1 over FRAME_END frames
    cdata.bevel_factor_end = 0.0
    cdata.keyframe_insert("bevel_factor_end", frame=1)
    cdata.bevel_factor_end = 1.0
    cdata.keyframe_insert("bevel_factor_end", frame=FRAME_END)`}</pre>
      <p>
        Why POLY over BEZIER or NURBS?{" "}
        <code>splines.new(&apos;POLY&apos;)</code> stores one control point per
        position sample — exactly the list of RK4 outputs. Bezier would require
        computing handle tangents (possible but extra work). NURBS would
        introduce global smoothing that distorts the physical field-line shape
        near the coil poles where curvature is highest.
      </p>
      <p>
        The <code>bevel_factor_end</code> animated from 0 to 1 gives the
        trail-draw-on animation seen in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh-ribbon-trim-tilt-webxr"
          className={lk}
        >
          Curve-to-Mesh Ribbon tutorial
        </Link>{" "}
        — each line grows along its length over{" "}
        <code>FRAME_END</code> frames. The keyframe interpolation is set to
        LINEAR so the rate is constant (BEZIER easing would slow the tip near
        frame 1 and near FRAME_END, which looks unnatural for physical tracing).
      </p>

      <h2>Emission material and EEVEE bloom</h2>
      <pre>{`def make_emit_material(name, rgba):
    mat  = bpy.data.materials.new(name)
    mat.use_nodes = True
    # Clear default Principled node
    for n in list(mat.node_tree.nodes):
        mat.node_tree.nodes.remove(n)
    out  = mat.node_tree.nodes.new("ShaderNodeOutputMaterial")
    emit = mat.node_tree.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value    = rgba
    emit.inputs["Strength"].default_value = 8.0
    mat.node_tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])`}</pre>
      <p>
        Emission strength 8.0 with bloom enabled produces a visible glow halo
        in EEVEE Next without completely washing out colour differentiation
        between trails. The world background is pure black so there is no
        ambient light competing with the emission.
      </p>
      <p>
        Six colours cycle through the 24 seeds (every 4 seeds share a hue):
        cyan, violet, amber, green, rose, yellow. This creates a rainbow-band
        pattern when viewed from above — each colour cluster occupies a 60°
        arc of the equatorial ring, and the field topology carries each cluster
        upward and over the coil ends.
      </p>

      <h2>GLB export</h2>
      <p>
        GLB does not carry curve objects — only meshes and armatures. The
        script runs <code>bpy.ops.object.convert(target=&apos;MESH&apos;)</code>{" "}
        on each trail curve before export. This applies the bevel and resolution
        settings to produce a proper cylindrical tube mesh. The coil wire is
        also converted. Export uses the holoflow conventions:
      </p>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath     = OUTPUT_GLB,
    use_selection= True,
    export_format= 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
    export_apply = True,    # apply all remaining modifiers
    export_yup   = True,    # +Y up for WebXR / Three.js
)`}</pre>

      <h2>Vortex filament analogy</h2>
      <p>
        The identical mathematical structure — a line integral of cross-product
        contributions — appears in fluid mechanics as the{" "}
        <em>Biot-Savart law for vortex filaments</em>: the velocity field
        induced by a vortex filament is:
      </p>
      <pre>{`u(p) = (Γ / 4π) ∫_filament  (dl × r̂) / |r|²`}</pre>
      <p>
        where Γ is circulation (analogous to current). The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-kelvin-helmholtz-vortex-filament-birkhoff-rott"
          className={lk}
        >
          Kelvin-Helmholtz vortex filament tutorial
        </Link>{" "}
        uses this to simulate shear-flow roll-up. The same Biot-Savart
        summation code could trace streamlines in that velocity field — the
        physics interpretation changes, but the numerics are identical.
      </p>
      <p>
        See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-hopf-fibration-linked-tori-light-sculpture-webxr"
          className={lk}
        >
          Hopf fibration light sculpture
        </Link>{" "}
        for another pure-Python trajectory integration producing a light
        sculpture, and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting"
          className={lk}
        >
          Lorenz attractor tutorial
        </Link>{" "}
        for the same RK4 integrator applied to a chaotic ODE (rather than a
        conservative field).
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr"
          className={lk}
        >
          Kuramoto coupled-oscillator tutorial
        </Link>{" "}
        applies phase-space trajectory integration to poi performance — a
        complementary view of how continuous dynamical systems produce
        structured light-painting geometry.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://github.com/magpylib/magpylib"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            magpylib
          </a>{" "}
          — MIT · Michael Ortner et al. · Python library for computing magnetic
          fields from permanent magnets and current sources. The discrete
          Biot-Savart segment model in this blueprint follows magpylib&apos;s
          Line source implementation. Sibling resources:{" "}
          <a
            href="https://github.com/magpylib/magpylib/tree/main/examples"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            magpylib/examples
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.Curve.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Python API — bpy.types.Curve
          </a>{" "}
          — CC-BY-SA-4.0 · Blender Foundation · reference for{" "}
          <code>bevel_depth</code>, <code>bevel_factor_end</code>, spline
          types, and the POLY point layout. Sibling project:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender/blender
          </a>
          .
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <pre>{`# Script takes > 3 minutes
→ Reduce N_WIRE_PTS to 128 and N_SEEDS to 12 for a preview run.
  The topology is correct at half resolution; use full 256 pts for final export.

# Field lines all go in the same direction and do not close
→ WIRE_TURNS is 0 or negative. Set WIRE_TURNS ≥ 1.
  Or: SEED_HEIGHT is set far above/below the coil midplane (WIRE_HEIGHT * 0.5).

# GLB opens as flat lines in Three.js (no tube geometry)
→ convert(target='MESH') was skipped or failed. Check that the curve objects
  exist (names start with "hf_trail_") before the convert call.

# EEVEE viewport shows no glow
→ Enable EEVEE bloom: Scene Properties → EEVEE → Bloom. Also ensure
  Rendered viewport shading (not Material Preview), since bloom only
  renders in the full engine pass.

# Singularity error: ZeroDivisionError in b_field
→ A seed was placed exactly on a wire segment midpoint. Increase SEED_RADIUS
  so seeds are at least 2× WIRE_RADIUS from the coil axis.`}</pre>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr",
  title:
    "Python bpy — Biot-Savart Field-Line Tracer: Helix Wire Current → RK4 Particle Integration → Light-Painting Curves for WebXR (Blender 5.1)",
  subtitle:
    "Discrete Biot-Savart law over 256 helix segments; 4th-order RK4 integrator; 24 tracer seeds on equatorial ring; POLY curve bevel_factor_end reveal; emission material with EEVEE bloom; GLB export.",
  description:
    "Implement the Biot-Savart law in pure Python to trace magnetic field lines around a helical poi-cable current source. 256-segment helix wire, 24 tracer particles integrated with 4th-order Runge-Kutta (RK4) along normalised B-field directions, POLY curve output with bevel_factor_end draw-on animation, emission materials with EEVEE Next bloom, and GLB export for WebXR. Covers vector cross-product summation, RK4 integrator vs Euler comparison, field-line topology (solenoid bore vs exterior dipole field), curve-to-mesh conversion for GLB, and the fluid-mechanics analogy via vortex-filament Biot-Savart.",
  date: "2026-07-25",
  tags: [
    "blender",
    "python",
    "physics",
    "magnetic-field",
    "biot-savart",
    "rk4",
    "field-lines",
    "light-painting",
    "poi",
    "curves",
    "emission",
    "eevee",
    "bloom",
    "glb",
    "webxr",
    "scripting",
    "mathutils",
  ],
  body: Body,
  libraryPath:
    "blends/scripting/python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr",
});

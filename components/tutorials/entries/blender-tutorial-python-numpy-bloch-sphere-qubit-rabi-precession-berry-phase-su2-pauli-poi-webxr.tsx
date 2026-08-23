import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-bloch-sphere-qubit-rabi-precession-berry-phase-su2-pauli-poi-webxr";

const TITLE =
  "Python numpy — Bloch Sphere: Qubit Pure-State S² Geometry, Pauli su(2) Generators, Rabi Precession (Bloch 1946), Berry Phase γ=−Ω/2, SU(2)→SO(3) Spinor Double-Cover & Cobalt Trajectory Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Bloch sphere is the complete geometric description of a quantum two-level system: every pure qubit state is a point on S², the unit sphere, and every unitary evolution is a rotation of that sphere. Felix Bloch introduced it in 1946 for nuclear magnetic resonance; Richard Feynman, Frank Vernon, and Robert Hellwarth generalised it in 1957 to any two-level system, and Michael Berry used its curvature to derive the geometric phase in 1984. This blueprint distils three landmark results into three closed curves on S² — a Rabi great circle, a Berry phase latitude loop, and a spinor double-cover figure-eight — rendered as a POLY bevel tube with shape keys, exported as a single GLB poi head for WebXR.";

function Body() {
  return (
    <>
      <p>
        Most textbook pictures of the Bloch sphere show a static sphere with
        labelled poles and a single state vector. What the picture omits is
        the <em>dynamics</em>: quantum evolution is rotation of the sphere, and
        the geometry of that rotation carries physical information that
        Schrödinger&apos;s equation alone does not make obvious. The three
        curves in this blueprint each encode a different piece of that
        geometry.
      </p>

      <h2>The Bloch sphere: CP¹ ≅ S²</h2>
      <p>
        A qubit&apos;s Hilbert space is ℂ². The global phase e<sup>iφ</sup> is
        unobservable, so the physical state space is the complex projective
        line CP¹ = S³/S¹ — and CP¹ is homeomorphic to S². The Bloch
        parametrisation makes this concrete:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}·sin(θ/2)|1⟩

Bloch vector:  r = (⟨σ_x⟩, ⟨σ_y⟩, ⟨σ_z⟩)
             = (sin θ cos φ, sin θ sin φ, cos θ)

North pole  (θ=0):    r = (0,0,+1)  ↔  |0⟩  (ground state)
South pole  (θ=π):    r = (0,0,−1)  ↔  |1⟩  (excited state)
Equator     (θ=π/2):  r = (cos φ, sin φ, 0)  ↔  superpositions`}
      </pre>
      <p>
        The factor cos(θ/2) / sin(θ/2) — a half-angle — is the first sign of
        spinor geometry: a rotation of the Bloch vector by 2π (a full turn)
        corresponds to a rotation of the Hilbert-space vector by <em>only</em>{" "}
        π, multiplying |ψ⟩ by −1.
      </p>

      <h2>Pauli matrices and su(2)</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`σ_x = [[0,1],[1,0]]   σ_y = [[0,−i],[i,0]]   σ_z = [[1,0],[0,−1]]

Commutation:  [σ_x, σ_y] = 2i σ_z  (cyclic)  →  su(2) ≅ so(3)

Rotation by angle θ about axis n̂:
  U(θ,n̂) = exp(−i θ/2 · n̂·σ)
           = cos(θ/2)·I − i sin(θ/2)·(n̂·σ)

  ↪ θ=2π: U = −I  (−1 phase, not identity!)
  ↪ θ=4π: U = +I  (identity — 4π periodicity)`}
      </pre>
      <p>
        The map from SU(2) (2×2 unitaries with det=+1) to SO(3) (3×3 rotations)
        is 2-to-1: both U and −U produce the same Bloch-vector rotation. This
        double cover is the content of the{" "}
        <strong>SK_DoubleLoop</strong> shape key.
      </p>

      <h2>Basis: Rabi precession (great circle)</h2>
      <p>
        Under the on-resonance Hamiltonian H = Ω/2 · σ<sub>x</sub>, the Bloch
        equation is ṙ = ω × r with ω = (Ω, 0, 0). Starting from |0⟩ = (0,0,1):
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`r(t) = (0, −sin(Ωt), cos(Ωt))

  t = 0    : (0,  0,  1)  =  |0⟩  north pole
  t = π/Ω  : (0,  0, −1)  =  |1⟩  south pole  (π pulse — complete inversion)
  t = 2π/Ω : (0,  0,  1)  =  |0⟩  back to start

P(|1⟩) = sin²(Ωt/2)  — the Rabi formula, first derived in 1937`}
      </pre>
      <p>
        The blueprint traces one complete Rabi cycle (t ∈ [0, 2π/Ω]) as a
        great circle in the y-z plane with 360 points (1° per sample).
        The bevel depth is 0.006 m on a 0.100 m sphere — thin enough not to
        obscure the poles, thick enough to read in WebXR.
      </p>

      <h2>SK_Berry: Berry geometric phase loop</h2>
      <p>
        In 1984 Michael Berry showed that when the Hamiltonian is cycled
        adiabatically around a closed loop C on the parameter space, the
        state picks up a geometric phase that depends only on the loop, not
        on the rate of traversal:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`γ_n(C) = i ∮_C ⟨n(R)|∇_R|n(R)⟩ · dR   (Berry connection integral)

For a qubit with n̂(θ,φ) pointing at colatitude θ₀:
  Loop C = latitude circle at colatitude θ₀
  Solid angle Ω_c = 2π(1 − cos θ₀)
  Berry phase  γ = −Ω_c / 2  = −π(1 − cos θ₀)

Blueprint choice: θ₀ = π/3 (60°)
  Ω_c = 2π(1 − 0.5) = π  →  γ = −π/2

Physically: two identical loops (total solid angle 2π) give γ = −π,
  which flips the qubit sign — detectable in an interferometer.`}
      </pre>
      <p>
        The latitude circle at 60° sits above the equator at height cos(60°) = 0.5.
        Its radius is sin(60°) ≈ 0.866 of the sphere radius, making it
        clearly distinguishable from both the equator and the pole — an
        intentional choice so the shape key morph from the Rabi great circle
        is visually unambiguous.
      </p>

      <h2>SK_DoubleLoop: spinor double cover</h2>
      <p>
        The third path has no single-trajectory physical interpretation: it is
        a <em>topological</em> demonstration. The Bloch sphere is SO(3) &apos;s
        orbit space, not SU(2)&apos;s. One full 2π rotation of n̂ (the
        Hamiltonian axis) traces a closed path in SO(3) — but the
        corresponding SU(2) element is −I, not I. The SU(2) path stays{" "}
        <em>open</em>: it only closes after a 4π rotation.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Arc 1 — y-z great circle:  r(t) = (0, −sin t, cos t),  t ∈ [0,π)
  Traces north pole → south pole

Arc 2 — x-z great circle:  r(α) = (sin α, 0, −cos α),  α ∈ [0,π)
  Traces south pole → north pole

Together they form ONE continuous closed loop on S²
— yet in Hilbert space this is a 2π rotation (half of 4π),
so the spinor state acquires phase −1 on return.

The knot: arcs 1 and 2 cross the south pole from different planes,
  meeting at (0,0,−1) — a "crossing" visible in the 3D viewport.`}
      </pre>
      <p>
        In WebXR a viewer can morph from the smooth great circle (Basis) to
        the two-arc figure-eight (SK_DoubleLoop), watching two separate loops
        appear from one — a spatial demonstration of why spinors require 4π.
      </p>

      <h2>POLY curve and shape keys in Blender 5.1</h2>
      <p>
        All three paths share <code>N_TRAJ = 360</code> control points.
        Shape keys on a curve object store{" "}
        <code>ShapeKeyCurvePoint.co</code>, a 3-vector, which differs from
        spline control points (<code>POLY</code> type uses 4-vectors with w=1
        for homogeneous coordinates). The blueprint separates these:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Write spline positions (4-vector, w=1)
flat = np.ones((N, 4))
flat[:, :3] = pts
spline.points.foreach_set("co", flat.ravel())

# Write shape-key positions (3-vector)
for i, p in enumerate(pts_alt):
    sk.data[i].co = p.tolist()   # list, not ndarray`}
      </pre>
      <p>
        <code>use_cyclic_u = True</code> on the spline closes the tube without
        an explicit duplicate endpoint — a single set of 360 unique points
        forms a seamless ring. The GLTF exporter in Blender 5.1 converts
        the bevel curve to a mesh and exports morph targets, preserving the
        shape-key animation in WebXR.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>IndexError in shape key loop</strong> — each path must have
          exactly <code>N_TRAJ</code> points. If you change{" "}
          <code>N_TRAJ</code>, re-run the full <code>build()</code> from a
          fresh scene; shape keys cannot be resized after creation.
        </li>
        <li>
          <strong>SK_DoubleLoop seam is visible</strong> — the two arcs meet at
          the south pole (0,0,−1) from different approach directions, producing
          a slight kink in the tube. This is geometrically correct — it reflects
          the topological fact that the double cover is not a smooth fiber.
          To soften it: increase <code>N_TRAJ</code> to 720.
        </li>
        <li>
          <strong>GLB: tube invisible in WebXR</strong> — the emission material
          requires the WebXR renderer to support the KHR_materials_emissive_strength
          extension. If the tube appears black, replace the emission node with a
          Principled BSDF (Emission Color = cobalt, Emission Strength = 1.0).
        </li>
        <li>
          <strong>record.py: camera not centred on tube</strong> — the orbit
          radius in record.py is computed from the initial camera location.
          If you move the camera manually, update{" "}
          <code>cam.location</code> in record.py to match.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
            className={lk}
          >
            Python numpy — Hopf Fibration: S³→S² Bundle & Linked-Circle Poi
          </Link>{" "}
          — the Bloch sphere is precisely CP¹ ≅ S², the base space of the Hopf
          fibration; a Bloch-sphere trajectory lifts to a path in S³ via the
          Hopf section, making the two constructions complementary
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-foucault-pendulum-berry-phase-hannay-angle-parallel-transport-poi-webxr"
            className={lk}
          >
            Python numpy — Foucault Pendulum: Berry Phase &amp; Hannay Angle
          </Link>{" "}
          — the Foucault pendulum&apos;s Hannay angle is the classical analogue
          of the Berry phase; both are holonomies of a connection on a principal
          bundle over the parameter sphere
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr"
            className={lk}
          >
            Python numpy — Torus Knot T(p,q): Braid Word &amp; Bishop-Frame Tube
          </Link>{" "}
          — like the Bloch sphere paths, torus knots are closed curves on
          surfaces; comparing POLY bevel-tube construction between a sphere
          trajectory and a torus-knot path reveals the role of curvature in
          determining tube twist
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-villarceau-circles-torus-hopf-fiber-interlocked-poi-head-webxr"
            className={lk}
          >
            Python numpy — Villarceau Circles: Torus Hopf-Fiber Interlocked Poi
          </Link>{" "}
          — Villarceau circles are the Hopf fibers at two latitudes of S²; their
          relationship to great circles parallels the Rabi ↔ Berry loop contrast
          in this blueprint
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-quaternion-julia-set-4d-hyperplane-sweep-de-height-field-webxr"
            className={lk}
          >
            Python numpy — Quaternion Julia Set: 4D Hyperplane Sweep
          </Link>{" "}
          — quaternion multiplication encodes SU(2) rotations; the same double-cover
          structure (q and −q represent the same rotation in SO(3)) that SK_DoubleLoop
          demonstrates geometrically underlies the quaternion Julia iteration
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Bloch, F. (1946){" "}
          <a
            href="https://doi.org/10.1103/PhysRev.70.460"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            &quot;Nuclear Induction&quot; — Physical Review 70:460–474
          </a>{" "}
          — original paper introducing the geometric representation of spin
          dynamics in an oscillating field; the equations for r(t) = (sin θ cos φ,
          sin θ sin φ, cos θ) used in this blueprint are mathematical content in
          the public domain. Related journal:{" "}
          <a
            href="https://journals.aps.org/pr/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Physical Review (APS)
          </a>
        </li>
        <li>
          Berry, M. V. (1984){" "}
          <a
            href="https://doi.org/10.1098/rspa.1984.0023"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            &quot;Quantal Phase Factors Accompanying Adiabatic Changes&quot;
            — Proc Roy Soc A 392:45–57
          </a>{" "}
          — the paper deriving the geometric phase γ = −Ω<sub>solid</sub>/2
          from the connection on the parameter space; the formula used for
          SK_Berry is taken directly from this work (mathematical content PD).
          Related:{" "}
          <a
            href="https://royalsocietypublishing.org/journal/rspa"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Proceedings of the Royal Society A
          </a>
        </li>
        <li>
          QuTiP Community (2024){" "}
          <a
            href="https://github.com/qutip/qutip"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            QuTiP: Quantum Toolbox in Python (BSD-3-Clause)
          </a>{" "}
          — open-source Python library for quantum optics and quantum
          information; includes{" "}
          <code>qutip.Bloch()</code> for Bloch-sphere visualisation and
          verified Rabi/Berry calculation routines. Related:{" "}
          <a
            href="https://github.com/qutip/qutip-tutorials"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            qutip/qutip-tutorials
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-23",
  topics: ["blender", "python", "scripting", "mathematics", "physics", "webxr", "poi"],
  body: Body,
  library: {
    type: "blend + glb",
    topic: "scripting",
    path: `blends/scripting/${SLUG}/`,
    blenderVersion: "5.1",
  },
});

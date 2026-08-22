import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-joukowski-conformal-map-aerofoil-complex-potential-flow-poi-webxr";

const TITLE =
  "Python numpy — Joukowski Conformal Map: Aerofoil Transform, Complex " +
  "Potential Flow & Kutta-Joukowski Lift for WebXR (Blender 5.1)";

const LEDE =
  "Nikolai Joukowski's 1910 conformal transform w = z + a²/z carries " +
  "circles to wing profiles: when the circle passes through z = a (a " +
  "branch point of the inverse), the mapped edge closes into a cusp — " +
  "the Kutta condition that pins the rear stagnation point and generates " +
  "measurable lift. The blueprint computes the circulation Γ = 4π U R " +
  "sin(α + β) that satisfies Kutta, traces 18 streamlines by RK4 " +
  "integration in the z-plane and maps them to the w-plane, extrudes " +
  "the aerofoil profile into a finite-span wing mesh, and exports a " +
  "Draco-6 WebP GLB of the glowing gold wing with cyan streamline " +
  "tubes for WebXR.";

function Body() {
  return (
    <>
      <p>
        A <em>conformal map</em> preserves angles locally; its key virtue for
        fluid mechanics is that it carries one irrotational, incompressible flow
        to another. The simplest non-trivial example after the identity is the
        Joukowski transform:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`w = z + a² / z          a ∈ ℝ⁺, z ∈ ℂ \\ {0}

dw/dz = 1 − a² / z²    (zero at z = ±a — Joukowski points)`}
      </pre>
      <p>
        The transform is 2-to-1: both{" "}
        <em>z</em> and <em>a²/z</em> map to the same <em>w</em>. Inside the
        unit circle |z| &lt; a the map reverses orientation; outside it is
        conformal. A circle centred at <em>(cx, cy)</em> passing through{" "}
        <em>z = a</em> maps to a closed curve with a cusp at{" "}
        <em>w = 2a</em> — the trailing edge of the aerofoil. Without the cusp
        the flow would race around the corner at infinite speed: viscosity
        cannot sustain that, so it fixes the rear stagnation at the cusp
        instead.
      </p>

      <h2>Kutta condition and circulation</h2>
      <p>
        The complex potential for uniform flow past a circle of radius{" "}
        <em>R</em> centred at <em>z_c = cx + i·cy</em> is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ζ = z − z_c
F(ζ) = U e^{−iα} ζ + U e^{iα} R²/ζ + (Γ/2πi) ln(ζ/R)

velocity  dF/dz = U e^{−iα} − U e^{iα} R²/ζ² + Γ/(2πi ζ)`}
      </pre>
      <p>
        The third term is a point vortex at the circle centre, strength Γ.
        Without it the flow has two stagnation points neither of which aligns
        with <em>z = a</em>. Setting the stagnation at <em>z = a</em>{" "}
        (Kutta condition) gives:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`β  = ∠(z_c → a)     (angle from centre to forward Joukowski point)
Γ  = 4π U R sin(α + β)

Lift per unit span:  L = ρ U Γ    (Kutta-Joukowski theorem)`}
      </pre>
      <p>
        For the default parameters (α = 8°, cx = −0.12, cy = 0.08, a = 1.0,
        R ≈ 1.143) the script prints Γ ≈ 2.53 and L/span ≈ 2.53 ρ in
        normalised units.
      </p>

      <h2>RK4 streamlines in the z-plane</h2>
      <p>
        Computing streamlines directly in the w-plane would require inverting
        the Joukowski map — a non-trivial task near the branch points. Instead
        the blueprint works entirely in the z-plane:
      </p>
      <ul className="list-disc pl-5">
        <li>
          Seed 18 points upstream at <em>x = −2.8</em> on a vertical line,
          spaced at uniform intervals of the stream function ψ = Im(F).
          Uniform-ψ seeding guarantees equal volumetric flux between adjacent
          streamlines — the closer they cluster, the faster the flow.
        </li>
        <li>
          Integrate <code>dz/ds = conj(dF/dz)</code> by 4th-order Runge-Kutta
          (step ds = 0.042). The conjugate turns the complex velocity{" "}
          <em>u − iv</em> into the direction vector <em>u + iv</em>.
        </li>
        <li>
          Terminate when the path enters the circle (|z − z_c| &lt; R·1.01)
          or leaves the domain (|z| &gt; 7).
        </li>
        <li>
          Apply Joukowski to the accumulated z-plane path: each complex w-point
          becomes an (x, z) pair in Blender coordinates. The conformal property
          guarantees these are true streamlines in the w-plane.
        </li>
      </ul>

      <h2>Why not use the stream function contours directly?</h2>
      <p>
        Contouring ψ on a grid works for static images but produces jagged
        segments unsuitable for NURBS tubes. RK4 integration follows the flow
        at sub-pixel resolution and gives smooth curves amenable to Blender
        bevel. Compare this approach with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-navier-stokes-vorticity-streamfunction-lid-cavity-poi"
          className={lk}
        >
          Navier-Stokes vorticity-streamfunction tutorial
        </Link>
        , where viscosity required a finite-difference grid — here the
        analytical potential lets us integrate exactly.
      </p>

      <h2>3-D wing extrusion</h2>
      <p>
        After building the N_PROFILE = 180 vertex aerofoil loop in Blender
        coordinates, the script extrudes it WING_SEGS = 4 times along the
        local Y axis (span direction), adding cap fans at both wingtips.
        The resulting mesh has 180 × 5 = 900 vertices and 4 × 180 + 2 × 178
        = 1076 faces (quad strip + triangulated caps).
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Quad strip between adjacent span rows
for seg in range(WING_SEGS):
    ba, bb = seg * n, (seg + 1) * n
    for i in range(n):
        j = (i + 1) % n
        faces.append((ba+i, ba+j, bb+j, bb+i))`}
      </pre>
      <p>
        The winding alternates on the two endcaps so face normals point
        consistently outward — important for the Draco exporter&apos;s normal
        reindexing. The{" "}
        <code>holoflow:facet = True</code> custom property triggers flat
        shading in the studio exporter; combined with the emissive gold
        material (strength 2.5) it reads as a cel-shaded wing under any HDRI.
      </p>

      <h2>Comparison: Weierstrass-Enneper minimal surfaces</h2>
      <p>
        Both this tutorial and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr"
          className={lk}
        >
          Weierstrass-Enneper minimal surfaces
        </Link>{" "}
        exploit the analyticity of complex functions to generate surfaces with
        special geometric properties. There the Weierstrass data (f, g) satisfy
        harmonic equations for zero mean curvature; here the complex potential
        F satisfies Laplace&apos;s equation for irrotational flow. The
        mathematical machinery — Cauchy-Riemann equations, branch points,
        conformal invariance — is identical in both cases.
      </p>

      <h2>GLB structure for WebXR</h2>
      <p>
        The exporter packs the wing mesh and streamline tubes into a single
        Draco-6 WebP GLB under the names{" "}
        <code>hf_joukowski_wing</code> and{" "}
        <code>hf_joukowski_streams</code>. In a{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
          className={lk}
        >
          Möbius transformation
        </Link>
        -style interactive WebXR scene you can expose a slider for α and
        re-compute Γ client-side, but because the streamlines require RK4
        integration they are baked here at design-time. A future tutorial
        will port the potential-flow solver to a fragment shader for
        real-time α sweeps.
      </p>

      <h2>Trouble-shooting</h2>
      <ul className="list-disc pl-5">
        <li>
          <strong>Wing mesh has gaps at trailing edge</strong> — round-off at
          the cusp (z = a) causes w-plane points to spread slightly. Increase
          N_PROFILE or add a Merge by Distance operation after mesh creation.
        </li>
        <li>
          <strong>Streamlines skip the leading edge</strong> — the stagnation
          point at the leading edge is a zero of dF/dz; RK4 steps slow to zero
          there. Reduce DS or add a minimum-step-size guard.
        </li>
        <li>
          <strong>GLB export fails with "no active object"</strong> — the
          selection loop must run before{" "}
          <code>bpy.ops.export_scene.gltf</code>. Check that both objects are
          in the active view layer and collection.
        </li>
        <li>
          <strong>Bevel tubes appear blocky</strong> — increase{" "}
          <code>bevel_resolution</code> in <code>build_stream_curves</code>{" "}
          from 2 to 4 for smoother cylinders (adds ~4× geometry).
        </li>
      </ul>

      <h2>Outside sources</h2>
      <p>
        Mathematical derivations follow{" "}
        <a
          href="https://archive.org/details/theoreticalhydro0000miln"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Milne-Thomson, <em>Theoretical Hydrodynamics</em> §10
        </a>{" "}
        (L. M. Milne-Thomson, 1938 — public domain). Blender mesh-building
        patterns adapted from{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          njanakiev/blender-scripting
        </a>{" "}
        (Nicolas Janakiev, MIT licence). Complex arithmetic via{" "}
        <a
          href="https://numpy.org/doc/stable/user/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          NumPy
        </a>{" "}
        (BSD-3-Clause).
      </p>

      <h2>Related tutorials</h2>
      <ul className="list-disc pl-5">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-navier-stokes-vorticity-streamfunction-lid-cavity-poi"
            className={lk}
          >
            Navier-Stokes vorticity-streamfunction: lid-driven cavity
          </Link>{" "}
          — viscous finite-difference counterpart; compare streamlines with
          this inviscid potential-flow solution.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-mathutils-torus-knot-pq-winding-parallel-transport-tube-webxr"
            className={lk}
          >
            Torus knot with parallel-transport tube
          </Link>{" "}
          — NURBS bevel-curve technique used here for the streamline tubes.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-curve-data-bezier-nurbs-spline-api"
            className={lk}
          >
            Blender curve-data API: Bézier, NURBS, splines
          </Link>{" "}
          — reference for the <code>crv.splines.new(&apos;NURBS&apos;)</code> pattern used here.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr"
            className={lk}
          >
            Weierstrass-Enneper minimal surfaces
          </Link>{" "}
          — sister tutorial in complex analysis; same analytic-function
          machinery applied to zero-mean-curvature geometry.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
            className={lk}
          >
            Möbius transformations on the Riemann sphere
          </Link>{" "}
          — PSL(2, ℂ) conformal maps; Joukowski is not Möbius (it has a
          non-trivial Jacobian zero) but both live in the world of complex
          conformal geometry.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    title: "Joukowski Aerofoil from Blueprint",
    steps: [
      {
        title: "Open Blender 5.1",
        body: "New → General. Switch to the Scripting workspace.",
      },
      {
        title: "Paste and run blueprint.py",
        body: "Paste the full script into the Text Editor and click Run Script. " +
          "The wing mesh and streamline curves appear in the 3D Viewport. " +
          "Check the terminal for the printed Γ and lift values.",
      },
      {
        title: "Inspect the aerofoil",
        body: "Switch to Eevee. Set world background to near-black (#050505). " +
          "Orbit around the wing to verify the cusp at the trailing edge and " +
          "the streamlines curving round the leading edge.",
      },
      {
        title: "Run record.py",
        body: "Paste record.py and run it. A 5-second dolly-orbit animation " +
          "renders to public/library/videos/…/viewport.mp4.",
      },
      {
        title: "Screen-record",
        body: "Follow SCREEN-RECORDING-NOTES.md to capture an OBS session " +
          "showing the script run, object inspection, and animation preview.",
      },
    ],
  },
  {
    slug: SLUG,
    title: TITLE,
    date: "2026-08-02",
    kind: "tutorial",
    excerpt: LEDE,
    Body,
  },
);

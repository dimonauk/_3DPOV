import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-magnetic-pendulum-fractal-basin-three-magnets-rk4-convergence-height-field-stage-floor-webxr";

const TITLE =
  "Python numpy — Magnetic Pendulum Fractal Basin: Grebogi–Ott–Yorke 1983 Fractal Basin Boundary, Three-Magnet Equilateral Damped Pendulum, RK4 Convergence Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "A damped pendulum released above three magnets settles above whichever one wins the tug-of-war — but which one depends on the starting position in a pattern that is fractal: the basin boundary has Hausdorff dimension strictly greater than one. This blueprint simulates the RK4 equations of motion for every point on a 120 × 120 grid, maps convergence time to vertex Z (slow-settling points near the boundary rise the highest), and maps magnet identity to vertex colour, producing a stage-floor mesh whose ridge system literally traces the fractal boundary in three dimensions.";

function Body() {
  return (
    <>
      <p>
        Drop a pendulum above three magnets and it will always settle above one
        of them. Trace every possible starting point on a grid, colour each
        cell by which magnet wins, and you expect to see three smooth regions
        separated by neat lines. You get something quite different: the boundary
        between any two basins of attraction is nowhere differentiable. Zoom in
        on it and it looks the same at every scale. Its Hausdorff dimension is
        strictly between one and two.
      </p>
      <p>
        This is not an artefact of numerical error. Grebogi, Ott, and Yorke
        proved in 1983 that basin boundaries of dissipative systems are
        generically fractal whenever the basins are interleaved in a
        topologically tangled way. The magnetic pendulum is the canonical
        physical demonstration: simple enough to simulate in a few lines of
        numpy, complex enough to show structure at arbitrarily fine resolution.
      </p>

      <h2>Equations of motion</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`2-D reduction (bob constrained to horizontal plane)

  ẍ = −k·x − d·ẋ + Σᵢ Mᵢ·(xᵢ−x) / rᵢ³
  ÿ = −k·y − d·ẏ + Σᵢ Mᵢ·(yᵢ−y) / rᵢ³
  rᵢ = sqrt((x−xᵢ)² + (y−yᵢ)² + H²)

Parameters (canonical values):
  k  = 0.20   spring constant (restoring force)
  d  = 0.30   damping coefficient
  Mᵢ = 1.00   magnet strength
  H  = 0.50 m pendulum height above magnet plane
  DT = 0.05   RK4 timestep
  N  = 3 000  maximum steps per trajectory

Magnets at equilateral triangle vertices (radius 1.0 m):
  m₀ = ( 0.00,  1.00)  cobalt
  m₁ = (−0.866,−0.50)  amber
  m₂ = (+0.866,−0.50)  violet`}
      </pre>

      <h2>Why H² matters</h2>
      <p>
        The H² term in rᵢ is not an approximation — it is the correct geometry.
        The pendulum bob swings in a horizontal plane a distance H above the
        magnets. When the bob is directly over magnet i, the actual distance is
        H, not zero. Without H², the force diverges to infinity at that point,
        the simulation blows up, and the trajectory is non-physical. With H²,
        the force saturates at M/H³ and the bob smoothly crosses over the magnet
        and continues.
      </p>

      <h2>Vectorised RK4 over 14 400 starting points</h2>
      <p>
        The key performance technique is to treat all 14 400 grid points as a
        single batch. At each timestep the state array has shape (N, 4) where
        columns are [x, y, vx, vy]. The force calculation broadcasts over both
        the N grid points and the M magnets simultaneously, producing a (N, M)
        distance array with a single numpy call. The RK4 update is then four
        such calls. A convergence mask tracks which grid points have settled
        and removes them from the active batch, so the computation shrinks as
        more points converge.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Vectorised force over N points × M magnets
dx  = magnets[:, 0][None, :] - x[:, None]   # (N, M)
dy  = magnets[:, 1][None, :] - y[:, None]
r2  = dx**2 + dy**2 + H**2                  # H² prevents singularity
r3  = r2 ** 1.5
fx  = np.sum(M * dx / r3, axis=1)           # (N,) — sum over magnets
fy  = np.sum(M * dy / r3, axis=1)

# Convergence: slow AND near a magnet
slow = speed < CONV_VEL
for mi in range(len(magnets)):
    dist   = hypot(px - magnets[mi,0], py - magnets[mi,1])
    settle = idx[slow][dist < CONV_DIST]
    which[settle] = mi
    active[settle] = False`}
      </pre>

      <h2>Height field geometry</h2>
      <p>
        Convergence time is gamma-compressed before mapping to vertex Z:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`z = (settle_fraction ** 0.7) * HEIGHT_SCALE

# settle_fraction = steps_taken / MAX_STEPS ∈ [0, 1]
# gamma 0.7  → raise boundary peaks, flatten easy-to-decide interior
# HEIGHT_SCALE = 0.32 m`}
      </pre>
      <p>
        The gamma is chosen empirically so the interior basins stay near-flat
        and the fractal ridges stand proud at full height. A gamma of 1.0
        (linear) undersells the boundary; gamma 0.5 oversaturates the interior.
        0.7 is the visual sweet-spot.
      </p>

      <h2>Colour attribution</h2>
      <p>
        Each vertex receives the colour of the magnet it converges to, brightness-
        modulated by convergence fraction so that slow-settling (boundary)
        vertices are slightly brighter than the fast-settling interior:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`brightness = 0.45 + settle_fraction * 0.55   # [0.45 → 1.0]
rgba = COL_3[which_magnet].copy()            # (N, 4)
rgba[:, :3] *= brightness[:, None]           # RGB only

# Stored as FLOAT_COLOR POINT attribute "MagPendCol"
attr = me.attributes.new("MagPendCol", "FLOAT_COLOR", "POINT")
attr.data.foreach_set("color", rgba.ravel())`}
      </pre>

      <h2>Shape keys</h2>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-white/20">
            <th className="text-left py-1 pr-4">Key</th>
            <th className="text-left py-1 pr-4">Params</th>
            <th className="text-left py-1">Visual</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">Basis</td>
            <td className="py-1 pr-4">d=0.30, 3 mag</td>
            <td className="py-1">Moderate fractal ridges</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">SK_HighDamp</td>
            <td className="py-1 pr-4">d=0.50, 3 mag</td>
            <td className="py-1">Smooth basins, gentle peaks</td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-1 pr-4 font-mono">SK_LowDamp</td>
            <td className="py-1 pr-4">d=0.15, 3 mag</td>
            <td className="py-1">Intricate boundary, tall sharp ridges</td>
          </tr>
          <tr>
            <td className="py-1 pr-4 font-mono">SK_4Mag</td>
            <td className="py-1 pr-4">d=0.30, 4 mag</td>
            <td className="py-1">Square layout, X-shaped boundary ridges</td>
          </tr>
        </tbody>
      </table>

      <h2>Troubleshooting</h2>
      <div className="space-y-4">
        {[
          {
            q: "Script runs for too long",
            fix: "Reduce GRID_N to 80 (6 400 vertices) or MAX_STEPS to 1 500. The fractal structure is still visible at lower resolution.",
          },
          {
            q: "Floor is completely flat",
            fix: "All grid points converged immediately — CONV_DIST is too large or the magnets are too strong. Set CONV_DIST = 0.10 and M_STRENGTH = 0.80.",
          },
          {
            q: "Colour is uniform (all one magnet)",
            fix: "Starting positions are all within one basin — GRID_EXTENT is too small. Set GRID_EXTENT = 3.0 to see all three basins.",
          },
          {
            q: "'MagPendCol' not visible in GLB viewer",
            fix: "The Three.js material needs vertexColors = true and the MeshStandardMaterial must pick up the COLOR_0 accessor. Verify export_colors=True in the GLB export call.",
          },
          {
            q: "Some vertices spike to extreme heights",
            fix: "These are points that never converged within MAX_STEPS. Fallback assigns them the nearest magnet at final position but the settle_fraction stays 1.0. Increase MAX_STEPS to 5 000 or increase D_BASIS to 0.35.",
          },
        ].map(({ q, fix }) => (
          <div key={q}>
            <p className="font-semibold">{q}</p>
            <p className="text-sm opacity-80">{fix}</p>
          </div>
        ))}
      </div>

      <h2>Cross-references</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-newton-fractal-basin-attraction-complex-roots-stage-floor-webxr"
          >
            Newton Fractal Basin
          </Link>{" "}
          — basin-of-attraction height field over the complex plane; same
          vertex-colour-by-basin technique applied to Newton&rsquo;s method
          for z³ = 1.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr"
          >
            Chirikov Standard Map
          </Link>{" "}
          — contrasts this dissipative fractal basin with the KAM tori of a
          conservative Hamiltonian system.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-double-pendulum-lagrangian-chaos-rk4-butterfly-bishop-tube-poi-webxr"
          >
            Double Pendulum
          </Link>{" "}
          — sister pendulum tutorial using the same RK4 scheme to trace a
          chaotic trajectory rather than a basin map.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-henon-map-strange-attractor-fractal-basin-poi-webxr"
          >
            Hénon Map Fractal Basin
          </Link>{" "}
          — discrete-time analogue; escape-time basin colouring applied to a
          2-D quadratic map.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
          >
            Lorenz Attractor
          </Link>{" "}
          — RK4 integration of a 3-D strange attractor; shares the
          integrator and numpy vectorisation patterns.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <a
            className={lk}
            href="https://numpy.org/doc/stable/"
            target="_blank"
            rel="noreferrer"
          >
            NumPy documentation
          </a>{" "}
          — BSD-3-Clause, NumPy community. The vectorised RK4 batch approach
          relies on numpy broadcasting over both grid points and magnets.
          Related:{" "}
          <a
            className={lk}
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noreferrer"
          >
            numpy/numpy
          </a>
          .
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts"
            target="_blank"
            rel="noreferrer"
          >
            dysts — Dynamical Systems Benchmarks
          </a>{" "}
          — MIT, William Gilpin. Catalogues 135+ dynamical systems with
          Lyapunov spectra and Kaplan–Yorke dimensions, including pendulum and
          basin systems. Related:{" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts_examples"
            target="_blank"
            rel="noreferrer"
          >
            dysts_examples
          </a>{" "}
          (MIT Jupyter notebooks).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
    slug: SLUG,
    title: TITLE,
    lede: LEDE,
    date: "2026-09-06",
    topics: ["python", "numpy", "chaos", "physics", "stage-floor", "webxr"],
    blenderVersion: "5.1",
    body: <Body />,
    libraryPath:
      "blends/scripting/python-numpy-magnetic-pendulum-fractal-basin-three-magnets-rk4-convergence-height-field-stage-floor-webxr/",
    paramsSummary:
      "K_SPRING=0.20 D_BASIS=0.30 D_HIGH=0.50 D_LOW=0.15 M_STRENGTH=1.0 H_ABOVE=0.50 DT=0.05 MAX_STEPS=3000 CONV_VEL=0.012 CONV_DIST=0.14 GRID_N=120 GRID_EXTENT=2.2 HEIGHT_SCALE=0.32; magnets equilateral triangle radius=1.0m; deriv: fx=ΣMᵢ(xᵢ−x)/rᵢ³ rᵢ=sqrt(dx²+dy²+H²); RK4 k1=f(s) k2=f(s+0.5dt·k1) k3=f(s+0.5dt·k2) k4=f(s+dt·k3) s+=dt/6·(k1+2k2+2k3+k4); convergence: |v|<0.012 AND dist_to_magnet<0.14; settle_fraction=step/MAX_STEPS; z=(settle_fraction^0.7)·HEIGHT_SCALE; brightness=0.45+settle_fraction·0.55; FLOAT_COLOR POINT MagPendCol cobalt(0.10,0.42,0.88)/amber(0.94,0.58,0.04)/violet(0.60,0.08,0.78); 120×120=14400V 14161Q Basis/SK_HighDamp/SK_LowDamp/SK_4Mag shape keys; Draco-6 WebP export_morph=True export_colors=True GLB",
    outsideSources: [
      {
        title: "NumPy documentation",
        url: "https://numpy.org/doc/stable/",
        licence: "BSD-3-Clause",
        author: "NumPy community",
        relatedProjects:
          "https://github.com/numpy/numpy — NumPy source repository; https://scipy.org — SciPy BSD-3-Clause sister library for scientific computing",
      },
      {
        title: "dysts — Dynamical Systems Benchmarks",
        url: "https://github.com/williamgilpin/dysts",
        licence: "MIT",
        author: "William Gilpin",
        relatedProjects:
          "https://github.com/williamgilpin/dysts_examples — MIT Jupyter notebooks; https://github.com/williamgilpin/fnn — MIT false-nearest-neighbours for delay embedding",
      },
    ],
  });

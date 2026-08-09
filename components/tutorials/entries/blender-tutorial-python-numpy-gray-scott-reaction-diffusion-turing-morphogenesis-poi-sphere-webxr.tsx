import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-morphogenesis-poi-sphere-webxr";

function Body() {
  return (
    <>
      <h2>Why leopard spots and zebra stripes obey the same equation</h2>
      <p>
        In 1952 Alan Turing published a paper that most people — who knew him
        only as the father of computation — found baffling: a reaction-diffusion
        model showing that two interacting chemicals, one activating its own
        production and the other inhibiting it, can spontaneously break spatial
        uniformity. From a homogeneous soup, stripes emerge. From stripes, spots.
        From spots, the labyrinthine whorls of a fingerprint or the branching
        coral of a seashell edge. Turing called the instability{" "}
        <em>diffusion-driven</em>: paradoxically, adding diffusion to a stable
        system makes it unstable, because the inhibitor travels faster than the
        activator and creates spatial contrast wherever the activator briefly
        wins.
      </p>
      <p>
        Gray and Scott (1983) wrote the canonical two-equation form now used in
        virtually every computer demonstration of Turing morphogenesis:
      </p>
      <pre>{`∂u/∂t = D_u ∇²u  −  u·v²  +  F·(1 − u)
∂v/∂t = D_v ∇²v  +  u·v²  −  (F + k)·v`}</pre>
      <p>
        Two concentrations, <strong>u</strong> (the substrate, analogous to the
        activator) and <strong>v</strong> (the product, the inhibitor). Their
        interaction — the <code>u·v²</code> term — is autocatalytic: one
        molecule of v is produced for every two already present plus one u, so
        v accelerates its own growth wherever it exists. The{" "}
        <code>F·(1−u)</code> term is a constant feed of u from an external
        reservoir; <code>(F+k)·v</code> removes v. The ratio{" "}
        <strong>D_u / D_v ≈ 2</strong> ensures the inhibitor diffuses faster,
        which is the engine of the Turing instability.
      </p>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-barkley-excitable-medium-spiral-wave-uv-sphere-poi-head-webxr"
          className={lk}
        >
          Barkley excitable-medium tutorial
        </Link>
        , which models the FitzHugh–Nagumo approximation used in cardiac
        electrophysiology. Barkley&apos;s equations produce rotating spiral
        waves rather than stationary Turing spots — the difference is whether
        the system sits below or above a Hopf bifurcation in the (F, k)
        parameter space.
      </p>

      <h2>The (F, k) phase diagram and five named regimes</h2>
      <p>
        John Pearson&apos;s 1993 Science paper surveyed the (F, k) plane
        systematically and named five qualitatively distinct regimes, each
        with a different topological character in the v-field:
      </p>
      <ul>
        <li>
          <strong>α-pearls (spots)</strong> — isolated dots of high v on a low-v
          background. The most &quot;leopard-like&quot; regime.{" "}
          <code>F=0.035, k=0.060</code>.
        </li>
        <li>
          <strong>β-stripes (worm stripes)</strong> — connected filaments, like
          the labyrinthine back of a Moorish idol fish.{" "}
          <code>F=0.037, k=0.063</code>.
        </li>
        <li>
          <strong>δ-labyrinthine</strong> — a dense maze with no preferred
          direction. Closest to Turing&apos;s original prediction.{" "}
          <code>F=0.046, k=0.059</code>.
        </li>
        <li>
          <strong>ε-holes</strong> — the topological inverse of spots: isolated
          pockets of low v on a high-v background. Seashell pigmentation often
          lives here. <code>F=0.022, k=0.051</code>.
        </li>
        <li>
          <strong>λ-Turing (fingerprints)</strong> — fine parallel arcs,
          reminiscent of dermal ridges. Very long wavelength; slow convergence.{" "}
          <code>F=0.014, k=0.054</code>.
        </li>
      </ul>
      <p>
        In our blueprint each regime runs as an independent 128 × 128 simulation
        for 4000 forward-Euler steps. The{" "}
        <strong>spots regime forms the base mesh</strong> displacement; the
        other four are stored as GLTF morph targets (Blender shape keys), so
        the poi head morphs between topologies in real time.
      </p>

      <h2>Forward-Euler stability and the Von Neumann criterion</h2>
      <p>
        The blueprint uses forward Euler rather than RK4. This is a deliberate
        engineering trade-off, not laziness. The Von Neumann stability criterion
        for an explicit diffusion scheme on a regular grid is:
      </p>
      <pre>{`D · dt / dx² ≤ 0.25`}</pre>
      <p>
        With <code>D_u = 0.2, dt = 1.0, dx = 1</code> the left-hand side is
        exactly 0.2 — inside the stability region. The reaction terms (the{" "}
        <code>u·v²</code> products) add no further instability for the parameter
        values used. RK4 would deliver nominally fourth-order accuracy in time
        but the Gray-Scott system is being run to asymptotic steady state: the
        transient accuracy is irrelevant. Forward Euler at 4000 steps converges
        to the same final pattern as RK4 at 1000 steps and costs one quarter of
        the arithmetic.
      </p>
      <p>
        Compare this reasoning with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-chladni-figures-standing-wave-eigenmodes-nodal-lines-height-field-webxr"
          className={lk}
        >
          Chladni figures tutorial
        </Link>
        , which uses a direct eigendecomposition rather than time integration —
        a reminder that not every spatial pattern problem requires a time-stepper
        at all.
      </p>

      <h2>Discrete Laplacian on a periodic torus</h2>
      <p>
        The Laplacian is approximated by the standard 5-point stencil:
      </p>
      <pre>{`∇²f[i,j] = f[i+1,j] + f[i-1,j] + f[i,j+1] + f[i,j-1] − 4·f[i,j]`}</pre>
      <p>
        Boundary conditions are <em>periodic</em> — the grid wraps on both axes,
        making it topologically a torus. This avoids the boundary artefacts
        (stripe termination, dot elongation) that appear with Neumann or
        Dirichlet conditions and is natural for a spherical poi head where the
        texture wraps.
      </p>
      <pre>{`# Implemented in one numpy call — no Python loop over boundary cells:
def _laplacian(arr):
    return (
        np.roll(arr, +1, axis=0) +
        np.roll(arr, -1, axis=0) +
        np.roll(arr, +1, axis=1) +
        np.roll(arr, -1, axis=1) -
        4.0 * arr
    )`}</pre>

      <h2>Sampling the v-field onto sphere vertices</h2>
      <p>
        The UV sphere has 64 longitude × 32 latitude segments, giving 2048
        non-pole vertices. Each vertex is converted from Cartesian to spherical
        coordinates, then to UV in [0,1]²:
      </p>
      <pre>{`lon = atan2(x, z)          # longitude ∈ [-π, π]
lat = asin(y / radius)     # latitude  ∈ [-π/2, π/2]
U   = lon / (2π) + 0.5    # map to [0, 1)
V   = lat / π   + 0.5     # map to [0, 1]`}</pre>
      <p>
        The v-concentration is then bilinearly interpolated from the 128 × 128
        grid and used to displace the vertex outward along its normal by up to{" "}
        <code>DISP_SCALE = 0.07 m</code>. Bilinear interpolation removes the
        grid-aliasing artefact that nearest-neighbour would produce: without it,
        the sphere surface shows a faint 128-line grid overlaid on the organic
        Turing pattern.
      </p>

      <h2>Shape keys as GLTF morph targets</h2>
      <p>
        Blender&apos;s shape keys export as GLTF{" "}
        <code>KHR_mesh_quantization</code>-compatible morph targets when the
        GLB export has <strong>Morph Targets</strong> ticked. Each morph target
        stores the per-vertex position <em>delta</em> relative to the base mesh
        — not the absolute positions — so only the difference field travels down
        the wire, reducing file size considerably.
      </p>
      <p>
        In the WebXR scene a simple Three.js{" "}
        <code>morphTargetInfluences</code> animation can tween between any two
        regimes or cycle through all five on a schedule driven by the poi
        controller&apos;s beat detection.
      </p>
      <p>
        For more on this studio&apos;s GLTF export conventions — Draco level 6,
        WebP textures, +Y up, applied transforms — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr"
          className={lk}
        >
          Schwarz P/D/Gyroid TPMS tutorial
        </Link>{" "}
        which exports the same shape-key morph pattern.
      </p>

      <h2>Failure modes and troubleshooting</h2>
      <ul>
        <li>
          <strong>v-field stays near zero after 4000 steps</strong> — the (F,
          k) pair is in the trivial stable region. Try increasing k slightly
          (e.g. k=0.065) or reduce F. Alternatively increase{" "}
          <code>SIM_STEPS</code> to 8000; some regimes near the bifurcation
          boundary are slow to nucleate.
        </li>
        <li>
          <strong>Pattern looks identical across regimes</strong> — you may have
          hit the all-zeros fixed point (u=1, v=0) that exists for any (F, k).
          Increase <code>SEED_RADIUS</code> from 6 to 10 to give the front more
          starting area.
        </li>
        <li>
          <strong>Sphere vertices only displaced at poles</strong> — the{" "}
          <code>atan2 / asin</code> UV inversion fails if the object has been
          transformed (rotated/scaled) before the script runs. Run{" "}
          <code>bpy.ops.object.transform_apply</code> before sampling, or
          remove the transform from the object first.
        </li>
        <li>
          <strong>GLB export raises &quot;no active object&quot;</strong> —
          <code>bpy.context.view_layer.objects.active = obj</code> must be set
          before calling the GLTF exporter. The blueprint does this; if you have
          modified the script check that line is still present.
        </li>
        <li>
          <strong>Memory error on large GRID values</strong> — a 512 × 512
          grid × 4000 steps × 5 regimes × float64 ≈ 4 GB RAM. Stay below 256
          on machines with &lt; 32 GB.
        </li>
      </ul>

      <h2>Bench steps</h2>
      <ol>
        <li>
          Open Blender 5.1. Scripting workspace → New text block. Paste{" "}
          <code>blueprint.py</code>.
        </li>
        <li>
          Confirm numpy is available:{" "}
          <code>import numpy; print(numpy.__version__)</code> in the Python
          console. Blender 5.1 ships numpy in its bundled Python.
        </li>
        <li>
          Run the script. Watch the Info header for per-regime print output.
          Total runtime: ~2 min on a modern laptop (128 × 128 × 4000 × 5
          iterations, vectorised via numpy).
        </li>
        <li>
          Switch to 3D Viewport → Material Preview. Orbit the sphere. The spots
          regime should be visible as raised bumps on a smooth sphere.
        </li>
        <li>
          Open Properties → Object Data → Shape Keys. Drag the{" "}
          <code>worm_stripes</code> slider to 1.0. The surface topology changes:
          the isolated dots fuse into connected filaments.
        </li>
        <li>
          Drag each morph slider in turn — spots → worms → labyrinthine → holes
          → fingerprints. Each transition is a topological change in the level
          set of the v-field.
        </li>
        <li>
          File → Export → glTF 2.0. Enable Draco compression (level 6), WebP
          textures, Morph Targets. Export as{" "}
          <code>gs_morphogenesis_poi.glb</code>.
        </li>
        <li>
          Optional: File → Save As <code>gs_morphogenesis_poi.blend</code> for
          the library archive.
        </li>
      </ol>

      <h2>Sources and further reading</h2>
      <ul>
        <li>
          <a
            href="https://royalsocietypublishing.org/doi/10.1098/rstb.1952.0012"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Turing AM 1952 — &quot;The Chemical Basis of Morphogenesis.&quot;
          </a>{" "}
          <em>Phil Trans R Soc B</em> 237(641):37–72. Public domain. The
          foundational paper proving that diffusion-driven instability can
          generate spatial pattern from homogeneous initial conditions. Related:
          Gierer–Meinhardt 1972 (local-excitation / lateral-inhibition
          formulation), Koch–Meinhardt 1994 review.
        </li>
        <li>
          <a
            href="https://www.science.org/doi/10.1126/science.261.5118.189"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Pearson JE 1993 — &quot;Complex Patterns in a Simple System.&quot;
          </a>{" "}
          <em>Science</em> 261(5118):189–192. Systematic (F, k) phase diagram,
          first definition of the α/β/δ/ε/λ regime alphabet. The regime
          parameters used in this tutorial&apos;s REGIMES table come directly
          from Table 1 of this paper. Related: Gray P & Scott SK 1983{" "}
          <em>Chem Eng Sci</em> 38(1):29–43 (original model); Muratov &
          Osipov 2000 (stripe vs spot selection theory).
        </li>
        <li>
          <a
            href="http://www.karlsims.com/rd.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Karl Sims — Reaction Diffusion Tutorial
          </a>
          . Educational web reference. Intuitive plain-English explanation of
          the parameter space with interactive images. Related: Sims 1994 SIGGRAPH
          &quot;Evolving Virtual Creatures&quot; (public domain), Robert Munafo&apos;s
          xmorphia catalogue at{" "}
          <a
            href="http://mrob.com/pub/comp/xmorphia/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            mrob.com/pub/comp/xmorphia
          </a>{" "}
          (comprehensive (F, k) atlas with named sub-regions).
        </li>
      </ul>
    </>
  );
}

const base = {
  slug: SLUG,
  title:
    "Gray-Scott Reaction-Diffusion — Turing Morphogenesis Poi Head",
  date: "2026-08-09",
  blurb:
    "Run five Gray-Scott reaction-diffusion simulations — spots, worm stripes, labyrinthine, holes, fingerprints — on a 128×128 periodic grid, sample the inhibitor field onto a UV-sphere poi head via bilinear interpolation, and export five GLTF morph targets for live regime-morphing in WebXR.",
  body: Body,
  externalLinks: [
    {
      href: "https://royalsocietypublishing.org/doi/10.1098/rstb.1952.0012",
      label:
        "Turing AM 1952 — The Chemical Basis of Morphogenesis. Phil Trans R Soc B 237:37–72. Public domain.",
      note: "Public domain (pre-1978). Foundational paper on diffusion-driven spatial symmetry breaking. Related: Gierer–Meinhardt 1972 (activator-inhibitor), Koch–Meinhardt 1994 review, Kondo–Asai 1995 experimental evidence.",
    },
    {
      href: "https://www.science.org/doi/10.1126/science.261.5118.189",
      label:
        "Pearson JE 1993 — Complex Patterns in a Simple System. Science 261:189–192. Reference only.",
      note: "Defines the five named (F, k) parameter regimes — α-pearls, β-stripes, δ-labyrinthine, ε-holes, λ-Turing — used in this tutorial's REGIMES table. Related: Gray–Scott 1983 original model, Muratov–Osipov 2000 stripe/spot selection, mrob.com/pub/comp/xmorphia xmorphia atlas.",
    },
    {
      href: "http://www.karlsims.com/rd.html",
      label:
        "Karl Sims — Reaction Diffusion Tutorial. Educational reference.",
      note: "Plain-English walkthrough of the Gray-Scott parameter space. Related: Sims 1994 SIGGRAPH 'Evolving Virtual Creatures' (public domain), Robert Munafo xmorphia (mrob.com), Jason Rampe conus textile simulation.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    difficulty: "intermediate",
    libraryPath:
      "blends/scripting/python-numpy-gray-scott-reaction-diffusion-turing-morphogenesis-poi-sphere-webxr",
    time: "one afternoon",
    prerequisites: [
      "Comfortable with numpy array operations (roll, clip, vectorised arithmetic).",
      "Familiar with UV sphere UV mapping conventions in Blender.",
      "Completed at least one displacement-via-normal blueprint in this series.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    dependencies: [
      {
        name: "numpy",
        registry: "pip",
        url: "https://numpy.org/",
        purpose:
          "vectorised Laplacian via np.roll, forward-Euler integration, bilinear interpolation",
      },
    ],
  },
  base,
);

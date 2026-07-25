import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        P. Gray and S. K. Scott published their coupled reaction scheme in 1985
        to explain oscillatory behaviour in a continuously-stirred reactor — but
        the same equations, run on a 2-D spatial lattice, produce an astonishing
        variety of stationary patterns: hexagonal Turing spots, meandering stripe
        labyrinths, self-replicating spot trains, and worm-hole perforations.
        John Pearson's 1993 Science paper mapped the morphology against the two
        free parameters (feed rate <em>f</em>, kill rate <em>k</em>) and gave
        each region a Greek letter: α through θ.
      </p>
      <p>
        Two species evolve on a toroidal 128×128 lattice:
      </p>
      <pre>{`∂U/∂t = Du·∇²U − U·V² + f·(1 − U)
∂V/∂t = Dv·∇²V + U·V² − (f + k)·V

U  substrate (food), replenished at rate f
V  activator, autocatalytic (U + 2V → 3V), removed at rate (f + k)
P  inert product — not tracked`}</pre>
      <p>
        The 5-point Laplacian (numpy <code>roll</code> stencil) handles diffusion
        on periodic boundaries; explicit Euler is stable while{" "}
        <code>Δt ≤ 1/(4·Du) = 1.5625</code> at unit grid spacing.  With{" "}
        <code>Δt = 1.0</code> and 10 000 steps the simulation reaches
        near-steady state in under twenty seconds on any modern CPU.  The final
        V-field is mapped to vertex Z-displacement, producing a faceted relief
        mesh that exports directly as a WebXR-ready GLB.
      </p>

      <h2>Why the diffusion ratio matters</h2>
      <p>
        Turing's 1952 paper showed that a two-species system can spontaneously
        break translational symmetry — even starting from a nearly-uniform state
        — provided the inhibitor diffuses faster than the activator.  In
        Gray-Scott, U acts as the <em>long-range inhibitor</em> (consumed where
        V is high, but replenished everywhere at rate <em>f</em>) and V is the{" "}
        <em>short-range activator</em>.  The ratio Du/Dv = 2 satisfies the
        Turing prerequisite; if you set Du = Dv the pattern collapses to uniform
        state.
      </p>
      <p>
        Compare the pure diffusion formulation in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          GN Simulation Zone — Turing Reaction-Diffusion blueprint
        </Link>{" "}
        (which implements Gierer-Meinhardt activator-inhibitor) and the
        Belousov-Zhabotinsky oscillator in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves"
          className={lk}
        >
          BZ Oregonator blueprint
        </Link>{" "}
        — three different chemical models, three different spatial architectures.
      </p>

      <h2>Pattern families</h2>
      <pre>{`F_RATE   K_RATE   Pearson region   Morphology
──────── ──────── ──────────────── ───────────────────────────────
0.060    0.062    ζ                Turing spots         ← default
0.035    0.060    ε                Stripe labyrinths
0.025    0.060    β                Self-replicating spots
0.025    0.065    γ                Worm-hole holes (V inverted)
0.062    0.061    η                Chaotic blue-sky regime`}</pre>
      <p>
        The boundary between Turing spots and stripes is a codimension-2
        bifurcation point — a cusp in the (f, k) plane where two bifurcation
        curves intersect.  Nudging K_RATE from 0.062 to 0.060 crosses that
        cusp and the morphology flips from hexagonal to lamellar.
      </p>

      <h2>Numerical stability</h2>
      <p>
        The explicit Euler scheme accumulates one half-step of numerical
        diffusion per iteration, bounded by the CFL condition:
      </p>
      <pre>{`dt ≤ Δx² / (4·Du)

With unit grid spacing (Δx = 1):
dt ≤ 1 / (4 × 0.16) = 1.5625

We use dt = 1.0 — a 4 % safety margin.`}</pre>
      <p>
        The <code>np.clip(u, 0, 1)</code> guard catches any transient excursion
        caused by the nonlinear <code>U·V²</code> term during the first few
        steps while the seed patch is steep.  After ~200 steps the concentrations
        stay within [0, 1] without the clip, but it costs nothing to keep it.
      </p>

      <h2>Laplacian via <code>np.roll</code></h2>
      <p>
        The 5-point finite-difference Laplacian wraps indices with{" "}
        <code>np.roll(field, ±1, axis=0)</code> and <code>axis=1</code>.
        Wrapping implements periodic (toroidal) boundary conditions: the left
        edge connects to the right edge and the top connects to the bottom.
        This prevents the edge artefact that plagues Neumann (zero-flux) BCs,
        where the pattern is pinned by the boundary gradient and the interior
        morphology is disturbed near the margins.
      </p>
      <p>
        For a 128×128 grid the roll approach calls four vectorised numpy
        operations plus one subtraction per field per step — O(N²) and
        cache-friendly.  The equivalent <code>scipy.ndimage.laplace</code>
        would use reflect padding by default, so the periodic behaviour would
        need an explicit <code>mode='wrap'</code> argument.
      </p>
      <p>
        See how the same pattern of reading pixel-buffer data and writing vertex
        positions is used for the SDF atlas in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr"
          className={lk}
        >
          Python bpy Image Pixel Buffer → SDF Texture Atlas blueprint
        </Link>.
      </p>

      <h2>Mesh construction</h2>
      <p>
        The grid spans [−0.5, +0.5]² in the XY plane so the object sits
        comfortably inside a unit cube — matching the WebXR metre scale used
        throughout the studio.  Z = V[i,j] × <code>DISP_SCALE</code> (default
        0.40 m).  Quads are wound CCW (Blender's convention) so face normals
        point upward without a flip modifier.
      </p>
      <p>
        The <code>BYTE_COLOR</code> vertex attribute named <code>Col</code>
        carries a blue-to-gold colour ramp encoding the V concentration.  The
        GLTF exporter maps any first <code>BYTE_COLOR POINT</code> attribute
        called <code>Col</code> to <code>COLOR_0</code> — readable in Three.js
        with <code>material.vertexColors = true</code>.  Compare the Cahn-Hilliard
        tutorial for the same vertex-colour encoding strategy on a different
        phase-field simulation:
      </p>
      <Link
        href="/tutorials/blender-tutorial-python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr"
        className={lk}
      >
        Python numpy — Cahn-Hilliard Phase Separation → Displaced WebXR Mesh
      </Link>
    </>
  );
}

const data = {
  title:
    "Python numpy — Gray-Scott Reaction-Diffusion: Activator-Inhibitor Turing Spots, Stripe Labyrinths & f–k Parameter Sweep for WebXR",
  lede:
    "Integrate the Gray-Scott two-species reaction-diffusion PDEs on a 128×128 toroidal lattice with explicit Euler and a numpy roll Laplacian, map the final activator concentration to vertex Z-displacement, and export a faceted relief GLB for WebXR.",
  date: "2026-07-25",
  steps: [
    {
      title: "Set parameters",
      body: "Open blueprint.py. The four key constants are DU (0.16), DV (0.08), F_RATE (0.060), and K_RATE (0.062). These place you in Pearson's ζ region — hexagonal Turing spots. To get stripe labyrinths, change F_RATE to 0.035 and K_RATE to 0.060.",
    },
    {
      title: "Run simulation",
      body: "In Blender's Scripting workspace, open blueprint.py and click ▶ Run Script. The terminal shows V ∈ [min, max]. A peak max > 0.15 confirms spots have formed. 10 000 steps at 128² takes 8–20 s on a CPU.",
    },
    {
      title: "Inspect the mesh",
      body: "Switch to 3D Viewport. You should see a relief plane with raised blobs (spots) or ridges (stripes) depending on parameters. Toggle Material Preview to see the blue-to-gold vertex colour ramp encoding V concentration.",
    },
    {
      title: "Experiment with parameter sweeps",
      body: "Try the four parameter pairs from the cheat-sheet in the blueprint header. Self-replicating spots (F=0.025, K=0.060) grow new spots at the margins of existing ones — watch this by running record.py instead, which captures temporal snapshots.",
    },
    {
      title: "Export GLB",
      body: "The script auto-exports hf_gray_scott.glb to the .blend file directory with Draco level 6 compression and WebP textures. Load it in a Three.js scene: set material.vertexColors = true on the MeshStandardMaterial to display the concentration colour.",
    },
    {
      title: "Record viewport animation",
      body: "Run record.py to generate viewport.mp4 — 10 snapshots at 1 000-step intervals, 36 frames each, totalling 360 frames at 30 fps (12 seconds). The shape-key animation morphs Z-positions between snapshots, showing the pattern evolving from seed cluster to full Turing lattice.",
    },
  ],
  troubleshooting: [
    {
      symptom: "V ∈ [0.0000, 0.0001] — no pattern formed",
      cause:
        "The parameters are outside the Turing-instability band (above the Turing fold in f–k space). The uniform state U=1, V=0 is stable and the seed decays.",
      fix: "Decrease K_RATE by 0.005 increments while keeping F_RATE fixed. The instability boundary for DU=0.16, DV=0.08 lies roughly along k ≈ 0.04–0.07 depending on f. The default pair (0.060, 0.062) is safely inside.",
    },
    {
      symptom: "Simulation produces NaN — console shows V ∈ [nan, nan]",
      cause:
        "DT > 1/(4·DU) violates the CFL stability condition, causing exponential blow-up in the first few steps.",
      fix: "Reduce DT to 0.5 and re-run. Also confirm DU is 0.16, not 1.6 — a factor-of-10 typo makes DT = 1.0 catastrophically unstable.",
    },
    {
      symptom: "Mesh is flat (no displacement)",
      cause:
        "DISP_SCALE is 0.0 or V values are all at or near zero (pattern failed to form — see above).",
      fix: "Add print(v.min(), v.max()) after run_gray_scott(). If the range is near zero, the simulation is outside the Turing band. If the range is healthy (max > 0.15), set DISP_SCALE = 0.40.",
    },
    {
      symptom: "GLB loads but vertex colours are absent in Three.js",
      cause:
        "The Three.js material does not have vertexColors enabled, or the GLTF loader ignored COLOR_0.",
      fix: "Set material.vertexColors = true and material.needsUpdate = true in Three.js. In Blender, confirm the colour attribute is named exactly Col (capital C, no spaces) and its domain is POINT.",
    },
    {
      symptom: "Pattern is perfectly symmetric — four-fold cross shape",
      cause:
        "The random noise initialisation used a different seed or was removed, leaving the central patch perfectly symmetric.",
      fix: "Confirm rng = np.random.default_rng(seed=SEED) and v += rng.uniform(-0.01, 0.01, (N, N)) are both present. Change SEED to any other integer for a different symmetry break.",
    },
  ],
  externalLinks: [
    {
      label:
        "Pearson (1993) — Complex Patterns in a Simple System — Science 261:189 — mathematical results",
      href: "https://doi.org/10.1126/science.261.5118.189",
    },
    {
      label:
        "numpy.roll — Periodic array shift — BSD-3-Clause — NumPy Developers",
      href: "https://numpy.org/doc/stable/reference/generated/numpy.roll.html",
    },
    {
      label:
        "Blender Python API 5.1 — bpy.types.Mesh — CC-BY-SA-4.0 — Blender Foundation",
      href: "https://docs.blender.org/api/5.1/bpy.types.Mesh.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "GN Simulation Zone — Reaction-Diffusion Turing Spots (Gierer-Meinhardt in Geometry Nodes)",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
    },
    {
      label:
        "GN Simulation Zone — Belousov-Zhabotinsky Oregonator: Chemical Spiral Waves",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves",
    },
    {
      label:
        "Python numpy — Cahn-Hilliard Phase Separation: Spinodal Decomposition & Displaced WebXR Mesh",
      href: "/tutorials/blender-tutorial-python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr",
    },
    {
      label:
        "Python bpy Image Pixel Buffer → SDF Texture Atlas for WebXR",
      href: "/tutorials/blender-tutorial-python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "simulation",
      "physics",
      "materials",
      "webxr",
    ],
    body: Body,
  },
  data,
);

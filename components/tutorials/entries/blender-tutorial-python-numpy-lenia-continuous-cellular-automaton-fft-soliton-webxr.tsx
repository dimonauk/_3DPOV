import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Lenia (Bert Chan, 2019) generalises Conway's Game of Life to a
        continuous domain: a single real-valued field A ∈ [0, 1] evolves under
        an FFT convolution with a smooth radial kernel K, followed by a
        Gaussian growth function G that maps neighbourhood potential
        U&nbsp;=&nbsp;K&nbsp;*&nbsp;A into a per-step delta.  With the
        "Orbium" parameters (R=13, μ=0.135, σ=0.015) the field
        self-organises into stable, translating <em>solitons</em> — biological-looking
        entities that move, rotate, and occasionally replicate.  Unlike{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr"
          className={lk}
        >
          Gray-Scott
        </Link>{" "}
        (two coupled species, Turing instability) or{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-smoothlife-fourier-continuous-automaton-webxr"
          className={lk}
        >
          SmoothLife
        </Link>{" "}
        (binary alive/dead with smooth transitions), Lenia uses a single
        continuous field with no explicit species — growth arises purely from
        the kernel geometry and the narrow growth window.
      </p>

      <h2>Why FFT convolution?</h2>
      <p>
        The neighbourhood potential U(x,y) = (K * A)(x,y) is a 2-D convolution
        of the state field with the kernel disk of radius R.  Naive computation
        costs O(N²R²) per step — at N=128, R=13, that is 128²·13² ≈ 2.8&thinsp;M
        multiply-adds per step.  Because both K and A live on a periodic grid,
        the convolution theorem applies:
      </p>
      <pre>{`U = IFFT( FFT(A) · FFT(K) )          # O(N² log N)`}</pre>
      <p>
        The kernel FFT is precomputed once; each step then costs two FFTs plus
        a pointwise product — roughly 40× faster than the pixel loop.  The same
        trick powers{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-smoothlife-fourier-continuous-automaton-webxr"
          className={lk}
        >
          SmoothLife
        </Link>{" "}
        (two concentric disks) and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-tdse-split-operator-fft-double-slit-quantum-interference-webxr"
          className={lk}
        >
          TDSE split-operator
        </Link>{" "}
        (kinetic propagator in k-space) — FFT is the universal accelerator for
        linear periodic operators.
      </p>

      <h2>Kernel and growth function</h2>
      <pre>{`# Radial bell: peaks at r = 0.5, falls to 0 at r ∈ {0, 1}
K_core(r) = exp(β − β / (4r(1−r) + ε))   r ∈ (0, 1)
           0                               otherwise

# Gaussian growth: maps U → [−1, +1]
G(U) = 2·exp(−(U − μ)² / (2σ²)) − 1

# Update (Euler, clipped)
A_new = clip(A + Δt·G(K*A), 0, 1)`}</pre>
      <p>
        The annular kernel (zero at the origin, ring peak at R/2) means a cell
        "feels" its surroundings at a specific distance — not its immediate
        neighbours.  The narrow growth window σ = 0.015 is the reason solitons
        exist: only a tight band of neighbourhood density sustains growth; too
        dense and cells die, too sparse and they fade.
      </p>
      <p>
        Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves"
          className={lk}
        >
          BZ Oregonator spiral waves
        </Link>{" "}
        — a three-species excitable medium where patterns arise from threshold
        kinetics rather than a continuous growth function.  Lenia's smooth
        formulation admits far more creature morphologies because the parameter
        space has no sharp bifurcation boundaries.
      </p>

      <h2>Soliton parameter families</h2>
      <pre>{`MU      SIGMA   BETA   Creature class
────── ─────── ────── ──────────────────────────────────
0.135  0.015   4.0    Orbium — translating disk (default)
0.272  0.025   4.0    Scutium — slower radial swimmer
0.157  0.020   4.0    Hydrogeminium — segmented worm
0.160  0.012   6.0    Paraptera — asymmetric glider pair
0.200  0.040   2.0    Diffuse cloud  (no stable soliton)`}</pre>
      <p>
        Lenia's parameter space is continuous — each (μ, σ, β) triple defines a
        different "physics" and usually a different morphological family.  Bert
        Chan's survey (arXiv:1812.05433) catalogues over 400 distinct creature
        classes.  The image-pixel approach in{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr"
          className={lk}
        >
          bpy Image Pixel Buffer
        </Link>{" "}
        can bake any Lenia snapshot into a texture atlas for use as a WebXR
        sprite or decal.
      </p>
    </>
  );
}

const data = {
  title:
    "Python numpy — Lenia: Continuous Cellular Automaton, FFT Convolution & Self-Organising Solitons for WebXR",
  lede:
    "Simulate Lenia on a 128×128 toroidal grid using numpy FFT convolution and a Gaussian growth function, snapshot 8 frames of self-organising solitons into Blender shape keys, and export an animated WebXR GLB.",
  date: "2026-07-26",
  steps: [
    {
      title: "Set parameters",
      body: "Open blueprint.py. The core constants are R (13), MU (0.135), SIGMA (0.015), and BETA (4.0) — the Orbium soliton configuration. Change SEED to explore different initial arrangements. Increase N_SNAPS for a longer timeline at the cost of more shape-key memory.",
    },
    {
      title: "Run simulation",
      body: "In Blender's Scripting workspace, open blueprint.py and press ▶ Run Script. The console prints snapshot progress: 'snap 1/8 A∈[0.00, 0.95] ρ=0.03'. A density ρ ≈ 0.02–0.08 with non-zero maximum confirms active solitons rather than a decayed field. Total runtime is ~15 s on a modern CPU.",
    },
    {
      title: "Inspect the mesh",
      body: "Switch to the Layout workspace. Press Z → Material Preview to see the hot colourmap: dark (A≈0) background with bright orange-white blobs (A≈1) for the solitons. Scrub the timeline to watch the blobs translate. The shape-key transition interpolates the Z displacement so motion is smooth even between keyframes.",
    },
    {
      title: "Explore parameter families",
      body: "Try MU=0.272, SIGMA=0.025 for Scutium (slower radial swimmer). Change BETA=6.0, MU=0.160, SIGMA=0.012 for Paraptera asymmetric gliders. Each parameter set requires re-running blueprint.py to rebuild the mesh — the old object is cleaned up automatically.",
    },
    {
      title: "Export GLB",
      body: "The script auto-exports hf_lenia.glb next to the .blend file (Draco level 6, WebP textures, morph targets enabled). In Three.js: load with GLTFLoader, call mixer.clipAction(gltf.animations[0]).play(), and set material.morphTargets = true and material.vertexColors = true on the MeshStandardMaterial.",
    },
    {
      title: "Record viewport animation",
      body: "Run record.py in the same Blender session to render viewport.mp4 — it sets up a camera at 55° tilt overhead, enables Material Preview lighting, then calls bpy.ops.render.opengl(animation=True). Total duration is N_SNAPS × SNAP_EVERY frames at 30 fps, roughly 8–12 seconds.",
    },
  ],
  troubleshooting: [
    {
      symptom: "All snapshots show A∈[0.0000, 0.0000] — field collapsed to zero",
      cause:
        "MU is outside the soliton band for the current SIGMA and R. The field dies in the warm-up phase with no pattern forming.",
      fix: "Use the default Orbium values: MU=0.135, SIGMA=0.015, R=13. If exploring other families, change one parameter at a time in increments of 0.005. A density ρ < 0.001 after WARM_UP = 300 steps almost always means the parameter is outside the viable region.",
    },
    {
      symptom: "Field saturates to A = 1.0 everywhere (white mesh)",
      cause:
        "SIGMA is too wide (> 0.05) or MU is too high, causing G(U) ≈ +1 everywhere and unconstrained growth.",
      fix: "Reduce SIGMA to 0.015 and check MU is between 0.10 and 0.30. If the field is already saturated, reset by deleting hf_lenia and re-running with default parameters.",
    },
    {
      symptom: "Shape-key animation is choppy — visible pop between keys",
      cause:
        "N_SNAPS is small (< 4) or SNAP_EVERY is large, so the displacement change between keys is too extreme for Blender's linear interpolation.",
      fix: "Increase N_SNAPS to 12 and reduce SNAP_EVERY to 30. Alternatively add a Smooth modifier to the shape-key fcurves in the Graph Editor (select all, Key → Smooth Keys).",
    },
    {
      symptom: "GLB loads in Three.js but no morph animation plays",
      cause:
        "The GLTFLoader found the morph data but no AnimationMixer was created, or morphTargets is not set on the material.",
      fix: "After load: const mixer = new THREE.AnimationMixer(gltf.scene); mixer.clipAction(gltf.animations[0]).play(); and call mixer.update(delta) in the render loop. On the mesh material set morphTargets = true; material.needsUpdate = true.",
    },
  ],
  externalLinks: [
    {
      label:
        "Chan (2019) — Lenia: Biology of Artificial Life — arXiv:1812.05433 — CC BY 4.0",
      href: "https://arxiv.org/abs/1812.05433",
    },
    {
      label:
        "Lenia Python reference — MIT licence — Bert Wang-Chak Chan — GitHub",
      href: "https://github.com/Chakazul/Lenia",
    },
    {
      label:
        "NumPy FFT routines — BSD-3-Clause — NumPy Developers",
      href: "https://numpy.org/doc/stable/reference/routines.fft.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Python numpy — SmoothLife: Fourier-Domain Continuous Cellular Automaton (two-disk kernel, sigmoid transition)",
      href: "/tutorials/blender-tutorial-python-numpy-smoothlife-fourier-continuous-automaton-webxr",
    },
    {
      label:
        "Python numpy — Gray-Scott Reaction-Diffusion: Activator-Inhibitor Turing Spots & Stripe Labyrinths",
      href: "/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr",
    },
    {
      label:
        "GN Simulation Zone — Belousov-Zhabotinsky Oregonator: Chemical Spiral Waves",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves",
    },
    {
      label:
        "Python bpy Image Pixel Buffer → SDF Texture Atlas for WebXR (bake Lenia snapshots to textures)",
      href: "/tutorials/blender-tutorial-python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-numpy-lenia-continuous-cellular-automaton-fft-soliton-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "simulation",
      "physics",
      "webxr",
    ],
    body: Body,
  },
  data,
);

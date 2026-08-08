import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-raup-mollusc-shell-morphospace-helicoidal-coiling-poi-head-webxr";

const TITLE =
  "Python numpy — Raup Morphological Space: Mollusc Shell Coiling, " +
  "Helicoidal Surface Four-Parameter Model & Morphotype Shape Keys " +
  "for Poi Head WebXR (Blender 5.1)";

const LEDE =
  "David Raup showed in 1966 that virtually the entire fossil record of " +
  "coiled shells fits inside a four-dimensional parameter space: whorl " +
  "expansion rate W, umbilical ratio D, and translation rate T together " +
  "define a helicoidal surface whose cross-section sweeps through the " +
  "conchospiral — the 3D generalisation of a logarithmic spiral.  This " +
  "blueprint evaluates the surface equations on a vectorised NumPy meshgrid " +
  "(180 × 40 = 7 200 vertices), builds four morphotype shape keys (Ammonite, " +
  "Nautilus, Cone, Turritella), encodes whorl age as a magenta-to-cyan vertex " +
  "colour gradient, and exports a Draco-6 GLB poi head for WebXR morph-target " +
  "animation in the Holoflow stage.";

function Body() {
  return (
    <>
      <p>
        In 1966 David Raup published a geometric analysis of shell coiling that
        reduced the morphological diversity of Mollusca to three continuous
        parameters.  The insight was radical: rather than cataloguing shells
        taxonomically, Raup plotted them in a <em>morphospace</em> — a
        mathematical space where each axis is a measurable geometric quantity
        and each species occupies a point.  The gaps in the plot are equally
        informative: they reveal which geometries are constructible but
        evolutionarily unused.
      </p>
      <p>
        The surface equation for a coiled shell is a
        {" "}<em>helicoidal surface</em> — a surface swept by a generating curve
        (the aperture cross-section) as it simultaneously rotates about and
        translates along a fixed axis (the coiling axis), all while expanding
        exponentially.  In normalised coordinates:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`scale(θ) = W^(θ / 2π)                  — exponential radial growth

x(θ, φ) = scale · (1 + D·cos φ) · cos θ
y(θ, φ) = scale · (1 + D·cos φ) · sin θ
z(θ, φ) = scale · ( D·sin φ  +  T·θ / 2π )

θ ∈ [0, 2π·N_TURNS]   coiling angle around the axis
φ ∈ [0, 2π)           angle around the aperture cross-section`}
      </pre>
      <p>
        The three Raup parameters do very different geometric work:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`W  — whorl expansion rate
       W^(1/2π) is the per-radian scaling factor.  After one full revolution
       (Δθ = 2π) the aperture is W times larger.
       W ≈ 1.3  →  tight turritella tower (whorls barely separate)
       W ≈ 3.0  →  open ammonoid disc (large gap between whorls)

D  — umbilical ratio  =  aperture_radius / aperture_centre_distance
       The inner lip of the outer whorl sits at radial distance (1−D)·scale.
       D < 1 is required to prevent the inner lip from passing through
       the coiling axis.  D ≈ 0 → wire (cone shell); D ≈ 0.4 → open umbilicus.

T  — translation rate: axial displacement per revolution
       T = 0 → flat planispiral (ammonite lies in a plane)
       T ≈ 1 → low gastropod spire
       T > 2 → tall turritella tower`}
      </pre>

      <h2>NumPy vectorised meshgrid</h2>
      <p>
        The surface is a two-parameter family — a function of (θ, φ) — which
        maps directly to a NumPy{" "}
        <code>meshgrid</code> with{" "}
        <code>indexing=&apos;ij&apos;</code>.  Broadcasting eliminates all
        explicit Python loops over the 7 200 vertex grid:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`import numpy as np

NQ, NP = 180, 40        # theta × phi resolution

theta = np.linspace(0.0, 2.0 * np.pi * N_TURNS, NQ)
phi   = np.linspace(0.0, 2.0 * np.pi, NP, endpoint=False)
TH, PH = np.meshgrid(theta, phi, indexing='ij')   # (NQ, NP)

scale = W ** (TH / (2.0 * np.pi))                  # (NQ, NP) broadcast
X = scale * (1.0 + D * np.cos(PH)) * np.cos(TH)
Y = scale * (1.0 + D * np.cos(PH)) * np.sin(TH)
Z = scale * (D * np.sin(PH) + T * TH / (2.0 * np.pi))`}
      </pre>
      <p>
        Why <code>endpoint=False</code> on the phi linspace?  The aperture is a
        closed ring: vertex index 0 and index NP refer to the same geometric
        point on the circle.  Excluding the endpoint lets the bmesh quad-builder
        close the ring with a modulo wrap (<code>j1 = (j+1) % NP</code>) without
        creating a degenerate zero-area edge along the seam.
      </p>

      <h2>bmesh quad strip topology</h2>
      <p>
        The (NQ, NP) vertex grid maps to a tube of{" "}
        <code>(NQ − 1) × NP</code> quads.  Vertex{" "}
        <code>i·NP + j</code> is at position (θᵢ, φⱼ) in the grid.  Each quad
        connects four neighbouring vertices and the phi direction wraps:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`bm = bmesh.new()
for co in coords:           # coords shape (NQ*NP, 3)
    bm.verts.new(tuple(co))
bm.verts.ensure_lookup_table()

for i in range(NQ - 1):
    for j in range(NP):
        j1 = (j + 1) % NP
        bm.faces.new([
            bm.verts[i     * NP + j ],   # (θᵢ,   φⱼ  )
            bm.verts[i     * NP + j1],   # (θᵢ,   φⱼ₊₁)
            bm.verts[(i+1) * NP + j1],   # (θᵢ₊₁, φⱼ₊₁)
            bm.verts[(i+1) * NP + j ],   # (θᵢ₊₁, φⱼ  )
        ])

bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])`}
      </pre>
      <p>
        Both ends (the columella at θ = 0 and the aperture lip at θ = 2π·N) are
        left open intentionally — the columella is where the shell spire
        converges to its axis, and the aperture is the shell mouth, both
        structurally open in the real animal.  For poi-head use, cap the
        aperture in a second pass with a Solidify → Cap modifier, or use the
        3D Print Toolbox to check printability (see{" "}
        <Link
          href="/tutorials/blender-addon-3d-print-toolbox"
          className={lk}
        >
          3D Print Toolbox tutorial
        </Link>
        ).
      </p>

      <h2>Four morphotype shape keys</h2>
      <p>
        Shape keys store alternate vertex positions on the same mesh topology —
        precisely what Raup&apos;s morphospace offers: the same grid with
        different (W, D, T) values.  The four presets span the main biological
        clades:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`PRESETS = [
    (3.00, 0.30, 0.00, "Ammonite"),     # flat coil, Jurassic flagship
    (2.50, 0.35, 0.08, "Nautilus"),     # slight spire, living cephalopod
    (1.70, 0.12, 1.20, "Cone"),         # moderate tower, cowrie relative
    (1.35, 0.06, 2.80, "Turritella"),   # tall narrow spire, Eocene gastropod
]

# Each preset independently normalised to SCALE_M = 0.12 m
# so the poi head stays consistently sized across all morphotypes.

obj.shape_key_add(name="Basis", from_mix=False)
for W, D, T, sk_name in PRESETS:
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    # fill sk.data[i].co from the normalised Raup surface`}
      </pre>
      <p>
        In the WebXR runtime, morph-target weights animate between 0.0 and 1.0
        per frame — interpolating not just the shell silhouette but every
        individual vertex&apos;s helicoidal position in smooth continuous
        motion.  The Ammonite–Turritella transition is particularly dramatic:
        the flat disc lifts, narrows, and towers over roughly 90 frames.  See
        the analogous shape-key technique in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gielis-superformula-polar-3d-organic-poi-head-webxr"
          className={lk}
        >
          Gielis Superformula tutorial
        </Link>{" "}
        for a direct comparison of how organic parametric surfaces use morph targets.
      </p>

      <h2>Vertex colour — whorl age gradient</h2>
      <p>
        Each vertex carries a normalised θ value in [0, 1] mapping old whorls
        (columella, θ ≈ 0) to magenta and the fresh aperture lip (θ = 2π·N)
        to cyan.  Blender&apos;s{" "}
        <code>color_attributes</code> API (3.3+) replaces the deprecated{" "}
        <code>vertex_colors</code> layer:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ca = me.color_attributes.new(name="Col", type="BYTE_COLOR", domain="CORNER")

t_arr = np.tile(np.linspace(0.0, 1.0, NQ), (NP, 1)).T.flatten()  # (NQ*NP,)

for poly in me.polygons:
    for li in poly.loop_indices:
        vi = me.loops[li].vertex_index
        t  = t_arr[vi]
        ca.data[li].color = (1.0 - t, t, 1.0, 1.0)   # magenta → cyan`}
      </pre>
      <p>
        The same technique colours the Holoflow spiral sculptures — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-phyllotaxis-golden-angle-torus-spiral-sculpture-webxr"
          className={lk}
        >
          Phyllotaxis golden-angle tutorial
        </Link>{" "}
        for how the gradient tracks rotational phase rather than radial age.
      </p>

      <h2>Export conventions</h2>
      <p>
        Before exporting: apply the −90° X rotation (<em>Object → Apply →
        Rotation</em>) so the coiling axis aligns with +Y (Holoflow standard).
        Export settings: Format → glTF Binary (.glb); Draco level 6; include
        Morph Targets and Vertex Colors; WebP textures; snake_case root name{" "}
        <code>raup_shell_poi</code>; apply all transforms.  The parametric
        surface construction method is identical to the catenoid and Enneper
        surface pipeline — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr"
          className={lk}
        >
          Weierstrass–Enneper tutorial
        </Link>{" "}
        for the shared export checklist.
      </p>

      <h2>Failure modes and troubleshooting</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`• Self-intersecting mesh (inner whorls overlap outer)
    → D is too large.  Enforce D < 1 at all times.  At D = 0.5 the inner
      lip touches the coiling axis; at D > 0.5 it crosses to the other side.
    → Reduce N_TURNS: 3 turns keeps the youngest whorl clearly outside the older.

• Shape key positions all zero (key flat at origin)
    → Ensure obj.shape_key_add("Basis") is called BEFORE any morphotype keys.
      Without the Basis key, Blender has no reference frame for the others.

• Vertex colour not visible in Viewport
    → Set Viewport Shading → Color → Vertex.  In Material Preview mode, assign
      a Material with Principled BSDF and set Base Color input to Attribute,
      attribute name "Col".

• export_scene.gltf fails: "Object has no UV map"
    → Disable "Export UVs" in the glTF exporter — this mesh has no UV islands.
      Vertex colour is passed through the COLOR_0 attribute, not a texture.

• Turritella looks like a cone (T too low)
    → Confirm T = 2.8 in PRESETS tuple.  A common mistake is assigning T the
      D slot: remember the order is (W, D, T, name).`}
      </pre>

      <h2>Reusable macro</h2>
      <p>
        The full surface and mesh builder is extracted to{" "}
        <code>
          tools/blender-addon/holoflow_macros/raup_shell.py
        </code>
        .  Import it in any Blender script:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`from holoflow_macros.raup_shell import build_raup_obj

# Nautilus-variant poi head, 4 turns, 240 × 48 resolution
obj = build_raup_obj(2.5, 0.35, 0.08, name="nautilus_poi",
                     N_TURNS=4, NQ=240, NP=48, scale_m=0.12)`}
      </pre>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          Raup, D.M. (1966).{" "}
          <em>Geometric Analysis of Shell Coiling: General Problems.</em>{" "}
          <em>Journal of Paleontology</em> 40(5): 1178–1190.{" "}
          <a
            href="https://doi.org/10.2307/1301507"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            doi.org/10.2307/1301507
          </a>{" "}
          — the foundational paper; the parametric surface equations used here
          are mathematical facts in the public domain.  Related open-access
          resources:{" "}
          <a
            href="https://paleobiodb.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Paleobiology Database (CC-BY 4.0)
          </a>
          ,{" "}
          <a
            href="https://www.biodiversitylibrary.org/bibliography/2913"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Biodiversity Heritage Library
          </a>
          .
        </li>
        <li>
          NumPy community.{" "}
          <em>NumPy</em> (BSD-3-Clause).{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>{" "}
          — vectorised meshgrid, broadcasting, exponential growth via
          {" "}<code>W ** (TH / (2π))</code>.  Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          , SciPy (BSD-3-Clause), matplotlib (PSF).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "40 minutes",
    difficulty: "intermediate",
    cost: "nil — Python + Blender only",
    supplies: {
      materials: [],
      tools: ["Blender 5.1", "numpy (bundled with Blender)"],
    },
    steps: [
      {
        title: "Open Scripting workspace",
        body: "Launch Blender 5.1.  Switch to the Scripting workspace.  Create a new text datablock.  Save the .blend first so that the '//' relative output path in record.py resolves to the correct directory.",
      },
      {
        title: "Paste and run blueprint.py",
        body: "Copy blueprint.py into the Text Editor and press Alt+P.  The console prints vertex count (7 200), face count (6 840), four shape key names, and the vertex colour confirmation.  Expect 2–5 s on a modern CPU.",
      },
      {
        title: "Inspect the base mesh",
        body: "Orbit the 3D Viewport.  With Viewport Shading → Vertex you should see the magenta-to-cyan gradient flowing from the tight inner whorls (columella) out to the wide aperture lip.  The shell opens towards the +Y axis.",
      },
      {
        title: "Explore shape keys",
        body: "Object Properties → Shape Keys panel.  Set Ammonite = 0.0, Turritella = 1.0 and watch the flat disc lift into a narrow tower.  Return both to 0.0 and toggle each preset to compare morphotypes.  These map directly to Raup's morphospace axes.",
      },
      {
        title: "Run record.py",
        body: "Load record.py and press Alt+P.  The script keyframes the four morphotypes over 120 frames and configures Workbench vertex-colour rendering.  Press Ctrl+F12 to render the animation to viewport.mp4 (~2 min render time).",
      },
      {
        title: "Follow SCREEN-RECORDING-NOTES.md",
        body: "Open OBS and set the window source to Blender at 1920 × 1080, 30 fps.  Record the theory explanation, code walkthrough, live run, and shape-key demo per the script in SCREEN-RECORDING-NOTES.md.  Save as screen.mp4.",
      },
      {
        title: "Export GLB",
        body: "File → Export → glTF 2.0 (.glb).  Enable: Draco compression level 6, Morph Targets, Vertex Colors, Apply Transforms.  Set Format to glTF Binary.  Name the file hf_raup_shell.glb and save it alongside the .blend.",
      },
      {
        title: "Verify in Three.js viewer",
        body: "Open the Holoflow Three.js viewer and load hf_raup_shell.glb.  Confirm the shell appears at ~0.24 m diameter, the vertex colour gradient is visible, and all four morph targets appear in the inspector.",
      },
    ],
  },
  {
    slug: SLUG,
    title: TITLE,
    date: "2026-08-08",
    kind: "tutorial",
    excerpt: LEDE,
    Body,
  },
);

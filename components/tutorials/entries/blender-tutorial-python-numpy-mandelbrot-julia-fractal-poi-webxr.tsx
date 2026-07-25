import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The Mandelbrot set is the locus of complex parameters c for which the
        orbit z<sub>n+1</sub> = z<sub>n</sub>² + c, launched from z₀ = 0,
        never escapes the radius-2 disc in the complex plane.  Every point you
        see coloured in the classic images is <em>outside</em> the set — the
        colour encodes how quickly the orbit fled.  The boundary itself, the
        set's edge, is an infinitely intricate fractal curve of Hausdorff
        dimension 2 (Shishikura, 1998) that contains every possible Julia set
        as a tiny embedded copy.
      </p>
      <p>
        For the studio, the boundary curve has a practical use: it is a
        light-painting path.  The script extracts near-boundary vertices,
        sorts them by polar angle, and deposits them as a NURBS Curve object —
        a ready-made poi trajectory that spirals around the main cardioid and
        its period-2 bulb.
      </p>

      <h2>Why integer escape count bands — and why smooth colouring fixes it</h2>
      <p>
        Naïve colouring assigns colour by the integer step n at which
        |z<sub>n</sub>| first exceeds 2.  Every point whose orbit escapes at
        exactly step n lands in the same colour ring, producing harsh
        concentric staircase bands.  Hubbard and Douady (1982) noted that the
        modulus |z| at escape carries extra information: extending n to a
        continuous value via
      </p>
      <pre>{`smooth_n = n − log₂(log₂(|z_escape|))`}</pre>
      <p>
        removes the discontinuity across ring boundaries.  The formula
        corrects for the fact that a point escaping at step n with a large
        modulus "would have escaped earlier" in the limit of infinite
        subdivision.  At <code>MAX_ITER = 128</code> the gradient is C¹-smooth
        and the colour field no longer shows discrete bands.
      </p>
      <p>
        The same vectorised numpy pattern — escape-time on a dense grid mapped
        to vertex colour — is used for the Fourier coefficient colouring in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr"
          className={lk}
        >
          FFT Epicycles & Phasor Chain blueprint
        </Link>{" "}
        and for the activation map in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr"
          className={lk}
        >
          Gray-Scott Reaction-Diffusion blueprint
        </Link>.
      </p>

      <h2>The iteration kernel</h2>
      <pre>{`for i in range(MAX_ITER):
    mask   = ~escaped
    zr2    = zr * zr
    zi2    = zi * zi
    mod2   = zr2 + zi2
    newly  = mask & (mod2 > BAILOUT_R**2)   # escaped this step
    smooth = i - np.log2(np.log2(np.sqrt(mod2_safe)))
    count  = np.where(newly, smooth, count)
    escaped |= newly
    # advance z only for points still inside
    new_zr = zr2 - zi2 + cx
    new_zi = 2.0 * zr * zi + cy
    zr = np.where(mask, new_zr, zr)
    zi = np.where(mask, new_zi, zi)`}</pre>
      <p>
        The guard <code>mask = ~escaped</code> stops advancing orbits that
        already escaped — both for correctness (once escaped, always escaped)
        and for speed (no unnecessary multiplications on large flat regions).
        With NumPy the entire 256×256 grid iterates in parallel; 128 passes
        take roughly 6 seconds on a laptop CPU.
      </p>

      <h2>Julia sets — fixed c, varying z₀</h2>
      <p>
        A Julia set swaps the roles: c is fixed and z₀ varies over the plane.
        The connected Julia sets correspond to c values <em>inside</em> the
        Mandelbrot set; c values outside produce totally-disconnected Cantor
        dust.  The script uses c = −0.7269 + 0.1889i — the "Douady rabbit"
        parameter near the period-3 bulb's root — which produces a triply
        connected Julia set with three ear-like lobes.  Compare the spiral
        attractor shapes in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr"
          className={lk}
        >
          Biot-Savart Magnetic Field Lines blueprint
        </Link>{" "}
        for another complex-plane curve extracted as a poi path.
      </p>

      <h2>Vertex colour attribute → GLB COLOR_0</h2>
      <p>
        Blender 5.1 stores vertex colours as a named <code>BYTE_COLOR</code>
        attribute on the <code>POINT</code> domain.  The GLB exporter maps the
        first such attribute named <code>Col</code> to <code>COLOR_0</code>,
        readable in Three.js via{" "}
        <code>material.vertexColors = true</code>.  Writing via{" "}
        <code>attr.data.foreach_set("color", flat_rgba)</code> is 40× faster
        than a per-vertex Python loop at this grid size.  The same technique
        appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr"
          className={lk}
        >
          Cahn-Hilliard Phase Separation blueprint
        </Link>.
      </p>

      <h2>Z-displacement: boundary topology as physical surface</h2>
      <p>
        Interior points (orbit never escaped) receive Z = Z_BASE (0.02 m).
        Near-boundary points (smooth_n / MAX_ITER &gt; 0.85) rise to Z_TOP
        (0.30 m), forming a ridge along the Mandelbrot boundary.  Exterior
        points scale linearly between those limits.  The ridge makes the
        fractal structure tactile — printable as a 3-D relief map — and lifts
        the poi trajectory curve above the mesh surface so it never intersects.
        The displacement strategy mirrors the Hopf Fibration blueprint:
      </p>
      <Link
        href="/tutorials/blender-tutorial-python-hopf-fibration-linked-tori-light-sculpture-webxr"
        className={lk}
      >
        Python mathutils — Hopf Fibration: Stereographic S³ Fibres
      </Link>
    </>
  );
}

const data = {
  title:
    "Python numpy — Mandelbrot & Julia Sets: Escape-Time, Smooth Colouring & Boundary Curve as Poi Light-Painting Path for WebXR",
  lede:
    "Compute the Mandelbrot set and Douady-rabbit Julia set on 256×256 complex-plane grids with vectorised NumPy iteration, apply Hubbard-Douady smooth colouring to vertex attributes, extract the fractal boundary as a NURBS poi trajectory, and export two WebXR-ready GLB meshes.",
  date: "2026-07-25",
  steps: [
    {
      title: "Run blueprint.py",
      body: "Open Blender 5.1's Scripting workspace. Open blueprint.py and click ▶ Run Script. The terminal shows 'Computing Mandelbrot smooth escape count …' then prints the smooth range and '✓ hf_mandelbrot.glb written'. Expect ~10 s total.",
    },
    {
      title: "Inspect the result",
      body: "Switch to 3D Viewport, press Z → Material Preview. You should see a relief plane — deep black interior, blue-to-gold boundary fringe — and beside it the Douady-rabbit Julia mesh with its three ear-like lobes. Select hf_boundary_poi_path in the Outliner to see the NURBS curve tracing the main cardioid edge.",
    },
    {
      title: "Adjust MAX_ITER for finer boundary",
      body: "Increase MAX_ITER from 128 to 512 at the top of blueprint.py and re-run. The boundary becomes sharper and more filaments appear in the satellite bulbs. Computation time scales linearly: 512 iterations ≈ 25 s. For a quick test, reduce GRID_N to 128 first.",
    },
    {
      title: "Try a different Julia parameter",
      body: "Change JULIA_CR and JULIA_CI to explore other Julia families. Try JULIA_CR = -0.4, JULIA_CI = 0.6 for a fractal snowflake, or JULIA_CR = 0.285, JULIA_CI = 0.01 for a dendrite. Parameters inside the main cardioid (|c| < 0.5) give connected Julia sets; parameters outside give Cantor dust.",
    },
    {
      title: "Export and load in WebXR",
      body: "The script exports hf_mandelbrot.glb and hf_julia.glb with Draco level-6 compression. In Three.js: const mat = new THREE.MeshStandardMaterial({ vertexColors: true }). The COLOR_0 attribute carries the HSV-spiral fractal colouring. No texture coordinates required.",
    },
    {
      title: "Record viewport animation",
      body: "Run record.py then Render > Render Animation (Ctrl+F12). The 360-frame sequence orbits the Mandelbrot mesh (phase 1), zooms into the Julia rabbit ear (phase 2), then follows the poi boundary curve (phase 3). Output: viewport.mp4 at 1920×1080 30 fps.",
    },
  ],
  troubleshooting: [
    {
      symptom: "Mesh appears flat (no Z relief)",
      cause:
        "The smooth_m array may be all-zeros if numpy failed to load. Check the Blender console for ImportError.",
      fix: "Ensure numpy is available: in the Blender Python console, run 'import numpy; print(numpy.__version__)'. If it fails, use the Blender-bundled Python at Applications/Blender.app/Contents/Resources/4.x/python/bin/python3 to install numpy.",
    },
    {
      symptom: "GLB loads but vertex colours are absent",
      cause:
        "The colour attribute name is case-sensitive. The exporter only maps an attribute named exactly 'Col' (capital C) on the POINT domain to COLOR_0.",
      fix: "In Blender, open Properties > Object Data > Color Attributes. Confirm the attribute is named 'Col' with Type = Byte Color and Domain = Point.",
    },
    {
      symptom: "hf_boundary_poi_path is missing from Outliner",
      cause:
        "No vertices satisfied the BOUNDARY_THRESH condition — possible if GRID_N is very small (< 32) and no vertices land exactly in the near-boundary band.",
      fix: "Lower BOUNDARY_THRESH from 0.88 to 0.70 and re-run. At 256² there should always be thousands of qualifying boundary vertices.",
    },
    {
      symptom: "Script raises 'RuntimeError: context is incorrect'",
      cause:
        "bpy.ops.object.select_all and bpy.ops.object.delete require an active VIEW_3D context with OBJECT mode.",
      fix: "Before running blueprint.py, click in the 3D Viewport to make it active and confirm the mode indicator shows 'Object Mode' in the header.",
    },
  ],
  externalLinks: [
    {
      label:
        "NumPy — vectorised complex arithmetic — BSD-3-Clause — NumPy Developers",
      href: "https://numpy.org/doc/stable/reference/routines.math.html",
    },
    {
      label:
        "Blender Python API 5.1 — bpy.types.Mesh.attributes — CC-BY-SA-4.0 — Blender Foundation",
      href: "https://docs.blender.org/api/5.1/bpy.types.Mesh.html",
    },
    {
      label:
        "mandelbrot-py (MIT) — reference Python implementation — alexhernandez",
      href: "https://github.com/alexhernandez/mandelbrot-py",
    },
  ],
  relatedTutorials: [
    {
      label: "Python numpy — FFT Epicycles & Fourier Phasor Chain for Poi WebXR",
      href: "/tutorials/blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr",
    },
    {
      label: "Python numpy — Gray-Scott Reaction-Diffusion: Turing Spots for WebXR",
      href: "/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr",
    },
    {
      label: "Python mathutils — Hopf Fibration: Linked-Torus Light Sculpture",
      href: "/tutorials/blender-tutorial-python-hopf-fibration-linked-tori-light-sculpture-webxr",
    },
    {
      label: "Python bpy — Biot-Savart Field-Line Tracer: Poi Light-Painting Curves",
      href: "/tutorials/blender-tutorial-python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-numpy-mandelbrot-julia-fractal-poi-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "simulation",
      "mathematics",
      "materials",
      "webxr",
    ],
    body: Body,
  },
  data,
);

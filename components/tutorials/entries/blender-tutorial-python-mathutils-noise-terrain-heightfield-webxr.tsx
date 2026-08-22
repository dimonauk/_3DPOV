import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every Blender noise texture — Musgrave, Perlin, Voronoi — is backed by
        a C implementation that is also exposed directly to Python through the{" "}
        <code>mathutils.noise</code> module. This is not a thin wrapper: it is
        the exact same code path, accessible at script time so you can generate
        deterministic height-fields, bake them into static vertex attributes,
        and run downstream Python logic (slope thresholding, A* pathfinding,
        river-network seeding) before the GLB ever leaves the workstation. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-position-noise-displacement"
          className={lk}
        >
          GN Noise Displacement tutorial
        </Link>{" "}
        covers the GPU-evaluated, non-destructive equivalent; this tutorial
        covers the Python side where you need random grid access, gradient
        computation, or typed custom accessors in the exported GLB.
      </p>

      <p>
        The fundamental limitation of the GN Noise Texture node is that it
        evaluates lazily per domain element — you cannot, within the graph,
        look at a neighbouring vertex&apos;s value to compute a derivative.{" "}
        Slope (gradient magnitude) requires exactly that: central differences
        across a structured grid, which is a random-access pattern. By baking
        the noise to a Python list first, the central-difference pass becomes
        trivial. The slope attribute it produces is the primary driver for
        material zone boundaries, physics material assignment, and LOD switching
        in the WebXR runtime — steep faces get rock colour and rigid physics;
        gentle slopes get grass colour and soft-body terrain. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-shortest-edge-paths-watershed-river-network"
          className={lk}
        >
          Watershed River Network tutorial
        </Link>{" "}
        uses <code>mathutils.noise.fractal()</code> incidentally for terrain
        generation; this tutorial treats the noise module as the primary subject.
      </p>

      <h2>The mathutils.noise function taxonomy</h2>
      <p>
        The module exposes eight surface-level functions and three low-level
        helpers. Knowing which to reach for saves a great deal of parameter
        experimentation:
      </p>
      <ul>
        <li>
          <strong>noise(pos, noise_basis)</strong> — single octave, range
          approximately −1 to 1. Fast but alias-prone at low frequency; use only
          as a cheap perturbation input to another function.
        </li>
        <li>
          <strong>turbulence(pos, octaves, hard, noise_basis, amp, freq)</strong>{" "}
          — FBM with configurable amplitude and frequency scales per octave.{" "}
          <code>hard=True</code> applies absolute value to each octave, producing
          sharp ridges (dunes, ocean waves).
        </li>
        <li>
          <strong>fractal(pos, H, lacunarity, octaves, noise_basis)</strong> —
          classic fractional Brownian motion. H is the Hurst exponent: 0 = random
          uncorrelated noise, 1 = nearly smooth surface. Lacunarity is the
          frequency multiplier between octaves; 2.0 is the canonical value,
          2.1 slightly reduces spectral periodicity artefacts.
        </li>
        <li>
          <strong>
            hetero_terrain(pos, H, lacunarity, octaves, offset, noise_basis)
          </strong>{" "}
          — heterogeneous terrain. The offset parameter modulates each octave&apos;s
          amplitude by the current height accumulator: where the accumulator is
          near zero (valleys), subsequent octaves are suppressed; where it is
          large (crests), they are amplified. The result is smooth marshland
          and craggy ridgelines — exactly what photorealistic mountain terrain
          looks like. This is the best general-purpose choice for anything meant
          to read as geological.
        </li>
        <li>
          <strong>
            ridged_multi_fractal(pos, H, lacunarity, octaves, offset, gain,
            noise_basis)
          </strong>{" "}
          — inverts each octave (1 − |noise|) before accumulating, producing
          sharp ridges separated by smooth valleys. Best for mountain chains
          and canyon networks.
        </li>
        <li>
          <strong>
            hybrid_multi_fractal(pos, H, lacunarity, octaves, offset, gain,
            noise_basis)
          </strong>{" "}
          — combines ridged accumulation with FBM smoothing. The result has both
          broad smooth regions and localised ridge detail — useful for eroded
          plateaux.
        </li>
        <li>
          <strong>cell(pos) → float [0,1]</strong> — Worley cell noise. Blocky,
          distinctly non-geological; useful for stylised mesa terrain or
          crystal-face patterns.
        </li>
        <li>
          <strong>voronoi(pos, distance_metric, exponent)</strong> — returns a
          list <code>[F1, F2, F3, F4, pos, colour]</code>. F2 − F1 produces
          vein or crack patterns useful for rock strata or dried mud.
        </li>
      </ul>

      <h2>Noise basis options</h2>
      <p>
        All multi-octave functions accept a <code>noise_basis</code> string
        selecting the single-octave primitive beneath the accumulation loop.
        <code>'PERLIN_ORIGINAL'</code> (1985 gradient noise) is the best
        general-purpose terrain default — its slight axis-aligned bias reads
        as natural rock structure. <code>'PERLIN_NEW'</code> is marginally more
        isotropic. <code>'VORONOI_CRACKLE'</code> produces deeply fractured
        desert terrain when combined with <code>hetero_terrain</code>.{" "}
        <code>'CELLNOISE'</code> yields extreme blocky terracing for voxel
        art direction.
      </p>
      <h2>Central differences and the slope attribute</h2>
      <p>
        The blueprint stores the raw noise output as a Python list indexed by
        vertex index before applying Z displacement. The helper{" "}
        <code>_e(r, c)</code> looks up normalised elevation by grid row and
        column, clamping at borders to replicate the forward/backward
        difference at edges. The central-difference formula gives the gradient
        vector at each interior vertex:
      </p>
      <pre>
        <code>{`dh_dx = (_e(r, c+1) - _e(r, c-1)) / (2 * step)
dh_dy = (_e(r+1, c) - _e(r-1, c)) / (2 * step)
slope  = sqrt(dh_dx**2 + dh_dy**2)`}</code>
      </pre>
      <p>
        <code>step</code> is the physical metre distance between adjacent grid
        vertices. Dividing by it converts the dimensionless elevation difference
        into a true gradient (rise/run in m/m). The resulting slope values are
        normalised by the grid maximum before storage so the attribute always
        occupies the full [0, 1] range regardless of terrain height.
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-geometry-kdtree-bvhtree-spatial"
          className={lk}
        >
          KDTree &amp; BVHTree spatial tutorial
        </Link>{" "}
        covers the complementary case: when you need nearest-surface queries
        rather than grid-structured gradient computation.
      </p>

      <h2>Named attributes and GLB export</h2>
      <p>
        Blender 5.1 exports named mesh attributes as custom glTF accessors when{" "}
        <code>export_attributes=True</code> is passed to{" "}
        <code>bpy.ops.export_scene.gltf()</code>. FLOAT domain attributes are
        prefixed with an underscore in the accessor name (e.g.{" "}
        <code>_ELEVATION</code>), which satisfies the glTF spec rule that custom
        accessors must begin with an underscore. FLOAT_COLOR attributes on the
        POINT domain are written as the standard <code>COLOR_0</code> accessor.
        In Three.js after <code>GLTFLoader</code>:
      </p>
      <pre>
        <code>{`const elev  = mesh.geometry.attributes['_ELEVATION'];  // Float32BufferAttribute
const slope = mesh.geometry.attributes['_SLOPE'];
// one float per vertex; index matches geometry.index if mesh is indexed`}</code>
      </pre>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          Depsgraph batch export tutorial
        </Link>{" "}
        covers a more involved export pipeline where the evaluated depsgraph is
        read before export; here the mesh is already a static data-block so no
        depsgraph evaluation is required.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>
            <code>_ELEVATION</code> accessor missing from the GLB.
          </strong>{" "}
          Confirm <code>export_attributes=True</code> is present — it defaults
          to False and is not surfaced in the Export dialog. Verify the
          attribute name in the Spreadsheet Editor; Blender exports the name
          exactly as stored.
        </li>
        <li>
          <strong>Terrain looks tiled or repeating.</strong>{" "}
          Lower <code>NOISE_SCALE</code> (e.g. 0.25) to zoom into a smaller
          region of noise space, or increase <code>LACUNARITY</code> to spread
          high-frequency detail further.
        </li>
        <li>
          <strong>All vertices the same colour zone.</strong>{" "}
          <code>h_range</code> is near zero — the noise returned a nearly flat
          field. This happens if <code>NOISE_SCALE</code> is below 0.05 or
          OCTAVES is 1. Increase either.
        </li>
        <li>
          <strong>Slope map looks scrambled.</strong>{" "}
          The row-major vertex layout (<code>v[r * GRID_X + c]</code>) is stable
          in Blender 4.x and 5.1 but undocumented. Print a few{" "}
          <code>mesh.vertices[i].co</code> values to verify the row/col mapping
          empirically if the result looks wrong.
        </li>
        <li>
          <strong>
            <code>Specular IOR Level</code> KeyError.
          </strong>{" "}
          Blender 5.1 renamed the legacy <code>Specular</code> Principled BSDF
          input to <code>Specular IOR Level</code>. Older snippets using{" "}
          <code>inputs[&apos;Specular&apos;]</code> raise KeyError.
        </li>
      </ul>

      <h2>Outside References</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/current/mathutils.noise.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender Python API — mathutils.noise
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation) — complete signatures for all
          eight terrain functions, basis strings, and return types. Related:
          the Blender Foundation also maintains the{" "}
          <a
            href="https://docs.blender.org/api/current/mathutils.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            full mathutils API reference
          </a>{" "}
          covering KDTree and BVHTree alongside noise.
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT, Nicolas Janakiev) — practical Blender Python patterns including
          procedural mesh generation. The{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting/blob/master/scripts"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            scripts/
          </a>{" "}
          folder contains noise-based displacement examples that complement the
          approach taken here.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-mathutils-noise-terrain-heightfield-webxr",
  title:
    "Python mathutils.noise — Procedural Terrain Heightfield & Gradient Attributes for WebXR (Blender 5.1)",
  libraryPath:
    "blends/scripting/python-mathutils-noise-terrain-heightfield-webxr",
  date: "2026-07-05",
  body: Body,
  tags: [
    "blender",
    "python",
    "scripting",
    "noise",
    "terrain",
    "mathutils",
    "attributes",
    "webxr",
    "glb",
  ],
});

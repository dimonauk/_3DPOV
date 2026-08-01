import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr";

const TITLE =
  "Python scipy — Centroidal Voronoi Tessellation: Lloyd's Algorithm on S², SphericalVoronoi & Faceted Crystal Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "A Voronoi diagram partitions S² into N convex spherical-polygon cells. When every generator point coincides with the centroid of its own cell the diagram is centroidal — a CVT. Lloyd's algorithm reaches this optimum by iterating: build diagram, move each generator to its cell's centroid, repeat. The converged result distributes N points with near-uniform spacing, producing a faceted sphere whose cell structure approximates the densest packing of N equal spherical caps. This tutorial implements that algorithm in pure Python using scipy.spatial.SphericalVoronoi, builds the resulting mesh in Blender 5.1, and exports a Draco-6 GLB for WebXR.";

function Body() {
  return (
    <>
      <p>
        Voronoi diagrams appear in crystallography (Wigner-Seitz cells), cell
        biology (tissue packing), geography (Thiessen polygons), and faceted gem
        shaders. Wherever you need to partition a sphere into roughly equal
        regions — poi head sensor zones, a tiled globe, a 3D-print support
        hemisphere — a CVT is the mathematically optimal answer.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-dual-mesh-voronoi-cell-sphere"
          className={lk}
        >
          GN Dual Mesh Voronoi Cell Sphere
        </Link>{" "}
        tutorial achieves a visually similar result inside Geometry Nodes — fast
        and non-destructive but fixed to icosphere topology. The Python route here
        gives exact control over generator count, convergence criterion, inset
        width, and recess depth. For the fractal counterpart to uniform cell
        coverage, see{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-apollonian-circle-packing-soddy-descartes-stage-floor-webxr"
          className={lk}
        >
          Apollonian Circle Packing
        </Link>
        .
      </p>

      <h2>Mathematics: Voronoi on S²</h2>
      <p>
        Given N generator points{" "}
        <strong>g₁ … g_N ∈ S²</strong>, the Voronoi cell of{" "}
        <strong>g_i</strong> is the set of all points on S² closer to{" "}
        <strong>g_i</strong> than to any other generator, where distance is
        geodesic (arc length). Boundaries between adjacent cells are arcs of
        great circles.
      </p>
      <p>
        The <strong>centroid</strong> of a spherical polygon is the normalised
        mean of its boundary vertices. (For small cells covering less than 5% of
        S² this equals the spherical centroid to within 0.1%; larger cells need
        the exact area-weighted formula.) A CVT satisfies:
      </p>
      <pre>
        <code>{`g_i = normalise( mean(vertices of region_i) )`}</code>
      </pre>
      <p>
        Lloyd's algorithm converges to this fixed point because each step
        reduces the total quantisation distortion (sum of squared geodesic
        distances from every point to its generator). Du, Faber and Gunzburger
        (1999) proved convergence for bounded domains; the proof extends to S²
        by compactness.
      </p>

      <h2>Why Fibonacci seeding?</h2>
      <p>
        Random seeds cluster: N uniform random points on S² leave gaps of order
        1/√N with ~37% probability. A Fibonacci lattice (azimuth{" "}
        <em>i · 2π/φ²</em>, elevation <em>arcsin(-1 + 2i/N)</em>) gives
        near-uniform spacing — halving Lloyd iterations to 8–12 versus 20–25
        from random.
      </p>

      <h2>scipy.spatial.SphericalVoronoi</h2>
      <p>
        scipy's implementation uses a modified Fortune's sweep adapted to the
        sphere, producing the dual of the spherical Delaunay triangulation. Each
        region&#39;s boundary vertices are the circumcentres of adjacent
        Delaunay triangles, already sorted counterclockwise around the region.
        Calling <code>sort_vertices_of_regions()</code> guarantees this ordering
        before you iterate.
      </p>
      <pre>
        <code>{`from scipy.spatial import SphericalVoronoi
import numpy as np

sv = SphericalVoronoi(generators, radius=1.0, center=np.zeros(3))
sv.sort_vertices_of_regions()

for i, region in enumerate(sv.regions):
    verts = sv.vertices[region]   # shape (n_v, 3), sorted CCW
    centroid = verts.mean(axis=0)
    centroid /= np.linalg.norm(centroid)
    generators[i] = centroid`}</code>
      </pre>

      <h2>Mesh construction: inset → extrude</h2>
      <p>
        For each Voronoi region the sorted vertices define a convex spherical
        polygon. Two operations give the faceted gem aesthetic:
      </p>
      <ol>
        <li>
          <strong>Inset:</strong>{" "}
          <code>
            inset_v = v * (1 - FACE_INSET) + centroid * FACE_INSET
          </code>{" "}
          — linear interpolation shrinks the polygon toward its centroid by 10%,
          creating a visible gap (grout line) between adjacent cells. This is
          equivalent to the <em>Inset Faces</em> operation in Edit Mode but
          performed per-vertex in Python before the bmesh face is added.
        </li>
        <li>
          <strong>Extrude + translate:</strong>{" "}
          <code>bmesh.ops.extrude_face_region</code> duplicates the face with
          side walls, then each extruded vertex is translated{" "}
          <code>-normal * EXTRUDE_DEPTH</code> — carving a shallow recess that
          catches light at grazing angles and makes the boundary walls visible.
        </li>
      </ol>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr"
          className={lk}
        >
          Cotangent Laplacian Mesh Fairing
        </Link>{" "}
        tutorial covers the same scipy dependency for mesh-smoothing; if you
        have that working, this tutorial&#39;s scipy install is already satisfied.
      </p>

      <h2>Step-by-step</h2>
      <ol>
        <li>
          Open Blender 5.1 → Scripting workspace → paste or open{" "}
          <code>blueprint.py</code>.
        </li>
        <li>
          Install scipy if not present (run once in Blender&#39;s Python):
          <pre>
            <code>{`import subprocess, sys
subprocess.run([sys.executable, "-m", "pip", "install", "scipy"])`}</code>
          </pre>
        </li>
        <li>
          Press <strong>Run Script</strong>. Watch the System Console for Lloyd
          convergence — expect ~12 iterations with the Fibonacci seed.
        </li>
        <li>
          Switch viewport to <strong>Material Preview</strong> — the faceted poi
          head appears with navy→violet→cyan emission.
        </li>
        <li>
          Inspect grout lines with <strong>Orbit + middle mouse</strong>. The gap
          between cells should be uniform across the sphere. If it&#39;s uneven,
          increase <code>LLOYD_ITERS</code> or reduce <code>CONVERGENCE_T</code>.
        </li>
        <li>
          The script auto-exports <code>hf_cvt_poi_head.glb</code>. Verify
          Draco-6 compression in{" "}
          <a
            href="https://gltf-viewer.donmccurdy.com/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Don McCurdy&#39;s glTF Viewer
          </a>
          .
        </li>
        <li>Run <code>record.py</code> → 6-second 360° <code>viewport.mp4</code>.</li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>ImportError: scipy not found</strong> — Blender&#39;s Python is
          isolated; pip-install into its own interpreter at{" "}
          <code>blender-path/python/bin/python3.xx</code>.
        </li>
        <li>
          <strong>Missing faces</strong> — numerically identical generators
          produce zero-area regions that are silently skipped. Add jitter:{" "}
          <code>generators += np.random.randn(*generators.shape) * 1e-6</code>.
        </li>
        <li>
          <strong>GLB inside-out</strong> — the script calls{" "}
          <code>bmesh.ops.recalc_face_normals</code> automatically. If you edit
          the mesh afterwards use{" "}
          <strong>Mesh → Normals → Recalculate Outside</strong>.
        </li>
        <li>
          <strong>Convergence stalls</strong> — degenerate seeds (generators
          clustered on one hemisphere) can oscillate. The Fibonacci seed avoids
          this; for custom seeds add jitter after 20 iterations.
        </li>
      </ul>

      <h2>Variants</h2>
      <ul>
        <li>
          <strong>N = 12</strong> — dodecahedron-like shape. Compare with the{" "}
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr"
            className={lk}
          >
            Geodesic Sphere
          </Link>{" "}
          (its dual is the same near-dodecahedron).
        </li>
        <li>
          <strong>Weighted CVT</strong> — seed generators at VRM mesh vertices,
          weight centroid by face area. Cells adapt to mesh density: finer facets
          near facial features, coarser on the cranium.
        </li>
        <li>
          <strong>Splat source</strong> — run CVT over a point cloud from a
          real poi head scan; use cell centroids as Gaussian splat seeds for a
          hybrid mesh + splat WebXR asset.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Du, Q., Faber, V., and Gunzburger, M. (1999).{" "}
          <em>
            Centroidal Voronoi Tessellations: Applications and Algorithms.
          </em>{" "}
          SIAM Review 41(4): 637–676. PD-mathematical.{" "}
          <a
            href="https://doi.org/10.1137/S0036144599352836"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            doi.org/10.1137/S0036144599352836
          </a>
          . Related project:{" "}
          <a
            href="https://www.siam.org/journals/sirev"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            SIAM Review
          </a>
          .
        </li>
        <li>
          SciPy Developers (2024).{" "}
          <em>scipy.spatial.SphericalVoronoi.</em> BSD-3-Clause.{" "}
          <a
            href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.SphericalVoronoi.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.scipy.org
          </a>
          . Related project:{" "}
          <a
            href="https://github.com/scipy/scipy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/scipy/scipy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-01",
  tags: ["blender", "scripting", "python", "scipy", "voronoi", "geometry", "webxr", "low-poly"],
  body: Body,
  libraryPath:
    "blends/scripting/python-scipy-spherical-voronoi-lloyd-cvt-faceted-poi-head-webxr",
});

export { entry as blenderTutorialPythonScipySphericalVoronoiLloydCvtFacetedPoiHeadWebxrEntry };

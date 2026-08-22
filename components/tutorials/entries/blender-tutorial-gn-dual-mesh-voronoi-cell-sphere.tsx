import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnDualMeshVoronoiCellSphereBody() {
  return (
    <>
      <p>
        The <strong>Dual Mesh</strong> node performs a classical operation from
        combinatorial topology: it inverts the incidence structure of a mesh so
        that every original face becomes a vertex and every original vertex
        becomes a face.  Applied to a uniformly-triangulated sphere this is not
        merely a pattern approximation — it is the exact <em>spherical Voronoi
        tessellation</em> of the original vertex set, computed entirely through
        topology.  No distance query, no Delaunay structure, no add-on: one
        node, two seconds.  Perturbing the sphere&apos;s vertices with a noise
        texture <em>before</em> dualising propagates irregularity into the
        cell shapes because the face centres of the perturbed triangles move
        tangentially, enlarging some cells and shrinking their neighbours — all
        with a single float parameter.
      </p>

      <p>
        The pipeline begins with a{" "}
        <code>MeshIcoSphere</code> at subdivision level 3, which has 1 280
        triangular faces and 642 vertices.  A{" "}
        <code>ShaderNodeTexNoise</code> sampled at each vertex&apos;s{" "}
        <code>Position</code> (object space, so the pattern is stable when the
        object moves) produces a scalar <code>Fac</code> in [0, 1].  A{" "}
        <code>ShaderNodeMath(MULTIPLY)</code> node scales that by{" "}
        <code>NOISE_STRENGTH</code> (default 0.08 m), and a{" "}
        <code>ShaderNodeVectorMath(SCALE)</code> node then scales the{" "}
        <em>Normal</em> field by that float, yielding a per-vertex displacement
        vector pointing radially outward.  Critically, this is a radial
        displacement — yet the topological effect on the dual is tangential,
        because moving a vertex radially repositions the three face centres of
        its adjacent triangles in the tangent plane.  The dual face (originally
        a hexagon or pentagon around that vertex) stretches and deforms
        accordingly.  Set NOISE_STRENGTH to 0.0 and you recover the textbook
        geodesic dome dual: 12 pentagons and 630 hexagons, the same as a
        truncated icosahedron at this subdivision level, topologically
        equivalent to a fullerene.{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-topology-vertex-valence-heat-map"
          className={lk}
        >
          The vertex-valence heat-map tutorial
        </Link>{" "}
        explains why all 12 pentagons are a topological requirement: on a
        genus-0 surface Euler&apos;s formula forces a deficit of 12 faces
        relative to a pure hexagonal tiling, regardless of the triangulation
        density.
      </p>

      <p>
        After <code>DualMesh</code> the output mesh has 642 polygonal faces
        (the cells) and 1 280 vertices (the original face centres).  Two nodes
        shape the tile aesthetics.  <code>ScaleElements</code> in{" "}
        <code>FACE</code> domain with{" "}
        <code>Scale = CELL_SCALE</code> (default 0.87) scales every face toward
        its <em>own</em> centroid independently — the Center socket is left
        disconnected, which tells Blender to use per-element centres
        automatically, not a global pivot.  Setting Scale to 1.0 makes adjacent
        cells share edges (no gap); lowering it below 0.85 produces a visually
        strong grooved surface useful for dragon-scale or sci-fi armour. Compare
        the gap-driven aesthetic here with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-for-each-element-hex-panel"
          className={lk}
        >
          hex-panel tutorial
        </Link>
        , which achieves a similar look through explicit per-face extrusion
        inside a For Each loop rather than the topological route.  The
        GN-Dual-Mesh approach is faster (no iteration), but the For Each route
        gives per-cell control over height and colour, which the topology-only
        path does not.
      </p>

      <p>
        <code>ExtrudeMesh</code> in <code>FACES</code> mode with{" "}
        <code>Individual Faces = True</code> then raises each scaled tile as a
        separate solid.  The <em>Individual Faces</em> input is a boolean
        socket — it is not a property of the node, so it must be driven as a
        field or set via <code>default_value</code> in the bpy API.  Setting it
        to False extrudes the outer boundary of the entire selection as a
        shell; the walls between adjacent cells are omitted and the gap from
        ScaleElements becomes hollow rather than grooved — a completely
        different effect.  <code>SetShadeSmooth(False)</code> forces flat
        per-face shading, which suits the studio&apos;s faceted aesthetic and
        keeps the tile edges visually crisp at WebXR render distances.  For
        smooth organic cells (e.g., soap bubble foam), swap to True and add a
        Smooth by Angle node at the same position; see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-realize-instances-crystal-grotto"
          className={lk}
        >
          crystal grotto tutorial
        </Link>{" "}
        for the smooth-facet blend used on crystal growth surfaces.
      </p>

      <p>
        <strong>Failure modes and gotchas.</strong>{" "}
        The Dual Mesh node requires a manifold, closed triangulation.  If you
        feed it a mesh with boundary edges (a half-sphere, a flat disc),
        enabling <code>Keep Boundaries = True</code> preserves the boundary
        loop in the output — but the boundary cells will be n-gons with
        potentially very high vertex counts, and ScaleElements may scale them
        to degenerate triangles.  Always close the mesh or clip the dual output
        with a <code>DeleteGeometry</code> node to remove boundary cells.
        Another trap: <code>DualMesh</code> requires the input to be
        triangulated.  Quads and n-gons in the input produce n-gon faces in the
        dual where you expect hexagons; always <code>TriangulateMesh</code>{" "}
        (or use an Ico Sphere which is already a triangulation) before the Dual
        Mesh node.  The <code>SeedIcoSphere</code> alternative — a UV sphere
        run through <code>GeometryNodeTriangulateMesh</code> — works, but the
        non-uniform pole triangulation creates elongated cells at the poles;
        the ico sphere&apos;s face uniformity is the reason to prefer it.
      </p>

      <p>
        <strong>Extensions and studio applications.</strong>{" "}
        Driving NOISE_STRENGTH with a time-varying{" "}
        <em>W offset</em> in a 4D noise texture animates the cell pattern as a
        breathing, morphing surface — effective for character skin effects,
        lava-lamp geometry, and reactive AR overlays.  Storing a{" "}
        <code>StoreNamedAttribute</code> (FLOAT, face domain) with the raw
        noise Fac value before dualising gives a per-cell scalar you can read
        in the material with a <code>ShaderNodeAttribute</code> node, enabling
        per-cell colour variation (hot and cold cells) without any extra
        instancing.  For 3D-print output, apply transforms, check that
        ExtrudeMesh depth is ≥ 0.8 mm for your printer&apos;s minimum feature
        size, and use the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-3d-print-mesh-analysis"
          className={lk}
        >
          3D print mesh analysis script
        </Link>{" "}
        to validate manifold integrity before exporting STL.  The{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/dual_mesh.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender manual Dual Mesh reference
        </a>{" "}
        (CC-BY-SA 4.0, Blender Foundation) documents the Keep Boundaries
        option and the input requirements.  The{" "}
        <a
          href="https://github.com/nortikin/sverchok"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Sverchok add-on
        </a>{" "}
        (MIT, Nikita Gorodetskiy et al.) provides a{" "}
        <code>Voronoi on Sphere</code> node that uses Fortune&apos;s sweep
        algorithm rather than the topological-dual route — comparing the two
        outputs at the same point density reveals the difference between a
        true Euclidean Voronoi (equal-area cells) and the topology-driven
        approximation (area varies with triangle size).  For most visual work
        the topology route is indistinguishable and far faster.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-gn-dual-mesh-voronoi-cell-sphere",
  title:
    "GN Dual Mesh — Procedural Voronoi Cell Sphere (Blender 5.1)",
  tags: [
    "blender",
    "geometry-nodes",
    "dual-mesh",
    "voronoi",
    "ico-sphere",
    "scale-elements",
    "extrude-mesh",
    "topology",
    "faceted",
    "glb",
    "webxr",
    "python",
  ],
  category: "tutorial",
  publishedOn: "2026-06-11",
  summary:
    "The topological dual of a triangulated sphere is the spherical Voronoi " +
    "tessellation of its vertices.  Blender 5.1's Dual Mesh node computes it " +
    "in one step — no Delaunay query, no add-on.  Noise-perturbing the ico " +
    "sphere before dualising makes cells organic; Scale Elements creates the " +
    "inter-cell gap; Extrude Mesh (Individual Faces) raises each tile.",
  body: GnDualMeshVoronoiCellSphereBody,
  libraryPath: "blends/geometry-nodes/gn-dual-mesh-voronoi-cell-sphere",
});
